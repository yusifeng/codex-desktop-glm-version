// Simpson's-rule teaching model. Release chunk: model-c91680043005.js.
import "@rchunk/rolldown-runtime";
import { a as initializeBuildGraphData, n as evaluateExpression } from "@rchunk/build-graph-data";
import { n as initializeTokenizer, r as parseMath, t as collectVariables } from "@rchunk/tokenize-math-block";
import { n as initializeNullThrows, t as nullThrows } from "@rchunk/null-throws";
import { n as parseNumericalIntegral, t as initializeNumericalIntegration } from "@rchunk/numerical-integration";

interface SimpsonInput { integrand: string; lowerBound: number; subintervalCount: number; upperBound: number }
type ParsedExpression = ReturnType<typeof parseMath>;
const defaultInterval = [0, 5] as const;
const defaultInput: SimpsonInput = { integrand: "x", lowerBound: 0, subintervalCount: 8, upperBound: 5 };
const subintervalControl = { min: 2, max: 8, step: 1 };
const defaultExpression = nullThrows(parseMath("y=x"));
const integrationSteps = 2_000;
const numberPattern = "-?(?:\\d+(?:\\.\\d*)?|\\.\\d+)";
const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);
const finiteOr = (value: number | undefined, fallback: number): number => Number.isFinite(value) ? Number(value) : fallback;
const normalizeMath = (value: string): string => value.toLowerCase().replace(/\\left|\\right/g, "").replace(/[−–—]/g, "-").replace(/\s+/g, "");
const validExpression = (value: string): ParsedExpression | null => { const parsed = parseMath(`y=${value}`); const hasFunction = Array.isArray(parsed) && parsed.some((token: unknown) => typeof token === "object" && token !== null && "type" in token && token.type === "function"); return !parsed || hasFunction || collectVariables(parsed).length > 0 ? null : parsed; };
const safeIntegrand = (value: string): string => { const parsed = parseNumericalIntegral(value); return parsed.hasUnsupportedLetter || !parsed.integrand || !validExpression(parsed.integrand) ? "x" : parsed.integrand; };
const parseNumber = (value: string | undefined): number | null => { if (value == null) return null; const parsed = Number.parseFloat(value); return Number.isFinite(parsed) ? parsed : null; };
const parseIntegral = (source: string): Omit<SimpsonInput, "subintervalCount"> => {
  const compact = normalizeMath(source).replace(/\\,/g, "");
  const forward = compact.match(RegExp(`\\\\int_(?:\\{(?<lowerBraced>${numberPattern})\\}|(?<lowerPlain>${numberPattern}))\\^(?:\\{(?<upperBraced>${numberPattern})\\}|(?<upperPlain>${numberPattern}))(?<integrand>.+?)dx`));
  if (forward?.groups?.integrand) return { integrand: forward.groups.integrand, lowerBound: parseNumber(forward.groups.lowerBraced ?? forward.groups.lowerPlain) ?? 0, upperBound: parseNumber(forward.groups.upperBraced ?? forward.groups.upperPlain) ?? 5 };
  const reverse = compact.match(RegExp(`\\\\int\\^(?:\\{(?<upperBraced>${numberPattern})\\}|(?<upperPlain>${numberPattern}))_(?:\\{(?<lowerBraced>${numberPattern})\\}|(?<lowerPlain>${numberPattern}))(?<integrand>.+?)dx`));
  if (reverse?.groups?.integrand) return { integrand: reverse.groups.integrand, lowerBound: parseNumber(reverse.groups.lowerBraced ?? reverse.groups.lowerPlain) ?? 0, upperBound: parseNumber(reverse.groups.upperBraced ?? reverse.groups.upperPlain) ?? 5 };
  return { integrand: source.match(/^\s*f\s*\(\s*x\s*\)\s*=\s*(.+?)\s*$/i)?.[1] ?? source, lowerBound: 0, upperBound: 5 };
};
const isIntegralNotation = (source: string): boolean => { const compact = normalizeMath(source).replace(/\\,/g, ""); const bound = `(?:\\{${numberPattern}\\}|${numberPattern})`; return RegExp(`^\\\\int(?:_${bound}\\^${bound}|\\^${bound}_${bound}).+?dx$`).test(compact); };
const normalizeSubintervalCount = (value: number | undefined): number => clamp(Math.round(clamp(Math.round(Number.isFinite(value) ? value ?? 8 : 0) || 8, 2, 8) / 2) * 2, 2, 8);
const subintervalsFromText = (source: string): number => Number.parseInt(source.match(/\bn\s*=\s*(\d+)/i)?.[1] ?? source.match(/(?:with|using)\s+(\d+)\s+subintervals?/i)?.[1] ?? "8", 10);
const normalizeInput = (input: Partial<SimpsonInput>): SimpsonInput => { const lowerBound = finiteOr(input.lowerBound, 0); const upperBound = finiteOr(input.upperBound, 5); return { integrand: safeIntegrand(input.integrand ?? "x"), lowerBound, subintervalCount: normalizeSubintervalCount(input.subintervalCount), upperBound: upperBound === lowerBound ? 5 : upperBound }; };
const parseInput = (source: string): SimpsonInput => normalizeInput({ ...parseIntegral(source), subintervalCount: subintervalsFromText(source) });
const bounds = (input: Partial<SimpsonInput>): [number, number] => [finiteOr(input.lowerBound, 0), finiteOr(input.upperBound, 5)];
const domain = (input: Partial<SimpsonInput>): [number, number] => { const [a, b] = bounds(input); const low = Math.min(a, b); const high = Math.max(a, b); const span = Math.max(high - low, 1); const padding = Math.max(span * 0.15, 0.75); return [low - padding, high + padding]; };
const expression = (input: Partial<SimpsonInput>): ParsedExpression => validExpression(normalizeInput(input).integrand) ?? defaultExpression;
const evaluate = (input: Partial<SimpsonInput>, x: number): number => evaluateExpression(expression(input), x, {});
const formatNumber = (value: number, precision = 3): string => { if (!Number.isFinite(value)) return "0"; const rounded = Number(value.toFixed(precision)); return Object.is(rounded, -0) ? "0" : rounded.toString(); };
const integrandLabel = (input: Partial<SimpsonInput>): string => normalizeInput(input).integrand;
const integralLabel = (input: Partial<SimpsonInput>): string => { const safe = normalizeInput(input); const shown = safe.integrand.replace(/pi/g, (_match, offset: number, whole: string) => /[a-z]/.test(whole[offset + 2] ?? "") ? "\\pi " : "\\pi").replace(/\*/g, "\\cdot " ); return `\\int_{${formatNumber(safe.lowerBound, 4)}}^{${formatNumber(safe.upperBound, 4)}} ${shown} \\, dx`; };
const simpsonsEstimate = (input: Partial<SimpsonInput>): number => { const safe = normalizeInput(input); const [a, b] = bounds(safe); const h = (b - a) / safe.subintervalCount; let weighted = evaluate(safe, a) + evaluate(safe, b); for (let index = 1; index < safe.subintervalCount; index += 1) weighted += (index % 2 === 0 ? 2 : 4) * evaluate(safe, a + index * h); return h / 3 * weighted; };
const exactValue = (input: Partial<SimpsonInput>): number => { const safe = normalizeInput(input); const [a, b] = bounds(safe); const h = (b - a) / integrationSteps; let weighted = evaluateExpression(expression(safe), a, {}) + evaluateExpression(expression(safe), b, {}); if (!Number.isFinite(weighted)) return Number.NaN; for (let index = 1; index < integrationSteps; index += 1) { const value = evaluateExpression(expression(safe), a + index * h, {}); if (!Number.isFinite(value)) return Number.NaN; weighted += (index % 2 === 0 ? 2 : 4) * value; } return h / 3 * weighted; };
const result = (input: Partial<SimpsonInput>) => { const safe = normalizeInput(input); const estimate = simpsonsEstimate(safe); const exact = exactValue(safe); return { estimate, exactValue: exact, error: estimate - exact }; };
function initializeSimpsonsRuleModel(): void { initializeTokenizer(); initializeBuildGraphData(); initializeNumericalIntegration(); initializeNullThrows(); }
export { formatNumber as a, domain as c, initializeSimpsonsRuleModel as d, isIntegralNotation as f, evaluate as i, integrandLabel as l, parseInput as n, integralLabel as o, normalizeInput as p, result as r, bounds as s, subintervalControl as t, expression as u };
