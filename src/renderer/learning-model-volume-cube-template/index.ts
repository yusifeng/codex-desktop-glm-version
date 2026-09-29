// Cube-volume adaptive template and manifest. Release chunk: template-d8d6d1996e0d.js.
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

let volumeCubeSpecification: {
  type: "VOLUME_CUBE";
  version: 2;
  thumbnailAssetKey: "volume-cube-v2";
  canonicalFormula: "V = s^3";
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

function normalizeVolumeCubeTemplate(input: TemplateInput): {
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

let volumeCubeTemplate: {
  properties: {
    sideLength: typeof sideLengthControl;
    sideLengthBounds: { defaultValue: NumericBounds; thumbnailDefaultValue: NumericBounds };
  };
};

function initializeVolumeCubeSpecification(): void {
  volumeCubeSpecification = {
    type: "VOLUME_CUBE",
    version: 2,
    thumbnailAssetKey: "volume-cube-v2",
    canonicalFormula: "V = s^3",
    canonicalFormulaAliases: ["V = a^3", "s^3"],
    parameters: {
      sideLength: { kind: "number", defaultValue: 3, min: 0.01, max: 10_000 },
    },
  };
}
function initializeVolumeCubeTemplate(): void {
  adaptiveSlider.n();
  initializeVolumeCubeSpecification();
  sideLengthControl = {
    label: "s",
    min: 1,
    max: 10,
    step: 1,
    defaultValue: 3,
    thumbnailDefaultValue: 3,
  };
  sideLengthAllowed = volumeCubeSpecification.parameters.sideLength;
  sideLengthControlBounds = {
    baseMin: sideLengthControl.min,
    baseMax: sideLengthControl.max,
    step: sideLengthControl.step,
  };
  volumeCubeTemplate = {
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
  initializeVolumeCubeTemplate as a,
  volumeCubeSpecification as c,
  volumeCubeTemplate as i,
  sideLengthControl as n,
  normalizeVolumeCubeTemplate as o,
  sideLengthControlBounds as r,
  initializeVolumeCubeSpecification as s,
  sideLengthAllowed as t,
};
