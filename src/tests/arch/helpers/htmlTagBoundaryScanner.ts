import fs from "fs";
import path from "path";
import { LayerBoundaryViolationError } from "@lib/errors";
import { stripComments } from "./archScanner";

export interface ForbiddenTagRule {
  /** The lowercase tag name to prohibit (e.g. 'button', 'input', 'h1', 'p') */
  readonly tag: string;
  /** Categorization for diagnostics and reporting */
  readonly category: "typography" | "control" | "form" | "layout";
  /** Recommended replacement from @ui */
  readonly replacement: string;
  /** Rationale for the architectural prohibition */
  readonly reason: string;
}

export interface TagScanViolation {
  readonly file: string;
  readonly lineNo: number;
  readonly tag: string;
  readonly replacement: string;
  readonly line: string;
  readonly reason: string;
}

/**
 * Builds an isolated tag matching regex that targets JSX element openings (<tag ...> or <tag/>)
 * while ignoring comparison operators (a < b), type generics (Promise<T>), or hyphenated tag names.
 */
export function buildTagRegex(tag: string): RegExp {
  return new RegExp(`(?<![a-zA-Z0-9_$])<\\s*(${tag})\\b(?![a-zA-Z0-9_-])`);
}

/**
 * Scans a list of source files against a declarative registry of prohibited HTML tags.
 * Comments are stripped prior to inspection to avoid false positives in documentation.
 */
export function scanFilesForForbiddenTags(
  files: readonly string[],
  rules: readonly ForbiddenTagRule[],
  rootDir: string
): TagScanViolation[] {
  const violations: TagScanViolation[] = [];
  if (files.length === 0 || rules.length === 0) return violations;

  // Pre-compile regexes for each rule to avoid re-compilation per line
  const compiledRules = rules.map((rule) => ({
    rule,
    regex: buildTagRegex(rule.tag),
  }));

  for (const file of files) {
    const rawContent = fs.readFileSync(file, "utf-8");
    const cleanContent = stripComments(rawContent);
    const lines = cleanContent.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.includes("<")) continue;

      for (const { rule, regex } of compiledRules) {
        if (!regex.test(line)) continue;

        violations.push({
          file: path.relative(rootDir, file).replace(/\\/g, "/"),
          lineNo: i + 1,
          tag: rule.tag,
          replacement: rule.replacement,
          line: line.trim(),
          reason: rule.reason,
        });
      }
    }
  }

  return violations;
}

/**
 * Asserts zero forbidden tag violations exist. If violations are present,
 * throws a structured LayerBoundaryViolationError with diagnostic details.
 */
export function assertZeroForbiddenTagViolations(
  violations: readonly TagScanViolation[],
  scopeDescription: string
): void {
  if (violations.length === 0) return;

  const summary = violations
    .map((v) => `  ${v.file}:${v.lineNo} -> <${v.tag}> (Use ${v.replacement}) [${v.line}]`)
    .join("\n");

  throw new LayerBoundaryViolationError(
    `Forbidden HTML tag boundary violated in ${scopeDescription} (${violations.length} breach(es)):\n${summary}`,
    violations as unknown[]
  );
}
