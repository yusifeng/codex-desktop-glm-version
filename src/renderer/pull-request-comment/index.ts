import "@rchunk/rolldown-runtime";
import {
  $O as queryDurations,
  FX as initializeSignalRuntime,
  I3 as jsxRuntime,
  Ih as Dialog,
  LX as useScope,
  QI as initializeQueryRuntime,
  QX as createQueryFamily,
  Y2 as FormattedMessage,
  Yh as Button,
  ZI as appScope,
  e6 as ReactRuntime,
  iL as useMutation,
  oZ as createSignalFamily,
  pZ as createSignal,
} from "@rchunk/app-shared";
import {
  $en as routeScope,
  $ln as createQueryKey,
  i5t as initializePullRequestApi,
  itn as initializeRouteState,
  t5t as stablePullRequestKey,
} from "@rchunk/app-initial";
import {
  af as initializePullRequestMarkdown,
  if as PullRequestMarkdown,
} from "@rchunk/app-primary";
import {
  a as initializeReadonlyComment,
  i as AvatarFallback,
  n as PullRequestReadonlyComment,
  o as getGitHubAvatarUrl,
  r as initializeCommentAvatar,
} from "@rchunk/pull-request-readonly-comment";
import {
  i as editCommentMutation,
  r as createCommentMutation,
  s as resolveReviewThreadMutation,
  t as initializePullRequestActions,
} from "@rchunk/pull-request-actions";
import {
  n as initializeCodeReviewNavigation,
  r as navigateToReviewComment,
} from "@rchunk/pull-request-code-review-navigation-core";
import {
  c as initializePullRequestDetailModel,
  i as pullRequestAccountSignal,
  l as canEditPullRequestSignal,
  s as initializePullRequestSignals,
} from "@rchunk/pull-request-detail-model";
import {
  n as initializeArrowCurvedRight,
  t as ArrowCurvedRight,
} from "@rchunk/arrow-curved-right";

interface ScopeSetter {
  set(signal: unknown, keyOrValue: unknown, value?: unknown): void;
}
interface PullRequestAccount extends Record<string, unknown> {
  hostname?: string;
  login: string;
}
interface PullRequestComment extends Record<string, unknown> {
  authorLogin: string;
  body?: string;
  nodeId: string;
  path?: string | null;
  replies?: PullRequestComment[];
  reviewThreadId?: string | null;
}
interface MentionRequest extends Record<string, unknown> { query: string; scope?: string; }

let commentFilterSignal: unknown;
let commentStateSignal: unknown;
let activeCommentSignal: unknown;
let commentDraftSignal: unknown;
let commentDisplayModeSignal: unknown;

function setCommentFilter(scope: ScopeSetter, pullRequest: unknown, value: unknown): void {
  scope.set(commentFilterSignal, stablePullRequestKey(pullRequest), value);
}
function setCommentState(scope: ScopeSetter, pullRequest: unknown, value: unknown): void {
  scope.set(commentStateSignal, stablePullRequestKey(pullRequest), value);
}
function setActiveComment(scope: ScopeSetter, pullRequest: unknown, value: unknown): void {
  scope.set(activeCommentSignal, stablePullRequestKey(pullRequest), value);
}
function setCommentDraft(scope: ScopeSetter, pullRequest: unknown, value: unknown): void {
  scope.set(commentDraftSignal, stablePullRequestKey(pullRequest), value);
}
function setCommentDisplayMode(scope: ScopeSetter, value: unknown): void {
  scope.set(commentDisplayModeSignal, value);
}

let initializedState = false;
function initializePullRequestCommentState(): void {
  if (initializedState) return;
  initializedState = true;
  initializeSignalRuntime();
  initializeQueryRuntime();
  initializeRouteState();
  initializePullRequestApi();
  commentFilterSignal = createSignalFamily(appScope, () => "all");
  commentStateSignal = createSignalFamily(appScope, () => "open");
  activeCommentSignal = createSignalFamily(appScope, () => null);
  commentDraftSignal = createSignalFamily(appScope, () => "");
  commentDisplayModeSignal = createSignal(routeScope, () => "summary");
}

function isGitHubAttachmentUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (
      (url.hostname === "github.com" && url.pathname.startsWith("/user-attachments/assets/")) ||
      url.hostname === "user-images.githubusercontent.com" ||
      url.hostname === "private-user-images.githubusercontent.com"
    );
  } catch { return false; }
}

function isGitHubVideoUrl(value: string): boolean {
  if (!isGitHubAttachmentUrl(value)) return false;
  const url = new URL(value);
  return (url.hostname === "github.com" && url.pathname.startsWith("/user-attachments/assets/")) || /\.(?:mov|mp4|webm)$/iu.test(url.pathname);
}

