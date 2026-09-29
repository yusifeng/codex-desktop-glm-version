// Enthalpy-change learning model. Release chunk: model-469e05313030.js.
import "@rchunk/rolldown-runtime";

interface EnthalpyValues { enthalpyChangeKilojoules?: number | null }
interface EnthalpyManifest {
  type: string; version: number; thumbnailAssetKey: string; canonicalFormula: string;
  parameters: { enthalpyChangeKilojoules: { kind: "number"; defaultValue: number; min: number; max: number } };
}

let enthalpyManifest: EnthalpyManifest;
let enthalpyChangeControl: { kind: "number"; defaultValue: number; min: number; max: number; step: number };
let normalizeEnthalpyValues: (values: EnthalpyValues) => { enthalpyChangeKilojoules: number };
let calculateEnthalpyState: (values: EnthalpyValues) => {
  classification: "exothermic" | "endothermic" | "thermoneutral"; enthalpyChangeKilojoules: number;
  heatFlowDirection: "to-surroundings" | "into-reaction-system" | "no-net-heat-flow";
  heatMagnitudeKilojoules: number; productRelativeEnergyKilojoules: number;
  reactantRelativeEnergyKilojoules: number; transitionStateRelativeEnergyKilojoules: number;
};
let manifestInitialized = false;
let modelInitialized = false;

function initializeEnthalpyManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  enthalpyManifest = {
    type: "ENTHALPY", version: 1, thumbnailAssetKey: "enthalpy-v1",
    canonicalFormula: "\\Delta H = H_{\\mathrm{products}} - H_{\\mathrm{reactants}}",
    parameters: { enthalpyChangeKilojoules: { kind: "number", defaultValue: -50, min: -100, max: 100 } },
  };
}

function initializeEnthalpyModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeEnthalpyManifest();
  enthalpyChangeControl = { ...enthalpyManifest.parameters.enthalpyChangeKilojoules, step: 5 };
  const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
  normalizeEnthalpyValues = values => {
    const value = values.enthalpyChangeKilojoules;
    return {
      enthalpyChangeKilojoules: typeof value === "number" && Number.isFinite(value)
        ? clamp(value, enthalpyChangeControl.min, enthalpyChangeControl.max)
        : enthalpyChangeControl.defaultValue,
    };
  };
  calculateEnthalpyState = values => {
    const { enthalpyChangeKilojoules } = normalizeEnthalpyValues(values);
    return {
      classification: enthalpyChangeKilojoules < 0 ? "exothermic" : enthalpyChangeKilojoules > 0 ? "endothermic" : "thermoneutral",
      enthalpyChangeKilojoules,
      heatFlowDirection: enthalpyChangeKilojoules < 0 ? "to-surroundings" : enthalpyChangeKilojoules > 0 ? "into-reaction-system" : "no-net-heat-flow",
      heatMagnitudeKilojoules: Math.abs(enthalpyChangeKilojoules),
      productRelativeEnergyKilojoules: 120 + enthalpyChangeKilojoules,
      reactantRelativeEnergyKilojoules: 120,
      transitionStateRelativeEnergyKilojoules: Math.max(120, 120 + enthalpyChangeKilojoules) + 65,
    };
  };
}

export {
  initializeEnthalpyManifest as a, normalizeEnthalpyValues as i, calculateEnthalpyState as n,
  enthalpyManifest as o, initializeEnthalpyModel as r, enthalpyChangeControl as t,
};
