// Mirror-equation formula metadata. Release chunk: type-dc0d0206de54.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "MIRROR_EQUATION";
  version: 2;
  thumbnailAssetKey: "mirror-equation-v1";
  canonicalFormula: string;
  canonicalFormulaAliases: string[];
  parameters: {
    objectDistance: { kind: "number"; defaultValue: 28; min: 0.01; max: 10000 };
    focalLength: { kind: "number"; defaultValue: 14; min: -10000; max: 10000 };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "MIRROR_EQUATION",
    version: 2,
    thumbnailAssetKey: "mirror-equation-v1",
    canonicalFormula: "\\frac{1}{f} = \\frac{1}{u} + \\frac{1}{v}",
    canonicalFormulaAliases: [
      "\\frac{1}{f} = \\frac{1}{a} + \\frac{1}{b}",
      "1/f=1/v+1/u",
      "1/f=1/b+1/a",
      "1/u+1/v=1/f",
      "1/v+1/u=1/f",
      "1/a+1/b=1/f",
      "1/b+1/a=1/f",
    ],
    parameters: {
      objectDistance: {
        kind: "number",
        defaultValue: 28,
        min: 0.01,
        max: 10000,
      },
      focalLength: {
        kind: "number",
        defaultValue: 14,
        min: -10000,
        max: 10000,
      },
    },
  };
}
export { specification as n, initialize as t };
