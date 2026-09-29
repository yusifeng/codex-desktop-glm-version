// Mass-spring simple-harmonic-motion manifest. Release chunk: type-b8020010f7f1.js.
import "@rchunk/rolldown-runtime";

const massSpringShmSpecification = {
  type: "MASS_SPRING_SHM",
  version: 1,
  thumbnailAssetKey: "mass-spring-shm-v1",
  canonicalFormula: "T = 2\\pi\\sqrt{\\frac{m}{k}}",
  parameters: {
    massKilograms: { kind: "number" as const, defaultValue: 1.5, min: 0.5, max: 5 },
    springConstantNewtonsPerMeter: { kind: "number" as const, defaultValue: 40, min: 10, max: 100 },
    amplitudeMeters: { kind: "number" as const, defaultValue: 0.25, min: 0.05, max: 0.5 },
  },
};

function initializeMassSpringShmSpecification(): void {}

export { massSpringShmSpecification as n, initializeMassSpringShmSpecification as t };
