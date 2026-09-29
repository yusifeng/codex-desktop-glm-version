// Myopia object-distance metadata. Release chunk: type-3bc326afff31.js.
import "@rchunk/rolldown-runtime";

interface MyopiaSpecification {
  type: "MYOPIA";
  version: 1;
  thumbnailAssetKey: "myopia-v1";
  parameters: {
    objectDistanceMeters: {
      kind: "number";
      defaultValue: 6;
      min: 0.25;
      max: 6;
    };
  };
}

let myopiaSpecification: MyopiaSpecification;
let initialized = false;
function initializeMyopiaSpecification(): void {
  if (initialized) return;
  initialized = true;
  myopiaSpecification = {
    type: "MYOPIA",
    version: 1,
    thumbnailAssetKey: "myopia-v1",
    parameters: {
      objectDistanceMeters: {
        kind: "number",
        defaultValue: 6,
        min: 0.25,
        max: 6,
      },
    },
  };
}

export { myopiaSpecification as n, initializeMyopiaSpecification as t };
