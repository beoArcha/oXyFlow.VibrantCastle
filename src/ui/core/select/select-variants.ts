import { cva, type VariantProps } from "class-variance-authority";

export const selectVariants = cva(
  "w-full appearance-none border font-sans transition-all cursor-pointer focus:outline-none focus:ring-1",
  {
    variants: {
      variant: {
        default:
          "bg-surface-darkest/90 border-stone-800 text-stone-200 focus:border-amber-500 focus:ring-amber-500/50 hover:border-stone-700",
        castle:
          "bg-surface-darker border-border-strong text-amber-200 focus:border-amber-400 focus:ring-amber-400/50 hover:border-amber-700",
      },
      size: {
        sm: "px-2.5 py-1 text-xs rounded-md",
        md: "px-3 py-2 text-sm rounded-lg",
        lg: "px-4 py-2.5 text-base rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export type SelectVariantProps = VariantProps<typeof selectVariants>;
