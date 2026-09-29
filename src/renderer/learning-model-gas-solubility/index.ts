// Gas-solubility learning model: compare temperature and partial-pressure effects.
import "@rchunk/rolldown-runtime";

type Gas = "methane" | "oxygen" | "carbon-monoxide" | "nitrogen" | "helium";
interface GasSolubilityValues { focus_gas?: unknown; temperature_c?: number | null; partial_pressure_atm?: number | null }

const gases: Gas[] = ["methane", "oxygen", "carbon-monoxide", "nitrogen", "helium"];
const temperatureControl = { min: 0, max: 30, step: 0.5, defaultValue: 20 };
const partialPressureControl = { min: 0.5, max: 2, step: 0.05, defaultValue: 1 };
const referenceConcentrations: Record<Gas, { at10: number; at30: number }> = {
  methane: { at10: 1.9, at30: 1.3 },
  oxygen: { at10: 1.8, at30: 1.21 },
  "carbon-monoxide": { at10: 1.2, at30: 0.92 },
  nitrogen: { at10: 0.7, at30: 0.6 },
  helium: { at10: 0.4, at30: 0.38 },
};
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const finiteOr = (value: number | null | undefined, fallback: number): number => Number.isFinite(value) ? value ?? fallback : fallback;
const isGas = (value: unknown): value is Gas => typeof value === "string" && gases.some((gas) => gas === value);

const normalizeGasSolubilityValues = (values: GasSolubilityValues) => ({
  focus_gas: isGas(values.focus_gas) ? values.focus_gas : "oxygen" as Gas,
  temperature_c: clamp(finiteOr(values.temperature_c, temperatureControl.defaultValue), temperatureControl.min, temperatureControl.max),
  partial_pressure_atm: clamp(finiteOr(values.partial_pressure_atm, partialPressureControl.defaultValue), partialPressureControl.min, partialPressureControl.max),
});

function calculateGasConcentration(gas: Gas, temperatureCelsius: number, partialPressureAtmospheres: number): number {
  const reference = referenceConcentrations[gas];
  const temperatureFactor = (reference.at10 / reference.at30) ** ((30 - temperatureCelsius) / 20);
  return reference.at30 * temperatureFactor * partialPressureAtmospheres;
}

function calculateGasSolubilities(values: GasSolubilityValues) {
  const normalized = normalizeGasSolubilityValues(values);
  return {
    ...normalized,
    results: gases.map((gas) => ({ gas, concentrationMillimolar: calculateGasConcentration(gas, normalized.temperature_c, normalized.partial_pressure_atm) })),
  };
}

function initializeGasSolubilityModel(): void {}

export {
  initializeGasSolubilityModel as a,
  calculateGasSolubilities as i,
  partialPressureControl as n,
  normalizeGasSolubilityValues as o,
  temperatureControl as r,
  calculateGasConcentration as s,
  gases as t,
};
