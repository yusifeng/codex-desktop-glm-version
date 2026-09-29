// chatgpt-shared-post-page — Public post loading, content routing, and share continuation.

// @ts-ignore -- semantic module is present in the published renderer graph.
import * as analyticsChunk from "@rchunk/analytics";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
// @ts-ignore -- semantic module is present in the published renderer graph.
import * as browserDisclaimerChunk from "@rchunk/browser-composer-disclaimer";
// @ts-ignore -- semantic module is present in the published renderer graph.
import * as conversationPageChunk from "@rchunk/chatgpt-conversation-page";
// @ts-ignore -- semantic module is present in the published renderer graph.
import * as imageHomeChunk from "@rchunk/chatgpt_image_home";
import * as documentTitleChunk from "@rchunk/document-title";
import * as imageValidationChunk from "@rchunk/image-validation-session";
import * as rightPanelChunk from "@rchunk/right-panel-composer-overlay";
import * as threadScrollChunk from "@rchunk/thread-scroll-layout";
import * as composerControllerChunk from "@rchunk/use-chatgpt-composer-controller";
// @ts-ignore -- semantic module is present in the published renderer graph.
import * as viewerChunk from "@rchunk/viewer";
import "@rchunk/rolldown-runtime";

type UnavailableReason = "deleted" | "general" | "not_found" | "workspace" | string;
interface JsxRuntime { Fragment: unknown; jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown; jsxs(type: unknown, props: Record<string, unknown>, key?: string): unknown }
interface ReactRuntime {
  useEffect(effect: () => void | (() => void), dependencies?: readonly unknown[]): void;
  useEffectEvent?<Callback extends (...arguments_: never[]) => unknown>(callback: Callback): Callback;
  useRef<Value>(value: Value): { current: Value };
  useState<Value>(value: Value | (() => Value)): [Value, (next: Value | ((current: Value) => Value)) => void];
}
interface IntlRuntime { formatMessage(descriptor: { defaultMessage: string; description?: string; id: string }, values?: Record<string, unknown>): string }
interface ToastRuntime { info(message: string): void; warning(message: string, options?: Record<string, unknown>): void }
interface ScopeApi { get(signal: unknown, parameter?: unknown): unknown; set?(signal: unknown, value: unknown): void; watch?(listener: (input: { get(signal: unknown, parameter?: unknown): unknown }) => void): () => void }
interface PromptShareContent {
  generated_image?: { image_url?: string | null; prompt_match?: string | null };
  prompt: string;
  title: string;
}
interface PromptShareAttachment {
  kind: "prompt_share";
  prompt_share: { content: PromptShareContent; prompt_share_id: string; recipient_action?: { image_input?: "optional" | "required"; submission?: "auto_send" | "edit" } | null };
}
interface MediaAttachment { generation_type?: string; kind: "media_generation"; output_blocked?: boolean; title?: string | null; [key: string]: unknown }
interface GenericAttachment { kind: string; [key: string]: unknown }
type SharedAttachment = PromptShareAttachment | MediaAttachment | GenericAttachment;
interface SharedPost { attachments: SharedAttachment[]; id: string; preview_image_url?: string | null; text?: string | null }
interface SharedPostStatus { reason?: UnavailableReason; status: "available" | "unavailable" }
interface Identity { accountId?: string | null; authMethod?: string | null; isLoading?: boolean; userId?: string | null }
interface ComposerController {
  eventEmitter?: { emit(event: string): void };
  focus?(): void;
  getPersistedText?(): string;
  setPromptText?(text: string): void;
  view?: { isDestroyed?: boolean };
}
interface AppSharedApi {
  $3?: () => void; FX?: () => void; K2?: () => void; Zh?: () => void; lk?: () => void; lw?: () => void;
  BX(family: unknown, parameter: unknown): unknown; HX<Value>(signal: unknown): Value; I3(): JsxRuntime; LX(scope: unknown): ScopeApi; Y2: unknown; Yh: unknown; e6(): ReactRuntime; n4(): IntlRuntime; pk: unknown;
  Ah: unknown; Ih: unknown; Oh: unknown; Ph: unknown; Rh: unknown; UX: unknown; hy: unknown; kh: unknown;
}
interface AppInitialApi {
  Aet?: () => void; M6t?: () => void; Qgn?: () => void; Ret?: () => void; Rht?: () => void; Wvt?: () => void; cJt?: () => void; oqt?: () => void; pfn?: () => void; ypn?: () => void;
  $en: unknown; CR(post: SharedPost, signal: AbortController): unknown; GIt(scope: ScopeApi, conversationId: string, hints: string[]): void; Kun(): void; Let: unknown; N6t(): Identity; Pe: unknown; yR: unknown; mfn: unknown; ket: unknown; l_n(): { postId?: string }; o_n(): (destination: string, options?: { replace?: boolean }) => void; xpn(scope: ScopeApi, event: unknown, fields: Record<string, unknown>): void;
  aHt(scope: ScopeApi, input: { conversation: null; conversationId: string; post: SharedPost }): void; gln(conversationId: string): string; f7: { MainContentLayout: unknown; RightPanelOutlet: unknown; RightPanelTabs: unknown }; pnt?: unknown;
}
interface AppPrimaryApi { H: unknown; Oo: unknown; U: unknown; Ui: unknown; Wi?: () => void; au?: () => void; iu?: () => void; ko?: () => void; nt: unknown; rt?: () => void; ru?: unknown; su?: () => void; tu?: unknown }
interface ComposerControllerApi { n?: () => void; t(input: { conversationId: string }): ComposerController }
interface DocumentTitleApi { r?: () => void; t: unknown }
interface RightPanelApi { n?: () => void; t: unknown }
interface ThreadScrollApi { n?: () => void; t: unknown }
interface ConversationPageApi { c?: () => void; d: unknown; f: unknown; l: unknown; t: unknown; u?: () => void }
interface BrowserDisclaimerApi { n?: () => void; t: unknown }
interface ViewerApi { c?: () => void; l: unknown; s: unknown; u(scope: ScopeApi, item: unknown): Promise<unknown> }
interface ImageValidationApi { a?: () => void; i(post: SharedPost): unknown; r(post: SharedPost, session: unknown): Array<{ id?: string }> }
interface AnalyticsApi { i?: () => void; r(scope: ScopeApi, input: Record<string, unknown>, persistedLength?: number): void; t?: unknown }
interface ImageHomeApi { a: unknown; o?: () => void; r?: () => void; t: unknown }

