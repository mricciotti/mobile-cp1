import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../hooks/useAuth";
import { RootStackParamList } from "../navigation/types";
import { getOwnCompleteProfile, getPublicUser } from "../services/userService";
import { getOrCreateDirectConversation } from "../services/conversationService";
import { getRelatedPrivateProfile } from "../services/apiService";
import { CompleteUserProfile } from "../types/user";
import { Avatar } from "../components/Avatar";
import { AppShell } from "../components/AppShell";
import { Button } from "../components/Button";
import { ErrorMessage } from "../components/ErrorMessage";
import { Loading } from "../components/Loading";
import { formatPhoneNumber } from "../utils/phoneFormat";
import { colors, radius, spacing } from "../theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

export function ProfileScreen({ route, navigation }: Props) {
    const { user: currentUser, logout } = useAuth();
    const [profile, setProfile] = useState<CompleteUserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [openingConversation, setOpeningConversation] = useState(false);
    const [error, setError] = useState("");
    const isOwnProfile = route.params.userId === currentUser?.uid;

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError("");

        const profileRequest = async (): Promise<CompleteUserProfile | null> => {
            if (isOwnProfile) return getOwnCompleteProfile(route.params.userId);
            const publicProfile = await getPublicUser(route.params.userId);
            if (!publicProfile) return null;
            try {
                const privateProfile = await getRelatedPrivateProfile(route.params.userId);
                return { ...publicProfile, ...privateProfile };
            } catch (reason) {
                // Public profile remains useful when the API denies private fields.
                console.warn("Perfil privado indisponivel para este relacionamento.", reason);
                return { ...publicProfile, email: "", phoneNumber: "", birthDate: "" };
            }
        };

        profileRequest()
            .then((loadedProfile) => { if (active) setProfile(loadedProfile); })
            .catch((reason: unknown) => {
                console.error(reason);
                if (active) setError(reason instanceof Error ? reason.message : "Nao foi possivel carregar o perfil.");
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [isOwnProfile, route.params.userId]);

    async function openConversation() {
        if (!currentUser || isOwnProfile || openingConversation) return;
        try {
            setOpeningConversation(true);
            const conversation = await getOrCreateDirectConversation(currentUser.uid, route.params.userId);
            navigation.navigate("Chat", { conversationId: conversation.id, conversationType: "direct" });
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Nao foi possivel iniciar a conversa.");
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
                <View style={styles.topBar}>
                    <Pressable onPress={() => navigation.goBack()}><Text style={styles.backText}>‹ Voltar</Text></Pressable>
                    <Text style={styles.eyebrow}>{isOwnProfile ? "SEU PERFIL" : "PERFIL PUBLICO"}</Text>
                </View>
                {loading ? <Loading /> : error && !profile ? <ErrorMessage message={error} /> : !profile ? <ErrorMessage message="Perfil indisponivel." /> : (
                    <View style={styles.content}>
                        <View style={styles.profileHero}>
                            <Avatar photoUrl={profile.photoUrl} name={profile.name} size={112} />
                            <Text style={styles.name}>{profile.name}</Text>
                            <Text style={styles.status}>{isOwnProfile ? "Seu espaco pessoal" : "Membro da sua rede"}</Text>
                            {!isOwnProfile ? <Button title="Conversar" onPress={openConversation} loading={openingConversation} disabled={openingConversation} style={styles.conversationButton} /> : null}
                        </View>
                        {error ? <ErrorMessage message={error} /> : null}
                        <View style={styles.details}>
                            <ProfileField label="E-mail" value={profile.email || "Disponivel apenas para o proprio usuario"} />
                            <ProfileField label="Celular" value={profile.phoneNumber ? formatPhoneNumber(profile.phoneNumber) : "Nao informado"} />
                            <ProfileField label="Data de nascimento" value={profile.birthDate || "Nao informada"} />
                        </View>
                    </View>
                )}
            </SafeAreaView>
        </AppShell>
    );
}

function ProfileField({ label, value }: { label: string; value: string }) {
    return <View style={styles.field}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>;
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg },
    topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.md },
    backText: { color: colors.primary, fontSize: 16, fontWeight: "700" },
    eyebrow: { color: colors.textFaint, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
    content: { width: "100%", maxWidth: 620, alignSelf: "center", gap: spacing.lg, paddingTop: spacing.md },
    profileHero: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.md },
    name: { color: colors.text, fontSize: 26, fontWeight: "900" },
    status: { color: colors.textMuted, fontSize: 13 },
    conversationButton: { minWidth: 150, marginTop: spacing.sm },
    details: { gap: spacing.sm },
    field: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: 6 },
    label: { color: colors.textFaint, fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
    value: { color: colors.text, fontSize: 16 },
});
