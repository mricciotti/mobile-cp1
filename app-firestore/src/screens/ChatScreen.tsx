import { useEffect, useRef } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useChat } from "../hooks/useChat";
import { ChatMessage as ChatMessageComponent } from "../components/ChatMessage";
import { ChatInput } from "../components/ChatInput";
import { Loading } from "../components/Loading";
import { ErrorMessage } from "../components/ErrorMessage";
import { Avatar } from "../components/Avatar";
import { colors, radius, spacing } from "../theme/theme";
import { PublicUser } from "../types/user";
import { ChatMessage } from "../types/chat";
import { markConversationRead } from "../services/userService";
import { AppShell } from "../components/AppShell";

interface ChatScreenProps {
    currentUser: PublicUser;
    conversationId: string;
    conversationType: "direct" | "group";
    title: string;
    photoUrl?: string;
    onBack: () => void;
    onMessages: () => void;
    onContacts: () => void;
    onNewGroup: () => void;
    onProfile: () => void;
    onLogout: () => void;
}

export function ChatScreen({ currentUser, conversationId, conversationType, title, photoUrl, onBack, onMessages, onContacts, onNewGroup, onProfile, onLogout }: ChatScreenProps) {
    const { messages, loading, error, sendText } = useChat(currentUser.uid, conversationId, conversationType);
    const listRef = useRef<FlatList<ChatMessage>>(null);

    useEffect(() => {
        markConversationRead(currentUser.uid, conversationId).catch((reason: unknown) => {
            console.warn("N\u00e3o foi poss\u00edvel atualizar a leitura da conversa.", reason);
        });
    }, [currentUser.uid, conversationId, messages.length]);

    return (
        <AppShell
            user={currentUser}
            activeSection="messages"
            onMessages={onMessages}
            onContacts={onContacts}
            onNewGroup={onNewGroup}
            onProfile={onProfile}
            onLogout={onLogout}
        >
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <View style={styles.header}>
                    <Pressable onPress={onBack} style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}>
                        <Text style={styles.backArrow}>‹</Text>
                    </Pressable>
                    <Avatar photoUrl={photoUrl} name={title} size={38} />
                    <View style={styles.headerInfo}>
                        <Text style={styles.title} numberOfLines={1}>{title}</Text>
                        <View style={styles.statusRow}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusText}>{conversationType === "group" ? "grupo" : "tempo real"}</Text>
                        </View>
                    </View>
                </View>

                {error ? <View style={styles.errorWrapper}><ErrorMessage message={error} /></View> : null}
                {loading ? <Loading /> : (
                    <FlatList
                        ref={listRef}
                        style={styles.list}
                        contentContainerStyle={styles.listContent}
                        data={messages}
                        keyExtractor={(item) => item.id}
                        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyTitle}>Nenhuma mensagem ainda</Text>
                                <Text style={styles.emptyText}>Envie a primeira mensagem.</Text>
                            </View>
                        }
                        renderItem={({ item }) => <ChatMessageComponent message={item} isOwnMessage={item.senderId === currentUser.uid} />}
                    />
                )}
                <ChatInput onSend={sendText} disabled={loading} />
            </KeyboardAvoidingView>
        </SafeAreaView>
        </AppShell>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.backgroundAlt },
    backButton: { width: 36, height: 36, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    backButtonPressed: { opacity: 0.7 },
    backArrow: { color: colors.primary, fontSize: 22, fontWeight: "700", marginLeft: -2 },
    headerInfo: { flex: 1, gap: 2 },
    title: { fontSize: 16, fontWeight: "700", color: colors.text },
    statusRow: { flexDirection: "row", alignItems: "center", gap: 5 },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
    statusText: { fontSize: 11, color: colors.textFaint, fontWeight: "600" },
    errorWrapper: { padding: spacing.md, paddingBottom: 0 },
    list: { flex: 1 },
    listContent: { padding: spacing.md, flexGrow: 1 },
    emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: spacing.lg, paddingTop: 60 },
    emptyTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
    emptyText: { color: colors.textMuted, fontSize: 14, textAlign: "center" },
});
