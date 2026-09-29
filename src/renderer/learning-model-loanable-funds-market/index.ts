// Loanable-funds market learning model with saving and investment shifts.
import "@rchunk/rolldown-runtime";

interface LoanableFundsValues { scenario?: number | null }

const loanableFundsGraphBounds = { quantityMin: 0, quantityMax: 100, rateMin: 0, rateMax: 10 };
const defaultLoanableFundsValues = { scenario: 0 };
const shiftMagnitude = 20;
const savingBaseRate = 1.5;
const investmentBaseRate = 8.5;
const slope = 0.07;

function normalizeScenario(value: number | null | undefined): number {
  return Number.isFinite(value) ? Math.min(4, Math.max(0, Math.round(value ?? 0))) : 0;
}

const savingRate = (quantity: number, shift = 0): number => savingBaseRate + slope * (quantity - shift);
const investmentRate = (quantity: number, shift = 0): number => investmentBaseRate - slope * (quantity - shift);

function calculateLoanableFundsEquilibrium(values: LoanableFundsValues) {
  const scenario = normalizeScenario(values.scenario);
  const savingShift = scenario === 1 ? shiftMagnitude : scenario === 2 ? -shiftMagnitude : 0;
  const investmentShift = scenario === 3 ? shiftMagnitude : scenario === 4 ? -shiftMagnitude : 0;
  const quantity = (7 + slope * savingShift + slope * investmentShift) / (2 * slope);
  return {
    scenario,
    savingShift,
    investmentShift,
    equilibrium: { quantity, realRate: savingRate(quantity, savingShift) },
  };
}

const defaultLoanableFundsEquilibrium = calculateLoanableFundsEquilibrium(defaultLoanableFundsValues).equilibrium;
function initializeLoanableFundsMarketModel(): void {}

export {
  investmentRate as a,
  calculateLoanableFundsEquilibrium as i,
  defaultLoanableFundsValues as n,
  savingRate as o,
  loanableFundsGraphBounds as r,
  initializeLoanableFundsMarketModel as s,
  defaultLoanableFundsEquilibrium as t,
};
