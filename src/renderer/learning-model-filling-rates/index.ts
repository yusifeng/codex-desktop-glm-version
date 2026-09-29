// Filling-rates learning-model manifest. Release chunk: type-419e85f400c3.js.
import "@rchunk/rolldown-runtime";

const fillingRatesSpecification = {
  type: "FILLING_RATES",
  version: 1,
  thumbnailAssetKey: "filling-rates-v2",
  canonicalFormula: "r_{\\mathrm{net}}=r_{\\mathrm{in}}-r_{\\mathrm{out}}",
  parameters: {
    inflowRateLitersPerMinute: { kind: "number" as const, defaultValue: 6, min: 0, max: 8 },
    outflowRateLitersPerMinute: { kind: "number" as const, defaultValue: 2, min: 0, max: 8 },
  },
};

function initializeFillingRatesSpecification(): void {}

export { fillingRatesSpecification as n, initializeFillingRatesSpecification as t };
