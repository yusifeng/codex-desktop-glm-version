import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

async function load(relativePath, requireStub = () => { throw new Error("unexpected require"); }) {
  const source = fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
  const module = { exports: {} };
  Function("require", "module", "exports", transpiled.code)(requireStub, module, module.exports);
  return { exports: module.exports, source };
}

const compareSemver = (left, right) => {
  const parse = (value) => value.replace(/-.*/, "").split(".").map(Number);
  const a = parse(left);
  const b = parse(right);
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] < b[index] ? -1 : 1;
  }
  if (left === right) return 0;
  if (!left.includes("-")) return 1;
  if (!right.includes("-")) return -1;
  return left.localeCompare(right, undefined, { numeric: true });
};
const version = (await load("../src/main/main-app/app-server/version-capabilities.ts", (specifier) => {
  if (specifier === "@chunk/shared") return {
    Qu: (value) => typeof value === "string" && /^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(value),
    Zu: compareSemver,
  };
  throw new Error(`unexpected require ${specifier}`);
})).exports;
equal(version.isValidAppServerVersion("1.0.0"), true);
equal(version.isValidAppServerVersion("invalid"), false);
equal(version.isValidAppServerVersion(null), false);
equal(version.supportsAppServerSections("0.148.0-alpha.6"), false);
equal(version.supportsAppServerSections("0.148.0-alpha.7"), true);
equal(version.supportsAppServerSections("0.148.0"), true);

const auth = (await load("../src/main/main-app/app-server/auth-protocols.ts")).exports;
equal(auth.appServerProtocolsForToken("token/value"), ["codex-app-server", "openai-bearer.token/value"]);

const renderer = (await load("../src/main/main-app/window/renderer-window-identity.ts")).exports;
const frameName = `codex-renderer-window:browserCommentPopup:${encodeURIComponent("conversation-1\0tab-1")}:${encodeURIComponent("session/1")}`;
equal(renderer.parseBrowserCommentPopupFrameName(frameName, (value) => `parsed:${value}`), {
  windowId: "browserCommentPopup",
  browserTabId: "parsed:tab-1",
  conversationId: "conversation-1",
  sessionId: "session/1",
});
equal(renderer.parseBrowserCommentPopupFrameName("other:frame", String), null);
equal(renderer.parseBrowserCommentPopupFrameName("codex-renderer-window:other:value:value", String), null);
equal(renderer.parseBrowserCommentPopupFrameName("codex-renderer-window:browserCommentPopup:missing-session", String), null);
equal(renderer.parseBrowserCommentPopupFrameName("codex-renderer-window:browserCommentPopup:%E0%A4%A:value", String), null);

const files = (await load("../src/main/main-app/files/workspace-file-policy.ts")).exports;
equal(files.NATIVE_DOCUMENT_EXTENSIONS, [".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsm", ".xlsx"]);
equal(files.MAX_WORKSPACE_FILE_BYTES, 268_435_456);
equal(files.sanitizeWorkspaceDownloadFileName("C:\\folder\\report?.docx"), "report_.docx");
equal(files.sanitizeWorkspaceDownloadFileName("/folder/.."), "download");
equal(files.sanitizeWorkspaceDownloadFileName("/folder/"), "folder");
equal(files.sanitizeWorkspaceDownloadFileName("\0bad:name"), "_bad_name");
equal(files.isWorkspaceFileTooLarge(268_435_456), false);
equal(files.isWorkspaceFileTooLarge(268_435_457), true);

const { MinimumIntervalGate } = (await load("../src/main/main-app/util/minimum-interval-gate.ts")).exports;
const gate = new MinimumIntervalGate({ minIntervalMs: 100 });
equal(gate.minIntervalMs, 100);
equal(gate.canPass(1_000), true);
equal(gate.tryPass(1_000), true);
equal(gate.tryPass(1_099), false);
equal(gate.tryPass(1_100), true);
gate.mark(2_000);
equal(gate.canPass(2_099), false);
equal(gate.canPass(2_100), true);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
for (const wiring of [
  'require("./main-app/app-server/version-capabilities.js")',
  'require("./main-app/app-server/auth-protocols.js")',
  'require("./main-app/window/renderer-window-identity.js")',
  'require("./main-app/files/workspace-file-policy.js")',
  'require("./main-app/util/minimum-interval-gate.js")',
  "identitiesEqual: isSameAuthIdentity",
  "identityEquals: isSameAuthIdentity",
  "protocolsForToken: appServerProtocolsForToken",
  "parseBrowserCommentPopupFrameName,",
  "sanitizeFileName: sanitizeWorkspaceDownloadFileName",
  "PerformanceTriggerGate: MinimumIntervalGate",
]) equal(main.includes(wiring), true);
const forkPlacement = fs.readFileSync(
  new URL("../src/main/main-app/threads/fork-placement.ts", import.meta.url),
  "utf8",
);
equal(forkPlacement.includes("supportsAppServerSections(context.appServerVersion)"), true);

for (const oldDefinition of [
  /^function (?:ae|oe|se|ce|ue|de|W|ge|be|xe|Te|Oe|je|K|Pe)\(/m,
  /^var ke = /m,
  /^var Me = /m,
  /^var at = /m,
]) equal(oldDefinition.test(main), false);
equal(main.includes("ct = class {"), false);
equal(main.includes("nativeDocumentExtensions: ke"), false);
equal(main.includes("maxFileBytes: Ae"), false);

const threadSectionServer = fs.readFileSync(
  new URL("../src/main/main-app/sidebar/thread-section-server.ts", import.meta.url),
  "utf8",
);
equal(threadSectionServer.includes("supportsAppServerSections(t.connection.appServerVersion)"), true);
equal(threadSectionServer.includes("isValidAppServerVersion(o)"), true);

console.log(`${assertions} early runtime policy assertions passed`);
