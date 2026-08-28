import { useRef } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useChat } from "../hooks/useChat";
import { ChatMessage } from "../components/ChatMessage";
import { ChatInput } from "../components/ChatInput";
import { Loading } from "../components/Loading";
import { ErrorMessage } from "../components/ErrorMessage";
import { colors, radius, spacing } from "../theme/theme";
import { ChatUser } from "../types/User";
import { ChatMessage as ChatMessageType } from "../types/chat";

interface ChatScreenProps {
    currentUser: ChatUser;
    otherUser: ChatUser;
    onBack: () => void;
}

export function ChatScreen({ currentUser, otherUser, onBack }: ChatScreenProps) {
    const { messages, loading, error, sendText } = useChat(currentUser.uid, otherUser.uid);
    const listRef = useRef<FlatList<ChatMessageType>>(null);
    const initial = otherUser.name.trim().charAt(0).toUpperCase() || "?";

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <View style={styles.header}>
                    <Pressable onPress={onBack} style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}>
                        <Text style={styles.backArrow}>‹</Text>
                    </Pressable>

                    <View style={styles.headerAvatar}>
                        <Text style={styles.headerAvatarText}>{initial}</Text>
                    </View>

                    <View style={styles.headerInfo}>
                        <Text style={styles.title} numberOfLines={1}>{otherUser.name}</Text>
                        <View style={styles.statusRow}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusText}>tempo real</Text>
                        </View>
                    </View>
                </View>

                {error ? (
                    <View style={styles.errorWrapper}>
                        <ErrorMessage message={error} />
                    </View>
                ) : null}

                {loading ? (
                    <Loading />
                ) : (
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
                                <Text style={styles.emptyText}>Diga oi e comece a conversa com {otherUser.name.split(" ")[0]}.</Text>
                            </View>
                        }
                        renderItem={({ item }) => (
                            <ChatMessage message={item} isOwnMessage={item.senderId === currentUser.uid} />
                        )}
                    />
                )}

                <ChatInput onSend={sendText} disabled={loading} />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    flex: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.backgroundAlt,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: radius.pill,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    backButtonPressed: {
        opacity: 0.7,
    },
    backArrow: {
        color: colors.primary,
        fontSize: 22,
        fontWeight: "700",
        marginLeft: -2,
    },
    headerAvatar: {
        width: 38,
        height: 38,
        borderRadius: radius.pill,
        backgroundColor: colors.surfaceAlt,
        borderWidth: 1.5,
        borderColor: colors.secondary,
        alignItems: "center",
        justifyContent: "center",
    },
    headerAvatarText: {
        color: colors.secondary,
        fontWeight: "800",
        fontSize: 15,
    },
    headerInfo: {
        flex: 1,
        gap: 2,
    },
    title: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.text,
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.success,
    },
    statusText: {
        fontSize: 11,
        color: colors.textFaint,
        fontWeight: "600",
    },
    errorWrapper: {
        padding: spacing.md,
        paddingBottom: 0,
    },
    list: {
        flex: 1,
    },
    listContent: {
        padding: spacing.md,
        flexGrow: 1,
    },
    emptyState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingHorizontal: spacing.lg,
        paddingTop: 60,
    },
    emptyTitle: {
        color: colors.text,
        fontSize: 16,
        fontWeight: "700",
    },
    emptyText: {
        color: colors.textMuted,
        fontSize: 14,
        textAlign: "center",
    },
});
