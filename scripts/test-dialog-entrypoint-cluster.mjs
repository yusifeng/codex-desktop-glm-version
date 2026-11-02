import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cases = [
  {
    directory: "plan-downgrade-dialog-entry",
    core: "plan-downgrade-dialog-core",
    exportName: "PlanDowngradeDialog",
  },
  {
    directory: "plugin-share-dialog-entry",
    core: "plugin-share-dialog-core",
    exportName: "PluginShareDialog",
  },
  {
    directory: "scheduled-shared-task-dialog-entry",
    core: "scheduled-shared-task-dialog-core",
    exportName: "ScheduledSharedTaskDialog",
  },
  {
    directory: "mcp-extension-quick-action-dialog-entry",
    core: "mcp-extension-quick-action-dialog-core",
    exportName: "McpExtensionQuickActionDialog",
  },
];

let assertions = 0;
for (const entryCase of cases) {
  globalThis.__dialogEntrypointClusterTest = { initialized: 0 };
  const result = await esbuild.build({
    entryPoints: [
      path.join(ROOT, "src/renderer", entryCase.directory, "index.ts"),
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
                importPath === entryCase.core
                  ? `export const n = () => globalThis.__dialogEntrypointClusterTest.initialized++; export const t = ${JSON.stringify(entryCase.exportName)};`
                  : "export const sideEffect = true;",
              loader: "js",
            }),
          );
        },
      },
    ],
  });
  const entry = await import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
  );
  assert.equal(globalThis.__dialogEntrypointClusterTest.initialized, 1);
  assertions += 1;
  assert.equal(entry[entryCase.exportName], entryCase.exportName);
  assertions += 1;
}

assert.equal(assertions, 8);
const downgradeReleaseAssertions = assertReleaseOwner("plan-downgrade-dialog-core");
console.log(`${assertions} dialog entrypoint and ${downgradeReleaseAssertions} downgrade release assertions passed`);
