import React from "react";
import { cn } from "@lib/utils";
import { Heading } from "../../typography";
import { useModalContext } from "./ModalContext";

export interface ModalTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  icon?: React.ReactNode;
}

/**
 * Accessible title heading for modal dialogues adhering to WAI-ARIA aria-labelledby semantics.
 */
export const ModalTitle = React.memo(
  React.forwardRef<HTMLHeadingElement, ModalTitleProps>(function ModalTitle(
    { children, icon, className, id, ...props },
    ref
  ) {
    const { titleId } = useModalContext("Title");

    return (
      <Heading
        ref={ref}
        level={2}
        variant="gothic"
        size="lg"
        dropShadow
        truncate
        icon={icon}
        id={id ?? titleId}
        className={cn("text-primary-400 tracking-wide", className)}
        {...props}
      >
        {children}
      </Heading>
    );
  })
);

ModalTitle.displayName = "ModalTitle";

export default ModalTitle;
