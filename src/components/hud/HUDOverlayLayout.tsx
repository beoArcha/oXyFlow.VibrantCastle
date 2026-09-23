import React from "react";
import { HUDOverlayLayoutProps } from "./types";

/**
 * Pure layout shell for the HUD overlay.
 * Organizes viewport canvas, top bar slots, flanks, and bottom narration area.
 */
export const HUDOverlayLayout: React.FC<HUDOverlayLayoutProps> = React.memo(({
  viewportSlot,
  topLeftSlot,
  topCenterSlot,
  topRightSlot,
  leftFlankSlot,
  rightFlankSlot,
  bottomSlot,
  statusOverlaySlot,
}) => {
  return (
    <div className="relative w-full h-full flex-1 flex flex-col justify-between bg-[#120602] overflow-hidden select-none">
      {/* Viewport Canvas Layer */}
      {viewportSlot}

      {/* Top HUD Row */}
      <div className="relative z-20 pointer-events-none p-3 md:p-4 flex items-start justify-between gap-2">
        <div className="pointer-events-auto">{topLeftSlot}</div>
        <div className="pointer-events-auto">{topCenterSlot}</div>
        <div className="pointer-events-auto">{topRightSlot}</div>
      </div>

      {/* Flanks HUD Row */}
      <div className="relative z-20 pointer-events-none px-3 md:px-4 flex items-center justify-between gap-4">
        <div className="pointer-events-auto">{leftFlankSlot}</div>
        <div className="pointer-events-auto">{rightFlankSlot}</div>
      </div>

      {/* Bottom HUD Row */}
      <div className="relative z-20 pointer-events-none p-3 md:p-4 flex flex-col items-center justify-end">
        <div className="pointer-events-auto w-full flex justify-center">{bottomSlot}</div>
      </div>

      {/* Status Overlay Layer (Pause, Victory, Defeat) on top of all HUD layers */}
      {statusOverlaySlot && (
        <div className="absolute inset-0 z-50 pointer-events-auto flex items-center justify-center">
          {statusOverlaySlot}
        </div>
      )}
    </div>
  );
});
