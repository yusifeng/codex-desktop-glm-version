// E1/E2 elimination-reaction teaching model. Release chunk: model-f7b896cb4e3e.js.
import "@rchunk/rolldown-runtime";

type InitialConditions = "tertiary-weak-base-e1" | "tertiary-strong-base-e2" | "primary-strong-base-e2";
interface EliminationReactionInput { initial_conditions?: string; stage?: number }

const eliminationConditions: InitialConditions[] = ["tertiary-weak-base-e1", "tertiary-strong-base-e2", "primary-strong-base-e2"];
const normalizeEliminationReaction = (input: EliminationReactionInput) => {
  const conditions = eliminationConditions.includes(input.initial_conditions as InitialConditions)
    ? input.initial_conditions as InitialConditions
    : "tertiary-weak-base-e1";
  const pathway = conditions === "tertiary-weak-base-e1" ? "E1" as const : "E2" as const;
  const maxStage = pathway === "E1" ? 3 : 2;
  const stage = Number.isFinite(input.stage)
    ? Math.max(0, Math.min(maxStage, Math.round(input.stage as number)))
    : 1;
  return { conditions, pathway, tertiary: conditions !== "primary-strong-base-e2", stage, maxStage };
};
const selectEliminationConditions = (input: EliminationReactionInput, conditions: InitialConditions): EliminationReactionInput => ({
  ...input, initial_conditions: conditions, stage: 1,
});
function initializeEliminationReactionsModel(): void {}

export { selectEliminationConditions as i, initializeEliminationReactionsModel as n, normalizeEliminationReaction as r, eliminationConditions as t };
