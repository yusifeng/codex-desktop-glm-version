import assert from "node:assert/strict";
import fs from "node:fs";
import { createTrayLifecycle } from "../src/main/main-app/tray/tray-lifecycle.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

function createHarness(platform, options = {}) {
  const appHandlers = new Map();
  const candidateCalls = [];
  const createdImages = [];
  const nativeControllers = [];
  const themeHandlers = new Set();
  const trayControllers = [];
  const trays = [];
  const distributionCalls = [];
  const packageFlavorCalls = [];
  const fileIconCalls = [];
  const images = options.images ?? {};
  const nativeIntl = { locale: "en-US" };

  const imageFor = (path) => {
    const image = {
      path,
      empty: images[path] === "empty",
      resizeCalls: [],
      templateCalls: [],
      isEmpty() { return this.empty; },
      resize(resizeOptions) {
        this.resizeCalls.push(resizeOptions);
        return { resizedFrom: path, resizeOptions };
      },
      setTemplateImage(value) { this.templateCalls.push(value); },
    };
    createdImages.push(image);
    return image;
  };

  const app = {
    isPackaged: options.packaged ?? false,
    getName: () => "Codex",
    on(event, handler) { appHandlers.set(event, handler); },
    async getFileIcon(path, iconOptions) {
      fileIconCalls.push([path, iconOptions]);
      return options.fileIconPromise == null
        ? { fallback: iconOptions.size }
        : options.fileIconPromise;
    },
  };
  class Tray {
    constructor(icon, guid) {
      this.icon = icon;
      this.guid = guid;
      this.destroyCalls = 0;
      this.images = [];
      this.toolTips = [];
      trays.push(this);
    }
    destroy() { this.destroyCalls += 1; }
    setImage(image) { this.images.push(image); }
    setToolTip(value) { this.toolTips.push(value); }
  }
  class NativeStatusItemController {
    constructor(...args) {
      this.args = args;
      this.destroyCalls = 0;
      nativeControllers.push(this);
    }
    destroy() { this.destroyCalls += 1; }
    isReady() { return true; }
  }
  class TrayMenuController {
    constructor(...args) {
      this.args = args;
      this.destroyCalls = 0;
      trayControllers.push(this);
    }
    destroy() {
      this.destroyCalls += 1;
      this.args[0].destroy();
    }
    isReady() { return options.ready ?? true; }
    async waitForReady() {
      if (options.readyPromise != null) return options.readyPromise;
      return options.ready ?? true;
    }
  }

  const lifecycle = createTrayLifecycle({
    app,
    Tray,
    nativeImage: { createFromPath: imageFor },
    nativeTheme: {
      shouldUseDarkColorsForSystemIntegratedUI: options.dark ?? false,
      on(event, handler) { equal(event, "updated"); themeHandlers.add(handler); },
      off(event, handler) { equal(event, "updated"); themeHandlers.delete(handler); },
    },
    platform,
    resourcesPath: "/resources",
    execPath: "/bin/codex",
    join: (...parts) => parts.join("/"),
    agentFlavor: "agent",
    resolveTrayTemplateNames: () => ["status.png", "status-template.png"],
    resolveTrayWindowsIconNames: options.resolveWindowsNames ?? (() => ({ dark: "dark.ico", light: "light.ico" })),
    resolveTrayIconCandidates(candidateOptions) {
      candidateCalls.push(candidateOptions);
      return options.candidates?.(candidateOptions) ?? ["/icon/one", "/icon/two"];
    },
    iconBaseName: "codex",
    getWindowsDistributionFlavor(flavor, identity) {
      distributionCalls.push([flavor, identity]);
      return `distributed-${flavor}`;
    },
    getWindowsPackageIdentity: () => "package-identity",
    resolveWindowsPackageIdentity(flavor) {
      packageFlavorCalls.push(flavor);
      return `guid-${flavor}`;
    },
    NativeStatusItemController,
    TrayMenuController,
    getNativeIntl: () => nativeIntl,
    isTrayReady: (ready, controller) => ready && controller?.isReady() === true,
  });

  const startOptions = {
    repoRoot: "/repo",
    buildFlavor: "dev",
    settingsStore: { name: "settings" },
    onOpenMainWindow() {},
    onTrayMenuOpenNewThread() {},
    onTrayMenuOpenRecentThread() {},
    onTrayMenuSendFeedback() {},
  };
  return {
    appHandlers,
    candidateCalls,
    createdImages,
    distributionCalls,
    fileIconCalls,
    lifecycle,
    nativeControllers,
    nativeIntl,
    packageFlavorCalls,
    startOptions,
    themeHandlers,
    trayControllers,
    trays,
  };
}

