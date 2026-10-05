import {
    collection,
    doc,
    getDoc,
    runTransaction,
} from "firebase/firestore";
import { firestore } from "../config/firebase";
import { ChatGroup, NotificationPolicy } from "../types/group";
import { isNotificationPolicy, validateGroupMembers, validateGroupName } from "../utils/groupValidation";
import { syncGroupConversationMembers } from "./apiService";

export type CreateGroupInput = {
    name: string;
    photoUrl: string;
    memberIds: string[];
    memberLimit: number;
    notificationPolicy: NotificationPolicy;
};

export class MembershipSyncError extends Error {
    constructor(public readonly groupId: string) {
        super("O grupo foi salvo, mas a sincronização do acesso falhou. Tente sincronizar novamente.");
        this.name = "MembershipSyncError";
    }
}

function parseGroup(id: string, data: Record<string, unknown>): ChatGroup {
    if (
        typeof data.name !== "string" ||
        typeof data.photoUrl !== "string" ||
        typeof data.ownerId !== "string" ||
        !Array.isArray(data.memberIds) ||
        !data.memberIds.every((memberId) => typeof memberId === "string") ||
        typeof data.memberLimit !== "number" ||
        !isNotificationPolicy(data.notificationPolicy) ||
        typeof data.createdAt !== "number" ||
        typeof data.updatedAt !== "number"
    ) {
        throw new Error("Os dados do grupo estão inválidos.");
    }
    return {
        id,
        name: data.name,
        photoUrl: data.photoUrl,
        ownerId: data.ownerId,
        memberIds: data.memberIds,
        memberLimit: data.memberLimit,
        notificationPolicy: data.notificationPolicy,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
    };
}

async function syncMembershipAfterCommit(groupId: string): Promise<void> {
    try {
        await syncGroupConversationMembers(groupId);
    } catch (error) {
        console.error(error);
        throw new MembershipSyncError(groupId);
    }
}

export async function createGroup(ownerId: string, input: CreateGroupInput): Promise<ChatGroup> {
    const nameError = validateGroupName(input.name);
    if (nameError) throw new Error(nameError);
    const memberIds = Array.from(new Set([...input.memberIds, ownerId]));
    const membersError = validateGroupMembers(ownerId, memberIds, input.memberLimit);
    if (membersError) throw new Error(membersError);
    if (!isNotificationPolicy(input.notificationPolicy)) throw new Error("A política de notificações é inválida.");

    const groupRef = doc(collection(firestore, "groups"));
    const timestamp = Date.now();
    const group: ChatGroup = {
        id: groupRef.id,
        name: input.name.trim(),
        photoUrl: input.photoUrl,
        ownerId,
        memberIds,
        memberLimit: input.memberLimit,
        notificationPolicy: input.notificationPolicy,
        createdAt: timestamp,
        updatedAt: timestamp,
    };

    await runTransaction(firestore, async (transaction) => {
        const snapshot = await transaction.get(groupRef);
        if (snapshot.exists()) throw new Error("Não foi possível reservar um identificador único para o grupo.");
        transaction.set(groupRef, group);
    });
    await syncMembershipAfterCommit(group.id);
    return group;
}

export async function getGroup(groupId: string): Promise<ChatGroup | null> {
    const snapshot = await getDoc(doc(firestore, "groups", groupId));
    return snapshot.exists() ? parseGroup(snapshot.id, snapshot.data()) : null;
}

