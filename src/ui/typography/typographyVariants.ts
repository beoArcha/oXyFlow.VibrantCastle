import { cva, type VariantProps } from "class-variance-authority";

/**
 * CVA styling definitions for Gothic Castle semantic headings (h1..h6).
 */
export const headingVariants = cva("font-serif select-none transition-colors", {
  variants: {
    variant: {
      gothic: "text-amber-400 font-black tracking-wider",
      primary: "text-amber-300 font-bold",
      secondary: "text-amber-200 font-bold",
      danger: "text-red-400 font-bold",
      muted: "text-stone-400 font-semibold",
      default: "text-stone-100 font-bold",
    },
    size: {
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg md:text-xl",
      xl: "text-xl md:text-2xl",
      "2xl": "text-2xl md:text-3xl",
      "3xl": "text-3xl md:text-4xl",
      "4xl": "text-4xl md:text-5xl",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
      black: "font-black",
    },
    tracking: {
      tight: "tracking-tight",
      normal: "tracking-normal",
      wide: "tracking-wide",
      wider: "tracking-wider",
      widest: "tracking-widest",
    },
    align: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    },
    transform: {
      uppercase: "uppercase",
      capitalize: "capitalize",
      lowercase: "lowercase",
      "normal-case": "normal-case",
      none: "",
    },
    italic: {
      true: "italic",
      false: "",
    },
    dropShadow: {
      true: "drop-shadow-md",
      false: "",
    },
    truncate: {
      true: "truncate",
      false: "",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "base",
    tracking: "wide",
    dropShadow: false,
    truncate: false,
  },
});

export type HeadingVariant = NonNullable<VariantProps<typeof headingVariants>["variant"]>;
export type HeadingSize = NonNullable<VariantProps<typeof headingVariants>["size"]>;
export type HeadingWeight = NonNullable<VariantProps<typeof headingVariants>["weight"]>;
export type HeadingTracking = NonNullable<VariantProps<typeof headingVariants>["tracking"]>;
export type HeadingAlign = NonNullable<VariantProps<typeof headingVariants>["align"]>;
export type HeadingTransform = NonNullable<VariantProps<typeof headingVariants>["transform"]>;
export type HeadingVariantProps = VariantProps<typeof headingVariants>;

/**
 * CVA styling definitions for paragraphs and dialogue narratives.
 */
export const paragraphVariants = cva("leading-relaxed", {
  variants: {
    variant: {
      default: "text-stone-300 font-sans",
      muted: "text-stone-400 font-sans",
      subtle: "text-stone-500 font-sans",
      narrator: "text-amber-100/90 font-serif italic",
      amber: "text-amber-200/80 font-sans",
      primary: "text-amber-300 font-sans",
      danger: "text-red-400 font-sans",
    },
    size: {
      micro: "text-[8px]",
      "3xs": "text-[9px]",
      "2xs": "text-[10px]",
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
    },
    align: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
      justify: "text-justify",
    },
    leading: {
      none: "leading-none",
      tight: "leading-tight",
      snug: "leading-snug",
      normal: "leading-normal",
      relaxed: "leading-relaxed",
      loose: "leading-loose",
    },
    italic: {
      true: "italic",
      false: "",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "sm",
    italic: false,
  },
});

export type ParagraphVariant = NonNullable<VariantProps<typeof paragraphVariants>["variant"]>;
export type ParagraphSize = NonNullable<VariantProps<typeof paragraphVariants>["size"]>;
export type ParagraphAlign = NonNullable<VariantProps<typeof paragraphVariants>["align"]>;
export type ParagraphLeading = NonNullable<VariantProps<typeof paragraphVariants>["leading"]>;
export type ParagraphVariantProps = VariantProps<typeof paragraphVariants>;

/**
 * CVA styling definitions for atomic text labels, stats, and inline spans.
 */
export const textVariants = cva("transition-colors", {
  variants: {
    family: {
      sans: "font-sans",
      serif: "font-serif",
      mono: "font-mono",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
      black: "font-black",
    },
    size: {
      micro: "text-[8px]",
      "3xs": "text-[9px]",
      "2xs": "text-[10px]",
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
      xl: "text-xl",
    },
    variant: {
      default: "text-stone-300",
      muted: "text-stone-400",
      subtle: "text-stone-500",
      primary: "text-amber-400",
      secondary: "text-amber-200",
      amber: "text-amber-300",
      danger: "text-red-400",
      success: "text-emerald-400",
      info: "text-sky-400",
      white: "text-stone-100",
    },
    transform: {
      uppercase: "uppercase",
      capitalize: "capitalize",
      lowercase: "lowercase",
      "normal-case": "normal-case",
      none: "",
    },
    tracking: {
      tighter: "tracking-tighter",
      tight: "tracking-tight",
      normal: "tracking-normal",
      wide: "tracking-wide",
      wider: "tracking-wider",
      widest: "tracking-widest",
      none: "",
    },
    decoration: {
      underline: "underline underline-offset-2",
      "line-through": "line-through",
      none: "no-underline",
    },
    leading: {
      none: "leading-none",
      tight: "leading-tight",
      snug: "leading-snug",
      normal: "leading-normal",
      relaxed: "leading-relaxed",
      loose: "leading-loose",
    },
    align: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    },
    uppercase: {
      true: "uppercase tracking-wider",
      false: "",
    },
    italic: {
      true: "italic",
      false: "",
    },
    truncate: {
      true: "truncate",
      false: "",
    },
  },
  defaultVariants: {
    family: "sans",
    weight: "normal",
    size: "sm",
    variant: "default",
    uppercase: false,
    italic: false,
    truncate: false,
  },
});

