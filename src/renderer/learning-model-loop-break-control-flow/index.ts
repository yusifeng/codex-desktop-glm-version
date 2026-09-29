// Loop/break control-flow metadata. Release chunk: type-b7a8fbf7a420.js.
import "@rchunk/rolldown-runtime";
type LoopKind = "for" | "while";
interface Specification {
  type: "LOOP_BREAK_CONTROL_FLOW";
  version: 3;
  thumbnailAssetKey: "loop-break-control-flow-v1";
  parameters: {
    loop_kind: {
      kind: "enum";
      defaultValue: LoopKind;
      allowedValues: LoopKind[];
    };
    loop_limit: { kind: "integer"; defaultValue: 5; min: 3; max: 5 };
    break_value: { kind: "integer"; defaultValue: 2; min: 1; max: 6 };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "LOOP_BREAK_CONTROL_FLOW",
    version: 3,
    thumbnailAssetKey: "loop-break-control-flow-v1",
    parameters: {
      loop_kind: {
        kind: "enum",
        defaultValue: "for",
        allowedValues: ["for", "while"],
      },
      loop_limit: { kind: "integer", defaultValue: 5, min: 3, max: 5 },
      break_value: { kind: "integer", defaultValue: 2, min: 1, max: 6 },
    },
  };
}
export { specification as n, initialize as t };
