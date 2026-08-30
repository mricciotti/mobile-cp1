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
import { TurboModuleRegistry } from "react-native";
import { auth } from "../config/firebase";
import { saveUserProfile } from "./userService";
import { AuthProvider, ChatUser } from "../types/User";

// A lib do Google Sign-In resolve seu módulo nativo com "getEnforcing", que
// lança um erro fatal assim que o pacote é importado se o módulo nativo não
// existir (ex: Expo Go, sem o development build) — inclusive derrubando o
// LogBox com uma tela de erro que não dá pra suprimir depois. "get" (em vez
// de "getEnforcing") é a variante segura: retorna vazio em vez de lançar,
// permitindo checar a disponibilidade ANTES de sequer importar o pacote.
function isGoogleSignInAvailable(): boolean {
    return TurboModuleRegistry.get("RNGoogleSignin") != null;
}

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
    if (!isGoogleSignInAvailable()) {
        throw new Error(
            "Login com Google não está disponível neste ambiente. É necessário o development build (não funciona no Expo Go)."
        );
    }

    // Import dinâmico (em vez de estático no topo do arquivo): assim, em
    // ambientes onde o módulo nativo não existe, o pacote nem chega a ser
    // avaliado — a checagem acima já barrou antes disso.
    const { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } = await import(
        "@react-native-google-signin/google-signin"
    );

    try {
        GoogleSignin.configure({
            webClientId: "465066727567-thn2d81abjrtr8eth7vcjbbo37at4cc1.apps.googleusercontent.com",
        });

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
        if (typeof isErrorWithCode === "function" && isErrorWithCode(error) && error.code === statusCodes?.SIGN_IN_CANCELLED) {
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
    if (isGoogleSignInAvailable()) {
        try {
            const { GoogleSignin } = await import("@react-native-google-signin/google-signin");
            await GoogleSignin.signOut();
        } catch {
            // usuário não entrou com Google; ignora — o logout do Firebase
            // abaixo continua valendo pra qualquer provedor.
        }
    }

    await signOut(auth);
}
