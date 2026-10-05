import { getAdminServices } from "./firebaseAdmin.js";
import { HttpError } from "./http.js";

function validMemberIds(value: unknown): value is string[] {
  return Array.isArray(value)
    && value.length > 0
    && value.every((uid) => typeof uid === "string" && uid.length > 0)
    && new Set(value).size === value.length;
}

async function replaceMembership(conversationId: string, memberIds: string[]): Promise<void> {
  const membership = Object.fromEntries(memberIds.map((uid) => [uid, true]));
  await getAdminServices().database
    .ref(`conversationMembers/${conversationId}`)
    .set(membership);
}

export async function syncGroupMembers(groupId: string, requesterUid: string): Promise<string[]> {
  const { firestore } = getAdminServices();
  const groupSnapshot = await firestore.collection("groups").doc(groupId).get();
  if (!groupSnapshot.exists) throw new HttpError(404, "Group not found.");
  const group = groupSnapshot.data();
  if (group?.ownerId !== requesterUid) throw new HttpError(403, "Only the group owner can sync membership.");
  if (group.id !== groupId || !validMemberIds(group.memberIds)) {
    throw new HttpError(409, "Group membership data is invalid.");
  }
  await replaceMembership(groupId, group.memberIds);
  return group.memberIds;
}

export async function syncDirectMembers(
  conversationId: string,
  requesterUid: string,
): Promise<string[]> {
  const { firestore } = getAdminServices();
  const directSnapshot = await firestore.collection("directConversations").doc(conversationId).get();
  if (!directSnapshot.exists) throw new HttpError(404, "Direct conversation not found.");
  const direct = directSnapshot.data();
  if (direct?.type !== "direct" || !validMemberIds(direct.participantIds) || direct.participantIds.length !== 2) {
    throw new HttpError(409, "Direct conversation data is invalid.");
  }
  if (direct.id !== conversationId || [...direct.participantIds].sort().join("_") !== conversationId) {
    throw new HttpError(409, "Direct conversation identifier does not match its participants.");
  }
  if (!direct.participantIds.includes(requesterUid)) {
    throw new HttpError(403, "Only a conversation participant can sync membership.");
  }
  await replaceMembership(conversationId, direct.participantIds);
  return direct.participantIds;
}
