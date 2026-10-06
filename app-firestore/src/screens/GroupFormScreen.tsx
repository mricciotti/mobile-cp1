import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ImagePickerAsset } from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../hooks/useAuth";
import { RootStackParamList } from "../navigation/types";
import { addMember, createGroup, getGroup, MembershipSyncError, removeMember, updateGroup, updateMemberLimit } from "../services/groupService";
import { searchUsers } from "../services/userService";
import { ChatGroup, NotificationPolicy } from "../types/group";
import { PublicUser } from "../types/user";
import { validateGroupMembers, validateGroupName } from "../utils/groupValidation";
import { Avatar } from "../components/Avatar";
import { Button } from "../components/Button";
import { ErrorMessage } from "../components/ErrorMessage";
import { Loading } from "../components/Loading";
import { TextField } from "../components/TextField";
import { colors, radius, spacing } from "../theme/theme";
import { AppShell } from "../components/AppShell";
import { pickImage, uploadImage } from "../services/imageService";

type Props = NativeStackScreenProps<RootStackParamList, "GroupForm">;

const policyOptions: Array<{ value: NotificationPolicy; label: string }> = [
    { value: "all_group_messages", label: "Todas as mensagens" },
    { value: "mentioned_members", label: "Somente menções" },
    { value: "direct_messages_only", label: "Mensagens diretas" },
    { value: "disabled", label: "Desativadas" },
];