function createMediaDirective(input: {
  alt: string; block: boolean; mediaKind: "image" | "video"; raw: string;
  title?: string | null; url: string;
}): Record<string, unknown> {
  return {
    type: "codexDirective",
    raw: input.raw,
    name: "pull-request-media",
    attributes: {
      alt: input.alt,
      kind: input.mediaKind,
      src: input.url,
      ...(input.title == null ? {} : { title: input.title }),
    },
    block: input.block,
  };
}

const pullRequestMediaExtension = {
  extensions: [{
    name: "pullRequestMedia",
    level: "block",
    tokenizer(source: string) {
      const match = source.match(/https:\/\/(?:github\.com\/user-attachments\/assets\/|(?:private-)?user-images\.githubusercontent\.com\/)[^\s)]+/iu)?.[0];
      if (match == null || !isGitHubAttachmentUrl(match)) return undefined;
      return createMediaDirective({ alt: "", block: true, mediaKind: isGitHubVideoUrl(match) ? "video" : "image", raw: match, url: match });
    },
  }],
};

function PullRequestCommentMarkdown(props: Record<string, unknown> & {
  account?: PullRequestAccount | null;
  children?: unknown;
  directives?: Record<string, unknown>;
  extensions?: unknown[];
}): unknown {
  const { account, children, directives, extensions, ...rest } = props;
  return jsxRuntime().jsx(PullRequestMarkdown, {
    ...rest,
    directives,
    extensions: account == null ? extensions : [pullRequestMediaExtension, ...(extensions ?? [])],
    children,
  });
}

let mentionQuery: ReturnType<typeof createQueryFamily>;
let initializedMentionQuery = false;
function initializeMentionQuery(): void {
  if (initializedMentionQuery) return;
  initializedMentionQuery = true;
  initializeSignalRuntime(); initializeQueryRuntime(); initializePullRequestApi();
  mentionQuery = createQueryFamily(appScope, ({ request, source }: { request: MentionRequest; source?: string }) => ({
    enabled: request.scope === "mentions" || request.query.length > 0,
    queryKey: createQueryKey("gh-user-search", request),
    queryFn: async () => ({ request, source, users: [] }),
    retry: false,
    staleTime: queryDurations.ONE_MINUTE,
  }));
}

function parseMentionAtCursor(input: {
  selectionEnd: number;
  selectionStart: number;
  value: string;
}): { from: number; query: string; to: number } | null {
  const { selectionEnd, selectionStart, value } = input;
  if (selectionStart !== selectionEnd) return null;
  const match = /(^|[^A-Za-z0-9_-])@([A-Za-z0-9_-]*)$/u.exec(value.slice(0, selectionStart));
  if (match == null) return null;
  const query = match[2] ?? "";
  const suffix = /^[A-Za-z0-9_-]*/u.exec(value.slice(selectionStart))?.[0] ?? "";
  return { from: selectionStart - query.length - 1, query, to: selectionStart + suffix.length };
}

function PullRequestCommentComposer(props: {
  autoFocus?: boolean;
  initialBody?: string;
  isEditing?: boolean;
  isPending?: boolean;
  onCancel?(): void;
  onDirtyChange?(dirty: boolean): void;
  onSubmit(body: string): Promise<void> | void;
  replyToAuthorLogin?: string;
}): unknown {
  const [body, setBody] = ReactRuntime.useState(props.initialBody ?? "");
  const [error, setError] = ReactRuntime.useState<string | null>(null);
  const trimmed = body.trim();
  const handleSubmit = async (event: { preventDefault(): void }): Promise<void> => {
    event.preventDefault();
    if (trimmed.length === 0 || props.isPending) return;
    setError(null);
    try { await props.onSubmit(trimmed); }
    catch (submitError) { setError(String(submitError)); }
  };
  return jsxRuntime().jsxs("form", {
    className: "flex w-full flex-col gap-2",
    onSubmit: handleSubmit,
    children: [
      jsxRuntime().jsx("textarea", {
        autoFocus: props.autoFocus,
        disabled: props.isPending,
        value: body,
        placeholder: props.replyToAuthorLogin ? `Reply to @${props.replyToAuthorLogin}` : "Leave a comment",
        onChange: (event: { target: { value: string } }) => {
          setBody(event.target.value); props.onDirtyChange?.(event.target.value.length > 0);
        },
      }),
      jsxRuntime().jsxs("div", { children: [
        props.onCancel == null ? null : jsxRuntime().jsx(Button, { type: "button", onClick: props.onCancel, children: "Cancel" }),
        jsxRuntime().jsx(Button, { type: "submit", disabled: trimmed.length === 0 || props.isPending, loading: props.isPending, children: props.isEditing ? "Save" : "Comment" }),
      ] }),
      error == null ? null : jsxRuntime().jsx("div", { role: "alert", children: error }),
    ],
  });
}

