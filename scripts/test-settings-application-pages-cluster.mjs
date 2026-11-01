import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__settingsPagesTest = { settingsState: {}, jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "settings-pages-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__settingsPagesTest.jsx;export const e6={useState:value=>[typeof value==='function'?value():value,()=>{}]};" : importPath === "app-initial" ? "export const NT=[{label:'Agent',slug:'agent'},{label:'Profile',slug:'profile'},{label:'Cloud',slug:'cloud-environments'},{label:'Analytics',slug:'analytics'},{label:'MCP',slug:'mcp-settings'},{label:'Plugins',slug:'plugins-settings'},{label:'Voice',slug:'voice'},{label:'Security',slug:'security'}];export const ugn='local';" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function findAll(node, predicate) { const results = []; walk(node, value => { if (predicate(value)) results.push(value); }); return results; }
function find(node, predicate) { return findAll(node, predicate)[0]; }
function text(node) { const values = []; walk(node, value => { if (typeof value?.props?.children === "string") values.push(value.props.children); }); return values.join(" "); }

// use-visible-settings-sections: 18
const visible = await bundle("use-visible-settings-sections");
assert.deepEqual(Object.keys(visible), ["a", "i", "n", "o", "r", "s", "t"]);
assert.equal(visible.a, "3895602085");
assert.equal(visible.o.account.href, "https://chatgpt.com/#settings");
assert.equal(visible.o.securitySettings.href, "https://chatgpt.com/open-security-settings");
assert.equal(visible.r("appshots", "windows").component, "appshots-windows-settings");
assert.equal(visible.r("voice", "macos").commandAsset, "voice-16");
const codexLocal = visible.n("cloud-environments", true, "local");
assert.equal(codexLocal.visibleSettingsSections.some(section => section.slug === "cloud-environments"), true);
assert.equal(codexLocal.activeSettingsSection, "cloud-environments");
assert.equal(codexLocal.showEnterpriseUsageLabel, false);
assert.equal(codexLocal.settingsNavigationSections.some(section => section.slug === "mcp-settings"), false);
const codexRemote = visible.n("cloud-environments", false, "remote");
assert.equal(codexRemote.visibleSettingsSections.some(section => section.slug === "cloud-environments"), false);
assert.equal(codexRemote.activeSettingsSection, "profile");
assert.equal(codexRemote.shouldRedirectToVisibleSettingsSection, true);
const pending = visible.n("voice", false, "remote");
assert.equal(pending.shouldRenderRouteContent, true);
assert.equal(pending.shouldRedirectToVisibleSettingsSection, false);
const chatgpt = visible.n("security");
assert.equal(chatgpt.visibleSettingsSections.some(section => section.slug === "security"), false);
assert.equal(chatgpt.activeSettingsSection, "agent");
assert.equal(visible.i(), undefined);
assert.equal(visible.s(), undefined);
assert.equal(visible.t(), undefined);
assert.equal(visible.r("appshots", "windows").navigation.assets[20], "appshots-windows-20");

// personal-vault-settings: 12
const vault = await bundle("personal-vault-settings");
assert.deepEqual(Object.keys(vault), ["PersonalVaultSettings"]);
let backed = 0, added, edited, deleted;
const entries = [{ id: "2", name: "Zulu", namespace: "sensitive", targets: ["Production"] }, { envVar: "API_KEY", id: "1", name: "Alpha", namespace: "not_sensitive" }];
const vaultUi = vault.PersonalVaultSettings({ entries, onAdd(namespace) { added = namespace; }, onBack() { backed++; }, onDelete(entry) { deleted = entry.id; }, onEdit(entry) { edited = entry.id; } });
assert.equal(vaultUi.props["data-personal-vault"], true);
assert.match(text(vaultUi), /Personal vault/);
assert.equal(findAll(vaultUi, node => node.type === "li").length, 2);
assert.equal(findAll(vaultUi, node => node.type === "li")[0].props.children[0].props.children, "API_KEY");
assert.equal(find(vaultUi, node => node.props?.children === "Production").props.children, "Production");
find(vaultUi, node => node.props?.children === "Cloud environments").props.onClick();
assert.equal(backed, 1);
find(vaultUi, node => node.props?.children === "Add").props.onClick();
assert.equal(added, "not_sensitive");
find(vaultUi, node => node.props?.children === "Edit").props.onClick();
assert.equal(edited, "1");
find(vaultUi, node => node.props?.children === "Delete").props.onClick();
assert.equal(deleted, "1");
assert.equal(find(vault.PersonalVaultSettings({ isLoading: true, onBack() {} }), node => node.props?.role === "status").props.children, "Loading vault entries");
assert.equal(find(vault.PersonalVaultSettings({ error: "Unavailable", onBack() {} }), node => node.props?.role === "alert").props.children, "Unavailable");

// appgen-settings-page: 14
const appgen = await bundle("appgen-settings-page");
assert.deepEqual(Object.keys(appgen), ["n", "r", "t"]);
assert.equal(appgen.n({ onDeleted() {}, projectId: "" }).props["data-redirect"], "/sites");
assert.equal(appgen.t({ isLoading: true, onDeleted() {}, projectId: "site-1" }).props.role, "status");
assert.equal(appgen.t({ error: "Load failed", onDeleted() {}, projectId: "site-1" }).props.role, "alert");
let saved, removed = 0;
const appgenUi = appgen.t({ initialEnvironmentDraft: { buildCommand: "npm run build" }, initialTitle: "Docs", onDeleted() { removed++; }, onSave(input) { saved = input; }, projectId: "site-1", siteUrl: "https://example.com" });
assert.equal(appgenUi.props["data-embedded"], true);
assert.equal(appgenUi.props["data-project-id"], "site-1");
assert.equal(find(appgenUi, node => node.props?.name === "title").props.value, "Docs");
assert.equal(find(appgenUi, node => node.props?.name === "buildCommand").props.value, "npm run build");
assert.equal(find(appgenUi, node => node.type === "a").props.href, "https://example.com");
find(appgenUi, node => node.props?.children === "Save").props.onClick();
assert.deepEqual(saved, { environment: { buildCommand: "npm run build" }, title: "Docs" });
find(appgenUi, node => node.props?.children === "Delete site").props.onClick();
assert.equal(removed, 1);
assert.equal(appgen.n({ onDeleted() {}, projectId: "site-2" }).props["data-embedded"], false);
assert.match(text(appgenUi), /Site settings/);
assert.equal(appgen.r(), undefined);

console.log("44 settings application pages cluster assertions passed");
