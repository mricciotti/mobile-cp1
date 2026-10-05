import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    User as FirebaseUser,
} from "firebase/auth";
import { auth } from "../config/firebase";
import { ChatUser } from "../types/user";
import { getUserProfile, saveUserProfile } from "./userService";

function getCreatedAt(firebaseUser: FirebaseUser): number {
    const creationTime = firebaseUser.metadata.creationTime;
    return creationTime ? Date.parse(creationTime) : Date.now();
}

function toChatUser(firebaseUser: FirebaseUser): ChatUser {
    return {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName ?? firebaseUser.email ?? "Usuário",
        email: firebaseUser.email ?? "",
        phoneNumber: firebaseUser.phoneNumber ?? "",
        birthDate: "",
        photoUrl: firebaseUser.photoURL ?? "",
        createdAt: getCreatedAt(firebaseUser),
    };
}

export async function registerWithEmail(name: string, email: string, password: string): Promise<ChatUser> {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });

    const chatUser: ChatUser = {
        ...toChatUser(credential.user),
        name,
    };

    await saveUserProfile(chatUser);
    return chatUser;
}

export async function loginWithEmail(email: string, password: string): Promise<ChatUser> {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const existingProfile = await getUserProfile(credential.user.uid);

    if (existingProfile) {
        return existingProfile;
    }

    const chatUser = toChatUser(credential.user);
    await saveUserProfile(chatUser);
    return chatUser;
}

export async function logout(): Promise<void> {
    await signOut(auth);
}
