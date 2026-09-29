// Thin-lens optics calculator. Release chunk: thin-optics-509819bab7fc.js.
import "@rchunk/rolldown-runtime";

interface ThinOpticsResult {
  objectDistance: number;
  focalLength: number;
  imageDistance: number;
  magnification: number;
  finiteImage: boolean;
}

type ThinOpticsCalculator = (
  objectDistance: number,
  focalLength: number,
) => ThinOpticsResult;

const relativeTolerance = 1e-9;
let n: ThinOpticsCalculator;

function initializeThinOptics(): void {
  n ??= (objectDistance, focalLength) => {
    const denominator = objectDistance - focalLength;
    const scale = Math.max(
      Math.abs(objectDistance),
      Math.abs(focalLength),
      Number.MIN_VALUE,
    );
    const finiteImage = Math.abs(denominator) > relativeTolerance * scale;
    const imageDistance = finiteImage
      ? (focalLength * objectDistance) / denominator
      : Number.POSITIVE_INFINITY;

    return {
      objectDistance,
      focalLength,
      imageDistance,
      magnification: finiteImage ? -imageDistance / objectDistance : 0,
      finiteImage,
    };
  };
}

export { n, initializeThinOptics as t };
