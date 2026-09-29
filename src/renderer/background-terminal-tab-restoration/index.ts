// Restores local background-terminal tabs. Release chunk: restoration-10682af29157.js.
import "@rchunk/rolldown-runtime";
import * as appInitialChunk from "@rchunk/app-initial";
import * as commandExecutionChunk from "@rchunk/command-execution-command";

interface CommandExecutionItem {
  type: "commandExecution";
  id: string;
  cwd?: string | null;
  processId?: unknown;
}
interface Turn {
  items?: Array<CommandExecutionItem | Record<string, unknown> | null>;
}
interface BackgroundTerminal {
  id: string;
  command: string;
  cwd: string | null;
  processId: unknown;
}
interface Scope {
  value: { routeKind: string; conversationId: string };
  get(signal: unknown, parameter?: string): unknown;
}
interface InitialRuntime {
  HZt(): void;
  Ugn(
    scope: Scope,
    hostId: unknown,
  ): {
    hydrateBackgroundThreads(
      conversationIds: string[],
      options: { includeTurns: true },
    ): Promise<void>;
  };
  Wgn(): void;
  _Qt: unknown;
  mpn: unknown;
  ppn(): void;
  wQt: unknown;
}
interface CommandRuntime {
  t(item: CommandExecutionItem): string;
}
interface RestoreInput {
  revealAndFocus: boolean;
  descriptor: { tabId: string };
  insertPosition?: unknown;
  scope: Scope;
}
type OpenBackgroundTerminal = (input: {
  scope: Scope;
  revealAndFocus: boolean;
  backgroundTerminal: BackgroundTerminal;
  conversationId: string;
  fallbackTitle: string;
  insertPosition?: unknown;
  tabId: string;
}) => string;

const initialRuntime = appInitialChunk as unknown as InitialRuntime;
const commandRuntime = commandExecutionChunk as unknown as CommandRuntime;

function findBackgroundTerminal(
  turns: Turn[],
  commandExecutionId: string,
): BackgroundTerminal | null {
  for (let index = turns.length - 1; index >= 0; index -= 1) {
    const turn = turns[index];
    if (turn == null) continue;
    for (const item of turn.items ?? []) {
      if (item?.type === "commandExecution" && item.id === commandExecutionId) {
        const commandItem = item as CommandExecutionItem;
        return {
          id: commandItem.id,
          command: commandRuntime.t(commandItem),
          cwd: commandItem.cwd ?? null,
          processId: commandItem.processId,
        };
      }
    }
  }
  return null;
}

async function restoreBackgroundTerminalTabRoute(
  { revealAndFocus, descriptor, insertPosition, scope }: RestoreInput,
  commandExecutionId: string,
  openBackgroundTerminal: OpenBackgroundTerminal,
): Promise<boolean> {
  if (scope.value.routeKind !== "local-thread") return false;
  const conversationId = scope.value.conversationId;
  let backgroundTerminal = findBackgroundTerminal(
    (scope.get(initialRuntime._Qt, conversationId) as Turn[] | null) ?? [],
    commandExecutionId,
  );
  if (backgroundTerminal == null) {
    await initialRuntime
      .Ugn(scope, scope.get(initialRuntime.wQt, conversationId))
      .hydrateBackgroundThreads([conversationId], { includeTurns: true });
    backgroundTerminal = findBackgroundTerminal(
      (scope.get(initialRuntime._Qt, conversationId) as Turn[] | null) ?? [],
      commandExecutionId,
    );
  }
  if (backgroundTerminal == null) return false;
  const intl = scope.get(initialRuntime.mpn) as {
    formatMessage(descriptor: Record<string, string>): string;
  };
  return (
    openBackgroundTerminal({
      scope,
      revealAndFocus,
      backgroundTerminal,
      conversationId,
      fallbackTitle: intl.formatMessage({
        id: "codex.localConversation.backgroundTerminalTab.title",
        defaultMessage: "Background terminal",
        description:
          "Title for a background terminal output tab when the command text is unavailable",
      }),
      insertPosition,
      tabId: descriptor.tabId,
    }) === descriptor.tabId
  );
}

function initialize(): void {
  initialRuntime.Wgn();
  initialRuntime.HZt();
  initialRuntime.ppn();
}
initialize();

export { restoreBackgroundTerminalTabRoute };
