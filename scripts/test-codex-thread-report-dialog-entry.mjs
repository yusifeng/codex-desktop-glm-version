import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__codexReportDialogEntryTest = { initialized: 0 };

const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/codex-thread-report-dialog-entry/index.ts"),
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
              importPath === "codex-thread-report-dialog"
                ? `export const n = () => globalThis.__codexReportDialogEntryTest.initialized++; export const t = "ReportDialog";`
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

assert.equal(globalThis.__codexReportDialogEntryTest.initialized, 1);
assert.equal(entry.CodexThreadReportDialog, "ReportDialog");
console.log("2 Codex thread report dialog entry assertions passed");
