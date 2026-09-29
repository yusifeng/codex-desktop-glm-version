// Water phase diagram learning-model specification. Release chunk: type-9acfe2203543.js.
import "@rchunk/rolldown-runtime";

interface NumberParameter {
  kind: "number";
  defaultValue: number;
  min: number;
  max: number;
}
interface Specification {
  type: "WATER_PHASE_DIAGRAM";
  version: 2;
  thumbnailAssetKey: "water-phase-diagram-v1";
  parameters: { temperature_c: NumberParameter; pressure_kpa: NumberParameter };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "WATER_PHASE_DIAGRAM",
    version: 2,
    thumbnailAssetKey: "water-phase-diagram-v1",
    parameters: {
      temperature_c: { kind: "number", defaultValue: 25, min: -80, max: 450 },
      pressure_kpa: {
        kind: "number",
        defaultValue: 101.325,
        min: 0.001,
        max: 50_000,
      },
    },
  };
}
export { specification as n, initializeSpecification as t };
