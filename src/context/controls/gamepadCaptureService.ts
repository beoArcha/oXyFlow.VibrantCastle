import gameInputs from "@game/loop/input";

/**
 * Initiates polling for the next pressed gamepad button on the specified controller.
 * Encapsulates hardware inspection and analog button thresholding outside of React components.
 * Immediately deactivates polling upon detection or disconnection.
 * Returns an unpoll / cancel cleanup function.
 */
export function startGamepadButtonCapture(
  padIndex: number,
  onDetected: (buttonIndex: number) => void,
  onDisconnected?: () => void
): () => void {
  let isActive = true;

  const interval = setInterval(() => {
    if (!isActive) {
      clearInterval(interval);
      return;
    }

    const rawPads = gameInputs.getConnectedGamepads();
    const pad = rawPads.find((p) => p.index === padIndex);

    if (!pad) {
      isActive = false;
      clearInterval(interval);
      onDisconnected?.();
      return;
    }

    for (let i = 0; i < pad.buttons.length; i++) {
      const btn = pad.buttons[i];
      if (!btn) continue;

      if (btn.pressed || btn.value > 0.5) {
        isActive = false;
        clearInterval(interval);
        onDetected(i);
        return;
      }
    }
  }, 50);

  return () => {
    isActive = false;
    clearInterval(interval);
  };
}
