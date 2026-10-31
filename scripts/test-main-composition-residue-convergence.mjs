import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadModule(relativePath) {
  const bundle = await esbuild.build({
    bundle: true,
    entryPoints: [path.join(root, relativePath)],
    format: "esm",
    logLevel: "silent",
    platform: "node",
    target: "node22",
    write: false,
  });
  return import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);
}

const projectPolicy = await loadModule("src/main/main-app/projects/project-write-policy.ts");
const protocolHelpers = await loadModule("src/main/main-app/language-server/protocol-helpers.ts");
const openIn = await loadModule("src/main/main-app/misc/open-in-service.ts");
const sandbox = await loadModule("src/main/main-app/mcp-sandbox/lifecycle.ts");

let assertions = 0;
const equal = (actual, expected) => { assert.equal(actual, expected); assertions += 1; };
const deepEqual = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };

deepEqual(
  projectPolicy.computeProjectOrderMoves(["a", "b", "c"], ["b", "a", "c"]),
  [{ projectId: "a", beforeProjectId: "c" }],
);
deepEqual(
  projectPolicy.computeProjectOrderMoves(["a", "b", "c", "d"], ["d", "c", "b", "a"]),
  [
    { projectId: "a", beforeProjectId: null },
    { projectId: "b", beforeProjectId: "a" },
    { projectId: "c", beforeProjectId: "b" },
  ],
);
deepEqual(projectPolicy.computeProjectOrderMoves(["a", "b"], ["a", "b"]), []);

const pending = new Map();
const order = [];
let releaseFirst;
const firstGate = new Promise((resolve) => { releaseFirst = resolve; });
const first = projectPolicy.enqueueKeyed(pending, "same", async () => {
  order.push("first-start");
  await firstGate;
  order.push("first-end");
});
const second = projectPolicy.enqueueKeyed(pending, "same", async () => {
  order.push("second");
});
const parallel = projectPolicy.enqueueKeyed(pending, "other", async () => {
  order.push("parallel");
});
await new Promise((resolve) => setImmediate(resolve));
deepEqual(order, ["first-start", "parallel"]);
releaseFirst();
await Promise.all([first, second, parallel]);
deepEqual(order, ["first-start", "parallel", "first-end", "second"]);
equal(pending.size, 0);

await assert.rejects(
  projectPolicy.enqueueKeyed(pending, "recover", async () => { throw new Error("first failed"); }),
  /first failed/,
);
assertions += 1;
await projectPolicy.enqueueKeyed(pending, "recover", async () => { order.push("recovered"); });
equal(order.at(-1), "recovered");
equal(pending.size, 0);

const uriApi = {
  from({ authority = "", path: value, scheme }) {
    return { toString: () => `${scheme}://${authority}${value}` };
  },
  parse(value) {
    const parsed = new URL(value);
    return { authority: parsed.host, path: parsed.pathname };
  },
};
const adapters = protocolHelpers.createLanguageServerProtocolAdapters({
  isMarkupContent: (value) => value?.kind === "markdown",
  uriApi,
});
equal(adapters.filePathToUri("/repo/main.ts", { sep: "/", normalize: (value) => value }), "file:///repo/main.ts");
deepEqual(adapters.resolveCapabilities({ hoverProvider: true, referencesProvider: true }), {
  hover: true,
  locationKinds: ["references"],
});
deepEqual(adapters.resolveLocations({ uri: "file:///repo/main.ts", range: { start: 1 } }, {
  sep: "/",
  normalize: (value) => value,
}), [{ path: "/repo/main.ts", range: { start: 1 } }]);
deepEqual(adapters.normalizeHover({
  contents: { kind: "markdown", value: "```ts\nconst answer = 42\n```\nDocs" },
}, { line: 3 }), {
  signature: "const answer = 42",
  documentation: "Docs",
  range: { start: { line: 3 }, end: { line: 3 } },
});

equal(openIn.isOpenableUrl("https://example.test", () => false), true);
equal(openIn.isOpenableUrl("http://example.test", () => false), true);
equal(openIn.isOpenableUrl("file:///tmp/file", () => false), false);
equal(openIn.isOpenableUrl("codex://internal", (value) => value.startsWith("codex:")), true);
equal(openIn.isOpenableUrl("not a URL", () => false), false);

const logged = [];
const logEvent = sandbox.createMcpSandboxEventLogger(() => ({
  info(message, tags) { logged.push({ message, tags }); },
}));
logEvent("guest_attached", {
  initId: "init-1",
  origin: "https://widget.test",
  ownerWebContents: { id: 7 },
  sandboxId: "sandbox-1",
  allowLocalDevelopment: false,
  sourceUrl: "https://widget.test",
}, { safe: { warm: true }, sensitive: { guestWebContentsId: 8 } });
deepEqual(logged, [{
  message: "mcp_app_sandbox.guest_attached",
  tags: {
    safe: { warm: true },
    sensitive: {
      initId: "init-1",
      origin: "https://widget.test",
      ownerWebContentsId: 7,
      sandboxId: "sandbox-1",
      guestWebContentsId: 8,
    },
  },
}]);
const initialized = [];
sandbox.initializeMcpSandbox(
  { initializeDefaultSessionHeaders() { initialized.push("network"); } },
  { initialize() { initialized.push("lifecycle"); } },
);
deepEqual(initialized, ["network", "lifecycle"]);

const main = fs.readFileSync(path.join(root, ".reference/originals/main/main-C-Mhak1n.ts"), "utf8");
equal(main.includes('require("./main-app/projects/project-write-policy.js")'), true);
equal(main.includes("computeProjectOrderMoves,"), true);
equal(main.includes("enqueueKeyed,"), true);
equal(main.includes("function H6e("), false);
equal(main.includes("async function d2("), false);
equal(main.includes("function L0("), false);
equal(main.includes("function j0e("), false);
equal(main.includes("function k$("), false);
equal(main.includes("function y2e("), false);
equal(main.includes("initializeMcpSandbox: initializeMcpSandboxRuntime"), true);

console.log(`${assertions} composition residue convergence assertions passed`);
