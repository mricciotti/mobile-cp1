import { useRef } from "react";
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors, radius, typography } from "../theme/theme";

export type ButtonVariant = "primary" | "outline" | "ghost" | "danger";

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: ButtonVariant;
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
}

export function Button({ title, onPress, variant = "primary", disabled, loading, style }: ButtonProps) {
    const scale = useRef(new Animated.Value(1)).current;
    const isDisabled = disabled || loading;

    function animateTo(value: number) {
        Animated.spring(scale, {
            toValue: value,
            useNativeDriver: true,
            speed: 40,
            bounciness: 6,
        }).start();
    }

    const spinnerColor = variant === "primary" || variant === "danger" ? colors.background : colors.primary;

    return (
        <Animated.View style={[{ transform: [{ scale }] }, style]}>
            <Pressable
                onPress={onPress}
                disabled={isDisabled}
                onPressIn={() => animateTo(0.96)}
                onPressOut={() => animateTo(1)}
                style={[styles.base, variantStyles[variant], isDisabled && styles.disabled]}
            >
                {loading ? (
                    <ActivityIndicator color={spinnerColor} />
                ) : (
                    <View style={styles.row}>
                        <Text style={[styles.label, variantTextStyles[variant]]}>{title}</Text>
                    </View>
                )}
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    base: {
        borderRadius: radius.md,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "transparent",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    disabled: {
        opacity: 0.45,
    },
    label: {
        fontSize: typography.button.fontSize,
        fontWeight: typography.button.fontWeight,
        letterSpacing: typography.button.letterSpacing,
    },
});

const variantStyles = StyleSheet.create({
    primary: {
        backgroundColor: colors.primary,
        shadowColor: colors.primary,
        shadowOpacity: 0.4,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    outline: {
        backgroundColor: "transparent",
        borderColor: colors.primary,
    },
    ghost: {
        backgroundColor: colors.surfaceAlt,
        borderColor: colors.border,
    },
    danger: {
        backgroundColor: colors.danger,
    },
});

const variantTextStyles = StyleSheet.create({
    primary: { color: colors.background },
    outline: { color: colors.primary },
    ghost: { color: colors.text },
    danger: { color: colors.background },
});
