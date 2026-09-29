// Finite partial sums and convergence behavior for a geometric series.
import "@rchunk/rolldown-runtime";
import "@rchunk/adaptive-slider-field";

interface GeometricValues { a?: number | null; r?: number | null }
interface NumberParameter { defaultValue: number; min: number; max: number }
const geometricType = "GEOMETRIC_SERIES"; const geometricThumbnail = "geometric-series-v1"; const geometricFormula = "\\sum_{k=0}^{\\infty} ar^k = \\frac{a}{1-r},\\quad |r|<1";
const geometricParameters = { r: { kind: "number", defaultValue: 0.5, min: -10, max: 10 } }; const geometricDefinition = { type: geometricType, version: 1, thumbnailAssetKey: geometricThumbnail, canonicalFormula: geometricFormula, parameters: geometricParameters };
const initialTermParameter = { defaultValue: 1, min: -1000, max: 1000 }; const ratioParameter = geometricDefinition.parameters.r; const equalityTolerance = 1e-10;
const normalizeParameter = (value: number | null | undefined, parameter: NumberParameter): number => Number.isFinite(value) ? Math.min(parameter.max, Math.max(parameter.min, value as number)) : parameter.defaultValue;
const approximatelyEqual = (first: number, second: number): boolean => Math.abs(first - second) <= equalityTolerance;
const normalizeGeometricValues = (values: GeometricValues) => ({ a: normalizeParameter(values.a, initialTermParameter), r: normalizeParameter(values.r, ratioParameter) });
const geometricStatus = ({ a, r }: ReturnType<typeof normalizeGeometricValues>) => approximatelyEqual(a, 0) ? "zero" : Math.abs(r) < 1 ? "convergent" : approximatelyEqual(r, 1) ? "linear-divergence" : approximatelyEqual(r, -1) ? "two-cycle" : r < -1 ? "alternating-divergence" : "unbounded";
const deriveGeometricSeries = (values: GeometricValues, termCount = 12) => { const safe = normalizeGeometricValues(values); const count = Math.max(1, Math.round(termCount)); const terms: number[] = []; const partialSums = [0]; let term = safe.a; let sum = 0; for (let index = 0; index < count; index += 1) { terms.push(term); sum += term; partialSums.push(sum); term *= safe.r; } const status = geometricStatus(safe); return { values: safe, terms, partialSums, status, limit: status === "zero" ? 0 : status === "convergent" ? safe.a / (1 - safe.r) : null }; };
function initializeGeometricSchema(): void {}
function initializeGeometricModel(): void {}
export { geometricDefinition as a, initializeGeometricSchema as i, deriveGeometricSeries as n, initializeGeometricModel as r, initialTermParameter as t };
