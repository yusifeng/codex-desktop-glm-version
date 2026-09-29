import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import "@rchunk/theme-font-family";
import "@rchunk/theme-font-face-loader";
import "@rchunk/xterm-window-zoom";
import "@rchunk/terminal-panel-bootstrap";

const {
  $3: initializeRuntimeLazy,
  I3: getJsxRuntime,
  Y2: FormattedMessage,
  Yh: Button,
  e6: getReactRuntime,
} = appSharedChunk as typeof appSharedChunk & {
  Yh: (props: Record<string, unknown>) => unknown;
};
const {
  Rgn: terminalSessions,
  jet: ErrorBoundary,
  ket: EmptyState,
} = appInitialChunk as typeof appInitialChunk & {
  Rgn: TerminalSessionManager;
  jet: (props: Record<string, unknown>) => unknown;
  ket: (props: Record<string, unknown>) => unknown;
};

interface TerminalSnapshot {
  output?: string;
  shell?: string;
  title?: string;
}

interface TerminalSessionManager {
  close?(sessionId: string): void;
  create(options: Record<string, unknown>): string;
  getSnapshot?(sessionId: string): TerminalSnapshot | null | undefined;
  isSessionStarted?(sessionId: string): boolean;
  recordUserInteraction?(sessionId: string): void;
  register?(sessionId: string, handlers: {
    getRenderedOutput(): string;
    onAttach(): void;
    onClearActive(): void;
    onData(data: string): void;
    onInitLog(data: string): void;
  }): () => void;
  setTitle?(sessionId: string, title: string): void;
  subscribeToSessionSnapshot?(sessionId: string, listener: () => void): () => void;
  write(sessionId: string, data: string, source: "terminal-generated" | "user"): void;
}

export interface TerminalPanelProps {
  conversationId: string;
  conversationTitle: string;
  cwd?: string | null;
  environmentId?: string | null;
  hostId?: string | null;
  initialPromptHint?: unknown;
  loadingOverlay?: unknown;
  onKeyEvent?: (event: KeyboardEvent) => boolean | void;
  onNewTerminalTab?: () => void;
  sessionId?: string;
  workspaceRoot?: string | null;
}

let React: import("@rchunk/app-shared").ReactRuntime;
let jsx: import("@rchunk/app-shared").JsxRuntime;

function TerminalError({ onRetry }: { onRetry(): void }): unknown {
  return jsx.jsx(EmptyState, {
    actions: jsx.jsx(Button, {
      color: "secondary",
      onClick: onRetry,
      children: jsx.jsx(FormattedMessage, {
        id: "terminal.error.retry",
        defaultMessage: "Reload",
        description: "Button label that reloads rendering the terminal after a crash",
      }),
    }),
    className: "h-full bg-surface",
    description: jsx.jsx(FormattedMessage, {
      id: "terminal.error.description",
      defaultMessage: "Try reloading the terminal to continue",
      description: "Description shown in the terminal panel when the embedded terminal crashes",
    }),
    title: jsx.jsx(FormattedMessage, {
      id: "terminal.error.title",
      defaultMessage: "The terminal encountered an error",
      description: "Title shown in the terminal panel when the embedded terminal crashes",
    }),
  });
}

