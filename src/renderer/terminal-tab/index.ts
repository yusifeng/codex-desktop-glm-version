import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/terminal-workspace-warning-state";
import "@rchunk/shell-label";
import { TerminalPanel } from "@rchunk/terminal-panel";
import { getPathBasename } from "../app-shared/runtime/get-path-basename";

const {
  $3: initializeRuntimeLazy,
  I3: getJsxRuntime,
  Y2: FormattedMessage,
  Yh: Button,
  e6: getReactRuntime,
  m4: classNames,
} = appSharedChunk as typeof appSharedChunk & {
  Yh: (props: Record<string, unknown>) => unknown;
};
const {
  E6t: usePlatform,
  Rgn: terminalSessions,
  ket: EmptyState,
} = appInitialChunk as typeof appInitialChunk & {
  E6t: () => { platform: string };
  Rgn: TerminalTabSessionManager;
  ket: (props: Record<string, unknown>) => unknown;
};

interface TerminalBinding {
  environmentId?: string | null;
  workspaceRoot?: string | null;
}

interface ConversationTerminalSnapshot {
  cwdBySessionId?: Record<string, string>;
  sessionIds: readonly string[];
}

interface TerminalTabSessionManager {
  getConversationSnapshot?(conversationId: string): ConversationTerminalSnapshot | null;
  getShellCwd?(sessionId: string, workspaceRoot: string): Promise<string | null>;
  getSnapshot?(sessionId: string): { error?: unknown; shell?: string } | null;
  getWorkspaceBinding?(sessionId: string): TerminalBinding | null;
  hasUserInteraction?(sessionId: string): boolean;
  isSessionAttached?(sessionId: string): boolean;
  subscribeToConversation?(conversationId: string, listener: () => void): () => void;
  subscribeToSessionSnapshot?(sessionId: string, listener: () => void): () => void;
  write(sessionId: string, data: string, source: "user"): void;
}

export interface TerminalTabProps {
  conversationId: string;
  conversationTitle: string;
  cwd?: string | null;
  currentWorkspaceRoot?: string | null;
  environmentId?: string | null;
  hostId: string;
  onNewTerminalTab(value?: unknown): void;
  renderSlots(slots: { content: unknown; headerRows: readonly unknown[] }): unknown;
  sessionId: string;
  workspaceRoots?: readonly string[];
}

let React: import("@rchunk/app-shared").ReactRuntime;
let jsx: import("@rchunk/app-shared").JsxRuntime;

function useConversationSnapshot(conversationId: string): ConversationTerminalSnapshot | null {
  return React.useSyncExternalStore(
    (listener) => terminalSessions.subscribeToConversation?.(conversationId, listener) ?? (() => undefined),
    () => terminalSessions.getConversationSnapshot?.(conversationId) ?? null,
    () => null,
  );
}

function useWorkspaceBinding(sessionId: string): TerminalBinding | null {
  return React.useSyncExternalStore(
    (listener) => terminalSessions.subscribeToSessionSnapshot?.(sessionId, listener) ?? (() => undefined),
    () => terminalSessions.getWorkspaceBinding?.(sessionId) ?? null,
    () => null,
  );
}

function commandForWorkspace(shell: string, workspaceRoot: string): string | null {
  const normalizedShell = shell.toLowerCase();
  if (normalizedShell.includes("powershell")) {
    return "Set-Location -LiteralPath '" + workspaceRoot.replaceAll("'", "''") + "'\r";
  }
  if (normalizedShell === "cmd" || normalizedShell.includes("command prompt")) {
    return /[%!]/.test(workspaceRoot) ? null : "cd /d \"" + workspaceRoot + "\"\r";
  }
  return "cd -- '" + workspaceRoot.replaceAll("'", "'\\''") + "'\r";
}

function WorkspaceRootHint({
  currentWorkspaceRoot,
  onSelectWorkspaceRoot,
  sessionId,
  workspaceRoots,
}: {
  currentWorkspaceRoot?: string | null;
  onSelectWorkspaceRoot(root: string): void;
  sessionId: string;
  workspaceRoots: readonly string[];
}): unknown {
  const { platform } = usePlatform();
  if (workspaceRoots.length < 2 || terminalSessions.hasUserInteraction?.(sessionId)) return null;
  return jsx.jsxs("div", {
    role: "group",
    "aria-label": "Terminal source directories",
    className: "flex w-fit max-w-full flex-col gap-3 text-sm leading-5 text-secondary select-none",
    children: [
      jsx.jsx(FormattedMessage, {
        id: "codex.terminal.workspaceRootPromptHint.title",
        defaultMessage: "Source directories",
      }),
      jsx.jsx("div", {
        className: "flex flex-col gap-1",
        children: workspaceRoots.map((root, index) => jsx.jsxs("button", {
          type: "button",
          "aria-current": root === currentWorkspaceRoot ? "location" : undefined,
          className: classNames("flex max-w-full gap-3 bg-transparent", root === currentWorkspaceRoot ? "underline" : "hover:underline"),
          onClick: () => onSelectWorkspaceRoot(root),
          children: [
            jsx.jsx("span", { className: "w-4 text-end tabular-nums", children: index + 1 }),
            jsx.jsx("span", { className: "truncate", children: getPathBasename(root) || root }),
          ],
        }, root)),
      }),
      jsx.jsx(FormattedMessage, {
        id: platform === "macOS"
          ? "codex.terminal.workspaceRootPromptHint.instructions.macOS"
          : "codex.terminal.workspaceRootPromptHint.instructions.otherPlatforms",
        defaultMessage: platform === "macOS"
          ? "Press ⌥ Opt + Number to change directory"
          : "Press Alt + Number to change directory",
      }),
    ],
  });
}

