import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { gzipSync } from "node:zlib";
import { build } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

const output = await build({
  entryPoints: [new URL("../src/main/main-app/language-server/runtime-installer.ts", import.meta.url).pathname],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
});
const runtime = await import(
  `data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`
);
const resourcesOutput = await build({
  entryPoints: [new URL("../src/main/main-app/language-server/runtime-resources.ts", import.meta.url).pathname],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
});
const resources = await import(
  `data:text/javascript;base64,${Buffer.from(resourcesOutput.outputFiles[0].text).toString("base64")}`
);

const python = resources.getLanguageServerRuntimeSpec("python", { platform: "linux", arch: "x64" });
equal(python.version, "pyright-1.1.413");
equal(python.expectedPaths, ["node_modules/pyright/langserver.index.js"]);
equal(resources.getLanguageServerRuntimeSpec("java", { platform: "freebsd", arch: "x64" }), null);
const kotlin = resources.getLanguageServerRuntimeSpec("kotlin", { platform: "linux", arch: "arm64" });
equal(kotlin.resources[0].downloadTimeoutMs, 900_000);
equal(kotlin.resources[0].sourcePath, "extension/server");
const rustWindows = resources.getLanguageServerRuntimeSpec("rust", { platform: "win32", arch: "x64" });
equal(rustWindows.expectedPaths, ["rust-analyzer.exe"]);
equal(rustWindows.resources[0].sourcePath, "rust-analyzer.exe");
equal(rustWindows.resources[0].executable, true);
equal(resources.getLanguageServerRuntimeSpec("unknown", { platform: "linux", arch: "x64" }), undefined);

const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "codex-lsp-runtime-test-"));
try {
  const payload = Buffer.from("runtime-binary");
  const archive = gzipSync(payload);
  const resource = {
    format: "gzip",
    sha256: createHash("sha256").update(archive).digest("hex"),
    sizeBytes: archive.length,
    targetPath: "bin/tool",
    url: "https://runtime.test/tool.gz",
  };
  let fetches = 0;
  const warnings = [];
  const Installer = runtime.createLanguageServerRuntimeInstallerClass({
    extractTar: async () => { throw Error("unexpected tar extraction"); },
    extractZip: async () => { throw Error("unexpected zip extraction"); },
    logger: () => ({ warning: (...args) => warnings.push(args) }),
  });
  const installer = new Installer({
    cacheRoot: temporaryRoot,
    fetchImpl: async () => {
      fetches += 1;
      return { ok: true, status: 200, body: Readable.from([archive]) };
    },
    getSpec: (id) => id === "test"
      ? { id, version: "v1", expectedPaths: ["bin/tool"], resources: [resource] }
      : null,
  });
  const first = installer.getRuntimeRoot("test");
  const concurrent = installer.getRuntimeRoot("test");
  equal(first, concurrent);
  const runtimeRoot = await first;
  equal(runtimeRoot, path.join(temporaryRoot, "test"));
  equal(await fs.readFile(path.join(runtimeRoot, "bin/tool"), "utf8"), "runtime-binary");
  equal(JSON.parse(await fs.readFile(path.join(runtimeRoot, "runtime.json"), "utf8")), {
    expectedPaths: ["bin/tool"],
    version: "v1",
  });
  equal(fetches, 1);
  equal(await installer.getRuntimeRoot("test"), runtimeRoot);
  equal(fetches, 1);
  installer.markRuntimeExpired("test");
  equal(await installer.getRuntimeRoot("test"), null);

  const fallbackRoot = path.join(temporaryRoot, "fallback");
  await fs.mkdir(path.join(fallbackRoot, "bin"), { recursive: true });
  await fs.writeFile(path.join(fallbackRoot, "bin/tool"), "cached");
  await fs.writeFile(path.join(fallbackRoot, "runtime.json"), JSON.stringify({
    expectedPaths: ["bin/tool"], version: "old",
  }));
  const fallbackInstaller = new Installer({
    cacheRoot: temporaryRoot,
    fetchImpl: async () => ({ ok: true, status: 200, body: Readable.from([archive]) }),
    getSpec: (id) => id === "fallback"
      ? {
          id,
          version: "new",
          expectedPaths: ["bin/tool"],
          resources: [{ ...resource, sha256: "0".repeat(64) }],
        }
      : null,
  });
  equal(await fallbackInstaller.getRuntimeRoot("fallback"), fallbackRoot);
  equal(warnings.at(-1)[0], "language_server_runtime_install_failed");
  equal(warnings.at(-1)[1].safe.id, "fallback");
  equal(await fs.readFile(path.join(fallbackRoot, "bin/tool"), "utf8"), "cached");
} finally {
  await fs.rm(temporaryRoot, { recursive: true, force: true });
}

const main = await fs.readFile(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes('require("./main-app/language-server/runtime-installer.js")'), true);
equal(main.includes("P1e = createLanguageServerRuntimeInstallerClass({"), true);
for (const oldOwner of ["function A1e(", "P1e = class", "async function F1e(", "async function I1e(", "async function L1e(", "async function UQ(", "async function WQ(", "async function GQ("]) {
  equal(main.includes(oldOwner), false);
}

console.log(`${assertions} main language-server runtime installer assertions passed`);
