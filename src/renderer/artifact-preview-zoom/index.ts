import "@rchunk/rolldown-runtime";
const t = [25, 50, 100, 150, 200] as const;
function n(value: number): number { return Math.min(400, Math.max(10, value)); }
function i(zoomPercent: number, wheelDelta: number): number { return n(Math.round(zoomPercent * Math.exp(-wheelDelta * 0.01))); }
function r({ initialDistance, initialZoomPercent, nextDistance }: { initialDistance: number; initialZoomPercent: number; nextDistance: number }): number { return n(Math.round((nextDistance / initialDistance) * initialZoomPercent)); }
function a(x1: number, y1: number, x2: number, y2: number): number { return Math.hypot(x1 - x2, y1 - y2); }
function o(): void {}
export { a, i, n, o, r, t };
