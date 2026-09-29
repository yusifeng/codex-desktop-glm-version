import "@rchunk/rolldown-runtime";
import "@rchunk/linear";

interface GraphDimensions { height: number; padding: number; width: number }
interface Point { x: number; y: number | null }
interface GraphData { holes: Point[]; paths: string[]; rawSegments: Point[][]; segments: Point[][]; xDomain: [number, number]; yDomain: [number, number] }
type ExpressionToken =
  | { type: "number"; value: number }
  | { type: "identifier"; value: string }
  | { type: "operator"; value: string }
  | { type: "function"; value: string };
interface BuildGraphOptions {
  discontinuityMode?: "interactive" | string;
  evaluateAt?: (x: number) => number;
  maxEvaluations?: number;
}
interface GraphDomains { xDomain?: [number, number]; yDomain?: [number, number] }
interface Rational { denominator: number; numerator: number }

let defaultGraphDimensions: GraphDimensions;
let squareGraphDimensions: GraphDimensions;
let defaultGraphWidth: number;
let defaultGraphHeight: number;

function initializeGraphDimensions(): void {
  defaultGraphDimensions = { width: 360, height: 220, padding: 0 };
  squareGraphDimensions = { width: 360, height: 360, padding: 0 };
  defaultGraphWidth = defaultGraphDimensions.width;
  defaultGraphHeight = defaultGraphDimensions.height;
}

function greatestCommonDivisor(left: number, right: number): number {
  let a = Math.abs(left);
  let b = Math.abs(right);
  while (b !== 0) [a, b] = [b, a % b];
  return a === 0 ? 1 : a;
}

function rational(numerator: number, denominator: number): Rational | null {
  if (!Number.isInteger(numerator) || !Number.isInteger(denominator) || denominator === 0) return null;
  const sign = denominator < 0 ? -1 : 1;
  const divisor = greatestCommonDivisor(numerator, denominator);
  return { numerator: numerator / divisor * sign, denominator: Math.abs(denominator / divisor) };
}

function identifierValue(name: string, variables: Record<string, number>): number {
  if (name === "pi") return Math.PI;
  if (name === "e") return Math.E;
  return Object.hasOwn(variables, name) ? variables[name] ?? Number.NaN : 1;
}

function rationalPower(base: number, exponent: Rational): number {
  if (exponent.denominator === 1) return base ** exponent.numerator;
  if (base === 0 && exponent.numerator < 0) return Number.NaN;
  if (base >= 0) return base ** (exponent.numerator / exponent.denominator);
  if (exponent.denominator % 2 === 0) return Number.NaN;
  const magnitude = Math.abs(base) ** (Math.abs(exponent.numerator) / exponent.denominator);
  const signed = Math.abs(exponent.numerator) % 2 === 0 ? magnitude : -magnitude;
  return exponent.numerator < 0 ? 1 / signed : signed;
}

function evaluateExpression(
  tokens: readonly ExpressionToken[],
  x: number,
  variables: Record<string, number> = {},
  customFunction?: (name: string, value: number) => number,
): number {
  const stack: Array<{ rational: Rational | null; value: number }> = [];
  for (const token of tokens) {
    if (token.type === "number") {
      stack.push({ value: token.value, rational: Number.isInteger(token.value) ? rational(token.value, 1) : null });
      continue;
    }
    if (token.type === "identifier") {
      stack.push({ value: token.value === "x" ? x : identifierValue(token.value, variables), rational: null });
      continue;
    }
    if (token.type === "operator") {
      const right = stack.pop();
      const left = stack.pop();
      if (left == null || right == null) return Number.NaN;
      if (token.value === "+") stack.push({ value: left.value + right.value, rational: addRational(left.rational, right.rational, 1) });
      else if (token.value === "-") stack.push({ value: left.value - right.value, rational: addRational(left.rational, right.rational, -1) });
      else if (token.value === "*") stack.push({ value: left.value * right.value, rational: multiplyRational(left.rational, right.rational) });
      else if (token.value === "/") stack.push({ value: left.value / right.value, rational: divideRational(left.rational, right.rational) });
      else if (token.value === "^") stack.push({ value: right.rational == null ? left.value ** right.value : rationalPower(left.value, right.rational), rational: null });
      else return Number.NaN;
      continue;
    }
    const operand = stack.pop();
    if (operand == null) return Number.NaN;
    const value = evaluateFunction(token.value, operand.value, customFunction);
    stack.push({ value, rational: token.value === "neg" && operand.rational != null ? rational(-operand.rational.numerator, operand.rational.denominator) : null });
  }
  return stack.length === 1 ? stack[0].value : Number.NaN;
}

