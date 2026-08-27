import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    OAuthProvider,
    signInWithCredential,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    User as FirebaseUser,
} from "firebase/auth";
import * as AppleAuthentication from "expo-apple-authentication";
import {
    GoogleSignin,
    isErrorWithCode,
    isSuccessResponse,
    statusCodes,
} from "@react-native-google-signin/google-signin";
import { auth } from "../config/firebase";
import { saveUserProfile } from "./userService";
import { AuthProvider, ChatUser } from "../types/User";

GoogleSignin.configure({
    webClientId: "465066727567-thn2d81abjrtr8eth7vcjbbo37at4cc1.apps.googleusercontent.com",
});

function toChatUser(firebaseUser: FirebaseUser, provider: AuthProvider): ChatUser {
    return {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName ?? firebaseUser.email ?? "Usuário",
        email: firebaseUser.email,
        provider,
    };
}

export async function registerWithEmail(name: string, email: string, password: string): Promise<ChatUser> {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });

    const chatUser: ChatUser = {
        uid: credential.user.uid,
        name,
        email: credential.user.email,
        provider: "password",
    };

    await saveUserProfile(chatUser);
    return chatUser;
}

export async function loginWithEmail(email: string, password: string): Promise<ChatUser> {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const chatUser = toChatUser(credential.user, "password");

    await saveUserProfile(chatUser);
    return chatUser;
}

export async function loginWithGoogle(): Promise<ChatUser> {
    try {
        await GoogleSignin.hasPlayServices();
        const response = await GoogleSignin.signIn();

        if (!isSuccessResponse(response)) {
            throw new Error("Login com Google cancelado.");
        }

        const { idToken, user: googleUser } = response.data;

        if (!idToken) {
            throw new Error("Não foi possível obter o token do Google.");
        }

        const credential = GoogleAuthProvider.credential(idToken);
        const firebaseCredential = await signInWithCredential(auth, credential);

        const chatUser: ChatUser = {
            uid: firebaseCredential.user.uid,
            name: googleUser.name ?? firebaseCredential.user.displayName ?? "Usuário Google",
            email: firebaseCredential.user.email,
            provider: "google",
        };

        await saveUserProfile(chatUser);
        return chatUser;
    } catch (error) {
        if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
            throw new Error("Login com Google cancelado.");
        }

        throw error;
    }
}

export async function loginWithApple(): Promise<ChatUser> {
    const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
    });

    if (!appleCredential.identityToken) {
        throw new Error("Não foi possível obter as credenciais da Apple.");
    }

    const provider = new OAuthProvider("apple.com");
    const credential = provider.credential({ idToken: appleCredential.identityToken });
    const firebaseCredential = await signInWithCredential(auth, credential);

    const fullName = [appleCredential.fullName?.givenName, appleCredential.fullName?.familyName]
        .filter(Boolean)
        .join(" ");

    const chatUser: ChatUser = {
        uid: firebaseCredential.user.uid,
        name: fullName || firebaseCredential.user.displayName || "Usuário Apple",
        email: appleCredential.email ?? firebaseCredential.user.email,
        provider: "apple",
    };

    await saveUserProfile(chatUser);
    return chatUser;
}

export async function logout(): Promise<void> {
    try {
        await GoogleSignin.signOut();
    } catch {
        // usuário pode não ter entrado com Google; ignora.
    }

    await signOut(auth);
}
