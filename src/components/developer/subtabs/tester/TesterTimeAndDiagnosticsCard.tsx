import React from "react";
import { TesterSimulationSpeedCard } from "./TesterSimulationSpeedCard";
import { TesterDiagnosticsCard } from "./TesterDiagnosticsCard";
import { TesterTimeAndDiagnosticsCardProps } from "./types";

/**
 * Composite wrapper combining TesterSimulationSpeedCard and TesterDiagnosticsCard.
 * Retained for backward compatibility during phased refactoring.
 */
export const TesterTimeAndDiagnosticsCard: React.FC<TesterTimeAndDiagnosticsCardProps> = ({
  timeScale,
  showHitboxes,
  showProfiler,
  onSetTimeScale,
  onStepSingleFrame,
  onToggleHitboxes,
  onToggleProfiler,
}) => {
  return (
    <div className="flex flex-col gap-4">
      <TesterSimulationSpeedCard
        timeScale={timeScale}
        onSetTimeScale={onSetTimeScale}
        onStepSingleFrame={onStepSingleFrame}
      />
      <TesterDiagnosticsCard
        showHitboxes={showHitboxes}
        showProfiler={showProfiler}
        onToggleHitboxes={onToggleHitboxes}
        onToggleProfiler={onToggleProfiler}
      />
    </div>
  );
};

export default TesterTimeAndDiagnosticsCard;