function addRational(left: Rational | null, right: Rational | null, sign: 1 | -1): Rational | null {
  if (left == null || right == null) return null;
  return rational(left.numerator * right.denominator + sign * right.numerator * left.denominator, left.denominator * right.denominator);
}
function multiplyRational(left: Rational | null, right: Rational | null): Rational | null {
  return left == null || right == null ? null : rational(left.numerator * right.numerator, left.denominator * right.denominator);
}
function divideRational(left: Rational | null, right: Rational | null): Rational | null {
  return left == null || right == null ? null : rational(left.numerator * right.denominator, left.denominator * right.numerator);
}

function evaluateFunction(name: string, value: number, customFunction?: (name: string, value: number) => number): number {
  switch (name) {
    case "arcsin": return Math.asin(value);
    case "arccos": return Math.acos(value);
    case "arctan": return Math.atan(value);
    case "sin": return Math.sin(value);
    case "cos": return Math.cos(value);
    case "sinh": return Math.sinh(value);
    case "cosh": return Math.cosh(value);
    case "tan": return Math.tan(value);
    case "tanh": return Math.tanh(value);
    case "ln": return Math.log(value);
    case "log": return Math.log10(value);
    case "sqrt": return Math.sqrt(value);
    case "abs": return Math.abs(value);
    case "exp": return Math.exp(value);
    case "sigmoid": return 1 / (1 + Math.exp(-value));
    case "relu": return Math.max(0, value);
    case "neg": return -value;
    default: return customFunction?.(name, value) ?? Number.NaN;
  }
}

interface Affine { constant: number; xCoefficient: number }
function affineExpression(tokens: readonly ExpressionToken[], variables: Record<string, number>): Affine | null {
  const stack: Array<Affine | null> = [];
  for (const token of tokens) {
    if (token.type === "number") stack.push({ xCoefficient: 0, constant: token.value });
    else if (token.type === "identifier") stack.push(token.value === "x" ? { xCoefficient: 1, constant: 0 } : { xCoefficient: 0, constant: identifierValue(token.value, variables) });
    else if (token.type === "operator") {
      const right = stack.pop();
      const left = stack.pop();
      if (left == null || right == null) return null;
      if (token.value === "+" || token.value === "-") {
        const sign = token.value === "+" ? 1 : -1;
        stack.push({ xCoefficient: left.xCoefficient + sign * right.xCoefficient, constant: left.constant + sign * right.constant });
      } else if (token.value === "*" && left.xCoefficient === 0) stack.push({ xCoefficient: right.xCoefficient * left.constant, constant: right.constant * left.constant });
      else if (token.value === "*" && right.xCoefficient === 0) stack.push({ xCoefficient: left.xCoefficient * right.constant, constant: left.constant * right.constant });
      else if (token.value === "/" && right.xCoefficient === 0 && right.constant !== 0) stack.push({ xCoefficient: left.xCoefficient / right.constant, constant: left.constant / right.constant });
      else stack.push(null);
    } else if (token.value === "neg") {
      const value = stack.pop();
      stack.push(value == null ? null : { xCoefficient: -value.xCoefficient, constant: -value.constant });
    } else stack.push(null);
  }
  return stack.length === 1 ? stack[0] : null;
}

