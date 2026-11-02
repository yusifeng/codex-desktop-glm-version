import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
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
assert.match(text(nudgeUi), /Automatically approve safe review commands/);
assert.equal(find(nudgeUi, node => node.type === "a").props.href, "https://example.com/review");
assert.equal(find(nudgeUi, node => node.type === "button" && node.props.type === "submit").props.children, "Enable");
find(nudgeUi, node => node.type === "button" && node.props.children === "Not now").props.onClick();
assert.deepEqual(dismissed, { conversationId: "c1", hostId: "local" });
await nudgeUi.props.onSubmit({ preventDefault() {} });
await Promise.resolve();
assert.deepEqual(enabled, { conversationId: "c1", hostId: "local" });

const diff = await bundle("editor-diff-page");
assert.deepEqual(Object.keys(diff), ["EditorDiffPage"]);
assert.equal(diff.EditorDiffPage({ error: "broken" }).props.role, "alert");
assert.match(text(diff.EditorDiffPage({})), /No diff available/);
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
assert.match(text(diffUi), /Rich preview/);
assert.match(text(diffUi), /src\/a.ts/);
const added = diff.EditorDiffPage({ conversationId: "c", diffContent: "diff --git a/new b/new\nnew file mode 100644\n+++ b/new\n+x" });
assert.match(text(added), /new file mode/);
const huge = `diff --git a/a b/a\n${Array.from({ length: 2001 }, () => "+x").join("\n")}`;
assert.match(text(diff.EditorDiffPage({ conversationId: "c", diffContent: huge })), /diff --git/);

const reviewSource = fs.readFileSync(path.join(ROOT, "src/renderer/review-slash-command-submenu-registration/index.ts"), "utf8");
const releaseReviewSource = fs.readFileSync(path.join(ROOT, "src/webview/assets/review-slash-command-submenu-registration-8268b8759915.ts"), "utf8")
  .replace('"./rolldown-runtime-2d059c5e81f4.js"', '"@rchunk/rolldown-runtime"')
  .replace('"./app-shared-7b9edc1bfb7f.js"', '"@rchunk/app-shared"')
  .replace('"./app-initial-51da50e6c6e3.js"', '"@rchunk/app-initial"')
  .replace('"./app-primary-d66705000d76.js"', '"@rchunk/app-primary"')
  .replace('"./use-git-recent-branches-c7226997efb8.js"', '"@rchunk/use-git-recent-branches"');
assert.equal(reviewSource.trimEnd(), releaseReviewSource.trimEnd());
assert.match(reviewSource, /Review the change and respond in normal Markdown/);
assert.match(reviewSource, /git-merge-base/);
assert.match(reviewSource, /threadSource: `code_review`/);
assert.match(reviewSource, /turnTrigger: `code_review`/);
assert.match(reviewSource, /c\.acquire\(\)/);
assert.match(reviewSource, /c\.release\(\)/);
assert.match(reviewSource, /delivery: `inline`/);
assert.match(reviewSource, /delivery: `detached`/);
assert.match(reviewSource, /Review uncommitted changes/);
console.log("git review entry cluster tests passed");
