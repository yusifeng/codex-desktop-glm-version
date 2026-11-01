import { n as onceExport } from "@rchunk/rolldown-runtime";
import {
  BX as useScopedSelectorExport,
  FC as GitLabIcon,
  FX as initializeQueryRuntime,
  QI as initializeScopedRuntime,
  ZI as applicationScope,
  aW as normalizeRepositoryRoot,
  e6 as getReactRuntime,
  iW as normalizeCwd,
  lw as initializePathRuntime,
  rZ as createScopedSelectorExport,
  wL as initializeSelectorRuntime,
  type ReactRuntime,
} from "@rchunk/app-shared";
import {
  Cdt as initializePullRequestTabRuntime,
  Cf as getGitLabAccountExport,
  Dyt as currentHostId,
  E$ as initializePullRequestSummaryRuntime,
  Ef as initializePullRequestQueryRuntime,
  FXt as isGitLabPullRequestEnabledExport,
  Gvt as openSidePanelTabExport,
  PXt as initializePullRequestUrlRuntime,
  Syt as currentCwd,
  T$ as PullRequestStateIcon,
  Wvt as initializeSidePanelRuntime,
  X8t as getPullRequestUrlExport,
  Xy as fetchPullRequestBoardExport,
  Yy as initializePullRequestBoardRuntime,
  _3t as initializeGitHubIconRuntime,
  _g as pullRequestDurableRouteKind,
  _vt as initializeSidePanelPlacementRuntime,
  _y as fetchCanonicalPullRequestExport,
  a5t as pullRequestMatchesExport,
  byt as initializeThreadContextRuntime,
  g3t as GitHubIcon,
  gf as pullRequestStatusQuery,
  gg as createPullRequestTabApiExport,
  gvt as getExistingTabPlacement,
  gy as canonicalAccountQuery,
  hdt as repositoryRootQuery,
  hf as initializePullRequestStatusRuntime,
  hg as initializePullRequestIconRuntime,
  i5t as initializeRepositoryTargetRuntime,
  mpn as intlSignal,
  of as normalizePullRequestStatusExport,
  pdt as initializeRepositoryRuntime,
  ppn as initializeIntlRuntime,
  s5t as parsePullRequestUrlExport,
  sf as projectPullRequestStateExport,
  vg as initializePullRequestRouteRuntime,
  vvt as focusSidePanel,
  w$ as PullRequestStatusIcon,
  wf as fetchGitLabPullRequestExport,
  xdt as createRepositoryTargetExport,
  yy as initializePullRequestStateRuntime,
} from "@rchunk/app-initial";

interface PullRequestUrl {
  hostname: string;
  number: number;
  owner: string;
  repository: string;
}
interface RepositoryTarget {
  cwd: string;
  hostId: string;
  root?: string;
}
interface PullRequestBoardItem {
  cwd: string;
  headBranch: string;
  isDraft?: boolean;
  number: number;
  state: string;
  title: string;
  url: string;
  [key: string]: unknown;
}
interface PullRequestStatusKey {
  cwd: string;
  headBranch: string;
  hostId: string;
  operationSource: string;
  url: string;
}
interface BoardTabOptions {
  defaultMergeMenuOpen?: boolean;
  hostId?: string;
  item: PullRequestBoardItem;
  provider: "github";
  repo: string;
  repositoryTarget: RepositoryTarget;
  statusKey: PullRequestStatusKey;
}
interface CanonicalRequest {
  account: { hostId: string; [key: string]: unknown };
  provider: "github" | "gitlab";
  pullRequest: PullRequestUrl;
}
interface CanonicalTabOptions {
  request: CanonicalRequest;
  repositoryTarget?: RepositoryTarget;
  title: string;
}
interface DurableRoute {
  kind: unknown;
  params: {
    cwd: string;
    hostId: string;
    repositoryRoot?: string;
    source: "board" | "canonical";
    url: string;
  };
  payloadVersion: 1;
}
interface TabDescriptor {
  defaultMergeMenuOpen?: boolean;
  hostId?: string;
  icon: unknown;
  id: string;
  item?: PullRequestBoardItem;
  repo?: string;
  request?: CanonicalRequest;
  requiresWorkspaceReady: boolean;
  repositoryTarget?: RepositoryTarget;
  statusKey?: PullRequestStatusKey;
  summaryOnly?: boolean;
  title: string;
  tooltip: string;
}
interface QueryHost {
  getOrFetch<Value>(query: unknown, input?: unknown): Promise<Value>;
}
interface PullRequestTabScope {
  query: QueryHost;
  value: { routeKind?: string };
  get<Value>(signal: unknown): Value;
}
interface RestoreRoute {
  cwd: string;
  hostId: string;
  repositoryRoot?: string;
  source: "board" | "canonical";
  url: string;
}
interface OpenTabOptions {
  insertPosition?: number;
  revealAndFocus?: boolean;
  tabId?: string;
  target?: string;
}
interface SelectorRead {
  get<Value>(query: unknown, input: unknown): { data?: Value };
}

