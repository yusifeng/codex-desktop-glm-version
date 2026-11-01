import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__gitReviewPresentationTest = { initialized: [] });
const jsxRuntime = {
  Fragment: "Fragment",
  jsx: (type, props, key) => ({ key, props, type }),
  jsxs: (type, props, key) => ({ key, props, type }),
};
state.jsxRuntime = jsxRuntime;

function mockChunk(name) {
  if (name === "app-shared")
    return `
      export const $3 = () => { const cache = []; return { c(size) { while (cache.length < size) cache.push(Symbol.for("react.memo_cache_sentinel")); return cache; } }; };
      export const I3 = () => globalThis.__gitReviewPresentationTest.jsxRuntime;
      export const e6 = () => globalThis.__gitReviewPresentationTest.initialized.push("react");
      export const h4 = () => globalThis.__gitReviewPresentationTest.initialized.push("styles");
      export const m4 = (...values) => values.filter(Boolean).join(" ");
      export const K2 = () => globalThis.__gitReviewPresentationTest.initialized.push("messages");
      export const Y2 = "FormattedMessage";
    `;
  if (name === "diff-core")
    return `export const n = () => globalThis.__gitReviewPresentationTest.initialized.push("diff"); export const t = props => ({ kind: "diff", props });`;
  if (name === "file-diff-alt")
    return `export const n = () => globalThis.__gitReviewPresentationTest.initialized.push("file-diff"); export const t = props => ({ kind: "file-diff", props });`;
  if (name === "file-diff-presentation-core")
    return `export const n = () => globalThis.__gitReviewPresentationTest.initialized.push("file-presentation"); export const t = props => ({ kind: "file-presentation", props });`;
  if (name === "open-pull-request-fix-automation-panel-core")
    return `
      export const n = value => ({ opened: value });
      export const r = async value => value === "restorable";
      export const t = () => globalThis.__gitReviewPresentationTest.initialized.push("fix-panel");
    `;
  if (name === "pull-request-code-review-core")
    return `export const n = () => globalThis.__gitReviewPresentationTest.initialized.push("code-review"); export const t = props => ({ kind: "code-review", props });`;
  return "export const sideEffect = true;";
}

async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [
      {
        name: "mock-renderer-chunks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
            path: importPath.slice("@rchunk/".length),
            namespace: "mock-renderer-chunk",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock-renderer-chunk" },
            ({ path: importPath }) => ({ contents: mockChunk(importPath), loader: "js" }),
          );
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`
  );
}

const overlay = await bundle("popcorn-review-bar-overlay");
const overlayNode = overlay.t({ children: "review", viewportInsets: { bottom: 12 } });
assert.equal(overlayNode.type, "div");
assert.equal(overlayNode.props["data-popcorn-review-bar"], "true");
assert.deepEqual(overlayNode.props.style, { bottom: 12 });
assert.equal(overlayNode.props.children.props.children, "review");

const commitIcon = await bundle("commit-icon");
commitIcon.n();
const commitNode = commitIcon.t({ className: "commit" });
assert.equal(state.initialized.includes("react"), true);
assert.equal(commitNode.type, "svg");
assert.equal(commitNode.props.className, "commit");
assert.equal(commitNode.props.children.length, 3);
assert.equal(commitNode.props.children[0].props.fill, "currentColor");

const diffEntry = await bundle("diff-entry");
assert.equal(state.initialized.includes("diff"), true);
assert.deepEqual(diffEntry.default({ before: "a", after: "b" }), {
  kind: "diff",
  props: { before: "a", after: "b" },
});

const commentCard = await bundle("diff-comment-card");
commentCard.r();
assert.equal(state.initialized.includes("styles"), true);
const body = commentCard.n({ children: "comment", footer: "edited" });
assert.equal(body.type, "div");
assert.equal(body.props.children[0].props.children[0].props.children, "comment");
assert.equal(body.props.children[0].props.children[1].props["aria-hidden"], "true");
assert.equal(body.props.children[1], "edited");
const clicked = () => {};
const card = commentCard.t({
  authorAvatar: "avatar",
  authorLabel: "Ada",
  body: "body",
  className: "custom",
  footer: "footer",
  headerLayout: "truncate",
  onHeaderClick: clicked,
  surfaceVariant: "inline",
});
assert.equal(card.props.className.includes("custom"), true);
assert.equal(card.props.className.includes("border-default"), false);
assert.equal(card.props.children[0].props.onClick, clicked);
assert.equal(card.props.children[2], "body");
assert.equal(card.props.children[3].props.children, "footer");

const fileDiff = await bundle("file-diff");
assert.equal(state.initialized.includes("file-diff"), true);
assert.deepEqual(fileDiff.FileDiff({ path: "a.ts" }), { kind: "file-diff", props: { path: "a.ts" } });
const filePresentation = await bundle("file-diff-presentation");
assert.equal(state.initialized.includes("file-presentation"), true);
assert.deepEqual(filePresentation.FileDiffPresentation({ path: "b.ts" }), { kind: "file-presentation", props: { path: "b.ts" } });

const fixPanel = await bundle("open-pull-request-fix-automation-panel");
assert.equal(state.initialized.includes("fix-panel"), true);
assert.deepEqual(fixPanel.openPullRequestFixAutomationPanel("pr-1"), { opened: "pr-1" });
assert.equal(await fixPanel.restorePullRequestFixAutomationSidePanelTab("restorable"), true);
assert.equal(await fixPanel.restorePullRequestFixAutomationSidePanelTab("missing"), false);

const pullRequestIcon = await bundle("pull-request");
pullRequestIcon.n();
const pullRequestNode = pullRequestIcon.t({ className: "pull-request" });
assert.equal(pullRequestNode.type, "svg");
assert.equal(pullRequestNode.props.className, "pull-request");
assert.equal(pullRequestNode.props.children.type, "g");
assert.equal(pullRequestNode.props.children.props.children.length, 3);

const codeReview = await bundle("pull-request-code-review");
assert.equal(state.initialized.includes("code-review"), true);
assert.deepEqual(codeReview.PullRequestCodeReview({ number: 42 }), { kind: "code-review", props: { number: 42 } });

const errorDescription = await bundle("pull-request-error-description");
errorDescription.n();
assert.equal(state.initialized.includes("messages"), true);
const plainError = errorDescription.t({ account: { login: "ada" }, error: "network failed" });
assert.equal(plainError.type, "Fragment");
assert.equal(plainError.props.children, "network failed");
const repositoryError = errorDescription.t({
  account: { login: "ada" },
  error: "Could not resolve to a Repository with the name 'openai/codex'",
});
assert.equal(repositoryError.type, "FormattedMessage");
assert.equal(repositoryError.props.id, "codex.pullRequests.repositoryAccessError");
assert.deepEqual(repositoryError.props.values, { login: "ada", repository: "openai/codex" });

const statusLabel = await bundle("pull-request-status-label");
statusLabel.n();
for (const [status, expected] of [
  ["closed", "Closed"],
  ["draft", "Draft"],
  ["merged", "Merged"],
  ["open", "Ready for review"],
]) {
  const node = statusLabel.t({ status });
  assert.equal(node.type, "FormattedMessage");
  assert.equal(node.props.defaultMessage, expected);
}

console.log("git review presentation adapter assertions passed");
