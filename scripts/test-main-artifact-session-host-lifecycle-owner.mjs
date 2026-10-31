import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { mkdtemp, rm } from "node:fs/promises";
import * as acorn from "acorn";
import { build, transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const sourcePath = new URL("../src/main/main-app/artifact-session/host-lifecycle.ts", import.meta.url);
const sourceText = fs.readFileSync(sourcePath, "utf8");
const transpiled = await transform(sourceText, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const classNode = ast.body.find(
  (node) => node.type === "ClassDeclaration" && node.id?.name === "ArtifactSessionHostLifecycle",
);
assert.ok(classNode);
assertions += 1;
equal(classNode.body.body.length, 44);

const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "codex-artifact-host-owner-"));
const outputPath = path.join(tempDirectory, "host-lifecycle.mjs");
try {
  await build({
    entryPoints: [fileURLToPath(sourcePath)],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    outfile: outputPath,
    logLevel: "silent",
    plugins: [{
      name: "main-mocks",
      setup(api) {
        api.onResolve({ filter: /^@chunk\// }, ({ path: specifier }) => ({ path: specifier, namespace: "mock" }));
        api.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: specifier }) => ({
          loader: "js",
          contents: specifier.endsWith("logger")
            ? "export const createTaggedLogger=()=>({warning(){},info(){}});"
            : "const schema=()=>({int(){return this},nonnegative(){return this},min(){return this},parse(v){return v}});export const wf=schema;export const Cf=schema;export const Of=schema;export const gf=schema;export const Sn=async()=>({});",
        }));
      },
    }],
  });
  const { ArtifactSessionHostLifecycle } = await import(pathToFileURL(outputPath).href);
  const lifecycle = new ArtifactSessionHostLifecycle({
    createAdmissionClient: async () => { throw new Error("not used"); },
    isEnabled: () => false,
    loadPrimaryRuntimePaths: async () => null,
    retryIntervalMs: 5_000,
    rootDirectory: path.join(tempDirectory, "root"),
    startupTimeoutMs: 10_000,
    temporaryDirectory: tempDirectory,
    transactionKey: "transaction-1",
    viewerReconciliationTimeoutMs: 2_000,
  });
  equal(lifecycle.isAvailable(), false);
  equal(lifecycle.isViewerAvailable(), false);
  assert.throws(() => lifecycle.getPrimaryRuntimePaths(), /host is unavailable/);
  assertions += 1;
  assert.throws(() => lifecycle.getTrustedServiceEnv(), /host is unavailable/);
  assertions += 1;
  assert.throws(() => lifecycle.getViewerConnectionInfo(), /host is unavailable/);
  assertions += 1;
  equal(lifecycle.dispose(), lifecycle.dispose());
  await lifecycle.dispose();

  await assert.rejects(
    ArtifactSessionHostLifecycle.start({ rootDirectory: "relative" }),
    /root must be absolute/,
  );
  assertions += 1;
  await assert.rejects(
    ArtifactSessionHostLifecycle.start({
      rootDirectory: path.join(tempDirectory, "root-2"),
      retryIntervalMs: 0,
    }),
    /retry interval must be positive/,
  );
  assertions += 1;
  await assert.rejects(
    ArtifactSessionHostLifecycle.start({
      rootDirectory: path.join(tempDirectory, "root-3"),
      primaryRuntimePaths: {},
      loadPrimaryRuntimePaths: async () => null,
    }),
    /fixed runtime paths or a runtime loader/,
  );
  assertions += 1;
} finally {
  await rm(tempDirectory, { recursive: true, force: true });
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(
  main.includes('const { ArtifactSessionHostLifecycle } = require("./main-app/artifact-session/host-lifecycle.js");'),
  true,
);
equal(main.includes("var Hte = ArtifactSessionHostLifecycle;"), true);
equal(main.includes("Hte = class"), false);
equal(main.includes("Ae = await Hte.start({"), true);

console.log(`${assertions} main Artifact Session host lifecycle owner assertions passed`);
