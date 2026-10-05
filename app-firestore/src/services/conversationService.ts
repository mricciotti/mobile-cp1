import {
    collection,
    doc,
    getDocs,
    query,
    runTransaction,
    where,
} from "firebase/firestore";
import { firestore } from "../config/firebase";
import { DirectConversation } from "../types/chat";
import { buildConversationId } from "../utils/conversationId";
import { syncDirectConversationMembers } from "./apiService";

export type ConversationListEntry =
    | {
        id: string;
        type: "direct";
        participantIds: [string, string];
        otherParticipantId: string;
        createdAt: number;
    }
    | {
        id: string;
        type: "group";
        name: string;
        photoUrl: string;
        memberIds: string[];
        createdAt: number;
    };

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
    const [directSnapshot, groupSnapshot] = await Promise.all([
        getDocs(query(collection(firestore, "directConversations"), where("participantIds", "array-contains", uid))),
        getDocs(query(collection(firestore, "groups"), where("memberIds", "array-contains", uid))),
    ]);

    const directEntries: ConversationListEntry[] = directSnapshot.docs.flatMap((snapshot) => {
        const data = snapshot.data();
        const participants = data.participantIds;
        if (data.type !== "direct" || !Array.isArray(participants) || participants.length !== 2) return [];
        const participantIds = participants.filter((id): id is string => typeof id === "string") as [string, string];
        if (participantIds.length !== 2 || !participantIds.includes(uid)) return [];
        return [{
            id: snapshot.id,
            type: "direct",
            participantIds,
            otherParticipantId: participantIds[0] === uid ? participantIds[1] : participantIds[0],
            createdAt: typeof data.createdAt === "number" ? data.createdAt : 0,
        }];
    });

    const groupEntries: ConversationListEntry[] = groupSnapshot.docs.flatMap((snapshot) => {
        const data = snapshot.data();
        const memberIds = Array.isArray(data.memberIds)
            ? data.memberIds.filter((id): id is string => typeof id === "string")
            : [];
        if (!memberIds.includes(uid)) return [];
        return [{
            id: snapshot.id,
            type: "group",
            name: typeof data.name === "string" ? data.name : "Grupo",
            photoUrl: typeof data.photoUrl === "string" ? data.photoUrl : "",
            memberIds,
            createdAt: typeof data.createdAt === "number" ? data.createdAt : 0,
        }];
    });

    return [...directEntries, ...groupEntries].sort((a, b) => b.createdAt - a.createdAt);
}
