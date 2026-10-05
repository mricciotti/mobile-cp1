export type PublicUser = {
    uid: string;
    name: string;
    photoUrl: string;
    createdAt: number;
};

export type PrivateUserProfile = {
    email: string;
    phoneNumber: string;
    birthDate: string;
};

export type CompleteUserProfile = PublicUser & PrivateUserProfile;
