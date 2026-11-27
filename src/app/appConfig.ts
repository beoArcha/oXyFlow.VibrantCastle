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

let devToolsOverride: boolean | undefined;

/**
 * Developer tools (Creation & Developer Suite, key C, header button) exist only
 * in dev builds. Tests may force the flag with `setDevToolsOverride`.
 */
export function isDevToolsEnabled(): boolean {
  if (devToolsOverride !== undefined) return devToolsOverride;
  return import.meta.env.DEV === true;
}

/** Test seam: pass `undefined` to restore the build-mode default. */
export function setDevToolsOverride(value: boolean | undefined): void {
  devToolsOverride = value;
}
