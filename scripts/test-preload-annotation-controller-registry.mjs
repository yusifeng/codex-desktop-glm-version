import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import esbuild from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "annotation-controller-registry-"));
const bundledModule = path.join(temporaryDirectory, "annotation-controller-registry.cjs");
await esbuild.build({
  entryPoints: [path.join(root, "src/main/browser-page-preload/annotation-controller-registry.ts")],
  outfile: bundledModule,
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "esnext",
  logLevel: "silent",
});

const require = createRequire(import.meta.url);
const { useAnnotationControllerRegistry } = require(bundledModule);

const constructed = [];
const hostMessages = [];
const dependencies = new Proxy({
  useState: (initialize) => [initialize()],
  window: { requestAnimationFrame() {}, cancelAnimationFrame() {} },
  t: { sendMessageToHost: (message) => hostMessages.push(message) },
  e: {},
  w: { current: null }, E: { current: null }, ce: { current: null }, le: { current: null },
  be: { current: false }, xe: { current: false }, Se: { current: false }, Ce: { current: false },
  me: { current: 0 }, O: { current: null },
}, {
  get(target, property) {
    if (property in target) return target[property];
    if (property === "Ry" || String(property).startsWith("createAnnotation")) {
      return (...args) => {
        const value = { owner: String(property), args };
        constructed.push(value);
        return value;
      };
    }
    return () => null;
  },
});
const registry = useAnnotationControllerRegistry(dependencies);
assert.equal(Object.keys(registry).length, 32);
assert.equal(constructed.length, 32);
assert.equal(registry.viewportRefreshScheduler.owner, "createAnnotationViewportRefreshScheduler");
assert.equal(registry.Te.owner, "Ry");
assert.equal(registry.editorAnchorSyncController.owner, "createAnnotationEditorAnchorSyncController");
assert.equal(constructed[0], registry.viewportRefreshScheduler);
assert.equal(constructed.at(-1), registry.editorAnchorSyncController);
const suspensionDependencies = registry.suspensionNotifier.args[0];
suspensionDependencies.send(true);
assert.deepEqual(hostMessages[0], { type: "browser-sidebar-runtime-annotation-suspension", suspended: true });
const selectionDependencies = registry.selectionModifierNotifier.args[0];
selectionDependencies.send(false);
assert.deepEqual(hostMessages[1], { type: "browser-sidebar-runtime-annotation-selection-modifier-state", pressed: false });
const screenshotDependencies = registry.screenshotReadyController.args[0];
assert.equal(typeof screenshotDependencies.requestAnimationFrame, "function");
assert.equal(typeof screenshotDependencies.cancelAnimationFrame, "function");
await fs.rm(temporaryDirectory, { recursive: true, force: true });
console.log("12 preload annotation controller-registry assertions passed");
