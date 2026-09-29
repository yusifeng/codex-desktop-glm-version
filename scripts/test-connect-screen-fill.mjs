import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/connect-screen-fill/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
let assertions = 0;
const equal = (actual, expected) => {
  assert.equal(actual, expected);
  assertions += 1;
};
const deepEqual = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const state = { initialized: 0 };
const jsx = {
  jsx(type, props, key) {
    return { type, props: props ?? {}, key };
  },
};
globalThis.__connectScreenFill = { jsx, state };
const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const r=globalThis.__connectScreenFill;",
    "export const $3=()=>{r.state.initialized+=1};",
    "export const I3=()=>r.jsx;",
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
  plugins: [
    {
      name: "connect-screen-fill-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice(8),
          namespace: "mock",
        }));
        build.onLoad(
          { filter: /.*/, namespace: "mock" },
          ({ path: module }) => ({
            contents: mocks[module] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const module = await import(
  "data:text/javascript;base64," +
    Buffer.from(result.outputFiles[0].text).toString("base64")
);

deepEqual(Object.keys(module), ["default"]);
equal(typeof module.default, "function");
equal(state.initialized, 1);
deepEqual(
  [...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^"]+)"/g)].map(
    (match) => match[1],
  ),
  ["rolldown-runtime", "app-shared"],
);
equal(/\bany\b/.test(source), false);
equal(/import\s+\*\s+as\s+/.test(source), false);

let view = module.default({});
equal(view.type, "svg");
equal(view.props.width, "1em");
equal(view.props.height, "1em");
equal(view.props.viewBox, "0 0 20 20");
equal(view.props.fill, "currentColor");
equal(view.props.children.type, "path");
equal(view.props.children.props.fillRule, "evenodd");
equal(view.props.children.props.clipRule, "evenodd");
equal(view.props.children.props.d.startsWith("M13.5 2.66797C14.1891"), true);
equal(view.props.children.props.d.includes("M5.41699 8.08496C5.04972"), true);
equal(view.props.children.props.d.endsWith("L5.41699 8.08496Z"), true);

const ignoredChild = { type: "circle", props: {} };
view = module.default({
  className: "connect-icon",
  width: 24,
  fill: "rebeccapurple",
  "aria-label": "Connect screen",
  children: ignoredChild,
});
equal(view.props.className, "connect-icon");
equal(view.props.width, 24);
equal(view.props.fill, "rebeccapurple");
equal(view.props["aria-label"], "Connect screen");
equal(view.props.children.type, "path");
equal(view.props.children === ignoredChild, false);

console.log(
  `connect-screen-fill targeted tests passed (${assertions} assertions)`,
);
