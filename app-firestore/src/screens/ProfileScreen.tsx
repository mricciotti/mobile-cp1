import { useEffect, useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ImagePickerAsset } from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../hooks/useAuth";
import { RootStackParamList } from "../navigation/types";
import { getOwnCompleteProfile, getPublicUser, updateOwnProfile } from "../services/userService";
import { getOrCreateDirectConversation } from "../services/conversationService";
import { getRelatedPrivateProfile } from "../services/apiService";
import { CompleteUserProfile } from "../types/user";
import { Avatar } from "../components/Avatar";
import { AppShell } from "../components/AppShell";
import { Button } from "../components/Button";
import { ErrorMessage } from "../components/ErrorMessage";
import { Loading } from "../components/Loading";
import { TextField } from "../components/TextField";
import { formatBirthDateInput, isValidBirthDate } from "../utils/dateValidation";
import { formatPhoneNumber, normalizePhoneNumber } from "../utils/phoneFormat";
import { pickImage, uploadImage } from "../services/imageService";
import { colors, radius, spacing } from "../theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

export function ProfileScreen({ route, navigation }: Props) {
    const { user: currentUser, logout, updateUser } = useAuth();
    const [profile, setProfile] = useState<CompleteUserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [openingConversation, setOpeningConversation] = useState(false);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [selectedPhoto, setSelectedPhoto] = useState<ImagePickerAsset | null>(null);
    const [error, setError] = useState("");
    const isOwnProfile = route.params.userId === currentUser?.uid;

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError("");
        setEditing(false);
        setSelectedPhoto(null);

        const profileRequest = async (): Promise<CompleteUserProfile | null> => {
            if (isOwnProfile) return getOwnCompleteProfile(route.params.userId);
            const publicProfile = await getPublicUser(route.params.userId);
            if (!publicProfile) return null;
            try {
                const privateProfile = await getRelatedPrivateProfile(route.params.userId);
                return { ...publicProfile, ...privateProfile };
            } catch (reason) {
                console.warn("Perfil privado indisponível para este relacionamento.", reason);
                return { ...publicProfile, email: "", phoneNumber: "", birthDate: "" };
            }
        };

        profileRequest()
            .then((loadedProfile) => {
                if (!active) return;
                setProfile(loadedProfile);
                if (loadedProfile && isOwnProfile) {
                    setName(loadedProfile.name);
                    setPhoneNumber(formatPhoneNumber(loadedProfile.phoneNumber));
                    setBirthDate(formatBirthDateInput(loadedProfile.birthDate));
                }
            })
            .catch((reason: unknown) => {
                console.error(reason);
                if (active) setError(reason instanceof Error ? reason.message : "Não foi possível carregar o perfil.");
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [isOwnProfile, route.params.userId]);

    function beginEditing() {
        if (!profile || !isOwnProfile) return;
        setName(profile.name);
        setPhoneNumber(formatPhoneNumber(profile.phoneNumber));
        setBirthDate(formatBirthDateInput(profile.birthDate));
        setSelectedPhoto(null);
        setError("");
        setEditing(true);
    }

    function cancelEditing() {
        if (profile) {
            setName(profile.name);
            setPhoneNumber(formatPhoneNumber(profile.phoneNumber));
            setBirthDate(formatBirthDateInput(profile.birthDate));
        }
        setSelectedPhoto(null);
        setError("");
        setEditing(false);
    }

    async function choosePhoto() {
        if (!isOwnProfile || saving) return;
        try {
            const selected = await pickImage();
            if (selected) setSelectedPhoto(selected);
        } catch (reason: unknown) {
            setError(reason instanceof Error ? reason.message : "Não foi possível selecionar a foto.");
        }
    }

    async function saveProfile() {
        if (!currentUser || !profile || !isOwnProfile || saving) return;
        setError("");
        const normalizedPhone = normalizePhoneNumber(phoneNumber);
        if (!name.trim()) {
            setError("Informe seu nome.");
            return;
        }
        if (![10, 11].includes(normalizedPhone.length)) {
            setError("Informe um celular válido com DDD.");
            return;
        }
        if (!isValidBirthDate(birthDate)) {
            setError("Informe uma data válida no formato DD/MM/AAAA.");
            return;
        }

        try {
            setSaving(true);
            // O perfil só é persistido depois que o novo arquivo foi aceito pelo Cloudinary.
            const photoUrl = selectedPhoto ? await uploadImage(selectedPhoto) : profile.photoUrl;
            const updatedProfile: CompleteUserProfile = {
                ...profile,
                name: name.trim(),
                photoUrl,
                phoneNumber: normalizedPhone,
                birthDate,
            };
            await updateOwnProfile(currentUser.uid, {
                public: { name: updatedProfile.name, photoUrl: updatedProfile.photoUrl },
                private: { phoneNumber: updatedProfile.phoneNumber, birthDate: updatedProfile.birthDate },
            });
            setProfile(updatedProfile);
            updateUser({ name: updatedProfile.name, photoUrl: updatedProfile.photoUrl });
            setSelectedPhoto(null);
            setEditing(false);
        } catch (reason: unknown) {
            console.error(reason);
            setError(reason instanceof Error ? reason.message : "Não foi possível salvar o perfil.");
        } finally {
            setSaving(false);
        }
    }

    async function openConversation() {
        if (!currentUser || isOwnProfile || openingConversation) return;
        try {
            setOpeningConversation(true);
            const conversation = await getOrCreateDirectConversation(currentUser.uid, route.params.userId);
            navigation.navigate("Chat", { conversationId: conversation.id, conversationType: "direct" });
        } catch (reason: unknown) {
            setError(reason instanceof Error ? reason.message : "Não foi possível iniciar a conversa.");
        } finally {
            setOpeningConversation(false);
        }
    }

    if (!currentUser) return null;

    return (
        <AppShell
            user={currentUser}
            activeSection="profile"
            onMessages={() => navigation.navigate("Conversations")}
            onContacts={() => navigation.navigate("Users", { mode: "direct" })}
            onNewGroup={() => navigation.navigate("GroupForm", {})}
            onProfile={() => navigation.navigate("Profile", { userId: currentUser.uid })}
            onLogout={logout}
        >
            <SafeAreaView style={styles.container}>
                <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                        <View style={styles.topBar}>
                            <Pressable onPress={() => navigation.goBack()}><Text style={styles.backText}>‹ Voltar</Text></Pressable>
                            <Text style={styles.eyebrow}>{isOwnProfile ? "MEU PERFIL" : "PERFIL DO CONTATO"}</Text>
                        </View>
                        {loading ? <Loading /> : error && !profile ? <ErrorMessage message={error} /> : !profile ? <ErrorMessage message="Perfil indisponível." /> : (
                            <View style={styles.content}>
                                <View style={styles.profileHero}>
                                    {selectedPhoto ? <Image source={{ uri: selectedPhoto.uri }} style={styles.photoPreview} /> : <Avatar photoUrl={profile.photoUrl} name={profile.name} size={112} />}
                                    <Text style={styles.name}>{editing ? name || profile.name : profile.name}</Text>
                                    <Text style={styles.status}>{isOwnProfile ? "Seu espaço pessoal" : "Membro da sua rede"}</Text>
                                    {editing ? (
                                        <Button title={selectedPhoto ? "Trocar foto" : "Escolher foto"} variant="outline" onPress={choosePhoto} disabled={saving} style={styles.photoButton} />
                                    ) : !isOwnProfile ? (
                                        <Button title="Conversar" onPress={openConversation} loading={openingConversation} disabled={openingConversation} style={styles.conversationButton} />
                                    ) : (
                                        <Button title="Editar perfil" onPress={beginEditing} style={styles.conversationButton} />
                                    )}
                                </View>
                                {error ? <ErrorMessage message={error} /> : null}
                                {editing ? (
                                    <View style={styles.form}>
                                        <TextField label="Nome" value={name} onChangeText={setName} editable={!saving} autoCapitalize="words" />
                                        <TextField label="E-mail" value={profile.email} editable={false} style={styles.readOnlyField} />
                                        <TextField label="Celular" value={phoneNumber} onChangeText={(value) => setPhoneNumber(formatPhoneNumber(value))} editable={!saving} keyboardType="phone-pad" maxLength={15} />
                                        <TextField label="Data de nascimento" value={birthDate} onChangeText={(value) => setBirthDate(formatBirthDateInput(value))} editable={!saving} keyboardType="number-pad" maxLength={10} />
                                        <View style={styles.formActions}>
                                            <Button title="Cancelar" variant="ghost" onPress={cancelEditing} disabled={saving} style={styles.actionButton} />
                                            <Button title="Salvar" onPress={saveProfile} loading={saving} disabled={saving} style={styles.actionButton} />
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.details}>
                                        <ProfileField label="E-mail" value={profile.email || "Disponível apenas para o próprio usuário"} />
                                        <ProfileField label="Celular" value={profile.phoneNumber ? formatPhoneNumber(profile.phoneNumber) : "Não informado"} />
                                        <ProfileField label="Data de nascimento" value={profile.birthDate || "Não informada"} />
                                    </View>
                                )}
                            </View>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </AppShell>
    );
}

function ProfileField({ label, value }: { label: string; value: string }) {
    return <View style={styles.field}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>;
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg },
    flex: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingBottom: spacing.xl },
    topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.md },
    backText: { color: colors.primary, fontSize: 16, fontWeight: "700" },
    eyebrow: { color: colors.textFaint, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
    content: { width: "100%", maxWidth: 620, alignSelf: "center", gap: spacing.lg, paddingTop: spacing.md },
    profileHero: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.md },
    photoPreview: { width: 112, height: 112, borderRadius: 56, borderColor: colors.primary, borderWidth: 1.5 },
    name: { color: colors.text, fontSize: 26, fontWeight: "900", textAlign: "center" },
    status: { color: colors.textMuted, fontSize: 13 },
    conversationButton: { minWidth: 150, marginTop: spacing.sm },
    photoButton: { minWidth: 150, marginTop: spacing.sm },
    details: { gap: spacing.sm },
    form: { gap: spacing.md },
    formActions: { flexDirection: "row", gap: spacing.sm },
    actionButton: { flex: 1 },
    readOnlyField: { opacity: 0.65 },
    field: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: 6 },
    label: { color: colors.textFaint, fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
    value: { color: colors.text, fontSize: 16 },
});
