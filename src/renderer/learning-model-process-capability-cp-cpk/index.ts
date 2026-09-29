// Process capability indices Cp and Cpk for a normally distributed process.
import "@rchunk/rolldown-runtime";

interface NumberParameter { kind: "number"; defaultValue: number; min: number; max: number }
interface ProcessCapabilityValues { lower_specification_limit?: number | null; upper_specification_limit?: number | null; process_mean?: number | null; process_standard_deviation?: number | null }

const processCapabilityType = "PROCESS_CAPABILITY_CP_CPK";
const processCapabilityThumbnail = "process-capability-cp-cpk-v1";
const processCapabilityParameters: Record<keyof ProcessCapabilityValues, NumberParameter> = {
  lower_specification_limit: { kind: "number", defaultValue: 90, min: 80, max: 95 },
  upper_specification_limit: { kind: "number", defaultValue: 110, min: 105, max: 120 },
  process_mean: { kind: "number", defaultValue: 100, min: 80, max: 120 },
  process_standard_deviation: { kind: "number", defaultValue: 2.5, min: 1, max: 4 },
};
const processCapabilitySpecification = { type: processCapabilityType, version: 2, thumbnailAssetKey: processCapabilityThumbnail, parameters: processCapabilityParameters };
const parameters = processCapabilitySpecification.parameters;
const normalizeParameter = (value: number | null | undefined, parameter: NumberParameter): number => Number.isFinite(value) ? Math.min(parameter.max, Math.max(parameter.min, value ?? parameter.defaultValue)) : parameter.defaultValue;
const normalDensity = (x: number, mean: number, standardDeviation: number): number => Math.exp(-0.5 * ((x - mean) / standardDeviation) ** 2) / (standardDeviation * Math.sqrt(2 * Math.PI));
const calculateProcessCapability = (values: ProcessCapabilityValues) => {
  const lower = normalizeParameter(values.lower_specification_limit, parameters.lower_specification_limit);
  const upper = normalizeParameter(values.upper_specification_limit, parameters.upper_specification_limit);
  const mean = normalizeParameter(values.process_mean, parameters.process_mean);
  const standardDeviation = normalizeParameter(values.process_standard_deviation, parameters.process_standard_deviation);
  const toleranceWidth = upper - lower;
  const midpoint = (lower + upper) / 2;
  const cpl = (mean - lower) / (3 * standardDeviation);
  const cpu = (upper - mean) / (3 * standardDeviation);
  return { lower_specification_limit: lower, upper_specification_limit: upper, process_mean: mean, process_standard_deviation: standardDeviation, cp: toleranceWidth / (6 * standardDeviation), cpk: Math.min(cpl, cpu), cpl, cpu, naturalLower: mean - 3 * standardDeviation, naturalUpper: mean + 3 * standardDeviation, toleranceWidth, midpoint, nearerSide: Math.abs(cpl - cpu) < 1e-9 ? "equal" : cpl < cpu ? "lower" : "upper" };
};

function initializeProcessCapabilitySpecification(): void {}
function initializeProcessCapabilityModel(): void {}

export { initializeProcessCapabilitySpecification as a, normalDensity as i, calculateProcessCapability as n, processCapabilitySpecification as o, initializeProcessCapabilityModel as r, parameters as t };
