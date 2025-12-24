/**
 * GLVT THEME CONFIGURATION
 * 
 * Edit these values to change the entire app's color scheme.
 * All GLVT pages will automatically use these colors.
 */

export const glvtColors = {
    // ═══════════════════════════════════════════════════════════════
    // BASE COLORS - GLVT Brown Book Palette
    // ═══════════════════════════════════════════════════════════════

    // Background colors
    background: {
        primary: '#2D2D2D',      // Main app background (Charcoal)
        secondary: '#3a3a3a',    // Cards, panels (Lighter charcoal)
        tertiary: '#454545',     // Elevated elements
    },

    // Text colors
    text: {
        primary: '#F1EDE5',      // Main text (Cream)
        secondary: '#D7D5D2',    // Secondary text (Soft Gray)
        tertiary: '#9ca3af',     // Tertiary text (gray-400)
        muted: '#6b7280',        // Muted text (gray-500)
    },

    // Accent/Highlight colors
    accent: {
        primary: '#C8A871',      // Main accent (Gold from brown book)
        secondary: '#D3A298',    // Rose Gold accent
        hover: '#d4b57a',        // Hover state (lighter gold)
        active: '#b89850',       // Active state (darker gold)
    },

    // Border colors
    border: {
        default: 'rgba(215, 213, 210, 0.15)',  // Soft Gray with opacity
        subtle: 'rgba(215, 213, 210, 0.08)',   // Subtle borders
        accent: '#C8A871',                      // Gold borders
    },

    // State colors
    state: {
        success: '#C8A871',      // Success state (Gold)
        warning: '#D3A298',      // Warning state (Rose Gold)
        error: '#ef4444',        // Error state (red)
        info: '#D7D5D2',         // Info state (Soft Gray)
    },

    // Component-specific colors
    components: {
        // Buttons
        buttonPrimary: '#C8A871',           // Primary button background (Gold)
        buttonPrimaryText: '#2D2D2D',       // Primary button text (Charcoal)
        buttonPrimaryHover: '#d4b57a',      // Primary button hover

        buttonSecondary: 'transparent',     // Secondary button background
        buttonSecondaryBorder: 'rgba(215, 213, 210, 0.3)',
        buttonSecondaryText: '#F1EDE5',
        buttonSecondaryHover: '#C8A871',

        // Cards
        cardBackground: '#3a3a3a',
        cardBorder: 'rgba(215, 213, 210, 0.15)',
        cardHoverBorder: 'rgba(200, 168, 113, 0.5)',

        // Inputs
        inputBackground: '#454545',
        inputBorder: 'rgba(215, 213, 210, 0.15)',
        inputFocusBorder: '#C8A871',
        inputText: '#F1EDE5',
        inputPlaceholder: '#9ca3af',

        // Progress bars
        progressBackground: '#454545',
        progressFill: '#C8A871',

        // Badges/Tags
        badgeBackground: 'rgba(200, 168, 113, 0.2)',
        badgeText: '#C8A871',
        badgeBorder: 'rgba(200, 168, 113, 0.3)',
    },

    // ═══════════════════════════════════════════════════════════════
    // QUICK PRESETS - Uncomment one to use
    // ═══════════════════════════════════════════════════════════════

    // Preset 1: Emerald (Original)
    // accent: { primary: '#10b981', hover: '#34d399', active: '#059669' }

    // Preset 2: Purple Luxury
    // accent: { primary: '#a855f7', hover: '#c084fc', active: '#9333ea' }

    // Preset 3: Rose Gold
    // accent: { primary: '#e11d48', hover: '#fb7185', active: '#be123c' }

    // Preset 4: Ocean Blue
    // accent: { primary: '#0ea5e9', hover: '#38bdf8', active: '#0284c7' }

    // Preset 5: Champagne Gold (Current)
    // accent: { primary: '#C8A96A', hover: '#d4b57a', active: '#b89850' }
};

// ═══════════════════════════════════════════════════════════════
// TYPOGRAPHY CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export const glvtFonts = {
    // Logo and display titles
    title: 'serif',  // Change to your custom font name

    // Body text and UI
    body: '"Montserrat", sans-serif',

    // Monospace (for numbers, stats)
    mono: '"SF Mono", "Monaco", "Courier New", monospace',
};

// ═══════════════════════════════════════════════════════════════
// SPACING & SIZING
// ═══════════════════════════════════════════════════════════════

export const glvtSpacing = {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
};

// ═══════════════════════════════════════════════════════════════
// EFFECTS
// ═══════════════════════════════════════════════════════════════

export const glvtEffects = {
    // Border radius - Softer, more elegant
    borderRadius: {
        none: '0px',
        sm: '6px',      // Subtle curves
        md: '12px',     // Default - elegant rounded
        lg: '16px',     // Larger elements
        xl: '20px',     // Hero elements
        full: '9999px', // Pills/circles
    },

    // Shadows - Subtle outer glows for depth
    shadow: {
        none: 'none',
        subtle: '0 0 20px rgba(200, 168, 113, 0.08)',           // Soft gold glow
        card: '0 4px 24px rgba(0, 0, 0, 0.12), 0 0 16px rgba(200, 168, 113, 0.06)',  // Card with glow
        hover: '0 8px 32px rgba(0, 0, 0, 0.16), 0 0 24px rgba(200, 168, 113, 0.12)', // Elevated hover
        focus: '0 0 0 3px rgba(200, 168, 113, 0.2)',            // Focus ring
    },

    // Transitions
    transition: {
        fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
        normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
        slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
    },

    // Blur effects
    blur: {
        sm: '4px',
        md: '8px',
        lg: '16px',
        xl: '24px',
    },
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTION - Get color with opacity
// ═══════════════════════════════════════════════════════════════

export function withOpacity(color: string, opacity: number): string {
    // Convert hex to rgba
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// ═══════════════════════════════════════════════════════════════
// EXPORT COMPLETE THEME
// ═══════════════════════════════════════════════════════════════

export const glvtTheme = {
    colors: glvtColors,
    fonts: glvtFonts,
    spacing: glvtSpacing,
    effects: glvtEffects,
};

export default glvtTheme;
