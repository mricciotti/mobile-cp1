import { useCallback, useEffect, useMemo, useState } from "react";
import { findOrCreateConversation, sendMessage, subscribeToMessages } from "../services/chatService";
import { ChatMessage } from "../types/chat";

export function useChat(currentUserId: string, otherUserId: string) {
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        let unsubscribe: (() => void) | undefined;

        setLoading(true);
        setError(null);
        setMessages([]);

        findOrCreateConversation(currentUserId, otherUserId)
            .then((conversation) => {
                if (!active) {
                    return;
                }

                setConversationId(conversation.id);
                unsubscribe = subscribeToMessages(conversation.id, (updatedMessages) => {
                    setMessages(updatedMessages);
                    setLoading(false);
                });
            })
            .catch((err) => {
                console.error(err);
                if (active) {
                    setError("Não foi possível carregar a conversa.");
                    setLoading(false);
                }
            });

        return () => {
            active = false;
            unsubscribe?.();
        };
    }, [currentUserId, otherUserId]);

    useEffect(() => {
        if (!error) {
            return;
        }

        const timeout = setTimeout(() => setError(null), 10000);
        return () => clearTimeout(timeout);
    }, [error]);

    const sendText = useCallback(
        async (text: string) => {
            if (!conversationId) {
                return;
            }

            try {
                await sendMessage(conversationId, currentUserId, otherUserId, text);
            } catch (err) {
                console.error(err);
                setError("Não foi possível enviar a mensagem.");
            }
        },
        [conversationId, currentUserId, otherUserId]
    );

    const hasMessages = useMemo(() => messages.length > 0, [messages]);

    return { messages, loading, error, sendText, hasMessages };
}
