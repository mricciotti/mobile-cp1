import { AuthProvider } from "../types/User";

const COMPATIBLE_PROVIDERS: Record<AuthProvider, AuthProvider[]> = {
    password: ["google", "apple"],
    google: ["password"],
    apple: ["password"],
};

export function canChatWith(currentProvider: AuthProvider, otherProvider: AuthProvider): boolean {
    return COMPATIBLE_PROVIDERS[currentProvider].includes(otherProvider);
}

export function getCompatibleProviders(provider: AuthProvider): AuthProvider[] {
    return COMPATIBLE_PROVIDERS[provider];
}
