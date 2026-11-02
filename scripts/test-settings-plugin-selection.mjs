import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const text = (node) => { if (node == null) return ""; if (typeof node === "string") return node; if (Array.isArray(node)) return node.map(text).join(" "); return text(node.props?.children); };
const walk = (node, output = []) => { if (node == null || typeof node !== "object") return output; output.push(node); const children = node.props?.children; (Array.isArray(children) ? children.flat(Infinity) : [children]).forEach((child) => walk(child, output)); return output; };
globalThis.__pluginSelectionTest = {
  marketplace: "company",
  jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } },
};
const result = await esbuild.build({ entryPoints: [path.join(root, "src/renderer/settings-plugin-selection/index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: value }) => ({ path: value.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: value }) => ({ loader: "js", contents: value === "app-shared" ? "export const I3=()=>globalThis.__pluginSelectionTest.jsx;export const lq=()=>globalThis.__pluginSelectionTest.marketplace;export const fq=name=>name?.startsWith('official');" : value === "app-initial" ? "export const Gv=()=>({selectedHostId:'local'});export const Oun=()=>\"prod\";export const iDt=(wanted,candidate)=>wanted===candidate;" : "export {};" })); } }] });
const module = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
assert.deepEqual(Object.keys(module), ["a", "i", "n", "o", "r", "t"]);
assert.equal(module.i(), undefined); assert.equal(module.o(), undefined); assert.equal(module.t(), undefined);
assert.match(text(module.a({ configStatus: "loading" })), /Loading browser settings/);
assert.match(text(module.a({ configStatus: "error" })), /Unable to load/);
const browser = module.a({ backend: "chrome", browserUseEnabled: true, configStatus: "supported", showHistory: true, showWebMcp: true, siteSettingsRow: { type: "site", props: { children: "Sites" } } });
assert.match(text(browser), /Permissions/); assert.match(text(browser), /Sites/); assert.match(text(browser), /Website tools/); assert.match(text(browser), /Browsing history/);
const records = [
  { marketplaceName: "openai-curated", marketplacePath: "/curated", plugin: { id: "demo@curated", name: "demo" } },
  { marketplaceName: "official-team", marketplacePath: "/official", plugin: { id: "demo@official", name: "demo" } },
  { marketplaceName: "company", marketplacePath: "/company", plugin: { id: "demo@company", name: "demo" } },
];
assert.equal(module.n(records, "demo")?.marketplaceName, "company");
globalThis.__pluginSelectionTest.marketplace = "missing";
assert.equal(module.n(records, "demo")?.marketplaceName, "official-team");
assert.equal(module.n(records.filter((record) => record.marketplaceName !== "official-team"), "demo")?.marketplaceName, "openai-curated");
assert.equal(module.n([{ marketplaceName: "other", marketplacePath: "/wanted", plugin: { id: "demo@other", name: "demo" } }], "demo", "/wanted")?.marketplaceName, "other");
assert.equal(module.n(records, "absent"), null);
assert.match(text(module.r({ emptyStateTitle: "No plugins", installButtonLabel: "Install", items: [], pluginsQuery: { isLoading: true }, selectedHostId: "local" })), /Loading plugins/);
assert.match(text(module.r({ emptyStateTitle: "No plugins", installButtonLabel: "Install", items: [], pluginsQuery: { errorMessage: "Failed" }, selectedHostId: "local" })), /Failed/);
assert.match(text(module.r({ emptyStateTitle: "No plugins", installButtonLabel: "Install", items: [], pluginsQuery: {}, selectedHostId: "local" })), /No plugins/);
let installed = "", toggled = false, deleted = "";
const controls = module.r({ emptyStateTitle: "None", installButtonLabel: "Install", selectedHostId: "host-1", pluginsQuery: {}, pendingPluginId: null, onInstallPlugin(record) { installed = record.plugin.id; }, onTogglePlugin(_record, value) { toggled = value; }, onUninstallPlugin(record) { deleted = record.plugin.id; }, items: [
  { id: "new", title: "New plugin", plugin: { plugin: { id: "new", name: "new", installed: false } } },
  { id: "old", title: "Old plugin", plugin: { plugin: { id: "old", name: "old", installed: true, enabled: true } } },
  { id: "off", kind: "unavailable", title: "Unavailable" },
] });
assert.equal(controls.props["data-plugin-host-id"], "host-1");
const nodes = walk(controls);
nodes.find((node) => node.type === "button" && node.props?.children === "Install").props.onClick();
assert.equal(installed, "new");
nodes.find((node) => node.props?.role === "switch" && node.props?.["aria-checked"] === true).props.onClick();
assert.equal(toggled, false);
nodes.find((node) => node.type === "button" && node.props?.children === "Delete").props.onClick();
assert.equal(deleted, "old");
assert.equal(nodes.some((node) => node.props?.role === "switch" && node.props?.disabled === true), true);
console.log("25 settings plugin selection assertions passed");
