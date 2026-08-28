import { useState } from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { colors, radius, spacing, typography } from "../theme/theme";

interface TextFieldProps extends TextInputProps {
    label?: string;
}

export function TextField({ label, style, onFocus, onBlur, ...rest }: TextFieldProps) {
    const [focused, setFocused] = useState(false);

    return (
        <View style={styles.container}>
            {label ? <Text style={styles.label}>{label.toUpperCase()}</Text> : null}
            <TextInput
                {...rest}
                placeholderTextColor={colors.textFaint}
                onFocus={(event) => {
                    setFocused(true);
                    onFocus?.(event);
                }}
                onBlur={(event) => {
                    setFocused(false);
                    onBlur?.(event);
                }}
                style={[styles.input, focused && styles.inputFocused, style]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 6,
    },
    label: {
        fontSize: typography.label.fontSize,
        fontWeight: typography.label.fontWeight,
        letterSpacing: typography.label.letterSpacing,
        color: colors.textMuted,
        marginLeft: 2,
    },
    input: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: 14,
        fontSize: 16,
        color: colors.text,
    },
    inputFocused: {
        borderColor: colors.primary,
        shadowColor: colors.primary,
        shadowOpacity: 0.35,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 0 },
    },
});
