import fs from "fs";
import path from "path";

export interface ImportViolation {
  file: string;
  lineNo: number;
  line: string;
}

export interface CrossGroupViolation {
  file: string;
  lineNo: number;
  line: string;
  fromGroup: string;
  toGroup: string;
}

/**
 * Strips single-line and multi-line comments from TypeScript/JavaScript source code
 * while preserving exact line count and character positions (replaces comment characters with spaces).
 * String literals (single quotes, double quotes, template literals) are strictly preserved.
 */
export function stripComments(code: string): string {
  return code.replace(
    /("(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|`(?:\\[\s\S]|[^`\\])*`)|(\/\*[\s\S]*?\*\/|\/\/[^\r\n]*)/g,
    (match, str, comment) => {
      if (str) return str;
      if (comment) {
        return match.replace(/[^\r\n]/g, " ");
      }
      return match;
    }
  );
}

/**
 * Deterministically scans a directory recursively, filtering files by extension regex
 * and ignoring common build and version control directories (node_modules, .git, dist).
 */
export function getAllSourceFiles(dir: string, extensionRegex = /\.(ts|tsx)$/): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".git" && entry.name !== "dist") {
        results = results.concat(getAllSourceFiles(fullPath, extensionRegex));
      }
    } else if (entry.isFile() && extensionRegex.test(entry.name)) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Finds lines in the provided files matching forbiddenPattern, automatically stripping comments
 * to prevent false positives from documentation or commented-out code.
 */
export function findImportViolations(
  files: string[],
  forbiddenPattern: RegExp,
  rootDir: string
): ImportViolation[] {
  const violations: ImportViolation[] = [];

  for (const file of files) {
    const rawContent = fs.readFileSync(file, "utf-8");
    const cleanContent = stripComments(rawContent);
    const lines = cleanContent.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (forbiddenPattern.test(line)) {
        violations.push({
          file: path.relative(rootDir, file).replace(/\\/g, "/"),
          lineNo: i + 1,
          line: line.trim(),
        });
      }
    }
  }

  return violations;
}

/**
 * Scans the src directory for relative imports that cross top-level domain boundaries
 * (e.g. components importing game, or game importing lib using relative traversal instead of @ aliases).
 * Intra-group relative imports (e.g. game/physics importing game/types) are permitted.
 * Comments are stripped prior to inspection to avoid false positives.
 */
export function findCrossGroupRelativeImports(
  rootDir: string,
  allowedTargetGroups: Set<string> = new Set()
): CrossGroupViolation[] {
  const srcDir = path.join(rootDir, "src");
  const allFiles = getAllSourceFiles(srcDir);
  const topGroups = ["assets", "components", "context", "data", "developer", "game", "i18n", "lib", "test-utils", "ui"];
  const violations: CrossGroupViolation[] = [];

  for (const file of allFiles) {
    const relFile = path.relative(srcDir, file).replace(/\\/g, "/");
    const fromGroup = relFile.split("/")[0];
    if (!topGroups.includes(fromGroup)) continue;

    const rawContent = fs.readFileSync(file, "utf-8");
    const cleanContent = stripComments(rawContent);
    const lines = cleanContent.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/(?:from|import)\s*\(?['"](\.[^'"]+)['"]/);
      if (match) {
        const importPath = match[1];
        const resolvedTarget = path.normalize(path.join(path.dirname(file), importPath));
        const relTarget = path.relative(srcDir, resolvedTarget).replace(/\\/g, "/");
        const toGroup = relTarget.split("/")[0];

        if (topGroups.includes(toGroup) && fromGroup !== toGroup) {
          if (!allowedTargetGroups.has(toGroup)) {
            violations.push({
              file: relFile,
              lineNo: i + 1,
              line: line.trim(),
              fromGroup,
              toGroup,
            });
          }
        }
      }
    }
  }

  return violations;
}
