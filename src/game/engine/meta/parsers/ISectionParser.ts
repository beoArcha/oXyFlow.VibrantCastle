/**
 * Base Section Parser Contract (Liskov Substitution Principle - LSP).
 * Every section parser adheres to this uniform contract for validation,
 * parsing, and fallback default resolution.
 */
export interface ISectionParser<TOutput> {
  readonly sectionName: string;
  canParse(raw: unknown): boolean;
  parse(raw: unknown): TOutput;
}
