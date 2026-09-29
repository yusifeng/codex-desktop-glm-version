// Resistor comparison normalization helpers. Release chunk: resistor-comparison-cc070edadd95.js.
import "@rchunk/rolldown-runtime";

interface NumericRange {
  min: number;
  max: number;
}
type NormalizeByRanges = (
  values: readonly number[],
  ranges: readonly NumericRange[],
) => number[];
type NormalizeAgainstScale = (
  values: readonly number[],
  scale: number,
) => number[];
type PositiveShare = (value: number, scale: number) => number;

let r: NormalizeByRanges;
let t: PositiveShare;
let n: NormalizeAgainstScale;

function i(): void {
  const clamp = (value: number, minimum: number, maximum: number): number =>
    Math.min(Math.max(value, minimum), maximum);
  const encompassingRange = (
    ranges: readonly NumericRange[],
  ): NumericRange => ({
    min: Math.min(...ranges.map((range) => range.min)),
    max: Math.max(...ranges.map((range) => range.max)),
  });
  r ??= (values, ranges) => {
    const range = encompassingRange(ranges);
    const width = range.max - range.min;
    return values.map((value) =>
      width === 0 ? 0 : clamp((value - range.min) / width, 0, 1),
    );
  };
  t ??= (value, scale) => {
    const positiveValue = Math.max(value, 0);
    return positiveValue / (positiveValue + Math.max(scale, Number.EPSILON));
  };
  n ??= (values, scale) => values.map((value) => t(value, scale));
}

export { i, n, r, t };
