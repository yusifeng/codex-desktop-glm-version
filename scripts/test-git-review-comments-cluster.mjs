import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = ["pull-request-actions", "pull-request-revision-tab", "registered-pull-request-thumbnail", "pull-request-readonly-comment", "bookmarked-thread-user-message-navigation", "artifact-file-preview-icon"];
const state = globalThis.__gitReviewCommentsTest = {};
state.jsx = { Fragment: Symbol("Fragment"), jsx: (type, props, key) => ({ type, props: props ?? {}, key }), jsxs: (type, props, key) => ({ type, props: props ?? {}, key }) };
state.react = {};
const imports = new Map();
for (const directory of MODULES) { const source = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8"); for (const match of source.matchAll(/import\s*{([\s\S]*?)}\s*from\s*"@rchunk\/([^"]+)";/g)) { const names = imports.get(match[2]) ?? new Set(); for (const item of match[1].split(",")) names.add(item.trim().split(/\s+as\s+/)[0]); imports.set(match[2], names); } }
const overrides = { "app-shared": { I3: "() => globalThis.__gitReviewCommentsTest.jsx", e6: "() => globalThis.__gitReviewCommentsTest.react" } };
const sideEffects = new Set(["rolldown-runtime", "app-initial", "pull-request-revision-queries-core", "pull-request-code-review-navigation-core", "pull-request-code-review-core", "revision-review-unavailable-message", "pull-request-status-label", "pull-request-checks-summary", "app-primary", "file-diff-alt", "diff-comment-card", "thread-user-message-navigation-rail-app"]);
function mock(name) { if (sideEffects.has(name)) return "export {};"; return [...(imports.get(name) ?? [])].map(exportName => `export const ${exportName} = ${overrides[name]?.[exportName] ?? "() => undefined"};`).join("\n"); }
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "git-review-comments-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: mock(importPath), loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function nodes(root) { const output = []; const visit = value => { if (value == null || typeof value !== "object") return; if (Array.isArray(value)) return value.forEach(visit); if ("type" in value && "props" in value) output.push(value); visit(value.props?.children); }; visit(root); return output; }
const nodeOfType = (tree, type) => nodes(tree).find(node => node.type === type);

// pull-request-actions
const actions = await bundle("pull-request-actions"); actions.v(); actions.m(); actions.t();
const baseComment = { id: "one", content: [{ content_type: "text", text: "First" }], position: { line: 4, path: "src/main.ts", side: "right" } };
assert.deepEqual(actions.h("abc123", baseComment), { commentKey: "one", revision: "abc123" });
const nextComment = { id: "two", content: [{ content_type: "text", text: "Second" }], position: { line: 5, path: "src/main.ts", side: "right" } };
assert.deepEqual(actions._({ currentComments: [baseComment], nextComments: [baseComment, nextComment] }), [nextComment]);
const draft = { id: "draft", content: [{ content_type: "text", text: "" }], position: { line: 6, path: "src/main.ts", side: "right" }, replyToReviewThreadId: "thread" };
const filled = { ...draft, content: [{ content_type: "text", text: "Reply" }] };
assert.deepEqual(actions._({ currentComments: [draft], nextComments: [filled] }), [filled]);
const counts = actions.g({ comments: [baseComment, nextComment], filePaths: ["src/main.ts", "README.md"] });
assert.equal(counts.get("src/main.ts"), 2);
assert.equal(counts.has("README.md"), false);
const generated = await actions.p({ body: "Existing", detail: { baseBranch: "main", headBranch: "feature", unifiedDiff: "+line" }, pullRequestInstructions: "Keep concise", title: "Fix bug" });
assert.match(generated, /Update the existing/);
assert.match(generated, /Head: feature/);
assert.match(generated, /Keep concise/);
const generationError = new actions.f("head_changed");
assert.equal(generationError.reason, "head_changed");
assert.equal(generationError.name, "PullRequestDescriptionGenerationError");
assert.equal(typeof actions.a, "symbol");
assert.equal(typeof actions.c, "symbol");
assert.equal(typeof actions.d, "symbol");
assert.equal(typeof actions.i, "symbol");
assert.equal(typeof actions.l, "symbol");
assert.equal(typeof actions.n, "symbol");
assert.equal(typeof actions.r, "symbol");
assert.equal(typeof actions.s, "symbol");

