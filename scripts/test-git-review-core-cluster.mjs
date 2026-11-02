import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = ["pull-request-comment"];
const state = globalThis.__gitReviewCoreTest = {
  initialized: [], mutationOptions: null, navigations: [], queryFactory: null,
  signals: [], stateOverrides: [],
};
state.jsx = { Fragment: "Fragment", jsx: (type, props, key) => ({ type, props: props ?? {}, key }), jsxs: (type, props, key) => ({ type, props: props ?? {}, key }) };
state.react = {
  Fragment: "Fragment",
  useState(initial) { const value = state.stateOverrides.length ? state.stateOverrides.shift() : initial; return [value, next => { state.lastState = typeof next === "function" ? next(value) : next; }]; },
  useId: () => "id-1",
};
globalThis.Element = class Element {
  constructor(attributes = {}) { this.attributes = attributes; }
  getAttribute(name) { return this.attributes[name] ?? null; }
};

const importedNamesByModule = new Map();
for (const directory of MODULES) {
  const source = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  for (const match of source.matchAll(/import\s*(?:type\s*)?{([\s\S]*?)}\s*from\s*"@rchunk\/([^"]+)";/g)) {
    const names = importedNamesByModule.get(match[2]) ?? new Set();
    for (const raw of match[1].split(",")) {
      const specifier = raw.trim().replace(/^type\s+/, "");
      if (specifier) names.add(specifier.split(/\s+as\s+/)[0]);
    }
    importedNamesByModule.set(match[2], names);
  }
}
const marker = name => `() => globalThis.__gitReviewCoreTest.initialized.push(${JSON.stringify(name)})`;
const component = name => JSON.stringify(name);
const overrides = {
  "app-shared": {
    $O: `{ ONE_MINUTE: 60_000, FIVE_SECONDS: 5_000 }`, FX: marker("signals"),
    I3: `() => globalThis.__gitReviewCoreTest.jsx`, Ih: component("Dialog"),
    LX: `() => ({})`, QI: marker("queries"),
    QX: `(scope, factory) => { globalThis.__gitReviewCoreTest.queryFactory = factory; return { scope, factory }; }`,
    Y2: component("FormattedMessage"), Yh: component("Button"), ZI: `{ id: "app-scope" }`,
    e6: `Object.assign(() => globalThis.__gitReviewCoreTest.react, globalThis.__gitReviewCoreTest.react)`,
    iL: `options => { globalThis.__gitReviewCoreTest.mutationOptions = options; return { options, isPending: false, mutate: value => options.mutationFn(value), mutateAsync: value => Promise.resolve(options.mutationFn(value)) }; }`,
    oZ: `(scope, factory) => { const signal = { kind: "family", scope, factory }; globalThis.__gitReviewCoreTest.signals.push(signal); return signal; }`,
    pZ: `(scope, factory) => { const signal = { kind: "signal", scope, factory }; globalThis.__gitReviewCoreTest.signals.push(signal); return signal; }`,
    Q3: `{ error() {} }`, RI: `(...parts) => parts.join("/").replace(/\\/+/g, "/")`,
    S_: component("IconAsset"), VI: `value => value.replace(/\\\\/g, "/").replace(/\\/+/g, "/")`,
    n4: `() => ({ formatMessage: descriptor => descriptor.defaultMessage })`,
  },
  "app-initial": {
    $en: `{ id: "route-scope" }`, $ln: `(key, parameters) => [key, parameters]`,
    i5t: marker("pr-api"), itn: marker("route-state"), t5t: `value => value?.id ?? String(value)`,
    Qln: `async () => ({})`, _ft: marker("open-target"), mnt: marker("app-services"),
    pnt: `{}`, vft: `{ id: "target-apps" }`,
  },
  "app-primary": { af: marker("pr-markdown"), if: component("PullRequestMarkdown") },
  "pull-request-readonly-comment": {
    a: marker("readonly-comment"), i: component("AvatarFallback"), n: component("ReadonlyComment"),
    o: `(login, size, hostname) => hostname ? "https://" + hostname + "/" + login + "?s=" + size : null`,
    r: marker("comment-avatar"),
  },
  "pull-request-actions": { i: `{ id: "edit" }`, r: `{ id: "create" }`, s: `{ id: "resolve" }`, t: marker("pr-actions") },
  "pull-request-code-review-navigation-core": { n: marker("review-navigation"), r: `id => globalThis.__gitReviewCoreTest.navigations.push(id)` },
  "pull-request-detail-model": { c: marker("detail-model"), i: `{ id: "account" }`, l: `{ id: "can-edit" }`, s: marker("pr-signals") },
  "arrow-curved-right": { n: marker("arrow"), t: component("ArrowCurvedRight") },
  "use-target-apps": { n: marker("target-apps"), r: `() => ({ targets: [] })`, t: component("PrefetchTargetApps") },
  "review-preferences-model": { a: marker("review-preferences"), c: `{ id: "diff-style" }`, d: `{ id: "file-view" }`, l: `{ id: "line-diff" }`, o: `{ id: "flatten" }`, u: `{ id: "icons" }` },
};

