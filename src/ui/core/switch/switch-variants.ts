import { cva, type VariantProps } from "class-variance-authority";

export const switchTrackVariants = cva(
  "relative inline-flex shrink-0 items-center rounded-full border transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-darkest",
  {
    variants: {
      size: {
        sm: "w-8 h-4.5 p-0.5",
        md: "w-11 h-6 p-0.5",
        lg: "w-14 h-7.5 p-1",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export const switchThumbVariants = cva(
  "pointer-events-none block rounded-full shadow-sm ring-0 transition-transform duration-200 ease-in-out",
  {
    variants: {
      size: {
        sm: "w-3.5 h-3.5",
        md: "w-5 h-5",
        lg: "w-5.5 h-5.5",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export const switchThumbTranslate: Record<"sm" | "md" | "lg", string> = {
  sm: "translate-x-3.5",
  md: "translate-x-5",
  lg: "translate-x-6.5",
};

export type SwitchTrackVariantProps = VariantProps<typeof switchTrackVariants>;
