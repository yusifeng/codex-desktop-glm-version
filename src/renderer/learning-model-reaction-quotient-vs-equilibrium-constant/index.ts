// Reaction-quotient-versus-equilibrium-constant learning model.
import "@rchunk/rolldown-runtime";

type EquilibriumRelation = "below" | "equal" | "above";
interface QVsKValues { equilibrium_constant?: number | null; initial_reaction_quotient?: number | null }

const qVsKType = "Q_VS_K";
const qVsKThumbnail = "q-vs-k-v2";
const qVsKParameters = {
  equilibrium_constant: { kind: "number", defaultValue: 1, min: 1e-100, max: 1e100 },
  initial_reaction_quotient: { kind: "number", defaultValue: 0.1, min: 0, max: 1e101 },
};
const qVsKDefinition = { type: qVsKType, version: 2, thumbnailAssetKey: qVsKThumbnail, parameters: qVsKParameters };
const equilibriumConstantParameter = qVsKDefinition.parameters.equilibrium_constant;
const reactionQuotientParameter = qVsKDefinition.parameters.initial_reaction_quotient;
const finiteOr = (value: number | null | undefined, fallback: number): number => typeof value === "number" && Number.isFinite(value) ? value : fallback;
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
const defaultQVsKValues = { equilibrium_constant: equilibriumConstantParameter.defaultValue, initial_reaction_quotient: reactionQuotientParameter.defaultValue };
const normalizeQVsKValues = (values: QVsKValues) => ({
  equilibrium_constant: clamp(finiteOr(values.equilibrium_constant, equilibriumConstantParameter.defaultValue), equilibriumConstantParameter.min, equilibriumConstantParameter.max),
  initial_reaction_quotient: clamp(finiteOr(values.initial_reaction_quotient, reactionQuotientParameter.defaultValue), reactionQuotientParameter.min, reactionQuotientParameter.max),
});
const compareQToK = (quotient: number, equilibriumConstant: number): EquilibriumRelation =>
  quotient < equilibriumConstant ? "below" : quotient > equilibriumConstant ? "above" : "equal";
const relationFromSelector = (selector: number): EquilibriumRelation => selector < 0 ? "below" : selector > 0 ? "above" : "equal";

function setReactionQuotientRelation(values: QVsKValues, selector: number) {
  const normalized = normalizeQVsKValues(values);
  const relation = relationFromSelector(selector);
  const quotient = relation === "below" ? normalized.equilibrium_constant / 10
    : relation === "above" ? normalized.equilibrium_constant * 10 : normalized.equilibrium_constant;
  return { ...normalized, initial_reaction_quotient: clamp(quotient, reactionQuotientParameter.min, reactionQuotientParameter.max) };
}

const buildEquilibriumTrajectory = (relation: EquilibriumRelation) => Array.from({ length: 49 }, (_unused, index) => {
  const x = 6 * index / 48;
  const initialRatio = relation === "below" ? 0.16 : relation === "above" ? 1.84 : 1;
  return { x, y: 1 + (initialRatio - 1) * Math.exp(-x / 1.55) };
});
const deriveQVsKState = (values: QVsKValues) => {
  const normalized = normalizeQVsKValues(values);
  return { values: normalized, relation: compareQToK(normalized.initial_reaction_quotient, normalized.equilibrium_constant) };
};

function initializeQVsKSchema(): void {}
function initializeQVsKModel(): void {}

export {
  setReactionQuotientRelation as a,
  initializeQVsKModel as i,
  deriveQVsKState as n,
  initializeQVsKSchema as o,
  buildEquilibriumTrajectory as r,
  qVsKDefinition as s,
  defaultQVsKValues as t,
};
