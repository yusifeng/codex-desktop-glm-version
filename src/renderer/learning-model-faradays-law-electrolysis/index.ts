// Faraday's law for silver and copper electrodeposition.
import "@rchunk/rolldown-runtime";

type Electrolyte = "silver nitrate" | "copper(II) sulfate";
interface ElectrolysisValues { electrolyte?: string | null; charge_kc?: number | null }

const faradaysLawType = "FARADAYS_LAW_ELECTROLYSIS";
const faradaysLawThumbnail = "faradays-law-electrolysis-v1";
const faradaysLawFormula = "m=\\frac{MQ}{zF},\\quad Q=It";
const faradaysLawParameters = {
  electrolyte: { kind: "enum" as const, defaultValue: "silver nitrate" as Electrolyte, allowedValues: ["silver nitrate", "copper(II) sulfate"] as Electrolyte[] },
};
const faradaysLawSpecification = { type: faradaysLawType, version: 3, thumbnailAssetKey: faradaysLawThumbnail, canonicalFormula: faradaysLawFormula, parameters: faradaysLawParameters };
const chargeControl = { defaultValue: 100, min: 0, max: 200, step: 1 };
const electrolyteParameter = faradaysLawSpecification.parameters.electrolyte;
const electrolytes = electrolyteParameter.allowedValues;
const faradayConstant = 96_485;
const silverMolarMass = 107.87;
const copperMolarMass = 63.55;
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
const electrolyteIndex = (electrolyte: Electrolyte): number => Math.max(0, electrolytes.indexOf(electrolyte));
const electrolyteForIndex = (index: number): Electrolyte => electrolytes[clamp(Math.round(index), 0, electrolytes.length - 1)] ?? electrolyteParameter.defaultValue;
const isElectrolyte = (value: unknown): value is Electrolyte => electrolytes.some((electrolyte) => electrolyte === value);
const normalizeElectrolysisValues = (values: ElectrolysisValues) => ({
  electrolyte: isElectrolyte(values.electrolyte) ? values.electrolyte : electrolyteParameter.defaultValue,
  charge_kc: Number.isFinite(values.charge_kc) ? clamp(values.charge_kc ?? chargeControl.defaultValue, 0, chargeControl.max) : chargeControl.defaultValue,
});
const calculateElectrolysis = (values: ElectrolysisValues) => {
  const normalized = normalizeElectrolysisValues(values);
  const chargeC = normalized.charge_kc * 1_000;
  const electronMoles = chargeC / faradayConstant;
  const silverMassG = electronMoles * silverMolarMass;
  const copperMassG = electronMoles * copperMolarMass / 2;
  const silverEquivalentMassGPerMolElectron = silverMolarMass;
  const copperEquivalentMassGPerMolElectron = copperMolarMass / 2;
  const silverSlopeGPerKc = silverEquivalentMassGPerMolElectron * 1_000 / faradayConstant;
  const copperSlopeGPerKc = copperEquivalentMassGPerMolElectron * 1_000 / faradayConstant;
  const silverSelected = normalized.electrolyte === "silver nitrate";
  return { ...normalized, chargeC, electronMoles, silverMassG, copperMassG, silverEquivalentMassGPerMolElectron, copperEquivalentMassGPerMolElectron, silverSlopeGPerKc, copperSlopeGPerKc, selectedMassG: silverSelected ? silverMassG : copperMassG, selectedElectronCount: silverSelected ? 1 : 2, selectedMetalMoles: silverSelected ? electronMoles : electronMoles / 2 };
};

function initializeFaradaysLawSpecification(): void {}
function initializeFaradaysLawModel(): void {}

export { initializeFaradaysLawModel as a, electrolyteIndex as i, calculateElectrolysis as n, initializeFaradaysLawSpecification as o, electrolyteForIndex as r, faradaysLawSpecification as s, chargeControl as t };
