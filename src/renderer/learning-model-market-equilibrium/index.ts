// Supply-and-demand equilibrium teaching model. Release chunk: model-659be7554447.js.
import "@rchunk/rolldown-runtime";

interface MarketEquilibriumInput { scenario?: number }

const marketScenarioDefaults = { scenario: 0 };
const marketChartBounds = { quantityMin: 0, quantityMax: 16, rateMin: 0, rateMax: 20 };
const demandIntercept = 18;
const supplyIntercept = 2;
const normalizeScenario = (scenario: number | undefined): number =>
  scenario === 1 || scenario === 2 || scenario === 3 ? scenario : 0;
const calculateMarketEquilibrium = (input: MarketEquilibriumInput) => {
  const scenario = normalizeScenario(input.scenario);
  const demandShift = scenario === 1 ? 2 : scenario === 3 ? 3 : 0;
  const supplyShift = scenario === 2 ? 2 : 0;
  const quantity = (16 + demandShift + supplyShift) / 2;
  const rate = demandIntercept + demandShift - quantity;
  return { scenario, demandShift, supplyShift, quantity, rate, reciprocalRate: 1 / rate };
};
const demandRateAtQuantity = (quantity: number, shift = 0): number => demandIntercept + shift - quantity;
const supplyRateAtQuantity = (quantity: number, shift = 0): number => supplyIntercept - shift + quantity;
function initializeMarketEquilibriumModel(): void {}

export { supplyRateAtQuantity as a, demandRateAtQuantity as i, marketScenarioDefaults as n, initializeMarketEquilibriumModel as o, calculateMarketEquilibrium as r, marketChartBounds as t };
