export interface MockContext2D extends CanvasRenderingContext2D {
  getSaveBalance: () => number;
  getSaveCount: () => number;
  getRestoreCount: () => number;
  getLinearGradientCount: () => number;
  getRadialGradientCount: () => number;
  getTotalGradientCount: () => number;
  getDrawImageCalls: () => any[];
  getFillRectCalls: () => any[];
  getStrokeRectCalls: () => any[];
  getArcCalls: () => any[];
  getEllipseCalls: () => any[];
  getTextCalls: () => string[];
  getClearRectCalls: () => any[];
}

export function createMockContext2D(width = 1000, height = 625): MockContext2D {
  let saveCalls = 0;
  let restoreCalls = 0;
  let linearGradientCalls = 0;
  let radialGradientCalls = 0;
  const drawImageCalls: any[] = [];
  const clearRectCalls: any[] = [];
  const fillRectCalls: any[] = [];
  const strokeRectCalls: any[] = [];
  const arcCalls: any[] = [];
  const ellipseCalls: any[] = [];
  const textCalls: string[] = [];

  const ctx: any = {
    canvas: { width, height },
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
    clearRect: (...args: any[]) => {
      clearRectCalls.push(args);
    },
    fill: () => {},
    stroke: () => {},
    drawImage: (...args: any[]) => {
      drawImageCalls.push(args);
    },
    getImageData: (x = 0, y = 0, w = 100, h = 100) => ({
      data: new Uint8ClampedArray(w * h * 4),
      width: w,
      height: h,
    }),
    putImageData: () => {},
    fillText: (text: string) => {
      textCalls.push(text);
    },
    strokeText: (text: string) => {
      textCalls.push(text);
    },
    measureText: (txt: string) => ({ width: (txt || "").length * 6 }),
    createLinearGradient: () => {
      linearGradientCalls++;
      return { addColorStop: () => {} };
    },
    createRadialGradient: () => {
      radialGradientCalls++;
      return { addColorStop: () => {} };
    },
    setLineDash: () => {},
    getLineDash: () => [],
    fillStyle: "#000000",
    strokeStyle: "#000000",
    lineWidth: 1,
    globalAlpha: 1.0,
    font: "10px sans-serif",
    textAlign: "left",
    textBaseline: "top",
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

  return ctx as MockContext2D;
}

export function createMockCanvas(
  width = 1000,
  height = 625,
  mockCtx?: MockContext2D
): { canvas: HTMLCanvasElement; ctx: MockContext2D } {
  const ctx = mockCtx || createMockContext2D(width, height);
  const canvas: any = {
    width,
    height,
    getContext: (type: string, _opts?: any) => {
      if (type === "2d") return ctx;
      return null;
    },
  };
  return { canvas: canvas as HTMLCanvasElement, ctx };
}
