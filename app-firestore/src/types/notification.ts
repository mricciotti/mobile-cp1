export type DevicePlatform = "ios" | "android";

export type DeviceToken = {
    token: string;
    platform: DevicePlatform;
    enabled: boolean;
    updatedAt: number;
};
