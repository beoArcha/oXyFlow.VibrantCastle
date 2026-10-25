import React from "react";
import { cn } from "@lib/utils";
import { cardVariants, type CardVariant, type CardVariantProps } from "./card-variants";

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    CardVariantProps {
  /** Visual theme variant */
  variant?: CardVariant;
  /** Enables hover elevation and active press micro-interactions */
  interactive?: boolean;
}

export const CardHeader = React.memo(
  React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function CardHeader(
    { children, className, ...props },
    ref
  ) {
    return (
      <div
        ref={ref}
        data-slot="card-header"
        className={cn("flex flex-col gap-1 border-b border-border-medium pb-3", className)}
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
        data-slot="card-title"
        className={cn(
          "text-sm md:text-base font-bold text-amber-lighter flex items-center gap-2",
          className
        )}
        {...props}
      >
        {icon && <span className="text-amber-primary flex items-center shrink-0">{icon}</span>}
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
          data-slot="card-description"
          className={cn("text-xs text-border-accent font-normal leading-relaxed", className)}
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
      <div
        ref={ref}
        data-slot="card-content"
        className={cn("flex flex-col gap-3 flex-1", className)}
        {...props}
      >
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
        data-slot="card-footer"
        className={cn(
          "flex items-center justify-between border-t border-border-medium pt-3",
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
        data-slot="card"
        className={cn(cardVariants({ variant, interactive }), className)}
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
