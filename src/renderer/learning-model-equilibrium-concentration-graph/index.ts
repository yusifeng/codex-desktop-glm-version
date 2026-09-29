// Equilibrium concentration response-to-addition learning model. Release chunk: model-276f1b14e837.js.
import "@rchunk/rolldown-runtime";

interface EquilibriumValues { equilibrium_constant?: number | null; initial_total_concentration?: number | null; addition?: number | null }
interface EquilibriumManifest {
  type: string; version: number; thumbnailAssetKey: string;
  parameters: {
    equilibrium_constant: { kind: "number"; defaultValue: number; min: number; max: number };
    initial_total_concentration: { kind: "number"; defaultValue: number; min: number; max: number };
  };
}

let equilibriumManifest: EquilibriumManifest;
let equilibriumConstantControl: EquilibriumManifest["parameters"]["equilibrium_constant"] & { step: number };
let initialConcentrationControl: EquilibriumManifest["parameters"]["initial_total_concentration"] & { step: number };
let normalizeEquilibriumValues: (values: EquilibriumValues) => { equilibrium_constant: number; initial_total_concentration: number; addition: number };
let calculateEquilibriumConcentrationGraph: (values: EquilibriumValues) => {
  equilibriumConstant: number; initialTotal: number; addedAmount: number; addition: number; initialA: number; initialB: number;
  finalA: number; finalB: number; immediateA: number; immediateB: number;
  reactantCurve: { x: number; y: number }[]; productCurve: { x: number; y: number }[];
};
let manifestInitialized = false;
let modelInitialized = false;

function initializeEquilibriumManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  equilibriumManifest = {
    type: "EQUILIBRIUM_CONCENTRATION_GRAPH", version: 2, thumbnailAssetKey: "equilibrium-concentration-graph-v1",
    parameters: {
      equilibrium_constant: { kind: "number", defaultValue: 2, min: 0.25, max: 4 },
      initial_total_concentration: { kind: "number", defaultValue: 1, min: 0.5, max: 2 },
    },
  };
}

function initializeEquilibriumConcentrationGraphModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeEquilibriumManifest();
  equilibriumConstantControl = { ...equilibriumManifest.parameters.equilibrium_constant, step: 0.25 };
  initialConcentrationControl = { ...equilibriumManifest.parameters.initial_total_concentration, step: 0.1 };
  const normalizeFinite = (value: number | null | undefined, control: { defaultValue: number; min: number; max: number }): number =>
    typeof value === "number" && Number.isFinite(value) ? Math.min(control.max, Math.max(control.min, value)) : control.defaultValue;
  normalizeEquilibriumValues = values => ({
    equilibrium_constant: normalizeFinite(values.equilibrium_constant, equilibriumConstantControl),
    initial_total_concentration: normalizeFinite(values.initial_total_concentration, initialConcentrationControl),
    addition: +(typeof values.addition === "number" && values.addition >= 0.5),
  });
  const easedProgress = (progress: number): number => 1 - (1 - progress) ** 3;
  const transitionCurve = (startX: number, endX: number, startY: number, endY: number, segments: number): { x: number; y: number }[] =>
    Array.from({ length: segments + 1 }, (_unused, index) => {
      const progress = index / segments;
      return { x: startX + (endX - startX) * progress, y: startY + (endY - startY) * easedProgress(progress) };
    });
  calculateEquilibriumConcentrationGraph = values => {
    const normalized = normalizeEquilibriumValues(values);
    const equilibriumConstant = normalized.equilibrium_constant;
    const initialTotal = normalized.initial_total_concentration;
    const addedAmount = initialTotal * 0.5;
    const initialA = initialTotal / (1 + equilibriumConstant);
    const initialB = initialTotal - initialA;
    const finalTotal = initialTotal + addedAmount;
    const finalA = finalTotal / (1 + equilibriumConstant);
    const finalB = finalTotal - finalA;
    const addition = +(normalized.addition === 1);
    const immediateA = initialA + (addition === 0 ? addedAmount : 0);
    const immediateB = initialB + (addition === 1 ? addedAmount : 0);
    return {
      equilibriumConstant, initialTotal, addedAmount, addition, initialA, initialB, finalA, finalB, immediateA, immediateB,
      reactantCurve: [
        ...transitionCurve(0, 32, initialTotal, initialA, 32), { x: 58, y: initialA }, { x: 58, y: immediateA },
        ...transitionCurve(58, 86, immediateA, finalA, 28).slice(1), { x: 110, y: finalA },
      ],
      productCurve: [
        ...transitionCurve(0, 32, 0, initialB, 32), { x: 58, y: initialB }, { x: 58, y: immediateB },
        ...transitionCurve(58, 86, immediateB, finalB, 28).slice(1), { x: 110, y: finalB },
      ],
    };
  };
}

export {
  normalizeEquilibriumValues as a, initializeEquilibriumConcentrationGraphModel as i, initialConcentrationControl as n,
  initializeEquilibriumManifest as o, calculateEquilibriumConcentrationGraph as r, equilibriumManifest as s, equilibriumConstantControl as t,
};
