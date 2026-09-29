// Singly linked-list pointer specification. Release chunk: type-d9aefcd7f05e.js.
import "@rchunk/rolldown-runtime";
type Operation = "insert" | "delete";
interface Specification {
  type: "SINGLY_LINKED_LIST_POINTERS";
  version: 1;
  thumbnailAssetKey: "singly-linked-list-pointers-v1";
  parameters: {
    operation: {
      kind: "enum";
      defaultValue: Operation;
      allowedValues: Operation[];
    };
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "SINGLY_LINKED_LIST_POINTERS",
    version: 1,
    thumbnailAssetKey: "singly-linked-list-pointers-v1",
    parameters: {
      operation: {
        kind: "enum",
        defaultValue: "insert",
        allowedValues: ["insert", "delete"],
      },
    },
  };
}
export { specification as n, initializeSpecification as t };
