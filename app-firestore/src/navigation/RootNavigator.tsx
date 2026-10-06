import { useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator, NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../hooks/useAuth";
import { getPublicUser } from "../services/userService";
import { getDirectConversation } from "../services/conversationService";
import { getGroup } from "../services/groupService";
import { getNotificationRoute, NotificationRoute } from "../services/pushService";
import { ChatScreen } from "../screens/ChatScreen";
import { GroupFormScreen } from "../screens/GroupFormScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { UsersScreen } from "../screens/UsersScreen";
import { ConversationsScreen } from "../screens/ConversationsScreen";
import { ErrorMessage } from "../components/ErrorMessage";
import { Loading } from "../components/Loading";
import { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

type ChatRouteProps = NativeStackScreenProps<RootStackParamList, "Chat">;

function ChatRouteScreen({ route, navigation }: ChatRouteProps) {
    const { user } = useAuth();
    const [title, setTitle] = useState("");
    const [photoUrl, setPhotoUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);
        setTitle("");
        setPhotoUrl("");

        const loadConversationHeader = async () => {
            if (!user) return;
            if (route.params.conversationType === "direct") {
                const conversation = await getDirectConversation(route.params.conversationId);
                const otherId = conversation?.participantIds.find((id) => id !== user.uid);
                if (!conversation || !otherId) throw new Error("Conversa individual indisponÃ­vel.");
                const profile = await getPublicUser(otherId);
                if (!profile) throw new Error("UsuÃ¡rio indisponÃ­vel.");
                if (active) {
                    setTitle(profile.name);
                    setPhotoUrl(profile.photoUrl);
                }
            } else {
                const group = await getGroup(route.params.conversationId);
                if (!group || !group.memberIds.includes(user.uid)) throw new Error("Grupo indisponÃ­vel.");
                if (active) {
                    setTitle(group.name);
                    setPhotoUrl(group.photoUrl);
                }
            }
        };

        loadConversationHeader()
            .catch((reason: unknown) => {
                console.error(reason);
                if (active) setError(reason instanceof Error ? reason.message : "NÃ£o foi possÃ­vel carregar a conversa.");
            })
            .finally(() => { if (active) setLoading(false); });

        return () => { active = false; };
    }, [route.params.conversationId, route.params.conversationType, user]);

    if (!user) return null;
    if (loading) return <Loading />;
    if (error || !title) {
        return <SafeAreaView style={{ flex: 1 }}><ErrorMessage message={error ?? "Conversa indisponÃ­vel."} /></SafeAreaView>;
    }

    return (
        <ChatScreen
            currentUser={user}
            conversationId={route.params.conversationId}
            conversationType={route.params.conversationType}
            title={title}
            photoUrl={photoUrl}
            onBack={() => navigation.goBack()}
        />
    );
}

export function RootNavigator() {
    const { user, loading } = useAuth();
    const [navigationReady, setNavigationReady] = useState(false);
    const [pendingNotification, setPendingNotification] = useState<NotificationRoute | null>(null);

    useEffect(() => {
        const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
            setPendingNotification(getNotificationRoute(response));
        });
        Notifications.getLastNotificationResponseAsync()
            .then((response) => {
                if (response) setPendingNotification(getNotificationRoute(response));
            })
            .catch((error: unknown) => console.warn("Notification response unavailable", error));
        return () => subscription.remove();
    }, []);

    useEffect(() => {
        if (!navigationReady || !user || !pendingNotification || !navigationRef.isReady()) return;
        navigationRef.navigate("Chat", pendingNotification);
        setPendingNotification(null);
    }, [navigationReady, pendingNotification, user]);

    if (loading) return <Loading />;

    return (
        <NavigationContainer ref={navigationRef} onReady={() => setNavigationReady(true)}>
            <Stack.Navigator key={user ? "authenticated" : "unauthenticated"} screenOptions={{ headerShown: false }}>
                {user ? (
                    <>
                        <Stack.Screen name="Conversations" component={ConversationsScreen} />
                        <Stack.Screen name="Users" component={UsersScreen} initialParams={{ mode: "direct" }} />
                        <Stack.Screen name="GroupForm" component={GroupFormScreen} />
                        <Stack.Screen name="Chat" component={ChatRouteScreen} />
                        <Stack.Screen name="Profile" component={ProfileScreen} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
