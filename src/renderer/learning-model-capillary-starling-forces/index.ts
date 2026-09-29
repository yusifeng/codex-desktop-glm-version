// Capillary Starling-force scenario metadata. Release chunk: type-a9d2bd86b24e.js.
import "@rchunk/rolldown-runtime";
type Scenario =
  | "typical-systemic-capillary"
  | "raised-capillary-hydrostatic-pressure"
  | "reduced-plasma-oncotic-pressure"
  | "raised-interstitial-oncotic-pressure"
  | "raised-interstitial-hydrostatic-pressure";
interface Specification {
  type: "CAPILLARY_STARLING_FORCES";
  version: 1;
  thumbnailAssetKey: "capillary-starling-forces-v3";
  canonicalFormula: string;
  parameters: {
    initial_scenario: {
      kind: "enum";
      defaultValue: Scenario;
      allowedValues: Scenario[];
    };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "CAPILLARY_STARLING_FORCES",
    version: 1,
    thumbnailAssetKey: "capillary-starling-forces-v3",
    canonicalFormula: "J_v=K_f[(P_c-P_i)-\\sigma(\\pi_c-\\pi_i)]",
    parameters: {
      initial_scenario: {
        kind: "enum",
        defaultValue: "typical-systemic-capillary",
        allowedValues: [
          "typical-systemic-capillary",
          "raised-capillary-hydrostatic-pressure",
          "reduced-plasma-oncotic-pressure",
          "raised-interstitial-oncotic-pressure",
          "raised-interstitial-hydrostatic-pressure",
        ],
      },
    },
  };
}
export { specification as n, initialize as t };
