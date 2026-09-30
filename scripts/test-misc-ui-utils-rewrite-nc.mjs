import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const publishedRoot = "/Users/david/Workspace/ppio_github/chatgpt-desktop-src/app/webview/assets";
const modules = [
  ["commentary-36eecb6e11d3.js", "commentary", ["a", "i", "n", "o", "r", "s", "t"]],
  ["cone-visualization-221d5bdd2dfe.js", "cone-visualization", ["n", "t"]],
  ["connect-code-execution-sandbox-b02ae1d03047.js", "code-execution-sandbox-connection", ["n", "t"]],
  ["constant-acceleration-visualization-5cb4c2e637e4.js", "constant-acceleration-visualization", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["content-960bb4aa1af7.js", "ode-content-parser", ["i", "n", "r", "t"]],
  ["create-session-976e086b152c.js", "create-session", ["n", "t"]],
  ["details-cache-7f541ad230b1.js", "details-cache", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["eligibility-d6f5d74b3829.js", "eligibility", ["a", "i", "n", "o", "r", "t"]],
  ["equation-44cf0b1d4b75.js", "equation-analysis", ["S", "_", "a", "b", "c", "d", "f", "g", "h", "i", "l", "m", "n", "o", "p", "r", "s", "t", "u", "v", "x", "y"]],
  ["expand-15b520e3daf3.js", "expand", ["_", "a", "c", "d", "f", "g", "h", "i", "l", "m", "n", "o", "p", "r", "s", "t", "u", "v"]],
  ["external-agent-import-setup-66dccaf0e5b4.js", "external-agent-import-setup", ["ExternalAgentImportSetupModal"]],
];
const dependencyAliases = new Map([
  ["defaultLocale", "default-locale"],
  ["init", "scale-init"],
  ["constant", "constant-accessor"],
  ["learning-model-kinematics-velocity", "type"],
  ["array-like-to-array-runtime", "array"],
]);
const normalizeDependency = (name) => dependencyAliases.get(name.replace(/-[a-f0-9]{12}$/u, "")) ?? name.replace(/-[a-f0-9]{12}$/u, "");
const dependencies = (source, pattern) => [...source.matchAll(pattern)].map((match) => normalizeDependency(match[1]));

let assertions = 0;
for (const [asset, directory] of modules) {
  const original = fs.readFileSync(path.join(publishedRoot, asset), "utf8");
  const recovered = fs.readFileSync(path.join(root, "src/renderer", directory, "index.ts"), "utf8");
  assert.deepEqual(dependencies(original, /from "\.\/([^".]+(?:-[^".]+)?)\.js"/gu), dependencies(recovered, /(?:from\s*|import\s*)["']@rchunk\/([^"']+)/gu));
  assert.equal((original.match(/import\(/gu) ?? []).length, (recovered.match(/import\(/gu) ?? []).length);
  assert.equal(/(?:\bas\s+any\b|:\s*any\b|<any>)|@ts-(?:expect-error|nocheck)/u.test(recovered), false);
  assert.ok(recovered.includes("Release chunk: " + asset));
  assert.equal(/from\s+["']\./u.test(recovered), false);
  assertions += 5;
}

const universal = new Proxy(function universalFunction() { return universal; }, {
  get(_target, key) {
    if (key === "then") return undefined;
    if (key === "safeParse") return (value) => ({ success: true, data: value });
    if (key === Symbol.iterator) return function* iterator() {};
    return universal;
  },
});
const once = (initializer) => {
  let initialized = false;
  return () => { if (!initialized) { initialized = true; initializer(); } };
};
const jsx = { Fragment: "Fragment", jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
const typeSpecification = { parameters: {
  initialVelocityMetersPerSecond: { defaultValue: 0, min: -30, max: 30 },
  accelerationMetersPerSecondSquared: { defaultValue: 2, min: -20, max: 20 },
  timeSeconds: { defaultValue: 5, min: 0, max: 20 },
} };
globalThis.__ncMocks = {
  "rolldown-runtime": { n: once, o: (value) => ({ default: value }) },
  "app-shared": new Proxy({
    I3: () => jsx,
    n4: () => ({ formatMessage: ({ defaultMessage }) => defaultMessage }),
    g4() {},
    q4: () => universal,
    E4: () => ({ catch: () => ({ catch: () => ({ parse: (value) => value }) }) }),
  }, { get: (target, key) => target[key] ?? universal }),
  "type-d8ff967dcf16": { n: typeSpecification, t() {} },
  "learning-model-kinematics-velocity": { n: typeSpecification, t() {} },
  "linear": { C: (value) => value },
};
globalThis.__ncUniversal = universal;

function importedNames(source, alias) {
  const names = new Set();
  const pattern = /import\s*\{([\s\S]*?)\}\s*from\s*["']@rchunk\/([^"']+)["']/g;
  for (const match of source.matchAll(pattern)) {
    if (match[2] !== alias) continue;
    for (const part of match[1].split(",")) {
      const name = part.trim().split(/\s+as\s+/u)[0];
      if (name) names.add(name);
    }
  }
  return [...names];
}
async function load(directory) {
  const entry = path.join(root, "src/renderer", directory, "index.ts");
  const source = fs.readFileSync(entry, "utf8");
  const output = path.join(os.tmpdir(), "nc-" + directory + "-" + process.pid + "-" + Date.now() + ".mjs");
  await esbuild.build({
    entryPoints: [entry], outfile: output, bundle: true, format: "esm", platform: "node",
    plugins: [{ name: "nc-rchunk-mocks", setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, (args) => ({ path: args.path.slice(8), namespace: "nc-mock" }));
      build.onLoad({ filter: /.*/, namespace: "nc-mock" }, ({ path: alias }) => ({
        loader: "js",
        contents: importedNames(source, alias).map((name) => "export const " + name + "=globalThis.__ncMocks[" + JSON.stringify(alias) + "]?.[" + JSON.stringify(name) + "]??globalThis.__ncUniversal;").join("\n"),
      }));
    } }],
  });
  return import(pathToFileURL(output).href + "?v=" + Date.now());
}

for (const [, directory, expectedExports] of modules) {
  const loaded = await load(directory);
  assert.deepEqual(Object.keys(loaded).sort(), [...expectedExports].sort());
  assertions += 1;
}

const ode = await load("ode-content-parser");
ode.t();
assert.deepEqual(ode.i("\\frac{dy}{dx}=2x; y=x^2+C"), { odeContent: "\\frac{dy}{dx}=2x", solutionFormula: "y=x^2+C" });
assert.equal(ode.n({ content: "y'=y\\quad y=e^x" }), "y'=y");
assert.equal(ode.r("dy/dx=x; y(x)=x^2/2"), "y(x)=x^2/2");
assert.equal(ode.i("y=x").odeContent, "y=x");
assertions += 4;

const eligibility = await load("eligibility");
eligibility.a();
assert.equal(eligibility.o("currency_ineligible"), true);
assert.equal(eligibility.o("not_real"), false);
assert.equal(eligibility.i("redemption_attempt_limit_exceeded"), "attempt_limit");
assert.deepEqual(eligibility.t(
  { account: { processor: { a001: { has_customer_object: true } } }, entitlement: { has_active_subscription: false, billing_currency: "USD" } },
  { balance: -250, currency: "usd", has_redeemed_gift_card: true },
  { restrictionsEnabled: true, countryEligible: true },
), { canRedeem: true, showWallet: true, usdBalance: -250 });
assertions += 4;

const acceleration = await load("constant-acceleration-visualization");
acceleration.s();
const motion = acceleration.c({ initialVelocity: 2, acceleration: 3, time: 4 });
assert.equal(motion.finalVelocity, 14);
assert.equal(motion.displacement, 32);
assert.equal(motion.finalVelocitySquared, 196);
assert.equal(acceleration.o(motion, 2), 10);
assert.equal(acceleration.c({ initialVelocity: 1000, acceleration: -1000, time: -5 }).time, 0);
assertions += 5;

const commentary = await load("commentary");
const progress = { spawnId: "progress", content: { type: "cot-v5-progress", fallbackText: null, progress: { id: "p", texts: ["working"], toolIcons: [] } } };
assert.equal(commentary.i([null, progress]), progress);
assert.equal(commentary.i([{ spawnId: "empty", content: { type: "legacy-text", text: null } }]), null);
assertions += 2;

const details = await load("details-cache");
const baseProduct = { id: "p", image_urls: ["old"], shopping_vto: { version: "v0", eligible: true, generated_images: [{ original_image_url: "old", vto_image_url: "vto-old" }] }, offers: [{ seller_name: "Shop", url: "https://www.shop.example/item", price: 10 }] };
assert.deepEqual(details.o(baseProduct), ["vto-old"]);
assert.equal(details.c(baseProduct), true);
const merged = details.a(baseProduct, { image_urls: ["new"], offers: [{ seller_name: "Shop", url: "https://shop.example/other", price: 12 }] }, baseProduct);
assert.deepEqual(merged.image_urls, ["old", "new"]);
assert.equal(merged.offers.length, 1);
assert.equal(merged.offers[0].price, 12);
assertions += 5;

const expand = await load("expand");
assert.equal(expand.v([0, 10, 20], 0.25), 5);
assert.equal(expand.v([0, 10, 20], 0.5), 10);
assert.deepEqual(expand.o(["a", "b", "c"]), [0, 1, 2]);
assertions += 3;

const sandbox = await load("code-execution-sandbox-connection");
assert.doesNotThrow(() => sandbox.n());
assertions += 1;

console.log("misc-ui-utils NC: " + assertions + " assertions passed across " + modules.length + " modules.");
