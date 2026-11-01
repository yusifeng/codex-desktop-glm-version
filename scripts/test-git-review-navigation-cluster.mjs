import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = [
  "diff-core",
  "review-row",
  "file-diff-alt",
  "diff-preview-content",
  "file-diff-presentation-core",
  "pull-request-code-review-navigation-core",
  "open-thread-pull-request-code-tab",
  "open-thread-pull-request-side-panel-tab",
];
const state = (globalThis.__gitReviewNavigationTest = {});
state.jsx = {
  Fragment: Symbol("Fragment"),
  jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
  jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
};
state.react = {
  useState(initial) {
    let value = typeof initial === "function" ? initial() : initial;
    return [
      value,
      (next) => {
        value = typeof next === "function" ? next(value) : next;
      },
    ];
  },
};
state.FileDiff = function FileDiff() {};
const imports = new Map();
for (const directory of MODULES) {
  const source = fs.readFileSync(
    path.join(ROOT, "src/renderer", directory, "index.ts"),
    "utf8",
  );
  for (const match of source.matchAll(
    /import\s*{([\s\S]*?)}\s*from\s*"@rchunk\/([^"]+)";/g,
  )) {
    const names = imports.get(match[2]) ?? new Set();
    for (const item of match[1].split(","))
      names.add(item.trim().split(/\s+as\s+/)[0]);
    imports.set(match[2], names);
  }
}
const overrides = {
  "rolldown-runtime": {
    n: "initializer=>{let done=false;return()=>{if(!done){done=true;initializer();}}}",
  },
  "app-shared": {
    CS: "'PullRequestIcon'",
    H3: "()=>{}",
    I3: "() => globalThis.__gitReviewNavigationTest.jsx",
    Jm: "loader=>props=>({type:'lazy-component',props,loader})",
    V3: "load=>load()",
    e6: "() => globalThis.__gitReviewNavigationTest.react",
    lw: "()=>{}",
    qm: "()=>{}",
  },
  "app-initial": {
    FDt: "()=>{}",
    Gvt: "(scope,_definition,tab)=>scope.openTab(tab)",
    IDt: "(_kind,_component,options)=>({...options,dropDestinations:['right','bottom']})",
    Wvt: "()=>{}",
    X8t: "pr=>`${pr.hostname}/${pr.owner}/${pr.repository}#${pr.number}`",
    Z8t: "value=>value.toLowerCase()",
    _vt: "()=>{}",
    by: "'query'",
    e5t: "value=>value",
    gvt: "scope=>scope.existingPlacement",
    hvt: "placement=>({updateTabState:(scope,id,updater)=>scope.resets?.push([placement,id,updater()])})",
    i5t: "()=>{}",
    mpn: "'intl'",
    ppn: "()=>{}",
    vvt: "(scope,placement)=>scope.focusPanel(placement)",
    yy: "()=>{}",
  },
  "file-diff-alt": { t: "globalThis.__gitReviewNavigationTest.FileDiff" },
};
const sideEffects = new Set([
  "diff-comment-card",
  "file-diff-presentation-core",
  "register-pierre-themes",
  "virtualized-file-diff-line-position",
  "shiki-highlight-provider",
  "codex-diff-css",
  "diff-worker-runtime",
  "diff-worker-algorithm",
  "diff-worker-model",
  "diff-worker-renderer",
  "diff-worker-utils",
  "pull-request-actions",
  "pull-request-revision-queries-core",
  "pull-request-revision-tab",
  "registered-pull-request-thumbnail",
]);
function mock(name) {
  if (sideEffects.has(name)) return "export {};";
  return [...(imports.get(name) ?? [])]
    .filter(Boolean)
    .map(
      (exportName) =>
        `export const ${exportName} = ${overrides[name]?.[exportName] ?? "() => undefined"};`,
    )
    .join("\n");
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
        name: "git-review-navigation-mocks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
            path: importPath.slice(8),
            namespace: "mock",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock" },
            ({ path: importPath }) => ({
              contents: mock(importPath),
              loader: "js",
            }),
          );
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`
  );
}
function nodes(root) {
  const output = [];
  const visit = (value) => {
    if (value == null || typeof value !== "object") return;
    if (Array.isArray(value)) return value.forEach(visit);
    if ("type" in value && "props" in value) output.push(value);
    visit(value.props?.children);
  };
  visit(root);
  return output;
}
const nodeOfType = (tree, type) =>
  nodes(tree).find((node) => node.type === type);

// diff-core
const grammar = await bundle("diff-core");
grammar.n();
assert.equal(Array.isArray(grammar.t), true);
assert.equal(grammar.t.length, 1);
assert.equal(grammar.t[0].name, "diff");
assert.equal(grammar.t[0].scopeName, "source.diff");
assert.equal(Object.isFrozen(grammar.t[0]), true);
assert.equal(
  grammar.t[0].patterns.some(
    (pattern) => pattern.name === "markup.inserted.diff",
  ),
  true,
);

// review-row
const reviewRow = await bundle("review-row");
reviewRow.n();
let submitted = false;
const rowTree = reviewRow.t({
  authorAvatar: "A",
  children: "Comment",
  submitLabel: "Submit review",
  onSubmit: () => {
    submitted = true;
  },
});
assert.equal(rowTree.type, "div");
assert.equal(rowTree.props.className, "review-row");
assert.equal(
  nodes(rowTree).find((node) => node.props["aria-label"] === "Submit review")
    .props.type,
  "button",
);
nodes(rowTree)
  .find((node) => node.type === "button")
  .props.onClick();
assert.equal(submitted, true);
const loadingRow = reviewRow.t({ children: "Saving", loading: true });
assert.equal(nodeOfType(loadingRow, "button").props["aria-busy"], true);
assert.equal(nodeOfType(loadingRow, "button").props.children, null);
const cardRow = reviewRow.t({
  children: "Card",
  layout: "card",
  showSubmit: false,
});
assert.equal(cardRow.type, "article");
assert.equal(cardRow.props.children[1].props["aria-hidden"], true);

// file-diff-alt
const fileDiff = await bundle("file-diff-alt");
fileDiff.i();
fileDiff.n();
const provider = fileDiff.r({ children: "diff" });
assert.equal(provider.props["data-highlight-provider"], true);
assert.equal(provider.props.children, "diff");
const fileTree = fileDiff.t({
  alignCommentGutter: true,
  fileDiff: "@@ diff",
  lineDiffType: "word",
  className: "custom",
});
assert.equal(fileTree.type, fileDiff.r);
const fileBody = fileTree.props.children;
assert.equal(fileBody.props["data-testid"], "file-diff");
assert.equal(fileBody.props["data-align-comment-gutter"], true);
assert.equal(fileBody.props["data-line-diff-type"], "word");
assert.equal(fileBody.props.children, "@@ diff");

// diff-preview-content
const preview = await bundle("diff-preview-content");
const preload = preview.DiffHighlightPreloader({
  fileDiff: { cacheKey: "file-1" },
});
assert.equal(preload.props.hidden, true);
assert.match(preload.props.children, /file-1/);
let opened = 0;
const previewTree = preview.DiffPreviewContent({
  diff: { metadata: { name: "main.ts" } },
  displayPath: "src/main.ts",
  linesAdded: 4,
  linesRemoved: 2,
  onOpen: () => {
    opened++;
  },
});
assert.equal(previewTree.props.role, "button");
assert.match(previewTree.props.className, /invisible/);
assert.equal(
  nodes(previewTree).find(
    (node) => node.props["data-testid"] === "diff-preview-scroll",
  ).type,
  "div",
);
assert.equal(
  nodes(previewTree).find((node) => node.type === state.FileDiff).props.fileDiff
    .name,
  "main.ts",
);
previewTree.props.onClick();
assert.equal(opened, 1);
previewTree.props.onKeyDown({ key: "Enter", preventDefault() {} });
assert.equal(opened, 2);

// file-diff-presentation-core
const presentation = await bundle("file-diff-presentation-core");
presentation.r();
presentation.n();
assert.deepEqual(presentation.i(), {
  diffStyle: "unified",
  lineDiffType: "word",
  hunkSeparators: "simple",
});
assert.equal(
  presentation.i({ diffStyle: "split", lineDiffType: "line" }).diffStyle,
  "split",
);
let rendered = false;
const presentationTree = presentation.t({
  fileDiff: "-old\n+new",
  diffStyle: "split",
  lineDiffType: "line",
  hunkSeparators: "none",
  onPostRender: () => {
    rendered = true;
  },
  className: "diff",
});
assert.equal(presentationTree.type, "pre");
assert.equal(presentationTree.props["data-diff-style"], "split");
assert.equal(presentationTree.props["data-line-diff-type"], "line");
assert.equal(presentationTree.props["data-hunk-separators"], "none");
assert.equal(presentationTree.props.children, "-old\n+new");
assert.equal(rendered, true);

// pull-request-code-review-navigation-core
const navigation = await bundle("pull-request-code-review-navigation-core");
navigation.i();
navigation.n();
const writes = [];
const store = { get: () => [], set: (...args) => writes.push(args) };
navigation.b(store, "request", "src\\main.ts");
assert.equal(writes.at(-1)[2], "src/main.ts");
navigation.x(store, "request", "query");
assert.equal(writes.at(-1)[2], "query");
navigation.S(store, "request", true);
assert.equal(writes.at(-1)[2], true);
navigation.y(store, "request", 120);
assert.equal(writes.at(-1)[2], 120);
navigation.C(store, "request", "src/main.ts", [{ id: 1 }]);
assert.deepEqual(writes.at(-1)[2], [{ id: 1 }]);
const elementId = navigation.t(
  { value: { pathname: "/thread/1" } },
  { account: "a", pullRequest: "p" },
  "src/main.ts",
);
assert.match(elementId, /^pull-request-file-/);
assert.match(decodeURIComponent(elementId), /src\/main.ts/);
assert.equal(typeof navigation._, "symbol");
assert.equal(typeof navigation.a, "symbol");
assert.equal(typeof navigation.c, "symbol");
assert.equal(typeof navigation.d, "symbol");
assert.equal(typeof navigation.f, "symbol");
assert.equal(typeof navigation.g, "symbol");
assert.equal(typeof navigation.h, "symbol");

// open-thread-pull-request-code-tab
const codeTab = await bundle("open-thread-pull-request-code-tab");
codeTab.t();
const openedTabs = [];
const focused = [];
const tabStore = {
  get(signal) {
    return signal === "intl"
      ? { formatMessage: (_descriptor, values) => `PR #${values.number}` }
      : { data: null };
  },
  openTab: (tab) => openedTabs.push(tab),
  focusPanel: (panel) => focused.push(panel),
};
const openedTab = codeTab.n(
  tabStore,
  {
    account: { hostId: "local" },
    pullRequest: {
      hostname: "github.com",
      owner: "OpenAI",
      repository: "Codex",
      number: 42,
    },
  },
  " Fix bug ",
  false,
  "bottom",
);
assert.equal(openedTab.placement, "bottom");
assert.equal(openedTab.status, "opened");
assert.match(openedTab.tabId, /^pull-request-code:/);
assert.equal(openedTabs[0].props.request.pullRequest.owner, "openai");
assert.equal(openedTabs[0].props.request.pullRequest.repository, "codex");
assert.equal(openedTabs[0].title, "Fix bug");
assert.deepEqual(focused, ["bottom"]);

