// @ts-expect-error The semantic dependency is registered by the shared manifest owner.
import { a as editablePlanContentByKey$, i as editablePlanByKey$, r as activePlan$ } from "@rchunk/editable-plan-tab";
// @ts-expect-error The semantic dependency declaration is maintained by the shared manifest owner.
import { n as openPlanSidePanel, r as openReadOnlyPlanSidePanel, t as initializePlanSidePanel } from "@rchunk/plan-side-panel";

initializePlanSidePanel();

export {
  activePlan$,
  editablePlanByKey$,
  editablePlanContentByKey$,
  openPlanSidePanel,
  openReadOnlyPlanSidePanel,
};
