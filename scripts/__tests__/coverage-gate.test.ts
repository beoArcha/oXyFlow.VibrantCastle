/**
 * Vibrant Castle — Coverage Gate Script Unit Tests
 * Located in scripts/__tests__/ to keep build tooling tests completely decoupled from src/.
 */

import { describe, it, expect } from 'bun:test';
import {
  FALLBACK_THRESHOLDS,
  parseLcov,
  mergeCoverageRecords,
  evaluateCoverageGate,
  formatCoverageMarkdown,
  loadThresholdsConfig,
  type CoverageSummary,
} from '../coverage-gate';

describe('Coverage Gate Tooling Tests (scripts/__tests__)', () => {
  it('should load per-suite thresholds from scripts/coverage.json when config exists', () => {
    const thresholds = loadThresholdsConfig(undefined, {});

    expect(thresholds.unitMin).toBe(74);
    expect(thresholds.integrationMin).toBe(58);
    expect(thresholds.combinedMin).toBe(73);
  });

  it('should fall back to scripts/coverage.json when the explicit config path is missing', () => {
    const thresholds = loadThresholdsConfig('does-not-exist/coverage.json', {});

    expect(thresholds.unitMin).toBe(74);
    expect(thresholds.integrationMin).toBe(58);
    expect(thresholds.combinedMin).toBe(73);
  });

  it('should expose the baseline fallback thresholds as constants', () => {
    expect(FALLBACK_THRESHOLDS).toEqual({ unitMin: 60, integrationMin: 40, combinedMin: 80 });
  });

  it('should apply COVERAGE_MIN_* environment overrides on top of the config', () => {
    const thresholds = loadThresholdsConfig(undefined, {
      COVERAGE_MIN_UNIT: '50',
      COVERAGE_MIN_INTEGRATION: '',
      COVERAGE_MIN_COMBINED: 'not-a-number',
    });

    expect(thresholds.unitMin).toBe(50);
    expect(thresholds.integrationMin).toBe(58);
    expect(thresholds.combinedMin).toBe(73);
  });

  it('should parse well-formed LCOV content into structured file records', () => {
    const sampleLcov = `
TN:
SF:src/core/math.ts
DA:1,5
DA:2,0
DA:3,12
FN:1,add
FN:5,subtract
FNDA:3,add
FNDA:0,subtract
end_of_record
`.trim();

    const records = parseLcov(sampleLcov);

    expect(records).toHaveLength(1);
    const mathRecord = records[0]!;
    expect(mathRecord.file).toBe('src/core/math.ts');
    expect(mathRecord.lines.size).toBe(3);
    expect(mathRecord.lines.get(1)).toBe(5);
    expect(mathRecord.lines.get(2)).toBe(0);
    expect(mathRecord.lines.get(3)).toBe(12);
    expect(mathRecord.functions.size).toBe(2);
    expect(mathRecord.functions.get('add')).toBe(3);
    expect(mathRecord.functions.get('subtract')).toBe(0);
  });

  it('should return no records when LCOV content is empty or whitespace', () => {
    expect(parseLcov('   \n  \t  \n')).toHaveLength(0);
  });

  it('should compute exact coverage percentages for a single suite', () => {
    const sampleLcov = `
SF:src/a.ts
DA:1,1
DA:2,0
DA:3,1
DA:4,1
end_of_record
SF:src/b.ts
DA:10,0
DA:20,0
end_of_record
`.trim();

    const summary = mergeCoverageRecords(parseLcov(sampleLcov));

    expect(summary.linesFound).toBe(6);
    expect(summary.linesHit).toBe(3);
    expect(summary.linePct).toBe(50);
    expect(summary.filesCount).toBe(2);
  });

  it('should merge records cumulatively when multiple suites cover the same file', () => {
    const unitLcov = `
SF:src/service.ts
DA:1,1
DA:2,0
DA:3,0
FN:1,run
FNDA:1,run
end_of_record
`.trim();

    const integrationLcov = `
SF:src/service.ts
DA:1,0
DA:2,1
DA:3,0
FN:2,stop
FNDA:1,stop
end_of_record
`.trim();

    const merged = mergeCoverageRecords([
      ...parseLcov(unitLcov),
      ...parseLcov(integrationLcov),
    ]);

    expect(merged.filesCount).toBe(1);
    expect(merged.linesFound).toBe(3);
    expect(merged.linesHit).toBe(2);
    expect(merged.linePct).toBe(66.67);
    expect(merged.functionsFound).toBe(2);
    expect(merged.functionsHit).toBe(2);
    expect(merged.functionPct).toBe(100);
  });

  it('should compute function coverage from FNF/FNH totals when present', () => {
    const lcov = `
SF:src/big.ts
FNF:10
FNH:7
DA:1,1
end_of_record
`.trim();

    const summary = mergeCoverageRecords(parseLcov(lcov));

    expect(summary.functionsFound).toBe(10);
    expect(summary.functionsHit).toBe(7);
    expect(summary.functionPct).toBe(70);
  });

  it('should not fail the gate on function coverage, which is informational only', () => {
    const lowFunctions = mergeCoverageRecords(
      parseLcov('SF:src/f.ts\nFNF:10\nFNH:1\nDA:1,1\nDA:2,1\nend_of_record')
    );

    const result = evaluateCoverageGate(
      { unit: lowFunctions, integration: null, combined: lowFunctions },
      { unitMin: 50, integrationMin: 40, combinedMin: 50 }
    );

    expect(lowFunctions.functionPct).toBe(10);
    expect(result.passed).toBe(true);
  });

  it('should fail the gate when a suite is strictly below its own threshold', () => {
    const unit = mergeCoverageRecords(parseLcov('SF:src/engine.ts\nDA:1,1\nDA:2,0\nend_of_record'));
    const integration = mergeCoverageRecords(parseLcov('SF:src/engine.ts\nDA:1,0\nDA:2,0\nend_of_record'));
    const combined = mergeCoverageRecords(parseLcov('SF:src/engine.ts\nDA:1,1\nDA:2,0\nend_of_record'));

    const result = evaluateCoverageGate(
      { unit, integration, combined },
      { unitMin: 60, integrationMin: 40, combinedMin: 80 }
    );

    expect(result.unit!.linePct).toBe(50);
    expect(result.unitPassed).toBe(false);
    expect(result.integrationPassed).toBe(false);
    expect(result.combinedPassed).toBe(false);
    expect(result.passed).toBe(false);
    expect(result.failures).toHaveLength(3);
  });

  it('should pass the gate when every suite meets its own threshold', () => {
    const unit = mergeCoverageRecords(
      parseLcov('SF:src/shared.ts\nDA:1,1\nDA:2,1\nDA:3,1\nDA:4,1\nDA:5,0\nend_of_record')
    ); // 80%
    const integration = mergeCoverageRecords(
      parseLcov('SF:src/shared.ts\nDA:1,0\nDA:2,0\nDA:3,1\nDA:4,1\nDA:5,1\nend_of_record')
    ); // 60%
    const combined = mergeCoverageRecords([
      ...parseLcov('SF:src/shared.ts\nDA:1,1\nDA:2,1\nDA:3,1\nDA:4,1\nDA:5,0\nend_of_record'),
      ...parseLcov('SF:src/shared.ts\nDA:1,0\nDA:2,0\nDA:3,1\nDA:4,1\nDA:5,1\nend_of_record'),
    ]); // 100%

    const result = evaluateCoverageGate(
      { unit, integration, combined },
      { unitMin: 60, integrationMin: 40, combinedMin: 80 }
    );

    expect(result.unit!.linePct).toBe(80);
    expect(result.integration!.linePct).toBe(60);
    expect(result.combined.linePct).toBe(100);
    expect(result.passed).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it('should skip a missing suite without failing the gate', () => {
    const combined = mergeCoverageRecords(parseLcov('SF:src/x.ts\nDA:1,1\nend_of_record'));

    const result = evaluateCoverageGate(
      { unit: null, integration: null, combined },
      { unitMin: 60, integrationMin: 40, combinedMin: 80 }
    );

    expect(result.unit).toBeNull();
    expect(result.passed).toBe(true);
  });

  it('should generate a markdown report containing the suite table and gate verdict', () => {
    const summary = (linePct: number): CoverageSummary => ({
      filesCount: 1,
      linesFound: 100,
      linesHit: linePct,
      linePct,
      functionsFound: 10,
      functionsHit: 9,
      functionPct: 90,
    });
    const result = evaluateCoverageGate(
      { unit: summary(85), integration: summary(55), combined: summary(90) },
      { unitMin: 60, integrationMin: 40, combinedMin: 80 }
    );

    const markdown = formatCoverageMarkdown(result);

    expect(markdown).toContain('## 🛡️ Test Suite Coverage Gate Report');
    expect(markdown).toContain('🧪 **Unit Tests**');
    expect(markdown).toContain('🔌 **Integration Tests**');
    expect(markdown).toContain('🌐 **Combined Coverage**');
    expect(markdown).toContain('✅ PASS');
    expect(markdown).toContain('Quality Gate Passed');
  });
});
