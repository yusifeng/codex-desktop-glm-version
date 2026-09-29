// Buffer composition specification. Release chunk: type-b5d60db25e60.js.
import "@rchunk/rolldown-runtime";

interface NumberParameter {
  kind: "number";
  defaultValue: number;
  min: number;
  max: number;
}
interface Specification {
  type: "BUFFER_COMPOSITION";
  version: 2;
  thumbnailAssetKey: "buffer-composition-v1";
  canonicalFormula: "\\mathrm{pH}=\\mathrm{p}K_a+\\log_{10}\\!\\left(\\frac{[A^-]}{[HA]}\\right)";
  parameters: { pKa: NumberParameter; baseToAcidRatio: NumberParameter };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "BUFFER_COMPOSITION",
    version: 2,
    thumbnailAssetKey: "buffer-composition-v1",
    canonicalFormula:
      "\\mathrm{pH}=\\mathrm{p}K_a+\\log_{10}\\!\\left(\\frac{[A^-]}{[HA]}\\right)",
    parameters: {
      pKa: { kind: "number", defaultValue: 4.76, min: 2, max: 12 },
      baseToAcidRatio: { kind: "number", defaultValue: 1, min: 0.01, max: 100 },
    },
  };
}
export { specification as n, initializeSpecification as t };
