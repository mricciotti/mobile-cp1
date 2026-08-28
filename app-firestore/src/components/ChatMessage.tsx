import { StyleSheet, Text, View } from "react-native";
import { colors, glow, radius } from "../theme/theme";
import { ChatMessage as ChatMessageType } from "../types/chat";

interface ChatMessageProps {
    message: ChatMessageType;
    isOwnMessage: boolean;
}

function formatTime(timestamp: number): string {
    if (!timestamp) {
        return "";
    }

    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
}

export function ChatMessage({ message, isOwnMessage }: ChatMessageProps) {
    return (
        <View style={[styles.wrapper, isOwnMessage ? styles.wrapperOwn : styles.wrapperReceived]}>
            <View style={[styles.bubble, isOwnMessage ? styles.own : styles.received]}>
                <Text style={isOwnMessage ? styles.ownText : styles.receivedText}>{message.text}</Text>
            </View>
            <Text style={[styles.time, isOwnMessage ? styles.timeOwn : styles.timeReceived]}>
                {formatTime(message.createdAt)}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        maxWidth: "80%",
        marginVertical: 4,
    },
    wrapperOwn: {
        alignSelf: "flex-end",
        alignItems: "flex-end",
    },
    wrapperReceived: {
        alignSelf: "flex-start",
        alignItems: "flex-start",
    },
    bubble: {
        borderRadius: radius.lg,
        paddingHorizontal: 16,
        paddingVertical: 11,
    },
    own: {
        backgroundColor: colors.ownBubble,
        borderBottomRightRadius: 4,
        ...glow.primary,
        shadowOpacity: 0.25,
        shadowRadius: 8,
    },
    received: {
        backgroundColor: colors.receivedBubble,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: colors.border,
    },
    ownText: {
        color: colors.white,
        fontSize: 15,
        lineHeight: 20,
    },
    receivedText: {
        color: colors.text,
        fontSize: 15,
        lineHeight: 20,
    },
    time: {
        fontSize: 10,
        marginTop: 3,
        marginHorizontal: 4,
    },
    timeOwn: {
        color: colors.textFaint,
    },
    timeReceived: {
        color: colors.textFaint,
    },
});
