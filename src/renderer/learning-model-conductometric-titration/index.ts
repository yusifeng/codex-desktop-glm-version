// Conductometric-titration learning-block model.
// Release chunk: app/webview/assets/model-ae2c3d093d91.js.

import "@rchunk/rolldown-runtime";

type TitrationRegime = "before" | "equivalence" | "after";
interface TitrationValues { addedVolumeMl?: number }
interface TitrationState { addedVolumeMl: number; conductivity: number; regime: TitrationRegime }
interface VolumeRange { min: number; max: number; step: number; defaultValue: number }

let volumeRange: VolumeRange;
let minimumConductivity: number;
let calculateConductivity: (addedVolumeMl: number) => number;
let calculateTitrationState: (values: TitrationValues) => TitrationState;
let initialized = false;

function initializeConductometricTitrationModel(): void {
  if (initialized) return;
  initialized = true;
  volumeRange = { min: 0, max: 40, step: 0.5, defaultValue: 12 };
  minimumConductivity = 2.4;
  calculateConductivity = addedVolumeMl => addedVolumeMl <= 20
    ? minimumConductivity + (20 - addedVolumeMl) * 0.24
    : minimumConductivity + (addedVolumeMl - 20) * 0.2;
  calculateTitrationState = values => {
    const addedVolumeMl = Number.isFinite(values.addedVolumeMl)
      ? Math.min(volumeRange.max, Math.max(volumeRange.min, values.addedVolumeMl as number))
      : volumeRange.defaultValue;
    return {
      addedVolumeMl,
      conductivity: calculateConductivity(addedVolumeMl),
      regime: addedVolumeMl < 20 ? "before" : addedVolumeMl > 20 ? "after" : "equivalence",
    };
  };
}

export { initializeConductometricTitrationModel as a, calculateConductivity as i, volumeRange as n, calculateTitrationState as r, minimumConductivity as t };
