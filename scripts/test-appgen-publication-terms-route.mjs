import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__publicationTermsRouteTest = {
  initialized: [],
  jsx: {
    Fragment: "Fragment",
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
});
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/appgen-publication-terms-route/index.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "mock-renderer-chunks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice("@rchunk/".length),
          namespace: "mock-renderer-chunk",
        }));
        build.onLoad(
          { filter: /.*/, namespace: "mock-renderer-chunk" },
          ({ path: importPath }) => ({
            contents:
              {
                "app-shared": `
                  export const I3 = () => globalThis.__publicationTermsRouteTest.jsx;
                  export const $3 = () => globalThis.__publicationTermsRouteTest.initialized.push("$3");
                `,
                "app-initial": `
                  export const dl = "PublicationTerms";
                  export const fl = () => globalThis.__publicationTermsRouteTest.initialized.push("fl");
                `,
              }[importPath] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const route = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

assert.deepEqual(state.initialized, ["$3", "fl"]);
const child = { type: "RouteContent" };
const node = route.AppgenPublicationTermsRoute({ children: child });
assert.equal(node.type, "Fragment");
assert.equal(node.props.children[0], child);
assert.deepEqual(node.props.children[1], {
  type: "PublicationTerms",
  props: { showWhenUnseen: true },
  key: undefined,
});
console.log("4 Appgen publication-terms route assertions passed");