// open-thread-pull-request-side-panel-tab
const sideTab = await bundle("open-thread-pull-request-side-panel-tab");
sideTab.t();
const sideTabs = [];
const sideStore = {
  value: { routeKind: "local-thread" },
  openTab: (tab) => sideTabs.push(tab),
  focusPanel: (panel) => focused.push(panel),
};
assert.equal(
  sideTab.n(sideStore, {
    request: { id: "pr" },
    title: "PR 7",
    url: "https://github.com/o/r/pull/7",
  }),
  true,
);
assert.equal(sideTabs[0].kind, "pull-request");
assert.equal(sideTabs[0].target, "right");
assert.equal(sideTabs[0].title, "PR 7");
assert.equal(
  sideTab.r(sideStore, { request: {}, title: "Board PR" }, false, "bottom"),
  true,
);
assert.equal(sideTabs[1].target, "bottom");
assert.equal(
  await sideTab.i(
    sideStore,
    { cwd: "/repo", hostId: "local", url: "https://github.com/o/r/pull/9" },
    { target: "right" },
  ),
  true,
);
assert.equal(
  await sideTab.i(
    { value: { routeKind: "cloud" } },
    { cwd: "/repo", hostId: "local", url: "url" },
    {},
  ),
  false,
);

console.log("66 git review navigation cluster assertions passed");
