import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as textThumbnailChunk from "@rchunk/thumbnail-386f09e9e7b3";

interface JsxRuntime { jsx(type: unknown, props: Record<string, unknown>): unknown }
interface ReactRuntime { useState<T>(initial: () => T): [T, (value: T) => void] }
interface QueryClient { getQueryData(key: unknown): unknown }
const { $3: initializeRuntime, FX: initializeSignals, I3: getJsxRuntime, LX: useScope, aJ: contentSampleMaxFileBytes, e6: getReactRuntime, lW: contentSampleByteLimit, wL: initializeLinks } = appSharedChunk as unknown as { $3(): void; FX(): void; I3(): JsxRuntime; LX(signal: unknown): { queryClient: QueryClient }; aJ: number; e6(): ReactRuntime; lW: number; wL(): void };
const { $ln: queryKey, cet: appScope, let: initializeAppScope, nun: initializeQueries } = appInitialChunk as unknown as { $ln(name: string, input?: Record<string, unknown>): unknown; cet: unknown; let(): void; nun(): void };
const { n: initializeTextThumbnail, t: TextThumbnail } = textThumbnailChunk as unknown as { n(): void; t: unknown };
interface Draft { content: string; document?: { baseContent?: string; kind?: string } }
interface TextFileState { draft?: Draft; markdownMode?: string; pierreDraft?: Draft; textDraft?: Draft }
interface Props { hostId?: string; icon?: unknown; hideFilePath?: boolean; path: string; readState(): TextFileState | null; title: string }
let jsx: JsxRuntime;
function RegisteredTextFileThumbnail({ hostId, icon, hideFilePath, path, readState, title }: Props): unknown {
  const { queryClient } = useScope(appScope);
  const [snapshot] = getReactRuntime().useState(() => {
    const state = readState();
    const draft = state != null && "draft" in state ? state.draft : state?.markdownMode === "source" ? state.pierreDraft : state?.textDraft ?? state?.pierreDraft;
    const metadata = queryClient.getQueryData(queryKey("read-file-metadata", { hostId, path, contentSampleByteLimit, contentSampleMaxFileBytes })) as { contentKind?: string } | undefined;
    const file = metadata?.contentKind === "text" ? queryClient.getQueryData(queryKey("read-file", { hostId, path })) as { contents?: string } | undefined : undefined;
    return { hasUnsavedChanges: draft != null && (draft.document == null || draft.document.kind === "conflict" || draft.content !== draft.document.baseContent), content: draft?.content ?? file?.contents ?? null };
  });
  return jsx.jsx(TextThumbnail, { title, path, icon, hideFilePath, ...snapshot });
}
let initialized = false;
function initializeRegisteredTextFileThumbnail(): void { if (initialized) return; initialized = true; initializeRuntime(); initializeSignals(); initializeLinks(); initializeAppScope(); initializeQueries(); initializeTextThumbnail(); jsx = getJsxRuntime(); }
export { initializeRegisteredTextFileThumbnail as n, RegisteredTextFileThumbnail as t };
