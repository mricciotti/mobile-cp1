import { useEffect, useState, } from "react";
import { ActivityIndicator, StyleSheet, View, } from "react-native";
import { SafeAreaProvider, } from "react-native-safe-area-context";
import { onAuthStateChanged, User, } from "firebase/auth";
import { auth, } from "./src/config/firebase";
import { AuthScreen, } from "./src/screens/AuthScreen";
import { HomeScreen, } from "./src/screens/HomeScreen";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth,
      (firebaseUser) => {
        setUser(
          firebaseUser
        );
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <SafeAreaProvider>
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      {user ? (<HomeScreen />) : (<AuthScreen />)}
    </SafeAreaProvider>
  );
}

const styles =
  StyleSheet.create({
    loading: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
    },

  });