function findTrigAffine(tokens: readonly ExpressionToken[], variables: Record<string, number>): { affine: Affine; name: string } | null {
  const functionIndex = tokens.findLastIndex((token) => token.type === "function" && (token.value === "sin" || token.value === "cos" || token.value === "tan"));
  if (functionIndex < 0) return null;
  const token = tokens[functionIndex];
  if (token.type !== "function") return null;
  const affine = affineExpression(tokens.slice(0, functionIndex), variables);
  return affine == null ? null : { affine, name: token.value };
}

function getFundamentalPeriod(tokens: readonly ExpressionToken[], variables: Record<string, number> = {}): number | null {
  const trig = findTrigAffine(tokens, variables);
  if (trig == null || Math.abs(trig.affine.xCoefficient) <= 1e-9) return null;
  return (trig.name === "tan" ? Math.PI : 2 * Math.PI) / Math.abs(trig.affine.xCoefficient);
}

function getDiscontinuityHints(tokens: readonly ExpressionToken[], variables: Record<string, number>, minimumX: number, maximumX: number): { explicitPoleXs: number[]; knownPoleXs: number[]; periodicAnchorXs: number[]; periodicPoleXs: number[] } {
  const trig = findTrigAffine(tokens, variables);
  const periodicAnchorXs: number[] = [];
  const periodicPoleXs: number[] = [];
  if (trig != null && Math.abs(trig.affine.xCoefficient) > 1e-9) {
    const step = Math.PI / Math.abs(trig.affine.xCoefficient);
    const offset = trig.name === "tan" ? (Math.PI / 2 - trig.affine.constant) / trig.affine.xCoefficient : -trig.affine.constant / trig.affine.xCoefficient;
    const start = Math.ceil((minimumX - offset) / step);
    const end = Math.floor((maximumX - offset) / step);
    for (let index = start; index <= end && periodicAnchorXs.length < 512; index += 1) periodicAnchorXs.push(offset + index * step);
    if (trig.name === "tan") periodicPoleXs.push(...periodicAnchorXs);
  }
  const explicitPoleXs = findSimpleDivisionPoles(tokens, variables).filter((value) => value >= minimumX && value <= maximumX);
  return { explicitPoleXs, periodicAnchorXs, periodicPoleXs, knownPoleXs: uniqueSorted([...explicitPoleXs, ...periodicPoleXs]) };
}

function findSimpleDivisionPoles(tokens: readonly ExpressionToken[], variables: Record<string, number>): number[] {
  const division = tokens.findLastIndex((token) => token.type === "operator" && token.value === "/");
  if (division < 1) return [];
  const denominator = affineExpression(tokens.slice(1, division), variables);
  return denominator == null || Math.abs(denominator.xCoefficient) <= 1e-9 ? [] : [-denominator.constant / denominator.xCoefficient];
}

function uniqueSorted(values: number[]): number[] {
  return values.filter(Number.isFinite).sort((a, b) => a - b).filter((value, index, all) => index === 0 || Math.abs(value - all[index - 1]) > 1e-7);
}

