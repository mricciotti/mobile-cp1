import { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebase";
import { logout as logoutService } from "../services/authService";
import { getOwnCompleteProfile } from "../services/userService";
import { PublicUser } from "../types/user";

interface AuthContextValue {
    user: PublicUser | null;
    loading: boolean;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getCreatedAt(creationTime: string | undefined): number {
    return creationTime ? Date.parse(creationTime) : Date.now();
}

export function AuthContextProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<PublicUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!firebaseUser) {
                setUser(null);
                setLoading(false);
                return;
            }

            try {
                const profile = await getOwnCompleteProfile(firebaseUser.uid);
                setUser(profile ?? {
                    uid: firebaseUser.uid,
                    name: firebaseUser.displayName ?? "Usuário",
                    photoUrl: firebaseUser.photoURL ?? "",
                    createdAt: getCreatedAt(firebaseUser.metadata.creationTime),
                });
            } catch (error) {
                console.error(error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const logout = useCallback(async () => {
        await logoutService();
    }, []);

    const value = useMemo(() => ({ user, loading, logout }), [user, loading, logout]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
