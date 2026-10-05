import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { RootStackParamList } from "../navigation/types";
import { getOwnCompleteProfile } from "../services/userService";
import { CompleteUserProfile } from "../types/user";
import { Avatar } from "../components/Avatar";
import { ErrorMessage } from "../components/ErrorMessage";
import { Loading } from "../components/Loading";
import { colors, radius, spacing } from "../theme/theme";

// Third-party profiles must use apiService.getRelatedPrivateProfile once the
// authenticated relationship-checking API route is implemented.

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

export function ProfileScreen({ route, navigation }: Props) {
    const [profile, setProfile] = useState<CompleteUserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        setLoading(true);
        getOwnCompleteProfile(route.params.userId)
            .then((user) => { if (active) setProfile(user); })
            .catch((reason: unknown) => {
                console.error(reason);
                if (active) setError("O perfil privado só pode ser consultado pelo próprio usuário.");
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [route.params.userId]);

    return (
        <SafeAreaView style={styles.container}>
            <Pressable onPress={() => navigation.goBack()} style={styles.back}><Text style={styles.backText}>‹  Voltar</Text></Pressable>
            {loading ? <Loading /> : error ? <ErrorMessage message={error} /> : !profile ? <ErrorMessage message="Perfil indisponível." /> : (
                <View style={styles.content}>
                    <Avatar photoUrl={profile.photoUrl} name={profile.name} size={112} />
                    <Text style={styles.name}>{profile.name}</Text>
                    <View style={styles.details}>
                        <ProfileField label="E-mail" value={profile.email} />
                        <ProfileField label="Celular" value={profile.phoneNumber || "Não informado"} />
                        <ProfileField label="Data de nascimento" value={profile.birthDate || "Não informada"} />
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

function ProfileField({ label, value }: { label: string; value: string }) {
    return <View style={styles.field}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>;
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
    back: { paddingVertical: spacing.sm },
    backText: { color: colors.primary, fontSize: 16, fontWeight: "700" },
    content: { alignItems: "center", gap: spacing.md, paddingTop: spacing.xl },
    name: { color: colors.text, fontSize: 24, fontWeight: "800" },
    details: { width: "100%", gap: spacing.sm, marginTop: spacing.md },
    field: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: 6 },
    label: { color: colors.textFaint, fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
    value: { color: colors.text, fontSize: 16 },
});