function PullRequestCommentMutationForm(props: Record<string, unknown> & {
  account: PullRequestAccount;
  editTarget?: PullRequestComment | null;
  initialBody?: string;
  onCancel?(): void;
  onDirtyChange?(dirty: boolean): void;
  onSuccess?(): void;
  pullRequest: unknown;
}): unknown {
  const mutationDefinition = props.editTarget == null ? createCommentMutation : editCommentMutation;
  const mutation = useMutation({
    mutationFn: (body: string) => Promise.resolve({ body, editTarget: props.editTarget, pullRequest: props.pullRequest }),
    onSuccess: props.onSuccess,
  });
  void mutationDefinition;
  return jsxRuntime().jsx(PullRequestCommentComposer, {
    initialBody: props.initialBody,
    isEditing: props.editTarget != null,
    isPending: mutation.isPending,
    onCancel: props.onCancel,
    onDirtyChange: props.onDirtyChange,
    onSubmit: (body: string) => mutation.mutateAsync(body),
  });
}

function ReviewThreadResolutionButton(props: {
  account: PullRequestAccount;
  action: "resolve" | "unresolve";
  onResolved?(): void;
  pullRequest: unknown;
  reviewThreadId: string;
}): unknown {
  const mutation = useMutation({ mutationFn: async () => props.action, onSuccess: props.onResolved });
  void resolveReviewThreadMutation;
  return jsxRuntime().jsx(Button, {
    disabled: mutation.isPending,
    loading: mutation.isPending,
    onClick: () => mutation.mutate(),
    children: props.action === "resolve" ? "Resolve conversation" : "Unresolve conversation",
  });
}

function PullRequestCommentDialog(props: Record<string, unknown> & { onClose(): void }): unknown {
  return jsxRuntime().jsx(Dialog, {
    open: true,
    showDialogClose: false,
    onOpenChange: (open: boolean) => { if (!open) props.onClose(); },
    children: jsxRuntime().jsx(PullRequestCommentMutationForm, props),
  });
}

function PullRequestCommentCard(props: {
  account?: PullRequestAccount | null;
  comment: PullRequestComment;
  inline?: boolean;
  pullRequest?: unknown;
}): unknown {
  const { account, comment } = props;
  const avatar = account == null ? null : getGitHubAvatarUrl(comment.authorLogin, 48, account.hostname);
  return jsxRuntime().jsxs("article", {
    "data-comment-id": comment.nodeId,
    children: [
      jsxRuntime().jsx(AvatarFallback, { children: avatar == null ? comment.authorLogin.slice(0, 1).toUpperCase() : jsxRuntime().jsx("img", { src: avatar, alt: comment.authorLogin }) }),
      jsxRuntime().jsx(PullRequestReadonlyComment, { comment }),
      comment.reviewThreadId == null ? null : jsxRuntime().jsx(Button, { onClick: () => navigateToReviewComment(comment.reviewThreadId), children: jsxRuntime().jsx(ArrowCurvedRight, {}) }),
    ],
  });
}

let initializedCommentActions = false;
function initializePullRequestCommentActions(): void {
  if (initializedCommentActions) return;
  initializedCommentActions = true;
  initializePullRequestActions(); initializeReadonlyComment(); initializeCommentAvatar(); initializeCodeReviewNavigation();
  initializePullRequestDetailModel(); initializePullRequestSignals(); initializeArrowCurvedRight();
}
let initializedComposer = false;
function initializePullRequestCommentComposer(): void {
  if (initializedComposer) return;
  initializedComposer = true; initializePullRequestCommentActions(); initializeMentionQuery();
}
let initializedMarkdown = false;
function initializePullRequestCommentMarkdown(): void {
  if (initializedMarkdown) return;
  initializedMarkdown = true; initializePullRequestMarkdown();
}
let initialized = false;
function initializePullRequestComment(): void {
  if (initialized) return;
  initialized = true;
  initializePullRequestCommentState(); initializePullRequestCommentMarkdown(); initializePullRequestCommentActions(); initializePullRequestCommentComposer();
  void useScope; void pullRequestAccountSignal; void canEditPullRequestSignal;
}

export {
  setCommentDraft as S,
  commentDisplayModeSignal as _,
  initializePullRequestCommentActions as a,
  setCommentState as b,
  mentionQuery as c,
  initializePullRequestCommentMarkdown as d,
  initializePullRequestCommentState as f,
  commentDraftSignal as g,
  activeCommentSignal as h,
  ReviewThreadResolutionButton as i,
  initializeMentionQuery as l,
  commentStateSignal as m,
  initializePullRequestComment as n,
  PullRequestCommentComposer as o,
  commentFilterSignal as p,
  PullRequestCommentMutationForm as r,
  initializePullRequestCommentComposer as s,
  PullRequestCommentCard as t,
  PullRequestCommentMarkdown as u,
  setCommentDisplayMode as v,
  setActiveComment as x,
  setCommentFilter as y,
};
