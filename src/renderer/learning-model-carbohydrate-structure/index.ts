// Carbohydrate-structure learning-block model.
// Release chunk: app/webview/assets/model-1bd246abc23b.js.

import "@rchunk/rolldown-runtime";

type CarbohydrateExample = "glucose" | "maltose" | "amylose" | "amylopectin" | "glycogen" | "cellulose";

let carbohydrateExamples: CarbohydrateExample[];
let normalizeCarbohydrateExample: (value: unknown) => CarbohydrateExample;
let normalizeLinkageIndex: (value: number) => number;
let getLinkageIndex: (example: CarbohydrateExample) => number;
let getExampleForLinkage: (example: CarbohydrateExample, linkageIndex: number) => CarbohydrateExample;
let initialized = false;

function initializeCarbohydrateStructureModel(): void {
  if (initialized) return;
  initialized = true;
  carbohydrateExamples = ["glucose", "maltose", "amylose", "amylopectin", "glycogen", "cellulose"];
  normalizeCarbohydrateExample = value => typeof value === "string" && carbohydrateExamples.includes(value as CarbohydrateExample)
    ? value as CarbohydrateExample
    : "amylopectin";
  normalizeLinkageIndex = value => Number.isFinite(value) ? Math.min(2, Math.max(0, Math.round(value))) : 0;
  getLinkageIndex = example => example === "cellulose" ? 2 : Number(example === "amylopectin" || example === "glycogen");
  getExampleForLinkage = (example, linkageIndex) => linkageIndex === 0
    ? example === "maltose" ? "maltose" : "amylose"
    : linkageIndex === 1
      ? example === "glycogen" ? "glycogen" : "amylopectin"
      : "cellulose";
}

export { normalizeCarbohydrateExample as a, initializeCarbohydrateStructureModel as i, getLinkageIndex as n, normalizeLinkageIndex as o, getExampleForLinkage as r, carbohydrateExamples as t };