// pull-request-revision-tab
const revisionTab = await bundle("pull-request-revision-tab");
const revisionTree = revisionTab.PullRequestRevisionTab({ request: { number: 7 }, title: "PR #7" });
assert.equal(revisionTree.props["data-testid"], "pull-request-revision-tab");
assert.equal(nodeOfType(revisionTree, "h1").props.children, "PR #7");
assert.equal(nodes(revisionTree).find(node => node.props["data-review-request"]).props.children, "Review changes");
const unavailableTree = revisionTab.PullRequestRevisionTab({ unavailableReason: "Revision unavailable" });
assert.equal(nodes(unavailableTree).find(node => node.props.role === "alert").props.children, "Revision unavailable");
assert.equal(nodeOfType(unavailableTree, "h1").props.children, "Pull request review");

// registered-pull-request-thumbnail
const thumbnail = await bundle("registered-pull-request-thumbnail");
const thumbnailTree = thumbnail.RegisteredPullRequestThumbnail({ props: { request: { number: 4 }, status: "merged", checks: [{ id: 1 }, { id: 2 }] }, title: "Improve tests" });
assert.equal(thumbnailTree.props["data-testid"], "pull-request-thumbnail");
assert.equal(nodeOfType(thumbnailTree, "strong").props.children, "Improve tests");
assert.equal(nodes(thumbnailTree).find(node => node.props.children === "merged").type, "span");
assert.equal(nodes(thumbnailTree).find(node => node.props.children === "2 checks").type, "span");
assert.match(nodeOfType(thumbnailTree, "code").props.children, /"number":4/);
assert.equal(thumbnail.RegisteredPullRequestThumbnail({}).props.children[0].props.children, "Pull request");

// pull-request-readonly-comment
const readonly = await bundle("pull-request-readonly-comment"); readonly.a(); readonly.s(); readonly.r();
assert.equal(readonly.o("octocat", 48), "https://github.com/octocat.png?size=48");
assert.equal(readonly.o("bad login", 48), null);
assert.equal(readonly.o("gitlab-user", 24, "gitlab.com"), "https://gitlab.com/gitlab-user.png?size=24");
const avatarSlot = readonly.i({ children: "A" });
assert.equal(avatarSlot.type, "span");
assert.equal(avatarSlot.props.children, "A");
const commentTree = readonly.t({ authorLogin: "octocat", body: "Looks good", createdAt: "today", url: "https://example.test/comment" });
assert.equal(nodeOfType(commentTree, "strong").props.children, "octocat");
assert.equal(nodeOfType(commentTree, "img").props.src, "https://github.com/octocat.png?size=48");
assert.equal(nodeOfType(commentTree, "p").props.children, "Looks good");
assert.equal(nodeOfType(commentTree, "a").props.href, "https://example.test/comment");
const readonlyTree = readonly.n({ comment: { authorLogin: "reviewer", body: "Change this" }, filePath: "src/app.ts", line: 12, side: "left" });
assert.equal(readonlyTree.props["data-readonly-review-comment"], true);
assert.equal(nodeOfType(readonlyTree, "header").props.children, "src/app.ts · L12");
assert.equal(readonlyTree.props.children[1].type, readonly.t);

// bookmarked-thread-user-message-navigation
const bookmarks = await bundle("bookmarked-thread-user-message-navigation"); bookmarks.n();
assert.equal(bookmarks.t({ enabled: false, getItems: () => [] }), null);
let previewed = null; let revealed = null; let changed = null;
const bookmarkTree = bookmarks.t({ bookmarkKey: "thread-1", getItems: () => [{ id: "one", label: "First" }, { id: "two", bookmarked: false }], onBookmarkChange: item => { changed = item; }, onPreviewItem: item => { previewed = item; }, onRevealItem: item => { revealed = item; } });
assert.equal(bookmarkTree.type, "nav");
assert.equal(bookmarkTree.props["data-bookmark-key"], "thread-1");
assert.equal(bookmarkTree.props.children.length, 1);
const bookmarkButton = bookmarkTree.props.children[0];
bookmarkButton.props.onMouseEnter(); bookmarkButton.props.onClick(); bookmarkButton.props.onDoubleClick();
assert.equal(previewed.id, "one");
assert.equal(revealed.id, "one");
assert.equal(changed.id, "one");

// artifact-file-preview-icon
const artifactIcon = await bundle("artifact-file-preview-icon"); artifactIcon.n();
const imageIcon = artifactIcon.t({ getImagePreviewSrc: () => "data:image/png;base64,abc", imageClassName: "preview", path: "image.png" });
assert.equal(imageIcon.type, "img");
assert.equal(imageIcon.props.src, "data:image/png;base64,abc");
assert.equal(imageIcon.props.className, "preview");
const fallbackIcon = artifactIcon.t({ iconClassName: "file", path: "report.pdf" });
assert.equal(fallbackIcon.type, "span");
assert.equal(fallbackIcon.props["aria-label"], "PDF file");
assert.equal(fallbackIcon.props.children, "PDF");

console.log("54 git review comments cluster assertions passed");
