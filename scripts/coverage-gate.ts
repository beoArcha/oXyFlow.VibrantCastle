/**
 * Vibrant Castle — Automated Test Coverage Quality Gate
 * Evaluates unit, integration, and combined coverage from LCOV profiles,
 * enforces quality thresholds from declarative JSON config, prints clean terminal tables,
 * emits GitHub Actions annotations, and publishes Markdown to GitHub Step Summary.
 */

import { readFileSync, existsSync, appendFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

export interface FileCoverageRecord {
  filePath: string;
  lines: Map<number, number>;
  funcs: Map<string, number>;
}

export interface CoverageMetrics {
  totalLines: number;
  hitLines: number;
  linePct: number;
  totalFuncs: number;
  hitFuncs: number;
  funcPct: number;
}

export interface CoverageThresholds {
  unitMin: number;
  integrationMin: number;
  combinedMin: number;
}

export interface CoverageGateResult {
  unit: CoverageMetrics;
  integration: CoverageMetrics;
  combined: CoverageMetrics;
  thresholds: CoverageThresholds;
  unitPassed: boolean;
  integrationPassed: boolean;
  combinedPassed: boolean;
  passed: boolean;
}

export interface CoverageGateOptions {
  unitLcovPath?: string;
  integrationLcovPath?: string;
  configPath?: string;
  thresholds?: Partial<CoverageThresholds>;
  summaryFilePath?: string;
}

export const FALLBACK_THRESHOLDS: CoverageThresholds = {
  unitMin: 60,
  integrationMin: 40,
  combinedMin: 80,
};

/**
 * Loads declarative thresholds from JSON config file with fallback.
 */
export function loadThresholdsConfig(configPath?: string): CoverageThresholds {
  const candidates = [
    configPath,
    join(import.meta.dirname, 'coverage.json'),
    resolve(process.cwd(), 'scripts', 'coverage.json'),
    resolve(process.cwd(), 'coverage.json'),
  ].filter((p): p is string => Boolean(p));

  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    try {
      const raw = readFileSync(candidate, 'utf8');
      const parsed = JSON.parse(raw);
      return {
        unitMin: typeof parsed.unitMin === 'number' ? parsed.unitMin : FALLBACK_THRESHOLDS.unitMin,
        integrationMin: typeof parsed.integrationMin === 'number' ? parsed.integrationMin : FALLBACK_THRESHOLDS.integrationMin,
        combinedMin: typeof parsed.combinedMin === 'number' ? parsed.combinedMin : FALLBACK_THRESHOLDS.combinedMin,
      };
    } catch (err) {
      console.warn(`[coverage-gate] Failed parsing config at ${candidate}:`, err);
    }
  }

  return FALLBACK_THRESHOLDS;
}

/**
 * Parses an LCOV format string into structured per-file coverage maps.
 */
export function parseLcovContent(content: string): Map<string, FileCoverageRecord> {
  const files = new Map<string, FileCoverageRecord>();
  if (!content.trim()) return files;

  const lines = content.split('\n');
  let currentFile: FileCoverageRecord | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith('SF:')) {
      const filePath = line.substring(3).trim().replace(/\\/g, '/');
      currentFile = files.get(filePath) || {
        filePath,
        lines: new Map<number, number>(),
        funcs: new Map<string, number>(),
      };
      files.set(filePath, currentFile);
      continue;
    }

    if (!currentFile) continue;

    if (line.startsWith('DA:')) {
      const [lineStr, countStr] = line.substring(3).split(',');
      const lineNum = parseInt(lineStr, 10);
      const hitCount = parseInt(countStr, 10) || 0;
      const prev = currentFile.lines.get(lineNum) || 0;
      currentFile.lines.set(lineNum, prev + hitCount);
    } else if (line.startsWith('FNDA:')) {
      const commaIdx = line.indexOf(',', 5);
      if (commaIdx !== -1) {
        const hitCount = parseInt(line.substring(5, commaIdx), 10) || 0;
        const funcName = line.substring(commaIdx + 1);
        const prev = currentFile.funcs.get(funcName) || 0;
        currentFile.funcs.set(funcName, prev + hitCount);
      }
    } else if (line.startsWith('FN:')) {
      const commaIdx = line.indexOf(',', 3);
      if (commaIdx !== -1) {
        const funcName = line.substring(commaIdx + 1);
        if (!currentFile.funcs.has(funcName)) {
          currentFile.funcs.set(funcName, 0);
        }
      }
    } else if (line === 'end_of_record') {
      currentFile = null;
    }
  }

  return files;
}

/**
 * Reads and parses an LCOV file from disk. Returns empty map if file is missing.
 */
export function parseLcovFile(filePath: string): Map<string, FileCoverageRecord> {
  if (!existsSync(filePath)) {
    return new Map<string, FileCoverageRecord>();
  }
  const content = readFileSync(filePath, 'utf8');
  return parseLcovContent(content);
}

