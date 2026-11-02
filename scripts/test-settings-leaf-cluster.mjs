import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsx = { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } };
globalThis.__settingsLeafTest = { billingInits: 0, generalInits: 0, location: { hash: "#focus", pathname: "/settings/time", search: "?source=test", state: { from: "test" } }, notificationInits: 0, pluginInits: 0, profileInits: 0, skillsInits: 0 };

const mocks = {
  "app-shared": `export const I3=()=>globalThis.__settingsLeafJsx; export const m4=(...values)=>values.filter(Boolean).join(" ");`,
  "app-initial": `export const Qgn=()=>{}; export const Ygn=props=>({type:"navigate",props}); export const i_n=()=>globalThis.__settingsLeafTest.location;`,
  "general-settings": `export const i=props=>({type:"general-entry",props}); export const n=props=>({type:"appearance-content",props}); export const o=()=>{globalThis.__settingsLeafTest.generalInits++};`,
  "notifications-settings": `export const n=props=>({type:"notifications",props}); export const r=()=>{globalThis.__settingsLeafTest.notificationInits++};`,
  "plugins-settings-core": `export const n=()=>{globalThis.__settingsLeafTest.pluginInits++}; export const t=props=>({type:"plugins-settings",props});`,
  "skills-page-core": `export const n=props=>({type:"skills-page",props}); export const r=()=>{globalThis.__settingsLeafTest.skillsInits++};`,
  "profile-view": `export const n=()=>{globalThis.__settingsLeafTest.profileInits++}; export const t=props=>({type:"profile-view",props});`,
  "billing-analytics": `export const n=()=>{globalThis.__settingsLeafTest.billingInits++}; export const t=props=>({type:"billing-analytics",props});`,
  "plugins-page": `export const n=()=>{globalThis.__settingsLeafTest.pluginsPageInitialized=true}; export const t=props=>({type:"plugins-page",props});`,
};
globalThis.__settingsLeafJsx = jsx;

async function load(name) {
  const result = await esbuild.build({ entryPoints: [path.join(ROOT, `src/renderer/${name}/index.ts`)], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "settings-leaf-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" })); } }] });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
}

const pluginEntry = await load("plugins-settings-entry");
assert.deepEqual(Object.keys(pluginEntry), ["PluginsSettings"]);
assert.equal(globalThis.__settingsLeafTest.pluginInits, 1);
assert.equal(pluginEntry.PluginsSettings({ manageOnly: true }).type, "plugins-settings");
assert.equal(pluginEntry.PluginsSettings({ manageOnly: true }).props.manageOnly, true);

const notifications = await load("notifications-settings-entry");
assert.deepEqual(Object.keys(notifications), ["NotificationsSettingsPage"]);
assert.equal(globalThis.__settingsLeafTest.notificationInits, 1);
assert.equal(notifications.NotificationsSettingsPage({ compact: true }).type, "notifications");
assert.equal(notifications.NotificationsSettingsPage({ compact: true }).props.compact, true);

const general = await load("general-settings-entry");
assert.deepEqual(Object.keys(general), ["GeneralSettings"]);
assert.equal(globalThis.__settingsLeafTest.generalInits, 1);
assert.equal(general.GeneralSettings({ section: "import" }).type, "general-entry");
assert.equal(general.GeneralSettings({ section: "import" }).props.section, "import");

const skills = await load("skills-settings");
assert.deepEqual(Object.keys(skills), ["SkillsSettings"]);
assert.equal(globalThis.__settingsLeafTest.skillsInits, 1);
const skillsView = skills.SkillsSettings();
assert.equal(skillsView.type, "section");
assert.equal(skillsView.props["data-settings-section"], "skills");
assert.equal(skillsView.props.children.type, "skills-page");

const appearance = await load("appearance-settings");
assert.deepEqual(Object.keys(appearance), ["AppearanceSettings"]);
assert.equal(globalThis.__settingsLeafTest.generalInits, 2);
const appearanceView = appearance.AppearanceSettings();
assert.equal(appearanceView.type, "section");
assert.equal(appearanceView.props["data-settings-section"], "appearance");
assert.equal(appearanceView.props.children[0].props.children, "Appearance");
assert.equal(appearanceView.props.children[1].type, "appearance-content");

