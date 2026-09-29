// Riemann-sum teaching model. Release chunk: model-86d466c7f97d.js.
import "@rchunk/rolldown-runtime";
import {
  a as initializeBuildGraphData,
  n as evaluateExpression,
} from "@rchunk/build-graph-data";
import {
  n as initializeTokenizer,
  r as parseMath,
  t as collectVariables,
} from "@rchunk/tokenize-math-block";
import {
  n as initializeNullThrows,
  t as nullThrows,
} from "@rchunk/null-throws";
import {
  n as parseNumericalIntegral,
  t as initializeNumericalIntegration,
} from "@rchunk/numerical-integration";
type Variant = "left" | "middle" | "right";
interface Input {
  integrand: string;
  lowerBound: number;
  method: "riemann";
  riemannVariant: Variant;
  subintervalCount: number;
  upperBound: number;
}
type Expression = ReturnType<typeof parseMath>;
const defaults: Input = {
  integrand: "x",
  lowerBound: 0,
  method: "riemann",
  riemannVariant: "middle",
  subintervalCount: 8,
  upperBound: 5,
};
const control = { min: 2, max: 20, step: 1 };
const fallback = nullThrows(parseMath("y=x"));
const exactSteps = 2000;
const numberPattern = "-?(?:\\d+(?:\\.\\d*)?|\\.\\d+)";
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);
const finite = (value: number | undefined, fallbackValue: number) =>
  Number.isFinite(value) ? Number(value) : fallbackValue;
const compact = (value: string) =>
  value
    .toLowerCase()
    .replace(/\\left|\\right/g, "")
    .replace(/[−–—]/g, "-")
    .replace(/\s+/g, "");
