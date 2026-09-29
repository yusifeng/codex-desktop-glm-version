// Lung gas partial-pressure controls. Release chunk: type-8a9437331f93.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "LUNG_GAS_GRADIENT";
  version: 1;
  thumbnailAssetKey: "lung-gas-gradient-v1";
  parameters: Record<
    string,
    { kind: "number"; defaultValue: number; min: 0; max: number }
  >;
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "LUNG_GAS_GRADIENT",
    version: 1,
    thumbnailAssetKey: "lung-gas-gradient-v1",
    parameters: {
      alveolarOxygenPartialPressureMmHg: {
        kind: "number",
        defaultValue: 100,
        min: 0,
        max: 300,
      },
      bloodOxygenPartialPressureMmHg: {
        kind: "number",
        defaultValue: 40,
        min: 0,
        max: 300,
      },
      alveolarCarbonDioxidePartialPressureMmHg: {
        kind: "number",
        defaultValue: 40,
        min: 0,
        max: 150,
      },
      bloodCarbonDioxidePartialPressureMmHg: {
        kind: "number",
        defaultValue: 45,
        min: 0,
        max: 150,
      },
    },
  };
}
export { specification as n, initialize as t };
