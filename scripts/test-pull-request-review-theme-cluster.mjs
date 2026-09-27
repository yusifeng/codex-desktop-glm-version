import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsx = { Fragment: Symbol("Fragment"), jsx: (type, props, key) => ({ type, props: props ?? {}, key }), jsxs: (type, props, key) => ({ type, props: props ?? {}, key }) };
const react = {
  createContext: (value) => ({ value, Provider: "ContextProvider", Consumer: "ContextConsumer" }),
  useContext: (context) => context.value,
  useEffect: (effect) => { globalThis.__effects.push(effect); },
  useInsertionEffect: (effect) => { globalThis.__insertions.push(effect); },
  useState: (initial) => [typeof initial === "function" ? initial() : initial, () => {}],
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
assert.equal(unifiedDiff.type, "div");
assert.equal(unifiedDiff.props["data-hunk-separators"], "line-info");
assert.equal(unifiedDiff.props.children.name, "a.ts");
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
assert.equal(surface.props.children[0].type, review.a);
assert.equal(surface.props.children[1].type, review.s);
assert.equal(surface.props.children[1].props.bottomInset, "actions");

console.log("pull request review and theme cluster: 44 assertions");
