// Metal-reactivity displacement learning model.
import "@rchunk/rolldown-runtime";

type SelectableMetal = "magnesium" | "zinc" | "iron" | "copper" | "silver";
interface MetalReactivityValues { initial_solid_metal?: unknown; initial_aqueous_metal?: unknown }

const metalReactivityType = "METAL_REACTIVITY_SERIES";
const metalReactivityThumbnail = "metal-reactivity-series-v1";
const selectableMetals: SelectableMetal[] = ["magnesium", "zinc", "iron", "copper", "silver"];
const metalReactivityParameters = {
  initial_solid_metal: { kind: "enum", defaultValue: "zinc" as SelectableMetal, allowedValues: selectableMetals },
  initial_aqueous_metal: { kind: "enum", defaultValue: "copper" as SelectableMetal, allowedValues: selectableMetals },
};
const metalReactivityDefinition = { type: metalReactivityType, version: 3, thumbnailAssetKey: metalReactivityThumbnail, parameters: metalReactivityParameters };
const reactivitySeries: Array<{ name: string; symbol: string; reference?: boolean }> = [
  { name: "potassium", symbol: "K" }, { name: "sodium", symbol: "Na" }, { name: "calcium", symbol: "Ca" },
  { name: "magnesium", symbol: "Mg" }, { name: "aluminium", symbol: "Al" }, { name: "carbon", symbol: "C", reference: true },
  { name: "zinc", symbol: "Zn" }, { name: "iron", symbol: "Fe" }, { name: "hydrogen", symbol: "H", reference: true },
  { name: "copper", symbol: "Cu" }, { name: "silver", symbol: "Ag" }, { name: "gold", symbol: "Au" },
];
const metalIons: Record<SelectableMetal, { symbol: string; charge: number }> = {
  magnesium: { symbol: "Mg", charge: 2 }, zinc: { symbol: "Zn", charge: 2 }, iron: { symbol: "Fe", charge: 2 }, copper: { symbol: "Cu", charge: 2 }, silver: { symbol: "Ag", charge: 1 },
};
const isSelectableMetal = (value: unknown): value is SelectableMetal => typeof value === "string" && selectableMetals.some((metal) => metal === value);
const solidDefault = metalReactivityDefinition.parameters.initial_solid_metal.defaultValue;
const aqueousDefault = metalReactivityDefinition.parameters.initial_aqueous_metal.defaultValue;
if (!isSelectableMetal(solidDefault) || !isSelectableMetal(aqueousDefault)) throw Error("Invalid metal reactivity series manifest defaults");
const defaultMetalReactivityValues = { initial_solid_metal: solidDefault, initial_aqueous_metal: aqueousDefault };
const coefficient = (value: number): string => value === 1 ? "" : String(value);
const aqueousIonLatex = (symbol: string, charge: number, amount: number): string =>
  coefficient(amount) + "\\mathrm{" + symbol + "}^{" + (charge === 1 ? "+" : String(charge) + "+") + "}\\,(aq)";
const solidMetalLatex = (symbol: string, amount: number): string => coefficient(amount) + "\\mathrm{" + symbol + "}\\,(s)";
const displacementEquation = (solid: SelectableMetal, aqueous: SelectableMetal, reacts: boolean): string => {
  const solidIon = metalIons[solid];
  const aqueousIon = metalIons[aqueous];
  const commonCharge = solidIon.charge === aqueousIon.charge ? solidIon.charge : 2;
  const solidAmount = commonCharge / solidIon.charge;
  const aqueousAmount = commonCharge / aqueousIon.charge;
  const reactants = solidMetalLatex(solidIon.symbol, solidAmount) + "+" + aqueousIonLatex(aqueousIon.symbol, aqueousIon.charge, aqueousAmount);
  return reacts
    ? reactants + "\\rightarrow" + aqueousIonLatex(solidIon.symbol, solidIon.charge, solidAmount) + "+" + solidMetalLatex(aqueousIon.symbol, aqueousAmount)
    : reactants + "\\;\\nrightarrow";
};

function deriveMetalReactivityState(values: MetalReactivityValues) {
  const initial_solid_metal = isSelectableMetal(values.initial_solid_metal) ? values.initial_solid_metal : defaultMetalReactivityValues.initial_solid_metal;
  const initial_aqueous_metal = isSelectableMetal(values.initial_aqueous_metal) ? values.initial_aqueous_metal : defaultMetalReactivityValues.initial_aqueous_metal;
  const solidIndex = reactivitySeries.findIndex(({ name }) => name === initial_solid_metal);
  const aqueousIndex = reactivitySeries.findIndex(({ name }) => name === initial_aqueous_metal);
  const reacts = solidIndex < aqueousIndex;
  return { initial_solid_metal, initial_aqueous_metal, solidIndex, aqueousIndex, reacts, sameMetal: solidIndex === aqueousIndex, equation: displacementEquation(initial_solid_metal, initial_aqueous_metal, reacts) };
}

function initializeMetalReactivitySchema(): void {}
function initializeMetalReactivityModel(): void {}

export {
  deriveMetalReactivityState as a,
  initializeMetalReactivityModel as i,
  reactivitySeries as n,
  initializeMetalReactivitySchema as o,
  selectableMetals as r,
  metalReactivityDefinition as s,
  defaultMetalReactivityValues as t,
};
