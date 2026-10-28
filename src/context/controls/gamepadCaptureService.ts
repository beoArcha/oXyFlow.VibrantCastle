import gameInputs from "@game/loop/input";

/**
 * Initiates polling for the next pressed gamepad button on the specified controller.
 * Encapsulates hardware inspection and analog button thresholding outside of React components.
 * Returns an unpoll / cancel cleanup function.
 */
export function startGamepadButtonCapture(
  padIndex: number,
  onDetected: (buttonIndex: number) => void,
  onDisconnected?: () => void
): () => void {
  const interval = setInterval(() => {
    const rawPads = gameInputs.getConnectedGamepads();
    const pad = rawPads.find((p) => p.index === padIndex);

    if (!pad) {
      onDisconnected?.();
      return;
    }

    for (let i = 0; i < pad.buttons.length; i++) {
      const btn = pad.buttons[i];
      if (!btn) continue;

      if (btn.pressed || btn.value > 0.5) {
        onDetected(i);
        break;
      }
    }
  }, 50);

  return () => clearInterval(interval);
}
