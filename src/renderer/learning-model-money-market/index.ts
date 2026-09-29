// Money-market supply-and-demand learning model. Release chunk: model-6bc352ee4868.js.
import "@rchunk/rolldown-runtime";

type MarketChange = "baseline" | "money supply increases" | "money supply decreases" | "money demand increases" | "money demand decreases";
interface MoneyMarketValues { initial_market_change?: string | null; interestRate?: number | null }
interface MoneyMarketManifest {
  type: string; version: number; thumbnailAssetKey: string;
  parameters: { initial_market_change: { kind: "enum"; defaultValue: MarketChange; allowedValues: MarketChange[] } };
}

let moneyMarketManifest: MoneyMarketManifest;
let marketChanges: MarketChange[];
let interestRateControl: { min: number; max: number; step: number };
let calculateMoneyMarket: (values: MoneyMarketValues) => {
  initial_market_change: MarketChange; interestRate: number; suppliedQuantity: number; desiredQuantity: number; equilibriumRate: number;
  demandShift: number; supplyShift: number; demandLine: { from: { x: number; y: number }; to: { x: number; y: number } };
  imbalance: number; status: "equilibrium" | "excess demand" | "excess supply";
};
let manifestInitialized = false;
let modelInitialized = false;

function initializeMoneyMarketManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  moneyMarketManifest = {
    type: "MONEY_MARKET", version: 2, thumbnailAssetKey: "money-market-v1",
    parameters: {
      initial_market_change: {
        kind: "enum", defaultValue: "baseline",
        allowedValues: ["baseline", "money supply increases", "money supply decreases", "money demand increases", "money demand decreases"],
      },
    },
  };
}

function initializeMoneyMarketModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeMoneyMarketManifest();
  marketChanges = moneyMarketManifest.parameters.initial_market_change.allowedValues;
  interestRateControl = { min: 2, max: 10, step: 0.5 };
  const isMarketChange = (value: unknown): value is MarketChange =>
    typeof value === "string" && marketChanges.some(change => change === value);
  calculateMoneyMarket = values => {
    const initialMarketChange = isMarketChange(values.initial_market_change)
      ? values.initial_market_change
      : moneyMarketManifest.parameters.initial_market_change.defaultValue;
    const interestRate = typeof values.interestRate === "number" && Number.isFinite(values.interestRate)
      ? Math.min(interestRateControl.max, Math.max(interestRateControl.min, values.interestRate))
      : 6;
    const supplyShift = initialMarketChange === "money supply increases" ? 20 : initialMarketChange === "money supply decreases" ? -20 : 0;
    const demandShift = initialMarketChange === "money demand increases" ? 20 : initialMarketChange === "money demand decreases" ? -20 : 0;
    const suppliedQuantity = 60 + supplyShift;
    const desiredQuantity = 120 + demandShift - 10 * interestRate;
    const equilibriumRate = (120 + demandShift - suppliedQuantity) / 10;
    const imbalance = desiredQuantity - suppliedQuantity;
    return {
      initial_market_change: initialMarketChange, interestRate, suppliedQuantity, desiredQuantity, equilibriumRate, demandShift, supplyShift,
      demandLine: { from: { x: Math.max(0, demandShift), y: 12 + Math.min(0, demandShift) / 10 }, to: { x: 120 + demandShift, y: 0 } },
      imbalance, status: Math.abs(imbalance) < 0.01 ? "equilibrium" : imbalance > 0 ? "excess demand" : "excess supply",
    };
  };
}

export {
  initializeMoneyMarketManifest as a, initializeMoneyMarketModel as i, interestRateControl as n,
  moneyMarketManifest as o, calculateMoneyMarket as r, marketChanges as t,
};
