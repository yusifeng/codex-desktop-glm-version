// Peptide-bond learning model: normalize amino-acid examples and condensation stages.
import "@rchunk/rolldown-runtime";

type AminoAcidExample = "generic R1 and R2" | "glycine and alanine" | "serine and valine";
interface PeptideValues { aminoAcidExample?: string | null; linkageStage?: number | null }

const aminoAcidExamples: readonly AminoAcidExample[] = [
  "generic R1 and R2",
  "glycine and alanine",
  "serine and valine",
];

const isAminoAcidExample = (value: string | null | undefined): value is AminoAcidExample =>
  aminoAcidExamples.some((example) => example === value);

function normalizePeptideValues(values: PeptideValues) {
  const aminoAcidExample = isAminoAcidExample(values.aminoAcidExample)
    ? values.aminoAcidExample
    : "generic R1 and R2";
  const linkageStage = Number.isFinite(values.linkageStage)
    ? Math.min(2, Math.max(0, Math.round(values.linkageStage as number)))
    : 0;
  const peptideBonds = linkageStage;
  return {
    aminoAcidExample,
    linkageStage,
    residueCount: linkageStage === 2 ? 3 : 2,
    peptideBonds,
    waterMolecules: peptideBonds,
    sideChains: {
      "generic R1 and R2": ["R₁", "R₂", "R₁"],
      "glycine and alanine": ["H", "CH₃", "H"],
      "serine and valine": ["CH₂OH", "CH(CH₃)₂", "CH₂OH"],
    }[aminoAcidExample],
  };
}

function initializePeptideBondFormationModel(): void {}

export { normalizePeptideValues as n, initializePeptideBondFormationModel as r, aminoAcidExamples as t };
