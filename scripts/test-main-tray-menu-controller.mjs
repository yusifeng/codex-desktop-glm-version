import assert from "node:assert/strict";
import fs from "node:fs";
import { createTrayMenuControllerClass, isTrayMenuThreadsChangedMessage } from "../src/main/main-app/tray/tray-menu-controller.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

function createHarness(platform, { ready = true } = {}) {
  const callbacks = [];
  const builtMenus = [];
  const clearedTimers = [];
  const eventHandlers = new Map();
  const persistentMenus = [];
  const popupMenus = [];
  const timers = [];
  let destroyed = 0;
  let quitCalls = 0;
  const Menu = {
    buildFromTemplate(template) {
      if (template.length === 1 && template[0].role === "quit") {
        return { items: [{ label: "System Quit" }] };
      }
      const onceHandlers = new Map();
      const menu = {
        template,
        emit(event) { onceHandlers.get(event)?.(); onceHandlers.delete(event); },
        once(event, handler) { onceHandlers.set(event, handler); },
      };
      builtMenus.push(menu);
      return menu;
    },
  };
  const tray = {
    destroy() { destroyed += 1; },
    isReady: () => ready,
    on(event, handler) { eventHandlers.set(event, handler); },
    popUpContextMenu(menu) { popupMenus.push(menu); },
    setContextMenu(menu) { persistentMenus.push(menu); },
    whenReady: () => ready ? Promise.resolve() : Promise.reject(new Error("not ready")),
  };
  const timeout = (callback, delay) => {
    const token = { callback, delay, unrefCalls: 0, unref() { this.unrefCalls += 1; } };
    timers.push(token);
    return token;
  };
  const TrayMenuController = createTrayMenuControllerClass({
    Menu,
    app: { quit() { quitCalls += 1; } },
    platform,
    setTimeoutImpl: timeout,
    clearTimeoutImpl: (token) => clearedTimers.push(token),
  });
  const nativeIntl = {
    formatMessage({ defaultMessage, values }) {
      return values?.appName == null
        ? defaultMessage
        : defaultMessage.replace("{appName}", values.appName);
    },
  };
  const controller = new TrayMenuController(
    tray,
    () => callbacks.push("open-main"),
    () => callbacks.push("new-thread"),
    (threadPath) => callbacks.push(["open-thread", threadPath]),
    () => callbacks.push("feedback"),
    nativeIntl,
    "Codex",
  );
  return {
    builtMenus,
    callbacks,
    clearedTimers,
    controller,
    emitTray: (event) => eventHandlers.get(event)?.(),
    get destroyed() { return destroyed; },
    persistentMenus,
    popupMenus,
    get quitCalls() { return quitCalls; },
    timers,
  };
}

const trayMenuThreads = {
  runningThreads: [
    { path: "/run", title: "Running task", projectLabel: "Project" },
  ],
  unreadThreads: [
    { path: "/one", title: "One", isProjectless: true },
    { path: "/two", title: "Two", projectLabel: "Two project" },
    { path: "/three", title: "Three", projectLabel: "Three project" },
    { path: "/long", title: "12345678901234567890123456789012345😀", projectLabel: "Long" },
  ],
  pinnedThreads: [],
  recentThreads: [{ path: "/recent", title: "Recent", projectLabel: "Recent project" }],
  usageLimits: [{ label: "5h: 50%" }],
};

equal(isTrayMenuThreadsChangedMessage({ type: "tray-menu-threads-changed" }), true);
equal(isTrayMenuThreadsChangedMessage({ type: "other" }), false);

{
  const harness = createHarness("darwin");
  equal(await harness.controller.waitForReady(), true);
  equal(harness.controller.isReady(), true);
  await harness.controller.handleMessage({ type: "tray-menu-threads-changed", trayMenuThreads });
  const items = harness.controller.getNativeTrayMenuItems();
  equal(items[0], { label: "Running", enabled: false });
  equal(items[1].label, "Running task");
  equal(items[3], { label: "Unread", enabled: false });
  equal(items[4].sublabel, "Chats");
  equal(items[7].label, "More");
  equal(items[7].submenu[0].label, "1234567890123456789012345678901234…");
  equal(items[9], { label: "Recent", enabled: false });
  equal(items[12], { label: "Usage", enabled: false });
  equal(items[13], { label: "5h: 50%", enabled: false });
  equal(items.at(-5).label, "New Chat");
  equal(items.at(-3).label, "Open Codex");
  equal(items.at(-1).label, "System Quit");
  items[4].click();
  items.at(-5).click();
  items.at(-3).click();
  items.at(-1).click();
  equal(harness.callbacks, [["open-thread", "/one"], "new-thread", "open-main"]);
  equal(harness.quitCalls, 1);

  harness.emitTray("mouse-down");
  equal(harness.popupMenus.length, 1);
  equal(harness.controller.nativeTrayClickSuppressionReason, "open");
  harness.emitTray("click");
  equal(harness.popupMenus.length, 1);
  harness.popupMenus[0].emit("menu-will-show");
  equal(harness.controller.isNativeTrayMenuOpen, true);
  harness.emitTray("mouse-down");
  equal(harness.controller.nativeTrayClickSuppressionReason, "close");
  harness.popupMenus[0].emit("menu-will-close");
  equal(harness.controller.isNativeTrayMenuOpen, false);
  equal(harness.timers.length, 1);
  equal(harness.timers[0].delay, 0);
  equal(harness.timers[0].unrefCalls, 1);
  harness.timers[0].callback();
  equal(harness.controller.nativeTrayClickSuppressionReason, null);
  harness.controller.destroy();
  equal(harness.destroyed, 1);
}

{
  const harness = createHarness("linux");
  equal(harness.persistentMenus.length, 1);
  harness.emitTray("click");
  equal(harness.callbacks, ["open-main"]);
  const previousMenus = harness.persistentMenus.length;
  await harness.controller.handleMessage({ type: "other" });
  equal(harness.persistentMenus.length, previousMenus);
  await harness.controller.handleMessage({ type: "tray-menu-threads-changed", trayMenuThreads });
  equal(harness.persistentMenus.length, previousMenus + 1);
  equal(harness.controller.getNativeTrayMenuItems().some((item) => item.label === "Usage"), false);
}

{
  const harness = createHarness("win32", { ready: false });
  equal(harness.builtMenus.length, 1);
  harness.emitTray("click");
  equal(harness.callbacks, ["open-main"]);
  harness.emitTray("right-click");
  equal(harness.popupMenus[0], harness.builtMenus[0]);
  const items = harness.controller.getNativeTrayMenuItems();
  equal(items.some((item) => item.label === "Send Feedback"), true);
  equal(items.some((item) => item.label === "Open Codex"), false);
  items.find((item) => item.label === "Send Feedback").click();
  equal(harness.callbacks, ["open-main", "feedback"]);
  equal(await harness.controller.waitForReady(), false);
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("TrayMenuController = createTrayMenuControllerClass({"), true);
equal(main.includes("new TrayMenuController("), true);
equal(main.includes("isTrayMenuThreadsChangedMessage(c)"), true);
equal(main.includes("var prt = class"), false);
equal(main.includes("function frt("), false);
equal(main.includes("function Q5("), false);
equal(main.includes("function $5("), false);

console.log(`${assertions} main tray-menu controller assertions passed`);
