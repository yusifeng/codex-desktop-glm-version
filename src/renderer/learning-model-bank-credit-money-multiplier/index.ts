// Bank-credit money-multiplier learning model.
import "@rchunk/rolldown-runtime";

interface MoneyMultiplierValues { initialDepositUsd?: number | null; reserveRatioPercent?: number | null }

const moneyMultiplierType = "BANK_CREDIT_MONEY_MULTIPLIER";
const moneyMultiplierThumbnail = "bank-credit-money-multiplier-v2";
const moneyMultiplierFormula = "m = \\frac{1}{r}";
const moneyMultiplierParameters = {
  initialDepositUsd: { kind: "number", defaultValue: 1000, min: 100, max: 2000 },
  reserveRatioPercent: { kind: "number", defaultValue: 10, min: 5, max: 50 },
};
const moneyMultiplierDefinition = { type: moneyMultiplierType, version: 2, thumbnailAssetKey: moneyMultiplierThumbnail, canonicalFormula: moneyMultiplierFormula, parameters: moneyMultiplierParameters };
const initialDepositParameter = moneyMultiplierDefinition.parameters.initialDepositUsd;
const reserveRatioParameter = moneyMultiplierDefinition.parameters.reserveRatioPercent;
const defaultMoneyMultiplierValues = { initialDepositUsd: initialDepositParameter.defaultValue, reserveRatioPercent: reserveRatioParameter.defaultValue };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const normalizeNumber = (value: number | null | undefined, fallback: number, minimum: number, maximum: number): number =>
  clamp(typeof value === "number" && Number.isFinite(value) ? value : fallback, minimum, maximum);
const normalizeMoneyMultiplierValues = (values: MoneyMultiplierValues) => ({
  initialDepositUsd: normalizeNumber(values.initialDepositUsd, initialDepositParameter.defaultValue, initialDepositParameter.min, initialDepositParameter.max),
  reserveRatioPercent: normalizeNumber(values.reserveRatioPercent, reserveRatioParameter.defaultValue, reserveRatioParameter.min, reserveRatioParameter.max),
});

function calculateMoneyMultiplier(values: MoneyMultiplierValues, roundCount = 4) {
  const normalized = normalizeMoneyMultiplierValues(values);
  const reserveRate = normalized.reserveRatioPercent / 100;
  const lendingRate = 1 - reserveRate;
  const rounds: Array<{ deposit: number; loan: number; reserve: number }> = [];
  let nextDeposit = normalized.initialDepositUsd;
  for (let index = 0; index < roundCount; index += 1) {
    const reserve = nextDeposit * reserveRate;
    const loan = nextDeposit - reserve;
    rounds.push({ deposit: nextDeposit, loan, reserve });
    nextDeposit = loan;
  }
  const cumulativeDepositsShown = rounds.reduce((total, round) => total + round.deposit, 0);
  const simpleDepositMultiplier = 1 / reserveRate;
  const fullChainDepositLimit = normalized.initialDepositUsd * simpleDepositMultiplier;
  return {
    ...normalized,
    additionalDeposits: fullChainDepositLimit - normalized.initialDepositUsd,
    cumulativeDepositsShown,
    fullChainDepositLimit,
    lendingRate,
    nextDeposit,
    reserveRate,
    rounds,
    simpleDepositMultiplier,
    visibleProgress: cumulativeDepositsShown / fullChainDepositLimit,
  };
}

function initializeMoneyMultiplierSchema(): void {}
function initializeMoneyMultiplierModel(): void {}

export {
  moneyMultiplierDefinition as a,
  initializeMoneyMultiplierSchema as i,
  calculateMoneyMultiplier as n,
  initializeMoneyMultiplierModel as r,
  defaultMoneyMultiplierValues as t,
};
