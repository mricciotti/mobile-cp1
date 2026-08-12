import {
    useEffect,
    useState,
} from "react";

import {
    Alert,
    Button,
    FlatList,
    SafeAreaView,
    Text,
    TextInput,
    View,
} from "react-native";

import {
    createUser,
    deleteUser,
    subscribeToUsers,
    updateUser,
} from "../services/userService";

import { User } from "../types/User";

export function HomeScreen() {
    const [name, setName] =
        useState("");

    const [email, setEmail] =
        useState("");

    const [users, setUsers] =
        useState<User[]>([]);

    const [
        selectedUser,
        setSelectedUser
    ] =
        useState<User | null>(
            null
        );

    useEffect(() => {
        const unsubscribe =
            subscribeToUsers(
                setUsers
            );

        return unsubscribe;
    }, []);

    async function handleSave() {
        if (
            !name.trim() ||
            !email.trim()
        ) {
            Alert.alert(
                "Atenção",
                "Informe nome e e-mail."
            );

            return;
        }

        try {
            if (
                selectedUser?.id
            ) {
                await updateUser(
                    selectedUser.id,
                    {
                        name,
                        email,
                    }
                );

                setSelectedUser(null);
            } else {
                await createUser({
                    name,
                    email,
                });
            }

            setName("");
            setEmail("");

        } catch (error) {
            console.error(error);

            Alert.alert(
                "Erro",
                "Não foi possível salvar."
            );
        }
    }

    function handleEdit(
        user: User
    ) {
        setSelectedUser(user);
        setName(user.name);
        setEmail(user.email);
    }

    async function handleDelete(
        id: string
    ) {
        try {
            await deleteUser(id);
        } catch (error) {
            console.error(error);

            Alert.alert(
                "Erro",
                "Não foi possível excluir."
            );
        }
    }

    return (
        <SafeAreaView>
            <View>
                <Text>
                    Firebase Firestore
                </Text>

                <TextInput
                    placeholder="Nome"
                    value={name}
                    onChangeText={setName}
                />

                <TextInput
                    placeholder="E-mail"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                />

                <Button
                    title={
                        selectedUser
                            ? "Atualizar usuário"
                            : "Cadastrar usuário"
                    }
                    onPress={handleSave}
                />

                <FlatList
                    data={users}

                    keyExtractor={
                        (item) =>
                            item.id!
                    }

                    renderItem={({
                        item
                    }) => (
                        <View>
                            <Text>
                                {item.name}
                            </Text>

                            <Text>
                                {item.email}
                            </Text>

                            <Button
                                title="Editar"
                                onPress={() =>
                                    handleEdit(
                                        item
                                    )
                                }
                            />

                            <Button
                                title="Excluir"
                                onPress={() =>
                                    handleDelete(
                                        item.id!
                                    )
                                }
                            />
                        </View>
                    )}
                />
            </View>
        </SafeAreaView>
    );
}