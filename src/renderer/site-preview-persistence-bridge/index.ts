import "@rchunk/rolldown-runtime";
import { LX as useScope, e6 as ReactRuntime } from "@rchunk/app-shared";
import {
  $en as routeScope,
  Hl as pendingSiteProjectIdSignal,
  Lbt as sitePreviewEnabledSignal,
  Rl as openSitePreviewTab,
  Vl as persistSitePreviewSelection,
  _Bt as conversationHasSitePreview,
  qvt as rightPanelTabs,
  vbt as sitePreviewRevisionSignal,
  zl as readSitePreviewState,
} from "@rchunk/app-initial";
import { pf as currentConversationSignal } from "@rchunk/app-primary";

interface SiteProject { current_live_url?: string | null; id: string; status: string; title: string; }
interface ScopeSnapshot {
  get(signal: unknown, parameter?: unknown): unknown;
  query?: { fetch(query: unknown, parameter: string): Promise<SiteProject | null> };
  value: { conversationId?: string; routeKind?: string };
}
interface WatchableScope extends ScopeSnapshot {
  watch(effect: (scope: ScopeSnapshot) => void | (() => void)): () => void;
}

function SitePreviewPersistenceBridge(): null {
  const scope = useScope(routeScope) as unknown as WatchableScope;
  ReactRuntime.useEffect(() => {
    let lastProjectId: string | null = null;
    return scope.watch((snapshot) => {
      const projectId = snapshot.get(pendingSiteProjectIdSignal) as string | null;
      const enabled = snapshot.get(sitePreviewEnabledSignal) as boolean;
      const conversation = snapshot.get(currentConversationSignal) as { conversationId?: string } | null;
      const preview = readSitePreviewState(projectId);
      const alreadyOpen = snapshot.value.routeKind === "chatgpt-thread" && snapshot.value.conversationId != null && conversationHasSitePreview(snapshot, snapshot.value.conversationId);
      if (projectId == null || !enabled || alreadyOpen || projectId === lastProjectId || preview?.isOpen !== true) return;
      lastProjectId = projectId;
      let cancelled = false;
      void import("@rchunk/appgen-query").then(({ appgenProjectQuery$ }) => snapshot.query?.fetch(appgenProjectQuery$, preview.projectId)).then((project) => {
        if (cancelled || project == null || project.status !== "active" || project.current_live_url == null) return;
        if (conversation?.conversationId != null && conversationHasSitePreview(snapshot, conversation.conversationId)) return;
        openSitePreviewTab(snapshot, { type: "appgen-app", projectId: project.id, title: project.title, url: project.current_live_url });
      });
      return () => { cancelled = true; };
    });
  }, [scope]);
  ReactRuntime.useEffect(() => {
    let previousRevision = scope.get(sitePreviewRevisionSignal);
    let previousProject = scope.get(pendingSiteProjectIdSignal);
    return scope.watch((snapshot) => {
      const revision = snapshot.get(sitePreviewRevisionSignal);
      const projectId = snapshot.get(pendingSiteProjectIdSignal) as string | null;
      const activeTab = snapshot.get(rightPanelTabs.activeTab$) as { tabId?: string } | null;
      if ((revision !== previousRevision || (previousProject == null && projectId != null)) && projectId != null && activeTab?.tabId?.startsWith("site-preview:")) {
        persistSitePreviewSelection(projectId, activeTab.tabId.slice(13), revision);
      }
      previousRevision = revision;
      previousProject = projectId;
    });
  }, [scope]);
  return null;
}

export { SitePreviewPersistenceBridge };
