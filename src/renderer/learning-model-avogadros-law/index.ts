// Avogadro's-law learning model. Release chunk: model-77c142ff4062.js.
import "@rchunk/rolldown-runtime";

interface AvogadroValues { reference_amount_mol?: number | null; reference_volume_l?: number | null; amountFactor?: number | null }
interface AvogadroManifest {
  type: string; version: number; thumbnailAssetKey: string; canonicalFormula: string;
  parameters: {
    reference_amount_mol: { kind: "number"; defaultValue: number; min: number; max: number };
    reference_volume_l: { kind: "number"; defaultValue: number; min: number; max: number };
  };
}

let avogadrosLawManifest: AvogadroManifest;
let amountFactorControl: { defaultValue: number; min: number; max: number; step: number };
let calculateAvogadrosLawState: (values: AvogadroValues) => {
  referenceAmount: number; referenceVolume: number; amountFactor: number; amount: number; volume: number;
  volumePerMole: number; particleCount: number; pistonFillRatio: number;
};
let manifestInitialized = false;
let modelInitialized = false;

function initializeAvogadrosLawManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  avogadrosLawManifest = {
    type: "AVOGADROS_LAW", version: 1, thumbnailAssetKey: "avogadros-law-v1",
    canonicalFormula: "\\frac{V_1}{n_1}=\\frac{V_2}{n_2}",
    parameters: {
      reference_amount_mol: { kind: "number", defaultValue: 1, min: 0.25, max: 5 },
      reference_volume_l: { kind: "number", defaultValue: 22.4, min: 1, max: 120 },
    },
  };
}

function initializeAvogadrosLawModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeAvogadrosLawManifest();
  const parameters = avogadrosLawManifest.parameters;
  amountFactorControl = { defaultValue: 2, min: 0.5, max: 2.5, step: 0.1 };
  const normalizeFinite = (value: number | null | undefined, fallback: number, minimum: number, maximum: number): number =>
    typeof value === "number" && Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, value)) : fallback;
  calculateAvogadrosLawState = values => {
    const referenceAmount = normalizeFinite(
      values.reference_amount_mol, parameters.reference_amount_mol.defaultValue,
      parameters.reference_amount_mol.min, parameters.reference_amount_mol.max,
    );
    const referenceVolume = normalizeFinite(
      values.reference_volume_l, parameters.reference_volume_l.defaultValue,
      parameters.reference_volume_l.min, parameters.reference_volume_l.max,
    );
    const amountFactor = normalizeFinite(values.amountFactor, amountFactorControl.defaultValue, amountFactorControl.min, amountFactorControl.max);
    return {
      referenceAmount, referenceVolume, amountFactor, amount: referenceAmount * amountFactor,
      volume: referenceVolume * amountFactor, volumePerMole: referenceVolume / referenceAmount,
      particleCount: Math.round(12 * amountFactor), pistonFillRatio: amountFactor / amountFactorControl.max,
    };
  };
}

export {
  avogadrosLawManifest as a, initializeAvogadrosLawManifest as i, calculateAvogadrosLawState as n,
  initializeAvogadrosLawModel as r, amountFactorControl as t,
};
