// Binary place-value learning model for an unsigned eight-bit integer.
import "@rchunk/rolldown-runtime";

interface IntegerParameter { kind: "integer"; defaultValue: number; min: number; max: number }
interface BinaryPlaceValueState { value: number; bits: number[]; binary: string; activePlaces: number[] }

let binaryPlaceValueManifest: { type: string; version: number; thumbnailAssetKey: string; parameters: { initial_value: IntegerParameter } };
let initialValueParameter: IntegerParameter;
let binaryPlaces: number[];
let normalizeBinaryValue: (value: number) => number;
let calculateBinaryPlaceValue: (value: number) => BinaryPlaceValueState;
let toggleBinaryPlace: (value: number, place: number) => number;
let formatBinaryEquation: (state: BinaryPlaceValueState, format?: (value: number) => string) => string;
let manifestInitialized = false;
let modelInitialized = false;

function initializeBinaryPlaceValueManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  binaryPlaceValueManifest = { type: "BINARY_PLACE_VALUE", version: 2, thumbnailAssetKey: "binary-place-value-v1", parameters: { initial_value: { kind: "integer", defaultValue: 45, min: 0, max: 255 } } };
}

function initializeBinaryPlaceValueModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeBinaryPlaceValueManifest();
  initialValueParameter = binaryPlaceValueManifest.parameters.initial_value;
  binaryPlaces = [128, 64, 32, 16, 8, 4, 2, 1];
  normalizeBinaryValue = value => {
    const integer = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : initialValueParameter.defaultValue;
    return Math.max(initialValueParameter.min, Math.min(initialValueParameter.max, integer));
  };
  calculateBinaryPlaceValue = value => {
    const normalized = normalizeBinaryValue(value);
    const bits = binaryPlaces.map(place => Number((normalized & place) === place));
    return { value: normalized, bits, binary: bits.join(""), activePlaces: binaryPlaces.filter((_place, index) => bits[index] === 1) };
  };
  toggleBinaryPlace = (value, place) => normalizeBinaryValue(normalizeBinaryValue(value) ^ place);
  formatBinaryEquation = (state, format = String) => {
    const expansion = state.activePlaces.length === 0 ? format(0) : state.activePlaces.map(format).join(" + ");
    return `${state.binary}_{2} = ${expansion} = ${format(state.value)}_{10}`;
  };
}

export { initializeBinaryPlaceValueModel as a, initializeBinaryPlaceValueManifest as c, formatBinaryEquation as i, binaryPlaceValueManifest as l, binaryPlaces as n, normalizeBinaryValue as o, calculateBinaryPlaceValue as r, toggleBinaryPlace as s, initialValueParameter as t };
