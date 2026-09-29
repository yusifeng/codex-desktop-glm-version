// Temperature-tolerance growth-curve learning model for microbial groups.
import "@rchunk/rolldown-runtime";

type MicrobialGroup = "psychrophile" | "mesophile" | "thermophile" | "hyperthermophile";
interface MicrobialToleranceValues { microbial_group?: unknown; temperature_c?: number | null }

const microbialToleranceType = "MICROBIAL_TOLERANCE_CURVE";
const microbialToleranceThumbnail = "microbial-tolerance-curve-v1";
const microbialGroups: MicrobialGroup[] = ["psychrophile", "mesophile", "thermophile", "hyperthermophile"];
const microbialToleranceParameters = {
  microbial_group: { kind: "enum", defaultValue: "mesophile" as MicrobialGroup, allowedValues: microbialGroups },
  temperature_c: { kind: "number", defaultValue: 37, min: -10, max: 110 },
};
const microbialToleranceDefinition = { type: microbialToleranceType, version: 2, thumbnailAssetKey: microbialToleranceThumbnail, parameters: microbialToleranceParameters };
const cardinalTemperatures: Record<MicrobialGroup, { minimum: number; optimum: number; maximum: number }> = {
  psychrophile: { minimum: -5, optimum: 10, maximum: 20 }, mesophile: { minimum: 15, optimum: 35, maximum: 45 }, thermophile: { minimum: 45, optimum: 65, maximum: 80 }, hyperthermophile: { minimum: 65, optimum: 90, maximum: 105 },
};
const temperatureControl = microbialToleranceDefinition.parameters.temperature_c;
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const isMicrobialGroup = (value: unknown): value is MicrobialGroup => typeof value === "string" && microbialGroups.some((group) => group === value);
const normalizeMicrobialToleranceValues = (values: MicrobialToleranceValues) => {
  const defaultGroup = microbialToleranceDefinition.parameters.microbial_group.defaultValue;
  return {
    microbial_group: isMicrobialGroup(values.microbial_group) ? values.microbial_group : isMicrobialGroup(defaultGroup) ? defaultGroup : microbialGroups[0],
    temperature_c: Number.isFinite(values.temperature_c) ? clamp(values.temperature_c ?? temperatureControl.defaultValue, temperatureControl.min, temperatureControl.max) : temperatureControl.defaultValue,
  };
};
const relativeGrowthAt = (group: MicrobialGroup, temperature: number): number => {
  const { minimum, optimum, maximum } = cardinalTemperatures[group];
  if (temperature < minimum || temperature > maximum) return 0;
  const baseline = 0.02;
  if (temperature <= optimum) {
    const progress = (temperature - minimum) / (optimum - minimum);
    return baseline + 0.98 * Math.sin(Math.PI / 2 * progress) ** 1.15;
  }
  const progress = (temperature - optimum) / (maximum - optimum);
  return baseline + 0.98 * Math.cos(Math.PI / 2 * progress) ** 1.2;
};
const buildToleranceCurve = (group: MicrobialGroup, segments = 96) => {
  const { minimum, maximum } = cardinalTemperatures[group];
  return Array.from({ length: segments + 1 }, (_unused, index) => {
    const temperature = minimum + (maximum - minimum) * index / segments;
    return { x: temperature, y: relativeGrowthAt(group, temperature) };
  });
};

function deriveMicrobialToleranceState(values: MicrobialToleranceValues) {
  const normalized = normalizeMicrobialToleranceValues(values);
  const cardinal = cardinalTemperatures[normalized.microbial_group];
  const growthByGroup: Record<MicrobialGroup, number> = {
    psychrophile: relativeGrowthAt("psychrophile", normalized.temperature_c), mesophile: relativeGrowthAt("mesophile", normalized.temperature_c), thermophile: relativeGrowthAt("thermophile", normalized.temperature_c), hyperthermophile: relativeGrowthAt("hyperthermophile", normalized.temperature_c),
  };
  const bestAdaptedGroup = microbialGroups.reduce<MicrobialGroup | undefined>((best, group) => growthByGroup[group] > (best ? growthByGroup[best] : 0) ? group : best, undefined);
  const temperature = normalized.temperature_c;
  const position = temperature < cardinal.minimum ? "below-minimum" : temperature === cardinal.minimum ? "minimum" : temperature > cardinal.maximum ? "above-maximum" : temperature === cardinal.maximum ? "maximum" : Math.abs(temperature - cardinal.optimum) < 0.5 ? "optimum" : temperature < cardinal.optimum ? "rising" : "falling";
  return { ...normalized, cardinal, position, relativeGrowth: growthByGroup[normalized.microbial_group], growthByGroup, bestAdaptedGroup };
}

function initializeMicrobialToleranceSchema(): void {}
function initializeMicrobialToleranceModel(): void {}

export {
  buildToleranceCurve as a,
  initializeMicrobialToleranceSchema as c,
  deriveMicrobialToleranceState as i,
  microbialToleranceDefinition as l,
  microbialGroups as n,
  initializeMicrobialToleranceModel as o,
  temperatureControl as r,
  normalizeMicrobialToleranceValues as s,
  cardinalTemperatures as t,
};
