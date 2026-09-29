// Four-to-one digital multiplexer learning model.
import "@rchunk/rolldown-runtime";

interface MultiplexerValues { input0?: unknown; input1?: unknown; input2?: unknown; input3?: unknown; select1?: unknown; select0?: unknown }

const multiplexerType = "FOUR_TO_ONE_MULTIPLEXER";
const multiplexerThumbnail = "four-to-one-multiplexer-v1";
const multiplexerParameters = {
  input0: { kind: "boolean", defaultValue: false },
  input1: { kind: "boolean", defaultValue: true },
  input2: { kind: "boolean", defaultValue: false },
  input3: { kind: "boolean", defaultValue: true },
  select1: { kind: "boolean", defaultValue: false },
  select0: { kind: "boolean", defaultValue: true },
};
const multiplexerDefinition = { type: multiplexerType, version: 2, thumbnailAssetKey: multiplexerThumbnail, parameters: multiplexerParameters };
const defaultMultiplexerValues = {
  input0: multiplexerDefinition.parameters.input0.defaultValue,
  input1: multiplexerDefinition.parameters.input1.defaultValue,
  input2: multiplexerDefinition.parameters.input2.defaultValue,
  input3: multiplexerDefinition.parameters.input3.defaultValue,
  select1: multiplexerDefinition.parameters.select1.defaultValue,
  select0: multiplexerDefinition.parameters.select0.defaultValue,
};
const booleanOr = (value: unknown, fallback: boolean): boolean => typeof value === "boolean" ? value : fallback;
const toBit = (value: boolean): number => +value;

function deriveMultiplexerState(values: MultiplexerValues) {
  const input0 = booleanOr(values.input0, defaultMultiplexerValues.input0);
  const input1 = booleanOr(values.input1, defaultMultiplexerValues.input1);
  const input2 = booleanOr(values.input2, defaultMultiplexerValues.input2);
  const input3 = booleanOr(values.input3, defaultMultiplexerValues.input3);
  const select1 = booleanOr(values.select1, defaultMultiplexerValues.select1);
  const select0 = booleanOr(values.select0, defaultMultiplexerValues.select0);
  const dataBits = [toBit(input0), toBit(input1), toBit(input2), toBit(input3)];
  const select1Bit = toBit(select1);
  const select0Bit = toBit(select0);
  const selectedIndex = select1Bit * 2 + select0Bit;
  return { input0, input1, input2, input3, select1, select0, dataBits, select1Bit, select0Bit, selectedIndex, output: dataBits[selectedIndex] };
}

function initializeMultiplexerSchema(): void {}
function initializeMultiplexerModel(): void {}

export {
  multiplexerDefinition as a,
  initializeMultiplexerSchema as i,
  initializeMultiplexerModel as n,
  deriveMultiplexerState as r,
  defaultMultiplexerValues as t,
};
