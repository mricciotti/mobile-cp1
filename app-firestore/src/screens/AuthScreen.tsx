import { useState } from "react";
import { ActivityIndicator, Alert, Button, StyleSheet, Text, TextInput, View, } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FirebaseError } from "firebase/app";
import { login, register } from "../services/authService";

export function AuthScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    function validateFields() {
        setErrorMessage("");

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

    function getFirebaseErrorMessage(error: unknown) {
        console.error(error);

        if (!(error instanceof FirebaseError)) {
            return "Ocorreu um erro inesperado. Tente novamente.";
        }

        switch (error.code) {
            case "auth/invalid-email": return "Informe um endereço de e-mail válido.";

            case "auth/missing-password": return "Informe sua senha.";

            case "auth/weak-password": return "A senha deve possuir pelo menos 6 caracteres.";

            case "auth/email-already-in-use": return "Já existe uma conta utilizando este e-mail.";

            case "auth/user-not-found":
            case "auth/wrong-password":
            case "auth/invalid-credential": return "E-mail ou senha inválidos.";

            case "auth/operation-not-allowed": return "O login por e-mail e senha não está habilitado no Firebase Authentication.";

            case "auth/configuration-not-found": return "A configuração do Firebase Authentication não foi encontrada.";

            case "auth/network-request-failed": return "Não foi possível conectar ao Firebase. Verifique sua conexão com a internet.";

            case "auth/too-many-requests": return "Muitas tentativas de acesso. Tente novamente mais tarde.";

            default: return `Erro de autenticação: ${error.code}`;
        }
    }

    async function handleRegister() {

        if (!validateFields()) {
            return;
        }

        try {

            setLoading(true);
            setErrorMessage("");

            const user = await register(email.trim(), password);

            Alert.alert("Conta criada", `Usuário cadastrado com sucesso:\n${user.email}`);

            setPassword("");

        } catch (error) {
            setErrorMessage(getFirebaseErrorMessage(error));
        } finally {
            setLoading(false);
        }
    }

    async function handleLogin() {

        if (!validateFields()) {
            return;
        }

        try {

            setLoading(true);
            setErrorMessage("");

            await login(email.trim(), password);

            setPassword("");

        } catch (error) {
            setErrorMessage(getFirebaseErrorMessage(error));
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>
                    Firebase Authentication
                </Text>

                <Text style={styles.subtitle}>
                    Entre com sua conta ou cadastre um novo usuário.
                </Text>

                {errorMessage ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>
                            {errorMessage}
                        </Text>
                    </View>
                ) : null}

                <TextInput style={styles.input} placeholder="E-mail" value={email} onChangeText={(value) => { setEmail(value); setErrorMessage(""); }} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" editable={!loading} />
                <TextInput style={styles.input} placeholder="Senha" value={password} onChangeText={(value) => { setPassword(value); setErrorMessage(""); }} secureTextEntry autoCapitalize="none" autoCorrect={false} editable={!loading} />

                {loading ? (
                    <ActivityIndicator size="large" style={styles.loading} />
                ) : (
                    <View style={styles.buttons}>
                        <Button title="Entrar" onPress={handleLogin} />
                        <Button title="Criar conta" onPress={handleRegister} />
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

    errorContainer: {
        borderWidth: 1,
        borderColor: "#d32f2f",
        backgroundColor: "#ffebee",
        borderRadius: 8,
        padding: 12,
    },

    errorText: {
        color: "#b71c1c",
        fontSize: 14,
        fontWeight: "600",
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

    loading: {
        marginTop: 16,
    },
});