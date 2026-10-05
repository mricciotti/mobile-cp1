import { RootStackParamList } from "../navigation/types";

export function buildConversationId(uidA: string, uidB: string): string {
    return [uidA, uidB].sort().join("_");
}

export function getDirectRouteParams(
    currentUserId: string,
    otherUserId: string
): RootStackParamList["Chat"] {
    return {
        conversationId: buildConversationId(currentUserId, otherUserId),
        conversationType: "direct",
        otherUserId,
    };
}
