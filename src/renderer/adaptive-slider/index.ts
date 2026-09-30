// Adaptive numeric slider bounds. Release chunk: adaptive-slider-7a51d6c629a2.js.
import "@rchunk/rolldown-runtime";

interface Range {
  min: number;
  max: number;
}
interface Bounds extends Range {
  step: number;
}
interface AdaptiveSliderConfig {
  allowed: Range;
  base: Bounds;
  localWindowRatio?: number;
  maxAlignedWindowStepCount?: number;
  maxFractionDigits?: number;
  maxPreciseWindowStepCount?: number;
  minWindowStepHeadroom?: number;
  targetLocalStepCount?: number;
}

let configsEqual: (
  left: AdaptiveSliderConfig,
  right: AdaptiveSliderConfig,
) => boolean;
let clampValue: (
  value: number,
  range: Range,
  options?: { maxFractionDigits?: number },
) => number;
let fractionDigits: (value: number) => number;
let chooseAlignedStep: (
  value: number,
  range: Range,
  options?: {
    maxFractionDigits?: number;
    maxPreciseWindowStepCount?: number;
    targetLocalStepCount?: number;
  },
) => number;
let minimumFractionDigits: (value: number, maximum?: number) => number;
let isStepAligned: (value: number, minimum: number, step: number) => boolean;
let computeAdaptiveBounds: (
  value: number,
  config: AdaptiveSliderConfig,
) => Bounds;
let maximumAlignedWindowStepCount: number;
let roundTo: (value: number, digits: number) => number;

