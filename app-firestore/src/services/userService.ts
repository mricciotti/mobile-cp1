import {
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    setDoc,
    updateDoc,
    writeBatch,
} from "firebase/firestore";
import { auth, firestore } from "../config/firebase";
import { CompleteUserProfile, PrivateUserProfile, PublicUser } from "../types/user";

type PublicProfileInput = Omit<PublicUser, "uid">;

export async function createProfile(
    uid: string,
    publicProfile: PublicProfileInput,
    privateProfile: PrivateUserProfile
): Promise<CompleteUserProfile> {
    const profile: PublicUser = { ...publicProfile, uid };
    const publicFields = { name: profile.name, photoUrl: profile.photoUrl, createdAt: profile.createdAt };
    const batch = writeBatch(firestore);
    batch.set(doc(firestore, "users", uid), publicFields);
    batch.set(doc(firestore, "users", uid, "private", "profile"), privateProfile);
    batch.set(doc(firestore, "publicUsers", uid), profile);
    await batch.commit();
    return { ...profile, ...privateProfile };
}

export async function getPublicUser(uid: string): Promise<PublicUser | null> {
    const snapshot = await getDoc(doc(firestore, "users", uid));
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    return {
        uid: snapshot.id,
        name: typeof data.name === "string" ? data.name : "Usuário",
        photoUrl: typeof data.photoUrl === "string" ? data.photoUrl : "",
        createdAt: typeof data.createdAt === "number" ? data.createdAt : 0,
    };
}

export async function getOwnPrivateProfile(uid: string): Promise<PrivateUserProfile | null> {
    if (!auth.currentUser || auth.currentUser.uid !== uid) {
        throw new Error("O cliente só pode ler o próprio perfil privado.");
    }
    const snapshot = await getDoc(doc(firestore, "users", uid, "private", "profile"));
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    return {
        email: typeof data.email === "string" ? data.email : "",
        phoneNumber: typeof data.phoneNumber === "string" ? data.phoneNumber : "",
        birthDate: typeof data.birthDate === "string" ? data.birthDate : "",
    };
}

export async function getOwnCompleteProfile(uid: string): Promise<CompleteUserProfile | null> {
    if (!auth.currentUser || auth.currentUser.uid !== uid) {
        throw new Error("O cliente só pode ler o próprio perfil completo.");
    }
    const publicSnapshot = await getDoc(doc(firestore, "users", uid));
    if (!publicSnapshot.exists()) return null;
    const data = publicSnapshot.data();
    const publicUser: PublicUser = {
        uid,
        name: typeof data.name === "string" ? data.name : "Usuário",
        photoUrl: typeof data.photoUrl === "string" ? data.photoUrl : "",
        createdAt: typeof data.createdAt === "number" ? data.createdAt : Date.now(),
    };
    const privateSnapshot = await getDoc(doc(firestore, "users", uid, "private", "profile"));
    const privateData = privateSnapshot.data() ?? data;
    const privateProfile: PrivateUserProfile = {
        email: typeof privateData.email === "string" ? privateData.email : auth.currentUser.email ?? "",
        phoneNumber: typeof privateData.phoneNumber === "string" ? privateData.phoneNumber : auth.currentUser.phoneNumber ?? "",
        birthDate: typeof privateData.birthDate === "string" ? privateData.birthDate : "",
    };
    const legacyPublicKeys = Object.keys(data).some((key) => !["name", "photoUrl", "createdAt"].includes(key));
    const batch = writeBatch(firestore);
    if (legacyPublicKeys) {
        // One-time owner-only migration from the earlier mixed users/{uid} shape.
        batch.set(doc(firestore, "users", uid), {
            name: publicUser.name,
            photoUrl: publicUser.photoUrl,
            createdAt: publicUser.createdAt,
        });
    }
    if (!privateSnapshot.exists()) batch.set(doc(firestore, "users", uid, "private", "profile"), privateProfile);
    batch.set(doc(firestore, "publicUsers", uid), publicUser);
    await batch.commit();
    return { ...publicUser, ...privateProfile };
}

export async function searchUsers(searchTerm = ""): Promise<PublicUser[]> {
    const normalized = searchTerm.trim().toLocaleLowerCase();
    const users = await getDocs(query(collection(firestore, "publicUsers"), orderBy("name")));
    return users.docs.map((entry) => {
        const data = entry.data();
        return {
            uid: entry.id,
            name: typeof data.name === "string" ? data.name : "Usuário",
            photoUrl: typeof data.photoUrl === "string" ? data.photoUrl : "",
            createdAt: typeof data.createdAt === "number" ? data.createdAt : 0,
        };
    }).filter((user) => !normalized || user.name.toLocaleLowerCase().includes(normalized));
}

export async function updateOwnProfile(uid: string, changes: {
    public?: Partial<Pick<PublicUser, "name" | "photoUrl">>;
    private?: Partial<PrivateUserProfile>;
}): Promise<void> {
    if (!auth.currentUser || auth.currentUser.uid !== uid) {
        throw new Error("O cliente só pode atualizar o próprio perfil.");
    }
    const batch = writeBatch(firestore);
    if (changes.public && Object.keys(changes.public).length) {
        batch.update(doc(firestore, "users", uid), changes.public);
        batch.update(doc(firestore, "publicUsers", uid), changes.public);
    }
    if (changes.private && Object.keys(changes.private).length) {
        batch.update(doc(firestore, "users", uid, "private", "profile"), changes.private);
    }
    await batch.commit();
}

export async function markConversationRead(uid: string, conversationId: string): Promise<void> {
    if (!auth.currentUser || auth.currentUser.uid !== uid) {
        throw new Error("O cliente s\u00f3 pode atualizar o pr\u00f3prio estado de leitura.");
    }
    await setDoc(doc(firestore, "users", uid, "conversationState", conversationId), {
        lastReadAt: Date.now(),
    }, { merge: true });
}