const shared = appSharedChunk as unknown as AppSharedApi;
const initial = appInitialChunk as unknown as AppInitialApi;
const primary = appPrimaryChunk as unknown as AppPrimaryApi;
const composerApi = composerControllerChunk as unknown as ComposerControllerApi;
const titleApi = documentTitleChunk as unknown as DocumentTitleApi;
const rightPanel = rightPanelChunk as unknown as RightPanelApi;
const threadScroll = threadScrollChunk as unknown as ThreadScrollApi;
const conversationPage = conversationPageChunk as unknown as ConversationPageApi;
const browserDisclaimer = browserDisclaimerChunk as unknown as BrowserDisclaimerApi;
const viewer = viewerChunk as unknown as ViewerApi;
const imageValidation = imageValidationChunk as unknown as ImageValidationApi;
const analytics = analyticsChunk as unknown as AnalyticsApi;
const imageHome = imageHomeChunk as unknown as ImageHomeApi;

let jsx: JsxRuntime;
let React: ReactRuntime;
const SHARE_VIEW_EVENT = { $type: "protobuf_analytics_events.v1.ChatgptSharePostPageViewed" } as const;

function callInitializer(value: unknown): void { if (typeof value === "function") value(); }
function firstAttachment(post: SharedPost | null | undefined): SharedAttachment | undefined { return post?.attachments[0]; }
function isPromptShare(attachment: SharedAttachment | undefined): attachment is PromptShareAttachment { return attachment?.kind === "prompt_share"; }
function isImageAttachment(attachment: SharedAttachment): attachment is MediaAttachment { return attachment.kind === "media_generation" && attachment.generation_type === "image_gen" && attachment.output_blocked !== true; }
function postTitle(post: SharedPost | null, intl: IntlRuntime): string {
  if (!post) return intl.formatMessage({ id: "chatgptConversations.sharedPost.privateDocumentTitle", defaultMessage: "ChatGPT - Privately Shared Content" });
  const attachment = firstAttachment(post);
  const title = isPromptShare(attachment) ? attachment.prompt_share.content.title : post.text?.trim() || (attachment?.kind === "media_generation" ? String(attachment.title ?? "").trim() : "");
  return title ? intl.formatMessage({ id: "chatgptConversations.sharedPost.documentTitle", defaultMessage: "ChatGPT - {title}" }, { title }) : intl.formatMessage({ id: "chatgptConversations.sharedPost.untitledDocumentTitle", defaultMessage: "ChatGPT - Shared Content" });
}
function trackShareView(scope: ScopeApi, post: SharedPost): void {
  const attachment = firstAttachment(post);
  initial.xpn(scope, SHARE_VIEW_EVENT, { postId: post.id, primaryAttachmentType: attachment?.kind, referrer: typeof document === "undefined" ? undefined : document.referrer || undefined });
}

