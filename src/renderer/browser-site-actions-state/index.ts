import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appgenAccessChunk from "@rchunk/appgen-access";
import * as appgenBrowserSiteChunk from "@rchunk/appgen-browser-site-core";
import * as artifactSignalsChunk from "@rchunk/local-conversation-artifacts-signals";

const { lY: normalizeConversationId, wL: initializeWindowRuntime } = appSharedChunk;
const {
  _an: initializeAppgenProjects,
  aan: appgenProjectQuery,
} = appInitialChunk;
const {
  c: isOwnerOnlyAccess,
  r: normalizeAccessPolicy,
  s: initializeAppgenAccess,
  t: canManageAppgenProject,
} = appgenAccessChunk;
const {
  n: initializeBrowserSite,
  t: findBrowserSite,
} = appgenBrowserSiteChunk;
const {
  r: initializeArtifactSignals,
  t: activeArtifactsSignal,
} = artifactSignalsChunk;

export interface BrowserSiteActionsConversation {
  conversationId: string;
}

export interface BrowserSiteActionsState {
  canManage: boolean;
  isOwnerOnly: boolean;
  projectId: string;
  siteUrl: string;
}

interface BrowserSiteEntry extends Record<string, unknown> {
  projectId: string;
  type: string;
  url?: string | null;
}

interface ScopeApi {
  get<Value>(signal: unknown, parameter?: unknown): Value;
}

function getBrowserSiteActionsState(
  scope: ScopeApi,
  conversation: BrowserSiteActionsConversation,
  siteUrl: string,
  hostId: string,
): BrowserSiteActionsState | null {
  const sites = scope.get<readonly BrowserSiteEntry[]>(activeArtifactsSignal, {
    conversationId: normalizeConversationId(conversation.conversationId),
    hostId,
  });
  const site = findBrowserSite(sites, siteUrl);
  if (site == null) return null;
  const { data: project } = scope.get<{ data?: Record<string, unknown> }>(
    appgenProjectQuery,
    site.projectId,
  );
  return {
    siteUrl,
    projectId: site.projectId,
    canManage: canManageAppgenProject(project),
    isOwnerOnly:
      project != null &&
      isOwnerOnlyAccess(
        normalizeAccessPolicy(
          project.access_policy as import("@rchunk/appgen-access").AppgenAccessPolicy,
        ),
      ),
  };
}

initializeWindowRuntime();
initializeAppgenAccess();
initializeBrowserSite();
initializeAppgenProjects();
initializeArtifactSignals();

export { getBrowserSiteActionsState };
