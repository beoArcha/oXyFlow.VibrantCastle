import { cva, type VariantProps } from "class-variance-authority";

export const toastVariants = cva(
  "px-4 py-2 rounded-xl shadow-2xl text-xs font-bold border flex items-center justify-between gap-2 select-none animate-in fade-in duration-200",
  {
    variants: {
      variant: {
        info: "bg-amber-600 text-white border-amber-400 shadow-amber-950/40",
        success: "bg-emerald-700 text-white border-emerald-500 shadow-emerald-950/40",
        warning: "bg-orange-600 text-white border-orange-400 shadow-orange-950/40",
        danger: "bg-red-700 text-white border-red-500 shadow-red-950/40",
      },
      position: {
        top: "fixed top-14 left-1/2 -translate-x-1/2 z-50",
        bottom: "fixed bottom-14 left-1/2 -translate-x-1/2 z-50",
        inline: "w-full",
      },
    },
    defaultVariants: {
      variant: "info",
      position: "top",
    },
  }
);

export type ToastVariantProps = VariantProps<typeof toastVariants>;
