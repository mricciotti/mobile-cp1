import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { doc, setDoc } from "firebase/firestore";
import { firestore } from "../config/firebase";

export type NotificationRoute = {
    conversationId: string;
    conversationType: "direct" | "group";
};

if (Platform.OS !== "web") {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
        }),
    });
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

export function getNotificationRoute(response: Notifications.NotificationResponse): NotificationRoute | null {
    const data: unknown = response.notification.request.content.data;
    if (!isRecord(data)
        || typeof data.conversationId !== "string"
        || (data.conversationType !== "direct" && data.conversationType !== "group")) {
        return null;
    }
    return {
        conversationId: data.conversationId,
        conversationType: data.conversationType,
    };
}

export async function registerPushDevice(uid: string): Promise<string | null> {
    if (Platform.OS === "web") return null;

    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("messages", {
            name: "Mensagens",
            importance: Notifications.AndroidImportance.DEFAULT,
            sound: "default",
        });
    }

    const current = await Notifications.getPermissionsAsync();
    const permission = current.granted
        ? current
        : await Notifications.requestPermissionsAsync();
    if (!permission.granted) return null;

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    if (!token) return null;

    const deviceId = encodeURIComponent(token);
    await setDoc(doc(firestore, "users", uid, "devices", deviceId), {
        expoPushToken: token,
        enabled: true,
        platform: Platform.OS,
        updatedAt: Date.now(),
    }, { merge: true });
    return token;
}
