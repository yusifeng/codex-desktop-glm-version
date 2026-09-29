// Henderson-Hasselbalch buffer metadata. Release chunk: type-2c1c76fd09a3.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "BIOLOGICAL_PH_AND_BUFFERS";
  version: 2;
  thumbnailAssetKey: "biological-ph-and-buffers-v1";
  canonicalFormula: string;
  parameters: {
    pKa: { kind: "number"; defaultValue: 7.2; min: 4.5; max: 9.5 };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "BIOLOGICAL_PH_AND_BUFFERS",
    version: 2,
    thumbnailAssetKey: "biological-ph-and-buffers-v1",
    canonicalFormula:
      "\\mathrm{pH}=\\mathrm{p}K_a+\\log_{10}\\!\\left(\\frac{[A^-]}{[HA]}\\right)",
    parameters: {
      pKa: { kind: "number", defaultValue: 7.2, min: 4.5, max: 9.5 },
    },
  };
}
export { specification as n, initialize as t };
