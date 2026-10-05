import { get, off, onValue, ref, set } from "firebase/database";
import { database } from "../config/firebase";
import { ChatUser } from "../types/user";

const USERS_PATH = "users";

interface UserRecord {
    name?: string;
    email?: string | null;
    phoneNumber?: string;
    birthDate?: string;
    photoUrl?: string;
    createdAt?: number;
}

function toChatUser(uid: string, record: UserRecord): ChatUser {
    return {
        uid,
        name: record.name ?? "Usuário",
        email: record.email ?? "",
        phoneNumber: record.phoneNumber ?? "",
        birthDate: record.birthDate ?? "",
        photoUrl: record.photoUrl ?? "",
        createdAt: record.createdAt ?? Date.now(),
    };
}

export async function saveUserProfile(user: ChatUser): Promise<void> {
    await set(ref(database, `${USERS_PATH}/${user.uid}`), {
        uid: user.uid,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        birthDate: user.birthDate,
        photoUrl: user.photoUrl,
        createdAt: user.createdAt,
    });
}

export async function getUserProfile(uid: string): Promise<ChatUser | null> {
    const snapshot = await get(ref(database, `${USERS_PATH}/${uid}`));

    if (!snapshot.exists()) {
        return null;
    }

    return toChatUser(uid, snapshot.val() as UserRecord);
}

export function subscribeToContacts(currentUser: ChatUser, callback: (contacts: ChatUser[]) => void): () => void {
    const usersRef = ref(database, USERS_PATH);

    const listener = onValue(usersRef, (snapshot) => {
        const data = snapshot.val() as Record<string, UserRecord> | null;

        if (!data) {
            callback([]);
            return;
        }

        const contacts = Object.entries(data)
            .filter(([uid]) => uid !== currentUser.uid)
            .map(([uid, record]) => toChatUser(uid, record));

        callback(contacts);
    });

    return () => off(usersRef, "value", listener);
}
