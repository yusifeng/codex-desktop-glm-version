// Alkene stereochemical-addition model: compare syn, anti, and nonstereospecific products.
import "@rchunk/rolldown-runtime";

type AlkeneAddition = "syn-hydroboration-oxidation" | "anti-halogenation" | "nonstereospecific-hydrohalogenation";
interface AlkeneAdditionInput { initial_addition?: string; stage?: number }

const alkeneAdditions: readonly AlkeneAddition[] = ["syn-hydroboration-oxidation", "anti-halogenation", "nonstereospecific-hydrohalogenation"];
const isAddition = (value: string | undefined): value is AlkeneAddition => alkeneAdditions.some((addition) => addition === value);
const normalizeAlkeneAddition = (input: AlkeneAdditionInput) => {
  const addition = isAddition(input.initial_addition) ? input.initial_addition : "syn-hydroboration-oxidation";
  const stage = Number.isFinite(input.stage) ? Math.max(0, Math.min(2, Math.round(input.stage as number))) : 0;
  if (addition === "anti-halogenation") return { addition, stage, leftGroup: "Br", rightGroup: "Br", reagent: "Br₂", relation: "trans" };
  if (addition === "nonstereospecific-hydrohalogenation") return { addition, stage, leftGroup: "H", rightGroup: "Br", reagent: "HBr", relation: "both" };
  return { addition, stage, leftGroup: "H", rightGroup: "OH", reagent: "1. BH₃   2. H₂O₂, OH⁻", relation: "cis" };
};
function initializeAlkeneStereochemicalAdditionsModel(): void {}

export { initializeAlkeneStereochemicalAdditionsModel as n, normalizeAlkeneAddition as r, alkeneAdditions as t };
