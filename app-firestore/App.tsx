import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthContextProvider } from "./src/contexts/AuthContext";
import { useAuth } from "./src/hooks/useAuth";
import { Loading } from "./src/components/Loading";
import { LoginScreen } from "./src/screens/LoginScreen";
import { UsersScreen } from "./src/screens/UsersScreen";
import { ChatScreen } from "./src/screens/ChatScreen";
import { ChatUser } from "./src/types/User";

function AppNavigator() {
    const { user, loading } = useAuth();
    const [activeContact, setActiveContact] = useState<ChatUser | null>(null);

    useEffect(() => {
        if (!user) {
            setActiveContact(null);
        }
    }, [user]);

    if (loading) {
        return <Loading />;
    }

    if (!user) {
        return <LoginScreen />;
    }

    if (activeContact) {
        return (
            <ChatScreen
                currentUser={user}
                otherUser={activeContact}
                onBack={() => setActiveContact(null)}
            />
        );
    }

    return <UsersScreen onSelectContact={setActiveContact} />;
}

export default function App() {
    return (
        <SafeAreaProvider>
            <AuthContextProvider>
                <AppNavigator />
            </AuthContextProvider>
        </SafeAreaProvider>
    );
}
