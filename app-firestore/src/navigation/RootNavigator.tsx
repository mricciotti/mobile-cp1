import { useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator, NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { Platform } from "react-native";
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
import { GroupInfoScreen } from "../screens/GroupInfoScreen";
import { UsersScreen } from "../screens/UsersScreen";
import { ConversationsScreen } from "../screens/ConversationsScreen";
import { ErrorMessage } from "../components/ErrorMessage";
import { Loading } from "../components/Loading";
import { RootStackParamList } from "./types";
import { PublicUser } from "../types/user";

const Stack = createNativeStackNavigator<RootStackParamList>();
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

type ChatRouteProps = NativeStackScreenProps<RootStackParamList, "Chat">;

function ChatRouteScreen({ route, navigation }: ChatRouteProps) {
    const { user, logout } = useAuth();
    const [title, setTitle] = useState("");
    const [photoUrl, setPhotoUrl] = useState("");
    const [mentionableUsers, setMentionableUsers] = useState<PublicUser[]>([]);
    const [memberProfiles, setMemberProfiles] = useState<Record<string, PublicUser>>({});
    const [directOtherUserId, setDirectOtherUserId] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);
        setTitle("");
        setPhotoUrl("");
        setMentionableUsers([]);
        setMemberProfiles({});
        setDirectOtherUserId("");

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
                    setDirectOtherUserId(otherId);
                }
            } else {
                const group = await getGroup(route.params.conversationId);
                const profiles = group
                    ? await Promise.all(group.memberIds.filter((memberId) => memberId !== user.uid).map((memberId) => getPublicUser(memberId)))
                    : [];
                if (!group || !group.memberIds.includes(user.uid)) throw new Error("Grupo indisponÃ­vel.");
                if (active) {
                    setTitle(group.name);
                    setPhotoUrl(group.photoUrl);
                    const resolvedProfiles = profiles.flatMap((profile) => profile ? [profile] : []);
                    setMentionableUsers(resolvedProfiles.filter((profile) => profile.uid !== user.uid));
                    setMemberProfiles(Object.fromEntries(resolvedProfiles.map((profile) => [profile.uid, profile])));
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
            mentionableUsers={mentionableUsers}
            memberProfiles={memberProfiles}
            onBack={() => navigation.goBack()}
            onMessages={() => navigation.navigate("Conversations")}
            onContacts={() => navigation.navigate("Users", { mode: "direct" })}
            onNewGroup={() => navigation.navigate("GroupForm", {})}
            onProfile={() => navigation.navigate("Profile", { userId: user.uid })}
            onLogout={logout}
            onOpenInfo={() => {
                if (route.params.conversationType === "direct" && directOtherUserId) {
                    navigation.navigate("Profile", { userId: directOtherUserId });
                } else if (route.params.conversationType === "group") {
                    navigation.navigate("GroupInfo", { groupId: route.params.conversationId });
                }
            }}
        />
    );
}

export function RootNavigator() {
    const { user, loading } = useAuth();
    const [navigationReady, setNavigationReady] = useState(false);
    const [pendingNotification, setPendingNotification] = useState<NotificationRoute | null>(null);

    useEffect(() => {
        if (Platform.OS === "web") return;

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
                        <Stack.Screen name="GroupInfo" component={GroupInfoScreen} />
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
