import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__gitReviewTest = { jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "git-review-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__gitReviewTest.jsx;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let result; walk(node, value => { if (result == null && predicate(value)) result = value; }); return result; }
function all(node, predicate) { const result = []; walk(node, value => { if (predicate(value)) result.push(value); }); return result; }
function text(node) { const parts = []; const collect = value => { if (typeof value === "string" || typeof value === "number") { parts.push(String(value)); return; } if (value == null || typeof value !== "object") return; const children = value.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(collect); else collect(children); }; collect(node); return parts.join(" "); }

const nudge = await bundle("auto-review-approval-nudge");
assert.deepEqual(Object.keys(nudge), ["AutoReviewApprovalNudge"]);
let enabled, dismissed;
const nudgeUi = nudge.AutoReviewApprovalNudge({ conversationId: "c1", hostId: "local", learnMoreUrl: "https://example.com/review", onEnable: input => { enabled = input; }, onDismiss: input => { dismissed = input; } });
assert.equal(nudgeUi.type, "form");
assert.match(text(nudgeUi), /Want fewer approval prompts/);
assert.match(text(nudgeUi), /automatically approve eligible actions/);
assert.equal(find(nudgeUi, node => node.type === "a").props.href, "https://example.com/review");
assert.equal(find(nudgeUi, node => node.type === "button" && node.props.type === "submit").props.autoFocus, true);
find(nudgeUi, node => node.type === "button" && node.props.children === "Keep manual approvals").props.onClick();
assert.deepEqual(dismissed, { conversationId: "c1", hostId: "local" });
await nudgeUi.props.onSubmit({ preventDefault() {} });
await Promise.resolve();
assert.deepEqual(enabled, { conversationId: "c1", hostId: "local" });

const diff = await bundle("editor-diff-page");
assert.deepEqual(Object.keys(diff), ["EditorDiffPage"]);
assert.equal(diff.EditorDiffPage({ error: "broken" }).props.role, "alert");
assert.match(text(diff.EditorDiffPage({})), /Missing conversation/);
const content = `diff --git a/src/a.ts b/src/a.ts
index 111..222 100644
--- a/src/a.ts
+++ b/src/a.ts
@@ -1 +1,2 @@
 old
+new
diff --git a/old.txt b/old.txt
deleted file mode 100644
--- a/old.txt
+++ /dev/null
@@ -1 +0,0 @@
-gone`;
const diffUi = diff.EditorDiffPage({ conversationId: "c2", diffContent: content, initialViewType: "unified", richPreviewEnabled: true });
assert.equal(diffUi.type, "main");
assert.equal(diffUi.props["data-conversation-id"], "c2");
assert.equal(diffUi.props["data-view-type"], "unified");
assert.equal(diffUi.props["data-rich-preview"], true);
assert.match(text(diffUi), /2 files changed/);
assert.match(text(diffUi), /\+1/);
assert.match(text(diffUi), /-1/);
const sections = all(diffUi, node => node.type === "section");
assert.equal(sections.length, 2);
assert.equal(sections[0].props["data-file-type"], "modified");
assert.equal(sections[0].props.open, true);
assert.equal(sections[1].props["data-file-type"], "deleted");
assert.equal(sections[1].props.open, false);
assert.match(text(sections[0]), /src\/a.ts/);
const added = diff.EditorDiffPage({ conversationId: "c", diffContent: "diff --git a/new b/new\nnew file mode 100644\n+++ b/new\n+x" });
assert.equal(find(added, node => node.type === "section").props["data-file-type"], "added");
const huge = `diff --git a/a b/a\n${Array.from({ length: 2001 }, () => "+x").join("\n")}`;
assert.equal(find(diff.EditorDiffPage({ conversationId: "c", diffContent: huge }), node => node.type === "section").props.open, false);

const review = await bundle("review-slash-command-submenu-registration");
assert.deepEqual(Object.keys(review), ["ReviewSlashCommandSubmenuRegistration"]);
const requests = [], lock = { held: false, releases: 0, acquire() { if (this.held) return false; this.held = true; return true; }, release() { this.held = false; this.releases++; } };
const reviewUi = review.ReviewSlashCommandSubmenuRegistration({ conversationId: "c3", currentBranch: "feature", cwd: "/repo", defaultTargetBranch: "main", gitRoot: "/repo", hostConfig: { id: "local" }, recentBranches: ["main", "develop", "feature", "release"], reviewDelivery: "detached", reviewSubmissionLock: lock, onReview: request => { requests.push(request); } });
assert.equal(reviewUi.props.role, "menu");
assert.equal(reviewUi.props["aria-label"], "Review changes");
const buttons = all(reviewUi, node => node.type === "button");
assert.equal(buttons.length, 4);
assert.deepEqual(buttons.map(button => button.props.children), ["Review uncommitted changes", "Review against main", "Review against develop", "Review against release"]);
buttons[0].props.onClick(); await Promise.resolve();
assert.equal(requests[0].mode, "uncommitted");
assert.equal(requests[0].baseBranch, null);
assert.equal(requests[0].delivery, "detached");
assert.match(requests[0].prompt, /staged, unstaged, and untracked/);
buttons[1].props.onClick(); await Promise.resolve();
assert.equal(requests[1].mode, "base-branch");
assert.equal(requests[1].baseBranch, "main");
assert.match(requests[1].prompt, /against main/);
assert.match(requests[1].prompt, /normal Markdown/);
assert.equal(lock.releases, 2);
const loading = review.ReviewSlashCommandSubmenuRegistration({ cwd: "/repo", gitRoot: "/repo", hostConfig: { id: "local" }, isLoading: true });
assert.equal(all(loading, node => node.type === "button").every(button => button.props.disabled), true);
console.log("git review entry cluster tests passed");
