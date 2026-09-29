import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/chatgpt-token-auth-browser/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const calls = { initialized: 0, invocations: [] };
const changedEvent = Symbol("browser-auth-changed");
const contextChangedEvent = Symbol("browser-auth-context-changed");
const functionAliases = [
  "Bun", "Fun", "Gun", "Hun", "Iun", "Jun", "Kun", "Lun", "Mun",
  "Nun", "Pun", "Uun", "Vun", "Wun", "Xun", "Yun", "qun", "zun",
];
const functions = Object.fromEntries(functionAliases.map((alias) => [alias, (...args) => {
  calls.invocations.push({ alias, args });
  if (args[0] === "throw") throw new Error(alias + " failed");
  return { alias, args };
}]));
globalThis.__chatGptTokenAuthBrowser = { calls, changedEvent, contextChangedEvent, functions };

const result = await esbuild.build({
  entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
  plugins: [{ name: "chatgpt-token-auth-browser-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\/app-initial$/ }, () => ({ path: "app-initial", namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, () => ({
      contents: "const state=globalThis.__chatGptTokenAuthBrowser;export const Aun=state.changedEvent;export const jun=state.contextChangedEvent;export const Run=()=>{state.calls.initialized++};" + functionAliases.map((alias) => "export const " + alias + "=state.functions." + alias + ";").join(""),
      loader: "js",
    }));
  } }],
});
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
let assertions = 0;
function equal(actual, expected) { assertions++; assert.equal(actual, expected); }
function deepEqual(actual, expected) { assertions++; assert.deepEqual(actual, expected); }
function ok(value) { assertions++; assert.ok(value); }

const expectedExports = [
  "BROWSER_AUTH_CHANGED_EVENT", "BROWSER_AUTH_CONTEXT_CHANGED_EVENT", "beginBrowserWorkspaceSwitch", "clearBrowserAuth",
  "getBrowserAuthPageUrl", "getBrowserChatGptAuthGeneration", "getBrowserChatGptAuthSnapshot", "getBrowserChatGptDocumentAuth",
  "isBrowserChatGptSignedOut", "isBrowserWorkspaceSwitchPending", "loadBrowserChatGptAuth", "markBrowserChatGptSignedOut",
  "maybeRedirectToBrowserChatGptLogin", "maybeRedirectToBrowserChatGptLogout", "readChatGptTokenClaims",
  "redirectToBrowserChatGptLogin", "refreshBrowserChatGptAuth", "runWithBrowserAuthSessionLock", "saveBrowserChatGptAuth",
  "updateBrowserChatGptAccessToken",
];
deepEqual(Object.keys(module), expectedExports);
equal(/\bany\b/.test(source), false);
equal(/import \* as/.test(source), false);
deepEqual([...source.matchAll(/from "@rchunk\/([^"]+)"/g)].map((match) => match[1]), ["app-initial"]);
deepEqual([...source.matchAll(/import\("@rchunk\/([^"]+)"\)/g)].map((match) => match[1]), []);
equal(calls.initialized, 1);
equal(module.BROWSER_AUTH_CHANGED_EVENT, changedEvent);
equal(module.BROWSER_AUTH_CONTEXT_CHANGED_EVENT, contextChangedEvent);

const exportToAlias = {
  beginBrowserWorkspaceSwitch: "Mun", clearBrowserAuth: "Nun", getBrowserAuthPageUrl: "Pun",
  getBrowserChatGptAuthGeneration: "Fun", getBrowserChatGptAuthSnapshot: "Iun", getBrowserChatGptDocumentAuth: "Lun",
  isBrowserChatGptSignedOut: "zun", isBrowserWorkspaceSwitchPending: "Bun", loadBrowserChatGptAuth: "Vun",
  markBrowserChatGptSignedOut: "Hun", maybeRedirectToBrowserChatGptLogin: "Uun", maybeRedirectToBrowserChatGptLogout: "Wun",
  readChatGptTokenClaims: "Gun", redirectToBrowserChatGptLogin: "Kun", refreshBrowserChatGptAuth: "qun",
  runWithBrowserAuthSessionLock: "Jun", saveBrowserChatGptAuth: "Yun", updateBrowserChatGptAccessToken: "Xun",
};
for (const [exportName, alias] of Object.entries(exportToAlias)) equal(module[exportName], functions[alias]);

const first = module.saveBrowserChatGptAuth("account-1", { token: "secret" });
deepEqual(first, { alias: "Yun", args: ["account-1", { token: "secret" }] });
deepEqual(calls.invocations.at(-1), { alias: "Yun", args: ["account-1", { token: "secret" }] });
const lock = () => "locked";
deepEqual(module.runWithBrowserAuthSessionLock("session-1", lock), { alias: "Jun", args: ["session-1", lock] });
equal(calls.initialized, 1);

let thrown;
try { module.refreshBrowserChatGptAuth("throw"); } catch (error) { thrown = error; }
ok(thrown instanceof Error);
equal(thrown.message, "qun failed");
equal(calls.invocations.at(-1).alias, "qun");
equal(calls.initialized, 1);

console.log("chatgpt-token-auth-browser tests passed (" + assertions + " assertions)");
