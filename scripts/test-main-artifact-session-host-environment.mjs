import assert from "node:assert/strict";
import { build } from "esbuild";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { mkdtemp, rm } from "node:fs/promises";
const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "codex-main-host-test-"));
const outputPath = path.join(tempDirectory, "host-lifecycle.mjs");
const source = await build({
  entryPoints: ["src/main/main-app/artifact-session/host-lifecycle.ts"],
  bundle: true, format: "esm", platform: "node", target: "node22", outfile: outputPath, logLevel: "silent",
  plugins: [{ name: "main-mocks", setup(api) {
    api.onResolve({ filter: /^@chunk\// }, ({ path }) => ({ path, namespace: "mock" }));
    api.onLoad({ filter: /.*/, namespace: "mock" }, ({ path }) => ({ loader: "js", contents: path.endsWith("logger") ? "export const createTaggedLogger=()=>({warning(){},info(){}});" : "const schema=()=>({int(){return this},nonnegative(){return this},min(){return this}});export const wf=schema;export const Cf=schema;export const Of=schema;export const gf=schema;export const Sn=async()=>({});" }));
  } }],
}).then(() => import(pathToFileURL(outputPath).href));
const { createArtifactSessionHostEnvironment, ARTIFACT_SESSION_HOST_ENV_KEYS, ARTIFACT_TOOL_HOST_DAEMON_PATH, ARTIFACT_TOOL_HOST_CLIENT_PATH } = source;
const runtime = { binPath: "/runtime/bin", nodeModulesPath: "/runtime/node_modules", nodePath: "/runtime/bin/node" };
const env = createArtifactSessionHostEnvironment({
  pinnedRuntimeDirectory: "/tmp/pinned",
  pinnedRuntimePaths: runtime,
  rootDirectory: "/tmp/artifacts",
  runtimeDirectory: "/tmp/session",
  transactionKey: "transaction-1",
  tokens: { admin: "admin-token", mcp: "mcp-token", viewer: "viewer-token" },
});
assert.equal(env.daemonPath, `/runtime/node_modules/${ARTIFACT_TOOL_HOST_DAEMON_PATH}`);
assert.equal(env.adminConnectionInfo.hostClientModulePath, `/runtime/node_modules/${ARTIFACT_TOOL_HOST_CLIENT_PATH}`);
assert.equal(env.daemonEnv[ARTIFACT_SESSION_HOST_ENV_KEYS.socket], "/tmp/session/host.sock");
assert.equal(env.daemonEnv[ARTIFACT_SESSION_HOST_ENV_KEYS.exportRoot], "/tmp/artifacts/exports");
assert.equal(env.trustedServiceEnv.ARTIFACT_SESSION_TRANSACTION_KEY, "transaction-1");
assert.equal(env.viewerConnectionInfo.token, "viewer-token");
console.log("test-main-artifact-session-host-environment: 6 assertions passed");
await rm(tempDirectory, { recursive: true, force: true });
