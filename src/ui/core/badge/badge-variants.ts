import { cva, type VariantProps } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] md:text-xs font-semibold border whitespace-nowrap select-none",
  {
    variants: {
      variant: {
        amber: "bg-amber-950/80 text-amber-300 border-amber-600/50",
        red: "bg-red-950/80 text-red-300 border-red-700/50",
        cyan: "bg-cyan-950/80 text-cyan-300 border-cyan-700/50",
        purple: "bg-purple-950/80 text-purple-300 border-purple-700/50",
        green: "bg-green-950/80 text-green-300 border-green-700/50",
        stone: "bg-stone-900/90 text-stone-300 border-stone-700",
      },
      size: {
        sm: "text-[9px] px-1.5 py-0.5",
        md: "text-[10px] md:text-xs px-2 py-0.5",
        lg: "text-xs md:text-sm px-2.5 py-1",
      },
    },
    defaultVariants: {
      variant: "amber",
      size: "md",
    },
  }
);

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;
export type BadgeSize = NonNullable<VariantProps<typeof badgeVariants>["size"]>;
export type BadgeVariantProps = VariantProps<typeof badgeVariants>;
