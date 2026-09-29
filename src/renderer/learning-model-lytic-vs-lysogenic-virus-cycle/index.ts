// Lytic versus lysogenic virus cycle specification. Release chunk: type-ee3c6146db4d.js.
import "@rchunk/rolldown-runtime";

interface PathwayParameter {
  kind: "enum";
  defaultValue: "lytic";
  allowedValues: ["lytic", "lysogenic"];
}
interface Specification {
  type: "LYTIC_VS_LYSOGENIC_VIRUS_CYCLE";
  version: 2;
  thumbnailAssetKey: "lytic-vs-lysogenic-virus-cycle-v2";
  parameters: { initial_pathway: PathwayParameter };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "LYTIC_VS_LYSOGENIC_VIRUS_CYCLE",
    version: 2,
    thumbnailAssetKey: "lytic-vs-lysogenic-virus-cycle-v2",
    parameters: {
      initial_pathway: {
        kind: "enum",
        defaultValue: "lytic",
        allowedValues: ["lytic", "lysogenic"],
      },
    },
  };
}
export { specification as n, initializeSpecification as t };
