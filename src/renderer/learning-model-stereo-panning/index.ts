// Stereo-panning teaching model. Release chunk: model-ac19e1b3688e.js.
import "@rchunk/rolldown-runtime";

interface StereoPanningInput { pan?: number }

const stereoPanningDefaults = { pan: 0 };
const clampPan = (value: number): number => Math.max(-100, Math.min(100, value));
const calculateStereoPanning = (input: StereoPanningInput) => {
  const pan = Number.isFinite(input.pan) ? clampPan(input.pan ?? stereoPanningDefaults.pan) : stereoPanningDefaults.pan;
  const left = (100 - pan) / 200;
  const right = (100 + pan) / 200;
  return {
    pan, left, right,
    leftPercent: left * 100,
    rightPercent: right * 100,
    markerPercent: (pan + 100) / 2,
    isCenter: pan === 0,
    isFullLeft: pan === -100,
    isFullRight: pan === 100,
    strongerSide: pan === 0 ? "center" as const : pan < 0 ? "left" as const : "right" as const,
  };
};
function initializeStereoPanningModel(): void {}

export { calculateStereoPanning as n, initializeStereoPanningModel as r, stereoPanningDefaults as t };
