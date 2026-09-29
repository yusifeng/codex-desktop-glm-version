// Exponential and logarithmic inverse-points learning model.
import "@rchunk/rolldown-runtime";
import "@rchunk/adaptive-slider-field";

interface LogarithmValues { base?: number | null; input?: number | null }
interface NumberParameter { defaultValue: number; min: number; max: number }
const logarithmType = "LOGARITHM_INVERSE_EXPONENTIAL"; const logarithmThumbnail = "logarithm-inverse-exponential-v1"; const logarithmFormula = "b^x = y \\Longleftrightarrow \\log_b(y) = x";
const logarithmParameters = { base: { kind: "number", defaultValue: 2, min: 1.2, max: 4 }, input: { kind: "number", defaultValue: 1.2, min: -1.5, max: 1.5 } };
const logarithmDefinition = { type: logarithmType, version: 1, thumbnailAssetKey: logarithmThumbnail, canonicalFormula: logarithmFormula, parameters: logarithmParameters };
const baseParameter = logarithmDefinition.parameters.base; const inputParameter = logarithmDefinition.parameters.input; const baseControl = { baseMin: 1.2, baseMax: 4, step: 0.1 }; const inputControl = { baseMin: -1.5, baseMax: 1.5, step: 0.1 }; const defaultLogarithmValues = { base: baseParameter.defaultValue, input: inputParameter.defaultValue }; const logarithmViewport = { xMin: -3, xMax: 9, yMin: -3, yMax: 9 };
const normalizeParameter = (value: number | null | undefined, parameter: NumberParameter): number => Number.isFinite(value) ? Math.min(parameter.max, Math.max(parameter.min, value as number)) : parameter.defaultValue;
const normalizeLogarithmValues = (values: LogarithmValues) => ({ base: normalizeParameter(values.base, baseParameter), input: normalizeParameter(values.input, inputParameter) });
const deriveLogarithmInverseState = (values: LogarithmValues) => { const safe = normalizeLogarithmValues(values); const output = safe.base ** safe.input; return { ...safe, output, exponentialPoint: { x: safe.input, y: output }, logarithmPoint: { x: output, y: safe.input } }; };
const formatLogarithmNumber = (value: number): string => value.toFixed(2).replace(/\.?0+$/, "");
function initializeLogarithmSchema(): void {}
function initializeLogarithmModel(): void {}
export { inputParameter as a, formatLogarithmNumber as c, initializeLogarithmSchema as d, logarithmDefinition as f, logarithmViewport as i, initializeLogarithmModel as l, baseControl as n, inputControl as o, defaultLogarithmValues as r, deriveLogarithmInverseState as s, baseParameter as t, normalizeLogarithmValues as u };
