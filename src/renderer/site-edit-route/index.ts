import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";

const {
  $3: initializeRuntimeLazy,
  BX: useSignalFamilyValueExport,
  FZ: disabledQueryExport,
  HX: useSignalValue,
  LX: useScope,
  WB: buildLocalPath,
  ZI: AppScope,
  _L: useQuery,
  lY: normalizeThreadId,
} = appSharedChunk;
const useSignalFamilyValue = useSignalFamilyValueExport as unknown as (
  family: unknown,
  parameter: unknown,
) => unknown;
const disabledQuery = disabledQueryExport as unknown as (
  context: { signal: AbortSignal },
) => Promise<null>;

interface SiteEditContext {
  accountId?: string | null;
  latestEditContext?: {
    chatgpt_conversation_id?: string | null;
    codex_thread_id?: string | null;
  } | null;
  projectId?: string | null;
  projectTitle?: string | null;
  userId?: string | null;
}

interface SiteEditLocationState extends Record<string, unknown> {
  siteEditContext?: SiteEditContext | null;
  siteEditLiveUrl?: string | null;
}

interface EditDestination {
  path: string;
  preview?: Record<string, unknown>;
  state: Record<string, unknown>;
}

interface ThreadManager {
  readThread(threadId: string, options: { includeTurns: boolean }): Promise<{ thread: { cwd: string } }>;
}

interface ConversationManager {
  loadRecentConversationIds(threadIds: string[]): Promise<string[]>;
  resumeConversation(input: Record<string, unknown>, options: Record<string, unknown>): Promise<{ status: string }>;
}

interface SiteEditDependencies {
  apiClient: {
    safeGet(path: string, options: Record<string, unknown>): Promise<{
      gizmo_id?: string | null;
      is_archived?: boolean;
      is_read_only?: boolean;
    }>;
  };
  buildChatPath(conversationId: string, options: { gizmoId?: string | null }): string;
  buildLocalPath(conversationId: string): string;
  buildSiteMention(input: { projectId: string; title: string }): string;
  getConversationManager(scope: unknown, hostId: string): ConversationManager;
  getThread(input: {
    requestOptions: { timeoutMs: number };
    scope: unknown;
    threadId: string;
  }): Promise<{
    hostId: string;
    manager: ThreadManager;
    thread?: { cwd: string } | null;
  }>;
  intlSignal: unknown;
  localHostId: string;
  navigate(scope: unknown, path: string, options: { replace: boolean; state: Record<string, unknown> }): boolean;
  navigateHome(scope: unknown, options: Record<string, unknown>): void;
  openInBrowser(options: Record<string, unknown>): void;
  readResumeInputs(scope: unknown, hostId: string): unknown;
}

const siteInitial = appInitialChunk as unknown as {
  Bet: unknown;
  EOt: SiteEditDependencies["getThread"];
  FC: unknown;
  HWt: SiteEditDependencies["buildSiteMention"];
  Icn: unknown;
  N6t: () => { accountId?: string | null; userId?: string | null; isLoading?: boolean };
  Rcn: unknown;
  Ugn: SiteEditDependencies["getConversationManager"];
  Vsn: SiteEditDependencies["readResumeInputs"];
  _pn: SiteEditDependencies["navigate"];
  gln: SiteEditDependencies["buildChatPath"];
  i_n: () => import("@rchunk/app-initial").RouterLocationState;
  kft: SiteEditDependencies["openInBrowser"];
  l_n: () => { projectId?: string | null };
  m2: SiteEditDependencies["navigateHome"];
  mpn: unknown;
  rJt: SiteEditDependencies["apiClient"];
};
const {
  Bet: homeComposerModeSignal,
  EOt: loadThread,
  FC: effectiveWorkLocationFamily,
  HWt: buildSiteMention,
  Icn: workModeEnabledSignal,
  N6t: useAuthState,
  Rcn: appLoadingSignal,
  Ugn: getConversationManager,
  Vsn: readResumeInputs,
  _pn: navigate,
  gln: buildChatPath,
  i_n: useLocation,
  kft: openInBrowser,
  l_n: useRouteParameters,
  m2: navigateHome,
  mpn: intlSignal,
  rJt: apiClient,
} = siteInitial;
const { df: localHostId } = appPrimaryChunk as unknown as { df: string };

function createPrompt(scope: import("@rchunk/app-shared").MaitaiScopeApi<Record<string, unknown>>, projectId: string, projectTitle?: string | null): string {
  const intl = scope.get(intlSignal) as {
    formatMessage(descriptor: Record<string, unknown>, values: Record<string, unknown>): string;
  };
  return intl.formatMessage({
    id: "appgenConversation.editPrompt",
    defaultMessage: "{siteMention} make these changes…",
    description: "Prompt for continuing work on an existing site from the Sites page",
  }, {
    siteMention: buildSiteMention({ projectId, title: projectTitle ?? projectId }),
  }) + " ";
}

