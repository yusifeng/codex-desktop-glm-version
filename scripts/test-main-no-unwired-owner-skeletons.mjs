import assert from "node:assert/strict";
import fs from "node:fs";

const root = new URL("../", import.meta.url);
const removedSkeletons = [
  "src/main/main-app/window/window-context.ts",
  "src/main/main-app/fetch-handler/electron-fetch-handler.ts",
  "src/main/main-app/app-shell/run-main-app-startup.ts",
];

for (const path of removedSkeletons) {
  assert.equal(fs.existsSync(new URL(path, root)), false, `${path} must not return as an unwired owner`);
}

const main = fs.readFileSync(
  new URL(".reference/originals/main/main-C-Mhak1n.ts", root),
  "utf8",
);
assert.equal(main.includes("PBe = class"), true, "real Electron fetch owner remains authoritative");
assert.equal(main.includes("ert = class"), true, "real WindowContext owner remains authoritative");
assert.equal(main.includes("async function Ust("), true, "real startup owner remains authoritative");

console.log("6 main unwired-owner skeleton assertions passed");
