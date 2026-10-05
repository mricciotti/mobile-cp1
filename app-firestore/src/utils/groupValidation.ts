import { NotificationPolicy } from "../types/group";

const POLICIES: readonly NotificationPolicy[] = [
    "all_group_messages",
    "mentioned_members",
    "direct_messages_only",
    "disabled",
];

export function validateGroupName(name: string): string | null {
    const normalized = name.trim();
    if (!normalized) return "Informe o nome do grupo.";
    if (normalized.length > 60) return "O nome do grupo deve ter até 60 caracteres.";
    return null;
}

export function validateGroupMembers(ownerId: string, memberIds: string[], memberLimit: number): string | null {
    const uniqueMemberIds = new Set(memberIds);
    if (!ownerId || !uniqueMemberIds.has(ownerId)) return "O proprietário precisa fazer parte do grupo.";
    if (uniqueMemberIds.size < 2) return "Um grupo precisa ter pelo menos duas pessoas.";
    if (!Number.isInteger(memberLimit) || memberLimit < 2) return "O limite do grupo deve ser um número inteiro a partir de 2.";
    if (uniqueMemberIds.size > memberLimit) return "A quantidade de integrantes excede o limite do grupo.";
    return null;
}

export function isNotificationPolicy(value: unknown): value is NotificationPolicy {
    return typeof value === "string" && POLICIES.includes(value as NotificationPolicy);
}
