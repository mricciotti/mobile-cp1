import { useState } from "react";
import { Button, StyleSheet, TextInput, View } from "react-native";

interface ChatInputProps {
    onSend: (text: string) => void;
    disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
    const [text, setText] = useState("");

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
                style={styles.input}
                placeholder="Digite uma mensagem"
                value={text}
                onChangeText={setText}
                editable={!disabled}
                multiline
            />
            <Button title="Enviar" onPress={handleSend} disabled={disabled || !text.trim()} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        padding: 12,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#999",
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        maxHeight: 100,
    },
});
