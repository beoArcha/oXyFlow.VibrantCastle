import { cva, type VariantProps } from "class-variance-authority";

export const cardVariants = cva(
  "rounded-xl p-4 md:p-5 text-amber-lighter flex flex-col gap-3 transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-surface-dark border-2 border-border-strong shadow-xl",
        subtle: "bg-surface-darker border border-border-medium shadow-md",
        dark: "bg-surface-darkest border border-border-subtle shadow-inner",
        highlight: "bg-surface-card border-2 border-amber-primary shadow-2xl shadow-amber-950/50",
        ghost: "bg-transparent border border-transparent shadow-none",
        panel: "bg-surface-card/95 border border-border-medium shadow-lg backdrop-blur-sm",
      },
      interactive: {
        true: "hover:border-border-accent hover:bg-surface-card-hover cursor-pointer active:scale-[0.99]",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      interactive: false,
    },
  }
);

export type CardVariant = NonNullable<VariantProps<typeof cardVariants>["variant"]>;
export type CardVariantProps = VariantProps<typeof cardVariants>;
