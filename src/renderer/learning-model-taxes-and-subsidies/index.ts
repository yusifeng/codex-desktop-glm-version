// Tax-and-subsidy incidence learning model with three elasticity scenarios.
import "@rchunk/rolldown-runtime";

interface TaxSubsidyValues { policy?: number | null; responsiveness?: number | null }

const defaultTaxSubsidyValues = { policy: 0, responsiveness: 1 };
const baselineMarket = { quantity: 50, price: 50 };
const taxSubsidyBounds = { quantityMin: 0, quantityMax: 100, priceMin: 0, priceMax: 100 };
const normalizeSelection = (value: number | null | undefined, maximum: number, fallback: number): number =>
  Number.isFinite(value) ? Math.min(maximum, Math.max(0, Math.round(value as number))) : fallback;
const normalizeTaxSubsidyValues = (values: TaxSubsidyValues) => ({
  policy: normalizeSelection(values.policy, 1, defaultTaxSubsidyValues.policy),
  responsiveness: normalizeSelection(values.responsiveness, 2, defaultTaxSubsidyValues.responsiveness),
});

function calculateTaxSubsidyIncidence(values: TaxSubsidyValues) {
  const normalized = normalizeTaxSubsidyValues(values);
  const slopes = normalized.responsiveness === 0
    ? { demand: 1.2, supply: 0.35 }
    : normalized.responsiveness === 2 ? { demand: 0.35, supply: 1.2 } : { demand: 0.65, supply: 0.65 };
  const quantityChange = (normalized.policy === 0 ? -1 : 1) * 20 / (slopes.demand + slopes.supply);
  return {
    policy: normalized.policy === 0 ? "tax" : "subsidy",
    responsiveness: normalized.responsiveness === 0 ? "buyers" : normalized.responsiveness === 2 ? "sellers" : "similar",
    demandSlope: slopes.demand,
    supplySlope: slopes.supply,
    quantity: baselineMarket.quantity + quantityChange,
    buyerPrice: baselineMarket.price - slopes.demand * quantityChange,
    sellerPrice: baselineMarket.price + slopes.supply * quantityChange,
    amount: 20,
  };
}

function calculateMarketLine(interceptAtBaseline: number, slope: number) {
  const firstQuantity = baselineMarket.quantity + (taxSubsidyBounds.priceMin - interceptAtBaseline) / slope;
  const secondQuantity = baselineMarket.quantity + (taxSubsidyBounds.priceMax - interceptAtBaseline) / slope;
  const fromQuantity = Math.max(taxSubsidyBounds.quantityMin, Math.min(firstQuantity, secondQuantity));
  const toQuantity = Math.min(taxSubsidyBounds.quantityMax, Math.max(firstQuantity, secondQuantity));
  const priceAt = (quantity: number): number => Math.min(
    taxSubsidyBounds.priceMax,
    Math.max(taxSubsidyBounds.priceMin, interceptAtBaseline + slope * (quantity - baselineMarket.quantity)),
  );
  return { from: { x: fromQuantity, y: priceAt(fromQuantity) }, to: { x: toQuantity, y: priceAt(toQuantity) } };
}

function initializeTaxesAndSubsidiesModel(): void {}

export {
  calculateMarketLine as a,
  calculateTaxSubsidyIncidence as i,
  baselineMarket as n,
  initializeTaxesAndSubsidiesModel as o,
  taxSubsidyBounds as r,
  normalizeTaxSubsidyValues as s,
  defaultTaxSubsidyValues as t,
};
