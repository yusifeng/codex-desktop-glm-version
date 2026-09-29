// Conjugate acid-base pairs and proton donor/acceptor roles.
import "@rchunk/rolldown-runtime";

type ReactionExample = "water-and-ammonia" | "acetic-acid-and-water" | "hydrogen-fluoride-and-water";
interface ConjugatePairsValues { example?: unknown; direction?: unknown }
interface Species { latex: string; name: string }
interface ReactionDefinition { species: [Species, Species, Species, Species]; pairOne: string; pairTwo: string }

const reactionExamples: ReactionExample[] = ["water-and-ammonia", "acetic-acid-and-water", "hydrogen-fluoride-and-water"];
const reactions: Record<ReactionExample, ReactionDefinition> = {
  "water-and-ammonia": { species: [{ latex: "\\mathrm{H_2O}", name: "water" }, { latex: "\\mathrm{NH_3}", name: "ammonia" }, { latex: "\\mathrm{OH^-}", name: "hydroxide" }, { latex: "\\mathrm{NH_4^+}", name: "ammonium" }], pairOne: "H₂O / OH⁻", pairTwo: "NH₃ / NH₄⁺" },
  "acetic-acid-and-water": { species: [{ latex: "\\mathrm{HC_2H_3O_2}", name: "acetic-acid" }, { latex: "\\mathrm{H_2O}", name: "water" }, { latex: "\\mathrm{C_2H_3O_2^-}", name: "acetate" }, { latex: "\\mathrm{H_3O^+}", name: "hydronium" }], pairOne: "HC₂H₃O₂ / C₂H₃O₂⁻", pairTwo: "H₂O / H₃O⁺" },
  "hydrogen-fluoride-and-water": { species: [{ latex: "\\mathrm{HF}", name: "hydrogen-fluoride" }, { latex: "\\mathrm{H_2O}", name: "water" }, { latex: "\\mathrm{F^-}", name: "fluoride" }, { latex: "\\mathrm{H_3O^+}", name: "hydronium" }], pairOne: "HF / F⁻", pairTwo: "H₂O / H₃O⁺" },
};
const isReactionExample = (value: unknown): value is ReactionExample => typeof value === "string" && reactionExamples.some((example) => example === value);
const calculateConjugatePairs = (values: ConjugatePairsValues) => {
  const example = isReactionExample(values.example) ? values.example : "water-and-ammonia";
  const direction = values.direction === "reverse" ? "reverse" : "forward";
  const reaction = reactions[example];
  const forward = direction === "forward";
  return { example, direction, species: reaction.species, pairOne: reaction.pairOne, pairTwo: reaction.pairTwo, roles: forward ? ["acid", "base", "conjugate base", "conjugate acid"] : ["conjugate acid", "conjugate base", "base", "acid"], donor: reaction.species[forward ? 0 : 3], acceptor: reaction.species[forward ? 1 : 2], donorIndex: forward ? 0 : 3, acceptorIndex: forward ? 1 : 2 };
};

function initializeConjugateAcidBasePairsModel(): void {}

export { calculateConjugatePairs as n, initializeConjugateAcidBasePairsModel as r, reactionExamples as t };
