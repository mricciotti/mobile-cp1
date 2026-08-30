import { initializeApp } from "firebase/app";
import { initializeAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// "getReactNativePersistence" só existe na build React Native do
// firebase/auth (resolvida pelo Metro via o campo "react-native" do
// package.json). O "tsc" usa resolução de módulos do Node e não enxerga
// essa build, então o import nomeado falha só na checagem de tipos —
// em tempo de execução (Metro/Expo) ele existe e funciona normalmente.
// @ts-expect-error - getReactNativePersistence não é visível pela resolução de tipos do Node/tsc
import { getReactNativePersistence } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCXt5WoHLE4Iau9LAD64jxEPPSUhfsNhsE",
    authDomain: "mobile-17db8.firebaseapp.com",
    projectId: "mobile-17db8",
    storageBucket: "mobile-17db8.firebasestorage.app",
    messagingSenderId: "465066727567",
    appId: "1:465066727567:web:a9f4dc2b07a643fcc038fa",
    databaseURL: "https://mobile-17db8-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);

export const database = getDatabase(app);

export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export default app;