/**
 * Merges multiple LCOV file records, taking line and function hits cumulatively.
 */
export function mergeCoverageMaps(
  maps: Array<Map<string, FileCoverageRecord>>
): Map<string, FileCoverageRecord> {
  const merged = new Map<string, FileCoverageRecord>();

  for (const map of maps) {
    for (const [filePath, record] of map.entries()) {
      let target = merged.get(filePath);
      if (!target) {
        target = {
          filePath,
          lines: new Map<number, number>(),
          funcs: new Map<string, number>(),
        };
        merged.set(filePath, target);
      }

      for (const [lineNum, count] of record.lines.entries()) {
        const prev = target.lines.get(lineNum) || 0;
        target.lines.set(lineNum, prev + count);
      }

      for (const [funcName, count] of record.funcs.entries()) {
        const prev = target.funcs.get(funcName) || 0;
        target.funcs.set(funcName, prev + count);
      }
    }
  }

  return merged;
}

/**
 * Computes percentage and count metrics from structured file coverage records.
 */
export function calculateCoverageMetrics(
  files: Map<string, FileCoverageRecord>
): CoverageMetrics {
  let totalLines = 0;
  let hitLines = 0;
  let totalFuncs = 0;
  let hitFuncs = 0;

  for (const record of files.values()) {
    for (const count of record.lines.values()) {
      totalLines++;
      if (count > 0) hitLines++;
    }
    for (const count of record.funcs.values()) {
      totalFuncs++;
      if (count > 0) hitFuncs++;
    }
  }

  const linePct = totalLines > 0 ? (hitLines / totalLines) * 100 : 0;
  const funcPct = totalFuncs > 0 ? (hitFuncs / totalFuncs) * 100 : 0;

  return {
    totalLines,
    hitLines,
    linePct: Math.round(linePct * 100) / 100,
    totalFuncs,
    hitFuncs,
    funcPct: Math.round(funcPct * 100) / 100,
  };
}

/**
 * Formats clean terminal/log output for CLI and CI runners.
 */
export function formatCoverageCli(result: CoverageGateResult): string {
  const statusStr = (passed: boolean) => (passed ? '[PASS]' : '[FAIL]');
  const lines = [
    '================================================================================',
    '                  Vibrant Castle — Test Coverage Quality Gate                  ',
    '================================================================================',
    '  Suite              Line Coverage       Func Coverage     Threshold    Status  ',
    '--------------------------------------------------------------------------------',
    `  Unit Tests         ${String(result.unit.linePct + '%').padEnd(18)}  ${String(result.unit.funcPct + '%').padEnd(16)}  >= ${String(result.thresholds.unitMin + '%').padEnd(9)}  ${statusStr(result.unitPassed)}`,
    `  Integration Tests  ${String(result.integration.linePct + '%').padEnd(18)}  ${String(result.integration.funcPct + '%').padEnd(16)}  >= ${String(result.thresholds.integrationMin + '%').padEnd(9)}  ${statusStr(result.integrationPassed)}`,
    `  Combined Coverage  ${String(result.combined.linePct + '%').padEnd(18)}  ${String(result.combined.funcPct + '%').padEnd(16)}  >= ${String(result.thresholds.combinedMin + '%').padEnd(9)}  ${statusStr(result.combinedPassed)}`,
    '================================================================================',
    result.passed
      ? '>> Quality Gate: PASSED (All thresholds satisfied)'
      : '>> Quality Gate: FAILED (One or more suites below required threshold)',
    '================================================================================',
  ];
  return lines.join('\n');
}

/**
 * Generates Markdown summary report suitable exclusively for $GITHUB_STEP_SUMMARY.
 */
export function formatCoverageMarkdown(result: CoverageGateResult): string {
  const badge = (ok: boolean) => (ok ? '✅ PASS' : '❌ FAIL');

  return [
    '## 🛡️ Test Suite Coverage Gate Report',
    '',
    '| Test Suite | Line Coverage | Function Coverage | Threshold | Gate Status |',
    '| :--- | :--- | :--- | :--- | :--- |',
    `| 🧪 **Unit Tests** | ${result.unit.linePct}% (${result.unit.hitLines}/${result.unit.totalLines}) | ${result.unit.funcPct}% (${result.unit.hitFuncs}/${result.unit.totalFuncs}) | $\\ge ${result.thresholds.unitMin}\\%$ | ${badge(result.unitPassed)} |`,
    `| 🔌 **Integration Tests** | ${result.integration.linePct}% (${result.integration.hitLines}/${result.integration.totalLines}) | ${result.integration.funcPct}% (${result.integration.hitFuncs}/${result.integration.totalFuncs}) | $\\ge ${result.thresholds.integrationMin}\\%$ | ${badge(result.integrationPassed)} |`,
    `| 🌐 **Combined Coverage** | ${result.combined.linePct}% (${result.combined.hitLines}/${result.combined.totalLines}) | ${result.combined.funcPct}% (${result.combined.hitFuncs}/${result.combined.totalFuncs}) | $\\ge ${result.thresholds.combinedMin}\\%$ | ${badge(result.combinedPassed)} |`,
    '',
    result.passed
      ? '🎉 **Quality Gate Passed**: All test suites meet required coverage invariants.'
      : '⚠️ **Quality Gate Failed**: Test coverage is below required threshold. Check un-tested branches or regression.',
    '',
  ].join('\n');
}

