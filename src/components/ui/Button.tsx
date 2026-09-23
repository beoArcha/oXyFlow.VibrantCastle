import React from "react";
import { cn } from "../../lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "purple"
  | "ghost"
  | "outline"
  | "accent";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[#b45309] hover:bg-[#d97706] text-[#fef3c7] border border-[#f59e0b] shadow-md shadow-amber-950/40 active:translate-y-px",
  secondary:
    "bg-[#1c0c07] hover:bg-[#321509] text-[#fed7aa] border border-[#5c2d18] hover:border-[#8d4325] active:translate-y-px",
  danger:
    "bg-red-900/80 hover:bg-red-800 text-white border border-red-500/60 shadow-md shadow-red-950/40 active:translate-y-px",
  purple:
    "bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-600/60 shadow-md shadow-purple-950/40 active:translate-y-px",
  ghost:
    "bg-transparent hover:bg-white/5 text-[#fed7aa] border border-transparent active:translate-y-px",
  outline:
    "bg-transparent hover:bg-[#b45309]/20 text-[#fbbf24] border border-[#f59e0b]/60 active:translate-y-px",
  accent:
    "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-[#140602] font-bold border border-amber-300 shadow-md active:translate-y-px",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1 text-xs gap-1.5 rounded-md",
  md: "px-4 py-2 text-xs font-semibold gap-2 rounded-lg",
  lg: "px-6 py-3 text-sm font-bold gap-2.5 rounded-xl",
};

export const Button: React.FC<ButtonProps> = React.memo(({
  children,
  variant = "primary",
  size = "md",
  icon,
  fullWidth = false,
  className,
  disabled,
  ...props
}) => {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-sans transition-all cursor-pointer select-none",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        className
      )}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
});

export default Button;
