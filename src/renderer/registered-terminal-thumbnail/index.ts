import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import { n as initializeTerminalThumbnail, t as TerminalThumbnail } from "@rchunk/terminal-thumbnail";
interface JsxRuntime { jsx(type: unknown, props: Record<string, unknown>): unknown }
interface ReactRuntime { useState<T>(initial: () => T): [T, (value: T) => void] }
const { $3: initializeRuntime, FX: initializeSignals, I3: getJsxRuntime, LX: useScope, e6: getReactRuntime } = appSharedChunk as unknown as { $3(): void; FX(): void; I3(): JsxRuntime; LX(signal: unknown): { queryClient: { getQueryData(key: unknown): unknown } }; e6(): ReactRuntime };
const { $ln: queryKey, Lgn: initializeTerminalSnapshots, Rgn: terminalSnapshots, cet: appScope, let: initializeAppScope, nun: initializeQueries } = appInitialChunk as unknown as { $ln(name: string, input: Record<string, unknown>): unknown; Lgn(): void; Rgn: { getRenderedOutput(id: string): unknown; getSnapshot(id: string): { cwd?: string | null } | null }; cet: unknown; let(): void; nun(): void };
interface Props { cwd?: string | null; hostId?: string; sessionId: string; title: string }
let jsx: JsxRuntime;
function RegisteredTerminalThumbnail({ cwd, hostId, sessionId, title }: Props): unknown { const { queryClient } = useScope(appScope); const [snapshot] = getReactRuntime().useState(() => ({ cwd: terminalSnapshots.getSnapshot(sessionId)?.cwd ?? null, outputTail: terminalSnapshots.getRenderedOutput(sessionId), homeDirectory: hostId == null ? undefined : (queryClient.getQueryData(queryKey("home-directory", { hostId })) as { homeDirectory?: string } | undefined)?.homeDirectory })); return jsx.jsx(TerminalThumbnail, { title, cwd: snapshot.cwd || cwd, homeDirectory: snapshot.homeDirectory, outputTail: snapshot.outputTail }); }
let initialized = false; function initializeRegisteredTerminalThumbnail(): void { if (initialized) return; initialized = true; initializeRuntime(); initializeSignals(); initializeAppScope(); initializeQueries(); initializeTerminalThumbnail(); initializeTerminalSnapshots(); jsx = getJsxRuntime(); }
initializeRegisteredTerminalThumbnail();
export { RegisteredTerminalThumbnail };
