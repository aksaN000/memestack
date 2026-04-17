// ============================================================================
// ThemeContext — MemeStack design system
// ----------------------------------------------------------------------------
// This file is the single source of truth for the visual language. Every page
// should consume tokens from here rather than hardcoding colors, radii, or
// shadows.
//
// Design direction: "meme-native playful" — bold, high-contrast, chunky offset
// shadows, 2px borders, 16px corner radii, electric pink/purple accent on a
// clean cream (light) or deep navy (dark) canvas. Professional shipping-quality
// while clearly fun.
// ============================================================================

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useAuth } from './AuthContext';

const ThemeContext = createContext(null);

export const useThemeMode = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useThemeMode must be used within a ThemeProvider');
    }
    return context;
};

// ---------------------------------------------------------------------------
// Color schemes — each scheme redefines only accent colors; structural tokens
// (surfaces, radii, borders, shadows) stay the same across schemes so the app
// feels cohesive no matter which accent the user picks.
// ---------------------------------------------------------------------------
const colorSchemes = {
    default: {
        name: 'Electric',
        emoji: '⚡',
        light: {
            primary: '#7C3AED',   // vivid purple
            secondary: '#EC4899', // hot pink
            accent: '#F59E0B',    // amber highlight
        },
        dark: {
            primary: '#A78BFA',
            secondary: '#F472B6',
            accent: '#FBBF24',
        },
    },
    neon: {
        name: 'Neon',
        emoji: '🌈',
        light: {
            primary: '#06B6D4',   // cyan
            secondary: '#D946EF', // magenta
            accent: '#84CC16',    // lime
        },
        dark: {
            primary: '#22D3EE',
            secondary: '#E879F9',
            accent: '#A3E635',
        },
    },
    sunset: {
        name: 'Sunset',
        emoji: '🌅',
        light: {
            primary: '#F97316',
            secondary: '#EF4444',
            accent: '#FACC15',
        },
        dark: {
            primary: '#FB923C',
            secondary: '#F87171',
            accent: '#FDE047',
        },
    },
    mint: {
        name: 'Mint',
        emoji: '🌿',
        light: {
            primary: '#059669',
            secondary: '#14B8A6',
            accent: '#F59E0B',
        },
        dark: {
            primary: '#34D399',
            secondary: '#5EEAD4',
            accent: '#FBBF24',
        },
    },
};

// ---------------------------------------------------------------------------
// Structural palette — the frame around the accent. Intentionally limited.
// ---------------------------------------------------------------------------
const structural = {
    light: {
        bg: '#FFF8F0',           // warm off-white canvas
        bgAlt: '#FEF3EC',         // slightly toasted for striped sections
        surface: '#FFFFFF',        // cards / paper
        surfaceSubtle: '#F9F5EF',
        border: '#1A1A2E',         // near-black for bold outlines
        borderSoft: '#D4D4D8',
        divider: 'rgba(26, 26, 46, 0.08)',
        textPrimary: '#0F172A',
        textSecondary: '#475569',
        textMuted: '#94A3B8',
        shadowColor: 'rgba(26, 26, 46, 1)',
    },
    dark: {
        bg: '#0A0A1A',             // deep navy canvas
        bgAlt: '#0F0F24',
        surface: '#13132B',         // cards
        surfaceSubtle: '#1B1B38',
        border: '#F8FAFC',          // near-white for outlines on dark
        borderSoft: '#334155',
        divider: 'rgba(248, 250, 252, 0.12)',
        textPrimary: '#F8FAFC',
        textSecondary: '#CBD5E1',
        textMuted: '#64748B',
        shadowColor: 'rgba(0, 0, 0, 1)',
    },
};

// Semantic status colors — consistent across schemes
const status = {
    success: { main: '#16A34A', dark: '#15803D', light: '#86EFAC' },
    warning: { main: '#F59E0B', dark: '#D97706', light: '#FCD34D' },
    error:   { main: '#DC2626', dark: '#991B1B', light: '#FCA5A5' },
    info:    { main: '#2563EB', dark: '#1D4ED8', light: '#93C5FD' },
};

