export type AuthProvider = "password" | "google" | "apple";

export interface ChatUser {
    uid: string;
    name: string;
    email: string | null;
    provider: AuthProvider;
}
