// Gay-Lussac's law for pressure and absolute temperature at constant volume.
import "@rchunk/rolldown-runtime";

interface NumberParameter { kind: "number"; defaultValue: number; min: number; max: number }
interface GayLussacValues { initial_temperature_k?: number | null; initial_pressure_kpa?: number | null; finalTemperatureK?: number | null }

const gayLussacsLawType = "GAY_LUSSACS_LAW";
const gayLussacsLawThumbnail = "gay-lussacs-law-v1";
const gayLussacsLawFormula = "\\frac{P_1}{T_1}=\\frac{P_2}{T_2}";
const gayLussacsLawParameters: { initial_temperature_k: NumberParameter; initial_pressure_kpa: NumberParameter } = {
  initial_temperature_k: { kind: "number", defaultValue: 300, min: 250, max: 400 },
  initial_pressure_kpa: { kind: "number", defaultValue: 100, min: 50, max: 160 },
};
const gayLussacsLawSpecification = { type: gayLussacsLawType, version: 2, thumbnailAssetKey: gayLussacsLawThumbnail, canonicalFormula: gayLussacsLawFormula, parameters: gayLussacsLawParameters };
const initialTemperatureParameter = gayLussacsLawSpecification.parameters.initial_temperature_k;
const initialPressureParameter = gayLussacsLawSpecification.parameters.initial_pressure_kpa;
const finalTemperatureControl = { defaultValue: 450, min: 150, max: 600, step: 0.1 };
const normalizeNumber = (value: number | null | undefined, defaultValue: number, minimum: number, maximum: number): number =>
  Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, value ?? defaultValue)) : defaultValue;
const normalizeGayLussacValues = (values: GayLussacValues) => ({
  initial_temperature_k: normalizeNumber(values.initial_temperature_k, initialTemperatureParameter.defaultValue, initialTemperatureParameter.min, initialTemperatureParameter.max),
  initial_pressure_kpa: normalizeNumber(values.initial_pressure_kpa, initialPressureParameter.defaultValue, initialPressureParameter.min, initialPressureParameter.max),
  finalTemperatureK: normalizeNumber(values.finalTemperatureK, finalTemperatureControl.defaultValue, finalTemperatureControl.min, finalTemperatureControl.max),
});
const calculateGayLussacsLaw = (values: GayLussacValues) => {
  const normalized = normalizeGayLussacValues(values);
  const pressurePerKelvin = normalized.initial_pressure_kpa / normalized.initial_temperature_k;
  const finalPressureKpa = pressurePerKelvin * normalized.finalTemperatureK;
  const temperatureRatio = normalized.finalTemperatureK / normalized.initial_temperature_k;
  return { ...normalized, pressurePerKelvin, finalPressureKpa, temperatureRatio, direction: temperatureRatio > 1 ? "heating" : temperatureRatio < 1 ? "cooling" : "unchanged" };
};

function initializeGayLussacsLawSpecification(): void {}
function initializeGayLussacsLawModel(): void {}

export { gayLussacsLawSpecification as a, initializeGayLussacsLawSpecification as i, calculateGayLussacsLaw as n, initializeGayLussacsLawModel as r, finalTemperatureControl as t };
