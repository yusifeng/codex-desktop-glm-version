import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__routeHelpersTest = { initialized: [] });

async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
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
                importPath === "hooks-settings-model"
                  ? `export const p = () => globalThis.__routeHelpersTest.initialized.push("hooks-model");`
                  : importPath === "app-primary"
                    ? `
                      export const gc = () => globalThis.__routeHelpersTest.initialized.push("checkpoint");
                      export const hc = value => ({ checkpoint: value });
                    `
                    : importPath === "app-shared"
                      ? `
                        export const g4 = () => globalThis.__routeHelpersTest.initialized.push("schema");
                        const chain = { optional() { return this; }, min() { return this; }, nullable() { return this; } };
                        export const R4 = () => chain;
                        export const q4 = () => chain;
                        export const H4 = () => ({ loose() { return { safeParse(value) {
                          if (value == null || typeof value !== "object" || Array.isArray(value)) return { success: false };
                          for (const key of ["passkeyEnrollmentCompleted", "pepperOnboardingPersonalization", "returnToPreviousHistoryEntry", "securitySubviewHasParent"])
                            if (key in value && value[key] !== true) return { success: false };
                          if ("pepperOnboardingAccountId" in value && typeof value.pepperOnboardingAccountId !== "string") return { success: false };
                          if ("workspaceRoot" in value && value.workspaceRoot !== null && (typeof value.workspaceRoot !== "string" || value.workspaceRoot.length < 1)) return { success: false };
                          return { success: true, data: value };
                        } }; } });
                      `
                      : "export const n = value => value; export const sideEffect = true;",
              loader: "js",
            }),
          );
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
  );
}

const personalization = await bundle("chatgpt-personalization-route");
assert.equal(personalization.n, "/settings/personalization?modal=memories");
assert.equal(
  personalization.t,
  "/settings/personalization#chatgpt-reference-photos",
);

const hooks = await bundle("hooks-settings-route");
assert.equal(state.initialized.shift(), "hooks-model");
assert.equal(hooks.n({}), "hooks-settings");
assert.equal(
  hooks.n({ hostId: "local", source: "project", projectRoot: "/repo" }),
  "hooks-settings?hostId=local&source=project&projectRoot=%2Frepo",
);
assert.equal(
  hooks.t({ hostId: "remote", source: "plugin", pluginId: null }),
  "/settings/hooks-settings?hostId=remote&source=plugin&pluginId=__unknown__",
);
const params = new URLSearchParams("keep=1&hostId=old&pluginId=old");
hooks.i(params, "local", { source: "project", projectRoot: "/workspace" });
assert.equal(
  params.toString(),
  "keep=1&hostId=local&source=project&projectRoot=%2Fworkspace",
);
hooks.i(params, "local", null);
assert.equal(params.toString(), "keep=1");

const settings = await bundle("settings-route-state");
assert.equal(state.initialized.shift(), "schema");
assert.equal(settings.n({ passkeyEnrollmentCompleted: true }), true);
assert.equal(settings.n({ passkeyEnrollmentCompleted: false }), false);
assert.equal(
  settings.r({
    pepperOnboardingPersonalization: true,
    pepperOnboardingAccountId: "account-1",
  }),
  "account-1",
);
assert.equal(settings.r({ pepperOnboardingAccountId: "account-1" }), null);
assert.equal(settings.i({ returnToPreviousHistoryEntry: true }), true);
assert.equal(settings.t({ securitySubviewHasParent: true }), true);
assert.deepEqual(settings.a({}), { hasValue: false, workspaceRoot: null });
assert.deepEqual(settings.a({ workspaceRoot: null }), {
  hasValue: true,
  workspaceRoot: null,
});
assert.deepEqual(settings.a({ workspaceRoot: "/repo" }), {
  hasValue: true,
  workspaceRoot: "/repo",
});
assert.deepEqual(settings.a({ workspaceRoot: "" }), {
  hasValue: false,
  workspaceRoot: null,
});

const checkpoint = await bundle("thread-tab-route-checkpoint");
assert.equal(state.initialized.shift(), "checkpoint");
assert.deepEqual(checkpoint.captureThreadTabRouteCheckpoint("thread-1"), {
  checkpoint: "thread-1",
});

console.log("20 route helper cluster assertions passed");
