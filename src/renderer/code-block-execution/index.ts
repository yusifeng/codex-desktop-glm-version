import "@rchunk/rolldown-runtime";
import {
  $3 as initializeCompilerRuntime,
  I3 as getJsxRuntime,
  K2 as initializeReactCompilerRuntime,
  Yh as Button,
  e6 as getReactRuntime,
  h4 as initializeClassNames,
  m4 as classNames,
  n4 as useIntl,
  type JsxRuntime,
  type ReactRuntime,
} from "@rchunk/app-shared";
import "@rchunk/app-initial";
import { n as initializeAnsiBlock, t as AnsiBlock } from "@rchunk/ansi-block";
import {
  n as initializeBrowserSandboxConnection,
  t as connectBrowserSandbox,
} from "../../webview/assets/connect-code-execution-sandbox-b02ae1d03047.js";

type ExecutionMessage =
  | { type: "run_start" }
  | { type: "environment_status"; status: number }
  | { type: "log"; level?: string; log: unknown }
  | { type: "output"; output: unknown }
  | { type: "error"; error: { message: string; name?: string; stack?: string[] } }
  | { type: "run_complete"; duration?: number | null; wasCancelled?: boolean; wasFatalError?: boolean };
interface ExecutionInput { additionalGlobals?: Record<string, unknown>; code: string; expectReadySignal?: boolean; language: string }
interface RunStream extends AsyncIterable<ExecutionMessage> {}
interface SandboxClient {
  api: {
    runUserCode(input: ExecutionInput & { id: string }): RunStream;
    stop?: (() => Promise<unknown>) & { withOptions?(options: { signal: AbortSignal }): () => Promise<unknown> };
  };
  dispose?(): void;
}
interface ConnectorOptions { iframe?: unknown; host: Record<string, unknown>; origin?: string; signal: AbortSignal; sourceUrl?: string; webview?: unknown }
type SandboxConnector = (options: ConnectorOptions) => Promise<SandboxClient | null> | SandboxClient | null;
interface NetworkRequest { origin: string; url: string }
interface ExecutionSnapshot { error: string | null; isRunning: boolean; isStopping: boolean; messages: ExecutionMessage[]; networkRequests: NetworkRequest[]; unavailable: boolean }
interface TurnContext { browserConversationId?: string; conversationId: string; hostId?: string; messageId?: string; shouldBlockExternalEgress?: boolean }
interface CodeBlockExecutionProps {
  children(runButton: unknown, consoleOutput: unknown): unknown;
  code: string;
  codeBlockIndex?: number;
  disabled?: boolean;
  isEdited?: boolean;
  onRun(): void;
  turnContext: TurnContext;
}
type NativeConnectorModule = { connectNativeCodeExecutionSandbox?: SandboxConnector };

let jsx: JsxRuntime;
let React: ReactRuntime;
let initialized = false;

function serializeLog(value: unknown): string {
  if (typeof value === "string") return value;
  try { return JSON.stringify(value, null, 2) ?? String(value); } catch { return String(value); }
}

class CodeExecutionController {
  private client: SandboxClient | null = null;
  private disposed = false;
  private generation = 0;
  private listeners = new Set<() => void>();
  private snapshot: ExecutionSnapshot = { error: null, isRunning: false, isStopping: false, messages: [], networkRequests: [], unavailable: false };
  readonly getSnapshot = (): ExecutionSnapshot => this.snapshot;
  readonly subscribe = (listener: () => void): (() => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };

  constructor(private readonly turnContext: TurnContext) {}

  private update(next: Partial<ExecutionSnapshot>): void {
    if (this.disposed) return;
    this.snapshot = { ...this.snapshot, ...next };
    for (const listener of this.listeners) listener();
  }

