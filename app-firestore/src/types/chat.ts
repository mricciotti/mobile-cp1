export interface Conversation {
    id: string;
    participants: [string, string];
    createdAt: number;
}

export interface ChatMessage {
    id: string;
    conversationId: string;
    senderId: string;
    receiverId: string;
    text: string;
    createdAt: number;
}
