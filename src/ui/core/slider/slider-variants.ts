import { cva, type VariantProps } from "class-variance-authority";

export const sliderTrackVariants = cva(
  "w-full h-1.5 bg-surface-darkest rounded-lg appearance-none cursor-pointer accent-primary-500 border border-border-strong disabled:cursor-not-allowed transition-colors"
);

export const sliderLabelVariants = cva(
  "text-amber-200 font-medium flex items-center gap-1.5 cursor-pointer"
);

export const sliderValueVariants = cva(
  "font-bold text-primary-400 font-mono tracking-tight"
);

export type SliderTrackVariantProps = VariantProps<typeof sliderTrackVariants>;