  private async connect(): Promise<SandboxClient | null> {
    if (this.client != null) return this.client;
    const controller = new AbortController();
    const nativeModule = await import("../../webview/assets/native-code-execution-sandbox-fa3ec5081637.js") as NativeConnectorModule;
    const connector = nativeModule.connectNativeCodeExecutionSandbox ?? connectBrowserSandbox as SandboxConnector;
    const origin = "https://web-sandbox.oaiusercontent.com";
    const client = await connector({
      iframe: undefined,
      host: {
        notifySecurityPolicyViolation: (event: { blockedURI?: string }) => {
          if (this.turnContext.shouldBlockExternalEgress || event.blockedURI == null) return;
          try {
            const url = new URL(event.blockedURI);
            if (!this.snapshot.networkRequests.some((request) => request.origin === url.origin)) {
              this.update({ networkRequests: [...this.snapshot.networkRequests, { origin: url.origin, url: url.href }] });
            }
          } catch { /* Invalid blocked URLs are ignored. */ }
        },
      },
      origin,
      signal: controller.signal,
      sourceUrl: `${origin}?thread=${encodeURIComponent(this.turnContext.browserConversationId ?? this.turnContext.conversationId)}`,
    });
    this.client = client;
    return client;
  }

  async run(input: ExecutionInput): Promise<void> {
    if (this.disposed) return;
    const generation = ++this.generation;
    this.update({ error: null, isRunning: true, isStopping: false, messages: [], networkRequests: [], unavailable: false });
    try {
      const client = await this.connect();
      if (client == null || generation !== this.generation) { this.update({ isRunning: false, unavailable: true }); return; }
      const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `code-${generation}`;
      let completed = false;
      for await (const message of client.api.runUserCode({ ...input, id })) {
        if (generation !== this.generation) return;
        completed ||= message.type === "run_complete";
        this.update({ messages: [...this.snapshot.messages, message] });
        if (message.type === "error") this.update({ error: message.error.message });
      }
      if (generation === this.generation) {
        this.update({ isRunning: false, error: completed ? this.snapshot.error : this.snapshot.error ?? "Preview could not be loaded" });
      }
    } catch (error) {
      if (generation === this.generation) this.update({ isRunning: false, error: error instanceof Error ? error.message : String(error) });
    }
  }

  async stop(): Promise<void> {
    if (this.disposed) return;
    ++this.generation;
    this.update({ isStopping: true, networkRequests: [] });
    try {
      const stop = this.client?.api.stop;
      if (stop?.withOptions != null) await stop.withOptions({ signal: AbortSignal.timeout(1000) })();
      else await stop?.();
    } finally {
      this.update({ isRunning: false, isStopping: false, messages: [...this.snapshot.messages, { type: "run_complete", duration: null, wasCancelled: true }] });
    }
  }

  approveNetwork = async (): Promise<void> => { this.update({ networkRequests: [] }); };
  denyNetwork = (): void => { this.update({ networkRequests: [] }); };
  dispose(): void { this.disposed = true; ++this.generation; this.client?.dispose?.(); this.client = null; this.listeners.clear(); }
}

function ConsoleMessage({ message }: { message: ExecutionMessage }): unknown {
  if (message.type === "run_start") return jsx.jsx("span", { className: "text-tertiary", children: "Run started" });
  if (message.type === "environment_status") return jsx.jsx("span", { className: "text-tertiary", children: ["Initializing environment", "Installing packages", "Running code"][message.status] ?? null });
  if (message.type === "log") return jsx.jsx("span", { className: message.level === "warn" ? "text-warning" : undefined, children: jsx.jsx(AnsiBlock, { children: serializeLog(message.log) }) });
  if (message.type === "output") {
    const output = serializeLog(message.output);
    return /^data:image\/png;base64,iVBORw0KGgo[A-Za-z0-9+/]*={0,2}$/.test(output)
      ? jsx.jsx("img", { alt: "Image produced by the code", className: "max-h-72 max-w-full rounded-xl border border-default", src: output })
      : jsx.jsx(AnsiBlock, { children: output });
  }
  if (message.type === "error") {
    const title = message.error.name == null ? message.error.message : `${message.error.name}: ${message.error.message}`;
    return jsx.jsx("span", { className: "text-danger", children: jsx.jsx(AnsiBlock, { children: [...(message.error.stack ?? []).filter((line) => line !== title), title].join("\n") }) });
  }
  const status = message.wasCancelled ? "Run stopped" : message.wasFatalError ? "Run failed" : "Run completed";
  return jsx.jsx("span", { className: "text-tertiary", children: `${status}${message.duration == null ? "" : ` in ${message.duration.toFixed(3)}ms`}` });
}

