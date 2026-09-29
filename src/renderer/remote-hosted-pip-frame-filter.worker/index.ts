// remote-hosted-pip-frame-filter.worker —— 丢弃透明或突然接近透明的远程 PiP 帧。

{

interface FrameLike {
  close(): void;
  displayHeight: number;
  displayWidth: number;
}
interface CanvasContextLike {
  clearRect(x: number, y: number, width: number, height: number): void;
  drawImage(frame: FrameLike, x: number, y: number, width: number, height: number): void;
  getImageData(x: number, y: number, width: number, height: number): { data: Uint8ClampedArray };
}
interface WorkerScopeLike {
  onmessage: ((event: { data: FrameLike }) => void) | null;
  postMessage(message: FrameLike | null, options?: { transfer: FrameLike[] }): void;
}

const context = new OffscreenCanvas(8, 8).getContext("2d", { alpha: true, willReadFrequently: true }) as unknown as CanvasContextLike | null;
const workerScope = globalThis as unknown as WorkerScopeLike;
let peakAlpha = 0;
let previousWidth = 0;
let previousHeight = 0;

workerScope.onmessage = ({ data: frame }) => {
  if (context != null) {
    context.clearRect(0, 0, 8, 8);
    context.drawImage(frame, 0, 0, 8, 8);
    const pixels = context.getImageData(0, 0, 8, 8).data;
    let alpha = 0;
    for (let index = 3; index < pixels.length; index += 4) alpha += pixels[index];
    const comparablePeak = previousWidth === frame.displayWidth && previousHeight === frame.displayHeight ? peakAlpha : 0;
    if (alpha === 0 || (comparablePeak > 0 && alpha < comparablePeak * 0.98)) {
      frame.close();
      workerScope.postMessage(null);
      return;
    }
    peakAlpha = Math.max(comparablePeak, alpha);
    previousWidth = frame.displayWidth;
    previousHeight = frame.displayHeight;
  }
  workerScope.postMessage(frame, { transfer: [frame] });
};
}