const external = await load("settings-external-section");
assert.deepEqual(Object.keys(external), ["SettingsExternalSection"]);
const externalView = external.SettingsExternalSection();
assert.equal(externalView.type, "section");
assert.equal(externalView.props["data-settings-section"], "environments");
assert.equal(externalView.props.children[0].props.children, "Environments");
assert.match(externalView.props.children[1].props.children, /browser/);

const mcp = await load("mcp-settings");
assert.deepEqual(Object.keys(mcp), ["McpSettings"]);
assert.equal(globalThis.__settingsLeafTest.pluginInits, 2);
const mcpView = mcp.McpSettings();
assert.equal(mcpView.type, "section");
assert.equal(mcpView.props["data-settings-section"], "mcp-settings");
assert.equal(mcpView.props.children[2].type, "plugins-settings");
assert.equal(mcpView.props.children[2].props.manageOnly, true);

const time = await load("time-management-settings");
assert.deepEqual(Object.keys(time), ["ChatGptTimeManagementSettings"]);
const timeView = time.ChatGptTimeManagementSettings();
assert.equal(timeView.type, "navigate");
assert.equal(timeView.props.replace, true);
assert.equal(timeView.props.to.pathname, "/settings/safety");
assert.equal(timeView.props.to.hash, "#focus");
assert.equal(new URLSearchParams(timeView.props.to.search).get("view"), "time-management");
globalThis.__settingsLeafTest.location = { hash: "", pathname: "/settings/time", search: "?view=quiet-hours", state: null };
assert.equal(new URLSearchParams(time.ChatGptTimeManagementSettings().props.to.search).get("view"), "quiet-hours");

const consumer = await load("consumer-view-settings");
assert.deepEqual(Object.keys(consumer), ["ConsumerViewSettings"]);
assert.equal(globalThis.__settingsLeafTest.billingInits, 1);
const consumerView = consumer.ConsumerViewSettings({ isPolling: false });
assert.equal(consumerView.type, "Fragment");
assert.match(consumerView.props.children[0].props.children, /internal testing/);
assert.equal(consumerView.props.children[1].type, "billing-analytics");
assert.equal(consumerView.props.children[1].props.scope, "consumer");
assert.equal(consumerView.props.children[1].props.isPolling, false);
assert.equal(consumerView.props.children[1].props.workspaceTaskUsage, true);

const usage = await load("usage-analytics-settings");
assert.deepEqual(Object.keys(usage), ["UsageAnalyticsSettings"]);
assert.equal(globalThis.__settingsLeafTest.billingInits, 2);
assert.equal(usage.UsageAnalyticsSettings({ isAccessLoading: true }).props.children, "Loading usage…");
assert.equal(usage.UsageAnalyticsSettings({ plan: "plus" }).props.scope, "consumer");
assert.equal(usage.UsageAnalyticsSettings({ plan: "business" }).props.scope, "business");
assert.equal(usage.UsageAnalyticsSettings({ plan: "team" }).props.scope, "workspace");
assert.equal(usage.UsageAnalyticsSettings({ plan: "enterprise", isUsdWorkspace: true }).props.isUsdWorkspace, true);
assert.equal(usage.UsageAnalyticsSettings({ plan: "plus", canViewCreditSettings: true }).props.canViewCreditSettings, true);

const profile = await load("profile-settings-entry");
assert.deepEqual(Object.keys(profile), ["ProfileSettings"]);
assert.equal(globalThis.__settingsLeafTest.profileInits, 1);
const profileView = profile.ProfileSettings({ today: "2026-09-28" });
assert.equal(profileView.type, "profile-view");
assert.equal(profileView.props.today, "2026-09-28");
assert.equal(profileView.props.isProfileV2Enabled, false);
const profileLayout = profileView.props.Layout({ children: "body", header: "header", isEditPaneOpen: true });
assert.equal(profileLayout.type, "div");
assert.match(profileLayout.props.className, /@max-2xl:hidden/);
assert.equal(profileLayout.props.children[0].props.children, "header");
assert.equal(profileLayout.props.children[1].props.children, "body");
const errorLayout = profileView.props.Layout({ children: "error", header: "back", isError: true });
assert.equal(errorLayout.type, "section");
assert.equal(errorLayout.props["data-profile-error"], "true");

assertReleaseOwner("plugins-settings-core");

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(`${assertionCount} settings leaf cluster assertions passed`);
