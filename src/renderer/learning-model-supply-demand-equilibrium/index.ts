// Supply-and-demand learning model: solve the shifted linear-market equilibrium.
import "@rchunk/rolldown-runtime";

interface MarketValues { demandShift?: number | null; supplyShift?: number | null }
interface MarketShifts { demandShift: number; supplyShift: number }

const shiftControl = { min: -20, max: 20, step: 1 };
const defaultMarketValues: MarketShifts = { demandShift: 0, supplyShift: 0 };
const marketBounds = { quantityMin: 0, quantityMax: 100, priceMin: 0, priceMax: 100 };
const demandIntercept = 84;
const demandSlope = 0.7;
const supplySlope = 0.6;

const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const normalizeShift = (value: number | null | undefined): number =>
  Number.isFinite(value) ? clamp(value as number, shiftControl.min, shiftControl.max) : 0;

function normalizeMarketValues(values: MarketValues): MarketShifts {
  return { demandShift: normalizeShift(values.demandShift), supplyShift: normalizeShift(values.supplyShift) };
}

const demandPrice = (quantity: number, demandShift: number): number =>
  demandIntercept - demandSlope * quantity + demandSlope * demandShift;

function calculateMarketEquilibrium(values: MarketValues): { price: number; quantity: number } {
  const shifts = normalizeMarketValues(values);
  const quantity = (68 + demandSlope * shifts.demandShift + supplySlope * shifts.supplyShift) / 1.2999999999999998;
  const price = demandPrice(quantity, shifts.demandShift);
  return {
    quantity: clamp(quantity, marketBounds.quantityMin, marketBounds.quantityMax),
    price: clamp(price, marketBounds.priceMin, marketBounds.priceMax),
  };
}

function initializeSupplyDemandEquilibriumModel(): void {}

export {
  initializeSupplyDemandEquilibriumModel as a,
  calculateMarketEquilibrium as i,
  defaultMarketValues as n,
  normalizeMarketValues as o,
  shiftControl as r,
  marketBounds as t,
};
