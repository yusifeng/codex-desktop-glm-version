// Two's-complement representation learning model. Release chunk: model-5cfd5db05e74.js.
import "@rchunk/rolldown-runtime";

type BitWidth = "4" | "8" | "16";
interface TwosComplementValues { bit_width?: string | null; initial_value?: number | null; stage?: number | null }
interface TwosComplementManifest {
  type: string; version: number; thumbnailAssetKey: string;
  parameters: {
    bit_width: { kind: "enum"; defaultValue: BitWidth; allowedValues: BitWidth[] };
    initial_value: { kind: "integer"; defaultValue: number; min: number; max: number };
  };
}

let twosComplementManifest: TwosComplementManifest;
let defaultTwosComplementValues: { bit_width: BitWidth; initial_value: number; stage: number };
let calculateTwosComplementState: (values: TwosComplementValues) => {
  width: number; value: number; stage: number; min: number; max: number; weights: number[]; bits: number[];
  magnitudeBits: number[] | null; invertedBits: number[] | null; contributions: number[]; isMostNegative: boolean;
};
let manifestInitialized = false;
let modelInitialized = false;

function initializeTwosComplementManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  twosComplementManifest = {
    type: "TWOS_COMPLEMENT", version: 2, thumbnailAssetKey: "twos-complement-v1",
    parameters: {
      bit_width: { kind: "enum", defaultValue: "8", allowedValues: ["4", "8", "16"] },
      initial_value: { kind: "integer", defaultValue: -4, min: -32768, max: 32767 },
    },
  };
}

function initializeTwosComplementModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeTwosComplementManifest();
  const bitWidths: BitWidth[] = ["4", "8", "16"];
  const toBits = (value: number, width: number): number[] =>
    value.toString(2).padStart(width, "0").slice(-width).split("").map(Number);
  defaultTwosComplementValues = {
    bit_width: twosComplementManifest.parameters.bit_width.defaultValue,
    initial_value: twosComplementManifest.parameters.initial_value.defaultValue,
    stage: 2,
  };
  const isBitWidth = (value: unknown): value is BitWidth => bitWidths.some(width => width === value);
  calculateTwosComplementState = values => {
    const bitWidth = isBitWidth(values.bit_width) ? values.bit_width : twosComplementManifest.parameters.bit_width.defaultValue;
    const width = Number(bitWidth);
    const minimum = -(2 ** (width - 1));
    const maximum = 2 ** (width - 1) - 1;
    const candidateValue = typeof values.initial_value === "number" && Number.isFinite(values.initial_value)
      ? Math.round(values.initial_value)
      : twosComplementManifest.parameters.initial_value.defaultValue;
    const value = Math.min(maximum, Math.max(minimum, candidateValue));
    const candidateStage = typeof values.stage === "number" && Number.isFinite(values.stage) ? values.stage : 2;
    const stage = Math.min(2, Math.max(0, Math.round(candidateStage)));
    const unsignedEncoding = value < 0 ? 2 ** width + value : value;
    const bits = toBits(unsignedEncoding, width);
    const weights = bits.map((_bit, index) => index === 0 ? -(2 ** (width - 1)) : 2 ** (width - index - 1));
    const isMostNegative = value === minimum;
    const magnitudeBits = value < 0 && !isMostNegative ? toBits(Math.abs(value), width) : null;
    return {
      width, value, stage, min: minimum, max: maximum, weights, bits, magnitudeBits,
      invertedBits: magnitudeBits?.map(bit => +(bit === 0)) ?? null,
      contributions: bits.map((bit, index) => bit * weights[index]), isMostNegative,
    };
  };
}

export {
  twosComplementManifest as a, initializeTwosComplementManifest as i, defaultTwosComplementValues as n,
  initializeTwosComplementModel as r, calculateTwosComplementState as t,
};
