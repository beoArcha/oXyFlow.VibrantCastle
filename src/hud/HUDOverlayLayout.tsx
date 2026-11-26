import React from "react";
import type { HUDOverlayLayoutProps } from "./types";

export const HUDOverlayLayout: React.FC<HUDOverlayLayoutProps> = React.memo(({
  viewportSlot,
  topLeftSlot,
  topCenterSlot,
  topRightSlot,
  leftFlankSlot,
  rightFlankSlot,
  bottomSlot,
  bottomDockSlot,
  statusOverlaySlot,
}) => {
  const hasFlanks = Boolean(leftFlankSlot || rightFlankSlot);

  return (
    <div className="relative w-full h-full flex-1 min-h-0 flex flex-col justify-between bg-stone-950 overflow-hidden select-none">
      {viewportSlot}

      <header className="relative z-20 pointer-events-none p-3 md:p-4 flex items-start justify-between gap-2">
        <div className="pointer-events-auto">{topLeftSlot}</div>
        {topCenterSlot && <div className="pointer-events-auto">{topCenterSlot}</div>}
        <div className="pointer-events-auto">{topRightSlot}</div>
      </header>

      {hasFlanks && (
        <main className="relative z-20 pointer-events-none px-3 md:px-4 flex items-center justify-between gap-4">
          <div className="pointer-events-auto">{leftFlankSlot}</div>
          <div className="pointer-events-auto">{rightFlankSlot}</div>
        </main>
      )}

      <footer className="relative z-20 pointer-events-none px-3 pb-3 md:px-4 md:pb-4 flex flex-col items-center justify-end gap-2">
        {bottomSlot && (
          <div className="pointer-events-auto w-full flex justify-center">{bottomSlot}</div>
        )}
        {bottomDockSlot && (
          <div className="pointer-events-auto flex items-center justify-center gap-3 flex-wrap">
            {bottomDockSlot}
          </div>
        )}
      </footer>

      {statusOverlaySlot}
    </div>
  );
});

HUDOverlayLayout.displayName = "HUDOverlayLayout";
export default HUDOverlayLayout;
