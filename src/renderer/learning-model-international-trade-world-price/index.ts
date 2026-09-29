// International-trade learning model: infer imports or exports at a world price.
// Release chunk: app/webview/assets/model-9176b81a016b.js.
import "@rchunk/rolldown-runtime";

interface TradeValues { worldPrice?: number | null }
interface NormalizedTradeValues { worldPrice: number }
interface Point { x: number; y: number }
interface LineSegment { from: Point; to: Point }

let worldPriceControl: { min: number; max: number; step: number };
let defaultTradeValues: NormalizedTradeValues;
let marketBounds: {
  quantityMin: number; quantityMax: number; priceMin: number; priceMax: number;
  demandIntercept: number; supplyIntercept: number; curveSlope: number;
  noTradeQuantity: number; noTradePrice: number;
};
let marketCurves: { demand: LineSegment; supply: LineSegment };
let normalizeTradeValues: (values: TradeValues) => NormalizedTradeValues;
let calculateTradeState: (values: TradeValues) => NormalizedTradeValues & {
  quantitySupplied: number; quantityDemanded: number; tradeQuantity: number;
  tradeState: "imports" | "exports" | "no-trade";
};
let initialized = false;

function initializeInternationalTradeWorldPriceModel(): void {
  if (initialized) return;
  initialized = true;
  worldPriceControl = { min: 20, max: 80, step: 0.5 };
  defaultTradeValues = { worldPrice: 35 };
  marketBounds = {
    quantityMin: 0, quantityMax: 100, priceMin: 0, priceMax: 100,
    demandIntercept: 90, supplyIntercept: 10, curveSlope: 0.8,
    noTradeQuantity: 50, noTradePrice: 50,
  };
  marketCurves = {
    demand: {
      from: { x: marketBounds.quantityMin, y: marketBounds.demandIntercept },
      to: { x: marketBounds.quantityMax, y: marketBounds.demandIntercept - marketBounds.curveSlope * marketBounds.quantityMax },
    },
    supply: {
      from: { x: marketBounds.quantityMin, y: marketBounds.supplyIntercept },
      to: { x: marketBounds.quantityMax, y: marketBounds.supplyIntercept + marketBounds.curveSlope * marketBounds.quantityMax },
    },
  };
  const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
  normalizeTradeValues = values => ({
    worldPrice: typeof values.worldPrice === "number" && Number.isFinite(values.worldPrice)
      ? clamp(values.worldPrice, worldPriceControl.min, worldPriceControl.max)
      : defaultTradeValues.worldPrice,
  });
  calculateTradeState = values => {
    const { worldPrice } = normalizeTradeValues(values);
    const quantitySupplied = (worldPrice - marketBounds.supplyIntercept) / marketBounds.curveSlope;
    const quantityDemanded = (marketBounds.demandIntercept - worldPrice) / marketBounds.curveSlope;
    const tradeBalance = quantityDemanded - quantitySupplied;
    return {
      worldPrice, quantitySupplied, quantityDemanded, tradeQuantity: Math.abs(tradeBalance),
      tradeState: tradeBalance > 0 ? "imports" : tradeBalance < 0 ? "exports" : "no-trade",
    };
  };
}

export {
  calculateTradeState as a, worldPriceControl as i, marketCurves as n,
  initializeInternationalTradeWorldPriceModel as o, marketBounds as r,
  normalizeTradeValues as s, defaultTradeValues as t,
};
