import { useEffect, useRef } from "react";

export const MENU_GAMEPAD_CONFIG = {
  buttonA: 0, buttonB: 1, buttonX: 2, buttonY: 3,
  buttonLB: 4, buttonRB: 5, buttonLT: 6, buttonRT: 7, buttonStart: 9,
  dpadUp: 12, dpadDown: 13, dpadLeft: 14, dpadRight: 15,
  stickDeadzone: 0.45, buttonThreshold: 0.4,
  repeatDelayMs: 400, repeatIntervalMs: 120,
  openChordHoldMs: 500, closedPollIntervalMs: 50,
} as const;

export const MENU_CONTEXT_ACTION_EVENT = "menu-context-action";

export interface UseMenuGamepadOptions {
  readonly isGameDialogOpen: boolean;
  readonly isAnyDialogOpen?: boolean;
  readonly isRebinding?: boolean;
  readonly onOpenGameDialog: () => void;
  readonly onClose: () => void;
  readonly onStepL1Tab: (delta: -1 | 1) => void;
  readonly onStepL2Tab: (delta: -1 | 1) => void;
  readonly onToggleLegend?: () => void;
  readonly onContextAction?: (target: HTMLElement | null) => void;
  readonly onCancelRebind?: () => void;
  readonly now?: () => number;
}

type RepeatableControl = "lb" | "rb" | "lt" | "rt" | "up" | "down" | "left" | "right";
type EdgeControl = "a" | "b" | "x" | "y" | "start";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]):not([aria-disabled="true"]),a[href],input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[role="tab"]:not([disabled]):not([aria-disabled="true"]),[role="slider"]:not([aria-disabled="true"]),[role="switch"]:not([aria-disabled="true"]),[tabindex]:not([tabindex="-1"]):not([disabled])';

const readPrimaryGamepad = (): Gamepad | null => {
  if (typeof navigator === "undefined" || typeof navigator.getGamepads !== "function") return null;
  for (const pad of navigator.getGamepads() ?? []) {
    if (pad && pad.connected !== false) return pad;
  }
  return null;
};

const isDown = (pad: Gamepad, index: number): boolean => {
  const btn = pad.buttons?.[index];
  return Boolean(btn && (btn.pressed || btn.value > MENU_GAMEPAD_CONFIG.buttonThreshold));
};

const getDialogs = (): HTMLElement[] =>
  typeof document !== "undefined" && document.body
    ? Array.from(document.body.querySelectorAll<HTMLElement>('[role="dialog"], [role="alertdialog"]'))
    : [];

const hasNestedDialog = (): boolean =>
  getDialogs().length > 1 || document.body?.querySelector('[data-slot="dialog-content"]') !== null;

const getFocusables = (container: HTMLElement): HTMLElement[] =>
  Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => el.getAttribute("tabindex") !== "-1" && !el.closest('[hidden], [aria-hidden="true"]') && el.style.display !== "none" && el.style.visibility !== "hidden"
  );

function moveFocus(delta: -1 | 1): void {
  const dialogs = getDialogs();
  const dialog = dialogs[dialogs.length - 1];
  if (!dialog) return;
  const focusables = getFocusables(dialog);
  if (focusables.length === 0) return;

  const activeEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const idx = activeEl ? focusables.findIndex((el) => el === activeEl || el.contains(activeEl)) : -1;
  const nextIdx = idx === -1 ? (delta > 0 ? 0 : focusables.length - 1) : (idx + delta + focusables.length) % focusables.length;
  focusables[nextIdx].focus();
  focusables[nextIdx].scrollIntoView?.({ block: "nearest" });
}

function sendArrowKey(key: "ArrowLeft" | "ArrowRight"): void {
  const target = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  target?.dispatchEvent(new KeyboardEvent("keydown", { key, code: key, bubbles: true, cancelable: true }));
}

