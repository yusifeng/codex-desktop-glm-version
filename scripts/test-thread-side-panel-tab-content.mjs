import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hooks = [];
let hookIndex = 0;
const state = {
  initialized: 0,
  actions: [],
  clipboard: [],
  opened: [],
  refreshes: 0,
  retries: 0,
  gitInits: 0,
};
const React = {
  useState(initial) {
    const index = hookIndex++;
    if (!(index in hooks))
      hooks[index] = typeof initial === "function" ? initial() : initial;
    return [
      hooks[index],
      (next) => {
        hooks[index] = typeof next === "function" ? next(hooks[index]) : next;
      },
    ];
  },
};
const jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) {
    return typeof type === "function"
      ? type(props ?? {})
      : { type, props: props ?? {}, key };
  },
  jsxs(type, props, key) {
    return typeof type === "function"
      ? type(props ?? {})
      : { type, props: props ?? {}, key };
  },
};
Object.defineProperty(globalThis, "navigator", {
  value: {
    clipboard: {
      writeText: async (value) => {
        state.clipboard.push(value);
      },
    },
  },
  configurable: true,
});
globalThis.__reviewPanel = { React, jsx, state };

const dependencies = [
  "rolldown-runtime",
  "app-shared",
  "app-initial",
  "app-primary",
  "diff-source",
  "review-preferences-model",
  "review-thread-file-diff",
  "virtualized-file-diff-line-position",
  "review-file-tree-side-pane",
  "review-thread-pull-request-revision-queries",
  "review-file-tree-pane",
  "scroll-to-match",
  "git-branch-switcher",
  "local-conversation-git-actions",
  "undo",
  "use-create-git-repository",
  "code-diff",
  "review-thread-pull-request-code-review",
  "revision-review-unavailable-message",
];
const mocks = Object.fromEntries(
  dependencies.map((name) => [name, "export {};\n"]),
);
mocks["app-shared"] =
  "const r=globalThis.__reviewPanel;export const $3=()=>{r.state.initialized+=1};export const I3=()=>r.jsx;export const e6=()=>r.React;";
