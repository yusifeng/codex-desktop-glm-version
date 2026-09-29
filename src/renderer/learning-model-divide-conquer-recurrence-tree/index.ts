// Divide-and-conquer recurrence tree specification. Release chunk: type-603f86db5a64.js.
import "@rchunk/rolldown-runtime";

type RecurrenceExample =
  "T(n) = 2T(n/2) + 1" | "T(n) = 2T(n/2) + n" | "T(n) = 2T(n/2) + n^2";
interface Specification {
  type: "DIVIDE_CONQUER_RECURRENCE_TREE";
  version: 1;
  thumbnailAssetKey: "divide-conquer-recurrence-tree-v1";
  parameters: {
    recurrence_example: {
      kind: "enum";
      defaultValue: "T(n) = 2T(n/2) + n";
      allowedValues: RecurrenceExample[];
    };
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "DIVIDE_CONQUER_RECURRENCE_TREE",
    version: 1,
    thumbnailAssetKey: "divide-conquer-recurrence-tree-v1",
    parameters: {
      recurrence_example: {
        kind: "enum",
        defaultValue: "T(n) = 2T(n/2) + n",
        allowedValues: [
          "T(n) = 2T(n/2) + 1",
          "T(n) = 2T(n/2) + n",
          "T(n) = 2T(n/2) + n^2",
        ],
      },
    },
  };
}
export { specification as n, initializeSpecification as t };
