import { auth } from "../config/firebase";
import { PrivateUserProfile } from "../types/user";

const configuredApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const API_BASE_URL = configuredApiBaseUrl
    && !configuredApiBaseUrl.includes("your-api.example.com")
    && !configuredApiBaseUrl.includes("seu-projeto.vercel.app")
    ? configuredApiBaseUrl.replace(/\/$/, "")
    : undefined;

type ApiErrorPayload = { message?: unknown };
type MembershipSyncResponse = { synced: true };

export type NotificationRequestResponse = {
    messageId: string;
    recipientCount: number;
    deviceCount: number;
    sent: number;
    skipped: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

async function authenticatedApiRequest(path: string, init: RequestInit = {}): Promise<unknown> {
    if (!API_BASE_URL) throw new Error("A URL da API nÃ£o estÃ¡ configurada.");
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Ã‰ necessÃ¡rio entrar novamente para continuar.");
    const idToken = await currentUser.getIdToken();
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: {
            Accept: "application/json",
            ...(init.body ? { "Content-Type": "application/json" } : {}),
            ...init.headers,
            Authorization: `Bearer ${idToken}`,
        },
    });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
        const message = isRecord(payload) && typeof (payload as ApiErrorPayload).message === "string"
            ? payload.message as string
            : "A API recusou a solicitaÃ§Ã£o.";
        throw new Error(message);
    }
    return payload;
}

export async function getRelatedPrivateProfile(uid: string): Promise<PrivateUserProfile> {
    const payload = await authenticatedApiRequest(`/users/${encodeURIComponent(uid)}/private-profile`);
    if (!isRecord(payload) || typeof payload.email !== "string" || typeof payload.phoneNumber !== "string" || typeof payload.birthDate !== "string") {
        throw new Error("A API retornou um perfil invÃ¡lido.");
    }
    return { email: payload.email, phoneNumber: payload.phoneNumber, birthDate: payload.birthDate };
}

export async function syncGroupConversationMembers(groupId: string): Promise<MembershipSyncResponse> {
    const payload = await authenticatedApiRequest(
        `/groups/${encodeURIComponent(groupId)}/membership/sync`,
        { method: "POST", body: "{}" }
    );
    if (!isRecord(payload) || payload.synced !== true) {
        throw new Error("A API nÃ£o confirmou a sincronizaÃ§Ã£o dos integrantes.");
    }
    return { synced: true };
}

export async function syncDirectConversationMembers(conversationId: string): Promise<MembershipSyncResponse> {
    const payload = await authenticatedApiRequest(
        `/direct-conversations/${encodeURIComponent(conversationId)}/membership/sync`,
        { method: "POST", body: "{}" }
    );
    if (!isRecord(payload) || payload.synced !== true) {
        throw new Error("A API nÃ£o confirmou a sincronizaÃ§Ã£o dos participantes.");
    }
    return { synced: true };
}

export async function notifyMessage(
    conversationId: string,
    messageId: string
): Promise<NotificationRequestResponse> {
    const payload = await authenticatedApiRequest("/notifications/messages", {
        method: "POST",
        body: JSON.stringify({ conversationId, messageId }),
    });
    if (!isRecord(payload)
        || payload.messageId !== messageId
        || typeof payload.recipientCount !== "number"
        || typeof payload.deviceCount !== "number"
        || typeof payload.sent !== "number"
        || typeof payload.skipped !== "number") {
        throw new Error("A API nÃ£o confirmou o processamento da notificaÃ§Ã£o.");
    }
    return {
        messageId,
        recipientCount: payload.recipientCount,
        deviceCount: payload.deviceCount,
        sent: payload.sent,
        skipped: payload.skipped,
    };
}
