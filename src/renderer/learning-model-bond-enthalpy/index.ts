// Bond-enthalpy learning model for forward and reverse hydrogen-chlorine reactions.
import "@rchunk/rolldown-runtime";

type ReactionEquation = "H2 + Cl2 -> 2 HCl" | "2 HCl -> H2 + Cl2";
interface BondEnthalpyValues { initialReaction?: unknown; stage?: number | null }
interface BondEnergy { bond: string; count: number; enthalpy: number }

const reactionEquations: ReactionEquation[] = ["H2 + Cl2 -> 2 HCl", "2 HCl -> H2 + Cl2"];
const reactionData: Record<ReactionEquation, { reactants: Array<{ count: number; left: string; right: string; order: number }>; products: Array<{ count: number; left: string; right: string; order: number }>; broken: BondEnergy[]; formed: BondEnergy[]; atoms: string[] }> = {
  "H2 + Cl2 -> 2 HCl": {
    reactants: [{ count: 1, left: "H", right: "H", order: 1 }, { count: 1, left: "Cl", right: "Cl", order: 1 }],
    products: [{ count: 2, left: "H", right: "Cl", order: 1 }],
    broken: [{ bond: "H-H", count: 1, enthalpy: 436 }, { bond: "Cl-Cl", count: 1, enthalpy: 243 }],
    formed: [{ bond: "H-Cl", count: 2, enthalpy: 431 }],
    atoms: ["H", "H", "Cl", "Cl"],
  },
  "2 HCl -> H2 + Cl2": {
    reactants: [{ count: 2, left: "H", right: "Cl", order: 1 }],
    products: [{ count: 1, left: "H", right: "H", order: 1 }, { count: 1, left: "Cl", right: "Cl", order: 1 }],
    broken: [{ bond: "H-Cl", count: 2, enthalpy: 431 }],
    formed: [{ bond: "H-H", count: 1, enthalpy: 436 }, { bond: "Cl-Cl", count: 1, enthalpy: 243 }],
    atoms: ["H", "H", "Cl", "Cl"],
  },
};
const isReactionEquation = (value: unknown): value is ReactionEquation => typeof value === "string" && reactionEquations.some((reaction) => reaction === value);
const normalizeBondEnthalpyValues = (values: BondEnthalpyValues) => ({
  initialReaction: isReactionEquation(values.initialReaction) ? values.initialReaction : reactionEquations[0],
  stage: Number.isFinite(values.stage) ? Math.max(0, Math.min(2, Math.round(values.stage as number))) : 0,
});
const totalBondEnergy = (bonds: BondEnergy[]): number => bonds.reduce((total, { count, enthalpy }) => total + count * enthalpy, 0);
const maximumBondEnergy = Math.max(...Object.values(reactionData).flatMap(({ broken, formed }) => [totalBondEnergy(broken), totalBondEnergy(formed)]));

function deriveBondEnthalpyState(values: BondEnthalpyValues) {
  const normalized = normalizeBondEnthalpyValues(values);
  const reaction = reactionData[normalized.initialReaction];
  const breakingTotal = totalBondEnergy(reaction.broken);
  const formingTotal = totalBondEnergy(reaction.formed);
  const deltaH = breakingTotal - formingTotal;
  return { ...normalized, ...reaction, breakingTotal, formingTotal, deltaH, isExothermic: deltaH < 0 };
}

function initializeBondEnthalpyModel(): void {}

export {
  initializeBondEnthalpyModel as i,
  reactionEquations as n,
  deriveBondEnthalpyState as r,
  maximumBondEnergy as t,
};
