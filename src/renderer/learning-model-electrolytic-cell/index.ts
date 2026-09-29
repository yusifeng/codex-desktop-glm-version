// Molten-electrolyte electrolysis learning model.
import "@rchunk/rolldown-runtime";

type Electrolyte = "molten sodium chloride" | "molten lead(II) bromide";
interface ElectrolyticCellValues { electrolyte?: string | null; stage?: number | null }

const electrolyticCellType = "ELECTROLYTIC_CELL";
const electrolyticCellThumbnail = "electrolytic-cell-v2";
const electrolyticCellParameters = { electrolyte: { kind: "enum", defaultValue: "molten sodium chloride" as Electrolyte, allowedValues: ["molten sodium chloride", "molten lead(II) bromide"] as Electrolyte[] } };
const electrolyticCellDefinition = { type: electrolyticCellType, version: 2, thumbnailAssetKey: electrolyticCellThumbnail, parameters: electrolyticCellParameters };
const electrolyteParameter = electrolyticCellDefinition.parameters.electrolyte;
const electrolytes = electrolyteParameter.allowedValues;
const electrolyticStages = ["power off", "ion migration", "electrode reactions", "products formed"];
const defaultElectrolyticCellValues = { electrolyte: electrolyteParameter.defaultValue, stage: 1 };
const electrolyteToIndex = (electrolyte: string): number => Math.max(0, electrolytes.indexOf(electrolyte as Electrolyte));
const indexToElectrolyte = (index: number): Electrolyte => electrolytes[Math.min(Math.max(Math.round(index), 0), electrolytes.length - 1)] ?? electrolyteParameter.defaultValue;
const isElectrolyte = (value: string): value is Electrolyte => electrolytes.includes(value as Electrolyte);
const normalizeElectrolyticCellValues = (values: ElectrolyticCellValues) => ({
  electrolyte: isElectrolyte(values.electrolyte ?? "") ? values.electrolyte as Electrolyte : electrolyteParameter.defaultValue,
  stage: Number.isFinite(values.stage) ? Math.min(Math.max(Math.round(values.stage ?? 1), 0), electrolyticStages.length - 1) : defaultElectrolyticCellValues.stage,
});
const getElectrolyteDetails = (electrolyte: Electrolyte) => electrolyte === "molten sodium chloride" ? {
  cation: "Na⁺", anion: "Cl⁻", cationLatex: "\\mathrm{Na^+}", anionLatex: "\\mathrm{Cl^-}", cationCharge: 1, anionCharge: -1, cationCount: 2, anionCount: 2,
  anodeHalfEquation: "2Cl⁻ → Cl₂ + 2e⁻", cathodeHalfEquation: "2Na⁺ + 2e⁻ → 2Na", anodeHalfEquationLatex: "\\mathrm{2Cl^- \\rightarrow Cl_2 + 2e^-}", cathodeHalfEquationLatex: "\\mathrm{2Na^+ + 2e^- \\rightarrow 2Na}",
  overallEquation: "2NaCl → 2Na + Cl₂", overallEquationLatex: "\\mathrm{2NaCl \\rightarrow 2Na + Cl_2}", anodeProductSymbol: "Cl₂", cathodeProductSymbol: "Na",
} : {
  cation: "Pb²⁺", anion: "Br⁻", cationLatex: "\\mathrm{Pb^{2+}}", anionLatex: "\\mathrm{Br^-}", cationCharge: 2, anionCharge: -1, cationCount: 2, anionCount: 4,
  anodeHalfEquation: "2Br⁻ → Br₂ + 2e⁻", cathodeHalfEquation: "Pb²⁺ + 2e⁻ → Pb", anodeHalfEquationLatex: "\\mathrm{2Br^- \\rightarrow Br_2 + 2e^-}", cathodeHalfEquationLatex: "\\mathrm{Pb^{2+} + 2e^- \\rightarrow Pb}",
  overallEquation: "PbBr₂ → Pb + Br₂", overallEquationLatex: "\\mathrm{PbBr_2 \\rightarrow Pb + Br_2}", anodeProductSymbol: "Br₂", cathodeProductSymbol: "Pb",
};

function initializeElectrolyticCellSchema(): void {}
function initializeElectrolyticCellModel(): void {}

export {
  getElectrolyteDetails as a,
  initializeElectrolyticCellSchema as c,
  electrolyteToIndex as i,
  electrolyticCellDefinition as l,
  electrolyticStages as n,
  initializeElectrolyticCellModel as o,
  indexToElectrolyte as r,
  normalizeElectrolyticCellValues as s,
  defaultElectrolyticCellValues as t,
};