mocks["code-diff"] = "export const i=props=>({type:'code-diff',props});";
mocks["review-thread-pull-request-code-review"] =
  "export const PullRequestCodeReview=props=>({type:'pull-request-review',props});";
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/thread-side-panel-tab-content/index.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  metafile: true,
  logLevel: "silent",
  plugins: [
    {
      name: "review-panel-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice(8),
          namespace: "mock",
        }));
        build.onLoad(
          { filter: /.*/, namespace: "mock" },
          ({ path: module }) => ({
            contents: mocks[module] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const module = await import(
  "data:text/javascript;base64," +
    Buffer.from(result.outputFiles[0].text).toString("base64")
);
assert.deepEqual(Object.keys(module), ["ReviewThreadSidePanelTab"]);
assert.equal(state.initialized, 1);
const source = fs.readFileSync(
  path.join(ROOT, "src/renderer/thread-side-panel-tab-content/index.ts"),
  "utf8",
);
assert.deepEqual(
  [
    ...new Set(
      [
        ...source.matchAll(/(?:from\s+|import\s+)["']@rchunk\/([^"']+)["']/g),
      ].map((match) => match[1]),
    ),
  ],
  dependencies,
);
assert.deepEqual(
  [...source.matchAll(/import\(["']@rchunk\/([^"']+)["']\)/g)],
  [],
);

let tabState;
function baseState() {
  return {
    repositoryInitialized: true,
    source: "uncommitted",
    files: [
      { path: "src/a.ts", additions: 4, deletions: 1, diff: "diff-a" },
      {
        path: "src/b.ts",
        additions: 2,
        deletions: 0,
        diff: "diff-b",
        generated: true,
      },
    ],
    selectedPath: "src/a.ts",
    pullRequests: [
      {
        id: "pr-1",
        number: 12,
        title: "Improve review",
        baseBranch: "main",
        headBranch: "feature",
      },
    ],
    commits: [{ id: "abc", subject: "Implement review" }],
    onGitAction: async (action, file) => state.actions.push({ action, file }),
    onInitializeGit: async () => {
      state.gitInits += 1;
    },
    onOpenFile: (file) => state.opened.push(file),
    onRefresh: async () => {
      state.refreshes += 1;
    },
    onRetry: async () => {
      state.retries += 1;
    },
  };
}
function setTabState(next) {
  tabState = typeof next === "function" ? next(tabState) : next;
}
function render(clear = false) {
  hookIndex = 0;
  if (clear) hooks.length = 0;
  let slots;
  const result = module.ReviewThreadSidePanelTab({
    tabState,
    setTabState,
    renderSlots(value) {
      slots = value;
      return jsx.jsxs(jsx.Fragment, {
        children: [
          ...value.headerRows.map((row) => row.content),
          value.content,
        ],
      });
    },
  });
  return { result, slots };
}
function walk(value, output = []) {
  if (value == null || typeof value !== "object") return output;
  if (Array.isArray(value)) {
    for (const item of value) walk(item, output);
    return output;
  }
  output.push(value);
  walk(value.props?.children, output);
  return output;
}
function text(value) {
  if (value == null || typeof value === "boolean") return "";
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  if (Array.isArray(value)) return value.map(text).join(" ");
  return text(value.props?.children);
}
function find(view, predicate) {
  return walk(view).find(predicate);
}
function findAll(view, predicate) {
  return walk(view).filter(predicate);
}
function button(view, label) {
  return find(
    view,
    (node) =>
      node.type === "button" &&
      text(node).replace(/\s+/g, " ").trim() === label,
  );
}
async function settle() {
  for (let index = 0; index < 6; index += 1) await Promise.resolve();
}

tabState = { ...baseState(), isLoading: true };
let { result: view, slots } = render(true);
assert.equal(text(view), "Loading changes…");
assert.equal(slots.headerRows.length, 0);
tabState = { ...baseState(), error: "network failed" };
view = render(true).result;
assert.equal(text(view).includes("Unable to load changes"), true);
button(view, "Retry").props.onClick();
await settle();
assert.equal(state.retries, 1);
tabState = {
  ...baseState(),
  repositoryInitialized: false,
  gitInitError: "git unavailable",
};
view = render(true).result;
assert.equal(text(view).includes("Initialize a Git repository"), true);
assert.equal(text(view).includes("git unavailable"), true);
button(view, "Initialize Git").props.onClick();
await settle();
assert.equal(state.gitInits, 1);

tabState = baseState();
view = render(true).result;
assert.deepEqual(
  render().slots.headerRows.map((row) => row.id),
  ["review-controls", "review-notices"],
);
assert.equal(text(view).includes("Uncommitted"), true);
assert.equal(text(view).includes("src/a.ts"), true);
assert.equal(text(view).includes("Generated"), true);
assert.equal(
  find(view, (node) => node.type === "code-diff").props.diff,
  "diff-a",
);
button(view, "src/b.ts Generated +2 -0").props.onClick();
assert.equal(tabState.selectedPath, "src/b.ts");
assert.equal(state.opened.at(-1), "src/b.ts");
view = render().result;
button(view, "Stage file").props.onClick();
await settle();
assert.deepEqual(state.actions.at(-1), { action: "stage", file: "src/b.ts" });
button(view, "Revert file").props.onClick();
await settle();
assert.deepEqual(state.actions.at(-1), { action: "revert", file: "src/b.ts" });
button(view, "Stage all").props.onClick();
await settle();
assert.deepEqual(state.actions.at(-1), { action: "stage", file: "" });
button(view, "Revert all").props.onClick();
await settle();
assert.deepEqual(state.actions.at(-1), { action: "revert", file: "" });

const sourceSelect = findAll(view, (node) => node.type === "select")[0];
sourceSelect.props.onChange({ target: { value: "staged" } });
view = render().result;
assert.equal(tabState.source, "staged");
button(view, "Unstage file").props.onClick();
await settle();
assert.deepEqual(state.actions.at(-1), { action: "unstage", file: "src/a.ts" });
button(view, "Unstage all").props.onClick();
await settle();
assert.deepEqual(state.actions.at(-1), { action: "unstage", file: "" });

tabState = { ...baseState(), source: "pr", selectedPullRequest: "pr-1" };
view = render(true).result;
const pullRequestReview = find(view, (node) => node.type === "pull-request-review");
assert.equal(pullRequestReview.props.headBranch, "feature");
assert.equal(pullRequestReview.props.request.files.length, 2);
assert.equal(pullRequestReview.props.onRefresh, tabState.onRefresh);
tabState = { ...baseState(), source: "pr", pullRequests: [], files: [] };
view = render(true).result;
assert.equal(text(view).includes("No open pull requests"), true);
tabState = { ...baseState(), source: "committed", selectedCommit: "abc" };
view = render(true).result;
assert.equal(
  find(view, (node) => node.props?.["aria-label"] === "Committed revision")
    .props.value,
  "abc",
);
tabState = { ...baseState(), source: "committed", commits: [], files: [] };
view = render(true).result;
assert.equal(text(view).includes("No commits on branch"), true);
tabState = {
  ...baseState(),
  source: "last-turn",
  files: [],
  lastTurnStatus: "committed",
};
view = render(true).result;
assert.equal(text(view).includes("last turn was committed or reverted"), true);
button(view, "View branch diff").props.onClick();
assert.equal(tabState.source, "branch");
tabState = {
  ...baseState(),
  source: "last-turn",
  files: [],
  lastTurnStatus: "reverted",
};
view = render(true).result;
assert.equal(text(view).includes("last turn was reverted"), true);

tabState = { ...baseState(), search: "missing" };
view = render(true).result;
assert.equal(text(view).includes("No files match your search"), true);
const search = find(
  view,
  (node) => node.props?.["aria-label"] === "Search changed files",
);
search.props.onChange({ target: { value: "a.ts" } });
assert.equal(tabState.search, "a.ts");
tabState = { ...baseState(), watcherLimited: true, omittedUntrackedCount: 120 };
view = render(true).result;
assert.equal(text(view).includes("Some files can't be watched"), true);
assert.equal(text(view).includes("Review skipped 120 untracked files"), true);
button(view, "Copy cleanup command").props.onClick();
await settle();
assert.equal(
  state.clipboard.at(-1).includes("git clean -d --interactive"),
  true,
);
const refreshButtons = findAll(
  view,
  (node) => node.type === "button" && text(node) === "Refresh",
);
refreshButtons[0].props.onClick();
await settle();
assert.equal(state.refreshes, 1);
button(view, "Copy git apply command").props.onClick();
await settle();
assert.equal(state.clipboard.at(-1).includes("git apply --3way"), true);

tabState = {
  ...baseState(),
  source: "branch",
  baseBranch: "main",
  largeDiff: true,
};
view = render(true).result;
assert.equal(text(view).includes("diff is large"), true);
assert.equal(
  findAll(view, (node) => node.type === "code-diff")[0].props.files.length,
  1,
);
assert.equal(
  find(view, (node) => node.props?.["aria-label"] === "Previous file").props
    .disabled,
  true,
);
find(
  view,
  (node) => node.props?.["aria-label"] === "Next file",
).props.onClick();
assert.equal(tabState.selectedPath, "src/b.ts");
view = render().result;
assert.equal(
  find(view, (node) => node.props?.["aria-label"] === "Next file").props
    .disabled,
  true,
);
find(
  view,
  (node) => node.props?.["aria-label"] === "Previous file",
).props.onClick();
assert.equal(tabState.selectedPath, "src/a.ts");

const assertionCount = [
  ...fs
    .readFileSync(fileURLToPath(import.meta.url), "utf8")
    .matchAll(/\bassert\./g),
].length;
console.log(assertionCount + " thread side panel assertions passed");
