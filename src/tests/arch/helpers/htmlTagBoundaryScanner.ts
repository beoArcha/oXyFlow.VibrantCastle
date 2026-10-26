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
 * Canonical registry of prohibited raw HTML tags outside @ui.
 * Extensible: adding any new forbidden HTML tag requires only a 1-line entry here.
 */
export const FORBIDDEN_HTML_TAGS_REGISTRY: readonly ForbiddenTagRule[] = [
  // Typography (Headings)
  { tag: "h1", category: "typography", replacement: "<Heading level={1}>", reason: "Must use @ui Heading instead of raw <h1>" },
  { tag: "h2", category: "typography", replacement: "<Heading level={2}>", reason: "Must use @ui Heading instead of raw <h2>" },
  { tag: "h3", category: "typography", replacement: "<Heading level={3}>", reason: "Must use @ui Heading instead of raw <h3>" },
  { tag: "h4", category: "typography", replacement: "<Heading level={4}>", reason: "Must use @ui Heading instead of raw <h4>" },
  { tag: "h5", category: "typography", replacement: "<Heading level={5}>", reason: "Must use @ui Heading instead of raw <h5>" },
  { tag: "h6", category: "typography", replacement: "<Heading level={6}>", reason: "Must use @ui Heading instead of raw <h6>" },
  // Typography (Body)
  { tag: "p", category: "typography", replacement: "<Paragraph>", reason: "Must use @ui Paragraph instead of raw <p>" },
  // Interactive Controls
  { tag: "button", category: "control", replacement: "<Button> or <IconButton>", reason: "Must use @ui Button/IconButton instead of raw <button>" },
  // Forms
  { tag: "input", category: "form", replacement: "<Input> or <SearchInput>", reason: "Must use @ui Input instead of raw <input>" },
  { tag: "textarea", category: "form", replacement: "<Textarea>", reason: "Must use @ui Textarea instead of raw <textarea>" },
  { tag: "select", category: "form", replacement: "<Select>", reason: "Must use @ui Select instead of raw <select>" },
];

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
