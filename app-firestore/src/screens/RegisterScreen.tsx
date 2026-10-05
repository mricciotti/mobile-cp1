import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FirebaseError } from "firebase/app";
import { ImagePickerAsset } from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { RootStackParamList } from "../navigation/types";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { ErrorMessage } from "../components/ErrorMessage";
import { Avatar } from "../components/Avatar";
import { colors, radius, spacing } from "../theme/theme";
import { formatBirthDateInput, isValidBirthDate } from "../utils/dateValidation";
import { pickImage, uploadImage } from "../services/imageService";
import { registerWithEmail } from "../services/authService";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [photo, setPhoto] = useState<ImagePickerAsset | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function choosePhoto() {
        try {
            const selected = await pickImage();
            if (selected) setPhoto(selected);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Não foi possível selecionar a foto.");
        }
    }

    async function submit() {
        setError("");
        if (!name.trim() || !email.trim() || !password || !confirmPassword || !phoneNumber.trim() || !birthDate) {
            setError("Preencha todos os campos do cadastro."); return;
        }
        if (!email.includes("@")) { setError("Informe um e-mail válido."); return; }
        if (password.length < 6) { setError("A senha deve possuir pelo menos 6 caracteres."); return; }
        if (password !== confirmPassword) { setError("As senhas não coincidem."); return; }
        if (!isValidBirthDate(birthDate)) { setError("Informe uma data válida no formato DD/MM/AAAA."); return; }
        if (!photo) { setError("Selecione uma foto de perfil."); return; }

        try {
            setLoading(true);
            const photoUrl = await uploadImage(photo);
            await registerWithEmail({ name: name.trim(), email: email.trim(), password, phoneNumber: phoneNumber.trim(), birthDate, photoUrl });
        } catch (reason) {
            console.error(reason);
            if (reason instanceof FirebaseError) {
                setError(reason.code === "auth/email-already-in-use" ? "Já existe uma conta utilizando este e-mail." : reason.code === "auth/weak-password" ? "A senha deve possuir pelo menos 6 caracteres." : "Não foi possível concluir o cadastro. Verifique os dados e tente novamente.");
            } else {
                setError(reason instanceof Error ? reason.message : "Não foi possível concluir o cadastro.");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                    <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>‹  Voltar</Text></Pressable>
                    <Text style={styles.title}>Criar conta</Text>
                    <Text style={styles.subtitle}>Preencha seus dados para começar.</Text>
                    {error ? <ErrorMessage message={error} /> : null}
                    <View style={styles.photoSection}>
                        {photo ? <Image source={{ uri: photo.uri }} style={styles.photo} /> : <Avatar name={name} size={88} />}
                        <Pressable onPress={choosePhoto} disabled={loading} style={styles.photoButton}>
                            <Text style={styles.photoButtonText}>{photo ? "Trocar foto" : "Escolher foto"}</Text>
                        </Pressable>
                    </View>
                    <TextField label="Nome" placeholder="Seu nome" value={name} onChangeText={setName} editable={!loading} autoCapitalize="words" />
                    <TextField label="E-mail" placeholder="voce@email.com" value={email} onChangeText={setEmail} editable={!loading} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" />
                    <TextField label="Senha" placeholder="Mínimo de 6 caracteres" value={password} onChangeText={setPassword} editable={!loading} secureTextEntry autoCapitalize="none" />
                    <TextField label="Confirmar senha" placeholder="Digite a senha novamente" value={confirmPassword} onChangeText={setConfirmPassword} editable={!loading} secureTextEntry autoCapitalize="none" />
                    <TextField label="Celular" placeholder="(11) 99999-9999" value={phoneNumber} onChangeText={setPhoneNumber} editable={!loading} keyboardType="phone-pad" />
                    <TextField label="Data de nascimento" placeholder="DD/MM/AAAA" value={birthDate} onChangeText={(value) => setBirthDate(formatBirthDateInput(value))} editable={!loading} keyboardType="number-pad" maxLength={10} />
                    <Button title="Cadastrar" onPress={submit} loading={loading} disabled={loading} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    content: { padding: spacing.lg, gap: spacing.md },
    back: { color: colors.primary, fontWeight: "700", fontSize: 16 },
    title: { color: colors.text, fontSize: 28, fontWeight: "800" },
    subtitle: { color: colors.textMuted, fontSize: 14 },
    photoSection: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm },
    photo: { width: 88, height: 88, borderRadius: 44, borderColor: colors.primary, borderWidth: 1.5 },
    photoButton: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    photoButtonText: { color: colors.primary, fontWeight: "700" },
});
