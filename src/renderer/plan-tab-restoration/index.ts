// Restores local plan-summary tabs. Release chunk: restoration-f11722b5d1a1.js.
import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as planModelChunk from "@rchunk/local-conversation-plan-model";

interface Scope {
  value: { routeKind: string; conversationId: string };
  get(signal: unknown, parameter?: string): unknown;
}
interface SharedRuntime {
  iW(value: unknown): string;
  wL(): void;
}
interface InitialRuntime {
  Fcn(): void;
  HZt(): void;
  Icn: unknown;
  Syt: unknown;
  Ugn(
    scope: Scope,
    hostId: unknown,
  ): {
    ensureConversationHistoryLoaded(conversationId: string): Promise<void>;
  };
  Wgn(): void;
  _Qt: unknown;
  byt(): void;
  mpn: unknown;
  ppn(): void;
  wQt: unknown;
  wZt: unknown;
}
interface PlanModel {
  content: string;
  key: string;
}
interface PlanRuntime {
  n(): void;
  t(source: unknown, planKey: string): PlanModel | null;
}
interface RestoreInput {
  revealAndFocus: boolean;
  descriptor: { tabId: string };
  insertPosition?: unknown;
  scope: Scope;
}
type OpenPlanTab = (
  scope: Scope,
  plan: {
    content: string;
    conversationId: string;
    cwd: string | null;
    hideCodeBlocks: unknown;
    key: string;
    planKey: string;
    title: string;
  },
  options: { revealAndFocus: boolean; insertPosition?: unknown; tabId: string },
) => string;

const sharedRuntime = appSharedChunk as unknown as SharedRuntime;
const initialRuntime = appInitialChunk as unknown as InitialRuntime;
const planRuntime = planModelChunk as unknown as PlanRuntime;

async function restorePlanTabRoute(
  { revealAndFocus, descriptor, insertPosition, scope }: RestoreInput,
  planKey: string,
  openPlanTab: OpenPlanTab,
): Promise<boolean> {
  if (scope.value.routeKind !== "local-thread") return false;
  const conversationId = scope.value.conversationId;
  let modelSource = scope.get(initialRuntime.wZt, conversationId);
  let plan = planRuntime.t(
    modelSource ?? scope.get(initialRuntime._Qt, conversationId) ?? [],
    planKey,
  );
  if (plan == null && modelSource == null) {
    await initialRuntime
      .Ugn(scope, scope.get(initialRuntime.wQt, conversationId))
      .ensureConversationHistoryLoaded(conversationId);
    modelSource = scope.get(initialRuntime.wZt, conversationId);
    plan = planRuntime.t(
      modelSource ?? scope.get(initialRuntime._Qt, conversationId) ?? [],
      planKey,
    );
  }
  if (plan == null) return false;
  const workspace = scope.get(initialRuntime.Syt);
  const intl = scope.get(initialRuntime.mpn) as {
    formatMessage(descriptor: Record<string, string>): string;
  };
  return (
    openPlanTab(
      scope,
      {
        content: plan.content,
        conversationId,
        cwd: workspace == null ? null : sharedRuntime.iW(workspace),
        hideCodeBlocks: scope.get(initialRuntime.Icn),
        key: plan.key,
        planKey: plan.key,
        title: intl.formatMessage({
          id: "localConversation.planSummary.title",
          defaultMessage: "Plan",
          description: "Title for the plan summary card header",
        }),
      },
      { revealAndFocus, insertPosition, tabId: descriptor.tabId },
    ) === descriptor.tabId
  );
}

function initialize(): void {
  sharedRuntime.wL();
  initialRuntime.Wgn();
  initialRuntime.HZt();
  initialRuntime.ppn();
  initialRuntime.byt();
  initialRuntime.Fcn();
  planRuntime.n();
}
initialize();

export { restorePlanTabRoute };
