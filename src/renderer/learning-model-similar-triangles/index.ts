// Similar-triangle scale metadata. Release chunk: type-d56e7431251b.js.
import "@rchunk/rolldown-runtime";

interface SimilarTrianglesSpecification {
  type: "SIMILAR_TRIANGLES";
  version: 1;
  thumbnailAssetKey: "similar-triangles-v1";
  parameters: {
    scale: { kind: "number"; defaultValue: 1.4; min: 0.5; max: 2 };
  };
}

let similarTrianglesSpecification: SimilarTrianglesSpecification;
let initialized = false;
function initializeSimilarTrianglesSpecification(): void {
  if (initialized) return;
  initialized = true;
  similarTrianglesSpecification = {
    type: "SIMILAR_TRIANGLES",
    version: 1,
    thumbnailAssetKey: "similar-triangles-v1",
    parameters: {
      scale: { kind: "number", defaultValue: 1.4, min: 0.5, max: 2 },
    },
  };
}

export {
  similarTrianglesSpecification as n,
  initializeSimilarTrianglesSpecification as t,
};
