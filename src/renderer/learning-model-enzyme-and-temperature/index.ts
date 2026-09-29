// Enzyme-and-temperature learning model: collision gains followed by denaturation.
import "@rchunk/rolldown-runtime";

interface EnzymeTemperatureValues { temperatureCelsius?: number | null }

const enzymeTemperatureType = "ENZYME_AND_TEMPERATURE";
const enzymeTemperatureThumbnail = "enzyme-and-temperature-v1";
const enzymeTemperatureParameters = { temperatureCelsius: { kind: "number", defaultValue: 25, min: 0, max: 70 } };
const enzymeTemperatureDefinition = { type: enzymeTemperatureType, version: 1, thumbnailAssetKey: enzymeTemperatureThumbnail, parameters: enzymeTemperatureParameters };
const temperatureParameter = enzymeTemperatureDefinition.parameters.temperatureCelsius;
const enzymeTemperatureControl = { min: temperatureParameter.min, max: temperatureParameter.max, step: 1, defaultValue: temperatureParameter.defaultValue, optimum: 40 };
const collisionRate = 0.045;
const minimumMolecularSpeed = 0.45;
const molecularSpeedExponent = 1.25;
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const normalizeTemperature = (value: number | null | undefined): number => {
  const temperature = Number.isFinite(value) ? value ?? enzymeTemperatureControl.defaultValue : enzymeTemperatureControl.defaultValue;
  return clamp(temperature, enzymeTemperatureControl.min, enzymeTemperatureControl.max);
};
const collisionFactor = (temperature: number): number => Math.exp(collisionRate * (temperature - enzymeTemperatureControl.optimum));
const activeEnzymeFraction = (temperature: number): number => temperature <= enzymeTemperatureControl.optimum
  ? 1
  : Math.exp(-0.018 * (temperature - enzymeTemperatureControl.optimum) ** 2);
const relativeEnzymeActivity = (temperature: number): number => clamp(
  temperature <= enzymeTemperatureControl.optimum ? collisionFactor(temperature) : activeEnzymeFraction(temperature),
  0,
  1,
);
const molecularSpeed = (temperature: number): number => {
  const normalized = (normalizeTemperature(temperature) - enzymeTemperatureControl.min) / (enzymeTemperatureControl.max - enzymeTemperatureControl.min);
  return minimumMolecularSpeed + 1.7500000000000002 * normalized ** molecularSpeedExponent;
};
const classifyEnzymeState = (temperature: number, denaturedFraction: number): "cold" | "warming" | "optimal" | "denaturing" | "denatured" =>
  temperature < 18 ? "cold" : temperature < 37 ? "warming" : temperature <= 43 ? "optimal" : denaturedFraction < 0.8 ? "denaturing" : "denatured";

function deriveEnzymeTemperatureState(values: EnzymeTemperatureValues) {
  const temperatureCelsius = normalizeTemperature(values.temperatureCelsius);
  const collision = collisionFactor(temperatureCelsius);
  const activeFraction = activeEnzymeFraction(temperatureCelsius);
  const denaturedFraction = 1 - activeFraction;
  const relativeActivity = relativeEnzymeActivity(temperatureCelsius);
  return {
    temperatureCelsius,
    relativeActivity,
    activityPercent: Math.round(relativeActivity * 100),
    collisionFactor: collision,
    molecularSpeed: molecularSpeed(temperatureCelsius),
    activeFraction,
    denaturedFraction,
    state: classifyEnzymeState(temperatureCelsius, denaturedFraction),
  };
}

function initializeEnzymeTemperatureSchema(): void {}
function initializeEnzymeTemperatureModel(): void {}

export {
  initializeEnzymeTemperatureSchema as a,
  initializeEnzymeTemperatureModel as i,
  deriveEnzymeTemperatureState as n,
  enzymeTemperatureDefinition as o,
  relativeEnzymeActivity as r,
  enzymeTemperatureControl as t,
};
