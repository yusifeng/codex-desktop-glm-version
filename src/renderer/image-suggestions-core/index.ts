// Images/Home prompt suggestions: account-scoped catalog, generated draft
// identity, prompt-card analytics and selection/sketch/upload transitions.
import "@rchunk/rolldown-runtime";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
import * as imageHomeChunk from "@rchunk/chatgpt-image-home";
import * as recentUploadsChunk from "@rchunk/recent-uploads";
import type { JsxRuntime, ReactRuntime } from "@rchunk/app-shared";

type Surface = "home" | "images";
type Presentation = "icon_pill" | "image_card" | "portrait" | "text_pill";
interface Action { input_requirements?: { min_count?: number; source?: string | null }; strategy?: string }
interface Prompt { action?: Action; id: string; image_alt?: string | null; image_url?: string | null; image_variant_urls?: string[] | null; image_variants?: string[] | null; prompt_text: string; section?: string | null; system_hints?: string[] | null; title: string }
interface Group { action?: Action; id: string; items?: Prompt[]; kind?: "prompt_collection" | string | null; presentation: Presentation; title?: string | null }
interface Selection { accountId?: string; baseSystemHints?: string[]; group: Group; item: Prompt; surface?: Surface; userId?: string }
interface Controller { focus(): void; getPersistedText(): string; setPromptText(text: string): void; view: { dom?: { scrollIntoView(options: { behavior: "auto"; block: "center" }): void }; isDestroyed: boolean; state?: { doc?: unknown } } }
interface Composer { canOpenImagePicker?: boolean; isSketchOpen?(): boolean; openFileDialog?(imagesOnly?: boolean): void; openSketch?(options: { isRequestCurrent(): boolean; onSave(): void }): boolean }
interface Props { composer?: Composer | null; composerController: Controller; conversationId: string; disabled?: boolean; excludedPromptId?: string | null; groups?: Group[]; isConversationCurrent?(): boolean; onBeforeSelectPrompt?(): boolean | void; onReferenceImageSelected?(): void; onUploadSelectionChange?(selection: Selection | null): void; surface?: Surface }
interface Query<Value> { data?: Value; isError?: boolean; isPending?: boolean; isSuccess?: boolean; refetch?(): Promise<unknown> | unknown }
interface Scope { get<Value>(signal: unknown, parameter?: unknown): Value; set(signal: unknown, parameter: unknown, value?: unknown): void }
interface Shared { BX<Value>(family: unknown, parameter: unknown): Value; FX?(): void; HX<Value>(signal: unknown): Value; I3: JsxRuntime | (() => JsxRuntime); LX(scope: unknown): Scope; QI?(): void; ZI: unknown; e6: ReactRuntime | (() => ReactRuntime); eZ?(scope: unknown, factory: (context: { get<Value>(signal: unknown): Value }) => Record<string, unknown>): unknown; oZ?(scope: unknown, factory: (key: string, context: { scope: Scope }) => { conversationId: string }): unknown; pk?: unknown; rZ?(scope: unknown, derive: (key: string, context: { get<Value>(signal: unknown, parameter?: unknown): Value }) => string): unknown; sZ?(scope: unknown, derive: (context: { get<Value>(signal: unknown): Value }) => unknown): unknown }
interface Initial { GIt?(scope: Scope, conversationId: string, types: string[]): void; RIt?(): void; Sun?(): void; _un: unknown; kht: unknown; mun: unknown; rJt?: { safeGet(path: string, options: Record<string, unknown>): Promise<Record<string, unknown>> }; rqt?(): string; xpn?(scope: Scope, event: unknown, payload: Record<string, unknown>): void }
interface Primary { au?(): void; ou?(scope: Scope, conversationId: string, item: Prompt, group: Group, surface: Surface): Selection | null; su?(scope: Scope, conversationId: string, controller: Controller, selection: Selection): void; tu: unknown }
interface Recent { n?(): void; r?: unknown }
interface ImageHome { a?: Record<string, string>; i?: unknown; n?: unknown; o?(): void; r?: unknown; t?: Record<string, string> }

