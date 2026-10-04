/**
 * Formats play duration in seconds into a localized human-readable time string.
 */
export function formatPlayTime(
  totalSeconds: number,
  t: (key: string) => string
): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours} ${t("hoursUnit")} ${minutes} ${t("minutesUnit")} ${seconds} ${t("secondsUnit")}`;
  }
  if (minutes > 0) {
    return `${minutes} ${t("minutesUnit")} ${seconds} ${t("secondsUnit")}`;
  }
  return `${seconds} ${t("secondsUnit")}`;
}

/**
 * Formats engine tick/frame counts into a fractional seconds string (e.g. "0.5s").
 */
export function formatFramesDuration(frames: number, fps = 60): string {
  const safeFps = fps > 0 ? fps : 60;
  return `${(frames / safeFps).toFixed(1)}s`;
}
