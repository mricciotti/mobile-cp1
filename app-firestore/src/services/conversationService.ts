import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    runTransaction,
    where,
} from "firebase/firestore";
import { get as getRealtimeValue, ref } from "firebase/database";
import { firestore } from "../config/firebase";
import { database } from "../config/firebase";
import { DirectConversation, ChatMessage } from "../types/chat";
import { PublicUser } from "../types/user";
import { buildConversationId } from "../utils/conversationId";
import { syncDirectConversationMembers } from "./apiService";
import { getPublicUser } from "./userService";

type ConversationMetadata = {
    lastMessageText: string;
    lastMessageAt: number;
    lastSenderId: string;
    lastReadAt: number;
    isUnread: boolean;
};

type DirectConversationListEntry = ConversationMetadata & {
    id: string;
    type: "direct";
    participantIds: [string, string];
    otherParticipantId: string;
    otherParticipant: PublicUser;
    createdAt: number;
};

type GroupConversationListEntry = ConversationMetadata & {
    id: string;
    type: "group";
    name: string;
    photoUrl: string;
    ownerId: string;
    memberIds: string[];
    createdAt: number;
};

export type ConversationListEntry =
    | DirectConversationListEntry
    | GroupConversationListEntry;

type RealtimeMessageRecord = {
    conversationId?: string;
    conversationType?: "direct" | "group";
    senderId?: string;
    text?: string;
    target?: ChatMessage["target"];
    mentionedUserIds?: string[] | null;
    createdAt?: number;
};

function timestampValue(value: unknown): number {
    if (typeof value === "number") return value;
    if (value && typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function") {
        return value.toMillis();
    }
    return 0;
}

function parseMetadata(data: Record<string, unknown>, fallbackCreatedAt: number): Omit<ConversationMetadata, "isUnread"> {
    return {
        lastMessageText: typeof data.lastMessageText === "string" ? data.lastMessageText : "",
        lastMessageAt: timestampValue(data.lastMessageAt) || fallbackCreatedAt,
        lastSenderId: typeof data.lastSenderId === "string" ? data.lastSenderId : "",
        lastReadAt: 0,
    };
}

