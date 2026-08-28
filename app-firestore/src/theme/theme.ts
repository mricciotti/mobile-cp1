// Design tokens centrais do app. Qualquer cor, espaçamento, raio de borda
// ou tipografia usado nas telas/componentes deveria vir daqui, pra manter a
// identidade visual consistente em todo o app.

export const colors = {
    background: "#05070D",
    backgroundAlt: "#0A0F1C",
    surface: "#10141F",
    surfaceAlt: "#161C2E",
    border: "#232B40",
    borderStrong: "#313B57",

    primary: "#3DDCFF",
    primaryDim: "#1C5C6B",
    secondary: "#8B5CF6",

    text: "#EAF2FF",
    textMuted: "#8B95AC",
    textFaint: "#57607A",

    success: "#33E0A1",
    danger: "#FF5C7A",
    dangerBg: "#2A0F16",

    ownBubble: "#1F6FEB",
    receivedBubble: "#1B2233",

    badgePassword: "#57607A",
    badgeGoogle: "#3DDCFF",
    badgeApple: "#C9CEDA",

    white: "#FFFFFF",
    black: "#000000",
} as const;

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
} as const;

export const radius = {
    sm: 8,
    md: 14,
    lg: 20,
    pill: 999,
} as const;

export const typography = {
    title: {
        fontSize: 30,
        fontWeight: "800",
        letterSpacing: 0.3,
    },
    subtitle: {
        fontSize: 15,
        fontWeight: "500",
    },
    body: {
        fontSize: 15,
        fontWeight: "400",
    },
    label: {
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 0.6,
    },
    button: {
        fontSize: 15,
        fontWeight: "700",
        letterSpacing: 0.4,
    },
} as const;

export const glow = {
    primary: {
        shadowColor: colors.primary,
        shadowOpacity: 0.45,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
    },
    card: {
        shadowColor: colors.black,
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
} as const;
