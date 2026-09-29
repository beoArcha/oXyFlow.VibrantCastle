import React from "react";
import { cn } from "@lib/utils";

export type CardVariant = "default" | "subtle" | "dark" | "highlight" | "ghost" | "panel";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual theme variant */
  variant?: CardVariant;
  /** Enables hover elevation and active press micro-interactions */
  interactive?: boolean;
}

const cardVariants: Record<CardVariant, string> = {
  default: "bg-[#26120b] border-2 border-[#8d4325] shadow-xl",
  subtle: "bg-[#1c0c07] border border-[#5c2d18] shadow-md",
  dark: "bg-[#140602] border border-[#3a1a0f] shadow-inner",
  highlight: "bg-[#2d140a] border-2 border-[#f59e0b] shadow-2xl shadow-amber-950/50",
  ghost: "bg-transparent border border-transparent shadow-none",
  panel: "bg-[#200e08]/95 border border-[#6b351c] shadow-lg backdrop-blur-sm",
};

export const CardHeader = React.memo(
  React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function CardHeader(
    { children, className, ...props },
    ref
  ) {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-1 border-b border-[#5c2d18] pb-3", className)}
        {...props}
      >
        {children}
      </div>
    );
  })
);
CardHeader.displayName = "CardHeader";

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  icon?: React.ReactNode;
}

export const CardTitle = React.memo(
  React.forwardRef<HTMLHeadingElement, CardTitleProps>(function CardTitle(
    { children, icon, className, ...props },
    ref
  ) {
    return (
      <h3
        ref={ref}
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
  })
);
CardTitle.displayName = "CardTitle";

export const CardDescription = React.memo(
  React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    function CardDescription({ children, className, ...props }, ref) {
      return (
        <p
          ref={ref}
          className={cn("text-xs text-[#d97706] font-normal leading-relaxed", className)}
          {...props}
        >
          {children}
        </p>
      );
    }
  )
);
CardDescription.displayName = "CardDescription";

export const CardContent = React.memo(
  React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function CardContent(
    { children, className, ...props },
    ref
  ) {
    return (
      <div ref={ref} className={cn("flex flex-col gap-3 flex-1", className)} {...props}>
        {children}
      </div>
    );
  })
);
CardContent.displayName = "CardContent";

export const CardFooter = React.memo(
  React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function CardFooter(
    { children, className, ...props },
    ref
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-between border-t border-[#5c2d18] pt-3",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  })
);
CardFooter.displayName = "CardFooter";

const CardRoot = React.memo(
  React.forwardRef<HTMLDivElement, CardProps>(function Card(
    { children, variant = "default", interactive = false, className, ...props },
    ref
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl p-4 md:p-5 text-[#fef3c7] flex flex-col gap-3",
          cardVariants[variant],
          interactive &&
            "hover:border-[#d97706] hover:bg-[#30160d] transition-all duration-200 cursor-pointer active:scale-[0.99]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  })
);
CardRoot.displayName = "Card";

export interface CardComponent
  extends React.MemoExoticComponent<
    React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLDivElement>>
  > {
  Header: typeof CardHeader;
  Title: typeof CardTitle;
  Description: typeof CardDescription;
  Content: typeof CardContent;
  Footer: typeof CardFooter;
}

export const Card = CardRoot as unknown as CardComponent;
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
