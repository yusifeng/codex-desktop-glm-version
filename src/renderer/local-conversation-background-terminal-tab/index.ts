import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as xtermOutputPanelChunk from "@rchunk/xterm-output-panel";
import "@rchunk/terminal-panel";
import "@rchunk/theme-font-face-loader";
import "@rchunk/theme-font-family";
import "@rchunk/xterm-window-zoom";

interface ReactRuntime { useSyncExternalStore<Value>(subscribe: (listener: () => void) => () => void, getSnapshot: () => Value, getServerSnapshot: () => Value): Value }
interface JsxRuntime { jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown }
interface CommandExecutionItem { aggregatedOutput?: string | null; id: string; type: string }
interface TurnGroup { items: Array<CommandExecutionItem | null | undefined> }
interface TerminalSnapshot { buffer?: string | null }
interface TerminalSessionManager { getSnapshot(sessionId: string): TerminalSnapshot | null | undefined; subscribeToSessionSnapshot(sessionId: string, listener: () => void): () => void }
interface XtermOutputPanelProps { onRenderedOutputReady(readOutput: string): void; output: string }
interface RenderSlots { (slots: { content: unknown; headerRows: unknown[] }): unknown }
interface TabState { readOutput: string }
interface Props { conversationId: string; renderSlots: RenderSlots; setTabState(state: TabState): void; terminalId: string }

const sharedRuntime = appSharedChunk as unknown as { $3?(): void; BX?<Value>(query: unknown, key: unknown): Value; FX?(): void; H3?(): void; I3(): JsxRuntime; K2?(): void; e6(): ReactRuntime; qm?(): void };
const initialRuntime = appInitialChunk as unknown as { HZt?(): void; Lgn?(): void; Rgn: TerminalSessionManager; n$t?: unknown };
const outputRuntime = xtermOutputPanelChunk as unknown as { XtermOutputPanel?: (props: XtermOutputPanelProps) => unknown };
const { $3: initializeSharedRuntime, BX: useQueryData, FX: initializeSharedFeatures, H3: initializeLazyUi, I3: getJsxRuntime, K2: initializeSharedUi, e6: getReactRuntime, qm: initializeTypography } = sharedRuntime;
const { HZt: initializeTerminalSnapshots, Lgn: initializeConversationEntries, Rgn: terminalSessions, n$t: conversationEntriesQuery } = initialRuntime;
const { XtermOutputPanel } = outputRuntime;

initializeSharedRuntime?.();
initializeSharedFeatures?.();
initializeSharedUi?.();
initializeTerminalSnapshots?.();
initializeTypography?.();
initializeConversationEntries?.();
initializeLazyUi?.();

const React = getReactRuntime();
const jsx = getJsxRuntime();

function findCommandExecution(groups: TurnGroup[] | null | undefined, terminalId: string): CommandExecutionItem | null {
  if (groups == null) return null;
  for (let groupIndex = groups.length - 1; groupIndex >= 0; groupIndex -= 1) {
    const group = groups[groupIndex];
    if (group == null) continue;
    for (const item of group.items) if (item?.type === "commandExecution" && item.id === terminalId) return item;
  }
  return null;
}
function useTerminalSnapshot(terminalId: string): TerminalSnapshot | null | undefined {
  return React.useSyncExternalStore(
    (listener) => terminalSessions.subscribeToSessionSnapshot(terminalId, listener),
    () => terminalSessions.getSnapshot(terminalId),
    () => null,
  );
}
function LocalConversationBackgroundTerminalTab({ conversationId, renderSlots, setTabState, terminalId }: Props): unknown {
  const groups = useQueryData?.<TurnGroup[]>(conversationEntriesQuery, conversationId) ?? [];
  const commandExecution = findCommandExecution(groups, terminalId);
  const snapshot = useTerminalSnapshot(terminalId);
  const output = commandExecution?.aggregatedOutput ?? snapshot?.buffer ?? "";
  const content = jsx.jsx("div", { className: "h-full min-h-0 bg-surface", children: output.length > 0
    ? XtermOutputPanel == null
      ? jsx.jsx("pre", { "data-codex-xterm-output": true, children: output })
      : jsx.jsx(XtermOutputPanel, { output, onRenderedOutputReady: (readOutput: string) => setTabState({ readOutput }) })
    : jsx.jsx("div", { className: "p-4 font-code text-size-code-sm text-codex-description", role: "status", children: "No output yet" }) });
  return renderSlots({ headerRows: [], content });
}

export { LocalConversationBackgroundTerminalTab };
