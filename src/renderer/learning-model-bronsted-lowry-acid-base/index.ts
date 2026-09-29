// Brønsted–Lowry proton-transfer teaching model. Release chunk: model-935a8b1b1821.js.
import "@rchunk/rolldown-runtime";

const acidBaseExamples = ["generic-ha-b", "hcl-water", "water-ammonia", "acetic-acid-water"] as const;
type AcidBaseExample = (typeof acidBaseExamples)[number];
interface AcidBaseInput { example?: string; stage?: number }

const isAcidBaseExample = (value: string): value is AcidBaseExample => acidBaseExamples.some((example) => example === value);
const reactions: Record<AcidBaseExample, { acid: string; base: string; conjugateBase: string; conjugateAcid: string }> = {
  "generic-ha-b": { acid: "\\mathrm{A{-}H}", base: "{:}\\mathrm{B}", conjugateBase: "\\mathrm{A^-}", conjugateAcid: "\\mathrm{H{-}B^+}" },
  "hcl-water": { acid: "\\mathrm{Cl{-}H}", base: "{:}\\mathrm{OH_2}", conjugateBase: "\\mathrm{Cl^-}", conjugateAcid: "\\mathrm{H_3O^+}" },
  "water-ammonia": { acid: "\\mathrm{HO{-}H}", base: "{:}\\mathrm{NH_3}", conjugateBase: "\\mathrm{HO^-}", conjugateAcid: "\\mathrm{NH_4^+}" },
  "acetic-acid-water": { acid: "\\mathrm{CH_3COO{-}H}", base: "{:}\\mathrm{OH_2}", conjugateBase: "\\mathrm{CH_3COO^-}", conjugateAcid: "\\mathrm{H_3O^+}" },
};
const calculateAcidBaseReaction = (input: AcidBaseInput) => {
  const example = typeof input.example === "string" && isAcidBaseExample(input.example) ? input.example : "generic-ha-b";
  const stage = typeof input.stage === "number" && Number.isFinite(input.stage) ? Math.max(0, Math.min(2, Math.round(input.stage))) : 0;
  return { example, stage, reaction: reactions[example] };
};
function initializeBronstedLowryModel(): void {}

export { calculateAcidBaseReaction as i, initializeBronstedLowryModel as n, isAcidBaseExample as r, acidBaseExamples as t };
