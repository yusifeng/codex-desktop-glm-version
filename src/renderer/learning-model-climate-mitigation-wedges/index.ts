// Climate-mitigation wedge controls. Release chunk: type-940292164259.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "CLIMATE_MITIGATION_WEDGES";
  version: 2;
  thumbnailAssetKey: "climate-mitigation-wedges-v1";
  parameters: {
    required_wedges: { kind: "integer"; defaultValue: 7; min: 3; max: 12 };
    horizon_years: { kind: "integer"; defaultValue: 50; min: 20; max: 100 };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "CLIMATE_MITIGATION_WEDGES",
    version: 2,
    thumbnailAssetKey: "climate-mitigation-wedges-v1",
    parameters: {
      required_wedges: { kind: "integer", defaultValue: 7, min: 3, max: 12 },
      horizon_years: { kind: "integer", defaultValue: 50, min: 20, max: 100 },
    },
  };
}
export { specification as n, initialize as t };
