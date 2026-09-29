// Hyperopia object-distance metadata. Release chunk: type-28180140955e.js.
import "@rchunk/rolldown-runtime";

interface HyperopiaSpecification {
  type: "HYPEROPIA";
  version: 1;
  thumbnailAssetKey: "hyperopia-v2";
  parameters: {
    objectDistanceMeters: {
      kind: "number";
      defaultValue: 0.5;
      min: 0.25;
      max: 6;
    };
  };
}

let hyperopiaSpecification: HyperopiaSpecification;
let initialized = false;
function initializeHyperopiaSpecification(): void {
  if (initialized) return;
  initialized = true;
  hyperopiaSpecification = {
    type: "HYPEROPIA",
    version: 1,
    thumbnailAssetKey: "hyperopia-v2",
    parameters: {
      objectDistanceMeters: {
        kind: "number",
        defaultValue: 0.5,
        min: 0.25,
        max: 6,
      },
    },
  };
}

export { hyperopiaSpecification as n, initializeHyperopiaSpecification as t };
