/**
 * Vibrant Castle — Coverage Gate Script Unit Tests
 * Located in scripts/__tests__/ to keep build tooling tests completely decoupled from src/.
 */

import { describe, it, expect } from 'bun:test';
import {
  parseLcovContent,
  mergeCoverageMaps,
  calculateCoverageMetrics,
  formatCoverageMarkdown,
  loadThresholdsConfig,
  evaluateCoverageGate,
} from '../coverage-gate';

describe('Coverage Gate Tooling Tests (scripts/__tests__)', () => {
  it('should load declarative thresholds from scripts/coverage.json when config exists', () => {
    // Arrange & Act
    const thresholds = loadThresholdsConfig();

    // Assert
    expect(thresholds.unitMin).toBe(60);
    expect(thresholds.integrationMin).toBe(40);
    expect(thresholds.combinedMin).toBe(80);
  });

  it('should parse well-formed LCOV content into structured file records when records are valid', () => {
    // Arrange
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

    // Act
    const records = parseLcovContent(sampleLcov);

    // Assert
    expect(records.has('src/core/math.ts')).toBe(true);
    const mathRecord = records.get('src/core/math.ts')!;
    expect(mathRecord.lines.size).toBe(3);
    expect(mathRecord.lines.get(1)).toBe(5);
    expect(mathRecord.lines.get(2)).toBe(0);
    expect(mathRecord.lines.get(3)).toBe(12);
    expect(mathRecord.funcs.size).toBe(2);
    expect(mathRecord.funcs.get('add')).toBe(3);
    expect(mathRecord.funcs.get('subtract')).toBe(0);
  });

  it('should return empty map when LCOV content is empty or whitespace', () => {
    // Arrange
    const emptyLcov = '   \n  \t  \n';

    // Act
    const records = parseLcovContent(emptyLcov);

    // Assert
    expect(records.size).toBe(0);
  });

  it('should compute exact coverage percentages when calculating metrics', () => {
    // Arrange
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
    const records = parseLcovContent(sampleLcov);

    // Act
    const metrics = calculateCoverageMetrics(records);

    // Assert
    expect(metrics.totalLines).toBe(6);
    expect(metrics.hitLines).toBe(3);
    expect(metrics.linePct).toBe(50);
  });

  it('should merge coverage maps cumulatively when multiple test suites cover the same files', () => {
    // Arrange
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

    const unitMap = parseLcovContent(unitLcov);
    const integrationMap = parseLcovContent(integrationLcov);

    // Act
    const merged = mergeCoverageMaps([unitMap, integrationMap]);
    const metrics = calculateCoverageMetrics(merged);

    // Assert
    expect(metrics.totalLines).toBe(3);
    expect(metrics.hitLines).toBe(2);
    expect(metrics.linePct).toBe(66.67);
    expect(metrics.totalFuncs).toBe(2);
    expect(metrics.hitFuncs).toBe(2);
    expect(metrics.funcPct).toBe(100);
  });

  it('should evaluate gate failure when test coverage is strictly below threshold', () => {
    // Arrange
    const unitLcov = `
SF:src/engine.ts
DA:1,1
DA:2,0
end_of_record
`.trim();

    const unitMap = parseLcovContent(unitLcov);
    const emptyMap = parseLcovContent('');
    const combined = mergeCoverageMaps([unitMap, emptyMap]);

    // Act
    const unitMetrics = calculateCoverageMetrics(unitMap);
    const integrationMetrics = calculateCoverageMetrics(emptyMap);
    const combinedMetrics = calculateCoverageMetrics(combined);

    const unitPassed = unitMetrics.linePct >= 60;
    const integrationPassed = integrationMetrics.linePct >= 40;
    const combinedPassed = combinedMetrics.linePct >= 80;
    const passed = unitPassed && integrationPassed && combinedPassed;

    // Assert
    expect(unitPassed).toBe(false);
    expect(integrationPassed).toBe(false);
    expect(combinedPassed).toBe(false);
    expect(passed).toBe(false);
  });

  it('should evaluate gate success when unit, integration, and combined meet required thresholds', () => {
    // Arrange
    const unitLcov = `
SF:src/shared.ts
DA:1,1
DA:2,1
DA:3,1
DA:4,1
DA:5,0
end_of_record
`.trim(); // 80% line coverage

    const integrationLcov = `
SF:src/shared.ts
DA:1,0
DA:2,0
DA:3,1
DA:4,1
DA:5,1
end_of_record
`.trim(); // 60% line coverage

    const unitMap = parseLcovContent(unitLcov);
    const integrationMap = parseLcovContent(integrationLcov);
    const combined = mergeCoverageMaps([unitMap, integrationMap]); // 100% combined

    // Act
    const unitMetrics = calculateCoverageMetrics(unitMap);
    const integrationMetrics = calculateCoverageMetrics(integrationMap);
    const combinedMetrics = calculateCoverageMetrics(combined);

    const unitPassed = unitMetrics.linePct >= 60;
    const integrationPassed = integrationMetrics.linePct >= 40;
    const combinedPassed = combinedMetrics.linePct >= 80;
    const passed = unitPassed && integrationPassed && combinedPassed;

    // Assert
    expect(unitMetrics.linePct).toBe(80);
    expect(integrationMetrics.linePct).toBe(60);
    expect(combinedMetrics.linePct).toBe(100);
    expect(unitPassed).toBe(true);
    expect(integrationPassed).toBe(true);
    expect(combinedPassed).toBe(true);
    expect(passed).toBe(true);
  });

  it('should generate valid markdown report containing summary tables and badges', () => {
    // Arrange
    const result = {
      unit: { totalLines: 100, hitLines: 85, linePct: 85, totalFuncs: 10, hitFuncs: 9, funcPct: 90 },
      integration: { totalLines: 100, hitLines: 55, linePct: 55, totalFuncs: 10, hitFuncs: 6, funcPct: 60 },
      combined: { totalLines: 100, hitLines: 90, linePct: 90, totalFuncs: 10, hitFuncs: 9, funcPct: 90 },
      thresholds: { unitMin: 60, integrationMin: 40, combinedMin: 80 },
      unitPassed: true,
      integrationPassed: true,
      combinedPassed: true,
      passed: true,
    };

    // Act
    const markdown = formatCoverageMarkdown(result);

    // Assert
    expect(markdown).toContain('## 🛡️ Test Suite Coverage Gate Report');
    expect(markdown).toContain('🧪 **Unit Tests**');
    expect(markdown).toContain('🔌 **Integration Tests**');
    expect(markdown).toContain('🌐 **Combined Coverage**');
    expect(markdown).toContain('✅ PASS');
    expect(markdown).toContain('Quality Gate Passed');
  });
});
