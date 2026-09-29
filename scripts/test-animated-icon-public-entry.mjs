import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/animated-icon-public-entry/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const calls = { initialized: 0, props: [] };
globalThis.__animatedIconEntry = calls;
const result = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "animated-icon-entry-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: module === "animated-icon" ? "const c=globalThis.__animatedIconEntry;export const n=()=>{c.initialized++};export const t=props=>{c.props.push(props);if(props?.fail)throw Error('animation failed');return {type:'animated-icon',props};};" : "export {};", loader: "js" })); } }] });
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
let assertions = 0;
function equal(actual, expected) { assertions++; assert.equal(actual, expected); }
function deepEqual(actual, expected) { assertions++; assert.deepEqual(actual, expected); }
function ok(value) { assertions++; assert.ok(value); }

deepEqual(Object.keys(module), ["AnimatedIcon"]);
equal(/\bany\b/.test(source), false);
equal(/import \* as/.test(source), false);
deepEqual([...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^"]+)"/g)].map((match) => match[1]), ["app-shared", "app-initial", "animated-icon"]);
deepEqual([...source.matchAll(/import\("@rchunk\/([^"]+)"\)/g)].map((match) => match[1]), []);
equal(calls.initialized, 1);
equal(typeof module.AnimatedIcon, "function");

const onComplete = () => {};
const rendered = module.AnimatedIcon({ animation: "loader", animated: false, loop: false, color: "red", onComplete });
equal(rendered.type, "animated-icon");
equal(rendered.props.animation, "loader");
equal(rendered.props.animated, false);
equal(rendered.props.loop, false);
equal(rendered.props.color, "red");
equal(rendered.props.onComplete, onComplete);
deepEqual(calls.props, [rendered.props]);
equal(calls.initialized, 1);

let thrown;
try { module.AnimatedIcon({ animation: "hello", fail: true }); } catch (error) { thrown = error; }
ok(thrown instanceof Error);
equal(thrown.message, "animation failed");
equal(calls.props.at(-1).animation, "hello");
equal(calls.initialized, 1);

console.log(`animated-icon-public-entry tests passed (${assertions} assertions)`);
