/**
 * Bidirectional Codec Interface Contract
 * 
 * Provides type-safe bidirectional transformations between external JSON data structures
 * and internal strongly typed domain entities, with rich Result<T, CodecError> handling.
 */

import { Result, CodecError } from "../errors";

export interface Codec<TJson, TDomain> {
  readonly name: string;
  decode(raw: unknown): Result<TDomain, CodecError>;
  encode(domain: TDomain): Result<TJson, CodecError>;
}

export interface ArrayCodec<TJson, TDomain> extends Codec<TJson[], TDomain[]> {
  decodeItem(raw: unknown): Result<TDomain, CodecError>;
  encodeItem(domain: TDomain): Result<TJson, CodecError>;
}

export interface DictionaryCodec<TJson, TDomain>
  extends Codec<Record<string, TJson>, Record<string, TDomain>> {
  decodeItem(raw: unknown): Result<TDomain, CodecError>;
  encodeItem(domain: TDomain): Result<TJson, CodecError>;
}
