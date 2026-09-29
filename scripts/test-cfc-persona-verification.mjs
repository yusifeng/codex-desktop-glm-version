import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/cfc-persona-verification/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const state = {
  abortSignals: [],
  clients: [],
  destroyed: 0,
  events: [],
  inquiry: { id: "inquiry-1" },
  initialized: 0,
  opened: 0,
  postCalls: [],
};
globalThis.__cfcPersona = state;

const initializer = "()=>{globalThis.__cfcPersona.initialized+=1}";
const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const s=globalThis.__cfcPersona;",
    "export const H3=" + initializer + ";",
    "export const V3=async(loader,deps,url)=>{s.events.push(['load',deps,url]);return loader()};",
  ].join("\n"),
  "app-initial": [
    "const s=globalThis.__cfcPersona;",
    "export const cJt=" + initializer + ";",
    "export const rJt={safePost:async(path,options)=>{s.postCalls.push([path,options]);s.abortSignals.push(options.signal);if(s.postError)throw s.postError;return s.inquiry}};",
  ].join("\n"),
  "persona-runtime": [
    "const s=globalThis.__cfcPersona;",
    "class Client{constructor(options){this.options=options;s.clients.push(this)}open(){s.opened+=1}destroy(){s.destroyed+=1}}",
    "export default {Client};",
  ].join("\n"),
};

const result = await esbuild.build({
  entryPoints: [sourcePath],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "cfc-persona-mocks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
        path: importPath.slice(8),
        namespace: "mock",
      }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: moduleName }) => ({
        contents: mocks[moduleName] ?? "export {};",
        loader: "js",
      }));
    },
  }],
});
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
function tick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

assert.deepEqual(Object.keys(module), ["n", "t"]); assertions += 1;
const { n: openPersonaVerification, t: initializePersonaVerification } = module;
assert.equal(typeof openPersonaVerification, "function"); assertions += 1;
assert.equal(typeof initializePersonaVerification, "function"); assertions += 1;
assert.equal(state.initialized, 2); assertions += 1;
assert.deepEqual(
  [...source.matchAll(/^import(?:\s+[^"\n]+?\s+from)?\s+"@rchunk\/([^"]+)";$/gm)]
    .map((match) => match[1]),
  ["rolldown-runtime", "app-shared", "app-initial"],
); assertions += 1;
assert.deepEqual(
  [...source.matchAll(/import\("@rchunk\/([^"]+)"\)/g)].map((match) => match[1]),
  ["persona-runtime"],
); assertions += 1;
assert.equal(/\bany\b/.test(source), false); assertions += 1;
assert.equal(/\b(?:appSharedChunk|appInitialChunk)\s*\./.test(source), false); assertions += 1;

const received = [];
const dispose = openPersonaVerification({
  accountId: "account-1",
  onLoad: () => received.push("load"),
  onComplete: () => received.push("complete"),
  onCancel: () => received.push("cancel"),
  onError: (error) => received.push(error.message),
});
await tick();
check(state.postCalls[0][0] === "/compliance/npi_verification/persona/inquiries", "creates a Persona inquiry");
check(state.postCalls[0][1].additionalHeaders["Chatgpt-Account-Id"] === "account-1", "scopes inquiry to account");
check(state.events[0][0] === "load" && state.events[0][1][0] === "persona-runtime", "loads Persona runtime in parallel");
check(state.opened === 1 && state.clients.length === 1, "opens Persona client");
state.clients[0].options.onLoad();
check(received[0] === "load", "forwards load callback");
state.clients[0].options.onComplete();
check(received.includes("complete") && state.destroyed === 1, "completes and destroys client");
check(state.abortSignals[0].aborted, "aborts inquiry lifecycle on completion");
dispose();
check(state.destroyed === 1, "dispose is idempotent");

state.postError = new Error("network down");
openPersonaVerification({
  onCancel() {},
  onComplete() {},
  onError: (error) => received.push(error.message),
});
await tick();
check(received.at(-1) === "network down", "forwards startup failures");

console.log(assertions + " CFC Persona assertions passed");
