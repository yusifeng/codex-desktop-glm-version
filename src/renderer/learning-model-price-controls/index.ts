// Price-ceiling and price-floor learning model.
// Release chunk: app/webview/assets/model-3228e752e987.js.
import "@rchunk/rolldown-runtime";

interface PriceControlValues { controlKind?: number | null; controlledPrice?: number | null }
interface NormalizedPriceControlValues { controlKind: number; controlledPrice: number }

let controlledPriceRange: { min: number; max: number; step: number };
let controlKindRange: { min: number; max: number; step: number };
let chartBounds: { quantityMin: number; quantityMax: number; priceMin: number; priceMax: number };
let defaultPriceControlValues: NormalizedPriceControlValues;
let normalizePriceControlValues: (values: PriceControlValues) => NormalizedPriceControlValues;
let calculatePriceControlMarket: (values: PriceControlValues) => NormalizedPriceControlValues & {
  binding: boolean; equilibriumPrice: number; equilibriumQuantity: number;
  quantityDemandedAtControl: number; quantitySuppliedAtControl: number; realizedPrice: number;
  quantityDemanded: number; quantitySupplied: number; quantityExchanged: number; gap: number;
  imbalance: "shortage" | "surplus" | "none";
};
let initialized = false;

function initializePriceControlsModel(): void {
  if (initialized) return;
  initialized = true;
  controlledPriceRange = { min: 20, max: 80, step: 1 };
  controlKindRange = { min: 0, max: 1, step: 1 };
  chartBounds = { quantityMin: 0, quantityMax: 100, priceMin: 0, priceMax: 100 };
  defaultPriceControlValues = { controlKind: 0, controlledPrice: 30 };
  const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
  normalizePriceControlValues = values => ({
    controlKind: +(values.controlKind === 1),
    controlledPrice: typeof values.controlledPrice === "number" && Number.isFinite(values.controlledPrice)
      ? clamp(values.controlledPrice, controlledPriceRange.min, controlledPriceRange.max)
      : defaultPriceControlValues.controlledPrice,
  });
  const quantityDemandedAt = (price: number): number => (90 - price) / 0.8;
  const quantitySuppliedAt = (price: number): number => (price - 10) / 0.8;
  calculatePriceControlMarket = values => {
    const normalized = normalizePriceControlValues(values);
    const binding = normalized.controlKind === 0 ? normalized.controlledPrice < 50 : normalized.controlledPrice > 50;
    const quantityDemandedAtControl = quantityDemandedAt(normalized.controlledPrice);
    const quantitySuppliedAtControl = quantitySuppliedAt(normalized.controlledPrice);
    const quantityDemanded = binding ? quantityDemandedAtControl : 50;
    const quantitySupplied = binding ? quantitySuppliedAtControl : 50;
    return {
      ...normalized, binding, equilibriumPrice: 50, equilibriumQuantity: 50,
      quantityDemandedAtControl, quantitySuppliedAtControl, realizedPrice: binding ? normalized.controlledPrice : 50,
      quantityDemanded, quantitySupplied, quantityExchanged: Math.min(quantityDemanded, quantitySupplied),
      gap: binding ? Math.abs(quantityDemandedAtControl - quantitySuppliedAtControl) : 0,
      imbalance: binding ? normalized.controlKind === 0 ? "shortage" : "surplus" : "none",
    };
  };
}

export {
  calculatePriceControlMarket as a, controlledPriceRange as i, defaultPriceControlValues as n,
  initializePriceControlsModel as o, controlKindRange as r, normalizePriceControlValues as s, chartBounds as t,
};
