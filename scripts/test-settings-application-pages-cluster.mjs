import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hookState = { effects: [], hooks: [], index: 0 };
const ReactRuntime = { useState(value) { const index = hookState.index++; if (!(index in hookState.hooks)) hookState.hooks[index] = typeof value === "function" ? value() : value; return [hookState.hooks[index], next => { hookState.hooks[index] = typeof next === "function" ? next(hookState.hooks[index]) : next; }]; }, useEffect(callback, dependencies) { const index = hookState.index++; const previous = hookState.effects[index]; if (previous == null || dependencies.some((value, dependencyIndex) => value !== previous[dependencyIndex])) { hookState.effects[index] = dependencies; callback(); } } };
globalThis.__settingsPagesTest = { ReactRuntime, settingsState: { gates: new Map([["3278809559", true], ["3207467860", true], ["2423536643", true]]), signals: new Map([["account-state", { status: "allowed" }], ["notifications-enabled", true], ["appshots-visible", false], ["codex-micro-availability", false], ["remote-mode", false]]) }, jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "settings-pages-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__settingsPagesTest.jsx;export const e6=globalThis.__settingsPagesTest.ReactRuntime;export const HX=signal=>globalThis.__settingsPagesTest.settingsState.signals.has(signal)?globalThis.__settingsPagesTest.settingsState.signals.get(signal):signal===\"codex\"||signal===\"codex-local\"||signal===\"codex-work-local\"||signal===\"chatgpt\";export const BX=(_signal,input)=>({isCapable:input.name===\"dictation.composer\",isLoading:false});" : importPath === "app-initial" ? "export const NT=[{label:'Agent',slug:'agent'},{label:'Profile',slug:'profile'},{label:'Cloud',slug:'cloud-environments'},{label:'Analytics',slug:'analytics'},{label:'MCP',slug:'mcp-settings'},{label:'Plugins',slug:'plugins-settings'},{label:'Voice',slug:'voice'},{label:'Security',slug:'security'},{label:'Parental controls',slug:'parental-controls'},{label:'Notifications',slug:'notifications'},{label:'Account',slug:'account'},{label:'Appshots',slug:'appshots'},{label:'Import',slug:'import'},{label:'Codex Micro',slug:'codex-micro'},{label:'Debug',slug:'debug'}];export const ugn='local';export const MT='agent';export const LS='codex';export const gmn='codex-local';export const Sht='codex-work-local';export const htt='chatgpt';export const Wgn=()=>true;export const Xet='capability';export const bL='account-state';export const xun='notifications-enabled';export const _A='appshots-visible';export const fw='codex-micro-availability';export const vj='remote-mode';export const ofn=id=>globalThis.__settingsPagesTest.settingsState.gates.get(id)??false;" : importPath === "import-settings-gate" ? "export const n=()=>{};export const t='3278809559';" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function resetHooks() { hookState.effects = []; hookState.hooks = []; hookState.index = 0; }
function render(component, props) { hookState.index = 0; return component(props); }
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function findAll(node, predicate) { const results = []; walk(node, value => { if (predicate(value)) results.push(value); }); return results; }
function find(node, predicate) { return findAll(node, predicate)[0]; }
function text(node) { const values = []; walk(node, value => { if (typeof value?.props?.children === "string") values.push(value.props.children); }); return values.join(" "); }

// use-visible-settings-sections: 35
const visible = await bundle("use-visible-settings-sections");
assert.deepEqual(Object.keys(visible), ["a", "i", "n", "o", "r", "s", "t"]);
assert.equal(visible.a, "3895602085");
assert.equal(visible.o.account.href, "https://chatgpt.com/#settings");
assert.equal(visible.o.securitySettings.href, "https://chatgpt.com/open-security-settings");
assert.equal(visible.r("appshots", "windows").component, "appshots-windows-settings");
assert.equal(visible.r("voice", "macos").commandAsset, "voice-16");
const codexLocal = visible.n("cloud-environments", true, "local");
assert.equal(codexLocal.visibleSettingsSections.some(section => section.slug === "cloud-environments"), false);
assert.equal(codexLocal.activeSettingsSection, "agent");
assert.equal(codexLocal.shouldRedirectToVisibleSettingsSection, true);
assert.equal(codexLocal.showEnterpriseUsageLabel, false);
assert.equal(codexLocal.settingsNavigationSections.some(section => section.slug === "mcp-settings"), false);
const codexRemote = visible.n("cloud-environments", false, "remote");
assert.equal(codexRemote.visibleSettingsSections.some(section => section.slug === "cloud-environments"), false);
assert.equal(codexRemote.activeSettingsSection, "profile");
assert.equal(codexRemote.shouldRedirectToVisibleSettingsSection, true);
assert.equal(codexLocal.visibleSettingsSections.some(section => section.slug === "security"), false);
const pending = visible.n("voice", false, "remote");
assert.equal(pending.shouldRenderRouteContent, true);
assert.equal(pending.shouldRedirectToVisibleSettingsSection, false);
const chatgpt = visible.n("security");
assert.equal(chatgpt.visibleSettingsSections.some(section => section.slug === "security"), false);
assert.equal(chatgpt.activeSettingsSection, "agent");
assert.equal(chatgpt.visibleSettingsSections.some(section => section.slug === "parental-controls"), true);
assert.equal(chatgpt.visibleSettingsSections.some(section => section.slug === "notifications"), true);
assert.equal(chatgpt.visibleSettingsSections.some(section => section.slug === "account"), false);
assert.equal(chatgpt.visibleSettingsSections.some(section => section.slug === "appshots"), false);
assert.equal(chatgpt.visibleSettingsSections.some(section => section.slug === "import"), true);
assert.equal(chatgpt.visibleSettingsSections.some(section => section.slug === "codex-micro"), true);
assert.equal(chatgpt.visibleSettingsSections.some(section => section.slug === "debug"), true);
globalThis.__settingsPagesTest.settingsState.signals.set("codex-micro-availability", undefined);
const microLoading = visible.n("codex-micro");
assert.equal(microLoading.shouldRenderRouteContent, false);
assert.equal(microLoading.shouldRedirectToVisibleSettingsSection, false);
globalThis.__settingsPagesTest.settingsState.signals.set("codex-micro-availability", false);
globalThis.__settingsPagesTest.settingsState.signals.set("remote-mode", true);
assert.equal(visible.n("import").visibleSettingsSections.some(section => section.slug === "import"), false);
globalThis.__settingsPagesTest.settingsState.signals.set("remote-mode", false);
globalThis.__settingsPagesTest.settingsState.signals.set("account-state", { status: "loading" });
const parentalLoading = visible.n("parental-controls");
assert.equal(parentalLoading.shouldRenderRouteContent, false);
assert.equal(parentalLoading.shouldRedirectToVisibleSettingsSection, false);
globalThis.__settingsPagesTest.settingsState.signals.set("account-state", { status: "allowed" });
assert.equal(visible.i(), undefined);
assert.equal(visible.s(), undefined);
assert.equal(visible.t(), undefined);
assert.equal(visible.r("appshots", "windows").navigation.assets[20], "appshots-windows-20");

// personal-vault-settings: 12
const vault = await bundle("personal-vault-settings");
assert.deepEqual(Object.keys(vault), ["PersonalVaultSettings"]);
let backed = 0, added, edited, deleted;
const entries = [{ id: "2", name: "Zulu", namespace: "sensitive", targets: ["Production"] }, { envVar: "API_KEY", id: "1", name: "Alpha", namespace: "not_sensitive" }];
const vaultProps = { entries, onAdd(namespace) { added = namespace; }, onBack() { backed++; }, onDelete(entry) { deleted = entry.id; }, onEdit(entry) { edited = entry.id; } };
resetHooks();
let vaultUi = render(vault.PersonalVaultSettings, vaultProps);
assert.equal(vaultUi.props["data-personal-vault"], true);
assert.match(text(vaultUi), /Personal vault/);
assert.equal(findAll(vaultUi, node => node.type === "li").length, 2);
assert.equal(findAll(vaultUi, node => node.type === "li")[0].props.children[0].props.children, "API_KEY");
assert.equal(find(vaultUi, node => node.props?.children === "Production").props.children, "Production");
find(vaultUi, node => node.props?.children === "Cloud environments").props.onClick();
assert.equal(backed, 1);
find(vaultUi, node => node.props?.children === "Add environment variable").props.onClick();
assert.equal(added, "not_sensitive");
find(vaultUi, node => node.props?.children === "Add network secret").props.onClick();
assert.equal(added, "sensitive");
find(vaultUi, node => node.props?.children === "Edit").props.onClick();
assert.equal(edited, "1");
find(vaultUi, node => node.props?.children === "Delete").props.onClick();
assert.equal(deleted, undefined);
vaultUi = render(vault.PersonalVaultSettings, vaultProps);
const vaultDeleteDialog = find(vaultUi, node => node.props?.role === "alertdialog");
assert.match(text(vaultDeleteDialog), /API_KEY/);
find(vaultDeleteDialog, node => node.props?.children === "Delete").props.onClick();
await Promise.resolve();
assert.equal(deleted, "1");
resetHooks();
const failingVaultProps = { ...vaultProps, onDelete() { throw new Error("Vault locked"); } };
vaultUi = render(vault.PersonalVaultSettings, failingVaultProps);
find(vaultUi, node => node.props?.children === "Delete").props.onClick();
vaultUi = render(vault.PersonalVaultSettings, failingVaultProps);
find(find(vaultUi, node => node.props?.role === "alertdialog"), node => node.props?.children === "Delete").props.onClick();
await new Promise(resolve => setTimeout(resolve, 0));
vaultUi = render(vault.PersonalVaultSettings, failingVaultProps);
assert.match(text(find(vaultUi, node => node.props?.role === "alert")), /Vault locked/);
assert.match(text(find(vaultUi, node => node.props?.role === "alertdialog")), /API_KEY/);
resetHooks();
assert.equal(find(render(vault.PersonalVaultSettings, { isLoading: true, onBack() {} }), node => node.props?.role === "status").props.children, "Loading vault entries");
resetHooks();
assert.equal(find(render(vault.PersonalVaultSettings, { error: "Unavailable", onBack() {} }), node => node.props?.role === "alert").props.children, "Unavailable");

// appgen-settings-page: 14
const appgen = await bundle("appgen-settings-page");
assert.deepEqual(Object.keys(appgen), ["n", "r", "t"]);
assert.equal(appgen.n({ onDeleted() {}, projectId: "" }).props["data-redirect"], "/sites");
assert.equal(appgen.t({ isLoading: true, onDeleted() {}, projectId: "site-1" }).props.role, "status");
assert.equal(appgen.t({ error: "Load failed", onDeleted() {}, projectId: "site-1" }).props.role, "alert");
let saved, removed = 0;
const appgenProps = { initialEnvironmentDraft: { buildCommand: "npm run build" }, initialTitle: "Docs", onDeleted() { removed++; }, onSave(input) { saved = input; }, projectId: "site-1", siteUrl: "https://example.com" };
resetHooks();
let appgenUi = render(appgen.t, appgenProps);
assert.equal(appgenUi.props["data-embedded"], true);
assert.equal(appgenUi.props["data-project-id"], "site-1");
assert.equal(find(appgenUi, node => node.props?.name === "title").props.value, "Docs");
assert.equal(find(appgenUi, node => node.props?.name === "buildCommand").props.value, "npm run build");
assert.equal(find(appgenUi, node => node.type === "a").props.href, "https://example.com");
assert.equal(find(appgenUi, node => node.props?.children === "Save").props.disabled, true);
find(appgenUi, node => node.props?.name === "title").props.onChange({ currentTarget: { value: "Docs portal" } });
appgenUi = render(appgen.t, appgenProps);
find(appgenUi, node => node.props?.children === "Save").props.onClick();
await Promise.resolve();
assert.deepEqual(saved, { environment: { buildCommand: "npm run build" }, title: "Docs portal" });
find(appgenUi, node => node.props?.children === "Delete site").props.onClick();
appgenUi = render(appgen.t, appgenProps);
assert.match(text(find(appgenUi, node => node.props?.role === "alertdialog")), /permanently deleted/);
find(appgenUi, node => node.props?.children === "Delete").props.onClick();
await Promise.resolve();
assert.equal(removed, 1);
assert.equal(appgen.n({ onDeleted() {}, projectId: "site-2" }).props["data-embedded"], false);
assert.match(text(appgenUi), /Site settings/);
assert.equal(appgen.r(), undefined);

console.log("61 settings application pages cluster assertions passed");
