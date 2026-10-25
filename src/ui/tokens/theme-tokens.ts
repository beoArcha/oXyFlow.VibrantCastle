/**
 * Semantic Design Token definitions for Vibrant Castle (@ui).
 * Maps Autumn-Gothic Bastion visual tokens to CSS custom property identifiers.
 */

export const THEME_CSS_VARS = {
  // Surfaces
  surfaceDarkest: "var(--surface-darkest)",
  surfaceDarker: "var(--surface-darker)",
  surfaceDark: "var(--surface-dark)",
  surfaceCard: "var(--surface-card)",
  surfaceCardHover: "var(--surface-card-hover)",

  // Borders
  borderSubtle: "var(--border-subtle)",
  borderMedium: "var(--border-medium)",
  borderStrong: "var(--border-strong)",
  borderAccent: "var(--border-accent)",

  // Amber Brand Accents
  amberPrimary: "var(--amber-primary)",
  amberLight: "var(--amber-light)",
  amberLighter: "var(--amber-lighter)",
  amberDark: "var(--amber-dark)",
  amberDarker: "var(--amber-darker)",

  // Vital Combat Resources
  vitalHealth: "var(--vital-health)",
  vitalHealthDark: "var(--vital-health-dark)",
  vitalMana: "var(--vital-mana)",
  vitalManaDark: "var(--vital-mana-dark)",
  vitalStamina: "var(--vital-stamina)",
  vitalStaminaDark: "var(--vital-stamina-dark)",
  vitalScore: "var(--vital-score)",
  vitalSkillPoints: "var(--vital-skill-points)",
} as const;

export type ThemeCssVarName = keyof typeof THEME_CSS_VARS;

/**
 * Returns the CSS custom property declaration string for a given token.
 */
export function getThemeCssVar(name: ThemeCssVarName): string {
  return THEME_CSS_VARS[name];
}
