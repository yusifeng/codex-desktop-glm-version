// Chi-square goodness-of-fit counts. Release chunk: type-85ee1f375ae5.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "CHI_SQUARE_GOODNESS_OF_FIT";
  version: 1;
  thumbnailAssetKey: "chi-square-goodness-of-fit-v1";
  canonicalFormula: string;
  parameters: Record<
    "observedA" | "observedB" | "observedC" | "observedD",
    { kind: "integer"; defaultValue: number; min: 5; max: 60 }
  >;
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "CHI_SQUARE_GOODNESS_OF_FIT",
    version: 1,
    thumbnailAssetKey: "chi-square-goodness-of-fit-v1",
    canonicalFormula: "\\chi^2 = \\sum \\frac{(O_i-E_i)^2}{E_i}",
    parameters: {
      observedA: { kind: "integer", defaultValue: 18, min: 5, max: 60 },
      observedB: { kind: "integer", defaultValue: 22, min: 5, max: 60 },
      observedC: { kind: "integer", defaultValue: 27, min: 5, max: 60 },
      observedD: { kind: "integer", defaultValue: 33, min: 5, max: 60 },
    },
  };
}
export { specification as n, initialize as t };
