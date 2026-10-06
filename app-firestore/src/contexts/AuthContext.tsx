import { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebase";
import { logout as logoutService } from "../services/authService";
import { getOwnCompleteProfile } from "../services/userService";
import { registerPushDevice } from "../services/pushService";
import { PublicUser } from "../types/user";

interface AuthContextValue {
    user: PublicUser | null;
    loading: boolean;
    logout: () => Promise<void>;
    updateUser: (changes: Partial<Pick<PublicUser, "name" | "photoUrl">>) => void;
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

    useEffect(() => {
        if (!user) return;
        registerPushDevice(user.uid).catch((error: unknown) => {
            // Push is optional for authentication; a denied permission must not log the user out.
            console.warn("Push registration unavailable", error);
        });
    }, [user?.uid]);

    const logout = useCallback(async () => {
        await logoutService();
    }, []);

    const updateUser = useCallback((changes: Partial<Pick<PublicUser, "name" | "photoUrl">>) => {
        setUser((currentUser) => currentUser ? { ...currentUser, ...changes } : currentUser);
    }, []);

    const value = useMemo(() => ({ user, loading, logout, updateUser }), [user, loading, logout, updateUser]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
