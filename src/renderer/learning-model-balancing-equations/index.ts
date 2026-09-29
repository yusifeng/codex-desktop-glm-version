// Chemical-equation example selector. Release chunk: type-d05467b5cc3d.js.
import "@rchunk/rolldown-runtime";
type ReactionExample =
  | "hydrogen-and-oxygen-to-water"
  | "nitrogen-and-hydrogen-to-ammonia"
  | "methane-combustion";
interface Specification {
  type: "BALANCING_EQUATIONS";
  version: 2;
  thumbnailAssetKey: "balancing-equations-v2";
  parameters: {
    reaction_example: {
      kind: "enum";
      defaultValue: ReactionExample;
      allowedValues: ReactionExample[];
    };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "BALANCING_EQUATIONS",
    version: 2,
    thumbnailAssetKey: "balancing-equations-v2",
    parameters: {
      reaction_example: {
        kind: "enum",
        defaultValue: "hydrogen-and-oxygen-to-water",
        allowedValues: [
          "hydrogen-and-oxygen-to-water",
          "nitrogen-and-hydrogen-to-ammonia",
          "methane-combustion",
        ],
      },
    },
  };
}
export { specification as n, initialize as t };
