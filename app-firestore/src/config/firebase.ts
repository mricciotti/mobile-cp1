import { initializeApp } from "firebase/app";
import { initializeAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import firebaseConfig from "../../firebaseConfig.json";

// "getReactNativePersistence" só existe na build React Native do
// firebase/auth (resolvida pelo Metro via o campo "react-native" do
// package.json). O "tsc" usa resolução de módulos do Node e não enxerga
// essa build, então o import nomeado falha só na checagem de tipos —
// em tempo de execução (Metro/Expo) ele existe e funciona normalmente.
// @ts-expect-error - getReactNativePersistence não é visível pela resolução de tipos do Node/tsc
import { getReactNativePersistence } from "firebase/auth";

const app = initializeApp(firebaseConfig);

export const database = getDatabase(app);
export const firestore = getFirestore(app);

export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export default app;
