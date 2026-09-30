// React state adapter for adaptive sliders. Release chunk: adaptive-slider-field-6d316e0b7a10.js.
import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import {
  a as initializeAdaptiveSlider,
  c as clampValue,
  i as fractionDigits,
  l as chooseAlignedStep,
  o as isStepAligned,
  r as computeAdaptiveBounds,
  s as configsEqual,
} from "@rchunk/adaptive-slider";

interface Range {
  min: number;
  max: number;
}
interface Bounds extends Range {
  step: number;
}
interface Control {
  baseMin: number;
  baseMax: number;
  step: number;
}
interface Options {
  maxFractionDigits?: number;
  maxAlignedWindowStepCount?: number;
  maxPreciseWindowStepCount?: number;
  targetLocalStepCount?: number;
  localWindowRatio?: number;
  minWindowStepHeadroom?: number;
}
interface Config extends Options {
  allowed: Range;
  base: Bounds;
}
interface ReactRuntime {
  useState<T>(initial: T | (() => T)): [T, (value: T) => void];
  useEffect(effect: () => void, dependencies: unknown[]): void;
}
const React = (appSharedChunk as unknown as { e6(): ReactRuntime }).e6();

const makeBase = (control: Control): Bounds => ({
  min: control.baseMin,
  max: control.baseMax,
  step: control.step,
});
const makeConfig = (
  control: Control,
  allowed: Range,
  options?: Options,
): Config => ({
  allowed,
  base: makeBase(control),
  maxFractionDigits: 2,
  ...options,
});
function sanitizeValue(
  value: unknown,
  allowed: Range & { defaultValue: number },
): number {
  const number =
    typeof value === "number" && Number.isFinite(value)
      ? value
      : allowed.defaultValue;
  return Math.min(Math.max(number, allowed.min), allowed.max);
}
function computeBounds(
  value: number,
  control: Control,
  allowed: Range,
  options?: Options,
): Bounds {
  return computeAdaptiveBounds(value, makeConfig(control, allowed, options));
}
function boundsAreValid(
  bounds: Bounds | null | undefined,
  value: number,
  config: Config,
): boolean {
  if (
    bounds == null ||
    !Number.isFinite(bounds.min) ||
    !Number.isFinite(bounds.max) ||
    !Number.isFinite(bounds.step) ||
    bounds.min >= bounds.max ||
    bounds.step <= 0 ||
    bounds.min < config.allowed.min ||
    bounds.max > config.allowed.max ||
    value < bounds.min ||
    value > bounds.max
  )
    return false;
  const maxDigits = config.maxFractionDigits ?? 2;
  const stepCount = (bounds.max - bounds.min) / bounds.step;
  const maxSteps = config.maxAlignedWindowStepCount ?? 5_000;
  return (
    fractionDigits(bounds.step) <= maxDigits &&
    Number.isFinite(stepCount) &&
    stepCount >= 1 &&
    stepCount <= maxSteps + Number.EPSILON &&
    isStepAligned(bounds.max, bounds.min, bounds.step) &&
    isStepAligned(value, bounds.min, bounds.step)
  );
}
function adjustBounds({
  config,
  current,
  value,
}: {
  config: Config;
  current: Bounds;
  value: number;
}): Bounds {
  const safe = clampValue(value, config.allowed, {
    maxFractionDigits: config.maxFractionDigits,
  });
  return safe >= current.min && safe <= current.max
    ? current
    : computeAdaptiveBounds(safe, config);
}
function resolveBounds({
  allowed,
  bounds,
  control,
  options,
  value,
}: {
  allowed: Range & { defaultValue: number };
  bounds?: Bounds;
  control: Control;
  options?: Options;
  value: unknown;
}): Bounds {
  const config = makeConfig(control, allowed, options);
  const safe = sanitizeValue(value, allowed);
  return boundsAreValid(bounds, safe, config)
    ? adjustBounds({ config, current: bounds as Bounds, value: safe })
    : computeAdaptiveBounds(safe, config);
}
function useAdaptiveBounds({
  allowed,
  control,
  options,
  value,
}: {
  allowed: Range & { defaultValue: number };
  control: Control;
  options?: Options;
  value: unknown;
}) {
  const config = makeConfig(control, allowed, options);
  const safeValue = sanitizeValue(value, allowed);
  const [state, setState] = React.useState(() => ({
    bounds: computeAdaptiveBounds(safeValue, config),
    config,
  }));
  const next = !configsEqual(state.config, config)
    ? { bounds: computeAdaptiveBounds(safeValue, config), config }
    : {
        bounds: adjustBounds({
          config,
          current: state.bounds,
          value: safeValue,
        }),
        config,
      };
  React.useEffect(() => {
    if (next.bounds !== state.bounds || next.config !== state.config)
      setState(next);
  }, [next, state]);
  return { bounds: next.bounds, safeValue };
}
function useAdaptiveSliderField({
  allowed,
  bounds,
  control,
  onChange,
  options,
  value,
}: {
  allowed: Range & { defaultValue: number };
  bounds?: Bounds;
  control: Control;
  onChange(value: number, source: string, bounds: Bounds): void;
  options?: Options;
  value: unknown;
  valuesVersion?: number;
}) {
  const config = makeConfig(control, allowed, options);
  const safeValue = sanitizeValue(value, allowed);
  const current = resolveBounds({ allowed, bounds, control, options, value });
  return {
    bounds: current,
    safeValue,
    inputSelectorProps: {
      max: current.max,
      min: current.min,
      normalizeCommittedValue: (next: number) =>
        clampValue(next, config.allowed, {
          maxFractionDigits: config.maxFractionDigits,
        }),
      onChange: (next: number, source: string) => {
        const safe = clampValue(next, config.allowed, {
          maxFractionDigits: config.maxFractionDigits,
        });
        let nextBounds = current;
        if (
          source !== "slider" &&
          !(safe >= current.min && safe <= current.max)
        ) {
          nextBounds = computeAdaptiveBounds(safe, config);
        } else if (
          source === "input" &&
          safe >= current.min &&
          safe <= current.max
        ) {
          const step = chooseAlignedStep(safe, current, options);
          const maxSteps = config.maxAlignedWindowStepCount ?? 5_000;
          nextBounds =
            (current.max - current.min) / step > maxSteps + Number.EPSILON
              ? computeAdaptiveBounds(safe, config)
              : { ...current, step };
        }
        onChange(safe, source, nextBounds);
      },
      step: current.step,
      value: safeValue,
    },
  };
}
function initializeAdaptiveSliderField(): void {
  initializeAdaptiveSlider();
}

export {
  useAdaptiveSliderField as a,
  sanitizeValue as i,
  initializeAdaptiveSliderField as n,
  useAdaptiveBounds as o,
  resolveBounds as r,
  computeBounds as t,
};