const once = onceExport as (initializer: () => void) => () => void;
const useScopedSelector = useScopedSelectorExport as unknown as (
  selector: unknown,
  input: unknown,
  options: { enabled: boolean },
) => string;
const createScopedSelector = createScopedSelectorExport as unknown as (
  scope: unknown,
  selector: (
    input: {
      fallbackState: string;
      statusKey: PullRequestStatusKey;
      url: string;
    },
    context: SelectorRead,
  ) => string,
) => unknown;
const isGitLabPullRequestEnabled =
  isGitLabPullRequestEnabledExport as unknown as (
    scope: PullRequestTabScope,
  ) => boolean;
const getGitLabAccount = getGitLabAccountExport as unknown as (
  scope: PullRequestTabScope,
  hostId: string,
) => Promise<Record<string, unknown>>;
const getPullRequestUrl = getPullRequestUrlExport as unknown as (
  pullRequest: PullRequestUrl,
) => string;
const parsePullRequestUrl = parsePullRequestUrlExport as unknown as (
  url: string,
) => PullRequestUrl | null;
const pullRequestMatches = pullRequestMatchesExport as unknown as (
  candidate: { url: string } | PullRequestBoardItem,
  pullRequest: PullRequestUrl,
) => boolean;
const fetchCanonicalPullRequest =
  fetchCanonicalPullRequestExport as unknown as (
    scope: PullRequestTabScope,
    input: { request: Omit<CanonicalRequest, "provider">; source: string },
  ) => Promise<{ title?: string | null }>;
const fetchGitLabPullRequest = fetchGitLabPullRequestExport as unknown as (
  scope: PullRequestTabScope,
  input: { account: Record<string, unknown>; pullRequest: PullRequestUrl },
) => Promise<{ title: string }>;
const fetchPullRequestBoard = fetchPullRequestBoardExport as unknown as (
  operation: string,
  input: { cwd: string; hostId: string; repo: string; searchQuery: string },
  metadata: { source: string },
) => Promise<{ items: PullRequestBoardItem[]; status: string }>;
const createRepositoryTarget = createRepositoryTargetExport as unknown as (
  target: RepositoryTarget,
) => RepositoryTarget;
const normalizePullRequestStatus =
  normalizePullRequestStatusExport as unknown as (
    summary: unknown,
  ) => string | null;
const projectPullRequestState =
  projectPullRequestStateExport as unknown as (input: {
    canMerge?: boolean;
    ciStatus?: unknown;
    hasMergeConflicts: boolean;
    status: string;
  }) => string;
const openSidePanelTab = openSidePanelTabExport as unknown as (
  scope: PullRequestTabScope,
  api: unknown,
  descriptor: TabDescriptor & {
    defaultState(): Record<string, never>;
    durableRoute?: DurableRoute;
    insertPosition?: number;
    revealAndFocus: boolean;
    target: string;
  },
) => void;
const createPullRequestTabApi =
  createPullRequestTabApiExport as unknown as (handlers: {
    open: typeof openBoardPullRequestTab;
    restore: typeof restorePullRequestTab;
  }) => unknown;

let React: ReactRuntime;
let pullRequestStatusSelector: unknown;
let pullRequestTabApi: unknown;

