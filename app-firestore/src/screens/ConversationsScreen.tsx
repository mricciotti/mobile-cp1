import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../hooks/useAuth";
import { RootStackParamList } from "../navigation/types";
import { ConversationListEntry, listUserConversations } from "../services/conversationService";
import { Avatar } from "../components/Avatar";
import { Button } from "../components/Button";
import { ErrorMessage } from "../components/ErrorMessage";
import { Loading } from "../components/Loading";
import { colors, glow, radius, spacing } from "../theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Conversations">;

export function ConversationsScreen({ navigation }: Props) {
    const { user, logout } = useAuth();
    const [items, setItems] = useState<ConversationListEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!user) return;
        let active = true;
        setLoading(true);
        setError("");
        listUserConversations(user.uid)
            .then((conversations) => { if (active) setItems(conversations); })
            .catch((reason: unknown) => {
                console.error(reason);
                if (active) setError("Não foi possível carregar suas conversas.");
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [user]);

    if (!user) return null;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.identity}>
                    <Avatar photoUrl={user.photoUrl} name={user.name} size={44} />
                    <View style={styles.identityText}>
                        <Text style={styles.eyebrow}>SUAS CONVERSAS</Text>
                        <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
                    </View>
                </View>
                <View style={styles.actions}>
                    <Button title="Perfil" variant="ghost" onPress={() => navigation.navigate("Profile", { userId: user.uid })} style={styles.actionButton} />
                    <Button title="Sair" variant="ghost" onPress={logout} style={styles.actionButton} />
                </View>
            </View>

            <View style={styles.titleRow}>
                <Text style={styles.title}>Mensagens</Text>
                <Button title="Nova conversa" onPress={() => navigation.navigate("Users", { mode: "direct" })} style={styles.newButton} />
            </View>

            {error ? <View style={styles.error}><ErrorMessage message={error} /></View> : null}
            {loading ? <Loading /> : (
                <FlatList
                    data={items}
                    keyExtractor={(item) => `${item.type}:${item.id}`}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={styles.emptyTitle}>Nenhuma conversa ainda</Text>
                            <Text style={styles.emptyText}>Inicie uma conversa para ela aparecer aqui.</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <Pressable
                            disabled={item.type === "group"}
                            onPress={() => {
                                if (item.type === "direct") navigation.navigate("Chat", {
                                    conversationId: item.id,
                                    conversationType: "direct",
                                    otherUserId: item.otherParticipantId,
                                });
                            }}
                            style={({ pressed }) => [styles.row, pressed && item.type === "direct" && styles.pressed]}
                        >
                            <Avatar name={item.type === "group" ? item.name : "D"} photoUrl={item.type === "group" ? item.photoUrl : ""} size={48} />
                            <View style={styles.rowInfo}>
                                <Text style={styles.rowTitle}>{item.type === "group" ? item.name : "Conversa direta"}</Text>
                                <Text style={styles.rowSubtitle}>{item.type === "group" ? `${item.memberIds.length} integrantes` : "Conversa individual"}</Text>
                            </View>
                            <Text style={styles.kind}>{item.type === "group" ? "GRUPO" : "DIRETA"}</Text>
                        </Pressable>
                    )}
                    ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    identity: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
    identityText: { flex: 1 },
    eyebrow: { color: colors.textFaint, fontSize: 10, fontWeight: "700", letterSpacing: 1 },
    userName: { color: colors.text, fontSize: 15, fontWeight: "700" },
    actions: { flexDirection: "row", gap: spacing.xs },
    actionButton: { width: 74 },
    titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
    title: { color: colors.text, fontSize: 25, fontWeight: "800" },
    newButton: { minWidth: 138 },
    error: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
    list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, flexGrow: 1 },
    empty: { alignItems: "center", gap: spacing.sm, marginTop: spacing.xl, paddingHorizontal: spacing.lg },
    emptyTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },
    emptyText: { color: colors.textMuted, textAlign: "center", lineHeight: 20 },
    row: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface, ...glow.card },
    pressed: { opacity: 0.75, borderColor: colors.borderStrong },
    rowInfo: { flex: 1, gap: 4 },
    rowTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
    rowSubtitle: { color: colors.textMuted, fontSize: 12 },
    kind: { color: colors.textFaint, fontSize: 9, fontWeight: "700", letterSpacing: 0.6 },
});
