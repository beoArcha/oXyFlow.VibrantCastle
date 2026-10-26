import { ILogger } from "./types";
import { getLogger } from "./LoggerManager";
import { ErrorCode, SystemError } from "../errors";

let isInitialized = false;
let errorHandler: ((event: ErrorEvent) => void) | null = null;
let rejectionHandler: ((event: PromiseRejectionEvent) => void) | null = null;

export function initGlobalErrorHandlers(customLogger?: ILogger): () => void {
  if (typeof window === "undefined" || isInitialized) {
    return cleanupGlobalErrorHandlers;
  }

  const logger = customLogger || getLogger("system");

  errorHandler = (event: ErrorEvent) => {
    logger.fatal(
      `Uncaught window exception: ${event.message || "Unknown error"}`,
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
      event.error ||
        new SystemError(
          event.message || "Uncaught window exception",
          ErrorCode.SYSTEM_UNCAUGHT_EXCEPTION,
          {
            details: {
              filename: event.filename,
              lineno: event.lineno,
              colno: event.colno,
            },
          }
        )
    );
  };

  rejectionHandler = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason);

    logger.error(
      `Unhandled promise rejection: ${message}`,
      undefined,
      reason instanceof Error
        ? reason
        : new SystemError(message, ErrorCode.SYSTEM_UNHANDLED_REJECTION, {
            cause: reason,
          })
    );
  };

  window.addEventListener("error", errorHandler);
  window.addEventListener("unhandledrejection", rejectionHandler);
  isInitialized = true;

  logger.info("Global browser error handlers initialized");

  return cleanupGlobalErrorHandlers;
}

export function cleanupGlobalErrorHandlers(): void {
  if (typeof window === "undefined" || !isInitialized) {
    return;
  }

  if (errorHandler) {
    window.removeEventListener("error", errorHandler);
    errorHandler = null;
  }

  if (rejectionHandler) {
    window.removeEventListener("unhandledrejection", rejectionHandler);
    rejectionHandler = null;
  }

  isInitialized = false;
}
