import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { PublicUser } from "../types/user";
import { colors, radius, spacing } from "../theme/theme";
import { Button } from "./Button";

type CursorSelection = { start: number; end: number };

type MentionDraft = {
    uid: string;
    name: string;
    start: number;
    end: number;
};

interface ChatInputProps {
    currentUserId: string;
    mentionableUsers?: PublicUser[];
    onSend: (text: string, mentionedUserIds: string[]) => void;
    disabled?: boolean;
}

function reconcileMentions(previousText: string, nextText: string, mentions: MentionDraft[]): MentionDraft[] {
    if (previousText === nextText) return mentions;

    let prefixLength = 0;
    while (
        prefixLength < previousText.length
        && prefixLength < nextText.length
        && previousText[prefixLength] === nextText[prefixLength]
    ) {
        prefixLength += 1;
    }

    let suffixLength = 0;
    while (
        suffixLength < previousText.length - prefixLength
        && suffixLength < nextText.length - prefixLength
        && previousText[previousText.length - 1 - suffixLength] === nextText[nextText.length - 1 - suffixLength]
    ) {
        suffixLength += 1;
    }

    const oldChangeEnd = previousText.length - suffixLength;
    const delta = nextText.length - previousText.length;

    return mentions.flatMap((mention) => {
        if (mention.end <= prefixLength) return [mention];
        if (mention.start >= oldChangeEnd) {
            return [{ ...mention, start: mention.start + delta, end: mention.end + delta }];
        }
        return [];
    });
}

export function ChatInput({ currentUserId, mentionableUsers = [], onSend, disabled }: ChatInputProps) {
    const [text, setText] = useState("");
    const [focused, setFocused] = useState(false);
    const [selection, setSelection] = useState<CursorSelection>({ start: 0, end: 0 });
    const [mentions, setMentions] = useState<MentionDraft[]>([]);

    const mentionContext = useMemo(() => {
        if (!mentionableUsers.length || selection.start !== selection.end) return null;
        const beforeCursor = text.slice(0, selection.end);
        const atIndex = beforeCursor.lastIndexOf("@");
        if (atIndex < 0 || (atIndex > 0 && !/\s/.test(beforeCursor[atIndex - 1]))) return null;

        const query = beforeCursor.slice(atIndex + 1);
        if (/\s/.test(query) || query.includes("@") || text.slice(atIndex, selection.end).length === 0) return null;
        const selectedMention = mentions.some((mention) => (
            mention.start === atIndex
            && mention.end === selection.end
            && text.slice(mention.start, mention.end) === `@${mention.name}`
        ));
        if (selectedMention) return null;

        return { atIndex, query: query.toLocaleLowerCase() };
    }, [mentionableUsers, mentions, selection, text]);

    const suggestions = useMemo(() => {
        if (!mentionContext) return [];
        return mentionableUsers
            .filter((user) => user.uid !== currentUserId)
            .filter((user) => user.name.toLocaleLowerCase().includes(mentionContext.query))
            .slice(0, 5);
    }, [currentUserId, mentionContext, mentionableUsers]);

    function handleTextChange(nextText: string) {
        setMentions((current) => reconcileMentions(text, nextText, current));
        setText(nextText);
    }

    function selectMention(user: PublicUser) {
        if (!mentionContext) return;
        const mentionText = `@${user.name}`;
        const before = text.slice(0, mentionContext.atIndex);
        const after = text.slice(selection.end);
        const nextText = `${before}${mentionText} ${after}`;
        const nextEnd = mentionContext.atIndex + mentionText.length;

        setText(nextText);
        setMentions((current) => [
            ...current.filter((mention) => mention.uid !== user.uid),
            { uid: user.uid, name: user.name, start: mentionContext.atIndex, end: nextEnd },
        ].sort((a, b) => a.start - b.start));
        setSelection({ start: nextEnd + 1, end: nextEnd + 1 });
    }

    function handleSend() {
        if (!text.trim()) return;
        const currentMentionIds = mentions
            .filter((mention) => text.slice(mention.start, mention.end) === `@${mention.name}`)
            .map((mention) => mention.uid);
        onSend(text, Array.from(new Set(currentMentionIds)));
        setText("");
        setMentions([]);
        setSelection({ start: 0, end: 0 });
    }

    return (
        <View style={styles.container}>
            {suggestions.length > 0 ? (
                <View style={styles.suggestions}>
                    {suggestions.map((user) => (
                        <Pressable key={user.uid} onPress={() => selectMention(user)} style={styles.suggestion}>
                            <Text style={styles.suggestionName}>{user.name}</Text>
                            <Text style={styles.suggestionHint}>mencionar</Text>
                        </Pressable>
                    ))}
                </View>
            ) : null}
            <View style={styles.composerRow}>
                <TextInput
                    style={[styles.input, focused && styles.inputFocused]}
                    placeholder="Digite uma mensagem"
                    placeholderTextColor={colors.textFaint}
                    value={text}
                    selection={selection}
                    onChangeText={handleTextChange}
                    onSelectionChange={(event) => setSelection(event.nativeEvent.selection)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    editable={!disabled}
                    multiline
                />
                <Button title="Enviar" onPress={handleSend} disabled={disabled || !text.trim()} style={styles.sendButton} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 12, backgroundColor: colors.backgroundAlt, borderTopWidth: 1, borderTopColor: colors.border },
    suggestions: { maxHeight: 180, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface, overflow: "hidden" },
    suggestion: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
    suggestionName: { color: colors.text, fontWeight: "800" },
    suggestionHint: { color: colors.primary, fontSize: 11, fontWeight: "700" },
    composerRow: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
    input: { flex: 1, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 100, fontSize: 15 },
    inputFocused: { borderColor: colors.primary },
    sendButton: { width: 92 },
});
