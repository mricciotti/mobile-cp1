import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import {
    createNativeStackNavigator,
    NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../hooks/useAuth";
import { getUserProfile } from "../services/userService";
import { ChatUser } from "../types/user";
import { ChatScreen } from "../screens/ChatScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { UsersScreen } from "../screens/UsersScreen";
import { ErrorMessage } from "../components/ErrorMessage";
import { Loading } from "../components/Loading";
import { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

type ChatRouteProps = NativeStackScreenProps<RootStackParamList, "Chat">;

function ChatRouteScreen({ route, navigation }: ChatRouteProps) {
    const { user } = useAuth();
    const [otherUser, setOtherUser] = useState<ChatUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        setLoading(true);
        setError(null);
        setOtherUser(null);

        getUserProfile(route.params.otherUserId)
            .then((profile) => {
                if (!active) {
                    return;
                }

                if (!profile) {
                    setError("Não foi possível encontrar este usuário.");
                    return;
                }

                setOtherUser(profile);
            })
            .catch((reason: unknown) => {
                console.error(reason);
                if (active) {
                    setError("Não foi possível carregar o usuário.");
                }
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [route.params.otherUserId]);

    if (!user) {
        return null;
    }

    if (loading) {
        return <Loading />;
    }

    if (error || !otherUser) {
        return (
            <SafeAreaView>
                <ErrorMessage message={error ?? "Usuário indisponível."} />
            </SafeAreaView>
        );
    }

    return (
        <ChatScreen
            currentUser={user}
            otherUser={otherUser}
            onBack={() => navigation.goBack()}
        />
    );
}

export function RootNavigator() {
    const { user, loading } = useAuth();

    if (loading) {
        return <Loading />;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                key={user ? "authenticated" : "unauthenticated"}
                screenOptions={{ headerShown: false }}
            >
                {user ? (
                    <>
                        <Stack.Screen
                            name="Users"
                            component={UsersScreen}
                            initialParams={{ mode: "direct" }}
                        />
                        <Stack.Screen name="Chat" component={ChatRouteScreen} />
                    </>
                ) : (
                    <Stack.Screen name="Login" component={LoginScreen} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
