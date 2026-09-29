// Classes-of-levers selector metadata. Release chunk: type-973549a4c4d1.js.
import "@rchunk/rolldown-runtime";

type LeverClass = "first" | "second" | "third";
interface ClassesOfLeversSpecification {
  type: "CLASSES_OF_LEVERS";
  version: 2;
  thumbnailAssetKey: "classes-of-levers-v1";
  parameters: {
    leverClass: {
      kind: "enum";
      defaultValue: LeverClass;
      allowedValues: LeverClass[];
    };
  };
}

let classesOfLeversSpecification: ClassesOfLeversSpecification;
let initialized = false;
function initializeClassesOfLeversSpecification(): void {
  if (initialized) return;
  initialized = true;
  classesOfLeversSpecification = {
    type: "CLASSES_OF_LEVERS",
    version: 2,
    thumbnailAssetKey: "classes-of-levers-v1",
    parameters: {
      leverClass: {
        kind: "enum",
        defaultValue: "first",
        allowedValues: ["first", "second", "third"],
      },
    },
  };
}

export {
  classesOfLeversSpecification as n,
  initializeClassesOfLeversSpecification as t,
};
