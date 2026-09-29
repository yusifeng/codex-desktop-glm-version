// Cross-price elasticity for substitute and complementary goods.
import "@rchunk/rolldown-runtime";

type Relationship = "substitutes" | "complements";
type PriceChangeDirection = "increase" | "decrease";
interface CrossPriceValues { relationship?: unknown; priceChangeDirection?: unknown; priceChangeMagnitudePercent?: unknown }

const crossPriceElasticityType = "CROSS_PRICE_ELASTICITY";
const crossPriceElasticityThumbnail = "cross-price-elasticity-v2";
const crossPriceElasticityFormula = "E_{xy} = \\frac{\\%\\Delta Q_x}{\\%\\Delta P_y}";
const crossPriceElasticityParameters = {
  relationship: { kind: "enum" as const, defaultValue: "substitutes" as Relationship, allowedValues: ["substitutes", "complements"] as Relationship[] },
  priceChangeDirection: { kind: "enum" as const, defaultValue: "increase" as PriceChangeDirection, allowedValues: ["increase", "decrease"] as PriceChangeDirection[] },
  priceChangeMagnitudePercent: { kind: "number" as const, defaultValue: 20, min: 1, max: 30 },
};
const crossPriceElasticitySpecification = { type: crossPriceElasticityType, version: 1, thumbnailAssetKey: crossPriceElasticityThumbnail, canonicalFormula: crossPriceElasticityFormula, parameters: crossPriceElasticityParameters };
const relationshipNames = { complements: "complements" as Relationship, substitutes: "substitutes" as Relationship };
const relationshipParameter = crossPriceElasticitySpecification.parameters.relationship;
const directionParameter = crossPriceElasticitySpecification.parameters.priceChangeDirection;
const magnitudeParameter = crossPriceElasticitySpecification.parameters.priceChangeMagnitudePercent;
const relationships = relationshipParameter.allowedValues;
const priceChangeDirections = directionParameter.allowedValues;
const relationshipIndexControl = { min: 0, max: relationships.length - 1, step: 1 };
const relationshipIndex = (relationship: Relationship): number => Math.max(0, relationships.indexOf(relationship));
const magnitudeControl = { min: magnitudeParameter.min, max: magnitudeParameter.max, step: 5, defaultValue: magnitudeParameter.defaultValue };
const defaultCrossPriceValues = { relationship: relationshipParameter.defaultValue, priceChangeDirection: directionParameter.defaultValue, priceChangeMagnitudePercent: magnitudeControl.defaultValue };
const relationshipForIndex = (index: number): Relationship => relationships[Math.min(Math.max(Math.round(index), relationshipIndexControl.min), relationshipIndexControl.max)] ?? defaultCrossPriceValues.relationship;
const crossPriceChartBounds = { quantityMin: 0, quantityMax: 100, priceMin: 0, priceMax: 100 };
const elasticityMagnitude = 0.8;
const baselineDemandSlope = 0.7;
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const normalizeRelationship = (value: unknown): Relationship => typeof value === "string" && relationships.some((relationship) => relationship === value) ? value as Relationship : defaultCrossPriceValues.relationship;
const normalizeDirection = (value: unknown): PriceChangeDirection => typeof value === "string" && priceChangeDirections.some((direction) => direction === value) ? value as PriceChangeDirection : defaultCrossPriceValues.priceChangeDirection;
const normalizeMagnitude = (value: unknown): number => typeof value === "number" && Number.isFinite(value) ? clamp(value, magnitudeControl.min, magnitudeControl.max) : magnitudeControl.defaultValue;
const normalizeCrossPriceValues = (values: CrossPriceValues) => ({ relationship: normalizeRelationship(values.relationship), priceChangeDirection: normalizeDirection(values.priceChangeDirection), priceChangeMagnitudePercent: normalizeMagnitude(values.priceChangeMagnitudePercent) });
const calculateCrossPriceElasticity = (values: CrossPriceValues) => {
  const normalized = normalizeCrossPriceValues(values);
  const elasticity = (normalized.relationship === relationshipNames.substitutes ? 1 : -1) * elasticityMagnitude;
  const priceChangePercent = normalized.priceChangeMagnitudePercent * (normalized.priceChangeDirection === "increase" ? 1 : -1);
  const quantityChangePercent = elasticity * priceChangePercent;
  const baselineQuantity = 30 / baselineDemandSlope;
  const curveShift = quantityChangePercent / 100 * baselineQuantity;
  return { relationship: normalized.relationship, elasticity, priceChangePercent, quantityChangePercent, baselineQuantity, shiftedQuantity: baselineQuantity + curveShift, curveShift, shiftDirection: curveShift > 0 ? "right" : "left" };
};

function initializeCrossPriceElasticitySpecification(): void {}
function initializeCrossPriceElasticityModel(): void {}

export { relationshipIndexControl as a, relationshipIndex as c, initializeCrossPriceElasticitySpecification as d, crossPriceElasticitySpecification as f, relationshipNames as i, initializeCrossPriceElasticityModel as l, priceChangeDirections as n, calculateCrossPriceElasticity as o, magnitudeControl as r, relationshipForIndex as s, crossPriceChartBounds as t, normalizeCrossPriceValues as u };
