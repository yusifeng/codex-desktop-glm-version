// Electric-current charge-flow controls. Release chunk: type-e4a418c02712.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "ELECTRIC_CURRENT_CHARGE_FLOW";
  version: 1;
  thumbnailAssetKey: "electric-current-charge-flow-v2";
  canonicalFormula: string;
  parameters: {
    packetRatePerSecond: { kind: "number"; defaultValue: 4; min: 1; max: 8 };
    chargePerPacketCoulombs: {
      kind: "number";
      defaultValue: 1;
      min: 0.5;
      max: 3;
    };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "ELECTRIC_CURRENT_CHARGE_FLOW",
    version: 1,
    thumbnailAssetKey: "electric-current-charge-flow-v2",
    canonicalFormula: "I = \\frac{Q}{t}",
    parameters: {
      packetRatePerSecond: { kind: "number", defaultValue: 4, min: 1, max: 8 },
      chargePerPacketCoulombs: {
        kind: "number",
        defaultValue: 1,
        min: 0.5,
        max: 3,
      },
    },
  };
}
export { specification as n, initialize as t };
