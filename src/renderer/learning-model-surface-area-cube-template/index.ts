// Cube-surface-area adaptive template and manifest. Release chunk: template-eafd23e9a003.js.
import "@rchunk/rolldown-runtime";
import * as AdaptiveSliderField from "@rchunk/adaptive-slider-field";

interface NumericBounds {
  min: number;
  max: number;
  step: number;
}

interface TemplateInput {
  sideLength: unknown;
  sideLengthBounds?: NumericBounds;
}

const adaptiveSlider = AdaptiveSliderField as unknown as {
  i(value: unknown, allowed: { defaultValue: number; min: number; max: number }): number;
  n(): void;
  r(input: {
    allowed: { defaultValue: number; min: number; max: number };
    bounds?: NumericBounds;
    control: { baseMin: number; baseMax: number; step: number };
    value: number;
  }): NumericBounds;
  t(
    value: number,
    control: { baseMin: number; baseMax: number; step: number },
    allowed: { defaultValue: number; min: number; max: number },
  ): NumericBounds;
};

let surfaceAreaCubeSpecification: {
  type: "SURFACE_AREA_CUBE";
  version: 2;
  thumbnailAssetKey: "surface-area-cube-v1";
  canonicalFormula: "SA = 6s^2";
  canonicalFormulaAliases: string[];
  parameters: { sideLength: { kind: "number"; defaultValue: number; min: number; max: number } };
};
let sideLengthControl: {
  label: "s";
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  thumbnailDefaultValue: number;
};
let sideLengthAllowed: { kind: "number"; defaultValue: number; min: number; max: number };
let sideLengthControlBounds: { baseMin: number; baseMax: number; step: number };

function createDefaultBounds(value: number): NumericBounds {
  return adaptiveSlider.t(value, sideLengthControlBounds, sideLengthAllowed);
}

function normalizeSurfaceAreaCubeTemplate(input: TemplateInput): {
  sideLength: number;
  sideLengthBounds: NumericBounds;
} {
  const sideLength = adaptiveSlider.i(input.sideLength, sideLengthAllowed);
  return {
    sideLength,
    sideLengthBounds: adaptiveSlider.r({
      allowed: sideLengthAllowed,
      bounds: input.sideLengthBounds,
      control: sideLengthControlBounds,
      value: sideLength,
    }),
  };
}

let surfaceAreaCubeTemplate: {
  properties: {
    sideLength: typeof sideLengthControl;
    sideLengthBounds: { defaultValue: NumericBounds; thumbnailDefaultValue: NumericBounds };
  };
};

function initializeSurfaceAreaCubeSpecification(): void {
  surfaceAreaCubeSpecification = {
    type: "SURFACE_AREA_CUBE",
    version: 2,
    thumbnailAssetKey: "surface-area-cube-v1",
    canonicalFormula: "SA = 6s^2",
    canonicalFormulaAliases: ["A = 6a^2", "6s^2"],
    parameters: {
      sideLength: { kind: "number", defaultValue: 3, min: 0.01, max: 10_000 },
    },
  };
}
function initializeSurfaceAreaCubeTemplate(): void {
  adaptiveSlider.n();
  initializeSurfaceAreaCubeSpecification();
  sideLengthControl = {
    label: "s",
    min: 1,
    max: 10,
    step: 1,
    defaultValue: 3,
    thumbnailDefaultValue: 10,
  };
  sideLengthAllowed = surfaceAreaCubeSpecification.parameters.sideLength;
  sideLengthControlBounds = {
    baseMin: sideLengthControl.min,
    baseMax: sideLengthControl.max,
    step: sideLengthControl.step,
  };
  surfaceAreaCubeTemplate = {
    properties: {
      sideLength: sideLengthControl,
      sideLengthBounds: {
        defaultValue: createDefaultBounds(sideLengthControl.defaultValue),
        thumbnailDefaultValue: createDefaultBounds(sideLengthControl.thumbnailDefaultValue),
      },
    },
  };
}

export {
  initializeSurfaceAreaCubeTemplate as a,
  surfaceAreaCubeSpecification as c,
  surfaceAreaCubeTemplate as i,
  sideLengthControl as n,
  normalizeSurfaceAreaCubeTemplate as o,
  sideLengthControlBounds as r,
  initializeSurfaceAreaCubeSpecification as s,
  sideLengthAllowed as t,
};
