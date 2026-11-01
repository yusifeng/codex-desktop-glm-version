import { n as onceExport } from "@rchunk/rolldown-runtime";
import {
  CS as PullRequestIcon,
  H3 as initializeSidePanelRuntime,
  I3 as getJsxRuntime,
  Jm as createLazyComponent,
  V3 as preloadModule,
  lw as initializePullRequestIcon,
  qm as initializeSidePanelIcons,
} from "@rchunk/app-shared";
import type { JsxRuntime } from "@rchunk/app-shared";
import {
  FDt as initializePullRequestTabRuntime,
  Gvt as openRegisteredTab,
  IDt as registerTabKind,
  Wvt as initializeTabRegistry,
  X8t as pullRequestIdentity,
  Z8t as normalizeHostname,
  _vt as initializeTabStore,
  by as pullRequestQuery,
  e5t as normalizeAccount,
  gvt as findTabPlacement,
  hvt as placementStore,
  i5t as initializePullRequestQuery,
  mpn as conversationIntl,
  ppn as initializeConversationIntl,
  vvt as focusPlacement,
  yy as initializePullRequestIdentity,
} from "@rchunk/app-initial";

interface PullRequestRequest {
  account: { hostId: string; [key: string]: unknown };
  pullRequest: {
    hostname: string;
    owner: string;
    repository: string;
    number: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
interface Scope {
  get(signal: unknown, parameter?: unknown): any;
}
interface TabRegistration {
  dropDestinations: string[];
  [key: string]: unknown;
}

const once = onceExport as (initializer: () => void) => () => void;
let jsx: JsxRuntime;
let registration: TabRegistration;
let PullRequestRevisionTab: (props: Record<string, unknown>) => unknown;
let RegisteredPullRequestThumbnail: (props: Record<string, unknown>) => unknown;

function createTabDescriptor(
  scope: Scope,
  request: PullRequestRequest,
  providedTitle?: string,
): Record<string, unknown> {
  const pullRequest = {
    ...request.pullRequest,
    hostname: normalizeHostname(request.pullRequest.hostname),
    owner: request.pullRequest.owner.toLowerCase(),
    repository: request.pullRequest.repository.toLowerCase(),
  };
  const normalizedRequest = {
    account: normalizeAccount(request.account),
    pullRequest,
  };
  const identity = pullRequestIdentity(pullRequest);
  const id = `pull-request-code:${encodeURIComponent(request.account.hostId)}|${identity}`;
  const fallbackTitle = scope.get(conversationIntl).formatMessage(
    {
      id: "thread.sidePanel.pullRequestTab.title",
      defaultMessage: "PR #{number}",
      description: "Title for a pull request side-panel tab",
    },
    { number: pullRequest.number },
  );
  const title =
    providedTitle ??
    scope.get(pullRequestQuery, { request, source: "pull_requests_page" }).data
      ?.title ??
    "";
  return {
    id,
    props: { request: normalizedRequest },
    title: title.trim() || fallbackTitle,
    tooltip: `${pullRequest.hostname}/${pullRequest.owner}/${pullRequest.repository} #${pullRequest.number} — ${title} (${request.account.hostId})`,
  };
}

function createRegistration({
  open,
}: {
  open: typeof openThreadPullRequestCodeTab;
}): TabRegistration {
  return registerTabKind("pull-request-code", PullRequestRevisionTab, {
    defaultState: () => ({ snapshot: null, commitSha: null }),
    getIcon: () => jsx.jsx(PullRequestIcon, {}),
    isAvailable: () => true,
    open,
    renderThumbnail: (props: Record<string, unknown>, tab: { title: string }) =>
      jsx.jsx(RegisteredPullRequestThumbnail, {
        props: {
          request: {
            provider: "github",
            ...(props.request as Record<string, unknown>),
          },
        },
        title: tab.title,
      }),
  }) as TabRegistration;
}

function openThreadPullRequestCodeTab(
  scope: Scope,
  request: PullRequestRequest,
  title?: string,
  reset = false,
  requestedPlacement = "right",
): { tabId: string; placement: string; status: "existing" | "opened" } {
  const descriptor = createTabDescriptor(scope, request, title);
  const tabId = descriptor.id as string;
  const existingPlacement = findTabPlacement(scope, tabId);
  const placement =
    existingPlacement ??
    (registration.dropDestinations.includes(requestedPlacement)
      ? requestedPlacement
      : "right");
  openRegisteredTab(scope, registration, {
    ...descriptor,
    kind: "pull-request-code",
    requiresWorkspaceReady: false,
    target: placement,
    revealAndFocus: true,
  });
  if (reset) {
    (
      placementStore(placement) as {
        updateTabState(scope: Scope, id: string, updater: () => unknown): void;
      }
    ).updateTabState(scope, tabId, () => ({ snapshot: null, commitSha: null }));
  }
  focusPlacement(scope, placement);
  return {
    tabId,
    placement,
    status: existingPlacement == null ? "opened" : "existing",
  };
}

const initializeLazyComponents = once(() => {
  initializePullRequestTabRuntime();
  initializePullRequestIcon();
  initializeSidePanelIcons();
  jsx = getJsxRuntime();
  initializeSidePanelRuntime();
  PullRequestRevisionTab = createLazyComponent(
    async () => {
      const loaded = await preloadModule(
        async () => import("@rchunk/pull-request-revision-tab"),
        [],
        import.meta.url,
      );
      return (
        loaded as {
          PullRequestRevisionTab: (props: Record<string, unknown>) => unknown;
        }
      ).PullRequestRevisionTab;
    },
    { propagateLoadError: true },
  );
  RegisteredPullRequestThumbnail = createLazyComponent(
    async () => {
      const loaded = await preloadModule(
        async () => import("@rchunk/registered-pull-request-thumbnail"),
        [],
        import.meta.url,
      );
      return (
        loaded as {
          RegisteredPullRequestThumbnail: (
            props: Record<string, unknown>,
          ) => unknown;
        }
      ).RegisteredPullRequestThumbnail;
    },
    { propagateLoadError: true },
  );
});

const initializePullRequestCodeTab = once(() => {
  initializeTabRegistry();
  initializeConversationIntl();
  initializePullRequestQuery();
  initializePullRequestIdentity();
  initializeLazyComponents();
  initializeTabStore();
  registration = createRegistration({ open: openThreadPullRequestCodeTab });
});

export { openThreadPullRequestCodeTab as n, initializePullRequestCodeTab as t };