{
  const harness = createHarness("darwin");
  const nativeOptions = {
    ...harness.startOptions,
    getNativeStatusItemState() {},
    getComputerUseServiceProcessIdentifier() {},
    onNativeStatusItemMenuAction() {},
  };
  const controller = await harness.lifecycle.start(nativeOptions);
  equal(harness.nativeControllers.length, 1);
  equal(controller, harness.nativeControllers[0]);
  equal(controller.args, [
    "/repo/electron/src/icons/status-template.png",
    harness.nativeIntl,
    "Codex",
    nativeOptions.settingsStore,
    nativeOptions.getNativeStatusItemState,
    nativeOptions.getComputerUseServiceProcessIdentifier,
    nativeOptions.onNativeStatusItemMenuAction,
  ]);
  equal(harness.lifecycle.getTrayController(), controller);
  equal(harness.lifecycle.isReady(), true);
  equal(await harness.lifecycle.start(nativeOptions), controller);
  equal(harness.nativeControllers.length, 1);
  equal(harness.appHandlers.has("will-quit"), true);
  harness.appHandlers.get("will-quit")();
  equal(controller.destroyCalls, 1);
  equal(harness.lifecycle.getTrayController(), null);
  equal(harness.lifecycle.isReady(), false);
}

{
  const harness = createHarness("darwin", {
    images: { "/icon/one": "empty", "/icon/two": "present" },
  });
  const controller = await harness.lifecycle.start(harness.startOptions);
  equal(harness.createdImages.map((image) => image.path), ["/icon/one", "/icon/two"]);
  equal(harness.createdImages[1].templateCalls, [true]);
  equal(harness.trays[0].icon, harness.createdImages[1]);
  equal(harness.trays[0].guid, undefined);
  equal(harness.trays[0].toolTips, ["Codex"]);
  equal(harness.trayControllers[0].args.slice(1, 5), [
    harness.startOptions.onOpenMainWindow,
    harness.startOptions.onTrayMenuOpenNewThread,
    harness.startOptions.onTrayMenuOpenRecentThread,
    harness.startOptions.onTrayMenuSendFeedback,
  ]);
  equal(controller, harness.trayControllers[0]);
  equal(harness.lifecycle.isReady(), true);
}

{
  const harness = createHarness("darwin", {
    images: { "/icon/one": "empty", "/icon/two": "empty" },
  });
  await harness.lifecycle.start(harness.startOptions);
  equal(harness.fileIconCalls, [["/bin/codex", { size: "normal" }]]);
  equal(harness.trays[0].icon, { fallback: "normal" });
}

{
  const harness = createHarness("linux", {
    candidates: () => ["/linux/icon"],
  });
  await harness.lifecycle.start(harness.startOptions);
  equal(harness.createdImages[0].resizeCalls, [{ width: 16, height: 16, quality: "best" }]);
  equal(harness.trays[0].icon, {
    resizedFrom: "/linux/icon",
    resizeOptions: { width: 16, height: 16, quality: "best" },
  });
}