function isValidRealtimeMessage(record: RealtimeMessageRecord, conversationId: string): boolean {
    const mentionedUserIds = record.mentionedUserIds ?? [];
    const target = record.target;
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

async function getLatestMessage(conversationId: string): Promise<Pick<ConversationMetadata, "lastMessageText" | "lastMessageAt" | "lastSenderId"> | null> {
    const snapshot = await getRealtimeValue(ref(database, `messages/${conversationId}`));
    const data = snapshot.val() as Record<string, RealtimeMessageRecord> | null;
    if (!data) return null;

    const latest = Object.values(data)
        .filter((record) => isValidRealtimeMessage(record, conversationId))
        .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
        .at(-1);
    if (!latest || typeof latest.text !== "string" || typeof latest.senderId !== "string" || typeof latest.createdAt !== "number") {
        return null;
    }
    return {
        lastMessageText: latest.text,
        lastMessageAt: latest.createdAt,
        lastSenderId: latest.senderId,
    };
}

async function withMessageFallback(
    conversationId: string,
    metadata: Omit<ConversationMetadata, "isUnread">,
): Promise<Omit<ConversationMetadata, "isUnread">> {
    if (metadata.lastMessageText && metadata.lastMessageAt) return metadata;
    try {
        const latest = await getLatestMessage(conversationId);
        return latest ? { ...metadata, ...latest } : metadata;
    } catch (reason) {
        console.warn("N\u00e3o foi poss\u00edvel carregar a pr\u00e9via da conversa.", reason);
        return metadata;
    }
}

export async function getDirectConversation(conversationId: string): Promise<DirectConversation | null> {
    const snapshot = await getDoc(doc(firestore, "directConversations", conversationId));
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    const participantIds = data.participantIds;
    if (data.type !== "direct" || !Array.isArray(participantIds) || participantIds.length !== 2
        || !participantIds.every((id: unknown) => typeof id === "string")) return null;
    return {
        id: snapshot.id,
        type: "direct",
        participantIds: participantIds as [string, string],
        createdAt: typeof data.createdAt === "number" ? data.createdAt : 0,
    };
}

export async function getOrCreateDirectConversation(uidA: string, uidB: string): Promise<DirectConversation> {
    if (!uidA || !uidB || uidA === uidB) throw new Error("Escolha outra pessoa para iniciar uma conversa.");
    const participantIds = [uidA, uidB].sort() as [string, string];
    const conversationId = buildConversationId(uidA, uidB);
    const conversationRef = doc(firestore, "directConversations", conversationId);
    const createdAt = Date.now();

    const conversation = await runTransaction(firestore, async (transaction) => {
        const snapshot = await transaction.get(conversationRef);
        if (snapshot.exists()) {
            const data = snapshot.data();
            const storedParticipants = data.participantIds;
            if (
                data.type !== "direct" ||
                !Array.isArray(storedParticipants) ||
                storedParticipants.length !== 2 ||
                storedParticipants[0] !== participantIds[0] ||
                storedParticipants[1] !== participantIds[1]
            ) {
                throw new Error("Os dados da conversa individual estão inconsistentes.");
            }
            return {
                id: conversationId,
                type: "direct" as const,
                participantIds,
                createdAt: typeof data.createdAt === "number" ? data.createdAt : createdAt,
            };
        }

        const newConversation: DirectConversation = {
            id: conversationId,
            type: "direct",
            participantIds,
            createdAt,
        };
        transaction.set(conversationRef, newConversation);
        return newConversation;
    });

    // Firestore is authoritative. RTDB is updated only through the authenticated API.
    await syncDirectConversationMembers(conversation.id);
    return conversation;
}

export async function listUserConversations(uid: string): Promise<ConversationListEntry[]> {
    const [directSnapshot, groupSnapshot, readStateSnapshot] = await Promise.all([
        getDocs(query(collection(firestore, "directConversations"), where("participantIds", "array-contains", uid))),
        getDocs(query(collection(firestore, "groups"), where("memberIds", "array-contains", uid))),
        getDocs(collection(firestore, "users", uid, "conversationState")),
    ]);
    const lastReadByConversation = new Map(
        readStateSnapshot.docs.map((snapshot) => [snapshot.id, timestampValue(snapshot.data().lastReadAt)]),
    );

    const directEntries = await Promise.all(directSnapshot.docs.flatMap(async (snapshot) => {
        const data = snapshot.data();
        const participants = data.participantIds;
        if (data.type !== "direct" || !Array.isArray(participants) || participants.length !== 2) return [];
        const participantIds = participants.filter((id): id is string => typeof id === "string") as [string, string];
        if (participantIds.length !== 2 || !participantIds.includes(uid)) return [];
        const otherParticipantId = participantIds[0] === uid ? participantIds[1] : participantIds[0];
        const [profile, metadata] = await Promise.all([
            getPublicUser(otherParticipantId),
            withMessageFallback(snapshot.id, parseMetadata(data, typeof data.createdAt === "number" ? data.createdAt : 0)),
        ]);
        const lastReadAt = lastReadByConversation.get(snapshot.id) ?? 0;
        return [{
            id: snapshot.id,
            type: "direct" as const,
            participantIds,
            otherParticipantId,
            otherParticipant: profile ?? { uid: otherParticipantId, name: "Usu\u00e1rio", photoUrl: "", createdAt: 0 },
            createdAt: typeof data.createdAt === "number" ? data.createdAt : 0,
            ...metadata,
            lastReadAt,
            isUnread: metadata.lastMessageAt > lastReadAt,
        }];
    }));

    const groupEntries = await Promise.all(groupSnapshot.docs.flatMap(async (snapshot) => {
        const data = snapshot.data();
        const memberIds = Array.isArray(data.memberIds)
            ? data.memberIds.filter((id): id is string => typeof id === "string")
            : [];
        if (!memberIds.includes(uid)) return [];
        const metadata = await withMessageFallback(snapshot.id, parseMetadata(data, typeof data.createdAt === "number" ? data.createdAt : 0));
        const lastReadAt = lastReadByConversation.get(snapshot.id) ?? 0;
        return [{
            id: snapshot.id,
            type: "group" as const,
            name: typeof data.name === "string" ? data.name : "Grupo",
            photoUrl: typeof data.photoUrl === "string" ? data.photoUrl : "",
            ownerId: typeof data.ownerId === "string" ? data.ownerId : "",
            memberIds,
            createdAt: typeof data.createdAt === "number" ? data.createdAt : 0,
            ...metadata,
            lastReadAt,
            isUnread: metadata.lastMessageAt > lastReadAt,
        }];
    }));

    return [...directEntries.flat(), ...groupEntries.flat()].sort((a, b) => {
        const aTime = a.lastMessageAt || a.createdAt;
        const bTime = b.lastMessageAt || b.createdAt;
        return bTime - aTime;
    });
}
