import { ChatGroup } from "../types/group";

export type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    Conversations: undefined;
    Users: {
        mode: "direct" | "group";
        groupId?: string;
    };
    GroupForm: {
        groupId?: string;
    };
    Chat: {
        conversationId: string;
        conversationType: "direct" | "group";
    };
    Profile: {
        userId: string;
    };
};

export type GroupDraft = Pick<
    ChatGroup,
    "name" | "photoUrl" | "memberIds" | "memberLimit" | "notificationPolicy"
>;