function buildGraphData(
  tokens: readonly ExpressionToken[],
  variables: Record<string, number>,
  domains?: GraphDomains,
  dimensions: GraphDimensions = defaultGraphDimensions,
  options?: BuildGraphOptions,
): GraphData | null {
  const maxEvaluations = options?.maxEvaluations ?? (options?.discontinuityMode === "interactive" ? 20_000 : 10_000);
  if (!Number.isInteger(maxEvaluations) || maxEvaluations < 600) throw new Error("buildGraphData maxEvaluations must be an integer of at least 600");
  const xDomain = domains?.xDomain ?? [-10, 10];
  const evaluate = options?.evaluateAt ?? ((x: number) => evaluateExpression(tokens, x, variables));
  const hints = getDiscontinuityHints(tokens, variables, xDomain[0], xDomain[1]);
  const sampleCount = Math.min(600, maxEvaluations);
  const uniformCount = Math.max(2, sampleCount - hints.knownPoleXs.length);
  const sampleXs = uniqueSorted([
    ...Array.from({ length: uniformCount }, (_, index) => xDomain[0] + (xDomain[1] - xDomain[0]) * index / (uniformCount - 1)),
    ...hints.knownPoleXs,
  ]);
  const points: Point[] = [];
  for (const x of sampleXs) {
    const nearPole = hints.knownPoleXs.some((pole) => Math.abs(x - pole) <= 1e-9);
    const value = nearPole ? Number.NaN : evaluate(x);
    points.push({ x, y: Number.isFinite(value) && Math.abs(value) <= 1e100 ? value : null });
  }
  const finiteValues = points.flatMap((point) => point.y == null ? [] : [point.y]);
  if (finiteValues.length === 0) return null;
  let yDomain = domains?.yDomain;
  if (yDomain == null) {
    const sorted = [...finiteValues].sort((a, b) => a - b);
    const low = percentile(sorted, 0.05);
    const high = percentile(sorted, 0.95);
    const span = high - low || 2;
    yDomain = [low - span * 0.1, high + span * 0.1];
    if (yDomain[0] >= 0) yDomain[0] = -Math.max(span * 0.02, 0.5);
    if (yDomain[1] <= 0) yDomain[1] = Math.max(span * 0.02, 0.5);
  }
  const rawSegments = splitSegments(points);
  const segments = rawSegments.map((segment) => clipSegment(segment, yDomain));
  const scaleX = (x: number) => dimensions.padding + (x - xDomain[0]) / (xDomain[1] - xDomain[0]) * (dimensions.width - 2 * dimensions.padding);
  const scaleY = (y: number) => dimensions.height - dimensions.padding - (y - yDomain[0]) / (yDomain[1] - yDomain[0]) * (dimensions.height - 2 * dimensions.padding);
  const paths = segments.filter((segment) => segment.length > 1).map((segment) => segment.map((point, index) => `${index === 0 ? "M" : "L"} ${scaleX(point.x)} ${scaleY(point.y ?? 0)}`).join(" "));
  const holes = points.flatMap((point, index) => point.y == null && points[index - 1]?.y != null && points[index + 1]?.y != null ? [{ x: point.x, y: ((points[index - 1].y ?? 0) + (points[index + 1].y ?? 0)) / 2 }] : []);
  return { holes, paths, rawSegments, segments, xDomain, yDomain };
}

function percentile(sorted: readonly number[], ratio: number): number {
  const position = (sorted.length - 1) * ratio;
  const lower = Math.floor(position);
  const fraction = position - lower;
  return (sorted[lower] ?? 0) + ((sorted[Math.min(lower + 1, sorted.length - 1)] ?? 0) - (sorted[lower] ?? 0)) * fraction;
}
function splitSegments(points: readonly Point[]): Point[][] {
  const segments: Point[][] = [];
  let current: Point[] = [];
  for (const point of points) {
    if (point.y == null) { if (current.length > 1) segments.push(current); current = []; }
    else current.push(point);
  }
  if (current.length > 1) segments.push(current);
  return segments;
}
function clipSegment(segment: readonly Point[], yDomain: [number, number]): Point[] {
  return segment.map((point) => ({ x: point.x, y: point.y == null ? null : Math.max(yDomain[0], Math.min(yDomain[1], point.y)) }));
}

function initializeBuildGraphData(): void {
  initializeGraphDimensions();
}

export {
  initializeBuildGraphData as a,
  defaultGraphHeight as c,
  getFundamentalPeriod as i,
  defaultGraphWidth as l,
  evaluateExpression as n,
  defaultGraphDimensions as o,
  getDiscontinuityHints as r,
  squareGraphDimensions as s,
  buildGraphData as t,
  initializeGraphDimensions as u,
};
