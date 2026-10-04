import { describe, it, expect } from "bun:test";
import { formatPlayTime, formatFramesDuration } from "../time";

describe("lib/format/time", () => {
  const dummyT = (key: string) => {
    const map: Record<string, string> = {
      hoursUnit: "h",
      minutesUnit: "m",
      secondsUnit: "s",
    };
    return map[key] || key;
  };

  it("formats play time with hours, minutes, and seconds", () => {
    expect(formatPlayTime(3665, dummyT)).toBe("1 h 1 m 5 s");
    expect(formatPlayTime(125, dummyT)).toBe("2 m 5 s");
    expect(formatPlayTime(45, dummyT)).toBe("45 s");
    expect(formatPlayTime(-10, dummyT)).toBe("0 s");
  });

  it("formats frame duration in seconds", () => {
    expect(formatFramesDuration(60, 60)).toBe("1.0s");
    expect(formatFramesDuration(30, 60)).toBe("0.5s");
    expect(formatFramesDuration(0, 60)).toBe("0.0s");
    expect(formatFramesDuration(90, 0)).toBe("1.5s"); // fallback to 60fps
  });
});
