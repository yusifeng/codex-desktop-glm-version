import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const built = await esbuild.build({
  bundle: true,
  entryPoints: [
    path.join(root, "src/main/main-app/remote-artifact/native-artifact-file-service.ts"),
  ],
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { NativeArtifactFileService } = await import(
  `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const ok = (value) => {
  assert.ok(value);
  assertions += 1;
};

const testRoot = await fs.mkdtemp(path.join(tmpdir(), "native-artifact-file-service-test-"));
const sourcePath = path.join(testRoot, "source.xlsx");
await fs.writeFile(sourcePath, "snapshot");

const nativeTargetId = `native-app:${createHash("sha256")
  .update("com.example.Sheets")
  .update("\0")
  .update("sheets")
  .digest("hex")}`;

function createHarness(overrides = {}) {
  const calls = [];
  const openedPaths = [];
  const service = new NativeArtifactFileService({
    async downloadCopy(snapshotPath) {
      calls.push(["downloadCopy", snapshotPath]);
    },
    async getTargets(request) {
      calls.push(["getTargets", request]);
      ok(request.path.endsWith("workbook.xlsx"));
      equal(await fs.readFile(request.path, "utf8"), "");
      return {
        targets: [
          { available: true, icon: "folder", id: "finder", target: "fileManager" },
          {
            appPath: "/Applications/Sheets.app",
            bundleId: "com.example.Sheets",
            default: true,
            icon: "sheets-icon",
            id: "sheets",
            kind: "native",
            label: "Sheets",
            target: "systemDefault",
          },
          {
            appPath: "/Applications/Duplicate.app",
            bundleId: "com.example.Sheets",
            id: "sheets",
            kind: "native",
            target: "systemDefault",
          },
          { default: false, id: "systemDefault", label: "Default", target: "systemDefault" },
          { available: false, id: "hidden", target: "systemDefault" },
          { id: "invalid-native", kind: "native", target: "systemDefault" },
        ],
      };
    },
    hostId: "local",
    maxBytes: 1024,
    async open(request) {
      calls.push(["open", request]);
      openedPaths.push(request.path);
      equal(await fs.readFile(request.path, "utf8"), "snapshot");
      equal((await fs.stat(request.path)).mode & 0o777, 0o600);
      return { success: true };
    },
    async publishNativeSnapshot(request) {
      calls.push(["publish", request]);
      return {
        byteLength: 8,
        contentType: "application/test",
        fileName: "book.xlsx",
        path: sourcePath,
        status: "ready",
      };
    },
    async resolveArtifactKind(request) {
      calls.push(["resolve", request]);
      return { status: "ready", kind: "spreadsheet" };
    },
    ...overrides,
  });
  return { calls, openedPaths, service };
}

try {
  {
    const harness = createHarness();
    const result = await harness.service.getTargets({ artifactRef: "artifact-1" });
    equal(result.status, "ready");
    equal(result.fileManagerIcon, "folder");
    equal(result.targets, [
      {
        default: true,
        icon: "sheets-icon",
        id: nativeTargetId,
        label: "Sheets",
      },
      {
        default: false,
        icon: undefined,
        id: "system-default",
        label: "Default",
      },
    ]);
    const temporaryPath = harness.calls.find(([name]) => name === "getTargets")[1].path;
    await assert.rejects(fs.stat(temporaryPath), /ENOENT/);
    assertions += 1;
  }

  {
    const failure = { status: "failed", reason: "session-unavailable" };
    const harness = createHarness({ async resolveArtifactKind() { return failure; } });
    equal(await harness.service.getTargets({}), failure);
    equal(harness.calls.some(([name]) => name === "getTargets"), false);
  }

  {
    const harness = createHarness({ async getTargets() { throw Error("discovery failed"); } });
    equal(await harness.service.getTargets({}), {
      status: "failed",
      reason: "target-discovery-failed",
    });
  }

  {
    const harness = createHarness();
    equal(await harness.service.performFileAction({ action: { type: "open", targetId: "bad" } }), {
      status: "failed",
      reason: "target-unavailable",
    });
    equal(harness.calls.some(([name]) => name === "publish"), false);
  }

  {
    const harness = createHarness();
    const result = await harness.service.performFileAction({
      action: { type: "open", targetId: nativeTargetId },
    });
    equal(result, { status: "completed" });
    const openRequest = harness.calls.find(([name]) => name === "open")[1];
    equal(openRequest.appPath, "/Applications/Sheets.app");
    equal(openRequest.hostId, "local");
    equal(openRequest.target, "systemDefault");
    ok(await fs.stat(openRequest.path));
    await fs.rm(path.dirname(openRequest.path), { force: true, recursive: true });
  }

  {
    const harness = createHarness();
    const result = await harness.service.performFileAction({ action: { type: "show-in-folder" } });
    equal(result, { status: "completed" });
    const openRequest = harness.calls.find(([name]) => name === "open")[1];
    equal(openRequest.appPath, undefined);
    equal(openRequest.target, "fileManager");
    await fs.rm(path.dirname(openRequest.path), { force: true, recursive: true });
  }

  {
    const harness = createHarness();
    equal(await harness.service.performFileAction({ action: { type: "download-copy" } }), {
      status: "completed",
    });
    equal(harness.calls.find(([name]) => name === "downloadCopy"), ["downloadCopy", sourcePath]);
    equal(harness.calls.some(([name]) => name === "open"), false);
  }

  {
    const harness = createHarness({ async downloadCopy() { throw Error("cancelled"); } });
    equal(await harness.service.performFileAction({ action: { type: "download-copy" } }), {
      status: "failed",
      reason: "action-failed",
    });
  }

  {
    let failedOpenPath;
    const harness = createHarness({
      async open(request) {
        failedOpenPath = request.path;
        return { success: false };
      },
    });
    equal(await harness.service.performFileAction({ action: { type: "show-in-folder" } }), {
      status: "failed",
      reason: "action-failed",
    });
    await assert.rejects(fs.stat(failedOpenPath), /ENOENT/);
    assertions += 1;
  }

  {
    const harness = createHarness();
    equal(await harness.service.performFileAction({ action: { type: "unknown" } }), {
      status: "failed",
      reason: "action-failed",
    });
  }

  {
    const harness = createHarness();
    const result = await harness.service.readSnapshot({ artifactRef: "artifact-1" });
    equal(result.status, "ready");
    equal(result.contentType, "application/test");
    equal(result.fileName, "book.xlsx");
    equal(Buffer.from(result.bytes).toString(), "snapshot");
  }

  {
    const harness = createHarness({
      async publishNativeSnapshot() {
        return {
          byteLength: 9,
          contentType: "application/test",
          fileName: "book.xlsx",
          path: sourcePath,
          status: "ready",
        };
      },
    });
    equal(await harness.service.readSnapshot({}), {
      status: "failed",
      reason: "materialization-failed",
    });
  }

  {
    const harness = createHarness({ maxBytes: 7 });
    equal(await harness.service.readSnapshot({}), {
      status: "failed",
      reason: "materialization-failed",
    });
  }

  {
    const failure = { status: "failed", reason: "sync-failed" };
    const harness = createHarness({ async publishNativeSnapshot() { return failure; } });
    equal(await harness.service.readSnapshot({}), failure);
    equal(await harness.service.performFileAction({ action: { type: "download-copy" } }), failure);
  }
} finally {
  await fs.rm(testRoot, { force: true, recursive: true });
}

console.log(`${assertions} main native-artifact file service assertions passed`);
