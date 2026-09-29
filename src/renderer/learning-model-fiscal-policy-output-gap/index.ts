// Fiscal-policy learning model for closing recessionary and inflationary gaps.
import "@rchunk/rolldown-runtime";

interface FiscalPolicyValues {
  fiscalAction?: number | null;
  startingGap?: number | null;
}

interface FiscalPolicyState {
  closesGap: boolean;
  expansionary: boolean;
  finalAdIntercept: number;
  finalOutput: number;
  finalPrice: number;
  fiscalAction: number;
  initialAdIntercept: number;
  initialOutput: number;
  initialPrice: number;
  potentialOutput: number;
  startingGap: number;
}

const defaultFiscalPolicyValues = { startingGap: 0, fiscalAction: 0 };
const fiscalPolicyGraphBounds = { outputMin: 20, outputMax: 112, priceMin: 12, priceMax: 116 };

function calculateFiscalPolicyOutcome(values: FiscalPolicyValues): FiscalPolicyState {
  const startingGap = +(Number(values.startingGap) >= 0.5);
  const fiscalAction = Number(values.fiscalAction) < 0.5
    ? 0
    : Number(values.fiscalAction) < 1.5
      ? 1
      : Number(values.fiscalAction) < 2.5
        ? 2
        : 3;
  const expansionary = fiscalAction === 0 || fiscalAction === 2;
  const closesGap = expansionary === (startingGap === 0);
  const initialOutput = startingGap === 0 ? 48 : 84;
  const finalOutput = initialOutput + (expansionary ? 18 : -18);
  const initialPrice = 0.6 * initialOutput + 15;
  const finalPrice = 0.6 * finalOutput + 15;
  return {
    startingGap,
    fiscalAction,
    expansionary,
    closesGap,
    potentialOutput: 66,
    initialOutput,
    finalOutput,
    initialPrice,
    finalPrice,
    initialAdIntercept: initialPrice + 0.55 * initialOutput,
    finalAdIntercept: finalPrice + 0.55 * finalOutput,
  };
}

function initializeFiscalPolicyOutputGapModel(): void {}

export {
  initializeFiscalPolicyOutputGapModel as i,
  fiscalPolicyGraphBounds as n,
  calculateFiscalPolicyOutcome as r,
  defaultFiscalPolicyValues as t,
};