function CloudTerminal(props: TerminalTabProps): unknown {
  const binding = useWorkspaceBinding(props.sessionId);
  const snapshot = terminalSessions.getSnapshot?.(props.sessionId);
  if (snapshot?.error != null) {
    return jsx.jsx(EmptyState, {
      title: jsx.jsx(FormattedMessage, {
        id: "cloudTerminal.startFailed",
        defaultMessage: "Couldn’t open the terminal",
      }),
      description: String(snapshot.error),
      actions: jsx.jsx(Button, {
        color: "secondary",
        onClick: () => props.onNewTerminalTab(),
        children: jsx.jsx(FormattedMessage, {
          id: "cloudTerminal.openNew",
          defaultMessage: "New terminal",
        }),
      }),
    });
  }
  const environmentId = props.environmentId ?? binding?.environmentId ?? null;
  if (environmentId == null) {
    return jsx.jsx(EmptyState, {
      title: jsx.jsx(FormattedMessage, {
        id: "cloudTerminal.environmentUnavailable",
        defaultMessage: "Terminal environment unavailable",
      }),
      description: jsx.jsx(FormattedMessage, {
        id: "cloudTerminal.waitingForEnvironment",
        defaultMessage: "The terminal will start when the task has an environment",
      }),
    });
  }
  return jsx.jsx(TerminalPanel, {
    conversationId: props.conversationId,
    conversationTitle: props.conversationTitle,
    cwd: props.cwd ?? null,
    environmentId,
    hostId: props.hostId,
    sessionId: props.sessionId,
    workspaceRoot: null,
    loadingOverlay: terminalSessions.isSessionAttached?.(props.sessionId) ? null : jsx.jsx("div", { role: "status", children: "Opening terminal…" }),
    onNewTerminalTab: () => props.onNewTerminalTab(),
  });
}

function LocalTerminal(props: TerminalTabProps): unknown {
  const conversation = useConversationSnapshot(props.conversationId);
  if (!conversation?.sessionIds.includes(props.sessionId)) return null;
  const binding = useWorkspaceBinding(props.sessionId);
  const workspaceRoots = props.workspaceRoots ?? [];
  const currentWorkspaceRoot = conversation.cwdBySessionId?.[props.sessionId]
    ?? binding?.workspaceRoot
    ?? props.currentWorkspaceRoot
    ?? props.cwd
    ?? null;
  const selectWorkspaceRoot = async (root: string) => {
    const shell = terminalSessions.getSnapshot?.(props.sessionId)?.shell;
    if (shell == null || shell === "unknown") return;
    const cwd = await terminalSessions.getShellCwd?.(props.sessionId, root);
    if (cwd == null) return;
    const command = commandForWorkspace(shell, cwd);
    if (command != null) terminalSessions.write(props.sessionId, command, "user");
  };
  const onKeyEvent = (event: KeyboardEvent): boolean => {
    if (workspaceRoots.length < 2 || terminalSessions.hasUserInteraction?.(props.sessionId)) return true;
    if (event.type !== "keydown" || !event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return true;
    const match = /^Digit([1-9])$/.exec(event.code);
    const root = match == null ? null : workspaceRoots[Number(match[1]) - 1] ?? null;
    if (root == null) return true;
    event.preventDefault();
    event.stopPropagation();
    void selectWorkspaceRoot(root);
    return false;
  };
  return jsx.jsx("div", {
    className: "min-h-0 flex-1",
    children: jsx.jsx(TerminalPanel, {
      conversationId: props.conversationId,
      conversationTitle: props.conversationTitle,
      cwd: props.cwd ?? null,
      hostId: props.hostId,
      initialPromptHint: jsx.jsx(WorkspaceRootHint, {
        currentWorkspaceRoot,
        onSelectWorkspaceRoot: selectWorkspaceRoot,
        sessionId: props.sessionId,
        workspaceRoots,
      }),
      onKeyEvent,
      sessionId: props.sessionId,
      workspaceRoot: props.cwd ?? null,
      onNewTerminalTab: () => props.onNewTerminalTab(),
    }),
  });
}

function TerminalTab(props: TerminalTabProps): unknown {
  initializeTerminalTab();
  return props.renderSlots({
    headerRows: [],
    content: props.hostId === "durable"
      ? jsx.jsx(CloudTerminal, { ...props })
      : jsx.jsx(LocalTerminal, { ...props }),
  });
}

let initialized = false;
function initializeTerminalTab(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  React = getReactRuntime();
  jsx = getJsxRuntime();
  initialized = true;
}

initializeTerminalTab();
export { TerminalTab };
