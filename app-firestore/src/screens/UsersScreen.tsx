import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../hooks/useAuth";
import { subscribeToContacts } from "../services/userService";
import { UserItem } from "../components/UserItem";
import { Loading } from "../components/Loading";
import { Button } from "../components/Button";
import { colors, radius, spacing } from "../theme/theme";
import { ChatUser } from "../types/User";

interface UsersScreenProps {
    onSelectContact: (contact: ChatUser) => void;
}

export function UsersScreen({ onSelectContact }: UsersScreenProps) {
    const { user, logout } = useAuth();
    const [contacts, setContacts] = useState<ChatUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            return;
        }

        const unsubscribe = subscribeToContacts(user, (updatedContacts) => {
            setContacts(updatedContacts);
            setLoading(false);
        });

        return unsubscribe;
    }, [user]);

    if (!user) {
        return null;
    }

    const initial = user.name.trim().charAt(0).toUpperCase() || "?";

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initial}</Text>
                    </View>
                    <View>
                        <Text style={styles.eyebrow}>LOGADO COMO</Text>
                        <Text style={styles.userName}>{user.name}</Text>
                    </View>
                </View>
                <Button title="Sair" variant="ghost" onPress={logout} style={styles.logoutButton} />
            </View>

            <Text style={styles.sectionTitle}>Contatos</Text>

            {loading ? (
                <Loading />
            ) : (
                <FlatList
                    data={contacts}
                    keyExtractor={(item) => item.uid}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyTitle}>Nenhum contato por aqui</Text>
                            <Text style={styles.emptyText}>
                                Contas por e-mail/senha conversam com contas Google/Apple, e vice-versa. Assim que
                                alguém compatível se cadastrar, essa lista atualiza sozinha.
                            </Text>
                        </View>
                    }
                    renderItem={({ item }) => <UserItem user={item} onPress={onSelectContact} />}
                    ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        flexShrink: 1,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: radius.pill,
        backgroundColor: colors.surfaceAlt,
        borderWidth: 1.5,
        borderColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        color: colors.primary,
        fontSize: 17,
        fontWeight: "800",
    },
    eyebrow: {
        color: colors.textFaint,
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1,
    },
    userName: {
        color: colors.text,
        fontSize: 16,
        fontWeight: "700",
    },
    logoutButton: {
        width: 84,
    },
    sectionTitle: {
        color: colors.text,
        fontSize: 24,
        fontWeight: "800",
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.sm,
    },
    listContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
        flexGrow: 1,
    },
    emptyState: {
        alignItems: "center",
        gap: spacing.sm,
        marginTop: spacing.xl,
        paddingHorizontal: spacing.lg,
    },
    emptyTitle: {
        color: colors.text,
        fontSize: 17,
        fontWeight: "700",
    },
    emptyText: {
        color: colors.textMuted,
        fontSize: 14,
        textAlign: "center",
        lineHeight: 20,
    },
});
