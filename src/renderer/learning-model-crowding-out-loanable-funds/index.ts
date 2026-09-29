// Crowding-out learning model: government borrowing shifts demand for loanable funds.
import "@rchunk/rolldown-runtime";

type FundSupplyElasticity = "less" | "more";

interface LoanableFundsValues {
  governmentBorrowing?: number | null;
  fundSupplyElasticity?: unknown;
}

interface NormalizedLoanableFundsValues {
  governmentBorrowing: number;
  fundSupplyElasticity: FundSupplyElasticity;
}

const governmentBorrowingControl = { min: 0, max: 30, step: 1 };
const loanableFundsBounds = { quantityMin: 0, quantityMax: 100, rateMin: 0, rateMax: 10 };
const investmentDemandSlope = 0.08;
const defaultLoanableFundsValues: NormalizedLoanableFundsValues = {
  governmentBorrowing: 18,
  fundSupplyElasticity: "less",
};

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

function normalizeLoanableFundsValues(values: LoanableFundsValues): NormalizedLoanableFundsValues {
  return {
    governmentBorrowing:
      typeof values.governmentBorrowing === "number" && Number.isFinite(values.governmentBorrowing)
        ? clamp(values.governmentBorrowing, governmentBorrowingControl.min, governmentBorrowingControl.max)
        : defaultLoanableFundsValues.governmentBorrowing,
    fundSupplyElasticity: values.fundSupplyElasticity === "more" ? "more" : "less",
  };
}

function calculateCrowdingOut(values: LoanableFundsValues) {
  const normalized = normalizeLoanableFundsValues(values);
  const supplySlope = normalized.fundSupplyElasticity === "less" ? 0.13 : 0.035;
  const totalQuantity = 50 + (investmentDemandSlope * normalized.governmentBorrowing) / (investmentDemandSlope + supplySlope);
  const equilibriumRate = 4 + supplySlope * (totalQuantity - 50);
  const privateInvestment = totalQuantity - normalized.governmentBorrowing;
  return {
    ...normalized,
    baselineQuantity: 50,
    baselineRate: 4,
    totalQuantity,
    equilibriumRate,
    privateInvestment,
    privateInvestmentDecline: 50 - privateInvestment,
    rateIncrease: equilibriumRate - 4,
    supplySlope,
  };
}

const investmentDemandRate = (quantity: number): number => 4 - investmentDemandSlope * (quantity - 50);
const shiftedInvestmentDemandRate = (quantity: number, governmentBorrowing: number): number =>
  investmentDemandRate(quantity - governmentBorrowing);
const fundSupplyRate = (quantity: number, supplySlope: number): number => 4 + supplySlope * (quantity - 50);

function initializeCrowdingOutLoanableFundsModel(): void {}

export {
  calculateCrowdingOut as a,
  shiftedInvestmentDemandRate as c,
  investmentDemandSlope as i,
  initializeCrowdingOutLoanableFundsModel as l,
  defaultLoanableFundsValues as n,
  fundSupplyRate as o,
  governmentBorrowingControl as r,
  investmentDemandRate as s,
  loanableFundsBounds as t,
  normalizeLoanableFundsValues as u,
};
