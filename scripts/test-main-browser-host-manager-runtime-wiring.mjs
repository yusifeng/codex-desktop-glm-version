import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(
  path.join(root, "src/main-recovered/main-C-Mhak1n.ts"),
  "utf8",
);
const classStart = source.indexOf("tQe = class {");
const classEnd = source.indexOf("var r$e = createElectronMessageHandlerClass", classStart);
assert.ok(classStart >= 0 && classEnd > classStart, "BrowserHostManager owner is present");
const owner = source.slice(classStart, classEnd);

assert.match(
  owner,
  /constructor\(e, t, hostId = J, i = QBe\(\), a = new cX\(\), o = NHe\(\), s = \{\}\)/,
  "the third BrowserHostManager constructor argument retains the host-id contract",
);
assert.match(
  owner,
  /this\.comments = new hGe\([\s\S]*?\n\s*hostId,\n\s*\)\)/,
  "the comment runtime receives the current host id",
);
assert.doesNotMatch(
  owner,
  /browserPageLifecycleClass/,
  "the host id is never confused with the extracted page lifecycle class",
);
assert.match(
  owner,
  /this\.browserPageHostLifecycle = new BrowserPageHostLifecycle\(/,
  "the extracted page lifecycle owner is constructed independently",
);

const handler = fs.readFileSync(
  path.join(root, "src/main/main-app/window/electron-message-handler.ts"),
  "utf8",
);
assert.match(
  handler,
  /new tQe\(\s*this\.windowManager,\s*this\.errorReporter,\s*this\.hostId,/,
  "ElectronMessageHandler supplies its host id to BrowserHostManager",
);

console.log("5 BrowserHostManager runtime wiring assertions passed");
