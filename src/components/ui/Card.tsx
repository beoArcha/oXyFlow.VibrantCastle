import React from "react";
import { cn } from "../../lib/utils";

export type CardVariant = "default" | "subtle" | "dark" | "highlight";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const cardVariants: Record<CardVariant, string> = {
  default: "bg-[#26120b] border-2 border-[#8d4325] shadow-xl",
  subtle: "bg-[#1c0c07] border border-[#5c2d18] shadow-md",
  dark: "bg-[#140602] border border-[#3a1a0f] shadow-inner",
  highlight: "bg-[#2d140a] border-2 border-[#f59e0b] shadow-2xl shadow-amber-950/50",
};

export const Card: React.FC<CardProps> = ({
  children,
  variant = "default",
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "rounded-xl p-4 md:p-5 text-[#fef3c7] flex flex-col gap-3",
        cardVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={cn("flex flex-col gap-1 border-b border-[#5c2d18] pb-3", className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<
  React.HTMLAttributes<HTMLHeadingElement> & { icon?: React.ReactNode }
> = ({ children, icon, className, ...props }) => (
  <h3
    className={cn(
      "text-sm md:text-base font-bold text-[#fde68a] flex items-center gap-2",
      className
    )}
    {...props}
  >
    {icon && <span className="text-[#f59e0b] flex items-center shrink-0">{icon}</span>}
    <span>{children}</span>
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className,
  ...props
}) => (
  <p className={cn("text-xs text-[#d97706] font-normal leading-relaxed", className)} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={cn("flex flex-col gap-3 flex-1", className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={cn("flex items-center justify-between border-t border-[#5c2d18] pt-3", className)} {...props}>
    {children}
  </div>
);
