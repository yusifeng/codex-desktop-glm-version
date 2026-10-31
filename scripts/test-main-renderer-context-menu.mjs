import assert from "node:assert/strict";
import fs from "node:fs";
import { registerRendererContextMenu } from "../src/main/main-app/window/renderer-context-menu.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const tick = () => new Promise((resolve) => setImmediate(resolve));

function createHarness(options = {}) {
  let handler;
  let builtTemplate;
  let popupOptions;
  const imageCalls = [];
  const removed = [];
  const makeImage = (name, size = { width: 32, height: 32 }) => ({
    name,
    representations: [],
    templateCalls: [],
    getSize: () => size,
    isEmpty: () => options.emptyImages?.includes(name) ?? false,
    addRepresentation(value) { this.representations.push(value); },
    resize(resizeOptions) {
      const resized = makeImage(`resized:${name}`, { width: 16, height: 16 });
      resized.resizeOptions = resizeOptions;
      imageCalls.push(["resize", name, resizeOptions, resized]);
      return resized;
    },
    setTemplateImage(value) { this.templateCalls.push(value); },
  });
  const ownerWindow = options.noWindow
    ? null
    : { getBounds: () => ({ x: 0, y: 0, width: 100, height: 100 }) };
  const sender = {
    async executeJavaScript(script) {
      sender.script = script;
      if (options.renderError) throw new Error("render failed");
      return options.renderedIcons ?? [];
    },
  };
  const dispose = registerRendererContextMenu({
    ipcMain: {
      handle(channel, value) { equal(channel, "context-menu"); handler = value; },
      removeHandler: (channel) => removed.push(channel),
    },
    channel: "context-menu",
    BrowserWindow: { fromWebContents: () => ownerWindow },
    screen: { getDisplayMatching: () => ({ scaleFactor: options.scaleFactor ?? 2 }) },
    nativeImage: {
      createEmpty() {
        const image = makeImage("empty");
        imageCalls.push(["empty", image]);
        return image;
      },
      createFromDataURL(value) {
        const image = makeImage(`data:${value}`);
        imageCalls.push(["data", value, image]);
        return image;
      },
      createFromPath(value) {
        const image = makeImage(`path:${value}`);
        imageCalls.push(["path", value, image]);
        return image;
      },
    },
    Menu: {
      buildFromTemplate(template) {
        builtTemplate = template;
        return { popup(value) { popupOptions = value; } };
      },
    },
    platform: options.platform ?? "darwin",
    fileURLToPath: (value) => value.replace("file://", ""),
    join: (...parts) => parts.join("/"),
    existsSync: (value) => options.existingPaths?.includes(value) ?? false,
    iconSearchRoots: ["/root-one", "/root-two/"],
    isTrustedIpcEvent: (event) => event.trusted,
  });
  return {
    dispose,
    get builtTemplate() { return builtTemplate; },
    get handler() { return handler; },
    imageCalls,
    get popupOptions() { return popupOptions; },
    removed,
    sender,
  };
}

{
  const harness = createHarness();
  equal(await harness.handler({ trusted: false, sender: harness.sender }, []), { id: null });
  equal(harness.builtTemplate, undefined);
}

{
  const svg = "data:image/svg+xml,%3Csvg%3E%3C/svg%3E";
  const appSvg = "/apps/example/icon.svg";
  const harness = createHarness({
    renderedIcons: [[svg, "data:image/png;base64,svg"], [appSvg, "data:image/png;base64,app"]],
    existingPaths: ["/root-one/relative.png"],
  });
  const pending = harness.handler(
    { trusted: true, sender: harness.sender },
    [
      { id: "svg", type: "normal", label: "A&B", icon: svg },
      { type: "separator" },
      {
        id: "parent",
        type: "submenu",
        label: "Parent",
        submenu: [
          { id: "app", type: "normal", label: "App", icon: appSvg, enabled: false },
          { id: "file", type: "normal", label: "File", icon: "file:///tmp/icon.png" },
          { id: "absolute", type: "normal", label: "Absolute", icon: "/tmp/absolute.png" },
          { id: "relative", type: "normal", label: "Relative", icon: "relative.png" },
        ],
      },
    ],
  );
  await tick();
  equal(harness.sender.script.includes("canvas.width = 32"), true);
  equal(harness.builtTemplate[0].label, "A&&B");
  equal(harness.builtTemplate[0].registerAccelerator, false);
  equal(harness.builtTemplate[0].enabled, true);
  equal(harness.builtTemplate[1], { type: "separator" });
  equal(harness.builtTemplate[2].submenu[0].enabled, false);
  equal(harness.popupOptions.window.getBounds().width, 100);
  const svgImage = harness.builtTemplate[0].icon;
  equal(svgImage.name, "resized:empty");
  equal(svgImage.templateCalls, [true]);
  equal(harness.imageCalls.find(([kind]) => kind === "empty")[1].representations, [
    { dataURL: "data:image/png;base64,svg", scaleFactor: 2 },
  ]);
  equal(harness.imageCalls.some(([kind, value]) => kind === "path" && value === "/tmp/icon.png"), true);
  equal(harness.imageCalls.some(([kind, value]) => kind === "path" && value === "/tmp/absolute.png"), true);
  equal(harness.imageCalls.some(([kind, value]) => kind === "path" && value === "/root-one/relative.png"), true);
  harness.builtTemplate[2].submenu[0].click();
  equal(await pending, { id: "app" });
  harness.popupOptions.callback();
}

{
  const harness = createHarness({ noWindow: true, renderError: true, scaleFactor: Number.NaN });
  const pending = harness.handler(
    { trusted: true, sender: harness.sender },
    [{ id: "item", type: "normal", label: "Item", icon: "data:image/svg+xml,svg" }],
  );
  await tick();
  equal(harness.popupOptions.window, undefined);
  equal(harness.builtTemplate[0].icon.name.startsWith("resized:data:"), true);
  harness.popupOptions.callback();
  equal(await pending, { id: null });
}

{
  const harness = createHarness({ existingPaths: ["/root-one/apps/example/icon.svg"] });
  const pending = harness.handler(
    { trusted: true, sender: harness.sender },
    [{ id: "item", type: "normal", label: "Item", icon: "/apps/example/icon.svg" }],
  );
  await tick();
  equal(harness.imageCalls.some(([kind, value]) => kind === "path" && value === "/root-one/apps/example/icon.svg"), true);
  harness.builtTemplate[0].click();
  equal(await pending, { id: "item" });
  harness.dispose();
  equal(harness.removed, ["context-menu"]);
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("registerRendererContextMenu"), true);
equal(main.includes("registerRendererContextMenu({"), true);
equal(main.includes("function ort("), false);
equal(main.includes("function X5("), false);
equal(main.includes("function srt("), false);
equal(main.includes("function crt("), false);
equal(main.includes("Y5 = `data:image/svg+xml`"), false);

console.log(`${assertions} main renderer context-menu assertions passed`);
