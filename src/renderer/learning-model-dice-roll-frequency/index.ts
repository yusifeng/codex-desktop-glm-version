// Dice-roll counts, summaries, and deterministic random sampling.
import "@rchunk/rolldown-runtime";

interface CountControl { defaultValue: number; min: number; max: number }
interface DiceRollValues { count1?: number | null; count2?: number | null; count3?: number | null; count4?: number | null; count5?: number | null; count6?: number | null; lastRoll?: number | null }

const dieFaces = [1, 2, 3, 4, 5, 6];
const countControl: CountControl = { defaultValue: 0, min: 0, max: 1_000_000 };
const countControls = [countControl, countControl, countControl, countControl, countControl, countControl];
const lastRollControl = { defaultValue: 0, min: 0, max: 6 };
const defaultDiceRollValues = { count1: 0, count2: 0, count3: 0, count4: 0, count5: 0, count6: 0, lastRoll: 0 };
const normalizeCount = (value: number | null | undefined, control: CountControl): number => Number.isFinite(value) ? Math.min(control.max, Math.max(control.min, Math.round(value ?? control.defaultValue))) : control.defaultValue;
const isDieFace = (value: number): boolean => Number.isInteger(value) && value >= 1 && value <= 6;
const normalizeLastRoll = (value: number | null | undefined): number => {
  if (!Number.isFinite(value)) return lastRollControl.defaultValue;
  const rounded = Math.round(value ?? lastRollControl.defaultValue);
  return rounded < lastRollControl.min || rounded > lastRollControl.max ? lastRollControl.defaultValue : rounded;
};
const normalizeDiceRollValues = (values: DiceRollValues) => {
  const counts = [normalizeCount(values.count1, countControls[0]), normalizeCount(values.count2, countControls[1]), normalizeCount(values.count3, countControls[2]), normalizeCount(values.count4, countControls[3]), normalizeCount(values.count5, countControls[4]), normalizeCount(values.count6, countControls[5])];
  const lastRoll = normalizeLastRoll(values.lastRoll);
  const validLastRoll = isDieFace(lastRoll) && counts[lastRoll - 1] > 0 ? lastRoll : lastRollControl.defaultValue;
  return { count1: counts[0], count2: counts[1], count3: counts[2], count4: counts[3], count5: counts[4], count6: counts[5], lastRoll: validLastRoll };
};
const summarizeDiceRolls = (values: DiceRollValues) => {
  const normalized = normalizeDiceRollValues(values);
  const counts = [normalized.count1, normalized.count2, normalized.count3, normalized.count4, normalized.count5, normalized.count6];
  return { counts, lastRoll: isDieFace(normalized.lastRoll) ? normalized.lastRoll : null, maximumCount: Math.max(0, ...counts), totalRolls: counts.reduce((sum, count) => sum + count, 0) };
};
const rollDie = (random: () => number): number => { const value = Math.min(Math.max(random(), 0), 1 - 2 ** -52); return Math.floor(value * 6) + 1; };
const rollDice = (values: DiceRollValues, rollCount: number, random: () => number) => {
  const normalized = normalizeDiceRollValues(values);
  const counts = [normalized.count1, normalized.count2, normalized.count3, normalized.count4, normalized.count5, normalized.count6];
  const count = Math.max(0, Math.floor(rollCount));
  let lastRoll = normalized.lastRoll;
  for (let roll = 0; roll < count; roll += 1) { const face = rollDie(random); const control = countControls[face - 1]; counts[face - 1] = Math.min(control.max, (counts[face - 1] ?? control.defaultValue) + 1); lastRoll = face; }
  return { count1: counts[0] ?? 0, count2: counts[1] ?? 0, count3: counts[2] ?? 0, count4: counts[3] ?? 0, count5: counts[4] ?? 0, count6: counts[5] ?? 0, lastRoll };
};

function initializeDiceRollFrequencyModel(): void {}

export { initializeDiceRollFrequencyModel as a, summarizeDiceRolls as i, defaultDiceRollValues as n, rollDice as r, dieFaces as t };