export const ThemeProvider = ({ children }) => {
    const { user } = useAuth();
    const [mode, setMode] = useState('light');
    const [colorScheme, setColorScheme] = useState('default');

    // Initialize from user prefs → localStorage → system preference.
    useEffect(() => {
        if (user?.preferences?.theme) {
            setMode(user.preferences.theme);
        } else {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'light' || savedTheme === 'dark') {
                setMode(savedTheme);
            } else if (typeof window !== 'undefined' && window.matchMedia) {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                setMode(prefersDark ? 'dark' : 'light');
            }
        }
        const savedScheme = localStorage.getItem('colorScheme');
        if (savedScheme && colorSchemes[savedScheme]) {
            setColorScheme(savedScheme);
        }
    }, [user]);

    useEffect(() => { localStorage.setItem('theme', mode); }, [mode]);
    useEffect(() => { localStorage.setItem('colorScheme', colorScheme); }, [colorScheme]);

    const toggleTheme = () => setMode((m) => (m === 'light' ? 'dark' : 'light'));
    const setTheme = (newMode) => setMode(newMode);
    const setThemeColorScheme = (scheme) => {
        if (colorSchemes[scheme]) setColorScheme(scheme);
    };

    const accent = colorSchemes[colorScheme][mode];
    const surface = structural[mode];

    // MUI theme — memoized so reference stability is preserved across rerenders.
    const theme = useMemo(() => createTheme({
        palette: {
            mode,
            primary: {
                main: accent.primary,
                light: accent.secondary,
                dark: accent.primary,
                contrastText: '#FFFFFF',
            },
            secondary: {
                main: accent.secondary,
                light: accent.accent,
                dark: accent.secondary,
                contrastText: '#FFFFFF',
            },
            success: status.success,
            warning: status.warning,
            error:   status.error,
            info:    status.info,
            background: {
                default: surface.bg,
                paper: surface.surface,
            },
            text: {
                primary: surface.textPrimary,
                secondary: surface.textSecondary,
                disabled: surface.textMuted,
            },
            divider: surface.divider,
            action: {
                hover: mode === 'light' ? 'rgba(26, 26, 46, 0.04)' : 'rgba(248, 250, 252, 0.08)',
                selected: mode === 'light' ? 'rgba(26, 26, 46, 0.08)' : 'rgba(248, 250, 252, 0.12)',
                disabled: surface.textMuted,
            },
            // Custom tokens — read via theme.palette.brand.*
            brand: {
                accent: accent.accent,
                surfaceSubtle: surface.surfaceSubtle,
                bgAlt: surface.bgAlt,
                border: surface.border,
                borderSoft: surface.borderSoft,
                shadowColor: surface.shadowColor,
                // Gradients used for hero sections and CTA buttons
                gradient: `linear-gradient(135deg, ${accent.primary} 0%, ${accent.secondary} 100%)`,
                gradientSoft: mode === 'light'
                    ? `linear-gradient(135deg, ${accent.primary}14 0%, ${accent.secondary}14 100%)`
                    : `linear-gradient(135deg, ${accent.primary}22 0%, ${accent.secondary}22 100%)`,
            },
        },
        typography: {
            fontFamily: '"Inter", "Space Grotesk", "Helvetica", "Arial", sans-serif',
            h1: { fontSize: '3rem',   fontWeight: 900, letterSpacing: '-0.035em', lineHeight: 1.05 },
            h2: { fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em',  lineHeight: 1.1 },
            h3: { fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.15 },
            h4: { fontSize: '1.375rem', fontWeight: 700, letterSpacing: '-0.02em',  lineHeight: 1.25 },
            h5: { fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.01em',  lineHeight: 1.3 },
            h6: { fontSize: '1rem',     fontWeight: 700, lineHeight: 1.35 },
            subtitle1: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.5 },
            subtitle2: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.5 },
            body1: { fontSize: '1rem', lineHeight: 1.6 },
            body2: { fontSize: '0.9rem', lineHeight: 1.55 },
            button: { textTransform: 'none', fontWeight: 700, letterSpacing: '0.01em' },
            caption: { fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.03em' },
            overline: { fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' },
        },
        shape: {
            borderRadius: 16,
        },
        // Custom design tokens accessible via theme.tokens
        tokens: {
            radii: { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 },
            borderWidth: { thin: 1, base: 2, thick: 3 },
            // Chunky offset shadow — the signature look.
            shadow: {
                none: 'none',
                sm: mode === 'light'
                    ? '2px 2px 0 rgba(26, 26, 46, 1)'
                    : '2px 2px 0 rgba(0, 0, 0, 1)',
                md: mode === 'light'
                    ? '4px 4px 0 rgba(26, 26, 46, 1)'
                    : '4px 4px 0 rgba(0, 0, 0, 1)',
                lg: mode === 'light'
                    ? '6px 6px 0 rgba(26, 26, 46, 1)'
                    : '6px 6px 0 rgba(0, 0, 0, 1)',
                // Soft glow shadows for when offset is too loud (dialogs, menus)
                soft: mode === 'light'
                    ? '0 4px 16px rgba(26, 26, 46, 0.08), 0 2px 4px rgba(26, 26, 46, 0.04)'
                    : '0 8px 24px rgba(0, 0, 0, 0.48), 0 2px 6px rgba(0, 0, 0, 0.32)',
                softLg: mode === 'light'
                    ? '0 12px 32px rgba(26, 26, 46, 0.12), 0 4px 8px rgba(26, 26, 46, 0.06)'
                    : '0 20px 40px rgba(0, 0, 0, 0.56), 0 6px 12px rgba(0, 0, 0, 0.4)',
                // Colored glow for primary CTAs
                accent: `0 4px 16px ${accent.primary}40`,
                accentLg: `0 8px 28px ${accent.primary}55`,
            },
            spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    '*': { boxSizing: 'border-box' },
                    html: { WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' },
                    body: {
                        backgroundColor: surface.bg,
                        color: surface.textPrimary,
                        scrollbarWidth: 'thin',
                        scrollbarColor: `${surface.borderSoft} ${surface.bg}`,
                        '&::-webkit-scrollbar': { width: 10, height: 10 },
                        '&::-webkit-scrollbar-track': { background: surface.bg },
                        '&::-webkit-scrollbar-thumb': {
                            background: surface.borderSoft,
                            borderRadius: 10,
                            border: `2px solid ${surface.bg}`,
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                            background: surface.textSecondary,
                        },
                    },
                    '::selection': {
                        background: accent.primary,
                        color: '#FFFFFF',
                    },
                },
            },
            MuiButton: {
                defaultProps: { disableElevation: true },
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                        fontWeight: 700,
                        textTransform: 'none',
                        padding: '10px 22px',
                        transition: 'transform 120ms ease, box-shadow 120ms ease, background 120ms ease',
                    },
                    contained: {
                        border: `2px solid ${surface.border}`,
                        boxShadow: mode === 'light'
                            ? '3px 3px 0 rgba(26, 26, 46, 1)'
                            : '3px 3px 0 rgba(0, 0, 0, 1)',
                        '&:hover': {
                            transform: 'translate(-1px, -1px)',
                            boxShadow: mode === 'light'
                                ? '4px 4px 0 rgba(26, 26, 46, 1)'
                                : '4px 4px 0 rgba(0, 0, 0, 1)',
                        },
                        '&:active': {
                            transform: 'translate(2px, 2px)',
                            boxShadow: 'none',
                        },
                    },
                    containedPrimary: {
                        background: `linear-gradient(135deg, ${accent.primary} 0%, ${accent.secondary} 100%)`,
                        '&:hover': {
                            background: `linear-gradient(135deg, ${accent.primary} 0%, ${accent.secondary} 100%)`,
                            filter: 'brightness(1.05)',
                        },
                    },
                    outlined: {
                        borderWidth: 2,
                        borderColor: surface.border,
                        color: surface.textPrimary,
                        '&:hover': {
                            borderWidth: 2,
                            borderColor: surface.border,
                            background: mode === 'light' ? 'rgba(26, 26, 46, 0.04)' : 'rgba(248, 250, 252, 0.08)',
                        },
                    },
                    text: {
                        '&:hover': {
                            background: mode === 'light' ? 'rgba(26, 26, 46, 0.06)' : 'rgba(248, 250, 252, 0.10)',
                        },
                    },
                    sizeSmall: { padding: '6px 14px', fontSize: '0.8125rem' },
                    sizeLarge: { padding: '14px 28px', fontSize: '1rem' },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 16,
                        border: `2px solid ${surface.border}`,
                        backgroundColor: surface.surface,
                        backgroundImage: 'none',
                        boxShadow: mode === 'light'
                            ? '4px 4px 0 rgba(26, 26, 46, 1)'
                            : '4px 4px 0 rgba(0, 0, 0, 1)',
                        transition: 'transform 160ms ease, box-shadow 160ms ease',
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                        backgroundColor: surface.surface,
                    },
                    outlined: {
                        borderWidth: 2,
                        borderColor: surface.border,
                    },
                },
            },
            MuiAppBar: {
                defaultProps: { elevation: 0 },
                styleOverrides: {
                    root: {
                        background: surface.surface,
                        color: surface.textPrimary,
                        borderBottom: `2px solid ${surface.border}`,
                        boxShadow: 'none',
                        backdropFilter: 'none',
                    },
                },
            },
            MuiDrawer: {
                styleOverrides: {
                    paper: {
                        backgroundColor: surface.surface,
                        backgroundImage: 'none',
                        borderRight: `2px solid ${surface.border}`,
                    },
                },
            },
            MuiDialog: {
                styleOverrides: {
                    paper: {
                        borderRadius: 20,
                        border: `2px solid ${surface.border}`,
                        boxShadow: mode === 'light'
                            ? '0 12px 32px rgba(26, 26, 46, 0.12), 0 4px 8px rgba(26, 26, 46, 0.06)'
                            : '0 20px 40px rgba(0, 0, 0, 0.56), 0 6px 12px rgba(0, 0, 0, 0.4)',
                        backgroundImage: 'none',
                    },
                },
            },
            MuiMenu: {
                styleOverrides: {
                    paper: {
                        backgroundColor: surface.surface,
                        border: `2px solid ${surface.border}`,
                        borderRadius: 12,
                        boxShadow: mode === 'light'
                            ? '4px 4px 0 rgba(26, 26, 46, 1)'
                            : '4px 4px 0 rgba(0, 0, 0, 1)',
                        backgroundImage: 'none',
                    },
                },
            },
            MuiMenuItem: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                        margin: '2px 4px',
                        fontWeight: 500,
                        '&:hover': {
                            background: mode === 'light' ? 'rgba(26, 26, 46, 0.06)' : 'rgba(248, 250, 252, 0.10)',
                        },
                    },
                },
            },
            MuiTextField: {
                defaultProps: { variant: 'outlined' },
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 12,
                            backgroundColor: surface.surface,
                            '& fieldset': {
                                borderColor: surface.borderSoft,
                                borderWidth: 2,
                            },
                            '&:hover fieldset': {
                                borderColor: surface.border,
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: accent.primary,
                                borderWidth: 2,
                            },
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                            color: accent.primary,
                            fontWeight: 600,
                        },
                    },
                },
            },
            MuiChip: {
                styleOverrides: {
                    root: {
                        borderRadius: 999,
                        fontWeight: 600,
                        letterSpacing: '0.02em',
                        border: `2px solid ${surface.border}`,
                        height: 30,
                    },
                    filled: {
                        backgroundColor: surface.surfaceSubtle,
                        color: surface.textPrimary,
                    },
                    outlined: {
                        borderWidth: 2,
                        borderColor: surface.border,
                    },
                    colorPrimary: {
                        backgroundColor: accent.primary,
                        color: '#FFFFFF',
                        borderColor: surface.border,
                    },
                    colorSecondary: {
                        backgroundColor: accent.secondary,
                        color: '#FFFFFF',
                        borderColor: surface.border,
                    },
                },
            },
            MuiFab: {
                styleOverrides: {
                    root: {
                        border: `2px solid ${surface.border}`,
                        boxShadow: mode === 'light'
                            ? '4px 4px 0 rgba(26, 26, 46, 1)'
                            : '4px 4px 0 rgba(0, 0, 0, 1)',
                        '&:hover': {
                            transform: 'translate(-1px, -1px)',
                            boxShadow: mode === 'light'
                                ? '5px 5px 0 rgba(26, 26, 46, 1)'
                                : '5px 5px 0 rgba(0, 0, 0, 1)',
                        },
                        '&:active': {
                            transform: 'translate(2px, 2px)',
                            boxShadow: 'none',
                        },
                    },
                    primary: {
                        background: `linear-gradient(135deg, ${accent.primary} 0%, ${accent.secondary} 100%)`,
                        color: '#FFFFFF',
                        '&:hover': {
                            background: `linear-gradient(135deg, ${accent.primary} 0%, ${accent.secondary} 100%)`,
                            filter: 'brightness(1.05)',
                        },
                    },
                },
            },
            MuiIconButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 10,
                        transition: 'background 120ms ease, transform 120ms ease',
                        '&:hover': {
                            backgroundColor: mode === 'light' ? 'rgba(26, 26, 46, 0.06)' : 'rgba(248, 250, 252, 0.10)',
                        },
                    },
                },
            },
            MuiAvatar: {
                styleOverrides: {
                    root: {
                        border: `2px solid ${surface.border}`,
                        fontWeight: 700,
                    },
                },
            },
            MuiTooltip: {
                styleOverrides: {
                    tooltip: {
                        backgroundColor: surface.border,
                        color: mode === 'light' ? '#FFFFFF' : '#0A0A1A',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        borderRadius: 8,
                        padding: '6px 10px',
                    },
                    arrow: {
                        color: surface.border,
                    },
                },
            },
            MuiLinearProgress: {
                styleOverrides: {
                    root: {
                        borderRadius: 999,
                        height: 8,
                        backgroundColor: surface.surfaceSubtle,
                        border: `1px solid ${surface.borderSoft}`,
                        overflow: 'hidden',
                    },
                    bar: {
                        borderRadius: 999,
                        background: `linear-gradient(90deg, ${accent.primary} 0%, ${accent.secondary} 100%)`,
                    },
                },
            },
            MuiDivider: {
                styleOverrides: {
                    root: {
                        borderColor: surface.divider,
                    },
                },
            },
            MuiTab: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        fontWeight: 700,
                        minHeight: 44,
                    },
                },
            },
            MuiTabs: {
                styleOverrides: {
                    indicator: {
                        height: 3,
                        borderRadius: 999,
                        backgroundColor: accent.primary,
                    },
                },
            },
            MuiAlert: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                        border: `2px solid ${surface.border}`,
                        fontWeight: 500,
                    },
                    standardSuccess: {
                        backgroundColor: mode === 'light' ? '#DCFCE7' : '#14532D',
                        color: mode === 'light' ? '#14532D' : '#BBF7D0',
                    },
                    standardWarning: {
                        backgroundColor: mode === 'light' ? '#FEF3C7' : '#78350F',
                        color: mode === 'light' ? '#78350F' : '#FDE68A',
                    },
                    standardError: {
                        backgroundColor: mode === 'light' ? '#FEE2E2' : '#7F1D1D',
                        color: mode === 'light' ? '#7F1D1D' : '#FECACA',
                    },
                    standardInfo: {
                        backgroundColor: mode === 'light' ? '#DBEAFE' : '#1E3A8A',
                        color: mode === 'light' ? '#1E3A8A' : '#BFDBFE',
                    },
                },
            },
            MuiSkeleton: {
                styleOverrides: {
                    root: {
                        backgroundColor: mode === 'light' ? 'rgba(26, 26, 46, 0.08)' : 'rgba(248, 250, 252, 0.08)',
                        borderRadius: 12,
                    },
                },
            },
            MuiBackdrop: {
                styleOverrides: {
                    root: {
                        backgroundColor: mode === 'light'
                            ? 'rgba(26, 26, 46, 0.48)'
                            : 'rgba(0, 0, 0, 0.64)',
                        backdropFilter: 'blur(4px)',
                    },
                },
            },
        },
    }), [mode, colorScheme, accent.primary, accent.secondary, accent.accent, surface.bg, surface.surface, surface.border, surface.borderSoft, surface.textPrimary, surface.textSecondary, surface.divider, surface.bgAlt, surface.shadowColor, surface.surfaceSubtle, surface.textMuted]);

    const value = {
        mode,
        theme,
        colorScheme,
        colorSchemes,
        currentScheme: accent,
        currentThemeColors: accent, // kept for backward compat with older pages
        toggleTheme,
        setTheme,
        setThemeColorScheme,
    };

    return (
        <ThemeContext.Provider value={value}>
            <MuiThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
};

export default ThemeProvider;
