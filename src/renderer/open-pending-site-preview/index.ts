import "@rchunk/rolldown-runtime";
import { LX as useScope, e6 as ReactRuntime } from "@rchunk/app-shared";
import {
  $en as routeScope,
  Rl as openSitePreviewTab,
  _Bt as conversationHasSitePreview,
} from "@rchunk/app-initial";
import { pf as pendingSitePreviewSignal } from "@rchunk/app-primary";

interface PendingSitePreview {
  projectId: string;
  title: string;
  url?: string | null;
}
interface ScopeSnapshot {
  get(signal: unknown, parameter?: unknown): unknown;
  set(signal: unknown, value: unknown): void;
  value: { conversationId?: string; routeKind?: string };
}
interface WatchableScope {
  watch(effect: (scope: ScopeSnapshot) => void | (() => void)): () => void;
}

function OpenPendingSitePreview(props: { pending: PendingSitePreview }): null {
  const scope = useScope(routeScope) as unknown as WatchableScope;
  ReactRuntime.useEffect(() => {
    const url = props.pending.url;
    if (url == null) return;
    let opened = false;
    return scope.watch((snapshot) => {
      const currentPending = snapshot.get(pendingSitePreviewSignal);
      const alreadyOpen = snapshot.value.routeKind === "chatgpt-thread" &&
        snapshot.value.conversationId != null &&
        conversationHasSitePreview(snapshot, snapshot.value.conversationId);
      if (opened || currentPending !== props.pending || alreadyOpen) return;
      opened = openSitePreviewTab(snapshot, {
        type: "appgen-app",
        projectId: props.pending.projectId,
        title: props.pending.title,
        url,
      });
      if (opened) snapshot.set(pendingSitePreviewSignal, null);
    });
  }, [props.pending, scope]);
  return null;
}

export { OpenPendingSitePreview };
