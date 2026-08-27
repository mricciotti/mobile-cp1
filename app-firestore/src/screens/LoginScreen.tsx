import { useEffect, useState } from "react";
import { ActivityIndicator, Button, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FirebaseError } from "firebase/app";
import * as AppleAuthentication from "expo-apple-authentication";
import { loginWithApple, loginWithEmail, loginWithGoogle, registerWithEmail } from "../services/authService";
import { ErrorMessage } from "../components/ErrorMessage";

type Mode = "login" | "register";

export function LoginScreen() {
    const [mode, setMode] = useState<Mode>("login");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [appleAvailable, setAppleAvailable] = useState(false);

    useEffect(() => {
        if (Platform.OS !== "ios") {
            return;
        }

        AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }, []);

    function validateFields() {
        setErrorMessage("");

        if (mode === "register" && !name.trim()) {
            setErrorMessage("Informe seu nome.");
            return false;
        }

        if (!email.trim() || !password.trim()) {
            setErrorMessage("Informe e-mail e senha.");
            return false;
        }

        if (!email.includes("@")) {
            setErrorMessage("Informe um e-mail válido.");
            return false;
        }

        if (password.length < 6) {
            setErrorMessage("A senha deve possuir pelo menos 6 caracteres.");
            return false;
        }

        return true;
    }

    function getErrorMessage(error: unknown) {
        console.error(error);

        if (error instanceof FirebaseError) {
            switch (error.code) {
                case "auth/invalid-email": return "Informe um endereço de e-mail válido.";
                case "auth/missing-password": return "Informe sua senha.";
                case "auth/weak-password": return "A senha deve possuir pelo menos 6 caracteres.";
                case "auth/email-already-in-use": return "Já existe uma conta utilizando este e-mail.";
                case "auth/user-not-found":
                case "auth/wrong-password":
                case "auth/invalid-credential": return "E-mail ou senha inválidos.";
                case "auth/operation-not-allowed": return "Esse método de login não está habilitado no Firebase Authentication.";
                case "auth/network-request-failed": return "Não foi possível conectar ao Firebase. Verifique sua conexão com a internet.";
                case "auth/too-many-requests": return "Muitas tentativas de acesso. Tente novamente mais tarde.";
                default: return `Erro de autenticação: ${error.code}`;
            }
        }

        if (error instanceof Error) {
            return error.message;
        }

        return "Ocorreu um erro inesperado. Tente novamente.";
    }

    async function handleSubmit() {
        if (!validateFields()) {
            return;
        }

        try {
            setLoading(true);
            setErrorMessage("");

            if (mode === "register") {
                await registerWithEmail(name.trim(), email.trim(), password);
            } else {
                await loginWithEmail(email.trim(), password);
            }

            setPassword("");
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogleLogin() {
        try {
            setLoading(true);
            setErrorMessage("");
            await loginWithGoogle();
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    }

    async function handleAppleLogin() {
        try {
            setLoading(true);
            setErrorMessage("");
            await loginWithApple();
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Chat Firebase</Text>
                <Text style={styles.subtitle}>
                    {mode === "login" ? "Entre com sua conta." : "Crie uma conta com e-mail e senha."}
                </Text>

                {errorMessage ? <ErrorMessage message={errorMessage} /> : null}

                {mode === "register" && (
                    <TextInput
                        style={styles.input}
                        placeholder="Nome"
                        value={name}
                        onChangeText={(value) => { setName(value); setErrorMessage(""); }}
                        editable={!loading}
                    />
                )}

                <TextInput
                    style={styles.input}
                    placeholder="E-mail"
                    value={email}
                    onChangeText={(value) => { setEmail(value); setErrorMessage(""); }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    editable={!loading}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Senha"
                    value={password}
                    onChangeText={(value) => { setPassword(value); setErrorMessage(""); }}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                />

                {loading ? (
                    <ActivityIndicator size="large" style={styles.loading} />
                ) : (
                    <View style={styles.buttons}>
                        <Button
                            title={mode === "login" ? "Entrar" : "Criar conta"}
                            onPress={handleSubmit}
                        />
                        <Button
                            title={mode === "login" ? "Não tenho conta, cadastrar" : "Já tenho conta, entrar"}
                            onPress={() => { setMode(mode === "login" ? "register" : "login"); setErrorMessage(""); }}
                        />

                        <View style={styles.separator} />

                        <Button title="Entrar com Google" onPress={handleGoogleLogin} />

                        {Platform.OS === "ios" && appleAvailable && (
                            <AppleAuthentication.AppleAuthenticationButton
                                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                                cornerRadius={8}
                                style={styles.appleButton}
                                onPress={handleAppleLogin}
                            />
                        )}
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: "center",
        gap: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: "#999",
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
    },
    buttons: {
        gap: 12,
    },
    separator: {
        height: 1,
        backgroundColor: "#ddd",
        marginVertical: 4,
    },
    appleButton: {
        height: 44,
    },
    loading: {
        marginTop: 16,
    },
});
