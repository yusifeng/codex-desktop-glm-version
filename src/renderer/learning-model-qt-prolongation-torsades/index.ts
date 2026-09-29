// QT-prolongation and torsades learning-model manifest. Release chunk: type-2451a41f0046.js.
import "@rchunk/rolldown-runtime";

const qtProlongationTorsadesSpecification = {
  type: "QT_PROLONGATION_TORSADES",
  version: 1,
  thumbnailAssetKey: "qt-prolongation-torsades-v1",
  parameters: {
    qtcMs: { kind: "number" as const, defaultValue: 420, min: 360, max: 560 },
  },
};

function initializeQtProlongationTorsadesSpecification(): void {}

export { qtProlongationTorsadesSpecification as n, initializeQtProlongationTorsadesSpecification as t };
