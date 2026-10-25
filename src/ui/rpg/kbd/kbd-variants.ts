import { cva, type VariantProps } from "class-variance-authority";

export const kbdVariants = cva(
  "inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded text-[10px] md:text-xs font-mono font-bold border shadow-sm select-none",
  {
    variants: {
      variant: {
        amber: "bg-amber-950/80 text-amber-200 border-amber-600/70 shadow-amber-950/50",
        purple: "bg-purple-950/80 text-purple-200 border-purple-600/70 shadow-purple-950/50",
        cyan: "bg-cyan-950/80 text-cyan-200 border-cyan-600/70 shadow-cyan-950/50",
        stone: "bg-surface-darker text-amber-lighter border-border-medium shadow-stone-950/50",
      },
    },
    defaultVariants: {
      variant: "stone",
    },
  }
);

export type KbdKeyVariant = NonNullable<VariantProps<typeof kbdVariants>["variant"]>;
export type KbdVariantProps = VariantProps<typeof kbdVariants>;
