import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__standaloneSvgTest = {
  jsx: {
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
};

async function bundle(directory) {
  const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "standalone-svg-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ loader: "js", contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__standaloneSvgTest.jsx;export const e6=()=>({});" : "export {};" }));
  } }] });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`);
}

const arrowCurved = await bundle("arrow-curved-right");
assert.equal(arrowCurved.t({}), null);
arrowCurved.n(); assert.equal(arrowCurved.t({}).type, "svg");
assert.equal(arrowCurved.t({ className: "custom" }).props.className, "custom");
assert.deepEqual(Object.keys(arrowCurved).sort(), ["n", "t"]);

const arrowRotate = await bundle("arrow-rotate-ccw");
assert.equal(arrowRotate.t({}), null);
arrowRotate.n(); assert.equal(arrowRotate.t({}).type, "svg");
assert.equal(arrowRotate.t({ className: "custom" }).props.className, "custom");
assert.deepEqual(Object.keys(arrowRotate).sort(), ["n", "t"]);

const barChart = await bundle("bar-chart-icon");
assert.equal(barChart.t({}), null);
barChart.n(); assert.equal(barChart.t({}).type, "svg");
assert.equal(barChart.t({ className: "custom" }).props.className, "custom");
assert.deepEqual(Object.keys(barChart).sort(), ["n", "t"]);

const documentSearch = await bundle("document-search-icon");
assert.equal(documentSearch.t({}), null);
documentSearch.n(); assert.equal(documentSearch.t({}).type, "svg");
assert.equal(documentSearch.t({ className: "custom" }).props.className, "custom");
assert.deepEqual(Object.keys(documentSearch).sort(), ["n", "t"]);

const fileBlank = await bundle("file-blank-icon");
assert.equal(fileBlank.t({}), null);
fileBlank.n(); assert.equal(fileBlank.t({}).type, "svg");
assert.equal(fileBlank.t({ className: "custom" }).props.className, "custom");
assert.deepEqual(Object.keys(fileBlank).sort(), ["n", "t"]);

const filter = await bundle("filter");
assert.equal(filter.t({}), null);
filter.n(); assert.equal(filter.t({}).type, "svg");
assert.equal(filter.t({ className: "custom" }).props.className, "custom");
assert.deepEqual(Object.keys(filter).sort(), ["n", "t"]);

const filterAlt = await bundle("filter-alt");
assert.equal(filterAlt.t({}), null);
filterAlt.n(); assert.equal(filterAlt.t({}).type, "svg");
assert.equal(filterAlt.t({ className: "custom" }).props.className, "custom");
assert.deepEqual(Object.keys(filterAlt).sort(), ["n", "t"]);

const filterAltBadged = await bundle("filter-alt-badged");
assert.equal(filterAltBadged.t({}), null);
filterAltBadged.n(); assert.equal(filterAltBadged.t({}).type, "svg");
assert.equal(filterAltBadged.t({ className: "custom" }).props.className, "custom");
assert.deepEqual(Object.keys(filterAltBadged).sort(), ["n", "t"]);

const folderLight = await bundle("folder-light-icon");
assert.equal(folderLight.t({}), null);
folderLight.n(); assert.equal(folderLight.t({}).type, "svg");
assert.equal(folderLight.t({ className: "custom" }).props.className, "custom");
assert.deepEqual(Object.keys(folderLight).sort(), ["n", "t"]);

const hand = await bundle("hand-icon");
assert.equal(hand.t({}), null);
hand.n(); assert.equal(hand.t({}).type, "svg");
assert.equal(hand.t({ className: "custom" }).props.className, "custom");
assert.deepEqual(Object.keys(hand).sort(), ["n", "t"]);

const plusSmall = await bundle("plus-sm-icon");
assert.equal(plusSmall.t({}), null);
plusSmall.n(); assert.equal(plusSmall.t({}).type, "svg");
assert.equal(plusSmall.t({ className: "custom" }).props.className, "custom");
assert.deepEqual(Object.keys(plusSmall).sort(), ["n", "t"]);

const reddit = await bundle("reddit-logo");
assert.equal(reddit.t({}), null);
reddit.n(); assert.equal(reddit.t({}).type, "svg");
assert.equal(reddit.t({ className: "custom" }).props.className, "custom");
assert.deepEqual(Object.keys(reddit).sort(), ["n", "t"]);

const shieldCheck = await bundle("shield-check");
assert.equal(shieldCheck.t({}), null);
shieldCheck.n(); assert.equal(shieldCheck.t({}).type, "svg");
assert.equal(shieldCheck.t({ className: "custom" }).props.className, "custom");
assert.deepEqual(Object.keys(shieldCheck).sort(), ["n", "t"]);

const textShorter = await bundle("text-shorter");
assert.equal(textShorter.t({}), null);
textShorter.n(); assert.equal(textShorter.t({}).type, "svg");
assert.equal(textShorter.t({ className: "custom" }).props.className, "custom");
assert.deepEqual(Object.keys(textShorter).sort(), ["n", "t"]);

const thumbMixed = await bundle("thumb-mixed");
assert.equal(thumbMixed.t({}), null);
thumbMixed.n(); assert.equal(thumbMixed.t({}).type, "svg");
assert.equal(thumbMixed.t({ className: "custom" }).props.className, "custom");
assert.deepEqual(Object.keys(thumbMixed).sort(), ["n", "t"]);

const twitter = await bundle("twitter-logo");
assert.equal(twitter.t({}), null);
twitter.n(); assert.equal(twitter.t({}).type, "svg");
assert.equal(twitter.t({ className: "custom" }).props.className, "custom");
assert.deepEqual(Object.keys(twitter).sort(), ["n", "t"]);

console.log("standalone SVG primitives cluster tests passed (64 assertions)");
