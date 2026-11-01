import "@rchunk/rolldown-runtime";
import {
  $3 as getCompilerRuntime,
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

interface CompilerRuntime {
  c(size: number): unknown[];
}

let compilerRuntime: CompilerRuntime;
let React: ReturnType<typeof getReactRuntime>;

function ThreadBridge(props?: ThreadBridgeProps): null {
  const cache = compilerRuntime.c(12);
  let resolvedProps: ThreadBridgeProps;
  if (cache[0] === props) {
    resolvedProps = cache[1] as ThreadBridgeProps;
  } else {
    resolvedProps = props === undefined ? {} : props;
    cache[0] = props;
    cache[1] = resolvedProps;
  }
  const { transcriptMcpAppIds, shouldBlockExternalEgress = false } = resolvedProps;
  const scope = useScope(conversationScope);
  const composer = useScope(composerScope);
  const apps = useSignalValue(activeMcpApps) as Map<
    string,
    { hostedInThreadScrollLayout?: boolean }
  >;

  let synchronizeThread: () => void;
  let synchronizeDependencies: unknown[];
  if (
    cache[2] !== composer ||
    cache[3] !== apps ||
    cache[4] !== scope ||
    cache[5] !== shouldBlockExternalEgress ||
    cache[6] !== transcriptMcpAppIds
  ) {
    synchronizeThread = () => {
      if (
        shouldBlockExternalEgress &&
        (scope as unknown as { value: { routeKind: string } }).value.routeKind === "chatgpt-thread" &&
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
    };
    synchronizeDependencies = [
      transcriptMcpAppIds,
      composer,
      apps,
      scope,
      shouldBlockExternalEgress,
    ];
    cache[2] = composer;
    cache[3] = apps;
    cache[4] = scope;
    cache[5] = shouldBlockExternalEgress;
    cache[6] = transcriptMcpAppIds;
    cache[7] = synchronizeThread;
    cache[8] = synchronizeDependencies;
  } else {
    synchronizeThread = cache[7] as () => void;
    synchronizeDependencies = cache[8] as unknown[];
  }
  React.useLayoutEffect(synchronizeThread, synchronizeDependencies);

  let connectScope: () => void;
  let connectDependencies: unknown[];
  if (cache[9] !== scope) {
    connectScope = () => connectThreadScope(scope);
    connectDependencies = [scope];
    cache[9] = scope;
    cache[10] = connectScope;
    cache[11] = connectDependencies;
  } else {
    connectScope = cache[10] as () => void;
    connectDependencies = cache[11] as unknown[];
  }
  React.useLayoutEffect(connectScope, connectDependencies);
  return null;
}

function initializeThreadBridge(): void {
  compilerRuntime = getCompilerRuntime() as unknown as CompilerRuntime;
  initializeSignalRuntime();
  React = getReactRuntime();
  initializeComposerState();
  initializeThreadBridgeState();
  initializeConversationScope();
  initializeMcpAppState();
  initializeConversationNavigation();
}

export { initializeThreadBridge as n, ThreadBridge as t };
