// Angular-frequency relation learning-model manifest. Release chunk: type-ea9c53801ecf.js.
import "@rchunk/rolldown-runtime";

const angularFrequencyRelationSpecification = {
  type: "ANGULAR_FREQUENCY_RELATION",
  version: 1,
  thumbnailAssetKey: "angular-frequency-relation-v1",
  canonicalFormula: "\\omega = 2\\pi f",
  canonicalFormulaAliases: [
    "\\omega = \\frac{2\\pi}{T}",
    "\\omega = \\frac{d\\theta}{dt}",
    "\\omega = \\sqrt{\\frac{k}{m}}",
    "\\omega = \\sqrt{k/m}",
    "\\omega^2 = \\frac{k}{m}",
    "f = \\frac{\\omega}{2\\pi}",
    "T = \\frac{2\\pi}{\\omega}",
    "\\omega = 2\\pi f = \\frac{2\\pi}{T}",
    "(\\omega = 2\\pi f)",
    "2\\pi f = \\omega",
    "w=2pif",
    "omega=2pif",
    "2pif=omega",
    "2pif=w",
    "omega = 2 pi f",
    "w=2pi/t",
    "omega=2pi/t",
    "f=w/2pi",
    "f=omega/2pi",
    "w=dtheta/dt",
    "omega=dtheta/dt",
    "w=sqrt(k/m)",
    "omega=sqrt(k/m)",
    "w^2=k/m",
    "omega^2=k/m",
  ],
  parameters: {
    frequency: { kind: "number" as const, defaultValue: 1.5, min: 0.01, max: 1_000 },
  },
};

function initializeAngularFrequencyRelationSpecification(): void {}

export {
  angularFrequencyRelationSpecification as n,
  initializeAngularFrequencyRelationSpecification as t,
};
