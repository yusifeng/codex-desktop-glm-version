// Operant-conditioning learning model: classify reinforcement and punishment.
import "@rchunk/rolldown-runtime";

type BehaviorEffect = "more_likely" | "less_likely";
type StimulusChange = "added" | "removed";

interface OperantConditioningValues { behaviorEffect?: unknown; stimulusChange?: unknown }
interface NormalizedOperantConditioningValues { behaviorEffect: BehaviorEffect; stimulusChange: StimulusChange }

const operantConditioningType = "OPERANT_CONDITIONING";
const operantConditioningParameters = {
  behaviorEffect: { kind: "enum", defaultValue: "more_likely" as BehaviorEffect, allowedValues: ["more_likely", "less_likely"] as BehaviorEffect[] },
  stimulusChange: { kind: "enum", defaultValue: "added" as StimulusChange, allowedValues: ["added", "removed"] as StimulusChange[] },
};
const operantConditioningDefinition = { type: operantConditioningType, version: 1, parameters: operantConditioningParameters };
const behaviorEffects = operantConditioningDefinition.parameters.behaviorEffect.allowedValues;
const stimulusChanges = operantConditioningDefinition.parameters.stimulusChange.allowedValues;
const defaultOperantConditioningValues: NormalizedOperantConditioningValues = {
  behaviorEffect: operantConditioningDefinition.parameters.behaviorEffect.defaultValue,
  stimulusChange: operantConditioningDefinition.parameters.stimulusChange.defaultValue,
};

const normalizeEnum = <Value extends string>(value: unknown, allowed: Value[], fallback: Value): Value =>
  typeof value === "string" && allowed.includes(value as Value) ? value as Value : fallback;

function normalizeOperantConditioningValues(values: OperantConditioningValues): NormalizedOperantConditioningValues {
  return {
    behaviorEffect: normalizeEnum(values.behaviorEffect, behaviorEffects, defaultOperantConditioningValues.behaviorEffect),
    stimulusChange: normalizeEnum(values.stimulusChange, stimulusChanges, defaultOperantConditioningValues.stimulusChange),
  };
}

function classifyOperantConditioning(values: OperantConditioningValues):
  | "positive-reinforcement" | "negative-reinforcement" | "positive-punishment" | "negative-punishment" {
  const { behaviorEffect, stimulusChange } = normalizeOperantConditioningValues(values);
  return behaviorEffect === "more_likely"
    ? stimulusChange === "added" ? "positive-reinforcement" : "negative-reinforcement"
    : stimulusChange === "added" ? "positive-punishment" : "negative-punishment";
}

function initializeOperantConditioningSchema(): void {}
function initializeOperantConditioningModel(): void {}

export {
  initializeOperantConditioningModel as a,
  operantConditioningDefinition as c,
  classifyOperantConditioning as i,
  defaultOperantConditioningValues as n,
  normalizeOperantConditioningValues as o,
  stimulusChanges as r,
  initializeOperantConditioningSchema as s,
  behaviorEffects as t,
};
