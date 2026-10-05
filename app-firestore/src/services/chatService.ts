import { get, off, onValue, push, ref, serverTimestamp, set } from "firebase/database";
import { database } from "../config/firebase";
import { ChatMessage, DirectConversation } from "../types/chat";
import { buildConversationId } from "../utils/conversationId";

interface ConversationRecord {
    participants?: [string, string];
    participantIds?: [string, string];
    createdAt?: number;
}

interface MessageRecord {
    senderId?: string;
    receiverId?: string;
    text?: string;
    conversationType?: "direct" | "group";
    target?: ChatMessage["target"];
    mentionedUserIds?: string[];
    createdAt?: number;
}

export async function findOrCreateConversation(uidA: string, uidB: string): Promise<DirectConversation> {
    if (uidA === uidB) throw new Error("Não é possível conversar consigo mesmo.");
    const conversationId = buildConversationId(uidA, uidB);
    const conversationRef = ref(database, `conversations/${conversationId}`);
    const snapshot = await get(conversationRef);

    if (snapshot.exists()) {
        const record = snapshot.val() as ConversationRecord;
        const participantIds = record.participantIds ?? record.participants;
        if (!participantIds) throw new Error("Conversa inválida.");
        return { id: conversationId, type: "direct", participantIds, createdAt: record.createdAt ?? Date.now() };
    }

    const participants = [uidA, uidB].sort() as [string, string];
    const createdAt = Date.now();

    // participants is kept temporarily for the CP1 chat data already in RTDB.
    await set(conversationRef, { type: "direct", participantIds: participants, participants, createdAt });

    return { id: conversationId, type: "direct", participantIds: participants, createdAt };
}

export async function sendMessage(
    conversationId: string,
    senderId: string,
    receiverId: string,
    text: string
): Promise<void> {
    const trimmedText = text.trim();

    if (!trimmedText) {
        return;
    }

    const newMessageRef = push(ref(database, `messages/${conversationId}`));

    await set(newMessageRef, {
        conversationId,
        conversationType: "direct",
        senderId,
        target: { type: "conversation" },
        mentionedUserIds: [],
        // CP1 RTDB rules still expect this field during the compatibility period.
        receiverId,
        text: trimmedText,
        createdAt: serverTimestamp(),
    });
}

export function subscribeToMessages(
    conversationId: string,
    callback: (messages: ChatMessage[]) => void
): () => void {
    const messagesRef = ref(database, `messages/${conversationId}`);

    const listener = onValue(messagesRef, (snapshot) => {
        const data = snapshot.val() as Record<string, MessageRecord> | null;

        if (!data) {
            callback([]);
            return;
        }

        const messages = Object.entries(data)
            .map(([id, record]) => ({
                id,
                conversationId,
                conversationType: record.conversationType ?? "direct",
                senderId: record.senderId ?? "",
                target: record.target ?? { type: "conversation" },
                mentionedUserIds: record.mentionedUserIds ?? [],
                text: record.text ?? "",
                createdAt: record.createdAt ?? 0,
            }))
            .sort((a, b) => a.createdAt - b.createdAt);

        callback(messages);
    });

    return () => off(messagesRef, "value", listener);
}
