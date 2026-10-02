export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "purple"
  | "ghost"
  | "outline"
  | "accent";

export const buttonVariantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[#b45309] hover:bg-[#d97706] text-[#fef3c7] border border-[#f59e0b] shadow-md shadow-amber-950/40 active:translate-y-px",
  secondary:
    "bg-[#1c0c07] hover:bg-[#321509] text-[#fed7aa] border border-[#5c2d18] hover:border-[#8d4325] active:translate-y-px",
  danger:
    "bg-red-900/80 hover:bg-red-800 text-white border border-red-500/60 shadow-md shadow-red-950/40 active:translate-y-px",
  purple:
    "bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-600/60 shadow-md shadow-purple-950/40 active:translate-y-px",
  ghost:
    "bg-transparent hover:bg-white/10 text-[#fed7aa] hover:text-white border border-transparent active:translate-y-px",
  outline:
    "bg-transparent hover:bg-[#b45309]/20 text-[#fbbf24] border border-[#f59e0b]/60 active:translate-y-px",
  accent:
    "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-[#140602] font-bold border border-amber-300 shadow-md active:translate-y-px",
};
