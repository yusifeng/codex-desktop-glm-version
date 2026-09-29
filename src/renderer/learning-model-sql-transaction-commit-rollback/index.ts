// SQL transaction model contrasting COMMIT with ROLLBACK after a transfer.
import "@rchunk/rolldown-runtime";

interface NumberParameter { kind: "number"; defaultValue: number; min: number; max: number; multipleOf: number }
interface SqlTransactionValues { ending?: number; step?: number; transfer_amount?: number | null }

const sqlTransactionType = "SQL_TRANSACTION_COMMIT_ROLLBACK";
const sqlTransactionThumbnail = "sql-transaction-commit-rollback-v1";
const sqlTransactionParameters: { transfer_amount: NumberParameter } = {
  transfer_amount: { kind: "number", defaultValue: 150, min: 25, max: 500, multipleOf: 1 },
};
const sqlTransactionSpecification = {
  type: sqlTransactionType,
  version: 2,
  thumbnailAssetKey: sqlTransactionThumbnail,
  parameters: sqlTransactionParameters,
};
const transferAmountParameter = sqlTransactionSpecification.parameters.transfer_amount;
const startingBalances: [number, number] = [800, 200];
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const defaultSqlTransactionValues = () => ({ ending: 0, step: 2, transfer_amount: transferAmountParameter.defaultValue });

function calculateSqlTransaction(values: SqlTransactionValues) {
  const transferCandidate =
    typeof values.transfer_amount === "number" && Number.isFinite(values.transfer_amount)
      ? values.transfer_amount
      : transferAmountParameter.defaultValue;
  const amount = clamp(
    Math.round(transferCandidate / transferAmountParameter.multipleOf) * transferAmountParameter.multipleOf,
    transferAmountParameter.min,
    transferAmountParameter.max,
  );
  const stepCandidate = typeof values.step === "number" && Number.isFinite(values.step) ? values.step : 2;
  const step = clamp(Math.round(stepCandidate), 0, 3);
  const ending = Number(values.ending === 1);
  const provisional: [number, number] = [
    startingBalances[0] - (step >= 1 ? amount : 0),
    startingBalances[1] + (step >= 2 ? amount : 0),
  ];
  const final: [number, number] = ending === 0
    ? [startingBalances[0] - amount, startingBalances[1] + amount]
    : startingBalances;
  return {
    amount,
    current: step === 3 ? final : provisional,
    ending,
    final,
    start: startingBalances,
    step,
    transactionActive: step < 3,
  };
}

function initializeSqlTransactionSpecification(): void {}
function initializeSqlTransactionModel(): void {}

export {
  sqlTransactionSpecification as a,
  initializeSqlTransactionSpecification as i,
  defaultSqlTransactionValues as n,
  initializeSqlTransactionModel as r,
  calculateSqlTransaction as t,
};
