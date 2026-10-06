import { off, onValue, push, ref, serverTimestamp, set } from "firebase/database";
import { doc, updateDoc } from "firebase/firestore";
import { database } from "../config/firebase";
import { firestore } from "../config/firebase";
import { ChatMessage, MessageTarget } from "../types/chat";
import { notifyMessage } from "./apiService";

interface MessageRecord {
    conversationId?: string;
    senderId?: string;
    text?: string;
    conversationType?: "direct" | "group";
    target?: ChatMessage["target"];
    mentionedUserIds?: string[] | null;
    createdAt?: number;
}

function isCurrentMessage(record: MessageRecord, conversationId: string): boolean {
    const target = record.target;
    const mentionedUserIds = record.mentionedUserIds ?? [];
    return record.conversationId === conversationId
        && (record.conversationType === "direct" || record.conversationType === "group")
        && typeof record.senderId === "string"
        && typeof record.text === "string"
        && Array.isArray(mentionedUserIds)
        && mentionedUserIds.every((uid) => typeof uid === "string")
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
    if (!newMessageRef.key) throw new Error("Não foi possível criar o identificador da mensagem.");

    await set(newMessageRef, {
        conversationId,
        conversationType,
        senderId,
        text: trimmedText,
        target,
        mentionedUserIds,
        createdAt: serverTimestamp(),
    });

    try {
        await updateDoc(doc(
            firestore,
            conversationType === "direct" ? "directConversations" : "groups",
            conversationId,
        ), {
            lastMessageText: trimmedText,
            lastMessageAt: Date.now(),
            lastSenderId: senderId,
        });
    } catch (reason) {
        // The RTDB message is already durable. Metadata failure must not make
        // the user resend a message that was successfully saved.
        console.warn("Mensagem salva, mas os metadados da conversa falharam.", reason);
    }

    try {
        await notifyMessage(conversationId, newMessageRef.key);
    } catch (reason) {
        console.warn("Mensagem salva, mas a notificação push falhou.", reason);
    }
    return newMessageRef.key;
}

export function subscribeToMessages(
    conversationId: string,
    callback: (messages: ChatMessage[]) => void,
    onError: (error: Error) => void
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
                mentionedUserIds: record.mentionedUserIds ?? [],
                text: record.text as string,
                createdAt: record.createdAt as number,
            }))
            .sort((a, b) => a.createdAt - b.createdAt);

        callback(messages);
    }, onError);

    return () => off(messagesRef, "value", listener);
}