function mockModule(name) {
  if (name === "rolldown-runtime") return "export {};";
  const names = importedNamesByModule.get(name) ?? new Set();
  const lines = [];
  for (const exportName of names) {
    if (exportName === "if") {
      lines.push(`const PullRequestMarkdownRenderer = ${overrides[name]?.[exportName] ?? "undefined"}; export { PullRequestMarkdownRenderer as if };`);
    } else lines.push(`export const ${exportName} = ${overrides[name]?.[exportName] ?? "undefined"};`);
  }
  return lines.join("\n");
}
let bundleIndex = 0;
async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true,
    format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
    plugins: [{ name: "git-review-mocks", setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: mockModule(importPath), loader: "js" }));
    } }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}-${bundleIndex++}`);
}
function walk(node, visit) {
  if (node == null || typeof node !== "object") return;
  visit(node);
  const children = node.props?.children;
  if (Array.isArray(children)) children.forEach(child => walk(child, visit)); else walk(children, visit);
}
function find(node, predicate) { let result; walk(node, candidate => { if (result == null && predicate(candidate)) result = candidate; }); return result; }

// pull-request-comment
const comments = await bundle("pull-request-comment");
comments.n(); comments.n();
assert.equal(state.initialized.filter(name => name === "pr-actions").length, 1);
assert.equal(state.initialized.includes("pr-markdown"), true);
assert.deepEqual(Object.keys(comments).sort(), ["S", "_", "a", "b", "c", "d", "f", "g", "h", "i", "l", "m", "n", "o", "p", "r", "s", "t", "u", "v", "x", "y"]);
assert.equal(comments.p.factory(), "all");
assert.equal(comments.m.factory(), "open");
assert.equal(comments.g.factory(), "");
assert.equal(comments._.factory(), "summary");
const sets = [];
const scope = { set: (...args) => sets.push(args) };
comments.y(scope, { id: "pr-1" }, "resolved");
comments.b(scope, { id: "pr-1" }, "closed");
comments.x(scope, { id: "pr-1" }, "comment-1");
comments.S(scope, { id: "pr-1" }, "draft");
comments.v(scope, "conversation");
assert.deepEqual(sets[0].slice(1), ["pr-1", "resolved"]);
assert.deepEqual(sets[3].slice(1), ["pr-1", "draft"]);
assert.deepEqual(sets[4].slice(1), ["conversation"]);

comments.l();
const queryOptions = comments.c.factory({ request: { query: "dav", scope: "mentions" }, source: "review" });
assert.equal(queryOptions.enabled, true);
assert.equal(queryOptions.staleTime, 60_000);
assert.deepEqual(queryOptions.queryKey, ["gh-user-search", { query: "dav", scope: "mentions" }]);
assert.deepEqual((await queryOptions.queryFn()).users, []);

let markdown = comments.u({ account: { login: "david" }, children: "https://github.com/user-attachments/assets/abc.mp4" });
assert.equal(markdown.type, "PullRequestMarkdown");
assert.equal(markdown.props.extensions.length, 1);
const token = markdown.props.extensions[0].extensions[0].tokenizer("https://github.com/user-attachments/assets/abc.mp4");
assert.equal(token.name, "pull-request-media");
assert.equal(token.attributes.kind, "video");
assert.equal(markdown.props.extensions[0].extensions[0].tokenizer("http://example.com/a.png"), undefined);

let submitted;
state.stateOverrides = ["  hello  ", null];
let composer = comments.o({ onSubmit: async body => { submitted = body; } });
assert.equal(composer.type, "form");
await composer.props.onSubmit({ preventDefault() {} });
assert.equal(submitted, "hello");
assert.equal(find(composer, node => node.type === "Button" && node.props.type === "submit").props.disabled, undefined);
state.stateOverrides = ["   ", null];
composer = comments.o({ onSubmit() {} });
assert.equal(find(composer, node => node.type === "Button" && node.props.type === "submit").props.disabled, true);

const resolution = comments.i({ account: { login: "d" }, action: "resolve", pullRequest: {}, reviewThreadId: "thread-1" });
assert.equal(resolution.props.children, "Resolve conversation");
resolution.props.onClick();
await Promise.resolve();
assert.equal(state.mutationOptions.mutationFn instanceof Function, true);
const card = comments.t({ account: { login: "david", hostname: "github.test" }, comment: { authorLogin: "alice", nodeId: "c1", reviewThreadId: "rt1" } });
assert.equal(card.type, "article");
assert.equal(card.props["data-comment-id"], "c1");
find(card, node => node.type === "Button").props.onClick();
assert.deepEqual(state.navigations, ["rt1"]);

assertReleaseOwner("review-file-tree-pane", [
  /@rchunk\/review-preferences-model/,
  /linguist-generated/,
  /export \{/,
]);

console.log("git review core cluster tests passed");
