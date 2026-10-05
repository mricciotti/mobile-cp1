import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminServices } from "./firebaseAdmin.js";
import { HttpError } from "./http.js";

type MessageTarget = { type: "conversation" } | { type: "member"; memberId: string };
type StoredMessage = {
  id?: string;
  conversationId?: string;
  conversationType?: "direct" | "group";
  senderId?: string;
  text?: string;
  target?: MessageTarget;
  mentionedUserIds?: string[];
  createdAt?: number;
};
type Device = { id: string; token: string; ref: FirebaseFirestore.DocumentReference };

const expoTokenPattern = /^(Expo|Exponent)PushToken\[[^\]]+\]$/;
const deliveryLeaseMs = 60_000;

function parseMessage(value: unknown, messageId: string, conversationId: string): StoredMessage {
  if (!value || typeof value !== "object") throw new HttpError(404, "Message not found.");
  const message = value as StoredMessage;
  const validTarget = message.target?.type === "conversation"
    || (message.target?.type === "member" && typeof message.target.memberId === "string");
  if (
    message.conversationId !== conversationId
    || (message.conversationType !== "direct" && message.conversationType !== "group")
    || typeof message.senderId !== "string"
    || typeof message.text !== "string"
    || !validTarget
    || !Array.isArray(message.mentionedUserIds)
    || !message.mentionedUserIds.every((uid) => typeof uid === "string")
    || new Set(message.mentionedUserIds).size !== message.mentionedUserIds.length
    || typeof message.createdAt !== "number"
  ) {
    throw new HttpError(409, "Stored message data is invalid.");
  }
  return { ...message, id: messageId };
}

function deriveRecipientIds(message: StoredMessage, memberIds: string[], policy?: string): string[] {
  const senderId = message.senderId as string;
  const target = message.target as MessageTarget;
  if (target.type === "member" && !memberIds.includes(target.memberId)) {
    throw new HttpError(409, "Message target is not a conversation member.");
  }

  let recipients: string[];
  if (message.conversationType === "direct") {
    recipients = target.type === "member"
      ? [target.memberId]
      : memberIds;
  } else {
    const mentions = message.mentionedUserIds as string[];
    if (mentions.some((uid) => !memberIds.includes(uid))) {
      throw new HttpError(409, "Message mentions a user outside the group.");
    }
    switch (policy) {
      case "all_group_messages":
        recipients = target.type === "member" ? [target.memberId] : memberIds;
        break;
      case "mentioned_members":
        recipients = mentions;
        break;
      case "direct_messages_only":
        recipients = target.type === "member" ? [target.memberId] : [];
        break;
      case "disabled":
        recipients = [];
        break;
      default:
        throw new HttpError(409, "Group notification policy is invalid.");
    }
  }
  return [...new Set(recipients)].filter((uid) => uid !== senderId);
}

async function getDevices(userIds: string[]): Promise<Device[]> {
  const { firestore } = getAdminServices();
  const deviceGroups = await Promise.all(userIds.map(async (uid) => {
    const snapshot = await firestore.collection("users").doc(uid).collection("devices").get();
    return snapshot.docs.flatMap((device) => {
      const data = device.data();
      const token = typeof data.expoPushToken === "string"
        ? data.expoPushToken
        : typeof data.token === "string" ? data.token : "";
      if (!expoTokenPattern.test(token) || data.enabled === false || data.active === false) return [];
      return [{ id: device.id, token, ref: device.ref }];
    });
  }));
  return deviceGroups.flat();
}

async function claimDelivery(messageId: string, token: string): Promise<FirebaseFirestore.DocumentReference | null> {
  const { firestore } = getAdminServices();
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const deliveryRef = firestore.collection("notificationDeliveries")
    .doc(messageId).collection("devices").doc(tokenHash);
  const claimed = await firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(deliveryRef);
    const data = snapshot.data();
    const now = Date.now();
    if (data?.status === "sent") return false;
    if (data?.status === "processing" && typeof data.leaseUntil === "number" && data.leaseUntil > now) return false;
    transaction.set(deliveryRef, {
      status: "processing",
      leaseUntil: now + deliveryLeaseMs,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return true;
  });
  return claimed ? deliveryRef : null;
}

