// Halogen-reactivity displacement learning model.
import "@rchunk/rolldown-runtime";

type Halogen = "chlorine" | "bromine" | "iodine";
type Halide = "chloride" | "bromide" | "iodide";
interface HalogenReactivityValues { initial_halogen?: unknown; initial_halide?: unknown }

const halogenReactivityType = "HALOGEN_REACTIVITY_TREND";
const halogenReactivityThumbnail = "halogen-reactivity-trend-v1";
const halogenReactivityParameters = {
  initial_halogen: { kind: "enum", defaultValue: "chlorine" as Halogen, allowedValues: ["chlorine", "bromine", "iodine"] as Halogen[] },
  initial_halide: { kind: "enum", defaultValue: "bromide" as Halide, allowedValues: ["chloride", "bromide", "iodide"] as Halide[] },
};
const halogenReactivityDefinition = { type: halogenReactivityType, version: 3, thumbnailAssetKey: halogenReactivityThumbnail, parameters: halogenReactivityParameters };
const halogens: Halogen[] = ["chlorine", "bromine", "iodine"];
const halides: Halide[] = ["chloride", "bromide", "iodide"];
const isHalogen = (value: unknown): value is Halogen => typeof value === "string" && halogens.some((halogen) => halogen === value);
const isHalide = (value: unknown): value is Halide => typeof value === "string" && halides.some((halide) => halide === value);
const defaultHalogen = halogenReactivityDefinition.parameters.initial_halogen.defaultValue;
const defaultHalide = halogenReactivityDefinition.parameters.initial_halide.defaultValue;
if (!isHalogen(defaultHalogen) || !isHalide(defaultHalide)) throw Error("Invalid default in halogen reactivity trend manifest");
const defaultHalogenReactivityValues = { initial_halogen: defaultHalogen, initial_halide: defaultHalide };
const halogenSymbols: Record<Halogen, string> = { chlorine: "Cl", bromine: "Br", iodine: "I" };
const halideSymbols: Record<Halide, string> = { chloride: "Cl", bromide: "Br", iodide: "I" };
const calculateDisplacement = (halogen: Halogen, halide: Halide) => {
  const reacts = halogens.indexOf(halogen) < halides.indexOf(halide);
  const liberated = reacts ? halide === "bromide" ? "bromine" : "iodine" : null;
  const halogenSymbol = halogenSymbols[halogen];
  const halideSymbol = halideSymbols[halide];
  return {
    halogen,
    halide,
    reacts,
    liberated,
    equation: reacts ? `\\mathrm{${halogenSymbol}}_2 + 2\\mathrm{${halideSymbol}}^- \\rightarrow 2\\mathrm{${halogenSymbol}}^- + \\mathrm{${halideSymbol}}_2` : null,
  };
};

function deriveHalogenReactivityState(values: HalogenReactivityValues) {
  const initial_halogen = isHalogen(values.initial_halogen) ? values.initial_halogen : defaultHalogenReactivityValues.initial_halogen;
  const initial_halide = isHalide(values.initial_halide) ? values.initial_halide : defaultHalogenReactivityValues.initial_halide;
  const halogenIndex = halogens.indexOf(initial_halogen);
  const halideIndex = halides.indexOf(initial_halide);
  const cells = halogens.flatMap((halogen) => halides.map((halide) => calculateDisplacement(halogen, halide)));
  return { initial_halogen, initial_halide, halogenIndex, halideIndex, selected: cells[halogenIndex * halides.length + halideIndex], cells };
}

function initializeHalogenReactivitySchema(): void {}
function initializeHalogenReactivityModel(): void {}

export {
  deriveHalogenReactivityState as a,
  initializeHalogenReactivityModel as i,
  halogens as n,
  initializeHalogenReactivitySchema as o,
  defaultHalogenReactivityValues as r,
  halogenReactivityDefinition as s,
  halides as t,
};
