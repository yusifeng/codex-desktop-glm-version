import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/commit-icon";
import "@rchunk/detail-page";
import "@rchunk/detail-section-state";
import "@rchunk/git-action-review-state";
import "@rchunk/open-pull-request-fix-automation-panel-core";
import "@rchunk/open-thread-pull-request-code-tab";
import "@rchunk/pull-request-actions";
import "@rchunk/pull-request-checks-summary";
import "@rchunk/pull-request-code-review";
import "@rchunk/pull-request-comment";
import "@rchunk/pull-request-detail-model";
import "@rchunk/pull-request-error-description";
import "@rchunk/pull-request-fix-automation";
import "@rchunk/pull-request-fix-workflow";
import "@rchunk/pull-request-readonly-comment";
import "@rchunk/pull-request-revision-queries-core";
import "@rchunk/pull-request-status-label";

interface PullRequestCheck { id?: string; link?: string | null; name: string; status: "failing" | "neutral" | "passing" | "pending" | "skipped" | "unknown" }
interface PullRequestDetail { additions?: number; baseBranch?: string | null; canMerge?: boolean; checks?: PullRequestCheck[]; ciStatus?: string; deletions?: number; description?: string | null; headBranch?: string | null; isAuthor?: boolean; isDraft?: boolean; mergeBlocker?: string | null; number?: number; repo?: string; state?: string; title?: string; url?: string }
interface PullRequestPanelProps { detail?: PullRequestDetail | null; error?: unknown; isLoading?: boolean; onRetry?(): void; request?: { pullRequest?: { number?: number } }; summaryOnly?: boolean }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
const s = { key: "pull-request-repository-compatibility" } as const;
function statusLabel(status: PullRequestCheck["status"]): string { return ({ failing: "Failed", neutral: "Neutral", passing: "Passed", pending: "In progress", skipped: "Skipped", unknown: "Unknown" } as const)[status]; }
function S({ checks = [], onFixCheck, onRemoveCheck }: { checks?: PullRequestCheck[]; onFixCheck?(check: PullRequestCheck): void; onRemoveCheck?(check: PullRequestCheck): void }): unknown { const ordered = [...checks].sort((left, right) => ["failing", "pending", "neutral", "skipped", "unknown", "passing"].indexOf(left.status) - ["failing", "pending", "neutral", "skipped", "unknown", "passing"].indexOf(right.status)); return jsx().jsx("ul", { "aria-label": "Checks", children: ordered.map((check, index) => jsx().jsxs("li", { children: [check.name, ` · ${statusLabel(check.status)}`, check.status === "failing" ? jsx().jsx("button", { onClick: () => check.id == null ? onFixCheck?.(check) : onRemoveCheck?.(check), type: "button", children: check.id == null ? "Fix" : "Remove" }) : null] }, check.id ?? `${check.name}:${index}`)) }); }
function descriptionSection({ body = null, editing = null, error = null, loading = false }: { body?: string | null; editing?: { draft: string; onChange?(value: string): void; onSave?(): void }; error?: unknown; loading?: boolean }): unknown { if (error != null) return errorBox({ description: error }); if (loading) return loadingValue(); if (editing != null) return jsx().jsxs("form", { "aria-label": "Description editor", onSubmit: (event: { preventDefault(): void }) => { event.preventDefault(); editing.onSave?.(); }, children: [jsx().jsx("textarea", { value: editing.draft, onChange: (event: { currentTarget: { value: string } }) => editing.onChange?.(event.currentTarget.value) }), jsx().jsx("button", { type: "submit", children: "Save" })] }); return jsx().jsx("section", { "aria-label": "Description", children: body?.trim() || "No description provided" }); }
function errorBox({ description }: { description?: unknown }): unknown { return jsx().jsx("div", { role: "alert", children: description == null ? "Couldn’t load this pull request section" : String(description) }); }
function loadingValue(): unknown { return jsx().jsx("span", { role: "status", children: "Loading…" }); }
function t({ error = null, isLoading = false, onRetry }: PullRequestPanelProps): unknown { return isLoading ? jsx().jsx("div", { role: "status", children: "Loading pull request details" }) : jsx().jsxs("section", { children: [jsx().jsx("h2", { children: "Pull request details are unavailable" }), error == null ? null : errorBox({ description: error }), jsx().jsx("button", { onClick: onRetry, type: "button", children: "Try again" })] }); }
function n({ detail = null, error = null, isLoading = false, onRetry, summaryOnly = false }: PullRequestPanelProps): unknown { if (isLoading || detail == null) return t({ error, isLoading, onRetry }); return jsx().jsxs("article", { "aria-label": detail.title ?? "Pull request", children: [jsx().jsx("h1", { children: detail.title ?? `Pull request #${detail.number ?? ""}` }), jsx().jsx("p", { children: `${detail.baseBranch ?? "base"} ← ${detail.headBranch ?? "head"}` }), jsx().jsx("p", { children: `+${detail.additions ?? 0} −${detail.deletions ?? 0}` }), summaryOnly ? null : S({ checks: detail.checks ?? [] }), descriptionSection({ body: detail.description })] }); }
function u(input: { baseBranch?: string | null; conversationId?: string | null; fixDisabledReason?: string | null; hasOpenPr?: boolean | null; headBranch?: string | null; prNumber?: number | null }): string | null { return (input.hasOpenPr === false ? "closed-pr" : input.fixDisabledReason) ?? (input.conversationId == null ? "missing-conversation" : null) ?? (input.baseBranch == null || input.headBranch == null ? "missing-branch-info" : null) ?? (input.prNumber == null ? "missing-pr-info" : null); }
const _ = descriptionSection;
const b = errorBox;
const c = n;
const f = n;
const g = n;
const h = n;
const i = n;
const m = n;
const y = loadingValue;
function C(): void {}
function a(): void {}
function d(): void {}
function l(): void {}
function o(): void {}
function p(): void {}
function r(): void {}
function v(): void {}
function x(): void {}
export { C, S, _, a, b, c, d, f, g, h, i, l, m, n, o, p, r, s, t, u, v, x, y };
