import React from "react";
import { DebugTogglesCard, DebugTogglesProps } from "./DebugTogglesCard";

export type DebugCollisionsProps = DebugTogglesProps;

/**
 * Backwards compatibility alias for DebugTogglesCard.
 */
export const DebugCollisionsCard: React.FC<DebugCollisionsProps> = DebugTogglesCard;

export default DebugCollisionsCard;
