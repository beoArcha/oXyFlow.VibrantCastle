import { createContext, useContext } from "react";

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
 * @throws {Error} if used outside a Modal context.
 */
export function useModalContext(componentName: string): ModalContextValue {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error(`<Modal.${componentName}> must be rendered within an open <Modal> container.`);
  }
  return context;
}
