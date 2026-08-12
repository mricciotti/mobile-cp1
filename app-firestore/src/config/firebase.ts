import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCXt5WoHLE4Iau9LAD64jxEPPSUhfsNhsE",
    authDomain: "mobile-17db8.firebaseapp.com",
    projectId: "mobile-17db8",
    storageBucket: "mobile-17db8.firebasestorage.app",
    messagingSenderId: "465066727567",
    appId: "1:465066727567:web:a9f4dc2b07a643fcc038fa"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export default app;