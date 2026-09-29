// Selection-sort learning-model manifest. Release chunk: type-d22103ac12d0.js.
import "@rchunk/rolldown-runtime";

type SelectionSortOrder =
  | "6,3,8,2,7,1,5,4"
  | "8,7,6,5,4,3,2,1"
  | "1,2,3,4,5,6,7,8"
  | "4,1,7,3,8,5,2,6";

const selectionSortSpecification = {
  type: "SELECTION_SORT",
  version: 1,
  thumbnailAssetKey: "selection-sort-v1",
  parameters: {
    order: {
      kind: "enum" as const,
      defaultValue: "6,3,8,2,7,1,5,4" as SelectionSortOrder,
      allowedValues: [
        "6,3,8,2,7,1,5,4",
        "8,7,6,5,4,3,2,1",
        "1,2,3,4,5,6,7,8",
        "4,1,7,3,8,5,2,6",
      ] as SelectionSortOrder[],
    },
  },
};

function initializeSelectionSortSpecification(): void {}

export { selectionSortSpecification as n, initializeSelectionSortSpecification as t };
