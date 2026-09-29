// Solubility suppression caused by adding a common ion.
import "@rchunk/rolldown-runtime";

type SaltExample = "AgCl with NaCl" | "CaF2 with NaF" | "Mg(OH)2 with KOH";
interface CommonIonValues { salt_example?: unknown; addedCommonIonMilliMolar?: number | null }
interface SaltDefinition { commonIon: string; commonIonLatex: string; otherIon: string; otherIonLatex: string; solid: string; source: string; equilibriumLatex: string; kspLatex: string; ksp: number; commonStoichiometry: 1 | 2 }

const commonIonSpecification = {
  type: "COMMON_ION_EFFECT", version: 2, thumbnailAssetKey: "common-ion-effect-v1",
  parameters: { salt_example: { kind: "enum" as const, defaultValue: "AgCl with NaCl" as SaltExample, allowedValues: ["AgCl with NaCl", "CaF2 with NaF", "Mg(OH)2 with KOH"] as SaltExample[] } },
};
const addedCommonIonControl = { min: 0, max: 1, step: 0.01, defaultValue: 0.2 };
const saltDefinitions: Record<SaltExample, SaltDefinition> = {
  "AgCl with NaCl": { commonIon: "Cl⁻", commonIonLatex: "\\mathrm{Cl^-}", otherIon: "Ag⁺", otherIonLatex: "\\mathrm{Ag^+}", solid: "AgCl", source: "NaCl", equilibriumLatex: "\\mathrm{AgCl(s)}\\rightleftharpoons\\mathrm{Ag^+(aq)}+\\mathrm{Cl^-(aq)}", kspLatex: "K_{sp}=[\\mathrm{Ag^+}][\\mathrm{Cl^-}]=1.8\\times10^{-10}", ksp: 18e-11, commonStoichiometry: 1 },
  "CaF2 with NaF": { commonIon: "F⁻", commonIonLatex: "\\mathrm{F^-}", otherIon: "Ca²⁺", otherIonLatex: "\\mathrm{Ca^{2+}}", solid: "CaF₂", source: "NaF", equilibriumLatex: "\\mathrm{CaF_2(s)}\\rightleftharpoons\\mathrm{Ca^{2+}(aq)}+2\\mathrm{F^-(aq)}", kspLatex: "K_{sp}=[\\mathrm{Ca^{2+}}][\\mathrm{F^-}]^2=3.9\\times10^{-11}", ksp: 39e-12, commonStoichiometry: 2 },
  "Mg(OH)2 with KOH": { commonIon: "OH⁻", commonIonLatex: "\\mathrm{OH^-}", otherIon: "Mg²⁺", otherIonLatex: "\\mathrm{Mg^{2+}}", solid: "Mg(OH)₂", source: "KOH", equilibriumLatex: "\\mathrm{Mg(OH)_2(s)}\\rightleftharpoons\\mathrm{Mg^{2+}(aq)}+2\\mathrm{OH^-(aq)}", kspLatex: "K_{sp}=[\\mathrm{Mg^{2+}}][\\mathrm{OH^-}]^2=5.6\\times10^{-12}", ksp: 56e-13, commonStoichiometry: 2 },
};
const saltDefinition = (example: SaltExample): SaltDefinition => saltDefinitions[example];
const normalizeCommonIonValues = (values: CommonIonValues) => {
  const saltExample = typeof values.salt_example === "string" && commonIonSpecification.parameters.salt_example.allowedValues.some((example) => example === values.salt_example) ? values.salt_example as SaltExample : commonIonSpecification.parameters.salt_example.defaultValue;
  const concentration = typeof values.addedCommonIonMilliMolar === "number" && Number.isFinite(values.addedCommonIonMilliMolar) ? values.addedCommonIonMilliMolar : addedCommonIonControl.defaultValue;
  return { salt_example: saltExample, addedCommonIonMilliMolar: Math.min(addedCommonIonControl.max, Math.max(addedCommonIonControl.min, concentration)) };
};
const solveMolarSolubility = (example: SaltExample, addedCommonIonMolar: number): number => {
  const { commonStoichiometry, ksp } = saltDefinition(example);
  const pureWaterSolubility = commonStoichiometry === 1 ? Math.sqrt(ksp) : Math.cbrt(ksp / commonStoichiometry ** commonStoichiometry);
  if (addedCommonIonMolar === 0) return pureWaterSolubility;
  if (commonStoichiometry === 1) return (Math.sqrt(addedCommonIonMolar ** 2 + 4 * ksp) - addedCommonIonMolar) / 2;
  let lower = 0;
  let upper = pureWaterSolubility;
  for (let iteration = 0; iteration < 64; iteration += 1) {
    const midpoint = (lower + upper) / 2;
    if (midpoint * (addedCommonIonMolar + commonStoichiometry * midpoint) ** 2 > ksp) upper = midpoint; else lower = midpoint;
  }
  return (lower + upper) / 2;
};
const calculateCommonIonEffect = (values: CommonIonValues) => {
  const normalized = normalizeCommonIonValues(values);
  const salt = saltDefinition(normalized.salt_example);
  const addedCommonIonMolar = normalized.addedCommonIonMilliMolar / 1e3;
  const pureWaterSolubility = solveMolarSolubility(normalized.salt_example, 0);
  const molarSolubility = solveMolarSolubility(normalized.salt_example, addedCommonIonMolar);
  return { ...normalized, salt, pureWaterSolubility, molarSolubility, relativeSolubility: molarSolubility / pureWaterSolubility, commonIonMolar: addedCommonIonMolar + salt.commonStoichiometry * molarSolubility, otherIonMolar: molarSolubility };
};

function initializeCommonIonSpecification(): void {}
function initializeCommonIonModel(): void {}

export { initializeCommonIonSpecification as a, solveMolarSolubility as i, calculateCommonIonEffect as n, commonIonSpecification as o, initializeCommonIonModel as r, addedCommonIonControl as t };
