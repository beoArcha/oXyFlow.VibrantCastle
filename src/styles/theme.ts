/**
 * Design Tokens & Theme Constants for Vibrant Castle.
 * Centralizes visual tokens, color palettes, and relative sizing configurations.
 */

export const THEME = {
  colors: {
    // Autumnal Bastion Amber Palette
    amberPrimary: "#f59e0b",
    amberLight: "#fbbf24",
    amberLighter: "#fef3c7",
    amberDark: "#b45309",
    amberDarker: "#78350f",
    
    // Castle Stone & Deep Wood Backgrounds
    surfaceDarkest: "#120602",
    surfaceDarker: "#1a0c07",
    surfaceDark: "#26120b",
    surfaceCard: "#2d140a",
    surfaceCardHover: "#3d1b0e",
    
    // Accent Borders
    borderSubtle: "#4a200e",
    borderMedium: "#5c2d18",
    borderStrong: "#8d4325",
    borderAccent: "#d97706",
    
    // Functional Combat Colors
    health: "#ef4444",
    healthDark: "#991b1b",
    mana: "#06b6d4",
    manaDark: "#0e7490",
    stamina: "#eab308",
    staminaDark: "#a16207",
    score: "#f59e0b",
    skillPoints: "#8b5cf6",
    skillPointsDark: "#5b21b6",
  },
  aspectRatios: {
    widescreen: "16 / 9",
    golden: "16 / 10",
    classic: "4 / 3",
  },
  typography: {
    fontSerif: "Cinzel, serif",
    fontSans: "Plus Jakarta Sans, system-ui, sans-serif",
    fontMono: "Fira Code, monospace",
  }
} as const;

export type ThemeColors = typeof THEME.colors;
