import { auth } from "../config/firebase";
import { PrivateUserProfile } from "../types/user";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

type ApiErrorPayload = { message?: unknown };
type MembershipSyncResponse = { synced: true };

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

async function authenticatedApiRequest(path: string, init: RequestInit = {}): Promise<unknown> {
    if (!API_BASE_URL) throw new Error("A URL da API não está configurada.");
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("É necessário entrar novamente para continuar.");
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
            ? (payload as ApiErrorPayload).message as string
            : "A API recusou a solicitação.";
        throw new Error(message);
    }
    return payload;
}

/** Future API boundary: the server verifies a shared direct conversation or group before returning private fields. */
export async function getRelatedPrivateProfile(uid: string): Promise<PrivateUserProfile> {
    const payload = await authenticatedApiRequest(`/users/${encodeURIComponent(uid)}/private-profile`);
    if (!isRecord(payload) || typeof payload.email !== "string" || typeof payload.phoneNumber !== "string" || typeof payload.birthDate !== "string") {
        throw new Error("A API retornou um perfil inválido.");
    }
    return { email: payload.email, phoneNumber: payload.phoneNumber, birthDate: payload.birthDate };
}

/** Future group flow: call only after the Firestore membership transaction commits. */
export async function syncGroupConversationMembers(groupId: string): Promise<MembershipSyncResponse> {
    const payload = await authenticatedApiRequest(
        `/groups/${encodeURIComponent(groupId)}/membership/sync`,
        { method: "POST", body: "{}" }
    );
    if (!isRecord(payload) || payload.synced !== true) {
        throw new Error("A API não confirmou a sincronização dos integrantes.");
    }
    return { synced: true };
}
