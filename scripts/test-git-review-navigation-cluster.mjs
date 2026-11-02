import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = [
  "diff-core",
  "review-row",
  "file-diff-alt",
  "diff-preview-content",
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
  createElement(type, props) {
    return { type, props: props ?? {} };
  },
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
    for (const item of match[1].split(",")) {
      const imported = item.trim();
      if (imported.startsWith("type ")) continue;
      names.add(imported.split(/\s+as\s+/)[0]);
    }
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
    Dyt: "'currentHostId'",
    FDt: "()=>{}",
    Gvt: "(scope,_definition,tab)=>scope.openTab(tab)",
    IDt: "(_kind,_component,options)=>({...options,dropDestinations:['right','bottom']})",
    Syt: "'currentCwd'",
    Wvt: "()=>{}",
    Xy: "async (_operation,input)=>({status:'success',items:[{cwd:input.cwd,headBranch:'feature',number:Number(input.searchQuery),state:'open',title:`PR ${input.searchQuery}`,url:`https://github.com/o/r/pull/${input.searchQuery}`}]})",
    X8t: "pr=>pr==null?'':`${pr.hostname}/${pr.owner}/${pr.repository}#${pr.number}`",
    Z8t: "value=>value.toLowerCase()",
    _vt: "()=>{}",
    a5t: "(candidate,pr)=>candidate.url?.endsWith(`/pull/${pr.number}`)===true",
    by: "'query'",
    e5t: "value=>value",
    gvt: "scope=>scope.existingPlacement",
    hdt: "'repository-root-query'",
    hvt: "placement=>({updateTabState:(scope,id,updater)=>scope.resets?.push([placement,id,updater()])})",
    i5t: "()=>{}",
    mpn: "'intl'",
    ppn: "()=>{}",
    s5t: "url=>({hostname:'github.com',owner:'o',repository:'r',number:Number(url.split('/').pop())})",
    vvt: "(scope,placement)=>scope.focusPanel(placement)",
    xdt: "target=>target",
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

assertReleaseOwner("file-diff-alt");

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

const fileDiffPresentationReleaseAssertions = assertReleaseOwner("file-diff-presentation-core");

assertReleaseOwner("pull-request-code-review-navigation-core");

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
  get: (signal) => signal === "currentCwd" ? "/repo" : "local",
  query: {
    getOrFetch: async (query) =>
      query === "repository-root-query" ? { root: "/repo" } : null,
  },
  openTab: (tab) => sideTabs.push(tab),
  focusPanel: (panel) => focused.push(panel),
};
assert.equal(
  sideTab.n(sideStore, {
    request: {
      account: { hostId: "local" },
      provider: "github",
      pullRequest: {
        hostname: "github.com",
        owner: "o",
        repository: "r",
        number: 7,
      },
    },
    title: "PR 7",
  }),
  true,
);
assert.match(sideTabs[0].id, /^pull-request:/);
assert.equal(sideTabs[0].props.request.provider, "github");
assert.equal(sideTabs[0].target, "right");
assert.equal(sideTabs[0].title, "PR 7");
assert.equal(
  sideTab.r(
    sideStore,
    {
      hostId: "local",
      item: {
        cwd: "/repo",
        headBranch: "feature",
        number: 8,
        state: "open",
        title: "Board PR",
        url: "https://github.com/o/r/pull/8",
      },
      provider: "github",
      repo: "github.com/o/r",
      repositoryTarget: { cwd: "/repo", hostId: "local", root: "/repo" },
      statusKey: {
        cwd: "/repo",
        headBranch: "feature",
        hostId: "local",
        operationSource: "test",
        url: "https://github.com/o/r/pull/8",
      },
    },
    false,
    "bottom",
  ),
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

console.log(`56 git review navigation assertions and ${fileDiffPresentationReleaseAssertions} file diff presentation release assertions passed`);
