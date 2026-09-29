// Fahrenheit/Celsius conversion metadata. Release chunk: type-7ff60fd7b3ba.js.
import "@rchunk/rolldown-runtime";

interface FahrenheitCelsiusSpecification {
  type: "FAHRENHEIT_CELSIUS_SCALE";
  version: 1;
  thumbnailAssetKey: "fahrenheit-celsius-scale-v1";
  canonicalFormula: "F = \\frac{9}{5}C + 32";
  parameters: {
    celsius: { kind: "number"; defaultValue: 0; min: -40; max: 120 };
  };
}

let fahrenheitCelsiusSpecification: FahrenheitCelsiusSpecification;
let initialized = false;
function initializeFahrenheitCelsiusSpecification(): void {
  if (initialized) return;
  initialized = true;
  fahrenheitCelsiusSpecification = {
    type: "FAHRENHEIT_CELSIUS_SCALE",
    version: 1,
    thumbnailAssetKey: "fahrenheit-celsius-scale-v1",
    canonicalFormula: "F = \\frac{9}{5}C + 32",
    parameters: {
      celsius: { kind: "number", defaultValue: 0, min: -40, max: 120 },
    },
  };
}

export {
  fahrenheitCelsiusSpecification as n,
  initializeFahrenheitCelsiusSpecification as t,
};
