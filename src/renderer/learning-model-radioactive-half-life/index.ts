// Radioactive half-life model for successive whole half-lives.
import "@rchunk/rolldown-runtime";

interface HalfLifeValues { elapsedHalfLives?: number }

const elapsedHalfLivesControl = { min: 0, max: 4, step: 1, defaultValue: 2 };
const halfLifeLevels = [
  { elapsedHalfLives: 0, remainingFraction: 1, fractionLabel: "1", fractionLatex: "1" },
  { elapsedHalfLives: 1, remainingFraction: 1 / 2, fractionLabel: "1/2", fractionLatex: "\\frac{1}{2}" },
  { elapsedHalfLives: 2, remainingFraction: 1 / 4, fractionLabel: "1/4", fractionLatex: "\\frac{1}{4}" },
  { elapsedHalfLives: 3, remainingFraction: 1 / 8, fractionLabel: "1/8", fractionLatex: "\\frac{1}{8}" },
  { elapsedHalfLives: 4, remainingFraction: 1 / 16, fractionLabel: "1/16", fractionLatex: "\\frac{1}{16}" },
];
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
const remainingFractionAfterHalfLives = (elapsedHalfLives: number): number => 2 ** -elapsedHalfLives;
const normalizeHalfLifeValues = (values: HalfLifeValues) => ({
  elapsedHalfLives:
    typeof values.elapsedHalfLives === "number" && Number.isFinite(values.elapsedHalfLives)
      ? clamp(Math.round(values.elapsedHalfLives), elapsedHalfLivesControl.min, elapsedHalfLivesControl.max)
      : elapsedHalfLivesControl.defaultValue,
});
const calculateHalfLifeLevel = (values: HalfLifeValues) => {
  const { elapsedHalfLives } = normalizeHalfLifeValues(values);
  return halfLifeLevels[elapsedHalfLives] ?? halfLifeLevels[elapsedHalfLivesControl.defaultValue];
};

function initializeRadioactiveHalfLifeModel(): void {}

export {
  remainingFractionAfterHalfLives as a,
  initializeRadioactiveHalfLifeModel as i,
  halfLifeLevels as n,
  normalizeHalfLifeValues as o,
  calculateHalfLifeLevel as r,
  elapsedHalfLivesControl as t,
};
