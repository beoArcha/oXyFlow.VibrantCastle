import { describe, it, expect } from "bun:test";
import { stripComments } from "../archScanner";

describe("archScanner Helper Unit Tests", () => {
  it("strips single-line comments while preserving exact line count and code", () => {
    const code = `
const a = 1; // comment here
const b = 2;
    `.trim();

    const stripped = stripComments(code);
    expect(stripped.split("\n").length).toBe(code.split("\n").length);
    expect(stripped).not.toContain("comment here");
    expect(stripped).toContain("const a = 1;");
    expect(stripped).toContain("const b = 2;");
  });

  it("strips multi-line block comments while preserving exact line count", () => {
    const code = `
const a = 1;
/*
  Multi line comment
  window.alert("danger");
*/
const b = 2;
    `.trim();

    const stripped = stripComments(code);
    expect(stripped.split("\n").length).toBe(code.split("\n").length);
    expect(stripped).not.toContain("window.alert");
    expect(stripped).toContain("const a = 1;");
    expect(stripped).toContain("const b = 2;");
  });

  it("preserves string literals containing slashes or comment-like sequences", () => {
    const code = `
const url = "https://example.com/api";
const template = \`line 1 // not a comment
line 2\`;
const regexStr = '/* not comment */';
    `.trim();

    const stripped = stripComments(code);
    expect(stripped).toContain("https://example.com/api");
    expect(stripped).toContain("// not a comment");
    expect(stripped).toContain("/* not comment */");
  });
});