async function resolveEditDestination(
  scope: import("@rchunk/app-shared").MaitaiScopeApi<Record<string, unknown>>,
  input: {
    latestEditContext?: SiteEditContext["latestEditContext"];
    mode: string;
    projectId: string;
    projectTitle?: string | null;
    signal: AbortSignal;
    workRunLocation?: string | null;
  },
): Promise<EditDestination> {
  input.signal.throwIfAborted();
  const prompt = createPrompt(scope, input.projectId, input.projectTitle);
  const state = { prefillPrompt: prompt, focusComposerNonce: Date.now() };
  const useCloudConversation = input.mode === "chat"
    || (input.mode === "work" && input.workRunLocation === "cloud");
  try {
    const chatConversationId = input.latestEditContext?.chatgpt_conversation_id;
    if (useCloudConversation && chatConversationId) {
      const conversation = await apiClient.safeGet("/conversation/{conversation_id}", {
        parameters: { path: { conversation_id: chatConversationId } },
        signal: input.signal,
      });
      input.signal.throwIfAborted();
      if (!conversation.is_archived && !conversation.is_read_only) {
        const search = new URLSearchParams({ prompt, promptSource: "codex-app" });
        return {
          path: buildChatPath(chatConversationId, { gizmoId: conversation.gizmo_id }) + "?" + search,
          state,
          preview: {
            conversationId: chatConversationId,
            projectId: input.projectId,
            title: input.projectTitle ?? input.projectId,
          },
        };
      }
    }

    const codexThreadId = input.latestEditContext?.codex_thread_id;
    const useLocalConversation = input.mode === "codex"
      || (input.mode === "work" && input.workRunLocation === "local");
    if (useLocalConversation && codexThreadId) {
      const threadId = normalizeThreadId(codexThreadId);
      const loaded = await loadThread({
        scope,
        threadId,
        requestOptions: { timeoutMs: 10_000 },
      });
      input.signal.throwIfAborted();
      const thread = loaded.thread ?? (await loaded.manager.readThread(threadId, { includeTurns: false })).thread;
      input.signal.throwIfAborted();
      const manager = getConversationManager(scope, loaded.hostId);
      const recentIds = await manager.loadRecentConversationIds([threadId]);
      input.signal.throwIfAborted();
      if (recentIds.includes(threadId)) {
        const resumed = await manager.resumeConversation({
          conversationId: threadId,
          model: null,
          preserveServerConfiguration: loaded.hostId === localHostId,
          reasoningEffort: null,
          serviceTier: null,
          useAppServerPermissionDefault: false,
          workspaceRoots: [thread.cwd],
        }, {
          readResumeInputs: readResumeInputs(scope, loaded.hostId),
        });
        input.signal.throwIfAborted();
        if (resumed.status !== "not-ready") {
          return {
            path: buildLocalPath(threadId) + "?" + new URLSearchParams({ hostId: loaded.hostId }),
            state,
            preview: {
              conversationId: threadId,
              hostId: loaded.hostId,
              projectId: input.projectId,
              title: input.projectTitle ?? input.projectId,
            },
          };
        }
      }
    }
  } catch {
    input.signal.throwIfAborted();
  }
  return {
    path: "/",
    state: { ...state, project: null, codexAppMode: input.mode },
  };
}

async function applyDestination(
  scope: import("@rchunk/app-shared").MaitaiScopeApi<Record<string, unknown>>,
  destination: EditDestination,
  liveUrl: string | null | undefined,
  routeState: Record<string, unknown>,
): Promise<void> {
  if (destination.path === "/") {
    navigateHome(scope, {
      ...routeState,
      activeProject: null,
      prefillPrompt: destination.state.prefillPrompt,
      codexAppMode: destination.state.codexAppMode,
      startInSidebar: true,
    });
  } else if (!navigate(scope, destination.path, {
    replace: true,
    state: { ...routeState, ...destination.state },
  })) {
    return;
  }
  if (liveUrl != null) {
    openInBrowser({
      href: liveUrl,
      initiator: "sites_library",
      openTarget: "in-app-browser",
    });
  }
}

function SiteEditRoute(): null {
  initializeSiteEditRoute();
  const scope = useScope(AppScope);
  const { projectId } = useRouteParameters();
  const location = useLocation();
  const routeState = (location.state ?? {}) as SiteEditLocationState;
  const { siteEditContext, siteEditLiveUrl, ...restState } = routeState;
  const { accountId, userId, isLoading } = useAuthState();
  const validContext = accountId != null
    && userId != null
    && siteEditContext?.accountId === accountId
    && siteEditContext.userId === userId
    && siteEditContext.projectId === projectId
    ? siteEditContext
    : undefined;
  const workModeEnabled = useSignalValue(workModeEnabledSignal);
  const appLoading = useSignalValue(appLoadingSignal);
  const homeComposerMode = useSignalValue(homeComposerModeSignal) as string | null;
  const mode = workModeEnabled ? homeComposerMode : "codex";
  const workLocation = useSignalFamilyValue(effectiveWorkLocationFamily, {
    enforceAccess: false,
    homeComposerMode,
    routeProjectId: null,
  }) as { effectiveLocation?: string | null } | string | null;
  const effectiveLocation = typeof workLocation === "string"
    ? workLocation
    : workLocation?.effectiveLocation ?? null;
  const enabled = projectId != null && mode != null && !isLoading && !appLoading;
  useQuery({
    queryKey: [
      "site-edit",
      location.key,
      accountId,
      userId,
      projectId,
      mode,
      effectiveLocation,
      siteEditLiveUrl,
      validContext,
      restState,
    ],
    enabled,
    queryFn: async (context) => {
      if (projectId == null || mode == null) return disabledQuery(context);
      const destination = await resolveEditDestination(scope, {
        latestEditContext: validContext?.latestEditContext,
        mode,
        projectId,
        projectTitle: validContext?.projectTitle,
        signal: context.signal,
        workRunLocation: effectiveLocation,
      });
      await applyDestination(scope, destination, validContext == null ? undefined : siteEditLiveUrl, restState);
      return null;
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
  return null;
}

let initialized = false;
function initializeSiteEditRoute(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  initialized = true;
}

initializeSiteEditRoute();
export { SiteEditRoute };
