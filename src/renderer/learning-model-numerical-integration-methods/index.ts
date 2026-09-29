// Numerical-integration methods teaching model. Release chunk: model-2e9de4cfd2c8.js.
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
type Method = "riemann" | "trapezoidal" | "simpson";
type Variant = "left" | "middle" | "right";
interface Input {
  integrand: string;
  lowerBound: number;
  method: Method;
  riemannVariant: Variant;
  subintervalCount: number;
  upperBound: number;
}
type Expression = ReturnType<typeof parseMath>;
const defaults: Input = {
  integrand: "x^2",
  lowerBound: -5,
  method: "riemann",
  riemannVariant: "middle",
  subintervalCount: 8,
  upperBound: 5,
};
const control = { min: 2, max: 20, step: 1 };
const fallback = nullThrows(parseMath("y=x^2"));
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
const safeIntegrand = (value: string | undefined) => {
  const parsed = parseNumericalIntegral(value ?? defaults.integrand);
  return parsed.hasUnsupportedLetter ||
    !parsed.integrand ||
    !validExpression(parsed.integrand)
    ? defaults.integrand
    : parsed.integrand;
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
        -5,
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
          ) ?? -5,
        upperBound:
          parseNumber(
            reverse.groups.upperBraced ?? reverse.groups.upperPlain,
          ) ?? 5,
      }
    : {
        integrand:
          source.match(/^\s*f\s*\(\s*x\s*\)\s*=\s*(.+?)\s*$/i)?.[1] ?? source,
        lowerBound: -5,
        upperBound: 5,
      };
};
const methodFrom = (source: string): Method => {
  const value = source.toLowerCase();
  return value.includes("simpson")
    ? "simpson"
    : value.includes("trapezoid")
      ? "trapezoidal"
      : "riemann";
};
const normalize = (input: Partial<Input>): Input => {
  const method: Method =
      input.method === "simpson" || input.method === "trapezoidal"
        ? input.method
        : "riemann",
    raw = clamp(
      Math.round(
        Number.isFinite(input.subintervalCount)
          ? (input.subintervalCount ?? 8)
          : 0,
      ) || 8,
      2,
      20,
    ),
    count = method === "simpson" ? clamp(Math.round(raw / 2) * 2, 2, 20) : raw,
    lower = finite(input.lowerBound, -5),
    upper = finite(input.upperBound, 5);
  return {
    integrand: safeIntegrand(input.integrand),
    lowerBound: lower,
    method,
    riemannVariant:
      input.riemannVariant === "left" || input.riemannVariant === "right"
        ? input.riemannVariant
        : "middle",
    subintervalCount: count,
    upperBound: upper === lower ? 5 : upper,
  };
};
const parseInput = (source: string) =>
  normalize({
    ...parseIntegral(source),
    method: methodFrom(source),
    riemannVariant: source.toLowerCase().includes("left")
      ? "left"
      : source.toLowerCase().includes("right")
        ? "right"
        : "middle",
    subintervalCount: Number.parseInt(
      source.match(/\bn\s*=\s*(\d+)/i)?.[1] ??
        source.match(/(?:with|using)\s+(\d+)\s+subintervals?/i)?.[1] ??
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
  finite(input.lowerBound, -5),
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
  const safe = normalize(input),
    shown = safe.integrand
      .replace(/pi/g, (_match, offset: number, whole: string) =>
        /[a-z]/.test(whole[offset + 2] ?? "") ? "\\pi " : "\\pi",
      )
      .replace(/\*/g, "\\cdot ");
  return `\\int_{${format(safe.lowerBound, 4)}}^{${format(safe.upperBound, 4)}} ${shown} \\, dx`;
};
const estimate = (input: Partial<Input>) => {
  const safe = normalize(input),
    [a, b] = bounds(safe),
    width = (b - a) / safe.subintervalCount,
    value = (x: number) => evaluate(safe, x);
  if (safe.method === "trapezoidal") {
    let total = 0.5 * value(a) + 0.5 * value(b);
    for (let index = 1; index < safe.subintervalCount; index += 1)
      total += value(a + index * width);
    return width * total;
  }
  if (safe.method === "simpson") {
    let total = value(a) + value(b);
    for (let index = 1; index < safe.subintervalCount; index += 1)
      total += (index % 2 === 0 ? 2 : 4) * value(a + index * width);
    return (width / 3) * total;
  }
  let total = 0;
  for (let index = 0; index < safe.subintervalCount; index += 1) {
    const x =
      safe.riemannVariant === "left"
        ? a + index * width
        : safe.riemannVariant === "right"
          ? a + (index + 1) * width
          : a + (index + 0.5) * width;
    total += value(x);
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