export type TextFamily = NonNullable<VariantProps<typeof textVariants>["family"]>;
export type TextWeight = NonNullable<VariantProps<typeof textVariants>["weight"]>;
export type TextSize = NonNullable<VariantProps<typeof textVariants>["size"]>;
export type TextVariant = NonNullable<VariantProps<typeof textVariants>["variant"]>;
export type TextTransform = NonNullable<VariantProps<typeof textVariants>["transform"]>;
export type TextTracking = NonNullable<VariantProps<typeof textVariants>["tracking"]>;
export type TextDecoration = NonNullable<VariantProps<typeof textVariants>["decoration"]>;
export type TextLeading = NonNullable<VariantProps<typeof textVariants>["leading"]>;
export type TextAlign = NonNullable<VariantProps<typeof textVariants>["align"]>;
export type TextVariantProps = VariantProps<typeof textVariants>;

/**
 * CVA styling definitions for form control labels and metadata keys.
 */
export const labelVariants = cva("font-sans select-none block", {
  variants: {
    variant: {
      default: "text-stone-300",
      primary: "text-amber-300",
      muted: "text-stone-400",
      subtle: "text-stone-500",
    },
    size: {
      micro: "text-[8px]",
      "3xs": "text-[9px]",
      "2xs": "text-[10px]",
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
    transform: {
      uppercase: "uppercase",
      capitalize: "capitalize",
      lowercase: "lowercase",
      "normal-case": "normal-case",
      none: "",
    },
    tracking: {
      tight: "tracking-tight",
      normal: "tracking-normal",
      wide: "tracking-wide",
      wider: "tracking-wider",
      widest: "tracking-widest",
    },
    uppercase: {
      true: "uppercase tracking-wider",
      false: "",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "xs",
    weight: "medium",
    uppercase: false,
  },
});

export type LabelVariant = NonNullable<VariantProps<typeof labelVariants>["variant"]>;
export type LabelSize = NonNullable<VariantProps<typeof labelVariants>["size"]>;
export type LabelWeight = NonNullable<VariantProps<typeof labelVariants>["weight"]>;
export type LabelTransform = NonNullable<VariantProps<typeof labelVariants>["transform"]>;
export type LabelTracking = NonNullable<VariantProps<typeof labelVariants>["tracking"]>;
export type LabelVariantProps = VariantProps<typeof labelVariants>;

/**
 * CVA styling definitions for technical code snippets, numerical coordinates, and debug stats.
 */
export const codeVariants = cva("font-mono font-normal inline-block select-text", {
  variants: {
    variant: {
      default: "text-stone-300 bg-stone-900/60 px-1 py-0.5 rounded border border-stone-800",
      amber: "text-amber-300 bg-amber-950/40 px-1 py-0.5 rounded border border-amber-900/40",
      cyan: "text-cyan-300 bg-cyan-950/40 px-1 py-0.5 rounded border border-cyan-900/40",
      danger: "text-red-300 bg-red-950/40 px-1 py-0.5 rounded border border-red-900/40",
      plain: "text-stone-300 bg-transparent p-0 border-0",
    },
    size: {
      micro: "text-[8px]",
      "3xs": "text-[9px]",
      "2xs": "text-[10px]",
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "xs",
  },
});

export type CodeVariant = NonNullable<VariantProps<typeof codeVariants>["variant"]>;
export type CodeSize = NonNullable<VariantProps<typeof codeVariants>["size"]>;
export type CodeVariantProps = VariantProps<typeof codeVariants>;

/**
 * CVA styling definitions for icon-text layouts pairing Lucide SVG icons with typographic labels.
 */
export const iconTextVariants = cva("min-w-0 transition-colors", {
  variants: {
    inline: {
      true: "inline-flex",
      false: "flex",
    },
    align: {
      center: "items-center",
      start: "items-start",
      end: "items-end",
      baseline: "items-baseline",
    },
    gap: {
      "1": "gap-1",
      "1.5": "gap-1.5",
      "2": "gap-2",
      "2.5": "gap-2.5",
      "3": "gap-3",
    },
  },
  defaultVariants: {
    inline: true,
    align: "center",
    gap: "1.5",
  },
});

export type IconTextGap = NonNullable<VariantProps<typeof iconTextVariants>["gap"]>;
export type IconTextAlign = NonNullable<VariantProps<typeof iconTextVariants>["align"]>;
export type IconTextVariantProps = VariantProps<typeof iconTextVariants>;
