import { GameBaseError } from "./GameBaseError";
import { ErrorCode, DomainErrorOptions } from "./types";

/**
 * Errors resulting from parsing or validating locations, characters, dialogues, and configurations.
 */
export class ParserError extends GameBaseError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.PARSER_INVALID_FORMAT,
    options?: DomainErrorOptions
  ) {
    super(message, {
      code,
      domain: "PARSER",
      severity: options?.severity ?? "ERROR",
      details: options?.details,
      cause: options?.cause,
    });
  }
}

/**
 * Errors resulting from encoding or decoding data structures via bidirectional Codecs.
 */
export class CodecError extends ParserError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.CODEC_DECODE_FAILED,
    options?: DomainErrorOptions
  ) {
    super(message, code, options);
  }
}