function activateFocused(): void {
  const dialogs = getDialogs();
  const dialog = dialogs[dialogs.length - 1];
  if (!dialog) return;
  const activeEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  if (!activeEl || !dialog.contains(activeEl)) {
    getFocusables(dialog)[0]?.focus();
    return;
  }
  if (!activeEl.hasAttribute("disabled") && activeEl.getAttribute("aria-disabled") !== "true") {
    activeEl.click();
  }
}

function closeTopNestedDialog(): boolean {
  const dialogs = getDialogs();
  const topNested = dialogs.length > 1 ? dialogs[dialogs.length - 1] : document.body?.querySelector<HTMLElement>('[data-slot="dialog-content"], [role="alertdialog"]');
  if (!topNested) return false;
  const trigger = topNested.querySelector<HTMLElement>('[data-slot="dialog-close"], [data-slot="dialog-footer"] button, button[data-cancel], button[aria-label*="Close"]');
  if (trigger) {
    trigger.click();
    return true;
  }
  topNested.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: false, cancelable: true }));
  return true;
}

function dispatchContextAction(onContextAction?: (target: HTMLElement | null) => void): void {
  const dialogs = getDialogs();
  const dialog = dialogs[dialogs.length - 1];
  if (!dialog) return;
  const activeEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const target = activeEl && dialog.contains(activeEl) ? activeEl : dialog;
  target.dispatchEvent(new CustomEvent(MENU_CONTEXT_ACTION_EVENT, { bubbles: true, cancelable: true, detail: { target } }));
  onContextAction?.(target);
}

/**
 * Restricted gamepad menu navigation (LB/RB L1, LT/RT L2, A/B/X/Y, D-pad/left stick, Start or 0.5s LB+RB hold).
 * Polls via rAF only while the game dialog is open; while closed, uses a cheap interval for open triggers.
 */
