import { useEffect, useState, } from "react";
import { Alert, Button, FlatList, StyleSheet, Text, TextInput, View, } from "react-native";
import { SafeAreaView, } from "react-native-safe-area-context";
import { auth, } from "../config/firebase";
import { logout, } from "../services/authService";
import { createUser, deleteUser, subscribeToUsers, updateUser, } from "../services/userService";
import { User, } from "../types/User";

export function HomeScreen() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    useEffect(() => {
        const unsubscribe = subscribeToUsers(setUsers);
        return unsubscribe;
    }, []);

    async function handleSave() {

        if (!name.trim() || !email.trim()) {
            Alert.alert("Atenção", "Informe nome e e-mail.");
            return;
        }

        try {

            if (selectedUser?.id) {
                await updateUser(selectedUser.id, { name, email, });
                setSelectedUser(null);
            } else {
                await createUser({ name, email, });
            }

            setName("");
            setEmail("");

        } catch (error) {
            console.error(error);
            Alert.alert("Erro", "Não foi possível salvar.");
        }
    }

    function handleEdit(user: User) {
        setSelectedUser(user);
        setName(user.name);
        setEmail(user.email);
    }

    async function handleDelete(id: string) {
        try {

            await deleteUser(id);

        } catch (error) {
            console.error(error);
            Alert.alert("Erro", "Não foi possível excluir.");
        }
    }

    async function handleLogout() {
        try {
            await logout();
            // O App.tsx detectará automaticamente
            // que o usuário não está mais autenticado
            // e voltará para AuthScreen.
        } catch (error) {
            console.error(error);
            Alert.alert("Erro", "Não foi possível sair da conta.");
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>
                            Firebase Firestore
                        </Text>
                        <Text style={styles.authenticatedUser}>
                            {auth.currentUser?.email}
                        </Text>
                    </View>
                    <Button title="Sair" onPress={handleLogout} />
                </View>

                <TextInput style={styles.input} placeholder="Nome" value={name} onChangeText={setName} />
                <TextInput style={styles.input} placeholder="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                <Button title={selectedUser ? "Atualizar usuário" : "Cadastrar usuário"} onPress={handleSave} />

                <FlatList style={styles.list} contentContainerStyle={styles.listContent} data={users} keyExtractor={(item) => item.id!}
                    ListEmptyComponent={
                        <Text style={styles.empty}>
                            Nenhum usuário cadastrado.
                        </Text>
                    }
                    renderItem={({ item
                    }) => (
                        <View style={styles.card}>
                            <Text style={styles.userName}> {item.name} </Text>
                            <Text> {item.email} </Text>
                            <View style={styles.actions}>
                                <Button title="Editar" onPress={() => handleEdit(item)} />
                                <Button title="Excluir" onPress={() => handleDelete(item.id!)} />
                            </View>
                        </View>
                    )}
                />
            </View>
        </SafeAreaView>
    );
}

const styles =
    StyleSheet.create({
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
            justifyContent:
                "space-between",
            alignItems:
                "center",
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

        input: {
            borderWidth: 1,
            borderColor: "#999",
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 16,
        },

        list: {
            flex: 1,
        },

        listContent: {
            gap: 12,
            paddingBottom: 24,
        },

        card: {
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 8,
            padding: 16,
            gap: 8,
        },

        userName: {
            fontSize: 18,
            fontWeight: "600",
        },

        actions: {
            gap: 8,
            marginTop: 8,
        },

        empty: {
            textAlign: "center",
            marginTop: 24,
        },
    });