// Discrete-event queue simulation specification. Release chunk: type-ee21e9db5696.js.
import "@rchunk/rolldown-runtime";
type Workload = "spaced" | "bursty";
interface Specification {
  type: "DISCRETE_EVENT_QUEUE_SIMULATION";
  version: 3;
  thumbnailAssetKey: "discrete-event-queue-simulation-v1";
  parameters: {
    workload: {
      kind: "enum";
      defaultValue: Workload;
      allowedValues: Workload[];
    };
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "DISCRETE_EVENT_QUEUE_SIMULATION",
    version: 3,
    thumbnailAssetKey: "discrete-event-queue-simulation-v1",
    parameters: {
      workload: {
        kind: "enum",
        defaultValue: "bursty",
        allowedValues: ["spaced", "bursty"],
      },
    },
  };
}
export { specification as n, initializeSpecification as t };
