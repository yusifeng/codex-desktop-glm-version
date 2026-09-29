// Mass-density-volume formula metadata. Release chunk: type-dd4d43aba596.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "MASS_DENSITY_VOLUME_RELATION";
  version: 2;
  thumbnailAssetKey: "mass-density-volume-relation-v1";
  canonicalFormula: string;
  canonicalFormulaAliases: string[];
  parameters: {
    mass: { kind: "number"; defaultValue: 12; min: 0.01; max: 10000 };
    volume: { kind: "number"; defaultValue: 5; min: 0.01; max: 10000 };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "MASS_DENSITY_VOLUME_RELATION",
    version: 2,
    thumbnailAssetKey: "mass-density-volume-relation-v1",
    canonicalFormula: "\\rho = \\frac{m}{V}",
    canonicalFormulaAliases: [
      "m = \\rho V",
      "rho = m / V",
      "rho=m/v",
      "d=m/v",
      "m=rho v",
      "m=dv",
      "v=m/rho",
      "v=m/d",
      "m/v=rho",
      "m/v=d",
    ],
    parameters: {
      mass: { kind: "number", defaultValue: 12, min: 0.01, max: 10000 },
      volume: { kind: "number", defaultValue: 5, min: 0.01, max: 10000 },
    },
  };
}
export { specification as n, initialize as t };
