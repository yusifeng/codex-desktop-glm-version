// Sphere volume visualization and specification. Release chunk: type-7a2e9c974468.js.
import "@rchunk/rolldown-runtime";

interface RadiusProperty {
  label: "r";
  min: 0.5;
  max: 10;
  step: 0.1;
  defaultValue: 3;
  thumbnailDefaultValue: 10;
}
interface Visualization {
  properties: { radius: RadiusProperty };
}
interface Specification {
  type: "SPHERE_VOLUME";
  version: 2;
  thumbnailAssetKey: "sphere-volume-v1";
  canonicalFormula: "V = \\frac{4}{3}\\pi r^3";
  canonicalFormulaAliases: ["4/3pir^3=v", "4/3pir^3"];
  parameters: {
    radius: { kind: "number"; defaultValue: 3; min: 0.01; max: 10_000 };
  };
}

let r: RadiusProperty;
let i: Visualization;
let n: Specification;

function a(): void {
  r ??= {
    label: "r",
    min: 0.5,
    max: 10,
    step: 0.1,
    defaultValue: 3,
    thumbnailDefaultValue: 10,
  };
  i ??= { properties: { radius: r } };
}
function t(): void {
  n ??= {
    type: "SPHERE_VOLUME",
    version: 2,
    thumbnailAssetKey: "sphere-volume-v1",
    canonicalFormula: "V = \\frac{4}{3}\\pi r^3",
    canonicalFormulaAliases: ["4/3pir^3=v", "4/3pir^3"],
    parameters: {
      radius: { kind: "number", defaultValue: 3, min: 0.01, max: 10_000 },
    },
  };
}
export { a, i, n, r, t };