function formatPullRequestTitle(
  scope: PullRequestTabScope,
  number: number,
): string {
  return scope
    .get<{
      formatMessage(
        descriptor: unknown,
        values: Record<string, unknown>,
      ): string;
    }>(intlSignal)
    .formatMessage(
      {
        id: "thread.sidePanel.pullRequestTab.title",
        defaultMessage: "PR #{number}",
        description: "Title for a pull request side-panel tab",
      },
      { number },
    );
}
function createPersistence(
  url: string,
  hostId: string,
): { hostId: string; url: string } | undefined {
  const parsed = parsePullRequestUrl(url);
  return parsed == null
    ? undefined
    : { url: getPullRequestUrl(parsed), hostId };
}
function PullRequestStatus({
  fallbackState,
  hostId,
  statusKey,
  url,
}: {
  fallbackState: string;
  hostId: string;
  statusKey: PullRequestStatusKey;
  url: string;
}): unknown {
  const status = useScopedSelector(
    pullRequestStatusSelector,
    { fallbackState, hostId, statusKey, url },
    { enabled: false },
  );
  return status === "closed" || status === "open"
    ? React.createElement(
        PullRequestStatusIcon as unknown as (
          props: Record<string, unknown>,
        ) => unknown,
        { className: "icon-xs shrink-0", status },
      )
    : React.createElement(
        PullRequestStateIcon as unknown as (
          props: Record<string, unknown>,
        ) => unknown,
        { className: "icon-xs shrink-0", state: status },
      );
}
function createBoardDescriptor(
  scope: PullRequestTabScope,
  options: BoardTabOptions,
) {
  const {
    hostId,
    item,
    repo,
    repositoryTarget,
    statusKey,
    defaultMergeMenuOpen,
  } = options;
  return {
    id: `pull-request:${item.url}`,
    icon: React.createElement(PullRequestStatus, {
      fallbackState: item.state,
      hostId: hostId ?? repositoryTarget.hostId,
      statusKey,
      url: item.url,
    }),
    props: {
      defaultMergeMenuOpen,
      hostId,
      item,
      repo,
      target: repositoryTarget,
    },
    title: item.title.trim() || formatPullRequestTitle(scope, item.number),
    tooltip: `${item.title} — ${item.url}`,
    requiresWorkspaceReady: true,
    persistence: createPersistence(item.url, repositoryTarget.hostId),
  };
}
function createCanonicalDescriptor(
  scope: PullRequestTabScope,
  options: CanonicalTabOptions,
) {
  const { request, repositoryTarget, title } = options;
  if (request.provider === "gitlab" && !isGitLabPullRequestEnabled(scope))
    return null;
  const url = getPullRequestUrl(request.pullRequest);
  return {
    id: `pull-request:${url}`,
    icon:
      request.provider === "gitlab"
        ? React.createElement(
            GitLabIcon as unknown as (
              props: Record<string, unknown>,
            ) => unknown,
            {},
          )
        : React.createElement(
            GitHubIcon as unknown as (
              props: Record<string, unknown>,
            ) => unknown,
            { className: "icon-xs shrink-0" },
          ),
    props: { request, repositoryTarget, summaryOnly: true },
    title:
      title.trim() || formatPullRequestTitle(scope, request.pullRequest.number),
    tooltip: `${title} — ${url}`,
    requiresWorkspaceReady: false,
    persistence: createPersistence(url, request.account.hostId),
  };
}

const initializePullRequestDescriptors = once(() => {
  initializeQueryRuntime();
  React = getReactRuntime();
  initializePathRuntime();
  initializeGitHubIconRuntime();
  initializeIntlRuntime();
  initializePullRequestUrlRuntime();
  initializePullRequestStatusRuntime();
  initializeRepositoryTargetRuntime();
  initializePullRequestSummaryRuntime();
  initializeScopedRuntime();
  pullRequestStatusSelector = createScopedSelector(
    applicationScope,
    ({ fallbackState, statusKey, url }, { get }) => {
      const parsed = parsePullRequestUrl(url);
      if (parsed == null) return fallbackState;
      const { data } = get<{
        details?: unknown;
        isDraft?: boolean;
        state: string;
        summary?: unknown;
        url?: string;
      }>(pullRequestStatusQuery, { ...statusKey, url });
      const matching =
        data?.url != null && pullRequestMatches({ url: data.url }, parsed)
          ? data
          : null;
      if (matching == null) return fallbackState;
      const summary = matching.summary ?? matching.details;
      if (summary == null)
        return matching.state === "open" && matching.isDraft
          ? "draft"
          : matching.state;
      const status = normalizePullRequestStatus(summary);
      return status == null
        ? fallbackState
        : projectPullRequestState({
            canMerge: (summary as { canMerge?: boolean }).canMerge,
            ciStatus: (summary as { ciStatus?: unknown }).ciStatus,
            hasMergeConflicts:
              (summary as { mergeBlocker?: string }).mergeBlocker ===
              "conflicts",
            status,
          });
    },
  );
});

