// Straight-line depreciation learning model. Release chunk: model-a3291de53919.js.
import "@rchunk/rolldown-runtime";

interface DepreciationValues { costUsd?: number | null; salvageFraction?: number | null; usefulLifeYears?: number | null; ageFraction?: number | null }
interface NormalizedDepreciationValues { costUsd: number; salvageFraction: number; usefulLifeYears: number; ageFraction: number }
interface DepreciationManifest {
  type: string; version: number; thumbnailAssetKey: string; canonicalFormula: string;
  parameters: {
    costUsd: { kind: "number"; defaultValue: number; min: number; max: number };
    salvageFraction: { kind: "number"; defaultValue: number; min: number; max: number };
    usefulLifeYears: { kind: "integer"; defaultValue: number; min: number; max: number };
    ageFraction: { kind: "number"; defaultValue: number; min: number; max: number };
  };
}

let depreciationManifest: DepreciationManifest;
let defaultDepreciationValues: NormalizedDepreciationValues;
let normalizeDepreciationValues: (values: DepreciationValues) => NormalizedDepreciationValues;
let calculateStraightLineDepreciation: (values: DepreciationValues) => NormalizedDepreciationValues & {
  salvageValue: number; depreciableAmount: number; annualDepreciationExpense: number; selectedYear: number;
  accumulatedDepreciation: number; bookValue: number; yearlyBookValues: { year: number; bookValue: number }[];
};
let manifestInitialized = false;
let modelInitialized = false;

function initializeDepreciationManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  depreciationManifest = {
    type: "STRAIGHT_LINE_DEPRECIATION", version: 2, thumbnailAssetKey: "straight-line-depreciation-v1",
    canonicalFormula: "D = \\frac{C-S}{L}",
    parameters: {
      costUsd: { kind: "number", defaultValue: 60_000, min: 20_000, max: 100_000 },
      salvageFraction: { kind: "number", defaultValue: 0.1, min: 0, max: 0.5 },
      usefulLifeYears: { kind: "integer", defaultValue: 5, min: 3, max: 10 },
      ageFraction: { kind: "number", defaultValue: 0.4, min: 0, max: 1 },
    },
  };
}

function initializeStraightLineDepreciationModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeDepreciationManifest();
  const parameters = depreciationManifest.parameters;
  defaultDepreciationValues = {
    costUsd: parameters.costUsd.defaultValue, salvageFraction: parameters.salvageFraction.defaultValue,
    usefulLifeYears: parameters.usefulLifeYears.defaultValue, ageFraction: parameters.ageFraction.defaultValue,
  };
  const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
  const normalizeFinite = (value: number | null | undefined, fallback: number, minimum: number, maximum: number): number =>
    clamp(typeof value === "number" && Number.isFinite(value) ? value : fallback, minimum, maximum);
  normalizeDepreciationValues = values => ({
    costUsd: normalizeFinite(values.costUsd, parameters.costUsd.defaultValue, parameters.costUsd.min, parameters.costUsd.max),
    salvageFraction: normalizeFinite(values.salvageFraction, parameters.salvageFraction.defaultValue, parameters.salvageFraction.min, parameters.salvageFraction.max),
    usefulLifeYears: Math.round(normalizeFinite(values.usefulLifeYears, parameters.usefulLifeYears.defaultValue, parameters.usefulLifeYears.min, parameters.usefulLifeYears.max)),
    ageFraction: normalizeFinite(values.ageFraction, parameters.ageFraction.defaultValue, parameters.ageFraction.min, parameters.ageFraction.max),
  });
  calculateStraightLineDepreciation = values => {
    const normalized = normalizeDepreciationValues(values);
    const salvageValue = normalized.costUsd * normalized.salvageFraction;
    const depreciableAmount = normalized.costUsd - salvageValue;
    const annualDepreciationExpense = depreciableAmount / normalized.usefulLifeYears;
    const selectedYear = clamp(Math.round(normalized.ageFraction * normalized.usefulLifeYears), 0, normalized.usefulLifeYears);
    const bookValueAt = (year: number): number => year === normalized.usefulLifeYears
      ? salvageValue
      : Math.max(salvageValue, normalized.costUsd - year * annualDepreciationExpense);
    return {
      ...normalized, salvageValue, depreciableAmount, annualDepreciationExpense, selectedYear,
      accumulatedDepreciation: selectedYear * annualDepreciationExpense, bookValue: bookValueAt(selectedYear),
      yearlyBookValues: Array.from({ length: normalized.usefulLifeYears + 1 }, (_unused, year) => ({ year, bookValue: bookValueAt(year) })),
    };
  };
}

export {
  initializeDepreciationManifest as a, normalizeDepreciationValues as i, calculateStraightLineDepreciation as n,
  depreciationManifest as o, initializeStraightLineDepreciationModel as r, defaultDepreciationValues as t,
};
