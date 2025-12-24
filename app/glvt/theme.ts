export const GLVT_THEME = {
    colors: {
        background: {
            primary: "#2D2D2D", // Deep Charcoal - The Foundation
            secondary: "#3a3a3a", // Slightly lighter for Cards
            tertiary: "#1a1a1a", // Darker for contrast/modals
            overlay: "rgba(0,0,0,0.8)", // For heavy mood overlays
        },
        text: {
            primary: "#F1EDE5", // Cream/Off-White - Headers
            secondary: "#D7D5D2", // Muted Silver - Body
            tertiary: "rgba(215, 213, 210, 0.4)", // Very subtle for labels
            accent: "#C8A871", // Gold - Active states / Highlights
        },
        accent: {
            primary: "#C8A871", // The Brand Gold
            secondary: "#d4b57a", // Lighter Gold for hover
            muted: "rgba(200, 168, 113, 0.2)", // Subtle Gold wash
        },
        status: {
            success: "#C8A871", // Use Gold for success, not green
            error: "#EF4444", // Keep standard red but muted maybe? Or strictly textual.
        }
    },
    fonts: {
        serif: 'serif', // Placeholder for the actual serif font family string if needed
        sans: '"Montserrat", sans-serif',
    },
    spacing: {
        pagePadding: "px-6 py-8",
        sectionGap: "space-y-8",
    },
    layout: {
        maxWidth: "max-w-md mx-auto",
    },
    effects: {
        cardShadow: "shadow-[0_0_20px_rgba(200,168,113,0.05)]",
        activeGlow: "shadow-[0_0_30px_rgba(200,168,113,0.3)]",
    }
} as const;

export const commonStyles = {
    pageContainer: `min-h-screen bg-[${GLVT_THEME.colors.background.primary}] text-[${GLVT_THEME.colors.text.primary}] font-sans selection:bg-[${GLVT_THEME.colors.accent.primary}] selection:text-[${GLVT_THEME.colors.background.primary}]`,
    headerSerif: `text-3xl font-serif text-[${GLVT_THEME.colors.text.primary}]`,
    subHeaderSans: `text-xs text-[${GLVT_THEME.colors.text.secondary}]/60 uppercase tracking-[0.15em] font-medium`,
    card: `bg-[${GLVT_THEME.colors.background.secondary}] border border-[${GLVT_THEME.colors.text.secondary}]/15 p-6 rounded-2xl shadow-[0_0_20px_rgba(200,168,113,0.05)]`,
    buttonPrimary: `w-full bg-[${GLVT_THEME.colors.accent.primary}] hover:bg-[${GLVT_THEME.colors.accent.secondary}] text-[${GLVT_THEME.colors.background.primary}] font-bold text-sm uppercase tracking-[0.2em] py-4 rounded-xl transition-all hover:scale-[1.01]`,
    buttonOutline: `w-full bg-transparent border border-[${GLVT_THEME.colors.text.secondary}]/30 text-[${GLVT_THEME.colors.text.secondary}] hover:text-[${GLVT_THEME.colors.text.primary}] hover:border-[${GLVT_THEME.colors.text.primary}] font-bold text-sm uppercase tracking-[0.2em] py-4 rounded-xl transition-all`,
};
