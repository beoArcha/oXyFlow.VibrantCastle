import { cva, type VariantProps } from "class-variance-authority";

export const progressTrackVariants = cva(
  "w-full bg-surface-darkest rounded-full overflow-hidden border p-[1px] shadow-inner relative",
  {
    variants: {
      variant: {
        danger: "border-red-900/70 shadow-red-950/40",
        info: "border-cyan-900/70 shadow-cyan-950/40",
        warning: "border-amber-900/70 shadow-amber-950/40",
        amber: "border-amber-900/60 shadow-amber-950/40",
        purple: "border-purple-900/70 shadow-purple-950/40",
        health: "border-red-900/70 shadow-red-950/40",
        mana: "border-cyan-900/70 shadow-cyan-950/40",
        stamina: "border-amber-900/70 shadow-amber-950/40",
      },
      size: {
        sm: "h-1.5",
        md: "h-2",
        lg: "h-3",
      },
    },
    defaultVariants: {
      variant: "danger",
      size: "md",
    },
  }
);

export const progressBarVariants = cva(
  "h-full rounded-full transition-all duration-200 ease-out relative overflow-hidden",
  {
    variants: {
      variant: {
        danger: "bg-gradient-to-r from-red-700 via-red-600 to-red-400",
        info: "bg-gradient-to-r from-cyan-700 via-cyan-500 to-blue-400",
        warning: "bg-gradient-to-r from-amber-700 via-amber-500 to-yellow-400",
        amber: "bg-gradient-to-r from-amber-600 to-amber-400",
        purple: "bg-gradient-to-r from-purple-700 to-purple-400",
        health: "bg-gradient-to-r from-red-700 via-red-600 to-red-400",
        mana: "bg-gradient-to-r from-cyan-700 via-cyan-500 to-blue-400",
        stamina: "bg-gradient-to-r from-amber-700 via-amber-500 to-yellow-400",
      },
    },
    defaultVariants: {
      variant: "danger",
    },
  }
);

export const progressLabelVariants = cva("flex items-center gap-1", {
  variants: {
    variant: {
      danger: "text-red-300",
      info: "text-cyan-300",
      warning: "text-amber-300",
      amber: "text-amber-200",
      purple: "text-purple-300",
      health: "text-red-300",
      mana: "text-cyan-300",
      stamina: "text-amber-300",
    },
  },
  defaultVariants: {
    variant: "danger",
  },
});

export type ProgressBarVariant = NonNullable<VariantProps<typeof progressBarVariants>["variant"]>;
export type ProgressBarSize = NonNullable<VariantProps<typeof progressTrackVariants>["size"]>;
export type BarVariant = ProgressBarVariant;
