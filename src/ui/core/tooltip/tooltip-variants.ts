import { cva, type VariantProps } from "class-variance-authority";

export const tooltipVariants = cva(
  "z-50 px-2.5 py-1.5 text-xs font-medium rounded-lg shadow-xl shadow-black/80 backdrop-blur-sm pointer-events-none whitespace-nowrap transition-opacity",
  {
    variants: {
      variant: {
        default: "text-stone-200 bg-surface-darkest/95 border border-amber-500/40",
        subtle: "text-stone-300 bg-surface-darkest/95 border border-border-subtle",
        danger: "text-red-200 bg-surface-darkest/95 border border-red-500/50",
        gold: "text-amber-200 bg-surface-darkest/95 border border-primary-500/60 shadow-amber-950/40",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type TooltipVariantProps = VariantProps<typeof tooltipVariants>;