export async function updateGroup(
    groupId: string,
    actorId: string,
    changes: Pick<Partial<ChatGroup>, "name" | "photoUrl" | "notificationPolicy">
): Promise<ChatGroup> {
    if (changes.name !== undefined) {
        const nameError = validateGroupName(changes.name);
        if (nameError) throw new Error(nameError);
    }
    if (changes.notificationPolicy !== undefined && !isNotificationPolicy(changes.notificationPolicy)) {
        throw new Error("A política de notificações é inválida.");
    }
    const groupRef = doc(firestore, "groups", groupId);
    const timestamp = Date.now();
    return runTransaction(firestore, async (transaction) => {
        const snapshot = await transaction.get(groupRef);
        if (!snapshot.exists()) throw new Error("Grupo não encontrado.");
        const current = parseGroup(snapshot.id, snapshot.data());
        if (current.ownerId !== actorId) throw new Error("Somente o proprietário pode editar o grupo.");
        const updated: ChatGroup = { ...current, ...changes, updatedAt: timestamp };
        transaction.update(groupRef, { ...changes, updatedAt: timestamp });
        return updated;
    });
}

export async function addMember(groupId: string, actorId: string, memberId: string): Promise<ChatGroup> {
    if (!memberId) throw new Error("Escolha um usuário para adicionar.");
    const groupRef = doc(firestore, "groups", groupId);
    const updated = await runTransaction(firestore, async (transaction) => {
        const snapshot = await transaction.get(groupRef);
        if (!snapshot.exists()) throw new Error("Grupo não encontrado.");
        const current = parseGroup(snapshot.id, snapshot.data());
        if (current.ownerId !== actorId) throw new Error("Somente o proprietário pode gerenciar integrantes.");
        if (current.memberIds.includes(memberId)) return current;
        if (current.memberIds.length >= current.memberLimit) throw new Error("O grupo atingiu o limite de integrantes.");
        const memberIds = [...current.memberIds, memberId];
        const validationError = validateGroupMembers(current.ownerId, memberIds, current.memberLimit);
        if (validationError) throw new Error(validationError);
        const next = { memberIds, updatedAt: Date.now() };
        transaction.update(groupRef, next);
        return { ...current, ...next };
    });
    await syncMembershipAfterCommit(groupId);
    return updated;
}

export async function removeMember(groupId: string, actorId: string, memberId: string): Promise<ChatGroup> {
    const groupRef = doc(firestore, "groups", groupId);
    const updated = await runTransaction(firestore, async (transaction) => {
        const snapshot = await transaction.get(groupRef);
        if (!snapshot.exists()) throw new Error("Grupo não encontrado.");
        const current = parseGroup(snapshot.id, snapshot.data());
        if (current.ownerId !== actorId) throw new Error("Somente o proprietário pode gerenciar integrantes.");
        if (memberId === current.ownerId) throw new Error("O proprietário não pode remover a si mesmo.");
        const memberIds = current.memberIds.filter((id) => id !== memberId);
        if (memberIds.length === current.memberIds.length) return current;
        const validationError = validateGroupMembers(current.ownerId, memberIds, current.memberLimit);
        if (validationError) throw new Error(validationError);
        const next = { memberIds, updatedAt: Date.now() };
        transaction.update(groupRef, next);
        return { ...current, ...next };
    });
    await syncMembershipAfterCommit(groupId);
    return updated;
}

export async function updateMemberLimit(groupId: string, actorId: string, memberLimit: number): Promise<ChatGroup> {
    const groupRef = doc(firestore, "groups", groupId);
    return runTransaction(firestore, async (transaction) => {
        const snapshot = await transaction.get(groupRef);
        if (!snapshot.exists()) throw new Error("Grupo não encontrado.");
        const current = parseGroup(snapshot.id, snapshot.data());
        if (current.ownerId !== actorId) throw new Error("Somente o proprietário pode alterar o limite.");
        const validationError = validateGroupMembers(current.ownerId, current.memberIds, memberLimit);
        if (validationError) throw new Error(validationError);
        const updatedAt = Date.now();
        transaction.update(groupRef, { memberLimit, updatedAt });
        return { ...current, memberLimit, updatedAt };
    });
}

export async function syncGroupMembership(groupId: string, actorId: string): Promise<void> {
    const group = await getGroup(groupId);
    if (!group) throw new Error("Grupo não encontrado.");
    if (group.ownerId !== actorId) throw new Error("Somente o proprietário pode sincronizar os integrantes.");
    await syncMembershipAfterCommit(groupId);
}
