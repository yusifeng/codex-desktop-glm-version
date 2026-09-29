// Two-step dichotomous key for identifying four tree species.
import "@rchunk/rolldown-runtime";

interface TreeKeyValues {
  firstChoice?: number | null;
  secondChoice?: number | null;
}

interface NormalizedTreeKeyValues {
  firstChoice: number;
  secondChoice: number;
}

const defaultTreeKeyValues: NormalizedTreeKeyValues = { firstChoice: -1, secondChoice: -1 };
const normalizeChoice = (choice: number | null | undefined): number => choice === 0 || choice === 1 ? choice : -1;

function normalizeTreeKeyValues(values: TreeKeyValues): NormalizedTreeKeyValues {
  const firstChoice = normalizeChoice(values.firstChoice);
  return {
    firstChoice,
    secondChoice: firstChoice === -1 ? -1 : normalizeChoice(values.secondChoice),
  };
}

function remainingTreeSpecies(values: TreeKeyValues): string[] {
  const normalized = normalizeTreeKeyValues(values);
  if (normalized.firstChoice === -1) return ["spruce", "pine", "magnolia", "birch"];
  if (normalized.firstChoice === 0) {
    return normalized.secondChoice === -1
      ? ["spruce", "pine"]
      : [normalized.secondChoice === 0 ? "spruce" : "pine"];
  }
  return normalized.secondChoice === -1
    ? ["magnolia", "birch"]
    : [normalized.secondChoice === 0 ? "magnolia" : "birch"];
}

function applyTreeKeyChoice(values: TreeKeyValues, choice: number): NormalizedTreeKeyValues {
  const normalized = normalizeTreeKeyValues(values);
  if (choice !== 0 && choice !== 1) return normalized;
  if (normalized.firstChoice === -1) return { firstChoice: choice, secondChoice: -1 };
  if (normalized.secondChoice === -1) return { ...normalized, secondChoice: choice };
  return normalized;
}

function initializeDichotomousTreeKeyModel(): void {}

export {
  normalizeTreeKeyValues as a,
  initializeDichotomousTreeKeyModel as i,
  applyTreeKeyChoice as n,
  remainingTreeSpecies as r,
  defaultTreeKeyValues as t,
};
