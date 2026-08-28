import { Image, StyleSheet, View } from "react-native";
import { colors } from "../theme/theme";

export function GoogleMark() {
    return (
        <View style={styles.badge}>
            <Image source={require("../../assets/google.png")} style={styles.icon} resizeMode="contain" />
        </View>
    );
}

export function AppleMark() {
    return (
        <View style={styles.badge}>
            <Image source={require("../../assets/logotipo-da-apple.png")} style={styles.icon} resizeMode="contain" />
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: colors.white,
        alignItems: "center",
        justifyContent: "center",
    },
    icon: {
        width: 16,
        height: 16,
    },
});