async function resolvePullRequestRoute(
  scope: PullRequestTabScope,
  { cwd, hostId, repositoryRoot, source, url }: RestoreRoute,
): Promise<
  | { source: "canonical"; options: CanonicalTabOptions }
  | { source: "board"; options: BoardTabOptions }
  | null
> {
  const pullRequest = parsePullRequestUrl(url);
  if (pullRequest == null) return null;
  if (pullRequest.hostname === "gitlab.com") {
    const request = {
      account: (await getGitLabAccount(scope, hostId)) as {
        hostId: string;
        [key: string]: unknown;
      },
      pullRequest,
    };
    const { title } = await fetchGitLabPullRequest(scope, request);
    return {
      source: "canonical",
      options: { request: { provider: "gitlab", ...request }, title },
    };
  }
  if (source === "canonical") {
    const accountResult = await scope.query.getOrFetch<{
      account: { hostId: string; [key: string]: unknown };
      status: string;
    }>(canonicalAccountQuery, {
      hostId,
      hostname: pullRequest.hostname,
      source: "pull_requests_page",
    });
    if (
      accountResult.status !== "success" ||
      accountResult.account.hostId !== hostId
    )
      return null;
    const request = { account: accountResult.account, pullRequest };
    const detail = await fetchCanonicalPullRequest(scope, {
      request,
      source: "pull_requests_page",
    });
    return {
      source: "canonical",
      options: {
        request: { provider: "github", ...request },
        repositoryTarget:
          repositoryRoot == null
            ? undefined
            : createRepositoryTarget({
                cwd: normalizeCwd(cwd),
                hostId,
                root: normalizeRepositoryRoot(repositoryRoot),
              }),
        title:
          detail.title ?? formatPullRequestTitle(scope, pullRequest.number),
      },
    };
  }
  const repo = `${pullRequest.hostname}/${pullRequest.owner}/${pullRequest.repository}`;
  const [board, repository] = await Promise.all([
    fetchPullRequestBoard(
      "gh-pr-board",
      {
        cwd: normalizeCwd(cwd),
        hostId,
        repo,
        searchQuery: String(pullRequest.number),
      },
      { source: "pull_request_board" },
    ),
    scope.query.getOrFetch<{ root: string } | null>(repositoryRootQuery),
  ]);
  if (board.status !== "success" || repository == null) return null;
  const item = board.items.find((candidate) =>
    pullRequestMatches(candidate, pullRequest),
  );
  return item == null
    ? null
    : {
        source: "board",
        options: {
          provider: "github",
          hostId,
          item,
          repo,
          repositoryTarget: createRepositoryTarget({
            cwd: item.cwd,
            hostId,
            root: repository.root,
          }),
          statusKey: {
            cwd: item.cwd,
            headBranch: item.headBranch,
            hostId,
            operationSource: "sidebar_task_pr_chip",
            url: item.url,
          },
        },
      };
}

