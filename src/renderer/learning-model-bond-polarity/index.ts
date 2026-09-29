// Bond-polarity learning model based on electronegativity difference. Release chunk: model-940064895671.js.
import "@rchunk/rolldown-runtime";

type ElementSymbol = "H" | "C" | "O" | "F" | "Cl";
interface BondValues { atom1?: string | null; atom2?: string | null }
interface NormalizedBondValues { atom1: ElementSymbol; atom2: ElementSymbol }
interface BondManifest {
  type: string; version: number; thumbnailAssetKey: string; canonicalFormula: string;
  parameters: {
    atom1: { kind: "enum"; defaultValue: ElementSymbol; allowedValues: ElementSymbol[] };
    atom2: { kind: "enum"; defaultValue: ElementSymbol; allowedValues: ElementSymbol[] };
  };
}

let bondPolarityManifest: BondManifest;
let elementData: Record<ElementSymbol, { electronegativity: number }>;
let allowedElements: ElementSymbol[];
let defaultBondValues: NormalizedBondValues;
let normalizeBondValues: (values: BondValues) => NormalizedBondValues;
let calculateBondPolarity: (values: BondValues) => {
  values: NormalizedBondValues; left: { symbol: ElementSymbol; electronegativity: number };
  right: { symbol: ElementSymbol; electronegativity: number }; difference: number;
  direction: "equal" | "right" | "left"; strength: number;
};
let manifestInitialized = false;
let modelInitialized = false;

function initializeBondPolarityManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  bondPolarityManifest = {
    type: "BOND_POLARITY", version: 2, thumbnailAssetKey: "bond-polarity-v2",
    canonicalFormula: "\\Delta \\chi = |\\chi_2 - \\chi_1|",
    parameters: {
      atom1: { kind: "enum", defaultValue: "H", allowedValues: ["H", "C", "O", "F", "Cl"] },
      atom2: { kind: "enum", defaultValue: "Cl", allowedValues: ["H", "C", "O", "F", "Cl"] },
    },
  };
}

function initializeBondPolarityModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeBondPolarityManifest();
  elementData = {
    H: { electronegativity: 2.2 }, C: { electronegativity: 2.55 }, O: { electronegativity: 3.44 },
    F: { electronegativity: 3.98 }, Cl: { electronegativity: 3.16 },
  };
  const allowedByParameter = {
    atom1: new Set(bondPolarityManifest.parameters.atom1.allowedValues),
    atom2: new Set(bondPolarityManifest.parameters.atom2.allowedValues),
  };
  const isElementSymbol = (value: unknown): value is ElementSymbol =>
    value === "H" || value === "C" || value === "O" || value === "F" || value === "Cl";
  const isAllowedElement = (parameter: "atom1" | "atom2", value: unknown): value is ElementSymbol =>
    isElementSymbol(value) && allowedByParameter[parameter].has(value)
      && Object.prototype.hasOwnProperty.call(elementData, value);
  allowedElements = bondPolarityManifest.parameters.atom1.allowedValues;
  defaultBondValues = { atom1: bondPolarityManifest.parameters.atom1.defaultValue, atom2: bondPolarityManifest.parameters.atom2.defaultValue };
  const electronegativities = allowedElements.map(element => elementData[element].electronegativity);
  const maximumDifference = Math.max(...electronegativities) - Math.min(...electronegativities);
  normalizeBondValues = values => ({
    atom1: isAllowedElement("atom1", values.atom1) ? values.atom1 : defaultBondValues.atom1,
    atom2: isAllowedElement("atom2", values.atom2) ? values.atom2 : defaultBondValues.atom2,
  });
  calculateBondPolarity = values => {
    const normalized = normalizeBondValues(values);
    const left = elementData[normalized.atom1];
    const right = elementData[normalized.atom2];
    const signedDifference = right.electronegativity - left.electronegativity;
    const difference = Math.abs(signedDifference);
    return {
      values: normalized, left: { symbol: normalized.atom1, ...left }, right: { symbol: normalized.atom2, ...right },
      difference, direction: Math.abs(signedDifference) < 1e-3 ? "equal" : signedDifference > 0 ? "right" : "left",
      strength: Math.min(Number((difference / maximumDifference).toFixed(6)), 1),
    };
  };
}

export {
  initializeBondPolarityModel as a, bondPolarityManifest as c, calculateBondPolarity as i, allowedElements as n,
  normalizeBondValues as o, defaultBondValues as r, initializeBondPolarityManifest as s, elementData as t,
};
