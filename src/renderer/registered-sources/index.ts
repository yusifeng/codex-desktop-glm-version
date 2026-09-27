import "@rchunk/rolldown-runtime";
import {
  BX as useSignalFamilyValue,
  FX as initializeSignalRuntime,
  I3 as getJsxRuntime,
  Ib as SourcesIcon,
  Y2 as FormattedMessage,
  ZI as appScope,
  mg as fileIconForPath,
  oZ as createSignalFamily,
  type ScopedSignalFamily,
} from "@rchunk/app-shared";
import { HZt as initializeConversationModel, Xd as TabThumbnail } from "@rchunk/app-initial";
import { t as hostnameFromUrl } from "@rchunk/local-conversation-webmcp-tools-model";
import "@rchunk/local-conversation-external-resources";
import "@rchunk/local-conversation-summary-panel-sources-model";

type SourceActivity = "created" | "provided" | "read" | "updated";
type ThumbnailSource =
  | { activity: SourceActivity | null; kind: "external"; label: string }
  | { kind: "file"; label: string; path: string }
  | { activityLabel: string | null; kind: "tool"; label: string }
  | { kind: "web"; pageCount: number; searchCount: number }
  | { callCount: number; kind: "webmcp"; label: string };
interface ThumbnailState { sources: ThumbnailSource[]; totalCount: number | null; }
interface RegisteredLocalSourcesThumbnailProps { conversationId: string; hostId?: string; title: string; }

const localSourcesThumbnailSignal: ScopedSignalFamily<
  Record<string, unknown>,
  { conversationId: string; hostId?: string },
  ThumbnailState | null
> = (() => {
  initializeSignalRuntime();
  initializeConversationModel();
  return createSignalFamily(appScope, () => null);
})();

function activityLabel(activity: SourceActivity | null): string | null {
  if (activity == null) return null;
  return ({ created: "Created", provided: "Provided", read: "Read", updated: "Updated" })[activity];
}

function sourceUsage(source: ThumbnailSource, complete: boolean): unknown {
  const runtime = getJsxRuntime();
  if (source.kind === "external") return activityLabel(source.activity);
  if (source.kind === "file") return "Attached";
  if (source.kind === "tool") return source.activityLabel;
  if (source.kind === "webmcp") return complete ? `${source.callCount} ${source.callCount === 1 ? "call" : "calls"}` : "Used";
  if (!complete) return "Searched";
  if (source.searchCount > 0) return `${source.searchCount} ${source.searchCount === 1 ? "search" : "searches"}`;
  if (source.pageCount > 0) return `${source.pageCount} ${source.pageCount === 1 ? "page" : "pages"}`;
  return runtime.jsx(FormattedMessage, { id: "tabThumbnail.localSources.searched", defaultMessage: "Searched" });
}

function sourceRow(source: ThumbnailSource, complete: boolean): unknown {
  const runtime = getJsxRuntime();
  const icon = source.kind === "file"
    ? runtime.jsx(fileIconForPath(source.path), { className: "icon-sm text-codex-description" })
    : runtime.jsx(SourcesIcon, { className: "text-codex-description" });
  const label = source.kind === "web" ? "Web search" : source.label;
  return runtime.jsxs("div", {
    className: "flex min-w-0 items-center gap-1.5 text-sm leading-5",
    children: [icon, runtime.jsx("span", { className: "min-w-0 flex-1 truncate", children: label }), runtime.jsx("span", { className: "shrink-0 text-xs text-codex-description", children: sourceUsage(source, complete) })],
  });
}

function RegisteredLocalSourcesThumbnail(props: RegisteredLocalSourcesThumbnailProps): unknown {
  const state = useSignalFamilyValue(localSourcesThumbnailSignal, { conversationId: props.conversationId, hostId: props.hostId }) as ThumbnailState | null;
  if (state == null || state.sources.length === 0) return null;
  const runtime = getJsxRuntime();
  const complete = state.totalCount != null;
  return runtime.jsx(TabThumbnail, {
    icon: runtime.jsx(SourcesIcon, {}),
    title: props.title,
    subtitle: state.totalCount == null ? null : `${state.totalCount} ${state.totalCount === 1 ? "source" : "sources"}`,
    sections: state.sources.slice(0, 5).map((source) => ({ kind: "block", content: sourceRow(source, complete) })),
  });
}

void hostnameFromUrl;
export { RegisteredLocalSourcesThumbnail };
