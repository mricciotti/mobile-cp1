import { Image, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/theme";

type AvatarProps = { photoUrl?: string | null; name: string; size?: number };

export function Avatar({ photoUrl, name, size = 48 }: AvatarProps) {
    const initial = name.trim().charAt(0).toLocaleUpperCase() || "?";
    const style = { width: size, height: size, borderRadius: size / 2 };
    return (
        <View style={[styles.container, style]}>
            {photoUrl ? <Image source={{ uri: photoUrl }} style={[styles.image, style]} /> : (
                <Text style={[styles.initial, { fontSize: Math.max(15, size * 0.4) }]}>{initial}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceAlt, borderWidth: 1.5, borderColor: colors.primary },
    image: { resizeMode: "cover" },
    initial: { color: colors.primary, fontWeight: "800" },
});