const initializeOpenPullRequestTab = once(() => {
  initializeSelectorRuntime();
  initializePullRequestTabRuntime();
  initializeRepositoryRuntime();
  initializePullRequestQueryRuntime();
  initializeRepositoryTargetRuntime();
  initializePullRequestStateRuntime();
  initializePullRequestBoardRuntime();
  initializePullRequestDescriptors();
});
function createDurableRoute({
  cwd,
  hostId,
  repositoryRoot,
  source,
  url,
}: RestoreRoute): DurableRoute | undefined {
  if (cwd.trim() !== "" && hostId.trim() !== "")
    return {
      kind: pullRequestDurableRouteKind,
      params: { cwd, hostId, repositoryRoot, source, url },
      payloadVersion: 1,
    };
}
function openBoardPullRequestTab(
  scope: PullRequestTabScope,
  options: BoardTabOptions,
  revealAndFocus = true,
  target = "right",
  {
    insertPosition,
    tabId,
  }: Pick<OpenTabOptions, "insertPosition" | "tabId"> = {},
): boolean {
  const descriptor = createBoardDescriptor(scope, options);
  const { persistence, ...tab } = descriptor;
  const id = tabId ?? descriptor.id;
  const placement = getExistingTabPlacement(scope, id) ?? target;
  const durableRoute =
    persistence != null &&
    scope.get(currentCwd) === options.repositoryTarget.cwd &&
    scope.get(currentHostId) === options.repositoryTarget.hostId &&
    persistence.hostId === options.repositoryTarget.hostId
      ? createDurableRoute({
          cwd: options.repositoryTarget.cwd,
          hostId: options.repositoryTarget.hostId,
          source: "board",
          url: persistence.url,
        })
      : undefined;
  openSidePanelTab(scope, pullRequestTabApi, {
    ...tab,
    revealAndFocus,
    defaultState: () => ({}),
    durableRoute,
    id,
    insertPosition,
    target: placement,
  });
  if (revealAndFocus) focusSidePanel(scope, placement);
  return true;
}
function openCanonicalPullRequestTab(
  scope: PullRequestTabScope,
  options: CanonicalTabOptions,
  {
    revealAndFocus = true,
    insertPosition,
    tabId,
    target = "right",
  }: OpenTabOptions = {},
): boolean {
  const descriptor = createCanonicalDescriptor(scope, options);
  if (descriptor == null) return false;
  const { persistence, ...tab } = descriptor;
  const id = tabId ?? descriptor.id;
  const placement = getExistingTabPlacement(scope, id) ?? target;
  const hostId = scope.get<string>(currentHostId);
  const cwd = scope.get<string>(currentCwd);
  const repositoryTarget = options.repositoryTarget;
  openSidePanelTab(scope, pullRequestTabApi, {
    ...tab,
    revealAndFocus,
    defaultState: () => ({}),
    durableRoute:
      hostId === persistence?.hostId
        ? createDurableRoute({
            cwd,
            hostId,
            source: "canonical",
            repositoryRoot:
              repositoryTarget?.cwd === cwd &&
              repositoryTarget.hostId === hostId
                ? repositoryTarget.root
                : undefined,
            url: persistence.url,
          })
        : undefined,
    id,
    insertPosition,
    target: placement,
  });
  if (revealAndFocus) focusSidePanel(scope, placement);
  return true;
}
async function restorePullRequestTab(
  scope: PullRequestTabScope,
  route: RestoreRoute,
  options: OpenTabOptions,
): Promise<boolean> {
  if (
    scope.value.routeKind !== "local-thread" ||
    scope.get(currentCwd) !== route.cwd ||
    scope.get(currentHostId) !== route.hostId
  )
    return false;
  try {
    const resolved = await resolvePullRequestRoute(scope, route);
    if (resolved == null) return false;
    return resolved.source === "canonical"
      ? openCanonicalPullRequestTab(scope, resolved.options, options)
      : openBoardPullRequestTab(
          scope,
          resolved.options,
          options.revealAndFocus,
          options.target,
          options,
        );
  } catch {
    return false;
  }
}
const initializePullRequestSidePanelTab = once(() => {
  initializeSidePanelRuntime();
  initializeOpenPullRequestTab();
  initializePullRequestDescriptors();
  initializeThreadContextRuntime();
  initializePullRequestIconRuntime();
  initializeSidePanelPlacementRuntime();
  initializePullRequestRouteRuntime();
  pullRequestTabApi = createPullRequestTabApi({
    open: openBoardPullRequestTab,
    restore: restorePullRequestTab,
  });
});
export {
  restorePullRequestTab as i,
  openCanonicalPullRequestTab as n,
  openBoardPullRequestTab as r,
  initializePullRequestSidePanelTab as t,
};
