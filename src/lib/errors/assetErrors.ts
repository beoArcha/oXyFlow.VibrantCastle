import { GameBaseError } from "./GameBaseError";
import { ErrorCode, DomainErrorOptions } from "./types";

/**
 * Errors related to loading, decoding, or extracting assets, sprites, and sounds.
 */
export class AssetError extends GameBaseError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.ASSET_LOAD_FAILED,
    options?: DomainErrorOptions
  ) {
    super(message, {
      code,
      domain: "ASSET",
      severity: options?.severity ?? "ERROR",
      details: options?.details,
      cause: options?.cause,
    });
  }
}
