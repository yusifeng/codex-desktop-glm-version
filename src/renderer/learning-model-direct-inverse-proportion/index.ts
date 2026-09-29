// Direct/inverse proportion metadata. Release chunk: type-251f9425afe7.js.
import "@rchunk/rolldown-runtime";

interface DirectInverseProportionSpecification {
  type: "DIRECT_INVERSE_PROPORTION";
  version: 1;
  thumbnailAssetKey: "direct-inverse-proportion-v1";
  canonicalFormula: "y = 2x,\\quad y = \\frac{2}{x}";
  parameters: { x: { kind: "number"; defaultValue: 1; min: 0.5; max: 2.5 } };
}

let directInverseProportionSpecification: DirectInverseProportionSpecification;
let initialized = false;
function initializeDirectInverseProportionSpecification(): void {
  if (initialized) return;
  initialized = true;
  directInverseProportionSpecification = {
    type: "DIRECT_INVERSE_PROPORTION",
    version: 1,
    thumbnailAssetKey: "direct-inverse-proportion-v1",
    canonicalFormula: "y = 2x,\\quad y = \\frac{2}{x}",
    parameters: { x: { kind: "number", defaultValue: 1, min: 0.5, max: 2.5 } },
  };
}

export {
  directInverseProportionSpecification as n,
  initializeDirectInverseProportionSpecification as t,
};
