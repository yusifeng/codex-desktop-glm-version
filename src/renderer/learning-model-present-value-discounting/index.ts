// Present-value learning model: discount a fixed future value of 100.
import "@rchunk/rolldown-runtime";

interface NumericControl {
  defaultValue: number;
  label: string;
  max: number;
  min: number;
  step: number;
  thumbnailDefaultValue: number;
}
interface PresentValueValues { discountRate?: number | null; years?: number | null }
interface PresentValueState { discountFactor: number; discountRate: number; presentValue: number; years: number }

const discountRateControl: NumericControl = { label: "r", min: 0, max: 20, step: 0.5, defaultValue: 8, thumbnailDefaultValue: 14 };
const yearsControl: NumericControl = { label: "n", min: 1, max: 10, step: 1, defaultValue: 5, thumbnailDefaultValue: 8 };
const presentValueSchema = { properties: { discountRate: discountRateControl, years: yearsControl } };

const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const finiteOr = (value: number | null | undefined, fallback: number): number => Number.isFinite(value) ? value as number : fallback;

function normalizePresentValueValues(values: PresentValueValues): Pick<PresentValueState, "discountRate" | "years"> {
  return {
    discountRate: clamp(finiteOr(values.discountRate, discountRateControl.defaultValue), discountRateControl.min, discountRateControl.max),
    years: Math.round(clamp(finiteOr(values.years, yearsControl.defaultValue), yearsControl.min, yearsControl.max)),
  };
}

function calculatePresentValue(values: PresentValueValues): PresentValueState {
  const normalized = normalizePresentValueValues(values);
  const discountFactor = 1 / (1 + normalized.discountRate / 100) ** normalized.years;
  return { ...normalized, discountFactor, presentValue: 100 * discountFactor };
}

function initializePresentValueDiscountingModel(): void {}

export {
  initializePresentValueDiscountingModel as a,
  calculatePresentValue as i,
  presentValueSchema as n,
  normalizePresentValueValues as o,
  yearsControl as r,
  discountRateControl as t,
};