function ContentUnavailableDialog(props: { reason: "general" | "workspace" }): unknown {
  const navigate = initial.o_n();
  const goHome = (): void => navigate("/");
  const subtitle = props.reason === "workspace" ? "This content was shared from a workspace you don’t have access to. Ask the owner to invite you if you’d like to view it." : "This share link is not available because it doesn’t exist or you don’t have access to it.";
  return jsx.jsx(shared.Ih, { open: true, onOpenChange: (open: boolean) => { if (!open) goHome(); }, size: "compact", variant: "chatgpt", children: jsx.jsxs(shared.Oh, { as: "form", variant: "chatgpt", onSubmit: (event: { preventDefault(): void }) => { event.preventDefault(); goHome(); }, children: [
    jsx.jsx(shared.Ah, { title: "Content Unavailable", subtitle }),
    jsx.jsx(shared.kh, { children: jsx.jsx(shared.Yh, { className: "w-full", type: "submit", color: "primary", size: "large", children: "OK" }) }),
  ] }) });
}

function PromptSharePreview(props: { disabled: boolean; fallbackImageUrl?: string | null; isLoggedIn: boolean; onTryPrompt(withImage: boolean): void; promptShare: PromptShareAttachment["prompt_share"] }): unknown {
  const { content, recipient_action: action } = props.promptShare;
  const imageUrl = content.generated_image?.image_url ?? props.fallbackImageUrl;
  const requiresImage = action?.image_input === "required";
  const autoSend = action?.submission === "auto_send";
  const primaryLabel = !props.isLoggedIn ? "Log in to try it" : requiresImage && autoSend ? "Try it with an image" : requiresImage ? "Edit prompt and add an image" : "Try this prompt";
  const secondary = props.isLoggedIn && action?.image_input === "optional" && autoSend ? jsx.jsx(shared.Yh, { color: "secondary", size: "large", radius: "full", disabled: props.disabled, onClick: () => props.onTryPrompt(true), children: "Try with an image" }) : null;
  return jsx.jsxs(jsx.Fragment, { children: [
    props.isLoggedIn ? jsx.jsxs("nav", { "aria-label": "Images breadcrumb", children: [jsx.jsx(conversationPage.l, { to: "/images", children: "Images" }), "/", content.title] }) : null,
    jsx.jsxs("section", { className: "shared-prompt-preview", children: [
      imageUrl ? jsx.jsx("img", { alt: content.title, fetchPriority: "high", src: imageUrl }) : null,
      jsx.jsx("h1", { children: content.title }),
      jsx.jsx("textarea", { "aria-label": content.title, readOnly: true, rows: 2, value: content.prompt }),
      jsx.jsxs("div", { children: [jsx.jsx(shared.Yh, { color: "primary", size: "large", radius: "full", disabled: props.disabled, onClick: () => props.onTryPrompt(false), children: primaryLabel }), secondary] }),
      jsx.jsx("p", { children: content.generated_image?.prompt_match === "differs_from_shared_prompt" ? "The same prompt may produce different images. This prompt was altered before sharing." : "The same prompt may produce different images." }),
    ] }),
  ] });
}

