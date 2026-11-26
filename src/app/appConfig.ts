/**
 * Centralized application shell configuration (DIP / OCP).
 * Eliminates hardcoded magic strings and shortcut keys from src/App.tsx.
 */
export const APP_CONFIG = {
  errorBoundaryFallbackTitle: "Vibrant Castle Critical Failure",
  i18nKeys: {
    title: "title",
    subtitle: "subtitle",
    styleBadge: "styleBadge",
  },
  globalKeys: {
    escape: "Escape",
    pause: "p",
  },
} as const;

export type AppConfig = typeof APP_CONFIG;
