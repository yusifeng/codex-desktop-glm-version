// Gross-versus-net primary productivity controls. Release chunk: type-1aff40f97e6c.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "GPP_VS_NPP";
  version: 2;
  thumbnailAssetKey: "gpp-vs-npp-v3";
  canonicalFormula: string;
  parameters: {
    gross_primary_productivity: {
      kind: "number";
      defaultValue: 240;
      min: 100;
      max: 400;
    };
    autotrophic_respiration: {
      kind: "number";
      defaultValue: 80;
      min: 0;
      max: 100;
    };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "GPP_VS_NPP",
    version: 2,
    thumbnailAssetKey: "gpp-vs-npp-v3",
    canonicalFormula: "\\mathrm{NPP}=\\mathrm{GPP}-R_a",
    parameters: {
      gross_primary_productivity: {
        kind: "number",
        defaultValue: 240,
        min: 100,
        max: 400,
      },
      autotrophic_respiration: {
        kind: "number",
        defaultValue: 80,
        min: 0,
        max: 100,
      },
    },
  };
}
export { specification as n, initialize as t };
