import { get, off, onValue, push, ref, serverTimestamp, set } from "firebase/database";
import { database } from "../config/firebase";
import { ChatMessage, Conversation } from "../types/chat";

interface ConversationRecord {
    participants: [string, string];
    createdAt: number;
}

interface MessageRecord {
    senderId: string;
    receiverId: string;
    text: string;
    createdAt: number;
}

function buildConversationId(uidA: string, uidB: string): string {
    return [uidA, uidB].sort().join("_");
}

export async function findOrCreateConversation(uidA: string, uidB: string): Promise<Conversation> {
    const conversationId = buildConversationId(uidA, uidB);
    const conversationRef = ref(database, `conversations/${conversationId}`);
    const snapshot = await get(conversationRef);

    if (snapshot.exists()) {
        const record = snapshot.val() as ConversationRecord;
        return { id: conversationId, participants: record.participants, createdAt: record.createdAt };
    }

    const participants = [uidA, uidB].sort() as [string, string];
    const createdAt = Date.now();

    await set(conversationRef, { participants, createdAt });

    return { id: conversationId, participants, createdAt };
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
        senderId,
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
                senderId: record.senderId,
                receiverId: record.receiverId,
                text: record.text,
                createdAt: record.createdAt,
            }))
            .sort((a, b) => a.createdAt - b.createdAt);

        callback(messages);
    });

    return () => off(messagesRef, "value", listener);
}
