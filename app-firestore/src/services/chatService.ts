import { off, onValue, push, ref, serverTimestamp, set } from "firebase/database";
import { database } from "../config/firebase";
import { ChatMessage, MessageTarget } from "../types/chat";
import { notifyMessage } from "./apiService";

interface MessageRecord {
    conversationId?: string;
    senderId?: string;
    text?: string;
    conversationType?: "direct" | "group";
    target?: ChatMessage["target"];
    mentionedUserIds?: string[];
    createdAt?: number;
}

function isCurrentMessage(record: MessageRecord, conversationId: string): boolean {
    const target = record.target;
    return record.conversationId === conversationId
        && (record.conversationType === "direct" || record.conversationType === "group")
        && typeof record.senderId === "string"
        && typeof record.text === "string"
        && Array.isArray(record.mentionedUserIds)
        && record.mentionedUserIds.every((uid) => typeof uid === "string")
        && typeof record.createdAt === "number"
        && (target?.type === "conversation"
            || (target?.type === "member" && typeof target.memberId === "string"));
}

export async function sendMessage(
    conversationId: string,
    senderId: string,
    text: string,
    conversationType: "direct" | "group",
    target: MessageTarget = { type: "conversation" },
    mentionedUserIds: string[] = []
): Promise<string> {
    const trimmedText = text.trim();
    if (!trimmedText) return "";

    const newMessageRef = push(ref(database, `messages/${conversationId}`));
    if (!newMessageRef.key) throw new Error("NÃ£o foi possÃ­vel criar o identificador da mensagem.");

    await set(newMessageRef, {
        conversationId,
        conversationType,
        senderId,
        text: trimmedText,
        target,
        mentionedUserIds,
        createdAt: serverTimestamp(),
    });

    await notifyMessage(conversationId, newMessageRef.key);
    return newMessageRef.key;
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
            .filter(([, record]) => isCurrentMessage(record, conversationId))
            .map(([id, record]) => ({
                id,
                conversationId: record.conversationId as string,
                conversationType: record.conversationType as "direct" | "group",
                senderId: record.senderId as string,
                target: record.target as ChatMessage["target"],
                mentionedUserIds: record.mentionedUserIds as string[],
                text: record.text as string,
                createdAt: record.createdAt as number,
            }))
            .sort((a, b) => a.createdAt - b.createdAt);

        callback(messages);
    });

    return () => off(messagesRef, "value", listener);
}
