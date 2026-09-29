// Element/compound/mixture sample selector. Release chunk: type-ea91da6d3b05.js.
import "@rchunk/rolldown-runtime";
type Sample =
  | "monatomic element"
  | "diatomic element"
  | "molecular compound"
  | "mixture of elements"
  | "mixture of element and compound"
  | "mixture of compounds";
interface Specification {
  type: "ELEMENT_VS_COMPOUND_VS_MIXTURE";
  version: 2;
  thumbnailAssetKey: "element-vs-compound-vs-mixture-v1";
  parameters: {
    initial_sample: {
      kind: "enum";
      defaultValue: Sample;
      allowedValues: Sample[];
    };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "ELEMENT_VS_COMPOUND_VS_MIXTURE",
    version: 2,
    thumbnailAssetKey: "element-vs-compound-vs-mixture-v1",
    parameters: {
      initial_sample: {
        kind: "enum",
        defaultValue: "monatomic element",
        allowedValues: [
          "monatomic element",
          "diatomic element",
          "molecular compound",
          "mixture of elements",
          "mixture of element and compound",
          "mixture of compounds",
        ],
      },
    },
  };
}
export { specification as n, initialize as t };