function PromptShareContent(props: { conversationId: string; post: SharedPost; attachment: PromptShareAttachment }): unknown {
  const scope = shared.LX(initial.$en);
  const identity = initial.N6t();
  const navigate = initial.o_n();
  const controller = composerApi.t({ conversationId: props.conversationId });
  const abortRef = React.useRef(new AbortController());
  const [showPreview, setShowPreview] = React.useState(true);
  const [dropTarget, setDropTarget] = React.useState<{ canOpenImagePicker?: boolean; disabled?: boolean; onFilesDropped?(files: File[]): void; openFileDialog?(multiple?: boolean): void } | null>(null);
  React.useEffect(() => () => abortRef.current.abort(), []);
  const action = props.attachment.prompt_share.recipient_action;
  const isLoggedIn = identity.authMethod === "chatgpt";
  const continueShare = (): boolean => {
    if (!isLoggedIn) { initial.Kun(); return false; }
    initial.aHt(scope, { conversation: null, conversationId: props.conversationId, post: props.post });
    initial.GIt(scope, props.conversationId, ["picture_v2"]);
    controller.setPromptText?.(props.attachment.prompt_share.content.prompt);
    return true;
  };
  const submit = (): void => { if (!abortRef.current.signal.aborted && controller.view?.isDestroyed !== true) controller.eventEmitter?.emit("submit"); };
  const tryPrompt = (withImage: boolean): void => {
    if (!continueShare()) return;
    analytics.r(scope, { promptId: props.attachment.prompt_share.prompt_share_id, surface: imageHome.a });
    const autoSend = action?.submission === "auto_send";
    const wantsImage = action?.image_input === "required" || withImage;
    if (autoSend && wantsImage) dropTarget?.openFileDialog?.(true);
    else if (autoSend) submit();
    else { setShowPreview(false); controller.focus?.(); }
  };
  const composer = isLoggedIn ? jsx.jsx(primary.Oo, { children: jsx.jsx(primary.Ui, { autoPrepare: false, composerController: controller, conversationId: props.conversationId, disableAutoFocus: true, disableDraftPrepare: true, hideModelPicker: true, requiredSystemHints: ["picture_v2"], signal: abortRef.current.signal, onFileDropTargetChange: setDropTarget, onFilesSelected: () => setShowPreview(false), onSubmitAccepted: (conversationId: string) => navigate(initial.gln(conversationId)), placeholder: "Describe an image", showError: true }) }) : null;
  const preview = showPreview ? jsx.jsx(PromptSharePreview, { promptShare: props.attachment.prompt_share, fallbackImageUrl: props.post.preview_image_url, isLoggedIn, disabled: isLoggedIn && (dropTarget == null || (action?.submission === "auto_send" && (action?.image_input === "optional" || action?.image_input === "required") && !dropTarget.canOpenImagePicker)), onTryPrompt: tryPrompt }) : null;
  return jsx.jsxs(jsx.Fragment, { children: [jsx.jsx(primary.H, { layout: "custom-titlebar" }), jsx.jsx(primary.nt, { children: jsx.jsx(threadScroll.t, { scrollOrigin: "top", children: jsx.jsx(viewer.l, { disabled: !showPreview && (dropTarget?.disabled ?? true), onFilesDropped: (files: File[]) => { const images = files.filter((file) => file.type.startsWith("image/")); if (images.length > 0 && continueShare()) dropTarget?.onFilesDropped?.(images); }, children: jsx.jsxs("div", { children: [preview, jsx.jsx("div", { hidden: showPreview, children: composer })] }) }) }) })] });
}

function PromptShareScope(props: { conversationId: string; post: SharedPost; attachment: PromptShareAttachment }): unknown {
  return jsx.jsx(shared.UX, { scope: initial.$en, value: { kind: "chatgpt", conversationId: props.conversationId, browserTabMentionConversationId: null, routeConversationId: null }, children: jsx.jsx(PromptShareContent, props) });
}

function ImagePostLayout(props: { conversationId: string; post: SharedPost; attachments: MediaAttachment[]; loggedIn: boolean }): unknown {
  const footer = props.loggedIn ? jsx.jsx(primary.Oo, { children: jsx.jsx(primary.Ui, { autoPrepare: false, composerController: composerApi.t({ conversationId: props.conversationId }), conversationId: props.conversationId, disableDraftPrepare: true, hideModelPicker: true, showError: true }) }) : null;
  return jsx.jsxs(jsx.Fragment, { children: [
    jsx.jsx(conversationPage.c, {}),
    jsx.jsx(initial.f7.RightPanelOutlet, { children: jsx.jsx(initial.f7.RightPanelTabs, {}) }),
    jsx.jsx(primary.nt, { children: jsx.jsx(threadScroll.t, { footer, threadEndContent: jsx.jsx(browserDisclaimer.t, { conversationId: props.conversationId, hasUserMessage: true, isTemporaryChat: false, regulatedConnectorKindOverride: null }), children: jsx.jsxs("div", { children: [jsx.jsx(conversationPage.d, {}), jsx.jsx(viewer.s, { conversationId: props.conversationId, attachments: props.attachments })] }) }) }),
  ] });
}

