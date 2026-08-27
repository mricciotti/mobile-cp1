import { useRef } from "react";
import { Button, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useChat } from "../hooks/useChat";
import { ChatMessage } from "../components/ChatMessage";
import { ChatInput } from "../components/ChatInput";
import { Loading } from "../components/Loading";
import { ErrorMessage } from "../components/ErrorMessage";
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

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <View style={styles.header}>
                    <Button title="Voltar" onPress={onBack} />
                    <Text style={styles.title}>{otherUser.name}</Text>
                    <View style={styles.headerSpacer} />
                </View>

                {error ? <ErrorMessage message={error} /> : null}

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
                            <Text style={styles.empty}>
                                Nenhuma mensagem ainda. Diga oi!
                            </Text>
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
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    headerSpacer: {
        width: 60,
    },
    title: {
        fontSize: 18,
        fontWeight: "600",
    },
    list: {
        flex: 1,
    },
    listContent: {
        padding: 16,
        flexGrow: 1,
    },
    empty: {
        textAlign: "center",
        marginTop: 24,
        color: "#666",
    },
});
