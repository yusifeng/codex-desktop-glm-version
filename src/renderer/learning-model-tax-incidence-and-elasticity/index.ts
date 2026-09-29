// Tax-incidence learning model driven by demand and supply responsiveness.
import "@rchunk/rolldown-runtime";

interface TaxIncidenceValues { demandResponsiveness?: number | null; supplyResponsiveness?: number | null }
interface MarketBounds { quantityMin: number; quantityMax: number; priceMin: number; priceMax: number }

const responsivenessControl = { min: 0.4, max: 2.4, step: 0.01 };
const preTaxMarket = { price: 60, quantity: 60, tax: 24 };
const taxMarketBounds: MarketBounds = { quantityMin: 0, quantityMax: 100, priceMin: 0, priceMax: 120 };
const defaultResponsiveness = { demandResponsiveness: 1.2, supplyResponsiveness: 1.2 };
const normalizeResponsiveness = (value: number | null | undefined, fallback: number): number =>
  Number.isFinite(value) ? Math.min(responsivenessControl.max, Math.max(responsivenessControl.min, value as number)) : fallback;
const normalizeTaxIncidenceValues = (values: TaxIncidenceValues) => ({
  demandResponsiveness: normalizeResponsiveness(values.demandResponsiveness, defaultResponsiveness.demandResponsiveness),
  supplyResponsiveness: normalizeResponsiveness(values.supplyResponsiveness, defaultResponsiveness.supplyResponsiveness),
});

function calculateTaxIncidence(values: TaxIncidenceValues) {
  const normalized = normalizeTaxIncidenceValues(values);
  const totalResponsiveness = normalized.demandResponsiveness + normalized.supplyResponsiveness;
  const buyerBurden = preTaxMarket.tax * normalized.supplyResponsiveness / totalResponsiveness;
  const sellerBurden = preTaxMarket.tax - buyerBurden;
  const quantityReduction = preTaxMarket.tax * normalized.demandResponsiveness * normalized.supplyResponsiveness / totalResponsiveness;
  return {
    ...normalized,
    preTaxPrice: preTaxMarket.price,
    preTaxQuantity: preTaxMarket.quantity,
    tax: preTaxMarket.tax,
    taxedQuantity: preTaxMarket.quantity - quantityReduction,
    buyerPrice: preTaxMarket.price + buyerBurden,
    sellerPrice: preTaxMarket.price - sellerBurden,
    buyerBurden,
    sellerBurden,
    buyerSharePercent: buyerBurden / preTaxMarket.tax * 100,
    sellerSharePercent: sellerBurden / preTaxMarket.tax * 100,
  };
}
const demandPrice = (quantity: number, responsiveness: number): number => preTaxMarket.price + (preTaxMarket.quantity - quantity) / responsiveness;
const supplyPrice = (quantity: number, responsiveness: number): number => preTaxMarket.price + (quantity - preTaxMarket.quantity) / responsiveness;
const roundBurdenShares = (state: { buyerSharePercent: number }) => {
  const buyerSharePercent = Math.round(state.buyerSharePercent * 10) / 10;
  return { buyerSharePercent, sellerSharePercent: 100 - buyerSharePercent };
};
const buildDemandSegment = (responsiveness: number, bounds = taxMarketBounds) => {
  const fromQuantity = Math.max(bounds.quantityMin, preTaxMarket.quantity - responsiveness * (bounds.priceMax - preTaxMarket.price));
  const toQuantity = Math.min(bounds.quantityMax, preTaxMarket.quantity + responsiveness * (preTaxMarket.price - bounds.priceMin));
  return { from: { x: fromQuantity, y: demandPrice(fromQuantity, responsiveness) }, to: { x: toQuantity, y: demandPrice(toQuantity, responsiveness) } };
};
const buildSupplySegment = (responsiveness: number, bounds = taxMarketBounds) => {
  const fromQuantity = Math.max(bounds.quantityMin, preTaxMarket.quantity - responsiveness * (preTaxMarket.price - bounds.priceMin));
  const toQuantity = Math.min(bounds.quantityMax, preTaxMarket.quantity + responsiveness * (bounds.priceMax - preTaxMarket.price));
  return { from: { x: fromQuantity, y: supplyPrice(fromQuantity, responsiveness) }, to: { x: toQuantity, y: supplyPrice(toQuantity, responsiveness) } };
};

function initializeTaxIncidenceModel(): void {}

export {
  demandPrice as a,
  roundBurdenShares as c,
  supplyPrice as d,
  calculateTaxIncidence as i,
  initializeTaxIncidenceModel as l,
  responsivenessControl as n,
  buildDemandSegment as o,
  taxMarketBounds as r,
  buildSupplySegment as s,
  defaultResponsiveness as t,
  normalizeTaxIncidenceValues as u,
};