function SharedPostBody(props: { identity: Identity; postId: string }): unknown {
  const scope = shared.LX(initial.$en);
  const intl = shared.n4();
  const navigate = initial.o_n();
  const viewedPostRef = React.useRef<string | null>(null);
  const status = shared.BX(initial.Pe, props.identity) as { data?: SharedPostStatus; isPending?: boolean };
  const post = shared.BX(initial.yR, props.identity) as SharedPost | null;
  const promptShareUnavailable = shared.BX(initial.mfn, "1939400492") === true;
  const first = firstAttachment(post);
  const imageAttachments = post?.attachments.filter(isImageAttachment) ?? [];
  const hasImage = post?.attachments.some((attachment) => attachment.kind === "media_generation" && attachment.generation_type === "image_gen") ?? false;
  const abortRef = React.useRef(new AbortController());
  const conversation = post == null ? null : initial.CR(post, abortRef.current);
  React.useEffect(() => () => abortRef.current.abort(), []);
  React.useEffect(() => { if (post && viewedPostRef.current !== post.id) { viewedPostRef.current = post.id; trackShareView(scope, post); } }, [post?.id]);
  React.useEffect(() => {
    const reason = status.data?.status === "unavailable" ? status.data.reason : isPromptShare(first) && !first.prompt_share.content.prompt.trim() ? "not_found" : null;
    if (!reason || reason === "workspace") return;
    const toast = scope.get(shared.pk) as ToastRuntime;
    if (reason === "deleted") toast.warning(intl.formatMessage({ id: "chatgptConversations.sharedPost.deleted", defaultMessage: "This shared message was deleted and is no longer available." }), { id: "shared-post-deleted", duration: 5 });
    else toast.info(intl.formatMessage({ id: "globalToasts.sharedConversationInaccessible", defaultMessage: props.identity.authMethod === "chatgpt" ? "You don’t have access to this conversation. You may need to switch accounts." : "Log in to view this conversation." }));
    navigate("/", { replace: true });
  }, [status.data?.status, status.data?.reason, post?.id, props.identity.authMethod]);

  if (props.identity.isLoading || status.isPending) return jsx.jsx(initial.Let, { fillParent: true, debugName: "SharedContent" });
  if (status.data?.status === "unavailable") return status.data.reason === "workspace" ? jsx.jsx(ContentUnavailableDialog, { reason: "workspace" }) : jsx.jsx(initial.Let, { fillParent: true, debugName: "SharedContentRedirect" });
  if (isPromptShare(first) && promptShareUnavailable) return jsx.jsx(ContentUnavailableDialog, { reason: "general" });
  if (post && isPromptShare(first) && first.prompt_share.content.prompt.trim()) return jsx.jsxs(jsx.Fragment, { children: [jsx.jsx(conversationPage.c, {}), jsx.jsx(PromptShareScope, { conversationId: props.postId, post, attachment: first })] });
  if (post && conversation != null) return jsx.jsx(conversationPage.t, { conversationId: props.postId, isTemporaryChat: false, sharedConversationId: null, conversation });
  if (post && imageAttachments.length > 0) return jsx.jsx(ImagePostLayout, { conversationId: props.postId, post, attachments: imageAttachments, loggedIn: props.identity.authMethod === "chatgpt" });
  const title = hasImage ? "This shared image is unavailable" : "This shared content is unavailable";
  return jsx.jsx(initial.ket, { className: "select-none", layout: "page", title, actions: jsx.jsx(shared.Yh, { color: "secondary", size: "large", onClick: () => navigate("/"), children: "Go to ChatGPT" }) });
}

function ChatGptSharedPostPage(): unknown {
  const intl = shared.n4();
  const { postId } = initial.l_n();
  const identity = initial.N6t();
  const post = shared.BX(initial.yR, identity) as SharedPost | null;
  const title = postTitle(post, intl);
  const pageKey = `${postId ?? ""}:${identity.userId ?? ""}:${identity.accountId ?? ""}`;
  return jsx.jsxs(jsx.Fragment, { children: [jsx.jsx(titleApi.t, { title }), jsx.jsx(SharedPostBody, { identity, postId: postId ?? "" }, pageKey)] });
}

function initializeChatGptSharedPostPage(): void {
  for (const initializer of [shared.$3, shared.FX, shared.K2, shared.Zh, shared.lk, shared.lw, initial.Aet, initial.M6t, initial.Qgn, initial.Ret, initial.Rht, initial.Wvt, initial.cJt, initial.oqt, initial.pfn, initial.ypn, primary.Wi, primary.au, primary.iu, primary.ko, primary.rt, primary.su, composerApi.n, titleApi.r, rightPanel.n, threadScroll.n, conversationPage.c, conversationPage.u, browserDisclaimer.n, viewer.c, imageValidation.a, analytics.i, imageHome.o, imageHome.r]) callInitializer(initializer);
  React = shared.e6();
  jsx = shared.I3();
}

initializeChatGptSharedPostPage();
export { ChatGptSharedPostPage };
