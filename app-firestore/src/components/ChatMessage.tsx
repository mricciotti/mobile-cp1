import { StyleSheet, Text, View } from "react-native";
import { ChatMessage as ChatMessageType } from "../types/chat";

interface ChatMessageProps {
    message: ChatMessageType;
    isOwnMessage: boolean;
}

export function ChatMessage({ message, isOwnMessage }: ChatMessageProps) {
    return (
        <View style={[styles.container, isOwnMessage ? styles.own : styles.received]}>
            <Text style={isOwnMessage ? styles.ownText : styles.receivedText}>{message.text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        maxWidth: "80%",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginVertical: 4,
    },
    own: {
        alignSelf: "flex-end",
        backgroundColor: "#2f6fed",
    },
    received: {
        alignSelf: "flex-start",
        backgroundColor: "#e5e5ea",
    },
    ownText: {
        color: "#fff",
        fontSize: 15,
    },
    receivedText: {
        color: "#000",
        fontSize: 15,
    },
});
