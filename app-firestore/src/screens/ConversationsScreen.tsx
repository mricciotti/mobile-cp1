import { useEffect, useState } from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../hooks/useAuth";
import { RootStackParamList } from "../navigation/types";
import { ConversationListEntry, subscribeUserConversations } from "../services/conversationService";
import { Avatar } from "../components/Avatar";
import { Button } from "../components/Button";
import { ErrorMessage } from "../components/ErrorMessage";
import { Loading } from "../components/Loading";
import { colors, glow, radius, spacing } from "../theme/theme";
import { AppShell } from "../components/AppShell";

function formatConversationTime(timestamp: number): string {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
}

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
        subscribeUserConversations(user.uid,
            (conversations) => { if (active) { setItems(conversations); setLoading(false); } },
            (reason) => {
                console.error(reason);
                if (active) setError("Não foi possível carregar suas conversas.");
                setLoading(false);
            },
        );
        return () => { active = false; };
    }, [user]);

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
            {Platform.OS !== "web" ? <View style={styles.header}>
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
            </View> : null}

            <View style={styles.titleRow}>
                <Text style={styles.title}>Mensagens</Text>
                <View style={styles.titleActions}>
                    <Button title="Novo grupo" variant="outline" onPress={() => navigation.navigate("GroupForm", {})} style={styles.newButton} />
                    <Button title="Nova conversa" onPress={() => navigation.navigate("Users", { mode: "direct" })} style={styles.newButton} />
                </View>
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
                        <View style={styles.rowContainer}>
                            <Pressable
                                onPress={() => navigation.navigate("Chat", { conversationId: item.id, conversationType: item.type })}
                                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                            >
                                <Avatar
                                    name={item.type === "group" ? item.name : item.otherParticipant.name}
                                    photoUrl={item.type === "group" ? item.photoUrl : item.otherParticipant.photoUrl}
                                    size={48}
                                />
                                <View style={styles.rowInfo}>
                                    <Text style={[styles.rowTitle, item.isUnread && styles.unreadText]} numberOfLines={1}>
                                        {item.type === "group" ? item.name : item.otherParticipant.name}
                                    </Text>
                                    <Text style={[styles.rowSubtitle, item.isUnread && styles.unreadSubtitle]} numberOfLines={1}>
                                        {item.lastMessageText || (item.type === "group" ? "Voc\u00ea foi adicionado ao grupo" : "Nenhuma mensagem ainda")}
                                    </Text>
                                </View>
                                <View style={styles.rowMeta}>
                                    <Text style={styles.time}>{formatConversationTime(item.lastMessageAt || item.createdAt)}</Text>
                                    {item.type === "direct" ? (
                                        <Pressable onPress={(event) => { event.stopPropagation(); navigation.navigate("Profile", { userId: item.otherParticipantId }); }}>
                                            <Text style={styles.profileLink}>Perfil</Text>
                                        </Pressable>
                                    ) : null}
                                    {item.isUnread ? <View style={styles.unreadBadge}><Text style={styles.unreadBadgeText}>1</Text></View> : null}
                                </View>
                            </Pressable>
                            {item.type === "group" && item.ownerId === user.uid ? (
                                <Button title="Gerir" variant="ghost" onPress={() => navigation.navigate("GroupForm", { groupId: item.id })} style={styles.manageButton} />
                            ) : null}
                        </View>
                    )}
                    ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
                />
            )}
        </SafeAreaView>
        </AppShell>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    identity: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
    identityText: { flex: 1, minWidth: 0 },
    eyebrow: { color: colors.textFaint, fontSize: 10, fontWeight: "700", letterSpacing: 1 },
    userName: { color: colors.text, fontSize: 15, fontWeight: "700" },
    actions: { flexDirection: "row", gap: spacing.xs, flexShrink: 0 },
    actionButton: { width: 76 },
    titleRow: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
    title: { color: colors.text, fontSize: 25, fontWeight: "800" },
    newButton: { flex: 1, minWidth: 0 },
    titleActions: { flexDirection: "row", width: "100%", gap: spacing.xs },
    manageButton: { width: 68 },
    error: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
    list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, flexGrow: 1 },
    empty: { alignItems: "center", gap: spacing.sm, marginTop: spacing.xl, paddingHorizontal: spacing.lg },
    emptyTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },
    emptyText: { color: colors.textMuted, textAlign: "center", lineHeight: 20 },
    row: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface, ...glow.card },
    rowContainer: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
    pressed: { opacity: 0.75, borderColor: colors.borderStrong },
    rowInfo: { flex: 1, gap: 4, minWidth: 0 },
    rowTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
    rowSubtitle: { color: colors.textMuted, fontSize: 12 },
    unreadText: { fontWeight: "800" },
    unreadSubtitle: { color: colors.text },
    rowMeta: { alignItems: "flex-end", justifyContent: "center", gap: spacing.xs },
    time: { color: colors.textFaint, fontSize: 10 },
    profileLink: { color: colors.primary, fontSize: 10, fontWeight: "800" },
    unreadBadge: { minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary },
    unreadBadgeText: { color: colors.background, fontSize: 11, fontWeight: "800" },
});
