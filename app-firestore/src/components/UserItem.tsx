import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, glow, radius, spacing } from "../theme/theme";
import { PublicUser } from "../types/user";
import { Avatar } from "./Avatar";

interface UserItemProps {
    user: PublicUser;
    onPress: (user: PublicUser) => void;
}

export function UserItem({ user, onPress }: UserItemProps) {
    return (
        <Pressable
            onPress={() => onPress(user)}
            style={({ pressed }) => [styles.container, pressed && styles.pressed]}
        >
            <Avatar photoUrl={user.photoUrl} name={user.name} size={46} />

            <View style={styles.info}>
                <Text style={styles.name}>{user.name}</Text>
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
    info: {
        flex: 1,
        gap: 6,
    },
    name: {
        fontSize: 17,
        fontWeight: "700",
        color: colors.text,
    },
    chevron: {
        fontSize: 22,
        color: colors.textFaint,
        fontWeight: "300",
    },
});
