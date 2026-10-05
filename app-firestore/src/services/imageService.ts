import * as ImagePicker from "expo-image-picker";

const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const CLOUDINARY_FOLDER = "mobile-cp2";

export type ImageServiceErrorCode =
    | "permission-denied"
    | "configuration-missing"
    | "invalid-image"
    | "upload-failed";

export class ImageServiceError extends Error {
    constructor(
        public readonly code: ImageServiceErrorCode,
        message: string
    ) {
        super(message);
        this.name = "ImageServiceError";
    }
}

interface CloudinaryUploadResponse {
    secure_url?: unknown;
    error?: {
        message?: unknown;
    };
}

type ReactNativeUploadFile = {
    uri: string;
    type: string;
    name: string;
};

function isCloudinaryUploadResponse(value: unknown): value is CloudinaryUploadResponse {
    return typeof value === "object" && value !== null;
}

function getFileName(asset: ImagePicker.ImagePickerAsset): string {
    if (asset.fileName?.trim()) {
        return asset.fileName;
    }

    const extension = asset.mimeType?.split("/")[1] ?? "jpg";
    return `image-${Date.now()}.${extension}`;
}

function getErrorMessage(payload: unknown): string {
    if (isCloudinaryUploadResponse(payload) && payload.error && typeof payload.error.message === "string") {
        return payload.error.message;
    }

    return "Não foi possível enviar a imagem para o Cloudinary.";
}

export async function pickImage(): Promise<ImagePicker.ImagePickerAsset | null> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
        throw new ImageServiceError(
            "permission-denied",
            "Permissão para acessar as fotos foi negada."
        );
    }

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        exif: false,
        base64: false,
    });

    if (result.canceled) {
        return null;
    }

    return result.assets[0] ?? null;
}

export async function uploadImage(asset: ImagePicker.ImagePickerAsset): Promise<string> {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
        throw new ImageServiceError(
            "configuration-missing",
            "A configuração pública do Cloudinary não foi encontrada."
        );
    }

    if (asset.type && asset.type !== "image") {
        throw new ImageServiceError("invalid-image", "Selecione um arquivo de imagem válido.");
    }

    const mimeType = asset.mimeType ?? "image/jpeg";
    const file: ReactNativeUploadFile = {
        uri: asset.uri,
        type: mimeType,
        name: getFileName(asset),
    };
    const formData = new FormData();

    formData.append("file", file as unknown as Blob);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", CLOUDINARY_FOLDER);

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: "POST",
                body: formData,
            }
        );
        const payload: unknown = await response.json();

        if (!response.ok) {
            throw new ImageServiceError("upload-failed", getErrorMessage(payload));
        }

        if (
            !isCloudinaryUploadResponse(payload) ||
            typeof payload.secure_url !== "string" ||
            !payload.secure_url
        ) {
            throw new ImageServiceError(
                "upload-failed",
                "O Cloudinary não retornou uma URL válida para a imagem."
            );
        }

        return payload.secure_url;
    } catch (error) {
        if (error instanceof ImageServiceError) {
            throw error;
        }

        console.error(error);
        throw new ImageServiceError(
            "upload-failed",
            "Não foi possível conectar ao Cloudinary. Verifique sua conexão e tente novamente."
        );
    }
}

export async function pickAndUploadImage(): Promise<string | null> {
    const asset = await pickImage();

    if (!asset) {
        return null;
    }

    return uploadImage(asset);
}

export const cloudinaryUploadFolder = CLOUDINARY_FOLDER;
