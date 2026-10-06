import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, glow, radius, spacing } from "../theme/theme";
import { PublicUser } from "../types/user";
import { Avatar } from "./Avatar";

interface UserItemProps {
    user: PublicUser;
    onPress: (user: PublicUser) => void;
    onViewProfile: (user: PublicUser) => void;
    opening?: boolean;
}

export function UserItem({ user, onPress, onViewProfile, opening = false }: UserItemProps) {
    return (
        <View style={styles.container}>
            <Pressable onPress={() => onViewProfile(user)} style={({ pressed }) => [styles.profileTarget, pressed && styles.pressed]}>
                <Avatar photoUrl={user.photoUrl} name={user.name} size={46} />
                <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={1}>{user.name}</Text>
                    <Text style={styles.profileHint}>Ver perfil</Text>
                </View>
            </Pressable>
            <Pressable onPress={() => onPress(user)} disabled={opening} style={({ pressed }) => [styles.startButton, pressed && styles.pressed, opening && styles.disabled]}>
                {opening ? <ActivityIndicator color={colors.background} /> : <Text style={styles.startButtonText}>Conversar</Text>}
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.lg,
        padding: spacing.md,
        ...glow.card,
    },
    profileTarget: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        minWidth: 0,
    },
    pressed: {
        opacity: 0.75,
    },
    disabled: {
        opacity: 0.65,
    },
    info: {
        flex: 1,
        gap: 4,
        minWidth: 0,
    },
    name: {
        fontSize: 17,
        fontWeight: "700",
        color: colors.text,
    },
    profileHint: {
        color: colors.textFaint,
        fontSize: 12,
    },
    startButton: {
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.primary,
    },
    startButtonText: {
        color: colors.background,
        fontSize: 12,
        fontWeight: "800",
    },
});
