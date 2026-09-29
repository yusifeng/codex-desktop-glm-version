import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/browser-extension-profile-state-entry/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const calls = { initialized: 0, invocations: [] };
const initializeProfile = (...args) => {
  calls.invocations.push(args);
  if (args[0] === "throw") throw new Error("profile initialization failed");
  return { initialized: true, args };
};
globalThis.__browserExtensionProfileStateEntry = { calls, initializeProfile };

const result = await esbuild.build({
  entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
  plugins: [{ name: "browser-extension-profile-state-entry-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\/browser-extension-profile-state$/ }, () => ({ path: "profile-state", namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, () => ({
      contents: "const state=globalThis.__browserExtensionProfileStateEntry;export const n=()=>{state.calls.initialized++};export const r=state.initializeProfile;",
      loader: "js",
    }));
  } }],
});
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
let assertions = 0;
function equal(actual, expected) { assertions++; assert.equal(actual, expected); }
function deepEqual(actual, expected) { assertions++; assert.deepEqual(actual, expected); }
function ok(value) { assertions++; assert.ok(value); }

deepEqual(Object.keys(module), ["initializeBrowserExtensionProfile"]);
equal(/\bany\b/.test(source), false);
equal(/import \* as/.test(source), false);
deepEqual([...source.matchAll(/from "@rchunk\/([^"]+)"/g)].map((match) => match[1]), ["browser-extension-profile-state"]);
deepEqual([...source.matchAll(/import\("@rchunk\/([^"]+)"\)/g)].map((match) => match[1]), []);
equal(calls.initialized, 1);
equal(module.initializeBrowserExtensionProfile, initializeProfile);

const host = { id: "browser-host" };
deepEqual(module.initializeBrowserExtensionProfile(host, "profile-1"), { initialized: true, args: [host, "profile-1"] });
deepEqual(calls.invocations, [[host, "profile-1"]]);
equal(calls.initialized, 1);

let thrown;
try { module.initializeBrowserExtensionProfile("throw"); } catch (error) { thrown = error; }
ok(thrown instanceof Error);
equal(thrown.message, "profile initialization failed");
deepEqual(calls.invocations.at(-1), ["throw"]);
equal(calls.initialized, 1);

console.log("browser-extension-profile-state-entry tests passed (" + assertions + " assertions)");
