import { createContext, useContext } from "react";
import { ModalContextViolationError } from "@lib/errors";

export interface ModalContextValue {
  isOpen: boolean;
  onClose: () => void;
  isMaximized: boolean;
  toggleMaximize?: () => void;
  allowMaximize?: boolean;
  titleId: string;
}

export const ModalContext = createContext<ModalContextValue | null>(null);

/**
 * Accesses parent modal state and actions.
 *
 * @throws {ModalContextViolationError} if used outside a Modal context.
 */
export function useModalContext(componentName: string): ModalContextValue {
  const context = useContext(ModalContext);
  if (!context) {
    throw new ModalContextViolationError(componentName);
  }
  return context;
}
