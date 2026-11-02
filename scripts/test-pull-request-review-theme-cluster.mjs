import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsx = { Fragment: Symbol("Fragment"), jsx: (type, props, key) => ({ type, props: props ?? {}, key }), jsxs: (type, props, key) => ({ type, props: props ?? {}, key }) };
const hooks = [];
let hookIndex = 0;
const react = {
  __clear() { hooks.length = 0; hookIndex = 0; },
  __reset() { hookIndex = 0; },
  createContext: (value) => ({ value, Provider: "ContextProvider", Consumer: "ContextConsumer" }),
  useContext: (context) => context.value,
  useEffect: (effect) => { globalThis.__effects.push(effect); },
  useInsertionEffect: (effect) => { globalThis.__insertions.push(effect); },
  useState(initial) {
    const index = hookIndex++;
    if (!(index in hooks)) hooks[index] = typeof initial === "function" ? initial() : initial;
    return [hooks[index], (next) => { hooks[index] = typeof next === "function" ? next(hooks[index]) : next; }];
  },
};
globalThis.__jsx = jsx;
globalThis.__react = react;
globalThis.__effects = [];
globalThis.__insertions = [];

async function loadModule(name) {
  const result = await esbuild.build({ entryPoints: [path.join(ROOT, `src/renderer/${name}/index.ts`)], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
    plugins: [{ name: "mocks", setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({ path: modulePath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: modulePath }) => modulePath === "app-shared"
        ? { loader: "js", contents: `export const I3=()=>globalThis.__jsx;export const e6=()=>globalThis.__react;` }
        : { loader: "js", contents: "export {};" });
    } }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${name}`);
}

const themes = await loadModule("register-pierre-themes");
themes.i();
const LRUMap = themes.o.LRUMap;
const cache = new LRUMap(2);
assert.equal(cache.size, 0);
assert.equal(cache.set("a", 1), cache);
cache.set("b", 2);
assert.equal(cache.size, 2);
assert.equal(cache.get("a"), 1);
cache.set("c", 3);
assert.equal(cache.has("b"), false);
assert.equal(cache.has("a"), true);
assert.equal(cache.find("c"), 3);
assert.deepEqual([...cache.keys()], ["a", "c"]);
assert.deepEqual([...cache.values()], [1, 3]);
assert.deepEqual(cache.toJSON(), [{ key: "a", value: 1 }, { key: "c", value: 3 }]);
assert.equal(cache.toString(), "a:1 < c:3");
assert.equal(cache.delete("a"), 1);
assert.deepEqual(cache.shift(), ["c", 3]);
assert.equal(cache.size, 0);
cache.assign([["x", 7], ["y", 8]]);
assert.deepEqual([...cache], [["x", 7], ["y", 8]]);

globalThis.window = {};
let terminated = 0;
const provider = themes.r({ children: "child", highlighterOptions: { languages: ["ts"] }, poolOptions: { createPool: () => ({ setRenderOptions: (options) => options, terminate: () => { terminated += 1; } }) } });
assert.equal(provider.type, "ContextProvider");
assert.equal(provider.props.children, "child");
assert.equal(typeof provider.props.value.setRenderOptions, "function");
assert.equal(globalThis.__insertions.length, 1);
assert.equal(globalThis.__effects.length, 1);
delete globalThis.window;
void terminated;

const review = await loadModule("pull-request-code-review-core");
review.n();
function walk(value, output = []) {
  if (value == null || typeof value !== "object") return output;
  if (Array.isArray(value)) { for (const item of value) walk(item, output); return output; }
  output.push(value); walk(value.props?.children, output); return output;
}
function text(value) {
  if (value == null || typeof value === "boolean") return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(text).join(" ");
  return text(value.props?.children);
}
const calls = [];
const controls = {
  diffMode: "unified", expanded: true, hideWhitespace: false, loadFullFilesEnabled: false, richPreviewEnabled: true, wordDiffsEnabled: true, wrap: false,
  onSelectDiffMode: (value) => calls.push(["mode", value]), onToggleExpanded: () => calls.push(["expanded"]),
  onToggleHideWhitespace: () => calls.push(["whitespace"]), onToggleLoadFullFiles: () => calls.push(["full"]),
  onToggleRichPreview: () => calls.push(["rich"]), onToggleWordDiffs: () => calls.push(["words"]), onToggleWrap: () => calls.push(["wrap"]),
};
let refreshed = 0;
const options = review.a({ diffControls: controls, showRefreshGitQueries: true, onRefreshGitQueries: () => { refreshed += 1; }, showCopyGitApplyCommand: true });
assert.equal(options.type, "div");
assert.equal(options.props.children.length, 7);
assert.equal(options.props.children[0].props.children, "Refresh");
options.props.children[0].props.onClick();
assert.equal(refreshed, 1);
assert.equal(options.props.children[1].props.children, "Enable word wrap");
options.props.children[1].props.onClick();
assert.deepEqual(calls.at(-1), ["wrap"]);
options.props.children[2].props.onClick();
assert.deepEqual(calls.at(-1), ["expanded"]);
options.props.children[3].props.onClick();
assert.deepEqual(calls.at(-1), ["mode", "right"]);
options.props.children[4].props.onClick();
assert.deepEqual(calls.at(-1), ["whitespace"]);
options.props.children[5].props.onClick();
assert.deepEqual(calls.at(-1), ["full"]);

const unifiedDiff = review.r({ diff: { metadata: { additionLines: [1] }, name: "a.ts" }, id: "diff-1" });
assert.equal(unifiedDiff.type, "article");
assert.equal(unifiedDiff.props["data-hunk-separators"], "line-info");
assert.equal(unifiedDiff.props["data-path"], "a.ts");
assert.equal(text(unifiedDiff).includes("No patch content available"), true);
const metadataDiff = review.r({ diff: { metadata: {}, name: "b.ts" } });
assert.equal(metadataDiff.props["data-hunk-separators"], "metadata");

const scroller = review.s({ bottomInset: "actions", containerWidth: 900, disableScrollAnchoring: true, children: (width) => ({ width }) });
assert.equal(scroller.type, "div");
assert.match(scroller.props.children.props.className, /pb-16/);
assert.equal(scroller.props.children.props.style.overflowAnchor, "none");
assert.equal(scroller.props.children.props.children.width, 900);

const surface = review.t({ baseBranch: "main", headBranch: "feature", request: { account: "a", pullRequest: 7 }, renderSlots: { content: "files" }, onRefresh: () => {} });
assert.equal(surface.type, "section");
assert.equal(surface.props["data-base-branch"], "main");
assert.equal(surface.props["data-head-branch"], "feature");
assert.equal(surface.props.children[1].type, review.a);
assert.equal(surface.props.children[2], "files");

react.__clear();
const request = { headRevision: "abc", files: [
  { path: "src/a.ts", patch: "-old\n+new", comments: [{ id: 1 }], status: "modified" },
  { path: "src/b.ts", patch: "+second", generated: true, status: "added" },
] };
let live = review.t({ baseBranch: "main", headBranch: "feature", headRevision: "abc", request, onRefresh: () => {} });
assert.equal(text(live).includes("feature"), true);
assert.equal(text(live).includes("into main"), true);
assert.equal(text(live).includes("src/a.ts"), true);
assert.equal(text(live).includes("src/b.ts"), true);
let liveOptions = review.a(live.props.children[1].props);
liveOptions.props.children[1].props.onClick();
liveOptions.props.children[2].props.onClick();
liveOptions.props.children[3].props.onClick();
liveOptions.props.children[4].props.onClick();
liveOptions.props.children[5].props.onClick();
react.__reset();
live = review.t({ baseBranch: "main", headBranch: "feature", headRevision: "abc", request, onRefresh: () => {} });
assert.equal(live.props["data-hide-whitespace"], true);
assert.equal(live.props["data-load-full-files"], true);
liveOptions = review.a(live.props.children[1].props);
assert.equal(liveOptions.props.children[1].props.children, "Disable word wrap");
assert.equal(liveOptions.props.children[2].props.children, "Expand all diffs");
assert.equal(liveOptions.props.children[3].props.children, "Diff mode: right");
const filter = walk(live).find((node) => node.props?.["aria-label"] === "Filter files");
filter.props.onChange({ currentTarget: { value: "b.ts" } });
react.__reset();
live = review.t({ baseBranch: "main", headBranch: "feature", headRevision: "abc", request, onRefresh: () => {} });
assert.equal(text(live).includes("src/a.ts"), false);
assert.equal(text(live).includes("src/b.ts"), true);

react.__clear();
const loading = review.t({ request: { isLoading: true } });
assert.equal(loading.props.role, "status");
assert.equal(text(loading), "Loading pull request changes…");
const failed = review.t({ request: { error: "network failed" } });
assert.equal(failed.props.role, "alert");
assert.equal(text(failed).includes("network failed"), true);
react.__clear();
const stale = review.t({ headRevision: "new", request: { headRevision: "old", files: [] } });
assert.equal(stale.props.role, "alert");
assert.equal(text(stale).includes("changed while its diff was loading"), true);
let capturedSlots;
react.__clear();
const slotted = review.t({ request, sourceControl: "source", renderSlots: (slots) => { capturedSlots = slots; return "slotted"; } });
assert.equal(slotted, "slotted");
assert.deepEqual(capturedSlots.headerRows.map((row) => row.id), ["review-pull-request-source", "review-pull-request-toolbar"]);

console.log("pull request review and theme cluster: 44 assertions");
