// Empirical-rule intervals around the mean of a normal distribution.
import "@rchunk/rolldown-runtime";

interface NumberParameter { kind: "number"; defaultValue: number; min: number; max: number }
interface EmpiricalRuleValues { mean?: number | null; standard_deviation?: number | null; interval?: number | null }

const empiricalRuleType = "EMPIRICAL_RULE";
const empiricalRuleThumbnail = "empirical-rule-v2";
const empiricalRuleParameters: { mean: NumberParameter; standard_deviation: NumberParameter } = {
  mean: { kind: "number", defaultValue: 100, min: -10_000, max: 10_000 },
  standard_deviation: { kind: "number", defaultValue: 15, min: 0.1, max: 3_000 },
};
const empiricalRuleSpecification = { type: empiricalRuleType, version: 3, thumbnailAssetKey: empiricalRuleThumbnail, parameters: empiricalRuleParameters };
const meanParameter = empiricalRuleSpecification.parameters.mean;
const standardDeviationParameter = empiricalRuleSpecification.parameters.standard_deviation;
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const normalizeParameter = (value: number | null | undefined, parameter: NumberParameter): number =>
  clamp(Number.isFinite(value) ? value ?? parameter.defaultValue : parameter.defaultValue, parameter.min, parameter.max);
const normalizeEmpiricalRuleValues = (values: EmpiricalRuleValues) => ({
  mean: normalizeParameter(values.mean, meanParameter),
  standard_deviation: normalizeParameter(values.standard_deviation, standardDeviationParameter),
  interval: clamp(Number.isFinite(values.interval) ? Math.round(values.interval ?? 2) : 2, 1, 3),
});
const centralPercentages = [68, 95, 99.7];
const calculateEmpiricalRule = (values: EmpiricalRuleValues) => {
  const normalized = normalizeEmpiricalRuleValues(values);
  const central = centralPercentages[normalized.interval - 1] ?? 95;
  const outside = 100 - central;
  return {
    ...normalized, central, outside, tail: outside / 2,
    lower: normalized.mean - normalized.interval * normalized.standard_deviation,
    upper: normalized.mean + normalized.interval * normalized.standard_deviation,
    boundaries: [-3, -2, -1, 0, 1, 2, 3].map((distance) => ({ distance, value: normalized.mean + distance * normalized.standard_deviation })),
  };
};

function initializeEmpiricalRuleSpecification(): void {}
function initializeEmpiricalRuleModel(): void {}

export { normalizeEmpiricalRuleValues as a, initializeEmpiricalRuleModel as i, standardDeviationParameter as n, initializeEmpiricalRuleSpecification as o, calculateEmpiricalRule as r, empiricalRuleSpecification as s, meanParameter as t };
