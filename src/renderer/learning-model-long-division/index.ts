// Long-division operand metadata. Release chunk: type-eb0199ee4cef.js.
import "@rchunk/rolldown-runtime";

interface LongDivisionSpecification {
  type: "LONG_DIVISION";
  version: 1;
  thumbnailAssetKey: "long-division-v1";
  parameters: {
    dividend: { kind: "integer"; defaultValue: 458; min: 1; max: 9999 };
    divisor: { kind: "integer"; defaultValue: 3; min: 1; max: 99 };
  };
}

let longDivisionSpecification: LongDivisionSpecification;
let initialized = false;
function initializeLongDivisionSpecification(): void {
  if (initialized) return;
  initialized = true;
  longDivisionSpecification = {
    type: "LONG_DIVISION",
    version: 1,
    thumbnailAssetKey: "long-division-v1",
    parameters: {
      dividend: { kind: "integer", defaultValue: 458, min: 1, max: 9999 },
      divisor: { kind: "integer", defaultValue: 3, min: 1, max: 99 },
    },
  };
}

export {
  longDivisionSpecification as n,
  initializeLongDivisionSpecification as t,
};
