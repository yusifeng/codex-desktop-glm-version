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

const pluginSetupReleaseAssertions = assertReleaseOwner("plugin-setup");

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

const restoredOwnerAssertions = pluginSetupReleaseAssertions + hostedActionsReleaseAssertions +
  assertReleaseOwner("hosted-plugin-create-dialog") +
  assertReleaseOwner("create-dialog");

console.log(`plugin creation support cluster complete with ${restoredOwnerAssertions} release assertions`);
