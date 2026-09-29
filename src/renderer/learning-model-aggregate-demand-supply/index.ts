// Aggregate-demand and short-run aggregate-supply shock model.
import "@rchunk/rolldown-runtime";

interface AggregateShockValues { shock?: number }
type AggregateShockState = { demandShift: number; supplyShift: number };

const aggregateMarketBounds = {
  realGdpMin: 60,
  realGdpMax: 140,
  priceLevelMin: 60,
  priceLevelMax: 140,
  potentialOutput: 100,
};
const defaultAggregateShock = { shock: 0 };
const aggregateShockScenarios: AggregateShockState[] = [
  { demandShift: 0, supplyShift: 0 },
  { demandShift: 24, supplyShift: 0 },
  { demandShift: -24, supplyShift: 0 },
  { demandShift: 0, supplyShift: 24 },
  { demandShift: 0, supplyShift: -24 },
];
const curvature = 0.004;

const aggregateDemandPrice = (realGdp: number, demandShift: number): number =>
  200 - realGdp + curvature * (realGdp - 100) ** 2 + demandShift;
const shortRunAggregateSupplyPrice = (realGdp: number, supplyShift: number): number =>
  realGdp + curvature * (realGdp - 100) ** 2 - supplyShift;

function calculateAggregateEquilibrium(values: AggregateShockValues) {
  const candidate = values.shock;
  const rounded = typeof candidate === "number" && Number.isFinite(candidate) ? Math.round(candidate) : 0;
  const shock = rounded <= 0 ? 0 : rounded === 1 ? 1 : rounded === 2 ? 2 : rounded === 3 ? 3 : 4;
  const { demandShift, supplyShift } = aggregateShockScenarios[shock];
  const realGdp = 100 + (demandShift + supplyShift) / 2;
  return { shock, demandShift, supplyShift, realGdp, priceLevel: aggregateDemandPrice(realGdp, demandShift) };
}

function sampleAggregateCurve(curve: (realGdp: number) => number) {
  return Array.from({ length: 41 }, (_unused, index) => {
    const x = aggregateMarketBounds.realGdpMin + index * 2;
    return { x, y: curve(x) };
  }).filter(({ y }) => y >= aggregateMarketBounds.priceLevelMin && y <= aggregateMarketBounds.priceLevelMax);
}

function initializeAggregateDemandSupplyModel(): void {}

export {
  aggregateDemandPrice as a,
  sampleAggregateCurve as i,
  defaultAggregateShock as n,
  shortRunAggregateSupplyPrice as o,
  calculateAggregateEquilibrium as r,
  initializeAggregateDemandSupplyModel as s,
  aggregateMarketBounds as t,
};
