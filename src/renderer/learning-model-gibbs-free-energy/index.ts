// Gibbs free energy specification. Release chunk: type-32a04963cef2.js.
import "@rchunk/rolldown-runtime";

interface Specification {
  type: "GIBBS_FREE_ENERGY";
  version: 1;
  thumbnailAssetKey: "gibbs-free-energy-v1";
  canonicalFormula: "\\Delta G^\\circ=-RT\\ln K";
  canonicalFormulaAliases: ["\\Delta_{\\mathrm r}G^\\circ=-RT\\ln K"];
  parameters: {
    deltaGKilojoulesPerMole: {
      kind: "number";
      defaultValue: -20;
      min: -50;
      max: 50;
    };
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "GIBBS_FREE_ENERGY",
    version: 1,
    thumbnailAssetKey: "gibbs-free-energy-v1",
    canonicalFormula: "\\Delta G^\\circ=-RT\\ln K",
    canonicalFormulaAliases: ["\\Delta_{\\mathrm r}G^\\circ=-RT\\ln K"],
    parameters: {
      deltaGKilojoulesPerMole: {
        kind: "number",
        defaultValue: -20,
        min: -50,
        max: 50,
      },
    },
  };
}
export { specification as n, initializeSpecification as t };
