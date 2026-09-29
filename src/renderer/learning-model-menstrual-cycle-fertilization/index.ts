// Hormonal, ovarian, and uterine changes across a 28-day menstrual cycle.
import "@rchunk/rolldown-runtime";

type FertilizationOutcome = "noImplantation" | "successfulImplantation";
interface MenstrualCycleValues { day?: number | null; outcome?: unknown }

const menstrualCycleSpecification = {
  type: "MENSTRUAL_CYCLE_FERTILIZATION",
  version: 1,
  thumbnailAssetKey: "menstrual-cycle-fertilization-v2",
  parameters: {
    day: { kind: "integer" as const, defaultValue: 1, min: 1, max: 28 },
    outcome: { kind: "enum" as const, defaultValue: "noImplantation" as FertilizationOutcome, allowedValues: ["noImplantation", "successfulImplantation"] as FertilizationOutcome[] },
  },
};
const implantationStart = 21.5;
const dayParameter = menstrualCycleSpecification.parameters.day;
const outcomeParameter = menstrualCycleSpecification.parameters.outcome;
const dayControl = { min: dayParameter.min, max: dayParameter.max, step: 1, defaultValue: dayParameter.defaultValue };
const defaultMenstrualCycleValues = { day: dayControl.defaultValue, outcome: outcomeParameter.defaultValue };
const clampFinite = (value: number, minimum: number, maximum: number): number => Number.isFinite(value) ? Math.min(Math.max(value, minimum), maximum) : minimum;
const gaussian = (value: number, mean: number, standardDeviation: number): number => Math.exp(-0.5 * ((value - mean) / standardDeviation) ** 2);
const smoothstep = (start: number, end: number, value: number): number => {
  const progress = clampFinite((value - start) / (end - start), 0, 1);
  return progress * progress * (3 - 2 * progress);
};
const normalizeMenstrualCycleValues = (values: MenstrualCycleValues) => ({
  day: Math.round(clampFinite(values.day ?? dayControl.defaultValue, dayControl.min, dayControl.max)),
  outcome: typeof values.outcome === "string" && outcomeParameter.allowedValues.some((outcome) => outcome === values.outcome) ? values.outcome as FertilizationOutcome : defaultMenstrualCycleValues.outcome,
});
const phaseForDay = (day: number): "menstrual" | "proliferative" | "ovulation" | "secretory" => day <= 5 ? "menstrual" : day <= 13 ? "proliferative" : day === 14 ? "ovulation" : "secretory";
const ovarianStateForDay = (day: number, implanted: boolean): string => day <= 5 ? "earlyFollicle" : day <= 10 ? "growingFollicle" : day <= 13 ? "matureFollicle" : day === 14 ? "ovulation" : day <= 23 ? "corpusLuteum" : implanted ? "maintainedCorpusLuteum" : "regressingCorpusLuteum";
const liningStateForDay = (day: number, implanted: boolean): string => day <= 5 ? "shedding" : day <= 14 ? "rebuilding" : implanted && day > implantationStart ? "maintained" : !implanted && day >= 24 ? "breakingDown" : "secretory";
const liningThicknessForDay = (day: number, implanted: boolean): number => day <= 5
  ? 8.2 - (day - 1) / 4 * 5.4
  : day <= 14
    ? 2.8 + (day - 5) / 9 * 4.7
    : day <= 23
      ? 7.5 + (day - 14) / 9 * 3.5
      : implanted ? 11 + 0.25 * smoothstep(23, 28, day) : 11 - 5.5 * smoothstep(23, 28, day);
const hormonesForDay = (day: number, implanted: boolean) => {
  const implantationRamp = implanted && day > implantationStart ? smoothstep(implantationStart, 28, day) : 0;
  const regressionFactor = implanted ? 1 : 1 - 0.9 * smoothstep(23, 28, day);
  const lutealRamp = smoothstep(13, 16, day);
  return {
    lh: clampFinite(7 + 86 * gaussian(day, 14, 0.82), 0, 100),
    estrogen: clampFinite(9 + 63 * gaussian(day, 12.2, 3.1) + 31 * gaussian(day, 20.5, 3.5) * regressionFactor + 23 * implantationRamp, 0, 100),
    progesterone: clampFinite(4 + 72 * gaussian(day, 21.2, 4.5) * lutealRamp * regressionFactor + 53 * implantationRamp, 0, 100),
    hcg: implanted && day > implantationStart ? clampFinite(90 * smoothstep(implantationStart, 28, day), 0, 100) : 0,
  };
};
const calculateMenstrualCycle = (values: MenstrualCycleValues) => {
  const normalized = normalizeMenstrualCycleValues(values);
  const implantationSucceeded = normalized.outcome === "successfulImplantation";
  return { ...normalized, implantationSucceeded, phase: phaseForDay(normalized.day), ovarianState: ovarianStateForDay(normalized.day, implantationSucceeded), liningState: liningStateForDay(normalized.day, implantationSucceeded), liningThickness: liningThicknessForDay(normalized.day, implantationSucceeded), hormones: hormonesForDay(normalized.day, implantationSucceeded) };
};

function initializeMenstrualCycleSpecification(): void {}
function initializeMenstrualCycleModel(): void {}

export { liningThicknessForDay as a, normalizeMenstrualCycleValues as c, calculateMenstrualCycle as i, initializeMenstrualCycleSpecification as l, defaultMenstrualCycleValues as n, hormonesForDay as o, implantationStart as r, initializeMenstrualCycleModel as s, dayControl as t, menstrualCycleSpecification as u };
