// Landslide movement types, destabilizing conditions, and runout risk.
import "@rchunk/rolldown-runtime";

type MovementType = "fall" | "topple" | "rotational slide" | "translational slide" | "spread" | "flow";
type SlopeCondition = "stable conditions" | "saturated ground" | "undercut or excavated toe" | "strong shaking";
interface LandslideValues { initial_movement_type?: unknown; slope_condition?: unknown }

const landslideType = "LANDSLIDE_RISK_AND_MOVEMENT_TYPES";
const landslideThumbnail = "landslide-risk-and-movement-types-v2";
const landslideParameters = { initial_movement_type: { kind: "enum" as const, defaultValue: "fall" as MovementType, allowedValues: ["fall", "topple", "rotational slide", "translational slide", "spread", "flow"] as MovementType[] } };
const landslideSpecification = { type: landslideType, version: 2, thumbnailAssetKey: landslideThumbnail, parameters: landslideParameters };
const isMovementType = (value: unknown): value is MovementType => value === "fall" || value === "topple" || value === "rotational slide" || value === "translational slide" || value === "spread" || value === "flow";
const movementTypes = landslideSpecification.parameters.initial_movement_type.allowedValues.filter(isMovementType);
const slopeConditions: SlopeCondition[] = ["stable conditions", "saturated ground", "undercut or excavated toe", "strong shaking"];
const isSlopeCondition = (value: unknown): value is SlopeCondition => typeof value === "string" && slopeConditions.some((condition) => condition === value);
const defaultMovementType = movementTypes.find((movement) => movement === landslideSpecification.parameters.initial_movement_type.defaultValue) ?? "fall";
const baseRunoutX: Record<MovementType, number> = { fall: 476, topple: 442, "rotational slide": 494, "translational slide": 526, spread: 548, flow: 570 };
const conditionRunoutOffset: Record<SlopeCondition, number> = { "stable conditions": 0, "saturated ground": 22, "undercut or excavated toe": 28, "strong shaking": 38 };
const normalizeLandslideValues = (values: LandslideValues) => ({ initial_movement_type: isMovementType(values.initial_movement_type) ? values.initial_movement_type : defaultMovementType, slope_condition: isSlopeCondition(values.slope_condition) ? values.slope_condition : "stable conditions" as SlopeCondition });
const movementTypeIndex = (movement: MovementType): number => movementTypes.findIndex((candidate) => candidate === movement);
const slopeConditionIndex = (condition: SlopeCondition): number => slopeConditions.findIndex((candidate) => candidate === condition);
const movementTypeForIndex = (index: number): MovementType => movementTypes[Math.max(0, Math.min(movementTypes.length - 1, Math.round(index)))] ?? defaultMovementType;
const slopeConditionForIndex = (index: number): SlopeCondition => slopeConditions[Math.max(0, Math.min(slopeConditions.length - 1, Math.round(index)))] ?? "stable conditions";
const calculateLandslideRisk = (values: LandslideValues) => {
  const normalized = normalizeLandslideValues(values);
  const runoutEndX = Math.min(614, baseRunoutX[normalized.initial_movement_type] + conditionRunoutOffset[normalized.slope_condition]);
  return { movement: normalized.initial_movement_type, condition: normalized.slope_condition, runoutEndX, assetExposed: normalized.initial_movement_type === "spread" || runoutEndX >= 562, destabilized: normalized.slope_condition !== "stable conditions" };
};

function initializeLandslideSpecification(): void {}
function initializeLandslideModel(): void {}

export { slopeConditionForIndex as a, movementTypeForIndex as c, landslideSpecification as d, calculateLandslideRisk as i, movementTypeIndex as l, defaultMovementType as n, slopeConditionIndex as o, movementTypes as r, initializeLandslideModel as s, slopeConditions as t, initializeLandslideSpecification as u };
