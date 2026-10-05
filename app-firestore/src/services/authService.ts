import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    User as FirebaseUser,
} from "firebase/auth";
import { auth } from "../config/firebase";
import { CompleteUserProfile, PublicUser } from "../types/user";
import { createProfile, getOwnCompleteProfile, getPublicUser } from "./userService";

function getCreatedAt(firebaseUser: FirebaseUser): number {
    const creationTime = firebaseUser.metadata.creationTime;
    return creationTime ? Date.parse(creationTime) : Date.now();
}

function toPublicUser(firebaseUser: FirebaseUser): PublicUser {
    return {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName ?? firebaseUser.email ?? "Usuário",
        photoUrl: firebaseUser.photoURL ?? "",
        createdAt: getCreatedAt(firebaseUser),
    };
}

export type RegistrationProfile = {
    name: string;
    email: string;
    password: string;
    phoneNumber: string;
    birthDate: string;
    photoUrl: string;
};

export async function registerWithEmail(profile: RegistrationProfile): Promise<CompleteUserProfile> {
    const credential = await createUserWithEmailAndPassword(auth, profile.email, profile.password);
    await updateProfile(credential.user, { displayName: profile.name, photoURL: profile.photoUrl || null });
    return createProfile(credential.user.uid, {
        name: profile.name,
        photoUrl: profile.photoUrl,
        createdAt: getCreatedAt(credential.user),
    }, {
        email: credential.user.email ?? profile.email,
        phoneNumber: profile.phoneNumber,
        birthDate: profile.birthDate,
    });
}

export async function loginWithEmail(email: string, password: string): Promise<CompleteUserProfile> {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const existingProfile = await getOwnCompleteProfile(credential.user.uid);

    if (existingProfile) {
        return existingProfile;
    }

    const publicProfile = await getPublicUser(credential.user.uid);
    return createProfile(credential.user.uid, publicProfile ?? toPublicUser(credential.user), {
        email: credential.user.email ?? email,
        phoneNumber: credential.user.phoneNumber ?? "",
        birthDate: "",
    });
}

export async function logout(): Promise<void> {
    await signOut(auth);
}
