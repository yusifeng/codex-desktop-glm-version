// Period/frequency relation metadata. Release chunk: type-9c26345ce2cb.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "PERIOD_FREQUENCY_RELATION";
  version: 1;
  thumbnailAssetKey: "period-frequency-relation-v1";
  canonicalFormula: string;
  canonicalFormulaAliases: string[];
  parameters: {
    period: { kind: "number"; defaultValue: 2; min: 0.01; max: 1000 };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "PERIOD_FREQUENCY_RELATION",
    version: 1,
    thumbnailAssetKey: "period-frequency-relation-v1",
    canonicalFormula: "f = \\frac{1}{T}",
    canonicalFormulaAliases: [
      "T = \\frac{1}{f}",
      "T = 1 / f",
      "1/t=f",
      "1/f=t",
      "t=2pi/omega",
      "2pi/omega=t",
      "tau=60/nz",
      "60/nz=tau",
    ],
    parameters: {
      period: { kind: "number", defaultValue: 2, min: 0.01, max: 1000 },
    },
  };
}
export { specification as n, initialize as t };
