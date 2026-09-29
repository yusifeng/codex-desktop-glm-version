// Consumer/producer surplus model around a linear-market equilibrium.
import "@rchunk/rolldown-runtime";

interface SurplusValues { tradedQuantity?: number }

const surplusMarketBounds = { quantityMin: 0, quantityMax: 100, priceMin: 0, priceMax: 110 };
const tradedQuantityControl = { min: 0, max: 100, step: 1 };
const demandIntercept = 100;
const demandSlope = 0.8;
const supplyIntercept = 16;
const supplySlope = 0.6;
const defaultSurplusValues = { tradedQuantity: 60 };

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));
const normalizeSurplusValues = (values: SurplusValues) => ({
  tradedQuantity:
    typeof values.tradedQuantity === "number" && Number.isFinite(values.tradedQuantity)
      ? clamp(values.tradedQuantity, tradedQuantityControl.min, tradedQuantityControl.max)
      : defaultSurplusValues.tradedQuantity,
});
const demandPrice = (quantity: number): number => demandIntercept - demandSlope * quantity;
const supplyPrice = (quantity: number): number => supplyIntercept + supplySlope * quantity;

function calculateMarketSurplus(values: SurplusValues) {
  const { tradedQuantity } = normalizeSurplusValues(values);
  const positiveQuantity = Math.min(tradedQuantity, 60);
  const consumerSurplus = 48 * positiveQuantity - demandSlope * positiveQuantity ** 2 / 2;
  const producerSurplus = 36 * positiveQuantity - supplySlope * positiveQuantity ** 2 / 2;
  const omittedGains = tradedQuantity < 60 ? 1.4 * (60 - tradedQuantity) ** 2 / 2 : 0;
  const negativeGains = tradedQuantity > 60 ? 1.4 * (tradedQuantity - 60) ** 2 / 2 : 0;
  return {
    tradedQuantity,
    positiveQuantity,
    equilibriumQuantity: 60,
    equilibriumPrice: 52,
    consumerSurplus,
    producerSurplus,
    totalSurplus: consumerSurplus + producerSurplus - negativeGains,
    maximumTotalSurplus: 2520,
    omittedGains,
    negativeGains,
    state: tradedQuantity < 60 ? "below" : tradedQuantity > 60 ? "above" : "equilibrium",
  };
}

function initializeConsumerProducerSurplusModel(): void {}

export {
  demandPrice as a,
  normalizeSurplusValues as c,
  calculateMarketSurplus as i,
  defaultSurplusValues as n,
  supplyPrice as o,
  tradedQuantityControl as r,
  initializeConsumerProducerSurplusModel as s,
  surplusMarketBounds as t,
};
