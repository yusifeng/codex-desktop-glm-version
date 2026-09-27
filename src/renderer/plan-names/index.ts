import * as appInitialChunk from "@rchunk/app-initial";
import "@rchunk/rolldown-runtime";

const { TT: defineMessages } = appInitialChunk;

type PlanType = "free" | "go" | "plus" | "pro" | "prolite" | "team" | string;

export interface PlanNameInput {
  initialPlanType?: PlanType;
  planType: PlanType;
  updatedPlanType?: PlanType;
}

function displayPlanName({
  initialPlanType,
  planType,
  updatedPlanType,
}: PlanNameInput): string | null {
  const changesProTier =
    (initialPlanType === "pro" || initialPlanType === "prolite") &&
    (updatedPlanType === "pro" || updatedPlanType === "prolite");

  if (planType === "pro") return changesProTier ? "Pro 20x" : "Pro";
  if (planType === "prolite") return changesProTier ? "Pro 5x" : "Pro";
  if (planType === "plus") return "Plus";
  if (planType === "go") return "Go";
  return null;
}

const planNameMessages = defineMessages({
  free: { id: "pricingPlanConstants.free.name", defaultMessage: "Free" },
  plus: { id: "pricingPlanConstants.plus.name", defaultMessage: "Plus" },
  go: { id: "pricingPlanConstants.go.name", defaultMessage: "Go" },
  team: {
    id: "pricingPlanConstants.teams.teamPlanName",
    defaultMessage: "Business",
  },
  pro: { id: "pricingPlanConstants.pro.name", defaultMessage: "Pro" },
});

function initializePlanNames(): void {}

export {
  displayPlanName as n,
  initializePlanNames as r,
  planNameMessages as t,
};
