import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AuthContextProvider } from "./src/contexts/AuthContext";
import { RootNavigator } from "./src/navigation/RootNavigator";

export default function App() {
    return (
        <SafeAreaProvider>
            <StatusBar style="light" />
            <AuthContextProvider>
                <RootNavigator />
            </AuthContextProvider>
        </SafeAreaProvider>
    );
}
