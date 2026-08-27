import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChatUser } from "../types/User";

const PROVIDER_LABELS: Record<ChatUser["provider"], string> = {
    password: "E-mail e senha",
    google: "Google",
    apple: "Apple",
};

interface UserItemProps {
    user: ChatUser;
    onPress: (user: ChatUser) => void;
}

export function UserItem({ user, onPress }: UserItemProps) {
    return (
        <Pressable style={styles.container} onPress={() => onPress(user)}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.provider}>{PROVIDER_LABELS[user.provider]}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        padding: 16,
        gap: 4,
    },
    name: {
        fontSize: 18,
        fontWeight: "600",
    },
    provider: {
        fontSize: 13,
        color: "#666",
    },
});
