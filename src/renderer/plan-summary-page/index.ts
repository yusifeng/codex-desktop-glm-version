import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/plan-summary-item-content";

export interface PlanSummaryRouteState { planContent?: string; conversationId?: string; hostId?: string; }
export interface PlanSummaryPageProps { state?: PlanSummaryRouteState | null; }
let jsx: JsxRuntime;
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }

function PlanSummaryPage({ state }: PlanSummaryPageProps): unknown {
  const runtime = ensureJsx();
  if (!state?.planContent || !state.conversationId || !state.hostId) return runtime.jsx("main", { className: "plan-summary-page", "aria-busy": true, children: runtime.jsx("div", { className: "plan-summary-skeleton" }) });
  return runtime.jsx("main", { className: "plan-summary-page", "data-conversation-id": state.conversationId, "data-host-id": state.hostId, children: runtime.jsxs("article", { "data-role": "assistant", children: [runtime.jsx("h1", { children: "Plan" }), runtime.jsx("div", { className: "plan-summary-content", children: state.planContent })] }) });
}

export { PlanSummaryPage };
