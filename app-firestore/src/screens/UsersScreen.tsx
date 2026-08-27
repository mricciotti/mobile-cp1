import { useEffect, useState } from "react";
import { Button, FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../hooks/useAuth";
import { subscribeToContacts } from "../services/userService";
import { UserItem } from "../components/UserItem";
import { Loading } from "../components/Loading";
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

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Contatos</Text>
                        <Text style={styles.authenticatedUser}>{user.name}</Text>
                    </View>
                    <Button title="Sair" onPress={logout} />
                </View>

                {loading ? (
                    <Loading />
                ) : (
                    <FlatList
                        data={contacts}
                        keyExtractor={(item) => item.uid}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <Text style={styles.empty}>
                                Nenhum contato disponível para conversar por enquanto.
                            </Text>
                        }
                        renderItem={({ item }) => (
                            <UserItem user={item} onPress={onSelectContact} />
                        )}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 24,
        gap: 16,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
    },
    authenticatedUser: {
        marginTop: 4,
        fontSize: 14,
    },
    listContent: {
        gap: 12,
        paddingBottom: 24,
    },
    empty: {
        textAlign: "center",
        marginTop: 24,
    },
});
