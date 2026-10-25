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
  statusOverlaySlot,
}) => {
  return (
    <div className="relative w-full h-full flex-1 flex flex-col justify-between bg-stone-950 overflow-hidden select-none">
      {viewportSlot}

      <header className="relative z-20 pointer-events-none p-3 md:p-4 flex items-start justify-between gap-2">
        <div className="pointer-events-auto">{topLeftSlot}</div>
        <div className="pointer-events-auto">{topCenterSlot}</div>
        <div className="pointer-events-auto">{topRightSlot}</div>
      </header>

      <main className="relative z-20 pointer-events-none px-3 md:px-4 flex items-center justify-between gap-4">
        <div className="pointer-events-auto">{leftFlankSlot}</div>
        <div className="pointer-events-auto">{rightFlankSlot}</div>
      </main>

      <footer className="relative z-20 pointer-events-none p-3 md:p-4 flex flex-col items-center justify-end">
        <div className="pointer-events-auto w-full flex justify-center">{bottomSlot}</div>
      </footer>

      {statusOverlaySlot}
    </div>
  );
});
