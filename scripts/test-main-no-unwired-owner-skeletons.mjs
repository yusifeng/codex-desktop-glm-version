import assert from "node:assert/strict";
import fs from "node:fs";

const root = new URL("../", import.meta.url);
const realOwners = [
  ["src/main/main-app/window/window-context.ts", "createWindowContextClass"],
  ["src/main/main-app/fetch-handler/electron-fetch-handler.ts", "createElectronFetchHandlerClass"],
];
for (const [path, factory] of realOwners) {
  const source = fs.readFileSync(new URL(path, root), "utf8");
  assert.equal(source.includes(factory), true, `${path} must contain the wired owner factory`);
  assert.equal(source.includes("not wired"), false, `${path} must not regress to a skeleton`);
}

const removedSkeletons = [
  "src/main/main-app/app-shell/run-main-app-startup.ts",
  "src/main/main-app/sidebar/saved-sections-service.ts",
  "src/main/main-app/sidebar/saved-sections-state.ts",
  "src/main/main-app/sidebar/saved-sections-transactions.ts",
  "src/main/main-app/automations/automation-update-tool.ts",
  "src/main/main-app/automations/habitat.ts",
  "src/main/main-app/automations/inbox-items.ts",
  "src/main/main-app/automations/index.ts",
  "src/main/main-app/browser-sidebar/comment-overlay-manager.ts",
  "src/main/main-app/browser-sidebar/comment-controller.ts",
];

for (const path of removedSkeletons) {
  assert.equal(fs.existsSync(new URL(path, root)), false, `${path} must not return as an unwired owner`);
}

const main = fs.readFileSync(
  new URL(".reference/originals/main/main-C-Mhak1n.ts", root),
  "utf8",
);
assert.equal(main.includes("PBe = createElectronFetchHandlerClass({"), true, "real Electron fetch owner is wired");
assert.equal(main.includes("ert = createWindowContextClass({"), true, "real WindowContext owner is wired");
assert.equal(main.includes("async function Ust("), true, "real startup owner remains authoritative");

console.log("17 main unwired-owner skeleton assertions passed");
