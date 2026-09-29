// Restores background-agent tab routes. Release chunk: restoration-4033c505a6bf.js.
import "@rchunk/rolldown-runtime";
import * as appInitialChunk from "@rchunk/app-initial";
import * as openTargetChunk from "@rchunk/open-target";
import * as verifyDescendantChunk from "@rchunk/verify-descendant";

interface Scope {
  value: { routeKind: string; conversationId: string };
  get(signal: unknown, parameter: string): unknown;
}

interface RestoreInput {
  revealAndFocus: boolean;
  descriptor: { tabId: string };
  insertPosition?: unknown;
  scope: Scope;
}

interface BackgroundAgent {
  canInteract?: boolean;
  conversationId: string;
  displayName?: string;
}

interface InitialRuntime {
  GZt: unknown;
  HZt(): void;
  Ugn(
    scope: Scope,
    hostId: unknown,
  ): {
    ensureConversationHistoryLoaded(conversationId: string): Promise<void>;
  };
  Wgn(): void;
  wQt: unknown;
}

interface OpenTargetRuntime {
  n(
    scope: Scope,
    parentConversationId: string,
    targetConversationId: string,
  ): BackgroundAgent | null;
  r(): void;
  t(
    scope: Scope,
    parentConversationId: string,
    hostId: unknown,
    targetConversationId: string,
  ): BackgroundAgent | null;
}

interface VerifyDescendantRuntime {
  n(
    scope: Scope,
    input: {
      hostId: unknown;
      hydrateMissingAncestors: true;
      parentConversationId: string;
      selectedConversationId: string;
    },
  ): boolean | Promise<boolean>;
  t(): void;
}

type OpenTab = (
  scope: Scope,
  input: {
    revealAndFocus: boolean;
    backgroundAgent: BackgroundAgent;
    hostId: unknown;
    insertPosition?: unknown;
    tabId: string;
    TabComponent: unknown;
  },
) => Promise<string | null> | string | null;

const initialRuntime = appInitialChunk as unknown as InitialRuntime;
const openTargetRuntime = openTargetChunk as unknown as OpenTargetRuntime;
const verifyDescendantRuntime =
  verifyDescendantChunk as unknown as VerifyDescendantRuntime;

async function restoreBackgroundAgentTabRoute(
  { revealAndFocus, descriptor, insertPosition, scope }: RestoreInput,
  selectedConversationId: string,
  openTab: OpenTab,
  TabComponent: unknown,
): Promise<boolean> {
  if (scope.value.routeKind !== "local-thread") return false;
  const parentConversationId = scope.value.conversationId;
  const hostId = scope.get(initialRuntime.wQt, parentConversationId);
  if (
    !(await verifyDescendantRuntime.n(scope, {
      hostId,
      hydrateMissingAncestors: true,
      parentConversationId,
      selectedConversationId,
    }))
  ) {
    return false;
  }

  const existingTarget = openTargetRuntime.n(
    scope,
    parentConversationId,
    selectedConversationId,
  );
  let backgroundAgent =
    existingTarget ??
    openTargetRuntime.t(
      scope,
      parentConversationId,
      hostId,
      selectedConversationId,
    );

  if (
    existingTarget == null &&
    scope.get(initialRuntime.GZt, parentConversationId) !== true
  ) {
    try {
      await initialRuntime
        .Ugn(scope, hostId)
        .ensureConversationHistoryLoaded(parentConversationId);
      backgroundAgent =
        openTargetRuntime.n(
          scope,
          parentConversationId,
          selectedConversationId,
        ) ??
        openTargetRuntime.t(
          scope,
          parentConversationId,
          hostId,
          selectedConversationId,
        ) ??
        backgroundAgent;
    } catch {
      // Restoration may continue with the target inferred before hydration.
    }
  }

  return (
    backgroundAgent != null &&
    (await openTab(scope, {
      revealAndFocus,
      backgroundAgent,
      hostId,
      insertPosition,
      tabId: descriptor.tabId,
      TabComponent,
    })) === descriptor.tabId
  );
}

let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  initialRuntime.Wgn();
  initialRuntime.HZt();
  verifyDescendantRuntime.t();
  openTargetRuntime.r();
}

initialize();

export { restoreBackgroundAgentTabRoute };
