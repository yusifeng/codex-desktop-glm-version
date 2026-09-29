// Buffer-pH learning model comparing a buffer with unbuffered water.
import "@rchunk/rolldown-runtime";

interface BufferDoseValues { netStrongAcidMinusBaseMoles?: number | null }

const bufferPhType = "BUFFER_PH_STRONG_ACID_BASE";
const bufferPhThumbnail = "buffer-ph-strong-acid-base-v2";
const bufferPhParameters = { netStrongAcidMinusBaseMoles: { kind: "number", defaultValue: 0, min: -0.02, max: 0.02, multipleOf: 0.005 } };
const bufferPhDefinition = { type: bufferPhType, version: 2, thumbnailAssetKey: bufferPhThumbnail, parameters: bufferPhParameters };
const initialAcidMoles = 0.05;
const initialBaseMoles = 0.05;
const bufferPka = 4.76;
const particleMoles = 0.005;
const doseControl = { variable: "Strong acid − base dose", unit: "mol", min: bufferPhDefinition.parameters.netStrongAcidMinusBaseMoles.min, max: bufferPhDefinition.parameters.netStrongAcidMinusBaseMoles.max, step: bufferPhDefinition.parameters.netStrongAcidMinusBaseMoles.multipleOf, defaultValue: bufferPhDefinition.parameters.netStrongAcidMinusBaseMoles.defaultValue };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const quantizeDose = (value: number | null | undefined, parameter: { defaultValue: number; min: number; max: number; multipleOf: number }): number => {
  const dose = typeof value === "number" && Number.isFinite(value) ? value : parameter.defaultValue;
  const clamped = clamp(dose, parameter.min, parameter.max);
  const quantized = Number((Math.round(clamped / parameter.multipleOf) * parameter.multipleOf).toFixed(6));
  return Object.is(quantized, -0) ? 0 : quantized;
};
const normalizeBufferDose = (values: BufferDoseValues) => ({ netStrongAcidMinusBaseMoles: quantizeDose(values.netStrongAcidMinusBaseMoles, bufferPhDefinition.parameters.netStrongAcidMinusBaseMoles) });

function deriveBufferPhState(values: BufferDoseValues) {
  const safeValues = normalizeBufferDose(values);
  const dose = safeValues.netStrongAcidMinusBaseMoles;
  const direction = dose > 0 ? "acid" : dose < 0 ? "base" : "none";
  const doseMagnitudeMoles = Math.abs(dose);
  const bufferHaMoles = initialAcidMoles + dose;
  const bufferAMinusMoles = initialBaseMoles - dose;
  const bufferPh = bufferPka + Math.log10(bufferAMinusMoles / bufferHaMoles);
  const waterPh = direction === "acid" ? -Math.log10(doseMagnitudeMoles) : direction === "base" ? 14 + Math.log10(doseMagnitudeMoles) : 7;
  return {
    safeValues,
    direction,
    doseMagnitudeMoles,
    bufferHaMoles,
    bufferAMinusMoles,
    bufferPh,
    bufferDeltaPh: bufferPh - bufferPka,
    waterPh,
    waterDeltaPh: waterPh - 7,
    bufferHaParticleCount: Math.round(bufferHaMoles / particleMoles),
    bufferAMinusParticleCount: Math.round(bufferAMinusMoles / particleMoles),
    waterDoseParticleCount: Math.round(doseMagnitudeMoles / particleMoles),
  };
}

function initializeBufferPhSchema(): void {}
function initializeBufferPhModel(): void {}

export {
  normalizeBufferDose as a,
  initializeBufferPhModel as i,
  doseControl as n,
  initializeBufferPhSchema as o,
  deriveBufferPhState as r,
  bufferPhDefinition as s,
  bufferPka as t,
};
