import "@rchunk/rolldown-runtime";
import {
  $3 as initializeCompilerCache,
  FX as initializeSignalRuntime,
  HX as useSignalValue,
  LX as useScope,
  e6 as getReactRuntime,
} from "@rchunk/app-shared";
import {
  $en as conversationScope,
  C3 as clearQueuedComposerItems,
  Rht as initializeThreadBridgeState,
  Tct as connectThreadScope,
  X4 as queuedComposerItems,
  ict as initializeConversationNavigation,
  itn as initializeConversationScope,
  kht as composerScope,
  oct as activeMcpApps,
  wct as initializeMcpAppState,
  x3 as initializeComposerState,
  xct as closeMcpApp,
} from "@rchunk/app-initial";

export interface ThreadBridgeProps {
  shouldBlockExternalEgress?: boolean;
  transcriptMcpAppIds?: Set<string>;
}

function ThreadBridge({
  transcriptMcpAppIds,
  shouldBlockExternalEgress = false,
}: ThreadBridgeProps = {}): null {
  const React = getReactRuntime();
  const scope = useScope(conversationScope);
  const composer = useScope(composerScope);
  const apps = useSignalValue(activeMcpApps) as Map<
    string,
    { hostedInThreadScrollLayout?: boolean }
  >;

  React.useLayoutEffect(() => {
    if (
      shouldBlockExternalEgress &&
      (scope as { value?: { routeKind?: string } }).value?.routeKind === "chatgpt-thread" &&
      (composer as { get(signal: unknown): unknown[] }).get(queuedComposerItems).length > 0
    ) {
      clearQueuedComposerItems(composer);
    }
    for (const [appId, app] of apps) {
      if (
        shouldBlockExternalEgress ||
        (app.hostedInThreadScrollLayout && transcriptMcpAppIds?.has(appId) === false)
      ) {
        closeMcpApp(scope, appId);
      }
    }
  }, [transcriptMcpAppIds, composer, apps, scope, shouldBlockExternalEgress]);

  React.useLayoutEffect(() => {
    connectThreadScope(scope);
  }, [scope]);
  return null;
}

function initializeThreadBridge(): void {
  initializeCompilerCache();
  initializeSignalRuntime();
  getReactRuntime();
  initializeComposerState();
  initializeThreadBridgeState();
  initializeConversationScope();
  initializeMcpAppState();
  initializeConversationNavigation();
}

export { initializeThreadBridge as n, ThreadBridge as t };