const safeIntegrand = (value: string | undefined) => {
  const parsed = parseNumericalIntegral(value ?? defaults.integrand);
  return parsed.hasUnsupportedLetter || !parsed.integrand
    ? defaults.integrand
    : parsed.integrand;
};
const validExpression = (value: string): Expression | null => {
  const parsed = parseMath(`y=${value}`);
  const hasFunction =
    Array.isArray(parsed) &&
    parsed.some(
      (token: unknown) =>
        typeof token === "object" &&
        token !== null &&
        "type" in token &&
        token.type === "function",
    );
  return !parsed || hasFunction || collectVariables(parsed).length > 0
    ? null
    : parsed;
};
const parseNumber = (value: string | undefined) => {
  if (value == null) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const parseIntegral = (source: string) => {
  const text = compact(source).replace(/\\,/g, ""),
    forward = text.match(
      RegExp(
        `\\\\int_(?:\\{(?<lowerBraced>${numberPattern})\\}|(?<lowerPlain>${numberPattern}))\\^(?:\\{(?<upperBraced>${numberPattern})\\}|(?<upperPlain>${numberPattern}))(?<integrand>.+?)dx`,
      ),
    );
  if (forward?.groups?.integrand)
    return {
      integrand: forward.groups.integrand,
      lowerBound:
        parseNumber(forward.groups.lowerBraced ?? forward.groups.lowerPlain) ??
        0,
      upperBound:
        parseNumber(forward.groups.upperBraced ?? forward.groups.upperPlain) ??
        5,
    };
  const reverse = text.match(
    RegExp(
      `\\\\int\\^(?:\\{(?<upperBraced>${numberPattern})\\}|(?<upperPlain>${numberPattern}))_(?:\\{(?<lowerBraced>${numberPattern})\\}|(?<lowerPlain>${numberPattern}))(?<integrand>.+?)dx`,
    ),
  );
  return reverse?.groups?.integrand
    ? {
        integrand: reverse.groups.integrand,
        lowerBound:
          parseNumber(
            reverse.groups.lowerBraced ?? reverse.groups.lowerPlain,
          ) ?? 0,
        upperBound:
          parseNumber(
            reverse.groups.upperBraced ?? reverse.groups.upperPlain,
          ) ?? 5,
      }
    : {
        integrand:
          source.match(/^\s*f\s*\(\s*x\s*\)\s*=\s*(.+?)\s*$/i)?.[1] ?? source,
        lowerBound: 0,
        upperBound: 5,
      };
};
const normalize = (input: Partial<Input>): Input => {
  const lower = finite(input.lowerBound, 0),
    upper = finite(input.upperBound, 5),
    variant: Variant =
      input.riemannVariant === "left" || input.riemannVariant === "right"
        ? input.riemannVariant
        : "middle";
  return {
    integrand: safeIntegrand(input.integrand),
    lowerBound: lower,
    method: "riemann",
    riemannVariant: variant,
    subintervalCount: clamp(
      Math.round(
        Number.isFinite(input.subintervalCount)
          ? (input.subintervalCount ?? 8)
          : 0,
      ) || 8,
      2,
      20,
    ),
    upperBound: upper === lower ? 5 : upper,
  };
};
const parseInput = (source: string) =>
  normalize({
    ...parseIntegral(source),
    method: "riemann",
    riemannVariant: source.toLowerCase().includes("left")
      ? "left"
      : source.toLowerCase().includes("right")
        ? "right"
        : "middle",
    subintervalCount: Number.parseInt(
      source.match(/\bn\s*=\s*(\d+)/i)?.[1] ??
        source.match(/with\s+(\d+)\s+subintervals?/i)?.[1] ??
        "8",
      10,
    ),
  });
const isIntegral = (source: string) => {
  const bound = `(?:\\{${numberPattern}\\}|${numberPattern})`;
  return RegExp(
    `^\\\\int(?:_${bound}\\^${bound}|\\^${bound}_${bound}).+?dx$`,
  ).test(compact(source).replace(/\\,/g, ""));
};
const bounds = (input: Partial<Input>): [number, number] => [
  finite(input.lowerBound, 0),
  finite(input.upperBound, 5),
];
const domain = (input: Partial<Input>): [number, number] => {
  const [a, b] = bounds(input),
    low = Math.min(a, b),
    high = Math.max(a, b),
    span = Math.max(high - low, 1),
    padding = Math.max(span * 0.15, 0.75);
  return [low - padding, high + padding];
};
const expression = (input: Partial<Input>): Expression =>
  validExpression(normalize(input).integrand) ?? fallback;
const evaluate = (input: Partial<Input>, x: number) =>
  evaluateExpression(expression(input), x, {});
const format = (value: number, precision = 3) => {
  if (!Number.isFinite(value)) return "0";
  const rounded = Number(value.toFixed(precision));
  return Object.is(rounded, -0) ? "0" : rounded.toString();
};
const integrand = (input: Partial<Input>) => normalize(input).integrand;
const integral = (input: Partial<Input>) => {
  const safe = normalize(input);
  return `\\int_{${format(safe.lowerBound, 4)}}^{${format(safe.upperBound, 4)}} ${safe.integrand.replace(/pi/g, "\\pi").replace(/\*/g, "\\cdot ")} \\, dx`;
};
const estimate = (input: Partial<Input>) => {
  const safe = normalize(input),
    [a, b] = bounds(safe),
    width = (b - a) / safe.subintervalCount;
  let total = 0;
  for (let index = 0; index < safe.subintervalCount; index += 1) {
    const x =
      safe.riemannVariant === "left"
        ? a + index * width
        : safe.riemannVariant === "right"
          ? a + (index + 1) * width
          : a + (index + 0.5) * width;
    total += evaluate(safe, x);
  }
  return width * total;
};
const exact = (input: Partial<Input>) => {
  const safe = normalize(input),
    [a, b] = bounds(safe),
    width = (b - a) / exactSteps;
  let total = evaluate(safe, a) + evaluate(safe, b);
  if (!Number.isFinite(total)) return Number.NaN;
  for (let index = 1; index < exactSteps; index += 1) {
    const value = evaluate(safe, a + index * width);
    if (!Number.isFinite(value)) return Number.NaN;
    total += (index % 2 === 0 ? 2 : 4) * value;
  }
  return (width / 3) * total;
};
const result = (input: Partial<Input>) => {
  const safe = normalize(input),
    approximation = estimate(safe),
    exactValue = exact(safe);
  return {
    estimate: approximation,
    exactValue,
    error: approximation - exactValue,
  };
};
function initializeModel(): void {
  initializeTokenizer();
  initializeBuildGraphData();
  initializeNumericalIntegration();
  initializeNullThrows();
}
export {
  format as a,
  integrand as c,
  initializeModel as d,
  isIntegral as f,
  evaluate as i,
  expression as l,
  parseInput as n,
  integral as o,
  normalize as p,
  result as r,
  bounds as s,
  control as t,
  domain as u,
};
