import { ReactNode } from "react";
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { PublicUser } from "../types/user";
import { Avatar } from "./Avatar";
import { colors, radius, spacing } from "../theme/theme";

export type AppSection = "messages" | "contacts" | "groups" | "profile";

type AppShellProps = {
    user: PublicUser;
    activeSection: AppSection;
    children: ReactNode;
    onMessages: () => void;
    onContacts: () => void;
    onNewGroup: () => void;
    onProfile: () => void;
    onLogout: () => void;
};

const navigationItems: Array<{ key: AppSection; label: string; symbol: string }> = [
    { key: "messages", label: "Mensagens", symbol: "▣" },
    { key: "contacts", label: "Contatos", symbol: "♧" },
    { key: "groups", label: "Novo grupo", symbol: "+" },
    { key: "profile", label: "Perfil", symbol: "●" },
];

export function AppShell({ user, activeSection, children, onMessages, onContacts, onNewGroup, onProfile, onLogout }: AppShellProps) {
    const { width } = useWindowDimensions();
    const showSidebar = Platform.OS === "web" && width >= 900;
    const actions: Record<AppSection, () => void> = {
        messages: onMessages,
        contacts: onContacts,
        groups: onNewGroup,
        profile: onProfile,
    };

    return (
        <View style={[styles.shell, !showSidebar && styles.compactShell]}>
            {showSidebar ? (
                <View style={styles.sidebar}>
                    <View style={styles.brand}>
                        <View style={styles.brandMark}><Text style={styles.brandMarkText}>✦</Text></View>
                        <View>
                            <Text style={styles.brandTitle}>CP2 CHAT</Text>
                            <Text style={styles.brandSubtitle}>conversas em tempo real</Text>
                        </View>
                    </View>

                    <View style={styles.sidebarIdentity}>
                        <Avatar photoUrl={user.photoUrl} name={user.name} size={48} />
                        <View style={styles.identityText}>
                            <Text style={styles.identityLabel}>LOGADO COMO</Text>
                            <Text style={styles.identityName} numberOfLines={1}>{user.name}</Text>
                        </View>
                        <View style={styles.onlineDot} />
                    </View>

                    <View style={styles.navigation}>
                        {navigationItems.map((item) => (
                            <Pressable
                                key={item.key}
                                onPress={actions[item.key]}
                                style={({ pressed }) => [styles.navItem, activeSection === item.key && styles.navItemActive, pressed && styles.navItemPressed]}
                            >
                                <Text style={[styles.navSymbol, activeSection === item.key && styles.navTextActive]}>{item.symbol}</Text>
                                <Text style={[styles.navLabel, activeSection === item.key && styles.navTextActive]}>{item.label}</Text>
                            </Pressable>
                        ))}
                    </View>

                    <View style={styles.sidebarFooter}>
                        <Text style={styles.footerHint}>Seu espaço de conversas</Text>
                        <Pressable onPress={onLogout} style={styles.logout}>
                            <Text style={styles.logoutSymbol}>↪</Text>
                            <Text style={styles.logoutText}>Sair</Text>
                        </Pressable>
                    </View>
                </View>
            ) : null}

            <View style={[styles.main, !showSidebar && styles.compactMain]}>
                {children}
                {!showSidebar ? (
                    <View style={styles.mobileNavigation}>
                        {navigationItems.filter((item) => item.key !== "groups").map((item) => (
                            <Pressable key={item.key} onPress={actions[item.key]} style={styles.mobileNavItem}>
                                <Text style={[styles.mobileNavSymbol, activeSection === item.key && styles.navTextActive]}>{item.symbol}</Text>
                                <Text style={[styles.mobileNavLabel, activeSection === item.key && styles.navTextActive]}>{item.label}</Text>
                            </Pressable>
                        ))}
                    </View>
                ) : null}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    shell: { flex: 1, flexDirection: "row", backgroundColor: colors.backgroundAlt },
    compactShell: { flexDirection: "column" },
    sidebar: { width: 248, padding: spacing.md, backgroundColor: colors.backgroundAlt, borderRightWidth: 1, borderRightColor: colors.border, justifyContent: "space-between" },
    brand: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.sm, marginBottom: spacing.xl },
    brandMark: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary },
    brandMarkText: { color: colors.background, fontSize: 19, fontWeight: "900" },
    brandTitle: { color: colors.text, fontSize: 13, fontWeight: "900", letterSpacing: 1.5 },
    brandSubtitle: { color: colors.textFaint, fontSize: 10, marginTop: 2 },
    sidebarIdentity: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.sm, marginBottom: spacing.lg, borderRadius: radius.md, backgroundColor: colors.surface },
    identityText: { flex: 1, minWidth: 0 },
    identityLabel: { color: colors.textFaint, fontSize: 9, fontWeight: "800", letterSpacing: 1 },
    identityName: { color: colors.text, fontSize: 14, fontWeight: "800", marginTop: 2 },
    onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
    navigation: { gap: spacing.xs, flex: 1 },
    navItem: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.md, borderRadius: radius.md },
    navItemActive: { backgroundColor: colors.primaryDim, borderWidth: 1, borderColor: colors.primary },
    navItemPressed: { opacity: 0.7 },
    navSymbol: { width: 22, textAlign: "center", color: colors.textMuted, fontSize: 20, fontWeight: "700" },
    navLabel: { color: colors.textMuted, fontSize: 14, fontWeight: "700" },
    navTextActive: { color: colors.primary },
    sidebarFooter: { gap: spacing.sm },
    footerHint: { color: colors.textFaint, fontSize: 11, paddingHorizontal: spacing.sm },
    logout: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.md, borderRadius: radius.md },
    logoutSymbol: { color: colors.textMuted, fontSize: 21 },
    logoutText: { color: colors.textMuted, fontSize: 14, fontWeight: "700" },
    main: { flex: 1, minWidth: 0 },
    compactMain: { width: "100%" },
    mobileNavigation: { flexDirection: "row", justifyContent: "space-around", paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.backgroundAlt },
    mobileNavItem: { alignItems: "center", gap: 2, paddingHorizontal: spacing.sm },
    mobileNavSymbol: { color: colors.textMuted, fontSize: 18 },
    mobileNavLabel: { color: colors.textMuted, fontSize: 10, fontWeight: "700" },
});
