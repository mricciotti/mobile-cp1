import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FirebaseError } from "firebase/app";
import { loginWithEmail } from "../services/authService";
import { ErrorMessage } from "../components/ErrorMessage";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { colors, radius, spacing } from "../theme/theme";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, "Login">;

export function LoginScreen({ navigation }: LoginScreenProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (!errorMessage) {
            return;
        }

        const timeout = setTimeout(() => setErrorMessage(""), 10000);
        return () => clearTimeout(timeout);
    }, [errorMessage]);

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

            await loginWithEmail(email.trim(), password);

            setPassword("");
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={[styles.blob, styles.blobTop]} />
            <View style={[styles.blob, styles.blobBottom]} />

            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                    <View style={styles.brand}>
                        <View style={styles.logoRing}>
                            <View style={styles.logoDot} />
                        </View>
                    </View>

                    <Text style={styles.title}>CHAT EM TEMPO REAL</Text>
                    <Text style={styles.subtitle}>Entre pra continuar suas conversas.</Text>

                    {errorMessage ? <ErrorMessage message={errorMessage} /> : null}

                    <View style={styles.tabs}>
                        <View style={[styles.tab, styles.activeTab]}>
                            <Text style={[styles.tabText, styles.tabTextActive]}>Entrar</Text>
                        </View>
                        <Pressable onPress={() => navigation.navigate("Register")} style={styles.tab}>
                            <Text style={styles.tabText}>Cadastrar</Text>
                        </Pressable>
                    </View>

                    <View style={styles.form}>
                        <TextField
                            label="E-mail"
                            placeholder="Email"
                            value={email}
                            onChangeText={(value) => { setEmail(value); setErrorMessage(""); }}
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="email-address"
                            editable={!loading}
                        />

                        <TextField
                            label="Senha"
                            placeholder="Senha"
                            value={password}
                            onChangeText={(value) => { setPassword(value); setErrorMessage(""); }}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!loading}
                        />
                    </View>

                    <View style={styles.statusRow}>
                        {loading && <ActivityIndicator size="small" color={colors.primary} />}
                    </View>

                    <Button
                        title="Entrar"
                        onPress={handleSubmit}
                        disabled={loading}
                    />

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
        overflow: "hidden",
    },
    flex: {
        flex: 1,
    },
    blob: {
        position: "absolute",
        borderRadius: 999,
    },
    blobTop: {
        width: 280,
        height: 280,
        top: -130,
        right: -100,
        backgroundColor: "rgba(61, 220, 255, 0.14)",
    },
    blobBottom: {
        width: 220,
        height: 220,
        bottom: -100,
        left: -80,
        backgroundColor: "rgba(139, 92, 246, 0.12)",
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        justifyContent: "center",
        gap: spacing.sm,
    },
    brand: {
        alignItems: "center",
        gap: 6,
        marginBottom: 2,
    },
    logoRing: {
        width: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: 1.5,
        borderColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    logoDot: {
        width: 15,
        height: 15,
        borderRadius: 8,
        backgroundColor: colors.primary,
        shadowColor: colors.primary,
        shadowOpacity: 0.8,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 0 },
    },
    eyebrow: {
        color: colors.textFaint,
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1.3,
    },
    title: {
        fontSize: 25,
        fontWeight: "800",
        color: colors.text,
        textAlign: "center",
        letterSpacing: 0.2,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textMuted,
        textAlign: "center",
        marginBottom: 2,
    },
    tabs: {
        flexDirection: "row",
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 4,
        position: "relative",
    },
    tab: {
        flex: 1,
        paddingVertical: 9,
        alignItems: "center",
    },
    activeTab: {
        backgroundColor: colors.primary,
        borderRadius: radius.sm,
    },
    tabText: {
        color: colors.textMuted,
        fontWeight: "700",
        fontSize: 14,
    },
    tabTextActive: {
        color: colors.background,
    },
    form: {
        gap: spacing.sm,
    },
    statusRow: {
        height: 16,
        alignItems: "center",
        justifyContent: "center",
    },
});
