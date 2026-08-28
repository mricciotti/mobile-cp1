import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, glow, radius, spacing } from "../theme/theme";
import { ChatUser } from "../types/User";

const PROVIDER_LABELS: Record<ChatUser["provider"], string> = {
    password: "E-mail e senha",
    google: "Google",
    apple: "Apple",
};

const PROVIDER_COLORS: Record<ChatUser["provider"], string> = {
    password: colors.badgePassword,
    google: colors.badgeGoogle,
    apple: colors.badgeApple,
};

interface UserItemProps {
    user: ChatUser;
    onPress: (user: ChatUser) => void;
}

export function UserItem({ user, onPress }: UserItemProps) {
    const initial = user.name.trim().charAt(0).toUpperCase() || "?";
    const accent = PROVIDER_COLORS[user.provider];

    return (
        <Pressable
            onPress={() => onPress(user)}
            style={({ pressed }) => [styles.container, pressed && styles.pressed]}
        >
            <View style={[styles.avatar, { borderColor: accent }]}>
                <Text style={[styles.avatarText, { color: accent }]}>{initial}</Text>
            </View>

            <View style={styles.info}>
                <Text style={styles.name}>{user.name}</Text>
                <View style={[styles.badge, { borderColor: accent }]}>
                    <View style={[styles.badgeDot, { backgroundColor: accent }]} />
                    <Text style={[styles.badgeText, { color: accent }]}>{PROVIDER_LABELS[user.provider]}</Text>
                </View>
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
    badge: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 6,
        borderWidth: 1,
        borderRadius: radius.pill,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    badgeDot: {
        width: 6,
        height: 6,
        borderRadius: radius.pill,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 0.3,
    },
    chevron: {
        fontSize: 22,
        color: colors.textFaint,
        fontWeight: "300",
    },
});
