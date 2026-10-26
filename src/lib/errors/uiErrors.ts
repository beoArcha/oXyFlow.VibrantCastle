import { GameBaseError } from "./GameBaseError";
import { ErrorCode, DomainErrorOptions } from "./types";

/**
 * Errors occurring within React UI components, boundaries, and context providers.
 */
export class UIError extends GameBaseError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UI_RENDER_FAILURE,
    options?: DomainErrorOptions
  ) {
    super(message, {
      code,
      domain: "REACT",
      severity: options?.severity ?? "ERROR",
      details: options?.details,
      cause: options?.cause,
    });
  }
}

/**
 * Specialized UI error thrown when a custom hook is invoked outside its corresponding context provider.
 */
export class MissingContextProviderError extends UIError {
  public readonly hookName: string;
  public readonly providerName: string;

  constructor(hookName: string, providerName: string) {
    super(
      `Hook "${hookName}" must be used within a <${providerName} />`,
      ErrorCode.REACT_MISSING_CONTEXT,
      {
        severity: "FATAL",
        details: { hookName, providerName },
      }
    );
    this.hookName = hookName;
    this.providerName = providerName;
  }
}

/**
 * Specialized UI error thrown when a Tabs subcomponent is rendered outside a Tabs container.
 */
export class TabsContextViolationError extends UIError {
  public readonly componentName: string;

  constructor(componentName: string) {
    super(
      `<Tabs.${componentName}> must be rendered within a <Tabs> container.`,
      ErrorCode.UI_TABS_CONTEXT_VIOLATION,
      {
        severity: "FATAL",
        details: { componentName },
      }
    );
    this.componentName = componentName;
  }
}

/**
 * Specialized UI error thrown when a Modal subcomponent is rendered outside a Modal container.
 */
export class ModalContextViolationError extends UIError {
  public readonly componentName: string;

  constructor(componentName: string) {
    super(
      `<Modal.${componentName}> must be rendered within an open <Modal> container.`,
      ErrorCode.UI_MODAL_CONTEXT_VIOLATION,
      {
        severity: "FATAL",
        details: { componentName },
      }
    );
    this.componentName = componentName;
  }
}

/**
 * Specialized UI error thrown when GameErrorBoundary compound subcomponents are rendered outside a GameErrorBoundary state.
 */
export class GameErrorContextViolationError extends UIError {
  constructor(
    message = "GameErrorBoundary compound subcomponents must be rendered within a GameErrorBoundary error state."
  ) {
    super(message, ErrorCode.REACT_MISSING_CONTEXT, {
      severity: "FATAL",
      details: { context: "GameErrorContext" },
    });
  }
}
