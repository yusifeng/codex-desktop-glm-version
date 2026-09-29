import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/plan-side-panel-entry/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const calls = { initialized: 0, invocations: [] };
const activePlan = { id: "active-plan" };
const planByKey = { id: "plan-by-key" };
const contentByKey = { id: "content-by-key" };
const openPlan = (...args) => { calls.invocations.push(["open", args]); return { kind: "open", args }; };
const openReadonly = (...args) => { calls.invocations.push(["readonly", args]); if (args[0] === "throw") throw new Error("readonly failed"); return { kind: "readonly", args }; };
globalThis.__planSidePanelEntry = { calls, activePlan, planByKey, contentByKey, openPlan, openReadonly };
const result = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "mocks", setup(build) {
  build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
  build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => {
    if (module === "editable-plan-tab") return { contents: "const s=globalThis.__planSidePanelEntry;export const a=s.contentByKey;export const i=s.planByKey;export const r=s.activePlan;", loader: "js" };
    return { contents: "const s=globalThis.__planSidePanelEntry;export const n=s.openPlan;export const r=s.openReadonly;export const t=()=>{s.calls.initialized++};", loader: "js" };
  });
} }] });
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
let assertions = 0;
const equal = (actual, expected) => { assertions++; assert.equal(actual, expected); };
const deepEqual = (actual, expected) => { assertions++; assert.deepEqual(actual, expected); };
const ok = (value) => { assertions++; assert.ok(value); };
deepEqual(Object.keys(module), ["activePlan$", "editablePlanByKey$", "editablePlanContentByKey$", "openPlanSidePanel", "openReadOnlyPlanSidePanel"]);
equal(/\bany\b/.test(source), false);
equal(/import \* as/.test(source), false);
deepEqual([...source.matchAll(/from "@rchunk\/([^"]+)"/g)].map((match) => match[1]), ["editable-plan-tab", "plan-side-panel"]);
equal(calls.initialized, 1);
equal(module.activePlan$, activePlan);
equal(module.editablePlanByKey$, planByKey);
equal(module.editablePlanContentByKey$, contentByKey);
equal(module.openPlanSidePanel, openPlan);
equal(module.openReadOnlyPlanSidePanel, openReadonly);
deepEqual(module.openPlanSidePanel("scope", { key: "plan-1" }), { kind: "open", args: ["scope", { key: "plan-1" }] });
let thrown;
try { module.openReadOnlyPlanSidePanel("throw"); } catch (error) { thrown = error; }
ok(thrown instanceof Error);
equal(thrown.message, "readonly failed");
equal(calls.initialized, 1);
console.log("plan-side-panel-entry tests passed (" + assertions + " assertions)");
