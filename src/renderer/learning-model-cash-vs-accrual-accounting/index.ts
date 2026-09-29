// Cash-basis versus accrual-basis accounting learning model.
import "@rchunk/rolldown-runtime";

type TransactionKind = "expense" | "revenue";
type CashTiming = "followingPeriod" | "samePeriod";

interface AccountingValues {
  cashTiming?: unknown;
  transactionKind?: unknown;
}

interface NormalizedAccountingValues {
  cashTiming: CashTiming;
  transactionKind: TransactionKind;
}

interface AccountingState {
  accrualBasis: [number, number];
  amount: number;
  cashBasis: [number, number];
  values: NormalizedAccountingValues;
}

const transactionKinds: readonly TransactionKind[] = ["revenue", "expense"];
const cashTimings: readonly CashTiming[] = ["samePeriod", "followingPeriod"];
const defaultAccountingValues: NormalizedAccountingValues = {
  transactionKind: "revenue",
  cashTiming: "followingPeriod",
};

const isTransactionKind = (value: unknown): value is TransactionKind =>
  typeof value === "string" && transactionKinds.some((kind) => kind === value);

const isCashTiming = (value: unknown): value is CashTiming =>
  typeof value === "string" && cashTimings.some((timing) => timing === value);

function normalizeAccountingValues(values: AccountingValues): NormalizedAccountingValues {
  return {
    transactionKind: isTransactionKind(values.transactionKind)
      ? values.transactionKind
      : defaultAccountingValues.transactionKind,
    cashTiming: isCashTiming(values.cashTiming)
      ? values.cashTiming
      : defaultAccountingValues.cashTiming,
  };
}

function calculateAccountingRecognition(values: AccountingValues): AccountingState {
  const normalized = normalizeAccountingValues(values);
  const amount = normalized.transactionKind === "revenue" ? 1200 : 600;
  return {
    values: normalized,
    amount,
    cashBasis: normalized.cashTiming === "samePeriod" ? [amount, 0] : [0, amount],
    accrualBasis: [amount, 0],
  };
}

function initializeCashVsAccrualAccountingModel(): void {}

export {
  normalizeAccountingValues as i,
  calculateAccountingRecognition as n,
  initializeCashVsAccrualAccountingModel as r,
  defaultAccountingValues as t,
};
