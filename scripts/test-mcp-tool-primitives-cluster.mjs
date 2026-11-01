import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = [
  "mcp-view-surface",
  "view-frame",
  "active-tool-activity-label",
  "tool-activity-disclosure",
  "elicitation-events",
  "mcp-app-analytics",
  "result-card",
];
const state = (globalThis.__mcpToolPrimitivesTest = {});
state.emitted = [];
state.jsx = {
  Fragment: Symbol("Fragment"),
  jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
  jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
};
state.react = {
  useRef: (value) => ({ current: value }),
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
      const name = item
        .trim()
        .replace(/^type\s+/, "")
        .split(/\s+as\s+/)[0];
      if (name) names.add(name);
    }
    imports.set(match[2], names);
  }
}
const overrides = {
  "app-shared": {
    $3: "() => ({ c: size => Array(size).fill(Symbol.for('react.memo_cache_sentinel')) })",
    I3: "() => globalThis.__mcpToolPrimitivesTest.jsx",
    G2: "value => value",
    II: "path => path",
    K2: "() => undefined",
    RI: "() => undefined",
    Xf: "({ duration: .2 })",
    a$: "({ div: 'div' })",
    e6: "() => globalThis.__mcpToolPrimitivesTest.react",
    fI: "() => undefined",
    oj: "({ name: 'elicitation-event' })",
    o$: "() => undefined",
    tp: "() => undefined",
  },
  "app-initial": {
    Fcn: "() => undefined",
    _9t: "() => undefined",
    b9t: "path => path",
    v9t: "() => false",
    Ait: "props => globalThis.__mcpToolPrimitivesTest.jsx.jsxs('section', { children: [globalThis.__mcpToolPrimitivesTest.jsx.jsx('button', { disabled: props.disclosure == null, 'aria-expanded': props.disclosure?.expanded ?? false, onClick: props.disclosure?.onToggle }), props.body] })",
    Cpn: "({ name: 'elicitation-state' })",
    Dit: "() => undefined",
    Eit: "props => globalThis.__mcpToolPrimitivesTest.jsx.jsx('div', props)",
    GPt: "({ name: 'window-focused' })",
    KPt: "() => undefined",
    Sat: "() => undefined",
    Spn: "({ name: 'blocked' })",
    Vat: "() => undefined",
    jit: "() => undefined",
    wat: "() => () => undefined",
    xpn: "(_scope, descriptor, event) => globalThis.__mcpToolPrimitivesTest.emitted.push({ descriptor, event })",
    ypn: "() => undefined",
    zat: "props => globalThis.__mcpToolPrimitivesTest.jsx.jsx('span', props)",
  },
};
overrides["rolldown-runtime"] = {
  n: "initializer => { let done = false; return () => { if (!done) { done = true; initializer(); } }; }",
};
overrides["skill-exploration-labels"] = {
  a: "() => null",
  l: "status => status === 'completed'",
  n: "() => undefined",
  s: "() => undefined",
  t: "() => null",
  u: "{ activeCreating: { defaultMessage: 'Creating visualization' }, activeUpdating: { defaultMessage: 'Updating visualization' } }",
};
const sideEffects = new Set(["result-values"]);
function mock(name) {
  if (sideEffects.has(name)) return "export {};";
  return [...(imports.get(name) ?? [])]
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
        name: "mcp-tool-primitives-mocks",
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

// mcp-view-surface: 7
const surface = await bundle("mcp-view-surface");
surface.n();
let webviewElement = null;
const surfaceTree = surface.t({
  isLoading: true,
  loadingContent: "Starting weather",
  partition: "persist:mcp",
  showBackButton: false,
  src: "https://example.test/app",
  webviewRef: (value) => {
    webviewElement = value;
  },
});
assert.equal(surfaceTree.type, "main");
assert.equal(nodeOfType(surfaceTree, "header"), undefined);
assert.equal(
  nodes(surfaceTree).find((node) => node.props.role === "status").props
    .children,
  "Starting weather",
);
const webview = nodeOfType(surfaceTree, "webview");
assert.equal(webview.props.src, "https://example.test/app");
assert.equal(webview.props.partition, "persist:mcp");
assert.equal(webview.props.inert, true);
webview.props.ref({ id: "webview" });
assert.deepEqual(webviewElement, { id: "webview" });

// view-frame: 7
const frame = await bundle("view-frame");
frame.n();
assert.equal(frame.t({}).props.role, "alert");
let closed = false;
const frameTree = frame.t({
  deepLink: "https://example.test/deep",
  lifetime: "component",
  mcpAppId: "weather",
  onClose: () => {
    closed = true;
  },
  sessionId: "session-1",
  view: { title: "Weather settings" },
});
assert.equal(frameTree.props["data-lifetime"], "component");
assert.equal(frameTree.props["data-mcp-app-id"], "weather");
assert.equal(frameTree.props["data-session-id"], "session-1");
assert.equal(
  nodeOfType(frameTree, "iframe").props.src,
  "https://example.test/deep",
);
assert.equal(nodeOfType(frameTree, "iframe").props.title, "Weather settings");
nodes(frameTree)
  .find((node) => node.type === "button")
  .props.onClick();
assert.equal(closed, true);

// active-tool-activity-label: 8
const activity = await bundle("active-tool-activity-label");
activity.n();
const exec = (parsedCmd, extra = {}) => ({
  type: "exec",
  callId: extra.callId,
  executionStatus: extra.executionStatus,
  parsedCmd,
});
assert.deepEqual(
  activity.t({
    items: [
      exec({ cmd: "rg TODO", type: "search", query: "TODO" }, { callId: "a" }),
    ],
  }).values,
  { query: "TODO" },
);
assert.equal(
  activity.t({
    items: [exec({ cmd: "ls src", type: "list_files", path: "src" })],
  }).values.folder,
  "src",
);
assert.equal(
  activity.t({
    items: [exec({ cmd: "cat README.md", type: "read", path: "README.md" })],
  }).values.target,
  "README.md",
);
assert.equal(
  activity.t({
    items: [exec({ cmd: "npm test", type: "test", isFinished: false })],
  }).message.defaultMessage,
  "<action>Running</action> <detail>{command}</detail>",
);
assert.equal(
  activity.t({
    items: [exec({ cmd: "npm test", type: "test", isFinished: true })],
  }).message.defaultMessage,
  "<action>Ran</action> <detail>{command}</detail>",
);
assert.equal(
  activity.t({
    items: [
      exec(
        { cmd: "npm test", type: "test", isFinished: false },
        { executionStatus: "interrupted" },
      ),
    ],
  }).icon,
  "stop",
);
assert.equal(
  activity.t({
    items: [
      exec(
        { cmd: "npm test", type: "test", isFinished: false },
        { executionStatus: "interrupted" },
      ),
    ],
  }).values.command,
  "npm test",
);
assert.equal(
  activity.t({ items: [exec({ cmd: "rg", type: "search" })] }).message
    .defaultMessage,
  "<action>Searching</action> <detail>files</detail>",
);

// tool-activity-disclosure: 7
const disclosure = await bundle("tool-activity-disclosure");
disclosure.n();
disclosure.r();
const measurement = disclosure.i();
measurement.elementRef({ scrollHeight: 84 });
assert.equal(typeof measurement.elementRef, "function");
let expanded = 0;
const disclosureTree = disclosure.t({
  children: "details",
  defaultExpanded: false,
  onExpand: () => {
    expanded++;
  },
  status: "complete",
  summary: "Ran command",
});
const toggle = disclosureTree.props.disclosure;
assert.equal(toggle.expanded, false);
toggle.onToggle();
assert.equal(expanded, 1);
assert.equal(disclosureTree.props.body.props["aria-hidden"], true);
const runningTree = disclosure.t({
  children: "output",
  status: "running",
  summary: "Running",
});
assert.equal(runningTree.props.disclosure.expanded, true);
assert.equal(
  disclosure.t({ summary: "No details" }).props.disclosure,
  undefined,
);

// elicitation-events: 5
const elicitation = await bundle("elicitation-events");
elicitation.t();
const store = {
  get: (signal) => (signal?.name === "window-focused" ? true : null),
  watch: () => () => {
    state.emitted.push({ cleanup: true });
  },
};
elicitation.n(
  store,
  { itemId: "item", threadId: "thread", turnId: "turn" },
  "accept",
);
assert.equal(state.emitted[0].event.stage, "interacted");
assert.equal(state.emitted[0].event.action, "accept");
assert.equal(elicitation.r(store, null, null, {}), undefined);
assert.equal(typeof elicitation.n, "function");
assert.equal(typeof elicitation.t, "function");

// mcp-app-analytics: 5
const analytics = await bundle("mcp-app-analytics");
analytics.n();
assert.equal(
  analytics.t({ name: "Weather", appMetadata: { firstPartyType: "openai" } }),
  "Weather",
);
assert.equal(
  analytics.t({ name: "Drive", distributionChannel: "DEFAULT_OAI_CATALOG" }),
  "Drive",
);
assert.equal(
  analytics.t({ name: "Calendar", distributionChannel: "ECOSYSTEM_DIRECTORY" }),
  "Calendar",
);
assert.equal(
  analytics.t({ name: "Private", distributionChannel: "PRIVATE" }),
  undefined,
);
assert.equal(analytics.t(null), undefined);

// result-card: 6
const result = await bundle("result-card");
result.r();
const resultTree = result.n({
  details: {
    branch: "main",
    networkDomains: ["api.example.test"],
    repository: "desktop",
    worktree: "/repo",
  },
  title: "Ready",
});
assert.equal(resultTree.type, "article");
assert.equal(nodeOfType(resultTree, "h3").props.children, "Ready");
assert.equal(
  nodes(resultTree).filter((node) => typeof node.type === "function").length,
  4,
);
assert.match(
  nodeOfType(resultTree, "footer").props.children,
  /Prototype draft/,
);
const wrappedResult = result.t({ details: { repository: "desktop" } });
assert.equal(wrappedResult.type, result.n);
assert.equal(wrappedResult.props.details.repository, "desktop");

console.log("45 MCP tool primitives cluster assertions passed");
