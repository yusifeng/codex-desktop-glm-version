// Formal-charge example selector. Release chunk: type-7c6088477dd8.js.
import "@rchunk/rolldown-runtime";
type FormalChargeExample =
  "carbon-dioxide-candidates" | "nitrite-resonance" | "ammonium";
interface Specification {
  type: "FORMAL_CHARGE";
  version: 2;
  thumbnailAssetKey: "formal-charge-v1";
  parameters: {
    example: {
      kind: "enum";
      defaultValue: FormalChargeExample;
      allowedValues: FormalChargeExample[];
    };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "FORMAL_CHARGE",
    version: 2,
    thumbnailAssetKey: "formal-charge-v1",
    parameters: {
      example: {
        kind: "enum",
        defaultValue: "carbon-dioxide-candidates",
        allowedValues: [
          "carbon-dioxide-candidates",
          "nitrite-resonance",
          "ammonium",
        ],
      },
    },
  };
}
export { specification as n, initialize as t };
