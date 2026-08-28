import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../theme/theme";

interface ErrorMessageProps {
    message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.icon}>!</Text>
            <Text style={styles.text}>{message}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        borderWidth: 1,
        borderColor: colors.danger,
        backgroundColor: colors.dangerBg,
        borderRadius: radius.md,
        padding: spacing.md,
    },
    icon: {
        color: colors.background,
        backgroundColor: colors.danger,
        width: 20,
        height: 20,
        borderRadius: radius.pill,
        textAlign: "center",
        lineHeight: 20,
        fontSize: 13,
        fontWeight: "800",
        overflow: "hidden",
    },
    text: {
        flex: 1,
        color: colors.danger,
        fontSize: 14,
        fontWeight: "600",
    },
});