function initializeAdaptiveSlider(): void {
  const epsilon = 1e-9;
  const defaultLocalWindowRatio = 0.2;
  configsEqual = (left, right) =>
    left.allowed.min === right.allowed.min &&
    left.allowed.max === right.allowed.max &&
    left.base.min === right.base.min &&
    left.base.max === right.base.max &&
    left.base.step === right.base.step &&
    left.localWindowRatio === right.localWindowRatio &&
    left.maxAlignedWindowStepCount === right.maxAlignedWindowStepCount &&
    left.maxFractionDigits === right.maxFractionDigits &&
    left.maxPreciseWindowStepCount === right.maxPreciseWindowStepCount &&
    left.minWindowStepHeadroom === right.minWindowStepHeadroom &&
    left.targetLocalStepCount === right.targetLocalStepCount;
  maximumAlignedWindowStepCount = 5_000;
  const clamp = (value: number, minimum: number, maximum: number) =>
    Math.min(Math.max(value, minimum), maximum);
  fractionDigits = (value) => {
    const text = value.toString();
    if (text.includes("e-")) return Number(text.split("e-")[1]);
    return text.split(".")[1]?.length ?? 0;
  };
  roundTo = (value, digits) => {
    const scale = 10 ** digits;
    return Math.round((value + Number.EPSILON) * scale) / scale;
  };
  isStepAligned = (value, minimum, step) => {
    const steps = (value - minimum) / step;
    return Math.abs(steps - Math.round(steps)) < epsilon;
  };
  minimumFractionDigits = (value, maximum = 2) => {
    const rounded = roundTo(value, maximum);
    for (let digits = 0; digits <= maximum; digits += 1) {
      if (Math.abs(rounded - roundTo(rounded, digits)) < epsilon) return digits;
    }
    return maximum;
  };
  const nearestNiceStep = (desired: number, maxDigits: number) => {
    const minimum = 10 ** -maxDigits;
    const normalized = Math.max(desired, minimum);
    const exponent = Math.floor(Math.log10(normalized));
    let best = minimum;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const candidateExponent of [exponent - 1, exponent, exponent + 1]) {
      for (const multiplier of [1, 2, 5]) {
        const candidate = multiplier * 10 ** candidateExponent;
        if (candidate < minimum - epsilon) continue;
        const distance = Math.abs(candidate - normalized);
        if (distance < bestDistance - epsilon) {
          best = candidate;
          bestDistance = distance;
        }
      }
    }
    return best;
  };
  const candidateSteps = (maximum: number, maxDigits: number) => {
    const minimum = 10 ** -maxDigits;
    const normalized = Math.max(maximum, minimum);
    const maxExponent = Math.ceil(Math.log10(normalized));
    const result = new Set([normalized, minimum]);
    for (let exponent = -maxDigits; exponent <= maxExponent; exponent += 1) {
      for (const multiplier of [1, 2, 5]) {
        const candidate = multiplier * 10 ** exponent;
        if (
          candidate >= minimum - epsilon &&
          candidate <= normalized + epsilon
        ) {
          result.add(candidate);
        }
      }
    }
    return [...result].sort((left, right) => right - left);
  };
  clampValue = (value, range, { maxFractionDigits = 2 } = {}) =>
    Number.isFinite(value)
      ? clamp(roundTo(value, maxFractionDigits), range.min, range.max)
      : range.min;
  const chooseStep = (
    value: number,
    windowSize: number,
    {
      maxFractionDigits = 2,
      maxPreciseWindowStepCount = 500,
      targetLocalStepCount = 40,
    },
  ) => {
    const digits = minimumFractionDigits(value, maxFractionDigits);
    if (digits > 0) {
      const preciseStep = 10 ** -digits;
      if (windowSize / preciseStep <= maxPreciseWindowStepCount + epsilon) {
        return preciseStep;
      }
    }
    return nearestNiceStep(
      windowSize / targetLocalStepCount,
      maxFractionDigits,
    );
  };
  const localStep = (
    value: number,
    {
      localWindowRatio = defaultLocalWindowRatio,
      maxFractionDigits = 2,
      maxPreciseWindowStepCount = 500,
      targetLocalStepCount = 40,
    }: AdaptiveSliderConfig,
  ) =>
    chooseStep(value, Math.abs(value) * localWindowRatio * 2, {
      maxFractionDigits,
      maxPreciseWindowStepCount,
      targetLocalStepCount,
    });
  const rangeStep = (
    value: number,
    range: Range,
    {
      maxFractionDigits = 2,
      maxPreciseWindowStepCount = 500,
      targetLocalStepCount = 40,
    } = {},
  ) =>
    chooseStep(value, range.max - range.min, {
      maxFractionDigits,
      maxPreciseWindowStepCount,
      targetLocalStepCount,
    });
  chooseAlignedStep = (value, range, options = {}) => {
    const maxDigits = options.maxFractionDigits ?? 2;
    const initial = rangeStep(value, range, options);
    for (const step of candidateSteps(initial, maxDigits)) {
      if (isStepAligned(value, range.min, step)) return step;
    }
    return 10 ** -maxDigits;
  };
  computeAdaptiveBounds = (value, config) => {
    const {
      allowed,
      base,
      localWindowRatio = defaultLocalWindowRatio,
      minWindowStepHeadroom = 4,
      maxFractionDigits = 2,
      maxPreciseWindowStepCount = 500,
      targetLocalStepCount = 40,
    } = config;
    const safeValue = clampValue(value, allowed, { maxFractionDigits });
    if (
      safeValue >= base.min - epsilon &&
      safeValue <= base.max + epsilon &&
      isStepAligned(safeValue, base.min, base.step)
    ) {
      return { min: base.min, max: base.max, step: base.step };
    }
    const step = localStep(safeValue, {
      ...config,
      localWindowRatio,
      maxFractionDigits,
      maxPreciseWindowStepCount,
      targetLocalStepCount,
    });
    const digits = Math.max(
      fractionDigits(step),
      minimumFractionDigits(safeValue, maxFractionDigits),
    );
    const desired = Math.max(
      minWindowStepHeadroom,
      Math.ceil((Math.abs(safeValue) * localWindowRatio) / step - epsilon),
    );
    const total = desired * 2;
    const availableBelow = Math.max(
      0,
      Math.floor((safeValue - allowed.min) / step + epsilon),
    );
    const availableAbove = Math.max(
      0,
      Math.floor((allowed.max - safeValue) / step + epsilon),
    );
    let below = Math.min(desired, availableBelow);
    let above = Math.min(desired, availableAbove);
    if (below < desired)
      above += Math.min(total - below - above, availableAbove - above);
    if (above < desired)
      below += Math.min(total - below - above, availableBelow - below);
    return {
      min: roundTo(safeValue - below * step, digits),
      max: roundTo(safeValue + above * step, digits),
      step,
    };
  };
}

export {
  initializeAdaptiveSlider as a,
  clampValue as c,
  fractionDigits as i,
  chooseAlignedStep as l,
  minimumFractionDigits as n,
  isStepAligned as o,
  computeAdaptiveBounds as r,
  configsEqual as s,
  maximumAlignedWindowStepCount as t,
  roundTo as u,
};
