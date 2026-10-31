import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createVisualizationServiceRuntime } from "../src/main/main-app/visualizations/visualization-service.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

function chain() {
  const schema = {
    regex() { return schema; },
    positive() { return schema; },
    nonnegative() { return schema; },
    trim() { return schema; },
    min() { return schema; },
    optional() { return schema; },
  };
  return schema;
}

function createSchemaRuntime() {
  return {
    Of: chain,
    Cf: chain,
    gf: chain,
    bf: chain,
    hf: chain,
    wf(shape) {
      const schema = chain();
      let refinement = () => true;
      schema.refine = (predicate) => { refinement = predicate; return schema; };
      schema.safeParse = (value) => {
        if ("captureRect" in shape) {
          const valid = value != null &&
            /^visualization-[0-9a-f]{16}$/.test(value.sandboxId ?? "") &&
            [value.captureRect?.height, value.captureRect?.width].every((number) => number > 0) &&
            [value.captureRect?.x, value.captureRect?.y].every((number) => number >= 0) &&
            [value.viewportSize?.height, value.viewportSize?.width].every((number) => number > 0) &&
            refinement(value);
          return valid ? { success: true, data: value } : { success: false };
        }
        if ("path" in shape) {
          const valid = value != null && typeof value.path === "string" && value.path.length > 0 &&
            /^[a-zA-Z0-9_-]+$/.test(value.threadId ?? "");
          return valid ? { success: true, data: value } : { success: false };
        }
        return { success: true, data: value };
      };
      return schema;
    },
  };
}