function ExecutionConsole({ snapshot }: { snapshot: ExecutionSnapshot }): unknown {
  const empty = snapshot.messages.length === 0;
  return jsx.jsxs("div", {
    className: "flex min-w-0 flex-col bg-surface-elevated px-4 py-3 font-code text-size-code whitespace-pre-wrap text-default",
    "aria-label": "Console", "aria-live": "polite", role: "log", dir: "ltr",
    children: [
      empty ? jsx.jsx("span", { className: "text-tertiary", children: snapshot.isRunning ? "Run in progress" : "No output" }) : null,
      snapshot.messages.map((message, index) => jsx.jsx(ConsoleMessage, { message }, index)),
      snapshot.error != null && !snapshot.isRunning ? jsx.jsx("span", { className: "text-danger", children: jsx.jsx(AnsiBlock, { children: snapshot.error }) }) : null,
    ],
  });
}

function NetworkApproval({ controller, requests }: { controller: CodeExecutionController; requests: NetworkRequest[] }): unknown {
  return jsx.jsxs("div", { role: "dialog", "aria-label": "Allow network access?", className: "rounded-xl border border-default p-4", children: [
    jsx.jsx("p", { children: "This code wants to connect to the following websites." }),
    requests.map((request) => jsx.jsx("div", { className: "break-all", children: request.url }, request.origin)),
    jsx.jsxs("div", { className: "flex gap-2", children: [
      jsx.jsx(Button, { color: "secondary", type: "button", onClick: controller.denyNetwork, children: "Deny all" }),
      jsx.jsx(Button, { type: "button", onClick: controller.approveNetwork, children: "Allow selected" }),
    ] }),
  ] });
}

function CodeBlockExecution({ children, code, disabled = false, isEdited = false, onRun, turnContext }: CodeBlockExecutionProps): unknown {
  const intl = useIntl();
  const [controller] = React.useState(() => new CodeExecutionController(turnContext));
  const snapshot = React.useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const [opened, setOpened] = React.useState(false);
  React.useEffect(() => () => controller.dispose(), [controller]);
  const actionDisabled = snapshot.isStopping || (!opened && (disabled || snapshot.unavailable));
  const onClick = (): void => {
    if (opened) { setOpened(false); if (snapshot.isRunning) void controller.stop(); return; }
    setOpened(true); onRun(); void controller.run({ code, language: "python" }); void isEdited;
  };
  const label = opened
    ? intl.formatMessage({ id: "chatgpt.codeExecution.stop", defaultMessage: "Stop running code" })
    : intl.formatMessage({ id: "chatgpt.codeBlocks.run.ariaLabel", defaultMessage: "Run code" });
  const runButton = jsx.jsx(Button, { "aria-label": label, disabled: actionDisabled, color: opened ? "danger" : "secondary", onClick, size: "compact", type: "button", children: opened ? "Stop" : "Run" });
  const consoleOutput = opened ? jsx.jsx(ExecutionConsole, { snapshot }) : null;
  return jsx.jsxs(jsx.Fragment, { children: [
    children(runButton, consoleOutput),
    snapshot.networkRequests.length > 0 ? jsx.jsx(NetworkApproval, { controller, requests: snapshot.networkRequests }) : null,
  ] });
}

function initializeCodeBlockExecution(): void {
  if (initialized) return; initialized = true;
  initializeCompilerRuntime(); initializeReactCompilerRuntime(); initializeClassNames(); initializeAnsiBlock(); initializeBrowserSandboxConnection();
  React = getReactRuntime(); jsx = getJsxRuntime();
}

initializeCodeBlockExecution();
export { CodeBlockExecution };
