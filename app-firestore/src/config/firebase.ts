import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

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

export const auth = getAuth(app);

export default app;
