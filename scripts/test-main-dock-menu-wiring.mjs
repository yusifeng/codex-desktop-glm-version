import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const root = path.resolve(import.meta.dirname, "..");
const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "dock-menu-wiring-"));
const output = path.join(temporaryDirectory, "dock-menu.mjs");
await build({
  bundle: true,
  define: { "process.platform": JSON.stringify("darwin") },
  entryPoints: [path.join(root, "src/main/main-app/misc/dock-menu.ts")],
  format: "esm",
  logLevel: "silent",
  outfile: output,
  platform: "node",
  plugins: [{
    name: "electron-mock",
    setup(buildApi) {
      buildApi.onResolve({ filter: /^electron$/ }, () => ({ path: "electron", namespace: "mock" }));
      buildApi.onLoad({ filter: /.*/, namespace: "mock" }, () => ({
        contents: "const value = globalThis.__dockElectronMock; export const app = value.app; export const Menu = value.Menu;",
        loader: "js",
      }));
    },
  }],
});

const menus = [];
globalThis.__dockElectronMock = {
  app: { dock: { setMenu(menu) { menus.push(menu); } } },
  Menu: { buildFromTemplate(template) { return template; } },
};
const { DockMenuManager } = await import(pathToFileURL(output));
const opened = [];
const nativeIntl = { formatMessage: ({ defaultMessage }) => defaultMessage };
const manager = new DockMenuManager((threadPath) => opened.push(threadPath), nativeIntl);
equal(menus, [[]]);

manager.setCompletedThreads([
  { path: "/completed", title: "Completed", projectLabel: "Project C" },
  { path: "/duplicate", title: "Duplicate completed", projectLabel: "Project D" },
]);
await manager.handleMessage({
  type: "tray-menu-threads-changed",
  trayMenuThreads: {
    unreadThreads: [
      { path: "/duplicate", title: "Duplicate unread", projectLabel: "Project U" },
      { path: "/one", title: "One", isProjectless: true },
      { path: "/two", title: "Two", projectLabel: "Project 2" },
      { path: "/three", title: "Three", projectLabel: "Project 3" },
      { path: "/long", title: "12345678901234567890123456789012345😀", projectLabel: "Long" },
    ],
    recentThreads: [
      { path: "/duplicate", title: "Duplicate recent", projectLabel: "Project R" },
      { path: "/recent", title: "Recent", projectLabel: "" },
    ],
  },
});

const menu = menus.at(-1);
equal(menu[0], { label: "Unread", enabled: false });
equal(menu[1].label, "Duplicate unread");
equal(menu[1].sublabel, "Project U");
equal(menu[2].sublabel, "Chats");
equal(menu[4].label, "More");
equal(menu[4].submenu.length, 3);
equal(menu[4].submenu[1].label, "1234567890123456789012345678901234…");
equal(menu[5], { type: "separator" });
equal(menu[6], { label: "Recent", enabled: false });
equal(menu[7].label, "Recent");
equal(Object.hasOwn(menu[7], "sublabel"), false);
menu[2].click();
menu[4].submenu[0].click();
menu[7].click();
equal(opened, ["/one", "/three", "/recent"]);

const menuCount = menus.length;
await manager.handleMessage({ type: "unrelated" });
equal(menus.length, menuCount);

const main = await fs.readFile(
  path.join(root, ".reference/originals/main/main-C-Mhak1n.ts"),
  "utf8",
);
equal(main.includes('require("./main-app/misc/dock-menu.js")'), true);
equal(main.includes("new DockMenuManager("), true);
equal(main.includes("ose = class"), false);
equal(main.includes("function sse("), false);
equal(main.includes("function Rl("), false);
equal(main.includes("function zl("), false);

console.log(`${assertions} main dock-menu wiring assertions passed`);
