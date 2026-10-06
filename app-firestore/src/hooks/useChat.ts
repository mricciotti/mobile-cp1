import { useCallback, useEffect, useMemo, useState } from "react";
import { sendMessage, subscribeToMessages } from "../services/chatService";
import { ChatMessage } from "../types/chat";

export function useChat(currentUserId: string, conversationId: string, conversationType: "direct" | "group") {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);
        setMessages([]);

        const unsubscribe = subscribeToMessages(
            conversationId,
            (updatedMessages) => {
                if (!active) return;
                setMessages(updatedMessages);
                setLoading(false);
            },
            (reason) => {
                if (!active) return;
                console.error(reason);
                setError(reason instanceof Error ? reason.message : "Não foi possível carregar as mensagens.");
                setLoading(false);
            }
        );

        return () => {
            active = false;
            unsubscribe();
        };
    }, [conversationId]);

    useEffect(() => {
        if (!error) return;
        const timeout = setTimeout(() => setError(null), 10000);
        return () => clearTimeout(timeout);
    }, [error]);

    const sendText = useCallback(async (text: string) => {
        try {
            await sendMessage(conversationId, currentUserId, text, conversationType);
        } catch (reason) {
            console.error(reason);
            setError(reason instanceof Error ? reason.message : "Não foi possível enviar a mensagem.");
        }
    }, [conversationId, currentUserId, conversationType]);

    const hasMessages = useMemo(() => messages.length > 0, [messages]);
    return { messages, loading, error, sendText, hasMessages };
}
