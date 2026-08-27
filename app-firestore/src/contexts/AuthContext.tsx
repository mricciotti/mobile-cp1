import { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebase";
import { logout as logoutService } from "../services/authService";
import { getUserProfile } from "../services/userService";
import { AuthProvider as AuthProviderType, ChatUser } from "../types/User";

interface AuthContextValue {
    user: ChatUser | null;
    loading: boolean;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapFirebaseProviderId(providerId: string | undefined): AuthProviderType {
    if (providerId === "google.com") {
        return "google";
    }

    if (providerId === "apple.com") {
        return "apple";
    }

    return "password";
}

export function AuthContextProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<ChatUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!firebaseUser) {
                setUser(null);
                setLoading(false);
                return;
            }

            const provider = mapFirebaseProviderId(firebaseUser.providerData[0]?.providerId);
            const profile = await getUserProfile(firebaseUser.uid);

            setUser(
                profile ?? {
                    uid: firebaseUser.uid,
                    name: firebaseUser.displayName ?? firebaseUser.email ?? "Usuário",
                    email: firebaseUser.email,
                    provider,
                }
            );
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const logout = useCallback(async () => {
        await logoutService();
    }, []);

    const value = useMemo(() => ({ user, loading, logout }), [user, loading, logout]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
