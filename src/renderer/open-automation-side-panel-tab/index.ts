import "@rchunk/rolldown-runtime";
import {
  H3 as initializeLazyComponents,
  I3 as getJsxRuntime,
  Jm as createLazyComponent,
  lw as initializeReactRuntime,
  qm as initializePanelComponents,
  wy as AutomationFallbackIcon,
} from "@rchunk/app-shared";
import {
  Fg as automationRouteKind,
  Gvt as openSidePanelTab,
  Ig as initializeAutomationTabId,
  Ng as initializeAutomationPanelModel,
  Pg as createAutomationPanelDefinition,
  QCt as automationsQuery,
  Sun as initializeAutomationQueries,
  Vvt as bottomPanelState,
  Wvt as initializeSidePanelRuntime,
  ZCt as initializeAutomationRestore,
  _un as currentUserIdSignal,
  _vt as initializeRightPanelState,
  gvt as getTabTarget,
  mun as currentAccountIdSignal,
  qvt as rightPanelState,
  stt as initializeAutomationDetailQuery,
  ttt as automationDetailQuery,
  zg as getSuggestionAutomationTabId,
} from "@rchunk/app-initial";
import {
  n as resolveElicitation,
  t as initializeElicitationEvents,
} from "@rchunk/elicitation-events";
import {
  n as siteAutomationSetupState,
  t as initializeSiteAutomationSetupState,
} from "@rchunk/site-automation-setup-state";

interface AutomationSummary {
  id: string;
  name?: string | null;
}

interface AutomationScope {
  emit?(event: Record<string, unknown>): void;
  get<Value>(signal: unknown, parameter?: unknown): Value;
  set<Value>(signal: unknown, parameter: unknown, value: Value): void;
  query: {
    getOrFetch<Value>(query: unknown, parameter?: unknown): Promise<Value>;
  };
}

interface OpenAutomationOptions extends Record<string, unknown> {
  automationId: string;
  insertPosition?: unknown;
  revealAndFocus?: boolean;
  scope: AutomationScope;
  tabId?: string;
  target?: string;
  title?: string;
}

interface SuggestionSeed extends Record<string, unknown> {
  directiveKey: string;
  elicitation?: unknown;
}

interface SiteAutomationProposal extends Record<string, unknown> {
  projectId: string;
  title?: string;
}

const jsx = getJsxRuntime();
let AutomationSidePanelTabIcon: (props: Record<string, unknown>) => unknown;
let automationPanelDefinition: unknown;

function openAutomationSidePanelTab({
  scope,
  revealAndFocus = true,
  automationId,
  insertPosition,
  tabId,
  target = "right",
  title,
}: OpenAutomationOptions): void {
  openAutomationPanel({
    scope,
    revealAndFocus,
    durableRoute: {
      kind: automationRouteKind,
      params: { automationId },
      payloadVersion: 1,
    },
    insertPosition,
    request: { type: "automation", automationId },
    tabId: tabId ?? `automation:${automationId}`,
    target,
    title,
  });
}

async function restoreAutomationSidePanelTab(
  scope: AutomationScope,
  automationId: string,
  options: Omit<OpenAutomationOptions, "automationId" | "scope" | "title">,
): Promise<boolean> {
  try {
    const { items } = await scope.query.getOrFetch<{ items: AutomationSummary[] }>(automationsQuery);
    const summary = items.find((item) => item.id === automationId);
    const detail = summary == null
      ? await scope.query.getOrFetch<{ automation: { title?: string | null } }>(
        automationDetailQuery,
        automationId,
      )
      : null;
    const title = summary?.name ?? detail?.automation.title;
    if (title == null) return false;
    openAutomationSidePanelTab({ scope, automationId, title, ...options });
    return true;
  } catch {
    return false;
  }
}

function openAutomationSuggestion({
  scope,
  seed,
  title,
}: {
  scope: AutomationScope;
  seed: SuggestionSeed;
  title: string;
}): void {
  openAutomationPanel({
    scope,
    request: { type: "suggestion", seed },
    tabId: getSuggestionAutomationTabId(seed.directiveKey),
    title,
  });
}

function openSiteAutomation({
  scope,
  ...proposal
}: SiteAutomationProposal & { scope: AutomationScope }): void {
  const tabId = `site-automation:${proposal.projectId}`;
  const setupKey = JSON.stringify([
    scope.get(currentAccountIdSignal),
    scope.get(currentUserIdSignal),
    proposal.projectId,
  ]);
  if (getTabTarget(scope, tabId) == null
    && scope.get<{ status?: string } | null>(siteAutomationSetupState, setupKey)?.status === "saved") {
    scope.set(siteAutomationSetupState, setupKey, null);
  }
  openAutomationPanel({
    scope,
    request: { type: "site", proposal },
    tabId,
    title: proposal.title,
  });
}

function openAutomationPanel({
  scope,
  revealAndFocus = true,
  durableRoute,
  insertPosition,
  request,
  tabId,
  target = "right",
  title,
}: {
  scope: AutomationScope;
  revealAndFocus?: boolean;
  durableRoute?: unknown;
  insertPosition?: unknown;
  request: Record<string, unknown> & { type: string };
  tabId: string;
  target?: string;
  title: string;
}): void {
  openSidePanelTab(scope, automationPanelDefinition, {
    revealAndFocus,
    defaultState: () => ({ draftInstanceId: crypto.randomUUID(), savedAutomationId: null }),
    durableRoute,
    icon: jsx.jsx(AutomationSidePanelTabIcon, {}),
    insertPosition,
    props: { request },
    id: tabId,
    target: getTabTarget(scope, tabId) ?? target,
    title,
    tooltip: title,
    onClose: (closingScope: AutomationScope, placement: string) => {
      const panelState = placement === "right" ? rightPanelState : bottomPanelState;
      const state = closingScope.get<{ value?: { savedAutomationId?: string | null } } | null>(
        panelState.tabStateById$,
        tabId,
      )?.value;
      if (request.type === "suggestion") {
        const seed = request.seed as SuggestionSeed;
        if (seed.elicitation != null
          && typeof state === "object"
          && state != null
          && state.savedAutomationId == null) {
          resolveElicitation(
            closingScope,
            seed.elicitation as Record<string, unknown>,
            "dismiss",
          );
        }
      }
    },
  });
}

function initializeOpenAutomationSidePanelTab(): void {
  initializeElicitationEvents();
  initializeSidePanelRuntime();
  initializeAutomationQueries();
  initializeReactRuntime();
  initializePanelComponents();
  initializeAutomationPanelModel();
  initializeRightPanelState();
  initializeAutomationRestore();
  initializeAutomationTabId();
  initializeAutomationDetailQuery();
  initializeSiteAutomationSetupState();
  initializeLazyComponents();
  AutomationSidePanelTabIcon = createLazyComponent(
    async () => (await import("@rchunk/automation-side-panel-tab-core"))
      .AutomationSidePanelTabIcon,
    {
      fallback: jsx.jsx(AutomationFallbackIcon, { "aria-hidden": false }),
      propagateLoadError: true,
    },
  );
  automationPanelDefinition = createAutomationPanelDefinition({
    open: openAutomationSidePanelTab,
    restore: restoreAutomationSidePanelTab,
  });
}

export {
  restoreAutomationSidePanelTab as a,
  openSiteAutomation as i,
  openAutomationSidePanelTab as n,
  openAutomationSuggestion as r,
  initializeOpenAutomationSidePanelTab as t,
};
