// Nernst-equation learning model. Release chunk: model-83dea67c5a42.js.
import "@rchunk/rolldown-runtime";

interface NernstValues { standard_cell_potential_v?: number | null; transferred_electrons?: number | null; log10_q?: number | null }
interface NernstManifest {
  type: string; version: number; thumbnailAssetKey: string; canonicalFormula: string;
  parameters: {
    standard_cell_potential_v: { kind: "number"; defaultValue: number; min: number; max: number };
    transferred_electrons: { kind: "integer"; defaultValue: number; min: number; max: number };
  };
}

let nernstManifest: NernstManifest;
let standardPotentialControl: NernstManifest["parameters"]["standard_cell_potential_v"] & { step: number };
let transferredElectronsControl: NernstManifest["parameters"]["transferred_electrons"] & { step: number };
let reactionQuotientLogControl: { defaultValue: number; min: number; max: number; step: number };
let chartBounds: { xMin: number; xMax: number; yMin: number; yMax: number };
let calculateNernstState: (values: NernstValues) => {
  standard_cell_potential_v: number; transferred_electrons: number; log10_q: number; voltsPerDecade: number;
  cellPotentialV: number; log10K: number; region: "reactant-rich" | "product-rich" | "standard";
  atEquilibrium: boolean; beyondEquilibrium: boolean;
};
let manifestInitialized = false;
let modelInitialized = false;

function initializeNernstManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  nernstManifest = {
    type: "NERNST_EQUATION", version: 1, thumbnailAssetKey: "nernst-equation-v1",
    canonicalFormula: "E_{\\mathrm{cell}}=E^\\circ_{\\mathrm{cell}}-\\frac{0.0592\\,\\mathrm{V}}{n}\\log_{10}Q",
    parameters: {
      standard_cell_potential_v: { kind: "number", defaultValue: 1.1, min: 0.1, max: 1.3 },
      transferred_electrons: { kind: "integer", defaultValue: 2, min: 1, max: 4 },
    },
  };
}

function initializeNernstEquationModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeNernstManifest();
  standardPotentialControl = { ...nernstManifest.parameters.standard_cell_potential_v, step: 0.01 };
  transferredElectronsControl = { ...nernstManifest.parameters.transferred_electrons, step: 1 };
  reactionQuotientLogControl = { defaultValue: 0, min: -6, max: 88, step: 0.1 };
  const nernstVolts = 0.0592;
  chartBounds = { xMin: reactionQuotientLogControl.min, xMax: reactionQuotientLogControl.max, yMin: -5.3, yMax: 1.8 };
  const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
  const finiteOr = (value: number | null | undefined, fallback: number): number =>
    typeof value === "number" && Number.isFinite(value) ? value : fallback;
  calculateNernstState = values => {
    const standardPotential = clamp(finiteOr(values.standard_cell_potential_v, standardPotentialControl.defaultValue), standardPotentialControl.min, standardPotentialControl.max);
    const transferredElectrons = clamp(
      Math.round(finiteOr(values.transferred_electrons, transferredElectronsControl.defaultValue)),
      transferredElectronsControl.min, transferredElectronsControl.max,
    );
    const log10Q = clamp(finiteOr(values.log10_q, reactionQuotientLogControl.defaultValue), reactionQuotientLogControl.min, reactionQuotientLogControl.max);
    const voltsPerDecade = nernstVolts / transferredElectrons;
    const rawPotential = standardPotential - voltsPerDecade * log10Q;
    const log10K = standardPotential / voltsPerDecade;
    const atEquilibrium = Math.abs(log10Q - log10K) <= 0.051;
    return {
      standard_cell_potential_v: standardPotential, transferred_electrons: transferredElectrons, log10_q: log10Q,
      voltsPerDecade, cellPotentialV: atEquilibrium ? 0 : rawPotential, log10K,
      region: log10Q < 0 ? "reactant-rich" : log10Q > 0 ? "product-rich" : "standard",
      atEquilibrium, beyondEquilibrium: !atEquilibrium && rawPotential < 0,
    };
  };
}

export {
  calculateNernstState as a, nernstManifest as c, transferredElectronsControl as i, chartBounds as n,
  initializeNernstEquationModel as o, standardPotentialControl as r, initializeNernstManifest as s, reactionQuotientLogControl as t,
};
