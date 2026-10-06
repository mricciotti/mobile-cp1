import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../hooks/useAuth";
import { searchUsers } from "../services/userService";
import { getOrCreateDirectConversation } from "../services/conversationService";
import { RootStackParamList } from "../navigation/types";
import { UserItem } from "../components/UserItem";
import { Loading } from "../components/Loading";
import { Button } from "../components/Button";
import { colors, radius, spacing } from "../theme/theme";
import { PublicUser } from "../types/user";
import { Avatar } from "../components/Avatar";

type UsersScreenProps = NativeStackScreenProps<RootStackParamList, "Users">;

export function UsersScreen({ navigation }: UsersScreenProps) {
    const { user, logout } = useAuth();
    const [contacts, setContacts] = useState<PublicUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [openingUserId, setOpeningUserId] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            return;
        }
        let active = true;
        setLoading(true);
        searchUsers(search).then((matches) => {
            if (!active) return;
            setContacts(matches.filter((contact) => contact.uid !== user.uid));
        }).catch((error: unknown) => {
            console.error(error);
            if (active) setContacts([]);
        }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [user, search]);

    if (!user) {
        return null;
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Avatar photoUrl={user.photoUrl} name={user.name} size={44} />
                    <View>
                        <Text style={styles.eyebrow}>LOGADO COMO</Text>
                        <Text style={styles.userName}>{user.name}</Text>
                    </View>
                </View>
                <View style={styles.headerActions}>
                    <Button title="Perfil" variant="ghost" onPress={() => navigation.navigate("Profile", { userId: user.uid })} style={styles.profileButton} />
                    <Button title="Sair" variant="ghost" onPress={logout} style={styles.logoutButton} />
                </View>
            </View>

            <Text style={styles.sectionTitle}>Contatos</Text>
            <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar por nome"
                placeholderTextColor={colors.textFaint}
                autoCapitalize="none"
                style={styles.searchInput}
            />

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
                                Não encontramos usuários com esse nome.
                            </Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <UserItem
                            user={item}
                            onPress={async (contact: PublicUser) => {
                                if (contact.uid === user.uid || openingUserId) return;
                                try {
                                    setOpeningUserId(contact.uid);
                                    const conversation = await getOrCreateDirectConversation(user.uid, contact.uid);
                                    navigation.navigate("Chat", {
                                        conversationId: conversation.id,
                                        conversationType: "direct",
                                    });
                                } catch (reason) {
                                    console.error(reason);
                                } finally {
                                    setOpeningUserId(null);
                                }
                            }}
                        />
                    )}
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
    headerActions: {
        flexDirection: "row",
        gap: spacing.xs,
    },
    profileButton: {
        width: 86,
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
    searchInput: {
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        backgroundColor: colors.surface,
        color: colors.text,
        paddingHorizontal: spacing.md,
        paddingVertical: 12,
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
