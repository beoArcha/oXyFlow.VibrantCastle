/**
 * Codec Utilities and Reusable Transformation Helpers
 *
 * Provides shared error constructors and pure mapping utilities for bidirectional codecs.
 */

import { CodecError, ErrorCode, Result, err, ok } from "../errors";
import { ValidationErrorDetail } from "../schemas";

/**
 * Creates a standardized CodecError for failed decoding operations.
 */
export function failCodecDecode<T>(
  entityName: string,
  errors: ValidationErrorDetail[],
  code = ErrorCode.CODEC_DECODE_FAILED
): Result<T, CodecError> {
  const messages = errors.map((e) => `${e.path}: ${e.message}`).join("; ");
  return err(
    new CodecError(
      `Failed to decode ${entityName}: ${messages}`,
      code,
      { details: { errors } }
    )
  );
}

/**
 * Creates a standardized CodecError for failed encoding operations.
 */
export function failCodecEncode<T>(
  entityName: string,
  errors: ValidationErrorDetail[],
  code = ErrorCode.CODEC_ENCODE_FAILED
): Result<T, CodecError> {
  const messages = errors.map((e) => `${e.path}: ${e.message}`).join("; ");
  return err(
    new CodecError(
      `Failed to encode ${entityName}: ${messages}`,
      code,
      { details: { errors } }
    )
  );
}

/**
 * Transforms an array of items with a transformer that returns Result<TOut, CodecError>.
 * Short-circuits on the first error encountered.
 */
export function transformArrayResult<TIn, TOut>(
  items: readonly TIn[],
  transform: (item: TIn, index: number) => Result<TOut, CodecError>
): Result<TOut[], CodecError> {
  const result: TOut[] = [];
  for (let i = 0; i < items.length; i++) {
    const res = transform(items[i], i);
    if (!res.isOk()) {
      return err(res.error);
    }
    result.push(res.value);
  }
  return ok(result);
}

/**
 * Transforms a dictionary using an entry transformer returning Result<TOut, CodecError>.
 * Short-circuits on the first error encountered.
 */
export function transformDictionaryResult<TIn, TOut>(
  dict: Record<string, TIn>,
  transform: (item: TIn, key: string) => Result<TOut, CodecError>,
  getKey?: (item: TOut, originalKey: string) => string
): Result<Record<string, TOut>, CodecError> {
  const result: Record<string, TOut> = {};
  for (const [key, item] of Object.entries(dict)) {
    const res = transform(item, key);
    if (!res.isOk()) {
      return err(res.error);
    }
    const outKey = getKey ? getKey(res.value, key) : key;
    result[outKey] = res.value;
  }
  return ok(result);
}
