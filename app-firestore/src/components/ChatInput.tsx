import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { colors, radius } from "../theme/theme";
import { Button } from "./Button";

interface ChatInputProps {
    onSend: (text: string) => void;
    disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
    const [text, setText] = useState("");
    const [focused, setFocused] = useState(false);

    function handleSend() {
        if (!text.trim()) {
            return;
        }

        onSend(text);
        setText("");
    }

    return (
        <View style={styles.container}>
            <TextInput
                style={[styles.input, focused && styles.inputFocused]}
                placeholder="Digite uma mensagem"
                placeholderTextColor={colors.textFaint}
                value={text}
                onChangeText={setText}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                editable={!disabled}
                multiline
            />
            <Button
                title="Enviar"
                onPress={handleSend}
                disabled={disabled || !text.trim()}
                style={styles.sendButton}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 10,
        padding: 12,
        backgroundColor: colors.backgroundAlt,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        color: colors.text,
        borderRadius: radius.lg,
        paddingHorizontal: 16,
        paddingVertical: 10,
        maxHeight: 100,
        fontSize: 15,
    },
    inputFocused: {
        borderColor: colors.primary,
    },
    sendButton: {
        width: 92,
    },
});
