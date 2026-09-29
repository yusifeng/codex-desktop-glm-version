// Ionic-bond-formation learning model for four binary compounds.
import "@rchunk/rolldown-runtime";

type IonicCompound = "sodium chloride" | "magnesium oxide" | "magnesium chloride" | "sodium oxide";
interface IonicBondValues { compound?: string | null; stage?: number | null }

const ionicBondType = "IONIC_BOND_FORMATION";
const ionicBondThumbnail = "ionic-bond-formation-v2";
const ionicBondParameters = { compound: { kind: "enum", defaultValue: "sodium chloride" as IonicCompound, allowedValues: ["sodium chloride", "magnesium oxide", "magnesium chloride", "sodium oxide"] as IonicCompound[] } };
const ionicBondDefinition = { type: ionicBondType, version: 1, thumbnailAssetKey: ionicBondThumbnail, parameters: ionicBondParameters };
const compoundData: Record<IonicCompound, { anionCharge: number; anionCount: number; cationCharge: number; cationCount: number; formula: string; metal: string; metalValence: number; nonmetal: string; nonmetalValence: number; transferred: number }> = {
  "sodium chloride": { anionCharge: -1, anionCount: 1, cationCharge: 1, cationCount: 1, formula: "NaCl", metal: "Na", metalValence: 1, nonmetal: "Cl", nonmetalValence: 7, transferred: 1 },
  "magnesium oxide": { anionCharge: -2, anionCount: 1, cationCharge: 2, cationCount: 1, formula: "MgO", metal: "Mg", metalValence: 2, nonmetal: "O", nonmetalValence: 6, transferred: 2 },
  "magnesium chloride": { anionCharge: -1, anionCount: 2, cationCharge: 2, cationCount: 1, formula: "MgCl₂", metal: "Mg", metalValence: 2, nonmetal: "Cl", nonmetalValence: 7, transferred: 2 },
  "sodium oxide": { anionCharge: -2, anionCount: 1, cationCharge: 1, cationCount: 2, formula: "Na₂O", metal: "Na", metalValence: 1, nonmetal: "O", nonmetalValence: 6, transferred: 2 },
};
const compounds = ionicBondDefinition.parameters.compound.allowedValues;
const defaultCompound = ionicBondDefinition.parameters.compound.defaultValue;
const createDefaultIonicBondValues = () => ({ compound: defaultCompound, stage: 1 });
const isIonicCompound = (value: string): value is IonicCompound => compounds.includes(value as IonicCompound);
const deriveIonicBondState = (values: IonicBondValues) => {
  const compound = isIonicCompound(values.compound ?? "") ? values.compound as IonicCompound : defaultCompound;
  const stage = Math.min(2, Math.max(0, Math.round(Number.isFinite(values.stage) ? values.stage as number : 1)));
  return { ...compoundData[compound], compound, stage };
};

function initializeIonicBondSchema(): void {}
function initializeIonicBondModel(): void {}

export {
  ionicBondDefinition as a,
  initializeIonicBondSchema as i,
  createDefaultIonicBondValues as n,
  initializeIonicBondModel as r,
  deriveIonicBondState as t,
};
