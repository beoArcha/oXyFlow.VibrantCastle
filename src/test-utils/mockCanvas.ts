export interface RectCall {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ArcCall {
  x: number;
  y: number;
  r: number;
  sa?: number;
  ea?: number;
  ac?: boolean;
}

export interface EllipseCall {
  x: number;
  y: number;
  rx: number;
  ry: number;
  rot?: number;
  sa?: number;
  ea?: number;
}

export interface MockContext2D extends CanvasRenderingContext2D {
  getSaveBalance: () => number;
  getSaveCount: () => number;
  getRestoreCount: () => number;
  getLinearGradientCount: () => number;
  getRadialGradientCount: () => number;
  getTotalGradientCount: () => number;
  getDrawImageCalls: () => unknown[][];
  getFillRectCalls: () => RectCall[];
  getStrokeRectCalls: () => RectCall[];
  getArcCalls: () => ArcCall[];
  getEllipseCalls: () => EllipseCall[];
  getTextCalls: () => string[];
  getClearRectCalls: () => unknown[][];
}

export function createMockContext2D(width = 1000, height = 625): MockContext2D {
  let saveCalls = 0;
  let restoreCalls = 0;
  let linearGradientCalls = 0;
  let radialGradientCalls = 0;
  const drawImageCalls: unknown[][] = [];
  const clearRectCalls: unknown[][] = [];
  const fillRectCalls: RectCall[] = [];
  const strokeRectCalls: RectCall[] = [];
  const arcCalls: ArcCall[] = [];
  const ellipseCalls: EllipseCall[] = [];
  const textCalls: string[] = [];

  const ctx: Partial<CanvasRenderingContext2D> & {
    getSaveBalance: () => number;
    getSaveCount: () => number;
    getRestoreCount: () => number;
    getLinearGradientCount: () => number;
    getRadialGradientCount: () => number;
    getTotalGradientCount: () => number;
    getDrawImageCalls: () => unknown[][];
    getFillRectCalls: () => RectCall[];
    getStrokeRectCalls: () => RectCall[];
    getArcCalls: () => ArcCall[];
    getEllipseCalls: () => EllipseCall[];
    getTextCalls: () => string[];
    getClearRectCalls: () => unknown[][];
  } = {
    canvas: { width, height } as unknown as HTMLCanvasElement,
    save: () => {
      saveCalls++;
    },
    restore: () => {
      restoreCalls++;
    },
    scale: () => {},
    translate: () => {},
    rotate: () => {},
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    quadraticCurveTo: () => {},
    arc: (x: number, y: number, r: number, sa?: number, ea?: number, ac?: boolean) => {
      arcCalls.push({ x, y, r, sa, ea, ac });
    },
    ellipse: (x: number, y: number, rx: number, ry: number, rot?: number, sa?: number, ea?: number) => {
      ellipseCalls.push({ x, y, rx, ry, rot, sa, ea });
    },
    rect: () => {},
    roundRect: () => {},
    fillRect: (x: number, y: number, w: number, h: number) => {
      fillRectCalls.push({ x, y, w, h });
    },
    strokeRect: (x: number, y: number, w: number, h: number) => {
      strokeRectCalls.push({ x, y, w, h });
    },
    clearRect: (...args: unknown[]) => {
      clearRectCalls.push(args);
    },
    fill: () => {},
    stroke: () => {},
    drawImage: (...args: unknown[]) => {
      drawImageCalls.push(args);
    },
    getImageData: (x = 0, y = 0, w = 100, h = 100) =>
      ({
        data: new Uint8ClampedArray(w * h * 4),
        width: w,
        height: h,
        colorSpace: "srgb",
      }) as ImageData,
    putImageData: () => {},
    fillText: (text: string) => {
      textCalls.push(text);
    },
    strokeText: (text: string) => {
      textCalls.push(text);
    },
    measureText: (txt: string) => ({ width: (txt || "").length * 6 }) as TextMetrics,
    createLinearGradient: () => {
      linearGradientCalls++;
      return { addColorStop: () => {} } as unknown as CanvasGradient;
    },
    createRadialGradient: () => {
      radialGradientCalls++;
      return { addColorStop: () => {} } as unknown as CanvasGradient;
    },
    setLineDash: () => {},
    getLineDash: () => [],
    fillStyle: "#000000",
    strokeStyle: "#000000",
    lineWidth: 1,
    globalAlpha: 1.0,
    font: "10px sans-serif",
    textAlign: "left" as CanvasTextAlign,
    textBaseline: "top" as CanvasTextBaseline,
    imageSmoothingEnabled: false,

    getSaveBalance: () => saveCalls - restoreCalls,
    getSaveCount: () => saveCalls,
    getRestoreCount: () => restoreCalls,
    getLinearGradientCount: () => linearGradientCalls,
    getRadialGradientCount: () => radialGradientCalls,
    getTotalGradientCount: () => linearGradientCalls + radialGradientCalls,
    getDrawImageCalls: () => drawImageCalls,
    getFillRectCalls: () => fillRectCalls,
    getStrokeRectCalls: () => strokeRectCalls,
    getArcCalls: () => arcCalls,
    getEllipseCalls: () => ellipseCalls,
    getTextCalls: () => textCalls,
    getClearRectCalls: () => clearRectCalls,
  };

  return ctx as unknown as MockContext2D;
}

export function createMockCanvas(
  width = 1000,
  height = 625,
  mockCtx?: MockContext2D
): { canvas: HTMLCanvasElement; ctx: MockContext2D } {
  const ctx = mockCtx || createMockContext2D(width, height);
  const canvas = {
    width,
    height,
    getContext: (type: string, _opts?: CanvasRenderingContext2DSettings) => {
      if (type === "2d") return ctx;
      return null;
    },
  } as unknown as HTMLCanvasElement;
  return { canvas, ctx };
}
