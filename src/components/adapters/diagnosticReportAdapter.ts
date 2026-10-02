import { LoggerManager } from "@lib/logger";
import { GameBaseError } from "@lib/errors";

/**
 * Adapter generating a detailed diagnostic crash report from the game engine and logger ring buffer.
 * Decouples presentation Error Boundary primitives from domain errors and engine state.
 */
export async function formatGameDiagnosticReport(
  error: Error | null,
  componentStack: string | null
): Promise<string> {
  const ringBuffer = LoggerManager.getInstance().ringBuffer;
  const logs = ringBuffer.exportAsText();
  const gameError = error instanceof GameBaseError ? error : null;

  return [
    "=== VIBRANT CASTLE CRASH REPORT ===",
    `Timestamp: ${new Date().toISOString()}`,
    `Error: ${error?.name || "Error"}: ${error?.message || "Unknown"}`,
    gameError ? `Domain: ${gameError.domain}` : null,
    gameError ? `Code: ${gameError.code}` : null,
    gameError?.details ? `Details: ${JSON.stringify(gameError.details, null, 2)}` : null,
    gameError ? `Log Context: ${JSON.stringify(gameError.toLogContext(), null, 2)}` : null,
    `Stack: ${error?.stack || "No stack"}`,
    `Component Stack: ${componentStack || "No component stack"}`,
    "\n=== RECENT GAME LOGS ===",
    logs || "No logs in ring buffer",
  ]
    .filter(Boolean)
    .join("\n");
}
