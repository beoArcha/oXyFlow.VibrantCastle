import { cva, type VariantProps } from "class-variance-authority";

export const inputVariants = cva(
  "w-full px-3 py-2 bg-surface-darkest/90 border rounded-lg text-stone-200 placeholder:text-stone-600 text-sm transition-all focus:outline-none focus:ring-1",
  {
    variants: {
      hasError: {
        true: "border-rose-600/80 focus:border-rose-500 focus:ring-rose-500/50 text-rose-100",
        false: "border-stone-800 focus:border-primary-500 focus:ring-primary-500/50 hover:border-stone-700",
      },
      family: {
        sans: "font-sans",
        mono: "font-mono",
      },
    },
    defaultVariants: {
      hasError: false,
      family: "sans",
    },
  }
);

export const textareaVariants = cva(
  "w-full px-3 py-2 bg-surface-darkest/90 border rounded-lg text-stone-200 placeholder:text-stone-600 text-sm transition-all focus:outline-none focus:ring-1",
  {
    variants: {
      hasError: {
        true: "border-rose-600/80 focus:border-rose-500 focus:ring-rose-500/50 text-rose-100",
        false: "border-stone-800 focus:border-primary-500 focus:ring-primary-500/50 hover:border-stone-700",
      },
      family: {
        sans: "font-sans",
        mono: "font-mono",
      },
    },
    defaultVariants: {
      hasError: false,
      family: "sans",
    },
  }
);

export type InputVariantProps = VariantProps<typeof inputVariants>;
export type TextareaVariantProps = VariantProps<typeof textareaVariants>;
