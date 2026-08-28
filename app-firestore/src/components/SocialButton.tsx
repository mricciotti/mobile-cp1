import { ReactNode, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../theme/theme";

interface SocialButtonProps {
    title: string;
    icon: ReactNode;
    onPress: () => void;
    disabled?: boolean;
}

export function SocialButton({ title, icon, onPress, disabled }: SocialButtonProps) {
    const scale = useRef(new Animated.Value(1)).current;

    function animateTo(value: number) {
        Animated.spring(scale, {
            toValue: value,
            useNativeDriver: true,
            speed: 40,
            bounciness: 6,
        }).start();
    }

    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <Pressable
                onPress={onPress}
                disabled={disabled}
                onPressIn={() => animateTo(0.97)}
                onPressOut={() => animateTo(1)}
                style={[styles.base, disabled && styles.disabled]}
            >
                <View style={styles.iconSlot}>{icon}</View>
                <Text style={styles.label}>{title}</Text>
                <View style={styles.iconSlot} />
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    base: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surfaceAlt,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    disabled: {
        opacity: 0.45,
    },
    iconSlot: {
        width: 28,
        alignItems: "flex-start",
    },
    label: {
        flex: 1,
        textAlign: "center",
        color: colors.text,
        fontSize: 15,
        fontWeight: "700",
    },
});
