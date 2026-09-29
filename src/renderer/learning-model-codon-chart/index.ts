// RNA codon-chart learning model. Release chunk: model-7fc37b4d721d.js.
import "@rchunk/rolldown-runtime";

type RnaBase = "U" | "C" | "A" | "G";
type AminoAcid = "Phe" | "Leu" | "Ser" | "Tyr" | "Stop" | "Cys" | "Trp" | "Pro" | "His" | "Gln" | "Arg" | "Ile" | "Met" | "Thr" | "Asn" | "Lys" | "Val" | "Ala" | "Asp" | "Glu" | "Gly";
interface CodonValues { first_base?: string | null; second_base?: string | null; third_base?: string | null }
interface CodonDefaults { first_base: RnaBase; second_base: RnaBase; third_base: RnaBase }
interface CodonManifest {
  type: string; version: number; thumbnailAssetKey: string;
  parameters: {
    first_base: { kind: "enum"; defaultValue: RnaBase; allowedValues: RnaBase[] };
    second_base: { kind: "enum"; defaultValue: RnaBase; allowedValues: RnaBase[] };
    third_base: { kind: "enum"; defaultValue: RnaBase; allowedValues: RnaBase[] };
  };
}

let codonManifest: CodonManifest;
let baseOrder: RnaBase[];
let codonTable: Record<string, AminoAcid[]>;
let defaultCodonValues: () => CodonDefaults;
let calculateCodon: (values: CodonValues) => {
  firstBase: RnaBase; secondBase: RnaBase; thirdBase: RnaBase; codon: string; outcome: AminoAcid;
  outcomes: AminoAcid[]; isStart: boolean; isStop: boolean;
};
let manifestInitialized = false;
let modelInitialized = false;

function initializeCodonManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  codonManifest = {
    type: "CODON_CHART", version: 2, thumbnailAssetKey: "codon-chart-v1",
    parameters: {
      first_base: { kind: "enum", defaultValue: "A", allowedValues: ["U", "C", "A", "G"] },
      second_base: { kind: "enum", defaultValue: "U", allowedValues: ["U", "C", "A", "G"] },
      third_base: { kind: "enum", defaultValue: "G", allowedValues: ["U", "C", "A", "G"] },
    },
  };
}

function initializeCodonChartModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeCodonManifest();
  baseOrder = ["U", "C", "A", "G"];
  codonTable = {
    UU: ["Phe", "Phe", "Leu", "Leu"], UC: ["Ser", "Ser", "Ser", "Ser"],
    UA: ["Tyr", "Tyr", "Stop", "Stop"], UG: ["Cys", "Cys", "Stop", "Trp"],
    CU: ["Leu", "Leu", "Leu", "Leu"], CC: ["Pro", "Pro", "Pro", "Pro"],
    CA: ["His", "His", "Gln", "Gln"], CG: ["Arg", "Arg", "Arg", "Arg"],
    AU: ["Ile", "Ile", "Ile", "Met"], AC: ["Thr", "Thr", "Thr", "Thr"],
    AA: ["Asn", "Asn", "Lys", "Lys"], AG: ["Ser", "Ser", "Arg", "Arg"],
    GU: ["Val", "Val", "Val", "Val"], GC: ["Ala", "Ala", "Ala", "Ala"],
    GA: ["Asp", "Asp", "Glu", "Glu"], GG: ["Gly", "Gly", "Gly", "Gly"],
  };
  const normalizeBase = (value: unknown, fallback: RnaBase): RnaBase => {
    switch (value) {
      case "U": case "C": case "A": case "G": return value;
      default: return fallback;
    }
  };
  defaultCodonValues = () => ({
    first_base: normalizeBase(codonManifest.parameters.first_base.defaultValue, "A"),
    second_base: normalizeBase(codonManifest.parameters.second_base.defaultValue, "U"),
    third_base: normalizeBase(codonManifest.parameters.third_base.defaultValue, "G"),
  });
  calculateCodon = values => {
    const defaults = defaultCodonValues();
    const firstBase = normalizeBase(values.first_base, defaults.first_base);
    const secondBase = normalizeBase(values.second_base, defaults.second_base);
    const thirdBase = normalizeBase(values.third_base, defaults.third_base);
    const outcomes = codonTable[`${firstBase}${secondBase}`];
    const outcome = outcomes[baseOrder.indexOf(thirdBase)];
    return {
      firstBase, secondBase, thirdBase, codon: `${firstBase}${secondBase}${thirdBase}`, outcome, outcomes,
      isStart: firstBase === "A" && secondBase === "U" && thirdBase === "G", isStop: outcome === "Stop",
    };
  };
}

export {
  calculateCodon as a, initializeCodonChartModel as i, codonTable as n, initializeCodonManifest as o,
  defaultCodonValues as r, codonManifest as s, baseOrder as t,
};