export function useMenuGamepad(options: UseMenuGamepadOptions): void {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const isAnyOpen = options.isAnyDialogOpen ?? options.isGameDialogOpen;

  const repeatRef = useRef<Partial<Record<RepeatableControl, { pressedAt: number; lastFiredAt: number }>>>({});
  const edgeRef = useRef<Partial<Record<EdgeControl, boolean>>>({});
  const chordRef = useRef<{ startedAt: number | null; fired: boolean }>({ startedAt: null, fired: false });
  const suppressBumpersRef = useRef(false);

  useEffect(() => {
    if (!options.isGameDialogOpen) {
      repeatRef.current = {};
      return;
    }

    let rafId: number | null = null;
    let cancelled = false;
    const cfg = MENU_GAMEPAD_CONFIG;
    const initialPad = readPrimaryGamepad();
    edgeRef.current = initialPad
      ? { a: isDown(initialPad, cfg.buttonA), b: isDown(initialPad, cfg.buttonB), x: isDown(initialPad, cfg.buttonX), y: isDown(initialPad, cfg.buttonY), start: isDown(initialPad, cfg.buttonStart) }
      : {};

    const stepEdge = (key: EdgeControl, down: boolean, action: () => void) => {
      const wasDown = edgeRef.current[key] ?? false;
      edgeRef.current[key] = down;
      if (down && !wasDown) action();
    };

    const stepRepeat = (key: RepeatableControl, down: boolean, nowMs: number, action: () => void) => {
      if (!down) { delete repeatRef.current[key]; return; }
      const entry = repeatRef.current[key];
      if (!entry) { repeatRef.current[key] = { pressedAt: nowMs, lastFiredAt: nowMs }; action(); return; }
      if (nowMs - entry.pressedAt >= cfg.repeatDelayMs && nowMs - entry.lastFiredAt >= cfg.repeatIntervalMs) {
        entry.lastFiredAt = nowMs;
        action();
      }
    };

    const processPad = (pad: Gamepad, nowMs: number, opts: UseMenuGamepadOptions) => {
      const lb = isDown(pad, cfg.buttonLB);
      const rb = isDown(pad, cfg.buttonRB);
      if (suppressBumpersRef.current && !lb && !rb) suppressBumpersRef.current = false;

      const handleBack = () => {
        if (opts.isRebinding && opts.onCancelRebind) { opts.onCancelRebind(); return; }
        if (!closeTopNestedDialog()) opts.onClose();
      };
      stepEdge("b", isDown(pad, cfg.buttonB), handleBack);
      stepEdge("start", isDown(pad, cfg.buttonStart), handleBack);
      if (opts.isRebinding) return;

      stepEdge("a", isDown(pad, cfg.buttonA), activateFocused);
      stepEdge("x", isDown(pad, cfg.buttonX), () => { if (!hasNestedDialog()) dispatchContextAction(opts.onContextAction); });
      stepEdge("y", isDown(pad, cfg.buttonY), () => { if (!hasNestedDialog()) opts.onToggleLegend?.(); });

      const ax = pad.axes?.[0] ?? 0;
      const ay = pad.axes?.[1] ?? 0;
      const repeatables: readonly [RepeatableControl, boolean, () => void][] = [
        ["lb", !suppressBumpersRef.current && lb, () => opts.onStepL1Tab(-1)],
        ["rb", !suppressBumpersRef.current && rb, () => opts.onStepL1Tab(1)],
        ["lt", isDown(pad, cfg.buttonLT), () => opts.onStepL2Tab(-1)],
        ["rt", isDown(pad, cfg.buttonRT), () => opts.onStepL2Tab(1)],
        ["up", isDown(pad, cfg.dpadUp) || ay < -cfg.stickDeadzone, () => moveFocus(-1)],
        ["down", isDown(pad, cfg.dpadDown) || ay > cfg.stickDeadzone, () => moveFocus(1)],
        ["left", isDown(pad, cfg.dpadLeft) || ax < -cfg.stickDeadzone, () => sendArrowKey("ArrowLeft")],
        ["right", isDown(pad, cfg.dpadRight) || ax > cfg.stickDeadzone, () => sendArrowKey("ArrowRight")],
      ];
      for (const [key, down, fn] of repeatables) stepRepeat(key, down, nowMs, fn);
    };

    const tick = (ts?: number) => {
      if (cancelled) return;
      const opts = optionsRef.current;
      const pad = readPrimaryGamepad();
      if (pad) processPad(pad, opts.now ? opts.now() : (ts ?? performance.now()), opts);
      if (typeof requestAnimationFrame === "function") rafId = requestAnimationFrame(tick);
    };

    if (typeof requestAnimationFrame === "function") rafId = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (rafId !== null && typeof cancelAnimationFrame === "function") cancelAnimationFrame(rafId);
    };
  }, [options.isGameDialogOpen]);

  useEffect(() => {
    if (isAnyOpen) {
      chordRef.current = { startedAt: null, fired: false };
      return;
    }
    const cfg = MENU_GAMEPAD_CONFIG;
    const initialPad = readPrimaryGamepad();
    edgeRef.current.start = initialPad ? isDown(initialPad, cfg.buttonStart) : false;

    const intervalId = setInterval(() => {
      const opts = optionsRef.current;
      if (opts.isRebinding) return;
      const pad = readPrimaryGamepad();
      if (!pad) { chordRef.current = { startedAt: null, fired: false }; edgeRef.current.start = false; return; }

      const startDown = isDown(pad, cfg.buttonStart);
      const wasStartDown = edgeRef.current.start ?? false;
      edgeRef.current.start = startDown;
      if (startDown && !wasStartDown) { opts.onOpenGameDialog(); return; }

      if (!isDown(pad, cfg.buttonLB) || !isDown(pad, cfg.buttonRB)) {
        chordRef.current = { startedAt: null, fired: false };
        return;
      }
      const nowMs = opts.now ? opts.now() : performance.now();
      if (chordRef.current.startedAt === null) { chordRef.current.startedAt = nowMs; return; }
      if (!chordRef.current.fired && nowMs - chordRef.current.startedAt >= cfg.openChordHoldMs) {
        chordRef.current.fired = true;
        suppressBumpersRef.current = true;
        opts.onOpenGameDialog();
      }
    }, cfg.closedPollIntervalMs);

    return () => clearInterval(intervalId);
  }, [isAnyOpen]);
}