const shared = appSharedChunk as unknown as Shared;
const initial = appInitialChunk as unknown as Initial;
const primary = appPrimaryChunk as unknown as Primary;
const recent = recentUploadsChunk as unknown as Recent;
const imageHome = imageHomeChunk as unknown as ImageHome;
let React: ReactRuntime;
let jsx: JsxRuntime;
let imageSuggestionSelectionFamily: unknown;
let imageSuggestionConversationIdFamily: unknown;
let catalogQuery: unknown;
let stylesQuery: unknown;
let mergedGroupsSignal: unknown;
let initializedState = false;
let initializedAnalytics = false;
let initialized = false;

function createImageSuggestionConversationState(scope: Scope): { conversationId: string } {
  const conversationId = initial.rqt?.() ?? globalThis.crypto?.randomUUID?.() ?? `image-${Date.now().toString(36)}`;
  initial.GIt?.(scope, conversationId, ["picture_v2"]);
  return { conversationId };
}
function initializeImageSuggestionState(): void {
  if (initializedState) return;
  shared.FX?.(); initial.RIt?.(); shared.QI?.();
  imageSuggestionSelectionFamily = shared.oZ?.(shared.ZI, (_key, { scope }) => createImageSuggestionConversationState(scope)) ?? { kind: "image-suggestion-conversation" };
  imageSuggestionConversationIdFamily = shared.rZ?.(shared.ZI, (key, { get }) => get<{ conversationId: string }>(imageSuggestionSelectionFamily, key).conversationId) ?? { kind: "image-suggestion-conversation-id" };
  initializedState = true;
}
function presentationValue(presentation: Presentation): string | undefined {
  const names: Record<Presentation, string> = { icon_pill: "CHATGPT_IMAGE_PROMPT_GROUP_PRESENTATION_TYPE_ICON_PILL", image_card: "CHATGPT_IMAGE_PROMPT_GROUP_PRESENTATION_TYPE_IMAGE_CARD", portrait: "CHATGPT_IMAGE_PROMPT_GROUP_PRESENTATION_TYPE_PORTRAIT", text_pill: "CHATGPT_IMAGE_PROMPT_GROUP_PRESENTATION_TYPE_TEXT_PILL" };
  return imageHome.t?.[names[presentation]];
}
function analyticsPayload(item: Prompt, group: Group): Record<string, unknown> {
  const position = group.items?.findIndex((candidate) => candidate.id === item.id);
  return { position: position != null && position >= 0 ? position : undefined, promptGroupId: group.id, promptGroupPresentation: presentationValue(group.presentation), promptId: item.id };
}
function trackImageSuggestionSent(scope: Scope, item: Prompt, group: Group, imageSendUuid: string): void {
  initial.xpn?.(scope, imageHome.i, { ...analyticsPayload(item, group), imageSendUuid, surface: imageHome.a?.CHATGPT_IMAGE_PROMPT_SENT_SURFACE_TYPE_IMAGES });
}
function initializeImageSuggestionAnalytics(): void { if (!initializedAnalytics) { imageHome.o?.(); initializedAnalytics = true; } }
function collectSections(groups: readonly Group[], preferred: readonly string[] = []): string[] {
  return [...new Set(groups.flatMap((group) => group.kind == null || group.kind === "prompt_collection" ? group.items?.map((item) => item.section ?? "") ?? [] : []))].sort((left, right) => {
    const leftIndex = preferred.indexOf(left || "trending"); const rightIndex = preferred.indexOf(right || "trending");
    return (leftIndex < 0 ? preferred.length : leftIndex) - (rightIndex < 0 ? preferred.length : rightIndex);
  });
}
function mergeHomePromptText(existing: string, next: string, previous?: string): string {
  if (existing.trim() === "") return next;
  if (previous != null) { const index = existing.toLocaleLowerCase().indexOf(previous.toLocaleLowerCase()); if (index >= 0) return `${existing.slice(0, index)}${next}${existing.slice(index + previous.length)}`; }
  return `${next}\n\n${existing}`;
}
function initializeSuggestionQueries(): void {
  if (catalogQuery != null) return;
  const common = { staleTime: 300_000, refetchInterval: 300_000, refetchOnMount: "always", refetchOnWindowFocus: "always", refetchOnReconnect: "always" };
  catalogQuery = shared.eZ?.(shared.ZI, ({ get }) => { const accountId = get<string | null>(initial.mun); const userId = get<string | null>(initial._un); return { ...common, enabled: accountId != null && userId != null, queryKey: ["chatgpt-images", "catalog", accountId, userId], queryFn: ({ signal }: { signal?: AbortSignal }) => initial.rJt?.safeGet("/images/init", { additionalHeaders: accountId == null ? undefined : { "ChatGPT-Account-ID": accountId }, signal }) }; }) ?? { kind: "image-catalog" };
  stylesQuery = shared.eZ?.(shared.ZI, ({ get }) => { const accountId = get<string | null>(initial.mun); const userId = get<string | null>(initial._un); return { ...common, enabled: accountId != null && userId != null, queryKey: ["chatgpt-images", "styles", accountId, userId], queryFn: ({ signal }: { signal?: AbortSignal }) => initial.rJt?.safeGet("/images/styles", { additionalHeaders: accountId == null ? undefined : { "ChatGPT-Account-ID": accountId }, parameters: { query: { include_image_suggestions: true } }, signal }) }; }) ?? { kind: "image-styles" };
  mergedGroupsSignal = shared.sZ?.(shared.ZI, ({ get }) => {
    const catalog = get<Query<{ groups?: Group[] }>>(catalogQuery); const styles = get<Query<{ image_suggestions?: Prompt[]; styles?: { id: string }[] }>>(stylesQuery);
    if (catalog.isPending || styles.isPending) return undefined;
    const groups = catalog.data?.groups; if (catalog.isSuccess && groups == null) return [];
    const suggestions = styles.data?.image_suggestions; if (groups == null || suggestions == null || suggestions.length === 0) return groups;
    const ids = new Set(styles.data?.styles?.map((style) => style.id));
    const destination = groups.find((group) => (group.kind == null || group.kind === "prompt_collection") && group.items?.some((item) => ids.has(item.id)));
    return groups.map((group) => group === destination ? { ...group, items: suggestions } : group);
  }) ?? { kind: "merged-image-groups" };
}
function trackCard(scope: Scope, interaction: "impression" | "selected", item: Prompt, group: Group, surface: Surface): void {
  initial.xpn?.(scope, interaction === "impression" ? imageHome.n : imageHome.r, { ...analyticsPayload(item, group), surface: surface === "home" ? imageHome.a?.CHATGPT_IMAGE_PROMPT_SENT_SURFACE_TYPE_CHATGPT_HOME : imageHome.a?.CHATGPT_IMAGE_PROMPT_SENT_SURFACE_TYPE_IMAGES });
}
function imageSource(item: Prompt): string | undefined { return [item.image_url, ...(item.image_variant_urls ?? []), ...(item.image_variants ?? [])].find((value): value is string => value?.trim() !== ""); }
function PromptImage({ src }: { src?: string }): unknown {
  const [failed, setFailed] = React.useState(false);
  return src != null && !failed ? jsx.jsx("img", { alt: "", className: "h-full w-full object-cover", draggable: false, loading: "lazy", onError: () => setFailed(true), src }) : jsx.jsx("div", { "aria-hidden": true, className: "flex h-full w-full items-center justify-center text-tertiary", children: "✦" });
}
function SuggestionCard(props: { disabled?: boolean; group: Group; item: Prompt; onBeforeSelect?(): boolean | void; onSelect(): void; surface: Surface; visible: boolean }): unknown {
  const scope = shared.LX(shared.ZI); const impressed = React.useRef(false);
  React.useEffect(() => { if (props.surface === "home" && props.visible && !impressed.current) { impressed.current = true; trackCard(scope, "impression", props.item, props.group, props.surface); } }, [props.group, props.item, props.surface, props.visible]);
  const select = () => { if (props.onBeforeSelect?.() === false) return; trackCard(scope, "selected", props.item, props.group, props.surface); props.onSelect(); };
  const label = [...new Set([props.item.title, props.item.image_alt].filter((value): value is string => Boolean(value)))].join(", ");
  if (props.group.presentation === "text_pill") return jsx.jsx("button", { "aria-label": label, className: "max-w-full rounded-full px-4 py-2 text-sm", disabled: props.disabled, onClick: select, type: "button", children: props.item.title });
  if (props.group.presentation === "icon_pill") return jsx.jsxs("button", { "aria-label": label, className: "group/use flex w-full items-center gap-3 rounded-xl text-start", disabled: props.disabled, onClick: select, type: "button", children: [jsx.jsx("div", { className: "size-12 shrink-0 overflow-hidden rounded-xl bg-surface-secondary", children: jsx.jsx(PromptImage, { src: imageSource(props.item) }) }), jsx.jsx("span", { className: "line-clamp-2 text-sm text-secondary", children: props.item.title })] });
  return jsx.jsxs("button", { "aria-label": label, className: "group/use relative flex aspect-[4/5] w-full overflow-hidden rounded-2xl bg-surface-secondary text-start", disabled: props.disabled, onClick: select, type: "button", children: [jsx.jsx(PromptImage, { src: imageSource(props.item) }), jsx.jsx("div", { className: "pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-media-background/80 to-transparent px-3 pt-8 pb-3 text-media-foreground", children: jsx.jsx("span", { className: "line-clamp-2 text-sm font-medium", children: props.item.title }) })] });
}
function UploadCard({ disabled, onUpload }: { disabled: boolean; onUpload(): void }): unknown { return jsx.jsxs("button", { className: "relative flex aspect-[4/5] w-full items-center justify-center rounded-3xl bg-primary-ghost-hover", disabled, onClick: onUpload, type: "button", children: [jsx.jsx("span", { "aria-hidden": true, children: "+" }), jsx.jsx("span", { className: "absolute inset-x-0 bottom-0 p-3 text-start text-sm", children: "Upload a photo" })] }); }
function Catalog(props: { disabled?: boolean; excludedPromptId?: string | null; groups?: Group[]; hidden: boolean; onBeforeSelectPrompt?(): boolean | void; onSelectPrompt(item: Prompt, group: Group): void; surface: Surface; uploadCard?: unknown }): unknown {
  const remoteGroups = shared.HX<Group[] | undefined>(mergedGroupsSignal);
  const groups = (props.groups ?? remoteGroups)?.flatMap((group) => { const items = group.items?.filter((item) => item.id !== props.excludedPromptId); return items?.length === 0 ? [] : [{ ...group, items }]; });
  const catalogState = shared.HX<Query<unknown>>(catalogQuery) ?? {}; const stylesState = shared.HX<Query<unknown>>(stylesQuery) ?? {};
  const sections = collectSections(groups ?? []); const [selectedSection, setSelectedSection] = React.useState<string | null>(null); const active = selectedSection != null && sections.includes(selectedSection) ? selectedSection : sections[0] ?? ""; const hasSections = sections.some(Boolean);
  const visibleGroups = groups?.flatMap((group) => { if (group.kind != null && group.kind !== "prompt_collection" || group.items == null) return []; const items = group.items.filter((item) => !hasSections || (item.section ?? "") === active); return items.length === 0 ? [] : [{ ...group, items }]; });
  const retry = () => void Promise.all([catalogState.refetch?.(), stylesState.refetch?.()]);
  return jsx.jsxs("div", { className: "flex min-w-0 flex-col gap-4", hidden: props.hidden, children: [
    sections.length > 1 ? jsx.jsx("div", { "aria-label": "Image prompt categories", role: "tablist", children: sections.map((section) => jsx.jsx("button", { "aria-selected": section === active, onClick: () => setSelectedSection(section), role: "tab", type: "button", children: section || "Trending" }, section || "trending")) }) : null,
    jsx.jsxs("div", { "aria-busy": groups == null && !catalogState.isError && !stylesState.isError, role: "tabpanel", tabIndex: 0, children: [
      catalogState.isError || stylesState.isError ? jsx.jsxs("div", { role: "alert", children: ["Some image prompts couldn't be loaded", jsx.jsx("button", { onClick: retry, type: "button", children: "Retry" })] }) : null,
      groups == null && !catalogState.isError && !stylesState.isError ? jsx.jsx("div", { "aria-hidden": true, className: "grid grid-cols-4 gap-2", children: Array.from({ length: 12 }, (_value, index) => jsx.jsx("div", { className: "aspect-[4/5] rounded-2xl bg-surface-secondary" }, String(index))) }) : null,
      visibleGroups?.length === 0 && !catalogState.isError && !stylesState.isError ? jsx.jsxs("div", { children: [jsx.jsx("strong", { children: "Start with your own idea" }), jsx.jsx("p", { children: "Describe the image you want to create above" })] }) : null,
      visibleGroups?.map((group, groupIndex) => jsx.jsxs("section", { "aria-label": group.title ?? undefined, className: "flex min-w-0 flex-col gap-4", children: [groupIndex > 0 && group.title ? jsx.jsx("h2", { children: group.title }) : null, jsx.jsxs("div", { className: group.presentation === "text_pill" ? "flex flex-col items-start gap-2" : group.presentation === "icon_pill" ? "grid grid-cols-2 gap-4" : "grid grid-cols-4 gap-2", children: [groupIndex === 0 ? props.uploadCard : null, group.items?.map((item) => jsx.jsx(SuggestionCard, { disabled: props.disabled, group, item, onBeforeSelect: props.onBeforeSelectPrompt, onSelect: () => props.onSelectPrompt(item, group), surface: props.surface, visible: !props.hidden }, item.id))] })] }, group.id)),
    ] }),
  ] });
}
function RecentUploadSelection(props: { disabled?: boolean; onBack(): void; onSelected(): void; onUpload(): void; uploadDisabled: boolean }): unknown {
  const query = recent.r == null ? undefined : shared.BX<Query<{ file_id: string }[]>>(recent.r, true);
  return jsx.jsxs("section", { "aria-label": "Reference photos", className: "mx-auto flex w-full max-w-3xl flex-col gap-4", children: [jsx.jsxs("div", { children: [jsx.jsx("button", { onClick: props.onBack, type: "button", children: "Back" }), jsx.jsx("h2", { children: "Choose a reference photo" })] }), query?.isError ? jsx.jsx("div", { role: "alert", children: jsx.jsx("button", { onClick: () => query.refetch?.(), type: "button", children: "Retry loading photos" }) }) : null, jsx.jsxs("div", { className: "grid grid-cols-5 gap-3", children: [jsx.jsx(UploadCard, { disabled: props.disabled === true || props.uploadDisabled, onUpload: props.onUpload }), query?.data?.map((record, index) => jsx.jsx("button", { "aria-label": `Recent upload ${index + 1}`, disabled: props.disabled, onClick: props.onSelected, type: "button", children: record.file_id }, record.file_id))] })] });
}
function ImageSuggestions(props: Props): unknown {
  initializeImageSuggestions(); const surface = props.surface ?? "images"; const scope = shared.LX(initial.kht); const selected = shared.BX<Selection | null>(primary.tu, props.conversationId); const latestSelection = React.useRef<Selection | symbol | null>(selected); const [showCatalogAfterBack, setShowCatalogAfterBack] = React.useState(false);
  const action = selected == null ? null : selected.item.action ?? selected.group.action; const showRecentUploads = action?.input_requirements?.source != null && action.input_requirements.source !== "prompt_only" && action.input_requirements.source !== "sketch" && !showCatalogAfterBack;
  const select = (item: Prompt, group: Group): Selection | null => { const next = primary.ou?.(scope, props.conversationId, item, group, surface) ?? null; if (next == null) return null; setShowCatalogAfterBack(false); props.composerController.setPromptText(surface === "home" ? mergeHomePromptText(props.composerController.getPersistedText(), item.prompt_text, selected?.item.prompt_text) : item.prompt_text); props.onUploadSelectionChange?.(next); return next; };
  const focus = () => { props.composerController.focus(); props.composerController.view.dom?.scrollIntoView({ behavior: "auto", block: "center" }); };
  const choose = (item: Prompt, group: Group) => {
    if (props.disabled) return;
    if ((item.action ?? group.action)?.input_requirements?.source !== "sketch") { const next = select(item, group); if (next != null) { latestSelection.current = next; focus(); } return; }
    const accountId = scope.get<string | null>(initial.mun); const userId = scope.get<string | null>(initial._un); const request = Symbol("sketch-request"); const document = props.composerController.view.state?.doc;
    const current = () => !props.composerController.view.isDestroyed && scope.get(initial.mun) === accountId && scope.get(initial._un) === userId && latestSelection.current === request && (props.isConversationCurrent?.() ?? true);
    const opened = props.composer?.openSketch?.({ isRequestCurrent: current, onSave: () => { if (!current() || props.composerController.view.state?.doc !== document) return; select(item, group); requestAnimationFrame(() => { if (current() && props.composer?.isSketchOpen?.() === false) focus(); }); } });
    if (opened) { latestSelection.current = request; props.onUploadSelectionChange?.(null); return; }
    scope.get<{ danger?(message: string, options?: unknown): void } | undefined>(shared.pk)?.danger?.("Sketch is unavailable right now", { errorAnalytics: { toastId: "images.sketch.unavailable" } });
  };
  const recentNode = showRecentUploads ? jsx.jsx(RecentUploadSelection, { disabled: props.disabled, onBack: () => setShowCatalogAfterBack(true), onSelected: () => { if (latestSelection.current !== selected || selected == null) return; if (props.onReferenceImageSelected != null) props.onReferenceImageSelected(); else primary.su?.(scope, props.conversationId, props.composerController, selected); }, onUpload: () => props.composer?.openFileDialog?.(true), uploadDisabled: !props.composer?.canOpenImagePicker }) : null;
  const uploadCard = surface === "home" ? jsx.jsx(UploadCard, { disabled: props.disabled === true || !props.composer?.canOpenImagePicker, onUpload: () => props.composer?.openFileDialog?.(true) }) : undefined;
  return jsx.jsxs("div", { className: "flex min-w-0 flex-col gap-8", children: [recentNode, jsx.jsx(Catalog, { disabled: props.disabled, excludedPromptId: props.excludedPromptId, groups: props.groups, hidden: showRecentUploads, onBeforeSelectPrompt: props.onBeforeSelectPrompt, onSelectPrompt: choose, surface, uploadCard })] });
}
function initializeImageSuggestions(): void {
  if (initialized) return;
  React = typeof shared.e6 === "function" ? shared.e6() : shared.e6; jsx = typeof shared.I3 === "function" ? shared.I3() : shared.I3;
  initial.Sun?.(); primary.au?.(); initializeImageSuggestionState(); initializeImageSuggestionAnalytics(); initializeSuggestionQueries(); recent.n?.(); initialized = true;
}
export { createImageSuggestionConversationState as a, initializeImageSuggestionState as c, trackImageSuggestionSent as i, initializeImageSuggestions as n, imageSuggestionSelectionFamily as o, initializeImageSuggestionAnalytics as r, imageSuggestionConversationIdFamily as s, ImageSuggestions as t };
