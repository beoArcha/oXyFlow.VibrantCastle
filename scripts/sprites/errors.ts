import { AssetError, ErrorCode } from "../../src/lib/errors";

export function spriteError(message: string, details?: Record<string, unknown>, cause?: unknown): AssetError {
  return new AssetError(message, ErrorCode.ASSET_CORRUPTED, { details, cause });
}