export function GroupFormScreen({ route, navigation }: Props) {
    const { user, logout } = useAuth();
    const editing = Boolean(route.params?.groupId);
    const [group, setGroup] = useState<ChatGroup | null>(null);
    const [users, setUsers] = useState<PublicUser[]>([]);
    const [name, setName] = useState("");
    const [photoUrl, setPhotoUrl] = useState("");
    const [selectedPhoto, setSelectedPhoto] = useState<ImagePickerAsset | null>(null);
    const [memberLimit, setMemberLimit] = useState("5");
    const [policy, setPolicy] = useState<NotificationPolicy>("all_group_messages");
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!user) return;
        let active = true;
        setSelectedPhoto(null);
        Promise.all([
            searchUsers(""),
            route.params?.groupId ? getGroup(route.params.groupId) : Promise.resolve(null),
        ]).then(([allUsers, loadedGroup]) => {
            if (!active) return;
            setUsers(allUsers.filter((entry) => entry.uid !== user.uid));
            if (loadedGroup) {
                if (loadedGroup.ownerId !== user.uid) throw new Error("Somente o proprietário pode administrar o grupo.");
                setGroup(loadedGroup);
                setName(loadedGroup.name);
                setPhotoUrl(loadedGroup.photoUrl);
                setMemberLimit(String(loadedGroup.memberLimit));
                setPolicy(loadedGroup.notificationPolicy);
                setSelectedMemberIds(loadedGroup.memberIds);
            }
        }).catch((reason: unknown) => {
            console.error(reason);
            if (active) setError(reason instanceof Error ? reason.message : "Não foi possível carregar o grupo.");
        }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [route.params?.groupId, user]);

    const filteredUsers = useMemo(() => {
        const normalized = search.trim().toLocaleLowerCase();
        return users.filter((entry) => !normalized || entry.name.toLocaleLowerCase().includes(normalized));
    }, [search, users]);

    const displayedMemberCount = user
        ? (editing ? selectedMemberIds.length : new Set([...selectedMemberIds, user.uid]).size)
        : selectedMemberIds.length;

    function toggleMember(uid: string) {
        setSelectedMemberIds((current) => current.includes(uid) ? current.filter((id) => id !== uid) : [...current, uid]);
    }

    async function choosePhoto() {
        if (saving) return;
        try {
            const selected = await pickImage();
            if (selected) setSelectedPhoto(selected);
        } catch (reason: unknown) {
            setError(reason instanceof Error ? reason.message : "Não foi possível selecionar a foto.");
        }
    }

    async function submit() {
        if (!user) return;
        setError("");
        const parsedLimit = Number(memberLimit);
        const memberIds = editing ? selectedMemberIds : Array.from(new Set([...selectedMemberIds, user.uid]));
        const nameError = validateGroupName(name);
        const membersError = validateGroupMembers(user.uid, memberIds, parsedLimit);
        if (nameError || membersError) {
            setError(nameError ?? membersError ?? "Revise os dados do grupo.");
            return;
        }

        try {
            setSaving(true);
            const finalPhotoUrl = selectedPhoto ? await uploadImage(selectedPhoto) : photoUrl.trim();
            if (!group) {
                await createGroup(user.uid, { name, photoUrl: finalPhotoUrl, memberIds: selectedMemberIds, memberLimit: parsedLimit, notificationPolicy: policy });
            } else {
                let current = group;
                if (current.name !== name.trim() || current.photoUrl !== finalPhotoUrl || current.notificationPolicy !== policy) {
                    current = await updateGroup(group.id, user.uid, { name: name.trim(), photoUrl: finalPhotoUrl, notificationPolicy: policy });
                }
                for (const memberId of current.memberIds.filter((id) => !selectedMemberIds.includes(id) && id !== user.uid)) {
                    current = await removeMember(group.id, user.uid, memberId);
                }
                for (const memberId of selectedMemberIds.filter((id) => !current.memberIds.includes(id))) {
                    current = await addMember(group.id, user.uid, memberId);
                }
                if (current.memberLimit !== parsedLimit) await updateMemberLimit(group.id, user.uid, parsedLimit);
            }
            navigation.goBack();
        } catch (reason) {
            console.error(reason);
            setError(reason instanceof MembershipSyncError
                ? `${reason.message} O grupo permanece salvo e pode ser sincronizado novamente.`
                : reason instanceof Error ? reason.message : "Não foi possível salvar o grupo.");
        } finally {
            setSaving(false);
        }
    }

    if (!user) return null;
    if (loading) return <Loading />;

    return (
        <AppShell
            user={user}
            activeSection="groups"
            onMessages={() => navigation.navigate("Conversations")}
            onContacts={() => navigation.navigate("Users", { mode: "direct" })}
            onNewGroup={() => navigation.navigate("GroupForm", {})}
            onProfile={() => navigation.navigate("Profile", { userId: user.uid })}
            onLogout={logout}
        >
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Voltar</Text></Pressable>
                <Text style={styles.title}>{editing ? "Administrar grupo" : "Novo grupo"}</Text>
                <Text style={styles.subtitle}>O owner controla integrantes, limite e notificações.</Text>
                {error ? <ErrorMessage message={error} /> : null}

                <TextField label="Nome do grupo" placeholder="Ex.: Projeto CP2" value={name} onChangeText={setName} editable={!saving} />
                <View style={styles.photoSection}>
                    {selectedPhoto ? <Image source={{ uri: selectedPhoto.uri }} style={styles.photoPreview} /> : <Avatar photoUrl={photoUrl} name={name || "Grupo"} size={88} />}
                    <Button title={selectedPhoto || photoUrl ? "Trocar foto" : "Escolher foto"} variant="outline" onPress={choosePhoto} disabled={saving} />
                    {selectedPhoto ? <Text style={styles.photoHint}>A nova foto será enviada ao salvar.</Text> : null}
                </View>
                <TextField label="Limite de integrantes" placeholder="5" value={memberLimit} onChangeText={(value) => setMemberLimit(value.replace(/\D/g, ""))} editable={!saving} keyboardType="number-pad" />

                <View style={styles.summary}>
                    <Text style={styles.summaryTitle}>Integrantes</Text>
                    <Text style={styles.summaryText}>{displayedMemberCount} de {memberLimit || "0"} · {Math.max(0, Number(memberLimit || 0) - displayedMemberCount)} vagas</Text>
                </View>

                <Text style={styles.sectionTitle}>Notificações do grupo</Text>
                <View style={styles.options}>
                    {policyOptions.map((option) => (
                        <Button key={option.value} title={option.label} variant={policy === option.value ? "primary" : "outline"} onPress={() => setPolicy(option.value)} disabled={saving} />
                    ))}
                </View>

                <Text style={styles.sectionTitle}>Adicionar ou remover integrantes</Text>
                <TextInput value={search} onChangeText={setSearch} placeholder="Buscar por nome" placeholderTextColor={colors.textFaint} style={styles.search} />
                <View style={styles.memberList}>
                    {filteredUsers.map((entry) => {
                        const selected = selectedMemberIds.includes(entry.uid);
                        return (
                            <Pressable key={entry.uid} onPress={() => toggleMember(entry.uid)} disabled={saving} style={[styles.memberRow, selected && styles.memberRowSelected]}>
                                <Avatar photoUrl={entry.photoUrl} name={entry.name} size={40} />
                                <Text style={styles.memberName}>{entry.name}</Text>
                                <Text style={styles.memberAction}>{selected ? "Remover" : "Adicionar"}</Text>
                            </Pressable>
                        );
                    })}
                </View>
                <Button title={editing ? "Salvar alterações" : "Criar grupo"} onPress={submit} loading={saving} disabled={saving} />
            </ScrollView>
        </SafeAreaView>
        </AppShell>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, gap: spacing.md },
    back: { color: colors.primary, fontWeight: "700", fontSize: 16 },
    title: { color: colors.text, fontSize: 28, fontWeight: "800" },
    subtitle: { color: colors.textMuted, fontSize: 14 },
    photoSection: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm },
    photoPreview: { width: 88, height: 88, borderRadius: 44, borderColor: colors.primary, borderWidth: 1.5 },
    photoHint: { color: colors.textFaint, fontSize: 12, textAlign: "center" },
    summary: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: 5 },
    summaryTitle: { color: colors.text, fontWeight: "800" },
    summaryText: { color: colors.textMuted },
    sectionTitle: { color: colors.text, fontSize: 16, fontWeight: "800", marginTop: spacing.sm },
    options: { gap: spacing.sm },
    search: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface, color: colors.text, paddingHorizontal: spacing.md, paddingVertical: 12 },
    memberList: { gap: spacing.sm },
    memberRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface },
    memberRowSelected: { borderColor: colors.primary, backgroundColor: colors.surfaceAlt },
    memberName: { flex: 1, color: colors.text, fontWeight: "700" },
    memberAction: { color: colors.primary, fontSize: 12, fontWeight: "800" },
});
