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

export type PlayerTheme = "crimson" | "cyan";

export interface PlayerThemeTokens {
  readonly id: PlayerTheme;
  readonly cardBorder: string;
  readonly avatarBorder: string;
  readonly nameColor: string;
  readonly loreTitleColor: string;
  readonly passiveColor: string;
  readonly emblemClass: string;
  readonly tagClass: string;
  readonly qualityBadgeColor: string;
  readonly heartIconClass: string;
  readonly cardWidth: string;
  readonly progressBarVariant: "health" | "mana";
  readonly healthBarClass: string;
  readonly helpHeaderBg: string;
  readonly helpFlankBadge: string;
  readonly helpIconColor: string;
}

export const PLAYER_THEMES: Record<PlayerTheme, PlayerThemeTokens> = {
  crimson: {
    id: "crimson",
    cardBorder: "border-amber-700/45",
    avatarBorder: "border-amber-500/70",
    nameColor: "text-amber-100",
    loreTitleColor: "text-amber-400/90",
    passiveColor: "text-amber-300/80",
    emblemClass: "text-amber-400",
    tagClass: "text-amber-300 bg-amber-950/60 border-amber-700/40",
    qualityBadgeColor: "text-amber-300",
    heartIconClass: "text-rose-400 fill-rose-500",
    cardWidth: "w-60 sm:w-64",
    progressBarVariant: "health",
    healthBarClass: "bg-gradient-to-r from-red-700 via-rose-500 to-amber-400",
    helpHeaderBg: "from-red-950/40",
    helpFlankBadge: "bg-red-500/10 text-red-400 border-red-500/20",
    helpIconColor: "text-amber-400",
  },
  cyan: {
    id: "cyan",
    cardBorder: "border-cyan-700/45",
    avatarBorder: "border-cyan-400/70",
    nameColor: "text-cyan-50",
    loreTitleColor: "text-cyan-300/90",
    passiveColor: "text-violet-300/85",
    emblemClass: "text-cyan-300",
    tagClass: "text-cyan-300 bg-cyan-950/60 border-cyan-700/40",
    qualityBadgeColor: "text-cyan-300",
    heartIconClass: "text-rose-400 fill-rose-500",
    cardWidth: "w-60 sm:w-64",
    progressBarVariant: "health",
    healthBarClass: "bg-gradient-to-r from-rose-700 via-rose-500 to-fuchsia-400",
    helpHeaderBg: "from-cyan-950/40",
    helpFlankBadge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    helpIconColor: "text-cyan-400",
  },
};

export function resolvePlayerTheme(theme?: string): PlayerTheme {
  if (theme === "cyan") return "cyan";
  return "crimson";
}

export function getPlayerThemeTokens(theme?: string): PlayerThemeTokens {
  return PLAYER_THEMES[resolvePlayerTheme(theme)];
}
