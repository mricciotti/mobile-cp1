export type DevicePlatform = "ios" | "android";

export type DeviceToken = {
    expoPushToken: string;
    platform: DevicePlatform;
    enabled: boolean;
    updatedAt: number;
};
