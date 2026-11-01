import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__ambientDebugStateTest = {
  cleared: [],
  stored: new Map([["ambient-suggestions:default-statuses:host:/repo", { one: "accepted", two: "pending" }]]),
};
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/new-chat-suggestion-source-debug-state/index.ts")],
  bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
  plugins: [{ name: "ambient-debug-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: value }) => ({ path: value.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: value }) => ({ loader: "js", contents: value === "app-shared" ? `
      export const FX=()=>{}; export const QI=()=>{}; export const ZI="app-scope";
      export const eZ=(scope,getOptions)=>({kind:"query",scope,getOptions});
      export const oZ=(scope,initial)=>({kind:"signal-family",scope,initial});
      export const rZ=(scope,derive)=>({kind:"derived-family",scope,derive});
    ` : value === "app-initial" ? `
      const state=globalThis.__ambientDebugStateTest;
      export const dun=(key,value)=>({key,value});
      export const eun=(scope,name,options)=>({kind:"server-query",scope,name,options});
      export const ign=(prefix)=>state.cleared.push(prefix);
      export const mnt=()=>{}; export const nun=()=>{}; export const rgn=()=>{}; export const uun=()=>{};
      export const ngn=(key,fallback)=>state.stored.get(key)??fallback;
      export const pnt={ambientSuggestions:{getGenerationStatuses:async()=>["ready"]}};
    ` : "export {};" }));
  }}],
});
const mod = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
mod.c();
assert.equal(mod.a.name, "ambient-suggestions");
assert.equal(mod.a.options({ projectRoot: "/repo" }).enabled, true);
assert.equal(mod.a.options({ projectRoot: null }).enabled, false);
assert.deepEqual(mod.i.getOptions().queryKey, ["ambient-suggestions-generation-statuses"]);
assert.equal(mod.i.getOptions().refetchInterval, 1000);
assert.equal(mod.s.name, "ambient-suggestions-refresh");
assert.equal(mod.r.initial(), null);
const scope = { domain: null, hostId: "host", projectRoot: "/repo" };
assert.deepEqual(mod.l.derive(scope, { get: () => null }), ["one", "two"]);
assert.equal(mod.o.derive(scope, { get: () => ({ data: null, isError: true }) }), true);
const suggestions = [
  { id: "a", status: "pending" }, { id: "b", status: "accepted" },
  { id: "c", status: "pending" }, { id: "d", status: "pending" }, { id: "e", status: "pending" },
];
const pending = mod.p.derive(scope, { get: () => ({ data: { file: { currentSuggestionIds: ["b", "a", "c", "d", "e"], suggestions } } }) });
assert.deepEqual(pending.map((value) => value.id), ["a", "c", "d"]);
let written;
const writer = { set(_signal, update) { written = typeof update === "function" ? update(null) : update; } };
mod.f(writer, scope, "three", "dismissed");
assert.equal(written["ambient-suggestions:default-statuses:host:/repo"].three, "dismissed");
let updated;
mod.d({ query: { snapshot() { return { setData(update) { updated = update({ file: { currentSuggestionIds: ["a"], suggestions: [{ id: "a", status: "pending" }] } }); } }; } } }, scope, "a", "accepted");
assert.equal(updated.file.suggestions[0].status, "accepted");
mod.u(writer);
assert.deepEqual(written, {});
assert.deepEqual(globalThis.__ambientDebugStateTest.cleared, ["ambient-suggestions:default-statuses:"]);
mod.t();
assert.equal(mod.n.key, "electron:new-chat-suggestion-source-debug-override");
console.log("15 new-chat suggestion debug-state assertions passed");
