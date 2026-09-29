// Review-side-panel lazy runtime entry. Release chunk: runtime-337e1f2ac0bd.js.
import "@rchunk/app-shared";
import * as appInitial from "@rchunk/app-initial";
type Runtime = typeof appInitial & { Fi: unknown; Ii: (...arguments_: unknown[]) => unknown; Mi: (...arguments_: unknown[]) => unknown; Ni: (...arguments_: unknown[]) => unknown; Pi: (...arguments_: unknown[]) => unknown; ji: () => void };
const runtime = appInitial as Runtime; runtime.ji();
const reviewTabType = runtime.Fi; const toggleThreadReviewSidePanelTab = runtime.Ii; const openThreadBranchReviewSidePanelTab = runtime.Mi; const openThreadLastTurnReviewSidePanelTab = runtime.Ni; const openThreadReviewSidePanelTab = runtime.Pi;
export { openThreadBranchReviewSidePanelTab, openThreadLastTurnReviewSidePanelTab, openThreadReviewSidePanelTab, reviewTabType, toggleThreadReviewSidePanelTab };