/**
 * Orchestrates evaluation of unit and integration test coverage against declarative JSON thresholds.
 */
export function evaluateCoverageGate(options: CoverageGateOptions = {}): CoverageGateResult {
  const fileThresholds = loadThresholdsConfig(options.configPath);

  const thresholds: CoverageThresholds = {
    unitMin: options.thresholds?.unitMin ?? fileThresholds.unitMin,
    integrationMin: options.thresholds?.integrationMin ?? fileThresholds.integrationMin,
    combinedMin: options.thresholds?.combinedMin ?? fileThresholds.combinedMin,
  };

  const unitMap = parseLcovFile(options.unitLcovPath || 'coverage/unit/lcov.info');
  const integrationMap = parseLcovFile(options.integrationLcovPath || 'coverage/integration/lcov.info');
  const combinedMap = mergeCoverageMaps([unitMap, integrationMap]);

  const unitMetrics = calculateCoverageMetrics(unitMap);
  const integrationMetrics = calculateCoverageMetrics(integrationMap);
  const combinedMetrics = calculateCoverageMetrics(combinedMap);

  const unitPassed = unitMetrics.linePct >= thresholds.unitMin;
  const integrationPassed = integrationMetrics.linePct >= thresholds.integrationMin;
  const combinedPassed = combinedMetrics.linePct >= thresholds.combinedMin;
  const passed = unitPassed && integrationPassed && combinedPassed;

  return {
    unit: unitMetrics,
    integration: integrationMetrics,
    combined: combinedMetrics,
    thresholds,
    unitPassed,
    integrationPassed,
    combinedPassed,
    passed,
  };
}

/**
 * CLI Entrypoint
 */
export function runCli(): void {
  const args = process.argv.slice(2);

  const getArg = (flag: string, fallback: string): string => {
    const idx = args.indexOf(flag);
    if (idx !== -1 && idx + 1 < args.length) {
      return args[idx + 1];
    }
    return fallback;
  };

  const configPath = getArg('--config', '');
  const unitLcov = getArg('--unit-lcov', 'coverage/unit/lcov.info');
  const integrationLcov = getArg('--integration-lcov', 'coverage/integration/lcov.info');
  const summaryFile = getArg('--summary-file', process.env.GITHUB_STEP_SUMMARY || '');

  const fileThresholds = loadThresholdsConfig(configPath);
  const unitMinArg = getArg('--unit-min', '');
  const integrationMinArg = getArg('--integration-min', '');
  const combinedMinArg = getArg('--combined-min', '');

  const unitMin = unitMinArg ? parseFloat(unitMinArg) : fileThresholds.unitMin;
  const integrationMin = integrationMinArg ? parseFloat(integrationMinArg) : fileThresholds.integrationMin;
  const combinedMin = combinedMinArg ? parseFloat(combinedMinArg) : fileThresholds.combinedMin;

  const result = evaluateCoverageGate({
    unitLcovPath: unitLcov,
    integrationLcovPath: integrationLcov,
    configPath,
    thresholds: { unitMin, integrationMin, combinedMin },
  });

  // Print clean text table to terminal stdout
  console.log(formatCoverageCli(result));

  // Write Markdown summary exclusively to GitHub Step Summary file if present
  if (summaryFile && existsSync(summaryFile)) {
    try {
      appendFileSync(summaryFile, `\n${formatCoverageMarkdown(result)}\n`, 'utf8');
      console.log(`[coverage-gate] GitHub Step Summary appended to: ${summaryFile}`);
    } catch (err) {
      console.warn('[coverage-gate] Warning: failed writing to step summary:', err);
    }
  }

  if (!result.passed) {
    if (process.env.GITHUB_ACTIONS === 'true') {
      console.error('::error title=Coverage Gate Failed::Test coverage failed to meet required thresholds.');
    }
    console.error('[coverage-gate] Quality gate failed to meet required coverage thresholds.');
    process.exit(1);
  }

  if (process.env.GITHUB_ACTIONS === 'true') {
    console.log('::notice title=Coverage Gate Passed::All test suites passed required coverage thresholds.');
  }
  console.log('[coverage-gate] Quality gate passed successfully.');
}

if (import.meta.main) {
  runCli();
}
