// Eye-accommodation object-distance metadata. Release chunk: type-42a870b7bbdb.js.
import "@rchunk/rolldown-runtime";

interface EyeAccommodationSpecification {
  type: "EYE_ACCOMMODATION";
  version: 1;
  thumbnailAssetKey: "eye-accommodation-v1";
  parameters: {
    objectDistanceMeters: {
      kind: "number";
      defaultValue: 1;
      min: 0.25;
      max: 6;
    };
  };
}

let eyeAccommodationSpecification: EyeAccommodationSpecification;
let initialized = false;
function initializeEyeAccommodationSpecification(): void {
  if (initialized) return;
  initialized = true;
  eyeAccommodationSpecification = {
    type: "EYE_ACCOMMODATION",
    version: 1,
    thumbnailAssetKey: "eye-accommodation-v1",
    parameters: {
      objectDistanceMeters: {
        kind: "number",
        defaultValue: 1,
        min: 0.25,
        max: 6,
      },
    },
  };
}

export {
  eyeAccommodationSpecification as n,
  initializeEyeAccommodationSpecification as t,
};
