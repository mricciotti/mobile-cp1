import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, glow, radius, spacing } from "../theme/theme";
import { ChatUser } from "../types/user";

interface UserItemProps {
    user: ChatUser;
    onPress: (user: ChatUser) => void;
}

export function UserItem({ user, onPress }: UserItemProps) {
    const initial = user.name.trim().charAt(0).toUpperCase() || "?";
    return (
        <Pressable
            onPress={() => onPress(user)}
            style={({ pressed }) => [styles.container, pressed && styles.pressed]}
        >
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
            </View>

            <View style={styles.info}>
                <Text style={styles.name}>{user.name}</Text>
                <Text style={styles.email}>{user.email}</Text>
            </View>

            <Text style={styles.chevron}>›</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.lg,
        padding: spacing.md,
        ...glow.card,
    },
    pressed: {
        opacity: 0.75,
        borderColor: colors.borderStrong,
    },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: radius.pill,
        borderWidth: 1.5,
        backgroundColor: colors.backgroundAlt,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        fontSize: 18,
        fontWeight: "800",
        color: colors.primary,
    },
    info: {
        flex: 1,
        gap: 6,
    },
    name: {
        fontSize: 17,
        fontWeight: "700",
        color: colors.text,
    },
    email: {
        fontSize: 11,
        color: colors.textMuted,
    },
    chevron: {
        fontSize: 22,
        color: colors.textFaint,
        fontWeight: "300",
    },
});