{
  const harness = createHarness("linux", {
    candidates: () => ["/linux/missing"],
    images: { "/linux/missing": "empty" },
  });
  await assert.rejects(
    harness.lifecycle.start(harness.startOptions),
    /Linux tray application icon is unavailable/,
  );
  assertions += 1;
  equal(harness.trays.length, 0);
}

{
  const harness = createHarness("win32", {
    packaged: true,
    candidates: ({ dark }) => [dark ? "/win/dark" : "/win/light"],
  });
  await harness.lifecycle.start(harness.startOptions);
  equal(harness.distributionCalls, [["dev", "package-identity"]]);
  equal(harness.packageFlavorCalls, ["distributed-dev"]);
  equal(harness.trays[0].guid, "guid-distributed-dev");
  equal(harness.candidateCalls[0].flavor, "distributed-dev");
  equal(harness.candidateCalls[0].dark, false);
  equal(harness.themeHandlers.size, 1);
  equal(harness.trays[0].images[0].path, "/win/light");
  for (const handler of harness.themeHandlers) handler();
  equal(harness.trays[0].images.length, 2);
  harness.lifecycle.dispose();
  equal(harness.themeHandlers.size, 0);
  equal(harness.trayControllers[0].destroyCalls, 1);
  equal(harness.trays[0].destroyCalls, 1);
}

{
  const harness = createHarness("win32", {
    resolveWindowsNames: () => ({ dark: "same.ico", light: "same.ico" }),
    images: { "/icon/one": "empty", "/icon/two": "empty" },
  });
  await harness.lifecycle.start(harness.startOptions);
  equal(harness.themeHandlers.size, 0);
  equal(harness.fileIconCalls, [["/bin/codex", { size: "small" }]]);
  equal(harness.trays[0].icon, { fallback: "small" });
}

{
  const harness = createHarness("win32", { ready: false });
  equal(await harness.lifecycle.start(harness.startOptions), null);
  equal(harness.lifecycle.getTrayController(), null);
  equal(harness.lifecycle.isReady(), false);
  equal(harness.trayControllers[0].destroyCalls, 1);
  equal(harness.trays[0].destroyCalls, 1);
  equal(harness.themeHandlers.size, 0);
}

{
  const fileIcon = deferred();
  const harness = createHarness("win32", {
    fileIconPromise: fileIcon.promise,
    images: { "/icon/one": "empty", "/icon/two": "empty" },
    resolveWindowsNames: () => ({ dark: "same.ico", light: "same.ico" }),
  });
  const first = harness.lifecycle.start(harness.startOptions);
  const second = harness.lifecycle.start(harness.startOptions);
  harness.lifecycle.dispose();
  fileIcon.resolve({ fallback: "deferred" });
  equal(await first, null);
  equal(await second, null);
  equal(harness.trays.length, 1);
  equal(harness.trays[0].destroyCalls, 1);
  equal(harness.trayControllers.length, 0);
}

{
  const readiness = deferred();
  const harness = createHarness("linux", { readyPromise: readiness.promise });
  const first = harness.lifecycle.start(harness.startOptions);
  const second = harness.lifecycle.start(harness.startOptions);
  readiness.resolve(true);
  const [firstController, secondController] = await Promise.all([first, second]);
  equal(firstController, secondController);
  equal(harness.trays.length, 1);
  equal(harness.trayControllers.length, 1);
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("const { createTrayLifecycle } = require(\"./main-app/tray/tray-lifecycle.js\");"), true);
equal(main.includes("} = createTrayLifecycle({"), true);
equal(main.includes("getTrayController: X9,"), true);
equal(main.includes("a.u(Z9)"), true);
equal(main.includes("await Pst({"), true);
equal(main.includes("async function Pst"), false);
equal(main.includes("function Q9"), false);
equal(main.includes("function Fst"), false);
equal(main.includes("function $9"), false);
equal(main.includes("W9 = 16"), false);
equal(main.includes("G9 = null"), false);

console.log(`${assertions} main tray lifecycle assertions passed`);
