// Ohm's law specification. Release chunk: type-61dd1475bb3a.js.
import "@rchunk/rolldown-runtime";

interface Specification {
  type: "OHMS_LAW";
  version: 1;
  thumbnailAssetKey: "ohms-law-v1";
  canonicalFormula: "I = \\frac{V}{R}";
  canonicalFormulaAliases: string[];
  parameters: {
    voltage: { kind: "number"; defaultValue: 12; min: 0; max: 1_000 };
    resistance: { kind: "number"; defaultValue: 6; min: 0.1; max: 100_000 };
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "OHMS_LAW",
    version: 1,
    thumbnailAssetKey: "ohms-law-v1",
    canonicalFormula: "I = \\frac{V}{R}",
    canonicalFormulaAliases: [
      "V = IR",
      "V = I \\cdot R",
      "V = I \\times R",
      "\\Delta V = IR",
      "u = ri",
      "v=ri",
      "ir=v",
      "ri=v",
      "i=\\Delta V/R",
      "i=(1/r)v",
      "i=v(1/r)",
      "i=1/r(v)",
      "r=v/i",
      "r=\\Delta V/i",
      "ri=u",
      "i=u/r",
      "i=(1/r)u",
      "i=u(1/r)",
      "i=1/r(u)",
      "r=u/i",
      "i=(v-v)/r",
      "(v-v)/r=i",
      "r=(v-v)/i",
      "(v-v)/i=r",
    ],
    parameters: {
      voltage: { kind: "number", defaultValue: 12, min: 0, max: 1_000 },
      resistance: { kind: "number", defaultValue: 6, min: 0.1, max: 100_000 },
    },
  };
}
export { specification as n, initializeSpecification as t };
