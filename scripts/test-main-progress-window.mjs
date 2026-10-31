import assert from "node:assert/strict";
import fs from "node:fs";
import { buildProgressWindowHtml, createStartupProgressWindowRuntime } from "../src/main/main-app/startup/progress-window.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const includes = (value, expected) => {
  assert.ok(value.includes(expected));
  assertions += 1;
};

class FakeBrowserWindow {
  static instances = [];
  constructor(options) {
    this.options = options;
    this.events = new Map();
    this.webEvents = new Map();
    this.calls = [];
    this.destroyed = false;
    this.webContents = {
      on: (event, handler) => this.webEvents.set(event, handler),
      setWindowOpenHandler: (handler) => { this.windowOpenHandler = handler; },
    };
    FakeBrowserWindow.instances.push(this);
  }
  center() { this.calls.push("center"); }
  destroy() { this.calls.push("destroy"); this.destroyed = true; }
  focus() { this.calls.push("focus"); }
  isDestroyed() { return this.destroyed; }
  loadURL(url) {
    this.url = url;
    return this.loadError == null ? Promise.resolve() : Promise.reject(this.loadError);
  }
  on(event, handler) { this.events.set(event, handler); }
  setMenuBarVisibility(value) { this.calls.push(["menu", value]); }
  show() { this.calls.push("show"); }
  showInactive() { this.calls.push("showInactive"); }
}

const escaped = buildProgressWindowHtml(
  "Title <unsafe>",
  "Detail & unsafe",
  (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;"),
);
includes(escaped, "Title &lt;unsafe>");
includes(escaped, "Detail &amp; unsafe");
equal(escaped.match(/Title &lt;unsafe>/g)?.length, 2);

const delayedCalls = [];
const runtime = createStartupProgressWindowRuntime({
  BrowserWindow: FakeBrowserWindow,
  getNativeIntl: () => ({ formatMessage: ({ defaultMessage }) => `i18n:${defaultMessage}` }),
  escapeHtml: (value) => value.replaceAll("<", "&lt;"),
  createDelayedProgressWindow: (options) => {
    delayedCalls.push(options);
    return "cancel-delay";
  },
});

{
  let quitCalls = 0;
  const cleanup = await runtime.createStartupProgressWindow({
    kind: "app-server",
    onQuit: () => { quitCalls += 1; },
    windowIconPath: "/icon.png",
  });
  const window = FakeBrowserWindow.instances.at(-1);
  equal(window.options.width, 420);
  equal(window.options.height, 176);
  equal(window.options.title, "i18n:Codex is still starting");
  equal(window.options.icon, "/icon.png");
  equal(window.options.webPreferences, {
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    spellcheck: false,
    devTools: false,
  });
  equal(window.calls, [["menu", false], "center", "show", "focus"]);
  equal(window.windowOpenHandler(), { action: "deny" });
  let navigationPrevented = 0;
  window.webEvents.get("will-navigate")({ preventDefault: () => { navigationPrevented += 1; } });
  equal(navigationPrevented, 1);
  const html = decodeURIComponent(window.url.split(",")[1]);
  includes(html, "i18n:Codex is still starting");
  includes(html, "i18n:This may take several minutes — keep the app open");
  let closePrevented = 0;
  window.events.get("close")({ preventDefault: () => { closePrevented += 1; } });
  equal(closePrevented, 1);
  equal(quitCalls, 1);
  cleanup();
  equal(window.destroyed, true);
  equal(window.calls.at(-1), "destroy");
  window.events.get("close")({ preventDefault: () => { closePrevented += 1; } });
  equal(quitCalls, 1);
}

{
  await runtime.createStartupProgressWindow({
    activate: false,
    kind: "sqlite",
    onQuit() {},
  });
  const window = FakeBrowserWindow.instances.at(-1);
  equal(window.options.title, "i18n:Rebuilding conversation history");
  equal(Object.hasOwn(window.options, "icon"), false);
  equal(window.calls, [["menu", false], "center", "showInactive"]);
}

{
  class RejectingWindow extends FakeBrowserWindow {
    loadURL(url) { this.url = url; return Promise.reject(new Error("load failed")); }
  }
  const rejectingRuntime = createStartupProgressWindowRuntime({
    BrowserWindow: RejectingWindow,
    getNativeIntl: () => ({ formatMessage: ({ defaultMessage }) => defaultMessage }),
    escapeHtml: (value) => value,
    createDelayedProgressWindow() {},
  });
  await assert.rejects(
    rejectingRuntime.createStartupProgressWindow({ kind: "sqlite", onQuit() {} }),
    { message: "load failed" },
  );
  assertions += 1;
  const window = FakeBrowserWindow.instances.at(-1);
  equal(window.destroyed, true);
  equal(window.calls.at(-1), "destroy");
}

{
  const onError = () => {};
  equal(runtime.createDelayedStartupProgressWindow({
    activate: false,
    delayMs: 250,
    kind: "sqlite",
    onError,
    onQuit() {},
  }), "cancel-delay");
  equal(delayedCalls.length, 1);
  equal(delayedCalls[0].delayMs, 250);
  equal(delayedCalls[0].onError, onError);
  equal(typeof delayedCalls[0].show, "function");
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("createStartupProgressWindow: x7"), true);
equal(main.includes("createDelayedStartupProgressWindow: Oit"), true);
equal(main.includes("await x7({"), true);
equal(main.includes("Oit({"), true);
equal(main.includes("async function x7("), false);
equal(main.includes("function Oit("), false);
equal(main.includes("function kit("), false);

console.log(`${assertions} main progress-window assertions passed`);
