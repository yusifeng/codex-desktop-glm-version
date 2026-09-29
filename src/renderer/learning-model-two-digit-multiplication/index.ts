// Two-digit multiplication decomposed into four place-value products.
import "@rchunk/rolldown-runtime";

interface IntegerParameter { kind: "integer"; defaultValue: number; min: number; max: number }
interface TwoDigitMultiplicationValues { factor1?: number | null; factor2?: number | null; lessonStep?: number | null }

const twoDigitMultiplicationType = "TWO_DIGIT_MULTIPLY";
const twoDigitMultiplicationThumbnail = "two-digit-multiply-v2";
const twoDigitMultiplicationParameters: { factor1: IntegerParameter; factor2: IntegerParameter } = {
  factor1: { kind: "integer", defaultValue: 24, min: 10, max: 99 },
  factor2: { kind: "integer", defaultValue: 87, min: 10, max: 99 },
};
const twoDigitMultiplicationSpecification = { type: twoDigitMultiplicationType, version: 1, thumbnailAssetKey: twoDigitMultiplicationThumbnail, parameters: twoDigitMultiplicationParameters };
const factor1Control = { ...twoDigitMultiplicationSpecification.parameters.factor1, step: 1 };
const factor2Control = { ...twoDigitMultiplicationSpecification.parameters.factor2, step: 1 };
const lessonStepControl = { min: 1, max: 7, step: 1, defaultValue: 1 };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const normalizeInteger = (value: number | null | undefined, control: { defaultValue: number; min: number; max: number }): number => Number.isFinite(value) ? clamp(Math.round(value ?? control.defaultValue), control.min, control.max) : control.defaultValue;
const normalizeTwoDigitMultiplicationValues = (values: TwoDigitMultiplicationValues) => ({ factor1: normalizeInteger(values.factor1, factor1Control), factor2: normalizeInteger(values.factor2, factor2Control), lessonStep: normalizeInteger(values.lessonStep, lessonStepControl) });
const calculateTwoDigitMultiplication = (values: TwoDigitMultiplicationValues) => {
  const { factor1, factor2, lessonStep } = normalizeTwoDigitMultiplicationValues(values);
  const factor1TensDigit = Math.floor(factor1 / 10);
  const factor1TensValue = factor1TensDigit * 10;
  const factor1Ones = factor1 % 10;
  const factor2TensDigit = Math.floor(factor2 / 10);
  const factor2TensValue = factor2TensDigit * 10;
  const factor2Ones = factor2 % 10;
  const terms = [
    { id: "ones-ones", left: factor1Ones, right: factor2Ones, product: factor1Ones * factor2Ones, stage: 1 },
    { id: "tens-ones", left: factor1TensValue, right: factor2Ones, product: factor1TensValue * factor2Ones, stage: 2 },
    { id: "ones-tens", left: factor1Ones, right: factor2TensValue, product: factor1Ones * factor2TensValue, stage: 3 },
    { id: "tens-tens", left: factor1TensValue, right: factor2TensValue, product: factor1TensValue * factor2TensValue, stage: 4 },
  ];
  const onesPartial = factor1 * factor2Ones;
  const tensPartial = factor1 * factor2TensValue;
  const product = factor1 * factor2;
  if (terms.reduce((sum, term) => sum + term.product, 0) !== product || onesPartial + tensPartial !== product) throw Error("Two-digit multiplication analysis is inconsistent.");
  return { factor1, factor2, lessonStep, factor1TensDigit, factor1TensValue, factor1Ones, factor2TensDigit, factor2TensValue, factor2Ones, onesPartial, tensPartial, product, terms };
};

function initializeTwoDigitMultiplicationSpecification(): void {}
function initializeTwoDigitMultiplicationModel(): void {}

export { initializeTwoDigitMultiplicationModel as a, twoDigitMultiplicationSpecification as c, calculateTwoDigitMultiplication as i, factor2Control as n, normalizeTwoDigitMultiplicationValues as o, lessonStepControl as r, initializeTwoDigitMultiplicationSpecification as s, factor1Control as t };
