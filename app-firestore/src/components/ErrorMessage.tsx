import { StyleSheet, Text, View } from "react-native";

interface ErrorMessageProps {
    message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>{message}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderWidth: 1,
        borderColor: "#d32f2f",
        backgroundColor: "#ffebee",
        borderRadius: 8,
        padding: 12,
    },
    text: {
        color: "#b71c1c",
        fontSize: 14,
        fontWeight: "600",
    },
});
