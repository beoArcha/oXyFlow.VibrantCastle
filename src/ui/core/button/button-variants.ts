import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center font-sans transition-all cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:shadow-none",
  {
    variants: {
      variant: {
        primary:
          "bg-amber-dark hover:bg-border-accent text-amber-lighter border border-amber-primary shadow-md shadow-amber-950/40 active:translate-y-px",
        secondary:
          "bg-surface-darker hover:bg-surface-card-hover text-amber-lighter border border-border-medium hover:border-border-strong active:translate-y-px",
        danger:
          "bg-red-900/80 hover:bg-red-800 text-white border border-red-500/60 shadow-md shadow-red-950/40 active:translate-y-px",
        purple:
          "bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-600/60 shadow-md shadow-purple-950/40 active:translate-y-px",
        ghost:
          "bg-transparent hover:bg-white/10 text-amber-lighter hover:text-white border border-transparent active:translate-y-px",
        outline:
          "bg-transparent hover:bg-amber-dark/20 text-amber-light border border-amber-primary/60 active:translate-y-px",
        accent:
          "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-surface-darkest font-bold border border-amber-300 shadow-md active:translate-y-px",
      },
      size: {
        sm: "px-3 py-1.5 min-h-[32px] text-xs gap-1.5 rounded-md",
        md: "px-4 py-2 min-h-[38px] text-xs font-semibold gap-2 rounded-lg",
        lg: "px-6 py-3 min-h-[46px] text-sm font-bold gap-2.5 rounded-xl",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  }
);

export const iconButtonVariants = cva(
  "inline-flex items-center justify-center font-sans transition-all cursor-pointer select-none shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:shadow-none",
  {
    variants: {
      variant: {
        primary:
          "bg-amber-dark hover:bg-border-accent text-amber-lighter border border-amber-primary shadow-md shadow-amber-950/40 active:translate-y-px",
        secondary:
          "bg-surface-darker hover:bg-surface-card-hover text-amber-lighter border border-border-medium hover:border-border-strong active:translate-y-px",
        danger:
          "bg-red-900/80 hover:bg-red-800 text-white border border-red-500/60 shadow-md shadow-red-950/40 active:translate-y-px",
        purple:
          "bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-600/60 shadow-md shadow-purple-950/40 active:translate-y-px",
        ghost:
          "bg-transparent hover:bg-white/10 text-amber-lighter hover:text-white border border-transparent active:translate-y-px",
        outline:
          "bg-transparent hover:bg-amber-dark/20 text-amber-light border border-amber-primary/60 active:translate-y-px",
        accent:
          "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-surface-darkest font-bold border border-amber-300 shadow-md active:translate-y-px",
      },
      size: {
        xs: "w-5 h-5 min-w-[20px] min-h-[20px] p-0 text-[10px] rounded",
        sm: "w-6 h-6 min-w-[24px] min-h-[24px] p-0 text-xs rounded-md",
        md: "w-8 h-8 min-w-[32px] min-h-[32px] p-0 text-sm rounded-lg",
        lg: "w-10 h-10 min-w-[40px] min-h-[40px] p-0 text-base rounded-xl",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "sm",
    },
  }
);

export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
export type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>;
export type IconButtonSize = NonNullable<VariantProps<typeof iconButtonVariants>["size"]>;

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
export type IconButtonVariantProps = VariantProps<typeof iconButtonVariants>;

export const buttonVariantStyles: Record<ButtonVariant, string> = {
  primary: buttonVariants({ variant: "primary" }),
  secondary: buttonVariants({ variant: "secondary" }),
  danger: buttonVariants({ variant: "danger" }),
  purple: buttonVariants({ variant: "purple" }),
  ghost: buttonVariants({ variant: "ghost" }),
  outline: buttonVariants({ variant: "outline" }),
  accent: buttonVariants({ variant: "accent" }),
};
