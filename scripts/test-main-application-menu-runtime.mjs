import assert from "node:assert/strict";
import fs from "node:fs";
import {
  ApplicationMenuManager,
  normalizeMenuAccelerator,
} from "../src/main/main-app/app-shell/application-menu-runtime.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

equal(normalizeMenuAccelerator("CmdOrCtrl+Shift+C", true), "c+command+shift");
equal(normalizeMenuAccelerator("CommandOrControl+SHIFT+c", false), "c+control+shift");
equal(normalizeMenuAccelerator("Cmd+Option+Return", true), "alt+command+enter");
equal(normalizeMenuAccelerator("Control+Option+Esc", false), "control+escape+option");
equal(normalizeMenuAccelerator("Ctrl+Alt+Escape", false), "alt+control+escape");
equal(normalizeMenuAccelerator("Meta+Plus", true), "=+command");
equal(normalizeMenuAccelerator("Super+Plus", false), "plus+super");
equal(normalizeMenuAccelerator("Command+Enter", true), normalizeMenuAccelerator("Return+Cmd", true));
equal(normalizeMenuAccelerator("Ctrl+Escape", false), normalizeMenuAccelerator("Esc+Control", false));

{
  let builds = 0;
  const manager = new ApplicationMenuManager(() => { builds += 1; });
  equal(builds, 0);
  equal(manager.refresh(), undefined);
  equal(builds, 1);
  manager.refresh();
  equal(builds, 2);
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
const menuBuilder = fs.readFileSync(
  new URL("../src/main/main-app/app-shell/app-menu.ts", import.meta.url),
  "utf8",
);
equal(main.includes("ApplicationMenuManager, normalizeMenuAccelerator"), true);
equal(main.includes("new ApplicationMenuManager(() =>"), true);
equal(main.includes("normalizeMenuAccelerator,"), true);
equal(menuBuilder.includes("normalizeMenuAccelerator(we.accelerator, r)"), true);
equal(main.includes("function v7("), false);
equal(main.includes("var cit = class"), false);

console.log(`${assertions} main application-menu runtime assertions passed`);
