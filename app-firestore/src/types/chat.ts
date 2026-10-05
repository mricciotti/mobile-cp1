export type DirectConversation = {
    id: string;
    type: "direct";
    participantIds: [string, string];
    createdAt: number;
};

export type MessageTarget =
    | { type: "conversation" }
    | { type: "member"; memberId: string };

/** RTDB authorization mirror only; Firestore remains authoritative. */
export type ConversationMembers = Record<string, true>;

export type ChatMessage = {
    id: string;
    conversationId: string;
    conversationType: "direct" | "group";
    senderId: string;
    text: string;
    target: MessageTarget;
    mentionedUserIds: string[];
    createdAt: number;
};
