// Price elasticity of demand, demand-curve geometry, and total revenue.
import "@rchunk/rolldown-runtime";

interface NumberParameter { kind: "number"; defaultValue: number; min: number; max: number }
interface DemandElasticityValues { priceElasticityOfDemand?: number | null; price?: number | null }

const demandElasticityType = "DEMAND_ELASTICITY";
const demandElasticityThumbnail = "demand-elasticity-v1";
const demandElasticityFormula = "E_d = \\left|\\frac{\\%\\Delta Q_d}{\\%\\Delta P}\\right|";
const demandElasticityParameters: { priceElasticityOfDemand: NumberParameter } = {
  priceElasticityOfDemand: { kind: "number", defaultValue: 0.5, min: 0, max: 3 },
};
const demandElasticitySpecification = { type: demandElasticityType, version: 1, thumbnailAssetKey: demandElasticityThumbnail, canonicalFormula: demandElasticityFormula, parameters: demandElasticityParameters };
const elasticityControl = { ...demandElasticitySpecification.parameters.priceElasticityOfDemand, step: 0.05 };
const priceControl = { defaultValue: 50, min: 40, max: 60, step: 1 };
const demandChartBounds = { quantityMin: 0, quantityMax: 100, priceMin: 0, priceMax: 100 };
const halfPriceSpan = 30;
const referenceQuantity = 50;
const referencePrice = 50;
const epsilon = 1e-9;
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const normalizeDemandElasticityValues = (values: DemandElasticityValues) => ({
  priceElasticityOfDemand: Number.isFinite(values.priceElasticityOfDemand) ? clamp(values.priceElasticityOfDemand ?? elasticityControl.defaultValue, elasticityControl.min, elasticityControl.max) : elasticityControl.defaultValue,
  price: Number.isFinite(values.price) ? clamp(values.price ?? priceControl.defaultValue, priceControl.min, priceControl.max) : priceControl.defaultValue,
});
const elasticityCategory = (elasticity: number): string =>
  elasticity <= elasticityControl.min + epsilon ? "perfectly-inelastic" : elasticity < 0.999999999 ? "inelastic" : elasticity <= 1.000000001 ? "unit-elastic" : "elastic";
const calculateDemandElasticity = (values: DemandElasticityValues) => {
  const { priceElasticityOfDemand, price } = normalizeDemandElasticityValues(values);
  const slopeMagnitude = priceElasticityOfDemand <= epsilon ? Number.POSITIVE_INFINITY : referencePrice / (priceElasticityOfDemand * referenceQuantity);
  const halfQuantitySpan = Number.isFinite(slopeMagnitude) ? halfPriceSpan / Math.max(1, slopeMagnitude) : 0;
  const verticalSpan = Number.isFinite(slopeMagnitude) ? halfQuantitySpan * slopeMagnitude : halfPriceSpan;
  const quantity = Number.isFinite(slopeMagnitude) ? referenceQuantity + (referencePrice - price) / slopeMagnitude : referenceQuantity;
  return {
    priceElasticityOfDemand,
    category: elasticityCategory(priceElasticityOfDemand),
    demandSegment: { from: { x: referenceQuantity - halfQuantitySpan, y: referencePrice + verticalSpan }, to: { x: referenceQuantity + halfQuantitySpan, y: referencePrice - verticalSpan } },
    operatingPoint: { quantity, price },
    totalRevenue: quantity * price,
  };
};

function initializeDemandElasticitySpecification(): void {}
function initializeDemandElasticityModel(): void {}

export { initializeDemandElasticityModel as a, demandElasticitySpecification as c, calculateDemandElasticity as i, elasticityControl as n, normalizeDemandElasticityValues as o, priceControl as r, initializeDemandElasticitySpecification as s, demandChartBounds as t };
