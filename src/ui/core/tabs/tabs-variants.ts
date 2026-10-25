import { cva, type VariantProps } from "class-variance-authority";

export const tabsListVariants = cva(
  "shrink-0 flex items-center justify-between gap-1.5 p-1.5 bg-surface-darkest/95 border border-primary-500/30 rounded-xl shadow-inner",
  {
    variants: {
      orientation: {
        horizontal: "flex-wrap",
        vertical: "flex-col items-stretch",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  }
);

export const tabsTriggerVariants = cva(
  "flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer select-none whitespace-nowrap",
  {
    variants: {
      state: {
        active:
          "bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-950/60 border border-primary-400 font-black",
        inactive:
          "bg-black/40 text-stone-300 hover:text-amber-200 hover:bg-surface-card border border-stone-800/80 hover:border-amber-700/50",
      },
    },
    defaultVariants: {
      state: "inactive",
    },
  }
);

export type TabsListVariantProps = VariantProps<typeof tabsListVariants>;
export type TabsTriggerVariantProps = VariantProps<typeof tabsTriggerVariants>;
