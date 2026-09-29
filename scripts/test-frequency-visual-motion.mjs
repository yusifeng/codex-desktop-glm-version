import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/frequency-visual-motion/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const result = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "frequency-motion-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, () => ({ contents: "export {};", loader: "js" })); } }] });
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
let assertions = 0;
function equal(actual, expected) { assertions++; assert.equal(actual, expected); }
function deepEqual(actual, expected) { assertions++; assert.deepEqual(actual, expected); }
function ok(value) { assertions++; assert.ok(value); }
function close(actual, expected, tolerance = 1e-10) { assertions++; assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`); }

deepEqual(Object.keys(module), ["n", "t"]);
equal(/\bany\b/.test(source), false);
equal(/import \* as/.test(source), false);
deepEqual([...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^"]+)"/g)].map((match) => match[1]), ["rolldown-runtime"]);
deepEqual([...source.matchAll(/import\("@rchunk\/([^"]+)"\)/g)].map((match) => match[1]), []);
equal(typeof module.n, "function");
equal(typeof module.t, "function");
equal(module.n(), undefined);
equal(module.n(), undefined);

let motion = module.t(0.001);
close(motion.phaseSpeed, 0.35);
close(motion.visibleCycles, 1.2);
motion = module.t(0.25);
close(motion.phaseSpeed, Math.PI * 0.5);
close(motion.visibleCycles, 1.9);
motion = module.t(2);
close(motion.phaseSpeed, Math.PI * 4);
close(motion.visibleCycles, 3.8);
motion = module.t(4);
close(motion.phaseSpeed, Math.PI * 8);
close(motion.visibleCycles, 4.2);
motion = module.t(1000);
close(motion.phaseSpeed, Math.PI * 12);
close(motion.visibleCycles, 6.2);

const halfwayLow = Math.sqrt(0.001 * 0.25);
motion = module.t(halfwayLow);
close(motion.phaseSpeed, (0.35 + Math.PI * 0.5) / 2);
close(motion.visibleCycles, (1.2 + 1.9) / 2);
const halfwayCycles = Math.sqrt(4 * 100);
motion = module.t(halfwayCycles);
close(motion.visibleCycles, (4.2 + 5.6) / 2);
ok(motion.phaseSpeed > Math.PI * 8 && motion.phaseSpeed < Math.PI * 12);

deepEqual(module.t(0), module.t(0.001));
deepEqual(module.t(-10), module.t(0.001));
deepEqual(module.t(Number.NaN), module.t(0.001));
deepEqual(module.t(Number.NEGATIVE_INFINITY), module.t(0.001));
deepEqual(module.t(Number.POSITIVE_INFINITY), module.t(1000));
deepEqual(module.t(1e9), module.t(1000));
const reduced = module.t(0);
ok(Number.isFinite(reduced.phaseSpeed));
ok(Number.isFinite(reduced.visibleCycles));
equal(reduced.visibleCycles, 1.2);

console.log(`frequency-visual-motion tests passed (${assertions} assertions)`);
