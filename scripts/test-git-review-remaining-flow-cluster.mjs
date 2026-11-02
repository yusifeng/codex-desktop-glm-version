import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__gitReviewRemainingTest = { react: { useState(initial) { return [typeof initial === "function" ? initial() : initial, () => {}]; } }, jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "git-review-remaining-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\/pull-request-detail-query$/ }, () => ({ path: path.join(ROOT, "src/renderer/pull-request-detail-query/index.ts") })); build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__gitReviewRemainingTest.jsx;export const e6=()=>globalThis.__gitReviewRemainingTest.react;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let result; walk(node, value => { if (result == null && predicate(value)) result = value; }); return result; }
function all(node, predicate) { const result = []; walk(node, value => { if (predicate(value)) result.push(value); }); return result; }
function text(node) { const parts = []; const collect = value => { if (typeof value === "string" || typeof value === "number") parts.push(String(value)); else if (value != null && typeof value === "object") { const children = value.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(collect); else collect(children); } }; collect(node); return parts.join(" "); }

// diff-source: 11
const diffSource = await bundle("diff-source");
assert.deepEqual(Object.keys(diffSource), ["i", "n", "r", "t"]);
const files = [{ path: "src/a.ts", hunks: [{ hunkId: "h1", lineStart: 10, lineEnd: 12, lineMapping: "contiguous", text: "hello\nworld hello" }] }];
const visibilityCalls = [];
let fileContainer = null;
const searchSource = diffSource.t({ contextId: "review", getFiles: () => files, scrollAdapter: { getFileContainer: () => fileContainer, async scrollToFile(path) { visibilityCalls.push(path); fileContainer = { querySelector: () => ({ scrollIntoView(options) { visibilityCalls.push(options.block); } }) }; } } });
assert.equal(searchSource.domain, "diff");
const searchResult = await searchSource.search({ domain: "diff", contextId: "review", query: "hello" });
assert.equal(searchResult.totalMatches, 2);
assert.equal(searchResult.matches[0].location.lineStart, 10);
assert.equal(searchResult.matches[1].location.lineStart, 11);
assert.equal(searchResult.isCapped, false);
assert.match(searchResult.matches[0].snippet, /hello/);
assert.equal((await searchSource.search({ domain: "diff", contextId: "review", query: " " })).matches.length, 0);
await searchSource.ensureVisible(searchResult.matches[0].location);
assert.deepEqual(visibilityCalls, ["src/a.ts", "center"]);
const attributes = {};
diffSource.i({ path: "src/a.ts", skipFindHighlight: true })({ setAttribute(name, value) { attributes[name] = value; } });
assert.equal(attributes["data-diff-path"], "src/a.ts");
assert.equal(attributes["data-skip-find-highlight"], "true");

// conversation-diff-comments: 6
const comments = await bundle("conversation-diff-comments");
assert.deepEqual(Object.keys(comments), ["n", "t"]);
let storedComments;
const commentState = comments.n("conversation", { getComments: () => [{ id: "user", text: "User" }], getModelComments: () => [{ id: "model", text: "Model" }, { id: "model", text: "Duplicate" }], setComments(_id, next) { storedComments = next; } });
assert.equal(commentState.comments[0].id, "user");
assert.equal(commentState.modelComments.length, 1);
commentState.setComments([{ id: "next" }]);
assert.equal(storedComments[0].id, "next");
assert.equal(typeof comments.t, "function");
assert.deepEqual({ comments: comments.n("empty").comments, modelComments: comments.n("empty").modelComments }, { comments: [], modelComments: [] });

// auto-review-approval-nudge: 7
const autoReview = await bundle("auto-review-approval-nudge");
assert.deepEqual(Object.keys(autoReview), ["AutoReviewApprovalNudge"]);
const approvalEvents = [];
const approvalUi = autoReview.AutoReviewApprovalNudge({ conversationId: "c", hostId: "h", learnMoreUrl: "https://example.test", onDismiss(input) { approvalEvents.push(["dismiss", input]); }, onEnable(input) { approvalEvents.push(["enable", input]); } });
assert.equal(approvalUi.props["aria-label"], "Enable auto review approvals");
assert.equal(find(approvalUi, node => node.type === "a").props.href, "https://example.test");
assert.equal(find(autoReview.AutoReviewApprovalNudge({ conversationId: "c", hostId: "h" }), node => node.type === "a").props.href, "https://help.openai.com/");
find(approvalUi, node => node.props?.children === "Not now").props.onClick();
assert.equal(approvalEvents[0][0], "dismiss");
await approvalUi.props.onSubmit({ preventDefault() {} });
assert.equal(approvalEvents[1][0], "enable");
assert.deepEqual(approvalEvents[1][1], { conversationId: "c", hostId: "h" });

// editor-diff-page: 7
const editorDiff = await bundle("editor-diff-page");
assert.deepEqual(Object.keys(editorDiff), ["EditorDiffPage"]);
assert.equal(find(editorDiff.EditorDiffPage({ isLoading: false, error: "Offline" }), node => node.props?.role === "alert").props.children, "Offline");
assert.match(text(editorDiff.EditorDiffPage()), /No diff available/);
const encodedDiff = `base64,${Buffer.from("diff --git a/a b/a").toString("base64")}`;
const editorUi = editorDiff.EditorDiffPage({ conversationId: "c", diffContent: encodedDiff, initialViewType: "split", richPreviewEnabled: true });
assert.equal(editorUi.props["data-view-type"], "split");
assert.equal(editorUi.props["data-conversation-id"], "c");
assert.match(text(editorUi), /Rich preview/);
assert.match(text(editorUi), /diff --git/);

// pull-request-route: 7
const route = await bundle("pull-request-route");
assert.deepEqual(Object.keys(route), ["PullRequestsRoute"]);
assert.equal(find(route.PullRequestsRoute({ isLoading: true }), node => node.props?.role === "status").props.children, "Loading pull requests");
let retried = 0;
const routeError = route.PullRequestsRoute({ error: "Offline", onRetry() { retried++; } });
find(routeError, node => node.props?.children === "Try again").props.onClick();
assert.equal(retried, 1);
let selectedPullRequest;
const routeUi = route.PullRequestsRoute({ pullRequests: [{ number: 1, title: "First" }, { number: 2, title: "Second" }], selectedNumber: 2, onSelect(number) { selectedPullRequest = number; } });
assert.equal(all(routeUi, node => node.type === "button").length, 2);
assert.equal(find(routeUi, node => node.props?.["aria-current"] === "page").props.children, "#2 Second");
all(routeUi, node => node.type === "button")[0].props.onClick();
assert.equal(selectedPullRequest, 1);
assert.match(text(route.PullRequestsRoute({})), /Select a pull request/);

// pull-request-tab-content: 5
const workspaceTab = await bundle("pull-request-tab-content");
assert.deepEqual(Object.keys(workspaceTab), ["PullRequestWorkspaceTab"]);
assert.match(text(workspaceTab.PullRequestWorkspaceTab({})), /Loading pull request/);
const workspaceTabUi = workspaceTab.PullRequestWorkspaceTab({ request: { provider: "github", pullRequest: { number: 42, title: "Ship it" } } });
assert.equal(workspaceTabUi.props["data-provider"], "github");
assert.match(text(workspaceTabUi), /Ship it/);
assert.equal(find(workspaceTab.PullRequestWorkspaceTab({ item: { title: "Summary" }, summaryOnly: true }), node => node.props?.role === "tabpanel"), undefined);

// review-file-source-breadcrumb: 11
const breadcrumb = await bundle("review-file-source-breadcrumb");
assert.deepEqual(Object.keys(breadcrumb), ["a", "c", "d", "i", "l", "n", "o", "r", "s", "t", "u"]);
assert.equal(breadcrumb.l(""), 1);
assert.equal(breadcrumb.l("a\r\nb\nc"), 3);
assert.equal(breadcrumb.d(0, 20), 1);
assert.equal(breadcrumb.d(30, 20), 20);
assert.equal(breadcrumb.u("L12", 20), 12);
assert.equal(breadcrumb.u("nope", 20), null);
let selectedPath;
const breadcrumbUi = breadcrumb.t({ path: "/repo/src/app.ts", root: "/repo", line: 8, onSelectPath(path) { selectedPath = path; } });
assert.equal(all(breadcrumbUi, node => node.type === "button").length, 2);
assert.match(text(breadcrumbUi), /app.ts:8/);
all(breadcrumbUi, node => node.type === "button")[0].props.onClick();
assert.equal(selectedPath, "src");
assert.equal(breadcrumb.o({ querySelector: () => null }, 2, 1), false);

// review-file-tree-side-pane: 8
const fileTree = await bundle("review-file-tree-side-pane");
assert.deepEqual(Object.keys(fileTree), ["a", "c", "i", "n", "o", "r", "s", "t"]);
const treeUi = fileTree.t({ activeFilePath: "src/a.ts", files: [{ path: "src/a.ts", comments: 2 }, { path: "test/a.ts", generated: true }], root: "src", roots: ["src", "test"], onSelectFile(path) { selectedPath = path; } });
assert.equal(find(treeUi, node => node.type === "select").props.defaultValue, "src");
assert.equal(all(treeUi, node => node.type === "li").length, 1);
assert.equal(find(treeUi, node => node.props?.["aria-current"] === "page").type, "button");
assert.match(text(treeUi), /2 comments/);
find(treeUi, node => node.props?.["aria-current"] === "page").props.onClick();
assert.equal(selectedPath, "src/a.ts");
assert.deepEqual(fileTree.c({ path: "src/a.ts", comments: [{ id: 1 }] }).commentProps, { path: "src/a.ts", comments: [{ id: 1 }] });
assert.equal(typeof fileTree.n, "function");

// editable-review-file-source-tab-content: 7
const editable = await bundle("editable-review-file-source-tab-content");
assert.deepEqual(Object.keys(editable), ["EditableReviewFileSourceTabContent"]);
assert.match(text(editable.EditableReviewFileSourceTabContent({ isLoading: true })), /Loading file/);
assert.equal(find(editable.EditableReviewFileSourceTabContent({ error: "Denied" }), node => node.props?.role === "alert").props.children, "Denied");
assert.match(text(editable.EditableReviewFileSourceTabContent({})), /Select a file/);
let editedContents;
const editableUi = editable.EditableReviewFileSourceTabContent({ path: "src/a.ts", contents: "old", workspaceRoot: "/repo", onChange(value) { editedContents = value; } });
assert.match(text(editableUi), /\/repo\/src\/a.ts/);
find(editableUi, node => node.type === "textarea").props.onChange({ currentTarget: { value: "new" } });
assert.equal(editedContents, "new");
assert.equal(find(editable.EditableReviewFileSourceTabContent({ path: "a", readOnly: true }), node => node.type === "textarea").props.disabled, true);

// review-file-source-item: 9
const fileSource = await bundle("review-file-source-item");
assert.deepEqual(Object.keys(fileSource), ["n", "t"]);
assert.match(text(fileSource.t({ isLoading: true })), /Loading file/);
assert.equal(find(fileSource.t({ error: new Error("Missing") }), node => node.props?.role === "alert").props.children, "Missing");
assert.match(text(fileSource.t({})), /Select a file/);
const textSourceUi = fileSource.t({ path: "src/a.ts", contents: "const a = 1", workspaceRoot: "/repo" });
assert.equal(find(textSourceUi, node => node.type === "pre").props.children, "const a = 1");
assert.match(text(textSourceUi), /\/repo\/src\/a.ts/);
assert.equal(find(fileSource.t({ path: "image.png" }), node => node.props?.["data-preview-kind"] === "image").type, "div");
assert.equal(find(fileSource.t({ path: "report.pdf" }), node => node.props?.["data-preview-kind"] === "pdf").type, "div");
let slotPayload;
fileSource.t({ path: "a.txt", renderSlots(payload) { slotPayload = payload; return "slot"; } });
assert.equal(slotPayload.headerRows.length, 0);

// code-diff-context-menu: 8
const contextMenu = await bundle("code-diff-context-menu");
assert.deepEqual(Object.keys(contextMenu), ["a", "c", "d", "f", "i", "l", "m", "n", "o", "p", "r", "s", "t", "u"]);
assert.equal(contextMenu.r.key, "preferred-open-target");
assert.deepEqual(contextMenu.a({ path: "a.ts", lineStart: 2 }), { path: "a.ts", lineStart: 2, lineEnd: 2, side: "unified" });
assert.deepEqual(await contextMenu.i({ path: "a.ts" }), { path: "a.ts", target: "editor" });
let copied;
await contextMenu.s({ selection: "hello", onCopy(value) { copied = value; } });
assert.equal(copied, "hello");
const menuUi = contextMenu.t({ children: "content", selection: "selected", getItems: () => [{ id: "copy-selection", label: "Copy", enabled: false }] });
const items = await menuUi.props.onContextMenu({ preventDefault() {} });
assert.equal(items[0].enabled, true);
assert.equal(items[0].id, "copy-selection");
let nativePrevented = 0;
await contextMenu.t({ disableNative: true }).props.onContextMenu({ preventDefault() { nativePrevented++; } });
assert.equal(nativePrevented, 1);

// pdf-preview-diff: 8
const pdf = await bundle("pdf-preview-diff");
assert.deepEqual(Object.keys(pdf), ["PdfPreviewDiff"]);
assert.match(text(pdf.PdfPreviewDiff({ isLoading: true })), /Loading PDF preview/);
assert.equal(find(pdf.PdfPreviewDiff({ error: "Broken" }), node => node.props?.role === "alert").props.children, "Broken");
let pageAction;
const pdfUi = pdf.PdfPreviewDiff({ currentPage: 2, totalPages: 3, leftLabel: "Old", rightLabel: "New", onNextPage() { pageAction = "next"; }, onPreviousPage() { pageAction = "previous"; } });
assert.match(text(pdfUi), /Old New/);
assert.match(text(pdfUi), /2 \/ 3/);
assert.equal(find(pdfUi, node => node.props?.children === "Previous page").props.disabled, false);
find(pdfUi, node => node.props?.children === "Next page").props.onClick();
assert.equal(pageAction, "next");
assert.equal(find(pdf.PdfPreviewDiff({ currentPage: 1, totalPages: 1 }), node => node.props?.children === "Next page").props.disabled, true);

// code-diff: 12
const codeDiff = await bundle("code-diff");
assert.deepEqual(Object.keys(codeDiff), ["a", "c", "i", "l", "n", "o", "r", "s", "t", "u"]);
const parsed = codeDiff.a("diff --git a/src/a.ts b/src/a.ts\n@@ -1 +1 @@\n-old\n+new");
assert.equal(parsed.length, 1);
assert.equal(parsed[0].path, "src/a.ts");
assert.equal(parsed[0].additions, 1);
assert.equal(parsed[0].deletions, 1);
assert.equal(parsed[0].status, "modified");
assert.equal(codeDiff.a("diff --git a/a b/a\nnew file mode 100644")[0].status, "added");
assert.equal(codeDiff.c("component.tsx"), "react");
assert.equal(codeDiff.c("unknown.bin"), "default");
let selectedFile;
const codeDiffUi = codeDiff.t({ files: parsed, viewType: "split", onSelectFile(path) { selectedFile = path; } });
assert.equal(codeDiffUi.props["data-view-type"], "split");
find(codeDiffUi, node => node.type === "button").props.onClick();
assert.equal(selectedFile, "src/a.ts");
assert.match(text(codeDiffUi), /\+1 −1/);

// review-slash-command-submenu-registration: 5
const reviewCommandSource = fs.readFileSync(path.join(ROOT, "src/renderer/review-slash-command-submenu-registration/index.ts"), "utf8");
assert.match(reviewCommandSource, /export \{ Ge as ReviewSlashCommandSubmenuRegistration \}/);
assert.match(reviewCommandSource, /\(Z = `review-mode`\)/);
assert.match(reviewCommandSource, /\(J = !0\)/);
assert.match(reviewCommandSource, /id: `review-mode-uncommitted`/);
assert.match(reviewCommandSource, /id: `review-mode-base-branch:\$\{e\}`/);

// pull-request-detail-query: 15
const pullRequest = await bundle("pull-request-detail-query");
assert.deepEqual(Object.keys(pullRequest), ["C", "S", "_", "a", "b", "c", "d", "f", "g", "h", "i", "l", "m", "n", "o", "p", "r", "s", "t", "u", "v", "x", "y"]);
assert.equal(pullRequest.s.key, "pull-request-repository-compatibility");
assert.match(text(pullRequest.u({ reviewers: [] })), /No reviewers/);
assert.match(text(pullRequest.u({ provider: "github", reviewers: [{ login: "octocat" }] })), /octocat/);
const checksUi = pullRequest.S({ checks: [{ name: "Pass", status: "passing" }, { name: "Fail", status: "failing" }] });
assert.match(text(checksUi), /^Fail/);
assert.equal(all(checksUi, node => node.type === "li").length, 2);
assert.equal(find(pullRequest.b({}), node => node.props?.role === "alert").props.children, "Couldn’t load this pull request section");
assert.match(text(pullRequest.y()), /Loading/);
assert.equal(find(pullRequest.t({ isLoading: true }), node => node.props?.role === "status").props.children, "Loading pull request details");
const detailUi = pullRequest.n({ detail: { title: "Improve review", number: 7, baseBranch: "main", headBranch: "feature", additions: 5, deletions: 2, checks: [] } });
assert.equal(detailUi.props["aria-label"], "Improve review");
assert.match(text(detailUi), /main ← feature/);
assert.match(text(detailUi), /\+5 −2/);

console.log("126 git review remaining flow cluster assertions passed");