function uniqueBy(values, getKey) {
  const seen = new Set();
  return values.filter((value) => {
    const key = getKey(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function createHarness({
  platform = "linux",
  getSandboxWebContents = () => null,
  executionHost,
  maxFileBytes = 5_000_000,
  workspaceDir = true,
} = {}) {
  const clipboardWrites = [];
  const bitmapConversions = [];
  const runtime = {
    ...createSchemaRuntime(),
    qi: (threadId) => threadId === "invalid" ? null : `2026/10/31`,
    Vi: (value) => value.replace("/private", ""),
    Ki: () => [],
    ds: (error) => error?.code === "ENOENT",
    Lt: async (boundaries) => Object.fromEntries(boundaries.map((boundary) => [
      boundary,
      boundary === "/repo" ? "/repo-real" : boundary,
    ])),
  };
  const result = createVisualizationServiceRuntime({
    runtime,
    RpcHandlerBase: class {},
    electron: {
      clipboard: { writeImage(image) { clipboardWrites.push(image); } },
      nativeImage: {
        createFromBitmap(bitmap, size) {
          const image = { bitmap, size, native: true };
          bitmapConversions.push(image);
          return image;
        },
      },
    },
    platform,
    getSandboxWebContents,
    projectCaptureRect: (_imageSize, captureRect) => captureRect.empty ? null : captureRect,
    getFeatureFlags: () => ({ workspaceDir }),
    temporaryDirectory: () => "/tmp/runtime",
    realpathSync: (value) => `${value}-real`,
    uniqueBy,
    maxFileBytes,
  });
  const host = executionHost ?? {
    id: "local",
    isLocal: true,
    codexHome: async () => "/private/home",
    workspacesRoot: async () => "/workspace",
    platformPath: async () => path.posix,
    async stat(candidate) {
      if (candidate.startsWith("/workspace")) throw Object.assign(Error("missing"), { code: "ENOENT" });
      return { isFile: () => true, isDirectory: () => true, isSymbolicLink: () => false };
    },
    async readFile() { return Buffer.from("<html>hello</html>"); },
  };
  const registry = { get: () => host };
  return {
    ...result,
    bitmapConversions,
    clipboardWrites,
    host,
    registry,
    service: new result.VisualizationService(registry, { id: 9 }, () => "/repo"),
  };
}

{
  const harness = createHarness();
  equal(harness.isPathWithin("/repo", "/repo/file.html", path.posix), true);
  equal(harness.isPathWithin("/repo", "/repo", path.posix), true);
  equal(harness.isPathWithin("/repo", "/other/file.html", path.posix), false);
  equal(harness.isPathWithin("/repo", "/repo-other/file.html", path.posix), false);
  equal(
    await harness.resolveAuthorizedAbsolutePath(
      "/repo/nested/page.html",
      [{ directory: "/repo", boundary: "/repo" }],
      harness.host,
      path.posix,
    ),
    { boundary: "/repo-real", path: "/repo-real/nested/page.html" },
  );
  await assert.rejects(
    harness.resolveAuthorizedAbsolutePath("/outside/page.html", [], harness.host, path.posix),
    /Invalid visualization read request/,
  );
  assertions += 1;
}

{
  const harness = createHarness();
  await assert.rejects(harness.service.copyImage({}), /invalid request/);
  assertions += 1;
  await assert.rejects(
    harness.service.copyImage({
      sandboxId: "visualization-0123456789abcdef",
      captureRect: { x: 0, y: 0, width: 10, height: 10 },
      viewportSize: { width: 20, height: 20 },
    }),
    /sandbox is unavailable/,
  );
  assertions += 1;
}

{
  const cropped = {
    toBitmap: () => Buffer.from("bitmap"),
    getSize: () => ({ width: 10, height: 10 }),
  };
  const image = {
    getSize: () => ({ width: 20, height: 20 }),
    crop: (rect) => { equal(rect, { x: 1, y: 2, width: 10, height: 10 }); return cropped; },
  };
  const harness = createHarness({
    platform: "win32",
    getSandboxWebContents: () => ({ capturePage: async () => image }),
  });
  await harness.service.copyImage({
    sandboxId: "visualization-0123456789abcdef",
    captureRect: { x: 1, y: 2, width: 10, height: 10 },
    viewportSize: { width: 20, height: 20 },
  });
  equal(harness.bitmapConversions.length, 1);
  equal(harness.clipboardWrites[0].native, true);
}

{
  const local = createHarness();
  equal(await local.service.getTemporaryRoots("local"), ["/tmp/runtime", "/tmp/runtime-real"]);
  const remoteHost = { ...local.host, isLocal: false };
  const remote = createHarness({ executionHost: remoteHost });
  equal(await remote.service.getTemporaryRoots("remote"), []);
}

{
  const harness = createHarness();
  equal(await harness.service.read({ hostId: "local", path: "page.html", threadId: "thread-1" }), {
    contents: "<html>hello</html>",
  });
  await assert.rejects(
    harness.service.read({ hostId: "local", path: "nested/page.html", threadId: "thread-1" }),
    /Invalid visualization read request/,
  );
  assertions += 1;
  await assert.rejects(
    harness.service.read({ hostId: "local", path: "Page.html", threadId: "thread-1" }),
    /Invalid visualization read request/,
  );
  assertions += 1;
  await assert.rejects(
    harness.service.read({ hostId: "local", path: "page.html", threadId: "invalid" }),
    /Invalid visualization read request/,
  );
  assertions += 1;
}

{
  const harness = createHarness({ maxFileBytes: 4 });
  equal(await harness.service.read({ hostId: "local", path: "page.html", threadId: "thread-1" }), null);
}

{
  const statCalls = [];
  const host = {
    id: "local",
    isLocal: true,
    codexHome: async () => "/home",
    workspacesRoot: async () => null,
    platformPath: async () => path.posix,
    async stat(candidate, options) {
      statCalls.push([candidate, options]);
      return { isFile: () => true, isDirectory: () => true, isSymbolicLink: () => false };
    },
    async readFile(candidate) { equal(candidate, "/repo-real/page.html"); return Buffer.from("absolute"); },
  };
  const harness = createHarness({ executionHost: host });
  equal(
    await harness.service.read({ hostId: "local", path: "/repo/page.html", threadId: "thread-1" }),
    { contents: "absolute" },
  );
  equal(statCalls[0], [
    "/repo-real/page.html",
    { bypassCache: true, followSymlinks: false },
  ]);
}

{
  const host = {
    id: "local", isLocal: true,
    codexHome: async () => "/home", workspacesRoot: async () => null,
    platformPath: async () => path.posix,
    async stat() { return { isFile: () => true, isDirectory: () => true, isSymbolicLink: () => true }; },
    async readFile() { throw Error("must not read"); },
  };
  const harness = createHarness({ executionHost: host });
  await assert.rejects(
    harness.service.read({ hostId: "local", path: "page.html", threadId: "thread-1" }),
    /Invalid visualization read request/,
  );
  assertions += 1;
}

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes("VisualizationService: Gnt"), true);
equal(main.includes("visualizations: new Gnt("), true);
equal(main.includes("Gnt = class"), false);
equal(main.includes("async function Knt("), false);
equal(main.includes("function V5("), false);
equal(main.includes("Vnt = 5e6"), false);
equal(main.includes("Hnt = n.Of"), false);

console.log(`${assertions} main visualization service assertions passed`);
