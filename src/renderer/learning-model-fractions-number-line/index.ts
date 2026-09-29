// Fractions-on-a-number-line learning model. Release chunk: model-e01a7cfd8d48.js.
import "@rchunk/rolldown-runtime";

interface FractionValues { numerator?: number | null; denominator?: number | null }
interface NormalizedFractionValues { numerator: number; denominator: number }
interface FractionsManifest {
  type: string; version: number; thumbnailAssetKey: string;
  parameters: {
    numerator: { kind: "integer"; defaultValue: number; min: number; max: number };
    denominator: { kind: "integer"; defaultValue: number; min: number; max: number };
  };
}

let fractionsManifest: FractionsManifest;
let numeratorControl: FractionsManifest["parameters"]["numerator"];
let denominatorControl: FractionsManifest["parameters"]["denominator"];
let normalizeFractionValues: (values: FractionValues) => NormalizedFractionValues;
let calculateFractionPosition: (values: FractionValues) => {
  classification: "zero" | "proper" | "one" | "whole" | "improper"; denominator: number; maxNumerator: number;
  numerator: number; positionRatio: number; remainder: number; value: number; visibleMaxNumerator: number; visibleUnits: number; whole: number;
};
let generateSubdivisionIndices: (denominator: number, visibleUnits: number) => number[];
let generateLabelNumerators: (visibleMaxNumerator: number) => number[];
let manifestInitialized = false;
let modelInitialized = false;

function initializeFractionsManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  fractionsManifest = {
    type: "FRACTIONS_NUMBER_LINE", version: 2, thumbnailAssetKey: "fractions-number-line-v1",
    parameters: {
      numerator: { kind: "integer", defaultValue: 7, min: 0, max: 36 },
      denominator: { kind: "integer", defaultValue: 4, min: 2, max: 12 },
    },
  };
}

function initializeFractionsNumberLineModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeFractionsManifest();
  numeratorControl = fractionsManifest.parameters.numerator;
  denominatorControl = fractionsManifest.parameters.denominator;
  const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
  const normalizeInteger = (value: number | null | undefined, fallback: number, minimum: number, maximum: number): number =>
    clamp(Math.round(typeof value === "number" && Number.isFinite(value) ? value : fallback), minimum, maximum);
  normalizeFractionValues = values => ({
    denominator: normalizeInteger(values.denominator, denominatorControl.defaultValue, denominatorControl.min, denominatorControl.max),
    numerator: normalizeInteger(values.numerator, numeratorControl.defaultValue, numeratorControl.min, numeratorControl.max),
  });
  calculateFractionPosition = values => {
    const { denominator, numerator } = normalizeFractionValues(values);
    const whole = Math.floor(numerator / denominator);
    const remainder = numerator % denominator;
    const visibleUnits = Math.max(1, Math.ceil(numerator / denominator));
    const visibleMaxNumerator = visibleUnits * denominator;
    return {
      classification: numerator === 0 ? "zero" : numerator < denominator ? "proper" : numerator === denominator ? "one" : remainder === 0 ? "whole" : "improper",
      denominator, maxNumerator: numeratorControl.max, numerator, positionRatio: numerator / visibleMaxNumerator, remainder,
      value: numerator / denominator, visibleMaxNumerator, visibleUnits, whole,
    };
  };
  generateSubdivisionIndices = (denominator, visibleUnits) => {
    const normalizedDenominator = normalizeFractionValues({ denominator, numerator: 0 }).denominator;
    const normalizedUnits = Math.max(1, Math.round(visibleUnits));
    return Array.from({ length: normalizedDenominator * normalizedUnits + 1 }, (_unused, index) => index);
  };
  generateLabelNumerators = visibleMaxNumerator => {
    const maximum = Math.max(1, Math.round(visibleMaxNumerator));
    const step = Math.max(1, Math.ceil(maximum / 6));
    const labels = Array.from({ length: Math.floor(maximum / step) + 1 }, (_unused, index) => index * step);
    if (labels.at(-1) !== maximum) labels.push(maximum);
    return labels;
  };
}

export {
  generateLabelNumerators as a, initializeFractionsManifest as c, generateSubdivisionIndices as i, fractionsManifest as l,
  numeratorControl as n, initializeFractionsNumberLineModel as o, calculateFractionPosition as r,
  normalizeFractionValues as s, denominatorControl as t,
};
