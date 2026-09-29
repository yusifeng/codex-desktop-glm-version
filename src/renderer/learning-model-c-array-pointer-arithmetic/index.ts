// C array pointer-arithmetic learning model.
import "@rchunk/rolldown-runtime";

interface PointerArithmeticValues { index?: number | null }

const cArrayPointerArithmeticType = "C_ARRAY_POINTER_ARITHMETIC";
const cArrayPointerArithmeticThumbnail = "c-array-pointer-arithmetic-v1";
const cArrayPointerArithmeticParameters = { index: { kind: "integer", defaultValue: 3, min: 0, max: 7 } };
const cArrayPointerArithmeticDefinition = { type: cArrayPointerArithmeticType, version: 1, thumbnailAssetKey: cArrayPointerArithmeticThumbnail, parameters: cArrayPointerArithmeticParameters };
const pointerIndexParameter = cArrayPointerArithmeticDefinition.parameters.index;
const fixedArray = [12, 7, -3, 40, 9, 21, 5, 16];
const formatAddress = (address: number): string => `0x${address.toString(16).toUpperCase()}`;

function normalizePointerArithmeticValues(values: PointerArithmeticValues) {
  const value = values.index;
  const index = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : pointerIndexParameter.defaultValue;
  return { index: Math.min(pointerIndexParameter.max, Math.max(pointerIndexParameter.min, index)) };
}

function derivePointerArithmeticState(values: PointerArithmeticValues) {
  const normalized = normalizePointerArithmeticValues(values);
  const cells = fixedArray.map((value, index) => {
    const address = 160 + index * 4;
    return { address, addressLabel: formatAddress(address), index, isSelected: index === normalized.index, value };
  });
  const selectedCell = cells[normalized.index] ?? cells[0];
  if (!selectedCell) throw Error("The fixed C array must contain at least one element.");
  return {
    baseAddressLabel: formatAddress(160),
    byteOffset: normalized.index * 4,
    cells,
    index: normalized.index,
    selectedAddressLabel: selectedCell.addressLabel,
    selectedValue: selectedCell.value,
    values: normalized,
  };
}

function initializeCArrayPointerArithmeticSchema(): void {}
function initializeCArrayPointerArithmeticModel(): void {}

export {
  initializeCArrayPointerArithmeticSchema as a,
  normalizePointerArithmeticValues as i,
  derivePointerArithmeticState as n,
  cArrayPointerArithmeticDefinition as o,
  initializeCArrayPointerArithmeticModel as r,
  pointerIndexParameter as t,
};
