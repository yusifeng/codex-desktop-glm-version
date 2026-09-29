// Place-value integer metadata. Release chunk: type-98cbaaa40c49.js.
import "@rchunk/rolldown-runtime";

interface PlaceValueSpecification {
  type: "PLACE_VALUE";
  version: 1;
  thumbnailAssetKey: "place-value-v1";
  parameters: {
    number: { kind: "integer"; defaultValue: 2654; min: 0; max: 9999 };
  };
}

let placeValueSpecification: PlaceValueSpecification;
let initialized = false;
function initializePlaceValueSpecification(): void {
  if (initialized) return;
  initialized = true;
  placeValueSpecification = {
    type: "PLACE_VALUE",
    version: 1,
    thumbnailAssetKey: "place-value-v1",
    parameters: {
      number: { kind: "integer", defaultValue: 2654, min: 0, max: 9999 },
    },
  };
}

export { placeValueSpecification as n, initializePlaceValueSpecification as t };
