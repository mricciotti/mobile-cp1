import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../hooks/useAuth";
import { RootStackParamList } from "../navigation/types";
import { getGroup } from "../services/groupService";
import { getPublicUser } from "../services/userService";
import { ChatGroup } from "../types/group";
import { PublicUser } from "../types/user";
import { AppShell } from "../components/AppShell";
import { Avatar } from "../components/Avatar";
import { Button } from "../components/Button";
import { ErrorMessage } from "../components/ErrorMessage";
import { Loading } from "../components/Loading";
import { colors, radius, spacing } from "../theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "GroupInfo">;

export function GroupInfoScreen({ route, navigation }: Props) {
    const { user, logout } = useAuth();
    const [group, setGroup] = useState<ChatGroup | null>(null);
    const [members, setMembers] = useState<PublicUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!user) return undefined;
        let active = true;
        setLoading(true);
        setError("");
        getGroup(route.params.groupId)
            .then(async (loadedGroup) => {
                if (!loadedGroup || !loadedGroup.memberIds.includes(user.uid)) {
                    throw new Error("Grupo indisponivel.");
                }
                const profiles = await Promise.all(loadedGroup.memberIds.map((memberId) => getPublicUser(memberId)));
                if (!active) return;
                setGroup(loadedGroup);
                setMembers(profiles.flatMap((profile) => profile ? [profile] : []));
            })
            .catch((reason: unknown) => {
                console.error(reason);
                if (active) setError(reason instanceof Error ? reason.message : "Nao foi possivel carregar o grupo.");
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [route.params.groupId, user]);

    if (!user) return null;

    return (
        <AppShell
            user={user}
            activeSection="messages"
            onMessages={() => navigation.navigate("Conversations")}
            onContacts={() => navigation.navigate("Users", { mode: "direct" })}
            onNewGroup={() => navigation.navigate("GroupForm", {})}
            onProfile={() => navigation.navigate("Profile", { userId: user.uid })}
            onLogout={logout}
        >
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.topBar}>
                        <Pressable onPress={() => navigation.goBack()}><Text style={styles.backText}>‹ Voltar</Text></Pressable>
                        <Text style={styles.eyebrow}>INFORMACOES DO GRUPO</Text>
                    </View>
                    {loading ? <Loading /> : error ? <ErrorMessage message={error} /> : !group ? <ErrorMessage message="Grupo indisponivel." /> : (
                        <View style={styles.card}>
                            <View style={styles.hero}>
                                <Avatar photoUrl={group.photoUrl} name={group.name} size={104} />
                                <Text style={styles.title}>{group.name}</Text>
                                <Text style={styles.subtitle}>{group.memberIds.length} de {group.memberLimit} integrantes</Text>
                            </View>
                            <View style={styles.details}>
                                <InfoRow label="Proprietario" value={members.find((member) => member.uid === group.ownerId)?.name ?? "Usuario"} />
                                <InfoRow label="Notificacoes" value={group.notificationPolicy === "disabled" ? "Desativadas" : "Ativadas"} />
                            </View>
                            <Text style={styles.sectionTitle}>Integrantes</Text>
                            <View style={styles.memberList}>
                                {members.map((member) => (
                                    <Pressable key={member.uid} onPress={() => navigation.navigate("Profile", { userId: member.uid })} style={styles.memberRow}>
                                        <Avatar photoUrl={member.photoUrl} name={member.name} size={42} />
                                        <View style={styles.memberText}>
                                            <Text style={styles.memberName}>{member.name}</Text>
                                            <Text style={styles.memberRole}>{member.uid === group.ownerId ? "Proprietario" : "Integrante"}</Text>
                                        </View>
                                        <Text style={styles.chevron}>›</Text>
                                    </Pressable>
                                ))}
                            </View>
                            {group.ownerId === user.uid ? <Button title="Administrar grupo" variant="outline" onPress={() => navigation.navigate("GroupForm", { groupId: group.id })} /> : null}
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </AppShell>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return <View style={styles.infoRow}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, gap: spacing.md, width: "100%", maxWidth: 700, alignSelf: "center" },
    topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    backText: { color: colors.primary, fontSize: 16, fontWeight: "800" },
    eyebrow: { color: colors.textFaint, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
    card: { gap: spacing.md },
    hero: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.md },
    title: { color: colors.text, fontSize: 26, fontWeight: "900" },
    subtitle: { color: colors.textMuted, fontSize: 13 },
    details: { gap: spacing.sm },
    infoRow: { padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, gap: 4 },
    infoLabel: { color: colors.textFaint, fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
    infoValue: { color: colors.text, fontSize: 15, fontWeight: "700" },
    sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "900", marginTop: spacing.sm },
    memberList: { gap: spacing.sm },
    memberRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    memberText: { flex: 1, gap: 3 },
    memberName: { color: colors.text, fontSize: 15, fontWeight: "800" },
    memberRole: { color: colors.textMuted, fontSize: 12 },
    chevron: { color: colors.primary, fontSize: 24 },
});
