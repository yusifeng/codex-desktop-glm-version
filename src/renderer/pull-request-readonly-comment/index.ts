import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, e6 as getReactRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/file-diff-alt";
import "@rchunk/diff-comment-card";
const jsx = getJsxRuntime();
function githubAvatarUrl(login: string | null | undefined, size: number, hostname = "github.com"): string | null { const normalized = login?.trim(); return !normalized || /\s/.test(normalized) ? null : `https://${hostname}/${encodeURIComponent(normalized)}.png?size=${size}`; }
function AvatarSlot({ children }: { children?: unknown }): unknown { return jsx.jsx("span", { className: "shrink-0", children }); }
function PullRequestComment({ authorAvatarUrl, authorLogin, body, createdAt, url }: { authorAvatarUrl?: string; authorLogin?: string; body?: string; createdAt?: string; url?: string }): unknown { const avatar = authorAvatarUrl ?? githubAvatarUrl(authorLogin, 48); return jsx.jsxs("article", { children: [jsx.jsxs("header", { children: [avatar ? jsx.jsx("img", { alt: `${authorLogin ?? "Unknown author"} avatar`, src: avatar }) : jsx.jsx(AvatarSlot, { children: (authorLogin ?? "?").slice(0, 1).toUpperCase() }), jsx.jsx("strong", { children: authorLogin ?? "Unknown author" }), jsx.jsx("time", { children: createdAt })] }), jsx.jsx("p", { children: body ?? "" }), url ? jsx.jsx("a", { href: url, children: "View on provider" }) : null] }); }
function ReadonlyReviewComment({ comment, filePath, line, side = "right" }: { comment: Record<string, unknown>; filePath?: string; line?: number; side?: string }): unknown { return jsx.jsxs("section", { "data-readonly-review-comment": true, children: [filePath ? jsx.jsx("header", { children: `${filePath}${line == null ? "" : ` · ${side === "left" ? "L" : "R"}${line}`}` }) : null, jsx.jsx(PullRequestComment, comment)] }); }
function initializeAvatarSlot(): void {}
function initializeReadonlyCommentRuntime(): void { getReactRuntime(); }
function initializePullRequestReadonlyComment(): void { initializeAvatarSlot(); initializeReadonlyCommentRuntime(); }
export { initializeAvatarSlot as a, AvatarSlot as i, ReadonlyReviewComment as n, githubAvatarUrl as o, initializePullRequestReadonlyComment as r, initializeReadonlyCommentRuntime as s, PullRequestComment as t };