async function sendExpoPush(
  device: Device,
  title: string,
  body: string,
  message: StoredMessage,
): Promise<{ ticketId?: string }> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (process.env.EXPO_ACCESS_TOKEN) headers.authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers,
    signal: AbortSignal.timeout(10_000),
    body: JSON.stringify({
      to: device.token,
      title,
      body,
      sound: "default",
      data: {
        messageId: message.id,
        conversationId: message.conversationId,
        conversationType: message.conversationType,
      },
    }),
  });
  const result = await response.json() as {
    data?: { status?: string; id?: string; message?: string; details?: { error?: string } } | Array<{
      status?: string; id?: string; message?: string; details?: { error?: string }
    }>;
    errors?: unknown[];
  };
  if (!response.ok) throw new Error(`Expo Push Service returned HTTP ${response.status}.`);
  const ticket = Array.isArray(result.data) ? result.data[0] : result.data;
  if (ticket?.status !== "ok") {
    if (ticket?.details?.error === "DeviceNotRegistered") {
      await device.ref.set({ enabled: false, disabledAt: FieldValue.serverTimestamp() }, { merge: true });
    }
    throw new Error(ticket?.message ?? "Expo Push Service rejected a notification.");
  }
  return { ticketId: ticket.id };
}

export async function notifyMessage(
  requesterUid: string,
  conversationId: string,
  messageId: string,
): Promise<{ recipientCount: number; deviceCount: number; sent: number; skipped: number }> {
  const { database, firestore } = getAdminServices();
  const messageSnapshot = await database.ref(`messages/${conversationId}/${messageId}`).get();
  if (!messageSnapshot.exists()) throw new HttpError(404, "Message not found.");
  const message = parseMessage(messageSnapshot.val(), messageId, conversationId);
  if (message.senderId !== requesterUid) throw new HttpError(403, "Only the message sender can request delivery.");

  let memberIds: string[];
  let policy: string | undefined;
  let title = "New message";
  if (message.conversationType === "direct") {
    const direct = await firestore.collection("directConversations").doc(conversationId).get();
    const data = direct.data();
    if (!direct.exists || data?.type !== "direct" || !Array.isArray(data.participantIds)
      || data.participantIds.length !== 2 || new Set(data.participantIds).size !== 2
      || !data.participantIds.every((uid: unknown) => typeof uid === "string")) {
      throw new HttpError(404, "Direct conversation not found.");
    }
    memberIds = data.participantIds as string[];
    if ([...memberIds].sort().join("_") !== conversationId) {
      throw new HttpError(409, "Direct conversation identifier does not match its participants.");
    }
    if (!memberIds.includes(requesterUid)) throw new HttpError(403, "Sender is not a conversation participant.");
  } else {
    const group = await firestore.collection("groups").doc(conversationId).get();
    const data = group.data();
    if (!group.exists || !Array.isArray(data?.memberIds)
      || !data.memberIds.every((uid: unknown) => typeof uid === "string")
      || new Set(data.memberIds).size !== data.memberIds.length) {
      throw new HttpError(404, "Group not found.");
    }
    memberIds = data.memberIds as string[];
    policy = typeof data.notificationPolicy === "string" ? data.notificationPolicy : undefined;
    if (!memberIds.includes(requesterUid)) throw new HttpError(403, "Sender is not a group member.");
    if (typeof data.name === "string" && data.name) title = data.name;
  }

  if ((message.mentionedUserIds as string[]).some((uid) => !memberIds.includes(uid))) {
    throw new HttpError(409, "Message mentions a user outside the conversation.");
  }

  const recipients = deriveRecipientIds(message, memberIds, policy);
  if (recipients.length === 0) return { recipientCount: 0, deviceCount: 0, sent: 0, skipped: 0 };
  const [devices, senderSnapshot] = await Promise.all([
    getDevices(recipients),
    firestore.collection("users").doc(requesterUid).get(),
  ]);
  const senderName = senderSnapshot.get("name");
  const notificationTitle = message.conversationType === "group"
    ? title
    : (typeof senderName === "string" && senderName ? senderName : "New message");
  const body = (message.text as string).trim().slice(0, 180) || "You have a new message.";

  let sent = 0;
  let skipped = 0;
  const deliveryResults = await Promise.allSettled(devices.map(async (device) => {
    const deliveryRef = await claimDelivery(messageId, device.token);
    if (!deliveryRef) {
      skipped += 1;
      return;
    }
    try {
      const result = await sendExpoPush(device, notificationTitle, body, message);
      await deliveryRef.set({
        status: "sent",
        ticketId: result.ticketId ?? null,
        sentAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      sent += 1;
    } catch (error) {
      await deliveryRef.set({
        status: "failed",
        error: error instanceof Error ? error.message.slice(0, 300) : "Unknown delivery error.",
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      throw error;
    }
  }));

  const failed = deliveryResults.filter((result) => result.status === "rejected").length;
  if (failed > 0) throw new HttpError(502, `Push delivery failed for ${failed} device(s); retry is safe.`);
  await firestore.collection("notificationDeliveries").doc(messageId).set({
    conversationId,
    senderId: requesterUid,
    status: "complete",
    deviceCount: devices.length,
    updatedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  return { recipientCount: recipients.length, deviceCount: devices.length, sent, skipped };
}
