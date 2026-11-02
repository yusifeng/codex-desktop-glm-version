import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsx = { Fragment: Symbol("Fragment"), jsx: (type, props, key) => ({ type, props: props ?? {}, key }), jsxs: (type, props, key) => ({ type, props: props ?? {}, key }) };
globalThis.__jsx = jsx;
async function load(name) {
  const result = await esbuild.build({ entryPoints: [path.join(ROOT, `src/renderer/${name}/index.ts`)], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({ path: modulePath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: modulePath }) => modulePath === "app-shared" ? { loader: "js", contents: "export const I3=()=>globalThis.__jsx;" } : { loader: "js", contents: "export {};" });
  } }] });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${name}`);
}

const lock = await load("profile-lock");
lock.n();
const lockIcon = lock.t({ className: "icon-sm", title: "Private" });
assert.equal(lockIcon.type, "svg");
assert.equal(lockIcon.props.className, "icon-sm");
assert.equal(lockIcon.props.role, "img");
assert.equal(lockIcon.props["aria-label"], "Private");
assert.equal(lockIcon.props.children.props.children.length, 2);
assert.equal(lock.t().props.role, undefined);

const messages = await load("browser-extension-setup-messages");
messages.r();
assert.equal(messages.n("chrome").defaultMessage, "ChatGPT for Chrome");
assert.equal(messages.t("chrome").defaultMessage, "Install this extension in Chrome to connect ChatGPT to your browser");
assert.equal(messages.n("edge").defaultMessage, "ChatGPT for Edge");
assert.equal(messages.t("edge").defaultMessage, "Install this extension in Edge to connect ChatGPT to your browser");
assert.equal(messages.n("unknown").defaultMessage, "ChatGPT browser extension");
assert.equal(messages.t("unknown").defaultMessage, "Install this extension to connect ChatGPT to your browser");

const setup = await load("plugin-setup");
setup.r();
const calendarApp = { id: "Google-Calendar" };
const calendarPlugin = { marketplaceName: "openai", canonicalAppId: "google_calendar", plugin: { id: "calendar-plugin", name: "Calendar" } };
assert.equal(setup.a(calendarApp, calendarPlugin), true);
assert.equal(setup.a({ id: "drive" }, calendarPlugin), false);
assert.equal(setup.a(calendarApp, { ...calendarPlugin, marketplaceName: undefined }), false);
assert.equal(setup.n.key, "plugin-setup-state");
const readyInput = { status: "ready", data: { kind: "plugin-directory", candidates: [{ id: "Calendar" }, { id: "Slack" }], directoryApps: [], runtimeApps: [{ id: "Slack", isAccessible: true }] } };
const merged = setup.t({ inputsResult: readyInput, pluginDirectory: { errorMessage: null, isLoading: false, plugins: [calendarPlugin], refetch() {} } });
assert.equal(merged.status, "ready");
assert.equal(merged.data.importedPlugins.length, 1);
assert.equal(merged.data.importedPlugins[0].plugin.plugin.id, "calendar-plugin");
assert.deepEqual(merged.data.appsRequiringConnection, []);
assert.equal(setup.t({ inputsResult: readyInput, pluginDirectory: { isLoading: true, plugins: [], refetch() {} } }).status, "loading");
const retry = () => {};
const failed = setup.t({ inputsResult: readyInput, pluginDirectory: { errorMessage: "offline", isLoading: false, plugins: [], refetch: retry } });
assert.equal(failed.status, "error");
assert.equal(failed.retry, retry);
const complete = { status: "ready", data: { kind: "complete", setup: { appsRequiringConnection: [calendarApp], importedPlugins: [] } } };
assert.deepEqual(setup.t({ inputsResult: complete, pluginDirectory: { isLoading: false, plugins: [], refetch() {} } }).data, complete.data.setup);
const loadingInput = { status: "loading" };
assert.equal(setup.t({ inputsResult: loadingInput, pluginDirectory: { isLoading: false, plugins: [], refetch() {} } }), loadingInput);

const category = await load("category-plugins-query");
category.n();
const categoryQuery = category.t({ categorySlug: "productivity", hostId: "local", searchQuery: " calendar ", visibility: { hiddenPluginIds: new Set(["hidden"]) } });
assert.deepEqual(categoryQuery.queryKey, ["plugins", "category", "local", "productivity", "search", "calendar"]);
assert.equal(categoryQuery.enabled, true);
assert.equal(categoryQuery.retry, false);
assert.equal(categoryQuery.getNextPageParam({ pagination: { next_page_token: "next" }, plugins: [] }), "next");
assert.equal(categoryQuery.getNextPageParam({ pagination: {}, plugins: [] }), undefined);
const selected = categoryQuery.select({ pages: [{ pagination: {}, plugins: [{ id: "one", remotePluginId: "shared" }, { id: "hidden" }] }, { pagination: {}, plugins: [{ id: "two", remotePluginId: "shared" }, { id: "three" }] }] });
assert.deepEqual(selected.map((plugin) => plugin.id), ["two", "three"]);
assert.deepEqual(category.t({ categorySlug: "all", hostId: "remote" }).queryKey, ["plugins", "category", "remote", "all"]);

const hostedActionsReleaseAssertions = assertReleaseOwner("hosted-plugin-creation-actions");

const restoredOwnerAssertions = hostedActionsReleaseAssertions +
  assertReleaseOwner("hosted-plugin-create-dialog") +
  assertReleaseOwner("create-dialog");

console.log(`plugin creation support cluster complete with ${restoredOwnerAssertions} release assertions`);
