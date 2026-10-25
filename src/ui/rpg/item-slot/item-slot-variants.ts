import { cva, type VariantProps } from "class-variance-authority";

export type ItemSlotRarityVariant = "stone" | "green" | "cyan" | "amber";

export const itemSlotVariants = cva(
  "flex flex-col items-center justify-center p-1.5 rounded-xl border-2 transition-all cursor-pointer select-none relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400",
  {
    variants: {
      rarity: {
        stone: "border-stone-700 bg-stone-900/90 hover:border-primary-400 hover:bg-stone-800/80 shadow-md",
        green: "border-emerald-600/80 bg-stone-900/90 shadow-emerald-950/40 hover:border-primary-400 hover:bg-stone-800/80 shadow-md",
        cyan: "border-cyan-500/80 bg-stone-900/90 shadow-cyan-950/40 hover:border-primary-400 hover:bg-stone-800/80 shadow-md",
        amber: "border-amber-400 bg-stone-900/90 shadow-amber-950/60 ring-1 ring-amber-400/40 hover:border-primary-400 hover:bg-stone-800/80 shadow-md",
      },
      selected: {
        true: "border-amber-400 bg-amber-950/50 ring-2 ring-amber-400/60 scale-[1.02]",
        false: "",
      },
      empty: {
        true: "border-stone-800/60 bg-stone-950/40 hover:border-stone-600 hover:bg-stone-900/40",
        false: "",
      },
    },
    defaultVariants: {
      rarity: "stone",
      selected: false,
      empty: false,
    },
  }
);

export const itemSlotInnerSize = {
  sm: "w-10 h-10 text-base",
  md: "w-12 h-12 text-xl",
  lg: "w-14 h-14 text-2xl",
};

export const itemSlotIconSize = {
  sm: 14,
  md: 18,
  lg: 22,
};

export type ItemSlotVariantProps = VariantProps<typeof itemSlotVariants>;