function getControlSequence(event: KeyboardEvent): string | null {
  if (!event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return null;
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") return "\u0001";
  if (event.key === "ArrowRight" || event.key === "ArrowDown") return "\u0005";
  if (event.key === "Backspace") return "\u0015";
  if (event.key === "Delete") return "\u000b";
  return null;
}

function stopKeyboardEvent(event: Event): void {
  event.preventDefault();
  event.stopPropagation();
}

function TerminalSurface({
  conversationId,
  conversationTitle,
  cwd,
  environmentId,
  hostId,
  initialPromptHint,
  loadingOverlay,
  onKeyEvent,
  onNewTerminalTab,
  sessionId,
  workspaceRoot,
}: TerminalPanelProps): unknown {
  const ownedSessionRef = React.useRef(false);
  const activeSessionRef = React.useRef(sessionId ?? "");
  const [output, setOutput] = React.useState(
    () => sessionId == null ? "" : terminalSessions.getSnapshot?.(sessionId)?.output ?? "",
  );

  React.useEffect(() => {
    const activeSessionId = sessionId ?? terminalSessions.create({
      conversationId,
      conversationTitle,
      hostId: hostId ?? null,
      environmentId: environmentId ?? null,
      cwd: cwd ?? null,
      workspaceRoot: workspaceRoot ?? null,
    });
    activeSessionRef.current = activeSessionId;
    ownedSessionRef.current = sessionId == null;
    if (sessionId != null && !terminalSessions.isSessionStarted?.(sessionId)) {
      terminalSessions.create({
        sessionId,
        conversationId,
        conversationTitle,
        hostId: hostId ?? null,
        environmentId: environmentId ?? null,
        cwd: cwd ?? null,
        workspaceRoot: workspaceRoot ?? null,
      });
    }
    const unregister = terminalSessions.register?.(activeSessionId, {
      getRenderedOutput: () => output,
      onAttach: () => undefined,
      onClearActive: () => setOutput(""),
      onData: (data) => setOutput((current) => current + data),
      onInitLog: (data) => setOutput(data),
    });
    const unsubscribe = terminalSessions.subscribeToSessionSnapshot?.(
      activeSessionId,
      () => {
        const snapshot = terminalSessions.getSnapshot?.(activeSessionId);
        if (snapshot?.output != null) setOutput(snapshot.output);
      },
    );
    return () => {
      unregister?.();
      unsubscribe?.();
      if (ownedSessionRef.current) terminalSessions.close?.(activeSessionId);
    };
  }, [conversationId, conversationTitle, cwd, environmentId, hostId, sessionId, workspaceRoot]);

  const write = (data: string, source: "terminal-generated" | "user" = "user") => {
    const activeSessionId = activeSessionRef.current;
    if (!activeSessionId || !data) return;
    terminalSessions.recordUserInteraction?.(activeSessionId);
    terminalSessions.write(activeSessionId, data, source);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (onKeyEvent?.(event) === false) return;
    if (event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === "t" && onNewTerminalTab != null) {
      stopKeyboardEvent(event);
      onNewTerminalTab();
      return;
    }
    const controlSequence = getControlSequence(event);
    if (controlSequence != null) {
      stopKeyboardEvent(event);
      write(controlSequence);
      return;
    }
    if (event.key === "Enter") {
      stopKeyboardEvent(event);
      write("\r", "terminal-generated");
    } else if (event.key === "Backspace") {
      stopKeyboardEvent(event);
      write("\u007f", "terminal-generated");
    } else if (!event.metaKey && !event.ctrlKey && !event.altKey && event.key.length === 1) {
      stopKeyboardEvent(event);
      write(event.key, "terminal-generated");
    }
  };

  const onPaste = (event: ClipboardEvent) => {
    const text = event.clipboardData?.getData("text") ?? "";
    if (text) {
      stopKeyboardEvent(event);
      write(text);
    }
  };

  return jsx.jsxs("div", {
    id: sessionId == null ? undefined : "terminal-panel-" + sessionId,
    "data-codex-terminal": true,
    "data-codex-xterm": true,
    className: "relative flex h-full w-full flex-col",
    style: {
      backgroundColor: "var(--color-codex-terminal-background)",
      color: "var(--color-codex-terminal-foreground)",
    },
    children: [
      jsx.jsx("div", {
        className: "flex-1 overflow-auto ps-4 pt-2 pb-3 font-mono text-sm whitespace-pre-wrap outline-none",
        role: "textbox",
        tabIndex: 0,
        onKeyDown,
        onPaste,
        children: output,
      }),
      loadingOverlay == null ? null : jsx.jsx("div", { className: "absolute inset-0", children: loadingOverlay }),
      initialPromptHint == null ? null : jsx.jsx("div", {
        className: "pointer-events-none absolute inset-x-4 bottom-3 z-10 overflow-hidden pt-2",
        children: jsx.jsx("div", {
          className: "pointer-events-auto max-h-full w-fit max-w-full overflow-y-auto",
          children: initialPromptHint,
        }),
      }),
    ],
  });
}

function TerminalPanel(props: TerminalPanelProps): unknown {
  initializeTerminalPanel();
  const key = props.sessionId ?? props.conversationId;
  return jsx.jsx(ErrorBoundary, {
    name: "TerminalPanel",
    fallback: ({ resetError }: { resetError(): void }) => jsx.jsx(TerminalError, { onRetry: resetError }),
    children: jsx.jsx(TerminalSurface, { ...props }),
  }, key);
}

let initialized = false;
function initializeTerminalPanel(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  React = getReactRuntime();
  jsx = getJsxRuntime();
  initialized = true;
}

initializeTerminalPanel();
export { TerminalPanel };
