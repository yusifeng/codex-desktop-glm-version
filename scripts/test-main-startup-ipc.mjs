import assert from "node:assert/strict";
import fs from "node:fs";
import { registerStartupIpcHandlers } from "../src/main/main-app/startup/startup-ipc.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const handlers = new Map();
const warnings = [];
const dragCalls = [];
const context = {
  getSharedObjectSnapshot: () => ({ shared: true }),
  getInitialSidebarBootstrap: () => ({ sidebar: true }),
  startFileDrag: (sender, payload) => {
    dragCalls.push(["file", sender.name, payload]);
    return payload.allowed;
  },
};
const runtime = {
  Of: () => ({ type: "string" }),
  Nf: () => ({ refine: (predicate) => ({ type: "url", predicate }) }),
  wf: (shape) => ({
    safeParse(value) {
      const success =
        value != null &&
        typeof value === "object" &&
        typeof value.url === "string" &&
        shape.url.predicate(value.url) &&
        typeof value.title === "string" &&
        typeof value.html === "string";
      return success ? { success: true, data: value } : { success: false };
    },
  }),
};
registerStartupIpcHandlers({
  ipcMain: { on: (channel, handler) => handlers.set(channel, handler) },
  channels: {
    sentryBootstrap: "sentry",
    buildFlavor: "flavor",
    sharedObjects: "shared",
    sidebarBootstrap: "sidebar",
    fileDrag: "file-drag",
    linkDrag: "link-drag",
  },
  runtime,
  buildFlavor: "internal",
  getContextForWebContents: (sender) => sender.hasContext ? context : null,
  isTrustedIpcEvent: (event) => event.trusted,
  getSentryBootstrap: () => ({ dsn: "dsn", appVersion: "1.0" }),
  logger: { n: () => ({ warning: (...args) => warnings.push(args) }) },
});

equal([...handlers.keys()], ["sentry", "flavor", "shared", "sidebar", "file-drag", "link-drag"]);

function event(trusted = true, hasContext = true) {
  return {
    trusted,
    sender: {
      name: "renderer",
      hasContext,
      startDrag(payload) {
        dragCalls.push(["link", this.name, payload]);
      },
    },
  };
}

{
  const trusted = event();
  handlers.get("sentry")(trusted);
  equal(trusted.returnValue, { dsn: "dsn", appVersion: "1.0" });
  const rejected = event(false);
  handlers.get("sentry")(rejected);
  equal(rejected.returnValue, null);
}

{
  const trusted = event();
  handlers.get("flavor")(trusted);
  equal(trusted.returnValue, "internal");
  const rejected = event(false);
  handlers.get("flavor")(rejected);
  equal(rejected.returnValue, null);
}

{
  const trusted = event();
  handlers.get("shared")(trusted);
  equal(trusted.returnValue, { shared: true });
  const missing = event(true, false);
  handlers.get("shared")(missing);
  equal(missing.returnValue, {});
  const rejected = event(false);
  handlers.get("shared")(rejected);
  equal(rejected.returnValue, {});
}

{
  const trusted = event();
  handlers.get("sidebar")(trusted);
  equal(trusted.returnValue, { sidebar: true });
  const missing = event(true, false);
  handlers.get("sidebar")(missing);
  equal(missing.returnValue, null);
  const rejected = event(false);
  handlers.get("sidebar")(rejected);
  equal(rejected.returnValue, null);
}

{
  const trusted = event();
  handlers.get("file-drag")(trusted, { allowed: true, path: "/tmp/file" });
  equal(trusted.returnValue, true);
  equal(dragCalls[0], ["file", "renderer", { allowed: true, path: "/tmp/file" }]);
  const missing = event(true, false);
  handlers.get("file-drag")(missing, { allowed: true });
  equal(missing.returnValue, false);
  const rejected = event(false);
  handlers.get("file-drag")(rejected, { allowed: true });
  equal(rejected.returnValue, false);
}

{
  const payload = { url: "https://example.com", title: "Example", html: "<b>Example</b>" };
  const trusted = event();
  handlers.get("link-drag")(trusted, payload);
  equal(dragCalls[1], ["link", "renderer", payload]);
  handlers.get("link-drag")(event(), { ...payload, url: "file:///tmp/file" });
  handlers.get("link-drag")(event(false), payload);
  equal(dragCalls.length, 2);
}

{
  const failure = new Error("drag failed");
  const throwing = event();
  throwing.sender.startDrag = () => { throw failure; };
  handlers.get("link-drag")(throwing, {
    url: "http://example.com",
    title: "Example",
    html: "Example",
  });
  equal(warnings.length, 1);
  equal(warnings[0][0], "Failed to start native link drag");
  equal(warnings[0][1].sensitive.error, failure);
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("registerStartupIpcHandlers"), true);
equal(main.includes("registerStartupIpcHandlers({"), true);
equal(main.includes("sentryBootstrap: a.Rt"), true);
equal(main.includes("function zrt("), false);
equal(main.includes("Frt = n.wf"), false);

console.log(`${assertions} main startup IPC assertions passed`);
