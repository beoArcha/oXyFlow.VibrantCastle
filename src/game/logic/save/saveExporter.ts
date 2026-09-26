import { SaveState, SoundType } from "../../types";
import { gameAudio } from "../../engine/audioEngine";
import { saveLogger } from "../../logger/gameLogger";
import { Result, ok, err, SaveError, ErrorCode } from "../../../lib/errors";
import { ISaveExporter } from "./saveTypes";

/**
 * Handles JSON file generation and browser download dispatch (SRP).
 * Isolated from game state compilation and storage persistence.
 */
export class SaveExporter implements ISaveExporter {
  public exportToFile(state: SaveState, filename?: string): Result<true, SaveError> {
    try {
      if (
        typeof document === "undefined" ||
        typeof URL === "undefined" ||
        typeof Blob === "undefined"
      ) {
        return err(
          new SaveError(
            "DOM/File API unavailable for file export in current environment",
            ErrorCode.SAVE_WRITE_FAILED
          )
        );
      }

      const jsonStr = JSON.stringify(state, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const targetFilename =
        filename || `vibrant_castle_save_${new Date().toISOString().slice(0, 10)}.json`;

      const a = document.createElement("a");
      a.href = url;
      a.download = targetFilename;
      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      gameAudio.playSFX(SoundType.SFX_SAVE);
      return ok(true);
    } catch (errCause) {
      const exportError = new SaveError(
        "Failed to trigger file download",
        ErrorCode.SAVE_WRITE_FAILED,
        {
          cause: errCause,
        }
      );
      saveLogger.error(exportError.message, exportError.toLogContext(), exportError);
      return err(exportError);
    }
  }
}

export const defaultSaveExporter = new SaveExporter();
