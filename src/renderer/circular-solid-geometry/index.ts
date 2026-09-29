// Circular-solid visualization sizing. Release chunk: circular-solid-geometry-3f972b28e3c0.js.
import "@rchunk/rolldown-runtime";

interface RectSizingInput {
  height: number;
  width: number;
  preferredHeightPx: number;
  preferredWidthPx: number;
  maxHeightPx: number;
  maxWidthPx: number;
}

interface CircularSizingInput {
  height: number;
  radius: number;
  preferredHeightPx: number;
  preferredRadiusPx: number;
  maxHeightPx: number;
  maxRadiusPx: number;
}

const minAspectRatio = 0.4;
const maxAspectRatio = 3.5;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function sizeRectangle({
  height,
  width,
  preferredHeightPx,
  preferredWidthPx,
  maxHeightPx,
  maxWidthPx,
}: RectSizingInput): { heightPx: number; widthPx: number } {
  const aspectRatio = clamp(height / width, minAspectRatio, maxAspectRatio);
  const preferredArea = preferredWidthPx * preferredHeightPx;
  const widthPx = Math.sqrt(preferredArea / aspectRatio);
  const heightPx = widthPx * aspectRatio;
  const scale = Math.min(1, maxWidthPx / widthPx, maxHeightPx / heightPx);
  return { heightPx: heightPx * scale, widthPx: widthPx * scale };
}

let sizeCircularSolid: (input: CircularSizingInput) => {
  heightPx: number;
  radiusPx: number;
};
let initialized = false;

function initialize(): void {
  if (initialized) return;
  initialized = true;
  sizeCircularSolid = ({
    height,
    radius,
    preferredHeightPx,
    preferredRadiusPx,
    maxHeightPx,
    maxRadiusPx,
  }) => {
    const dimensions = sizeRectangle({
      height,
      width: radius * 2,
      preferredHeightPx,
      preferredWidthPx: preferredRadiusPx * 2,
      maxHeightPx,
      maxWidthPx: maxRadiusPx * 2,
    });
    return { heightPx: dimensions.heightPx, radiusPx: dimensions.widthPx / 2 };
  };
}

export { initialize as n, sizeCircularSolid as t };
