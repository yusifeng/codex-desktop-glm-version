import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__generatedImageMenuTest = { initialized: 0 };

const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/generated-image-context-menu/index.ts"),
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
          () => ({
            contents: `
              export const QB = () => globalThis.__generatedImageMenuTest.initialized++;
              export const ZB = image => [{ id: "save", image }];
            `,
            loader: "js",
          }),
        );
      },
    },
  ],
});
const menu = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

assert.equal(globalThis.__generatedImageMenuTest.initialized, 1);
assert.deepEqual(menu.getGeneratedImageContextMenuItems("image-1"), [
  { id: "save", image: "image-1" },
]);
console.log("2 generated image context menu assertions passed");
