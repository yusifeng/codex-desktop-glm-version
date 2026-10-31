import assert from "node:assert/strict";
import fs from "node:fs";
import { createApplicationMenuBuilder } from "../src/main/main-app/app-shell/app-menu.ts";
import { normalizeMenuAccelerator } from "../src/main/main-app/app-shell/application-menu-runtime.ts";

let assertions = 0;
function equal(actual, expected, message) {
  assertions += 1;
  assert.deepEqual(actual, expected, message);
}

class FakeMenuItem {
  constructor(options) {
    Object.assign(this, options);
    if (Array.isArray(options.submenu)) this.submenu = new FakeMenu(options.submenu);
  }
}

class FakeMenu {
  constructor(template = []) {
    this.items = template.map((item) => item instanceof FakeMenuItem ? item : new FakeMenuItem(item));
  }

  insert(index, item) {
    this.items.splice(index, 0, item instanceof FakeMenuItem ? item : new FakeMenuItem(item));
  }

  append(item) {
    this.items.push(item instanceof FakeMenuItem ? item : new FakeMenuItem(item));
  }

  getMenuItemById(id) {
    for (const item of this.items) {
      if (item.id === id) return item;
      const nested = item.submenu?.getMenuItemById(id);
      if (nested != null) return nested;
    }
    return null;
  }
}

class FakeBrowserWindow {
  static focused = null;
  static windows = [];

  static getFocusedWindow() {
    return this.focused;
  }

  static getAllWindows() {
    return this.windows;
  }

  constructor(id = 1) {
    this.id = id;
    this.destroyed = false;
    this.minimized = false;
    this.fullScreen = false;
    this.webContents = { id: id * 10, focus: () => { this.focusCalls = (this.focusCalls ?? 0) + 1; } };
  }

  isDestroyed() { return this.destroyed; }
  isMinimized() { return this.minimized; }
  restore() { this.minimized = false; this.restoreCalls = (this.restoreCalls ?? 0) + 1; }
  show() { this.showCalls = (this.showCalls ?? 0) + 1; }
  focus() { this.focusCalls = (this.focusCalls ?? 0) + 1; }
  close() { this.closeCalls = (this.closeCalls ?? 0) + 1; }
  isFullScreen() { return this.fullScreen; }
  setFullScreen(value) { this.fullScreen = value; }
}

function flatten(menu) {
  const output = [];
  const visit = (current) => {
    for (const item of current?.items ?? []) {
      output.push(item);
      visit(item.submenu);
    }
  };
  visit(menu);
  return output;
}

function findByLabel(menu, label) {
  return flatten(menu).find((item) => item.label === label);
}

function createHarness({ isMacOS = false, enableUpdater = true } = {}) {
  FakeBrowserWindow.focused = null;
  FakeBrowserWindow.windows = [];
  const state = {
    menus: [],
    applicationMenu: null,
    messages: [],
    navigations: [],
    externalUrls: [],
    aboutCalls: [],
    traceCalls: [],
    tracePublications: [],
    updateChecks: 0,
    dialogs: [],
    clipboardText: " codex://settings ",
    clipboardWrites: [],
    loggerInfo: [],
    loggerWarnings: [],
    ensureWindowCalls: 0,
    freshWindowCalls: [],
    taskManagerCalls: 0,
    commandAccelerators: new Map(),
  };
  const primary = new FakeBrowserWindow(7);
  FakeBrowserWindow.windows = [primary];
  const commandIds = [
    "archiveThread", "closeWindow", "copyConversationPath", "copyDeeplink",
    "copyWorkingDirectory", "findInThread", "focusBrowserAddressBar",
    "hardReloadBrowserPage", "logOut", "navigateBack", "navigateForward",
    "newProjectlessTask", "newTask", "newWindow", "nextThread", "openBrowserTab",
    "openCommandMenu", "openFolder", "previousThread", "reloadBrowserPage",
    "renameThread", "searchChats", "searchFiles", "settings", "showKeyboardShortcuts",
    "temporaryChat", "toggleBottomPanel", "toggleFileTreePanel", "togglePinnedSummary",
    "toggleSidePanel", "toggleSidebar", "toggleTerminal", "toggleThreadPin",
    "toggleTraceRecording", "showWorkspaceTabView", "stepWorkspaceLayout",
  ];
  state.commandAccelerators.set("settings", ["CmdOrCtrl+,"]);
  state.commandAccelerators.set("searchFiles", [isMacOS ? "Command+F" : "Ctrl+F"]);
  state.commandAccelerators.set("newTask", ["CmdOrCtrl+N", "CmdOrCtrl+Shift+N"]);
  const commands = commandIds.map((id) => ({
    id,
    titleIntlId: `title.${id}`,
    electron: { menuTitle: id, isOverridableByBrowserWebpage: id === "findInThread" },
  }));
  const shared = {
    Ft: commands,
    Dt: ["nextThread", "previousThread"],
    Ct: () => ({ keymap: true }),
    At: ({ commandId }) => state.commandAccelerators.get(commandId) ?? [],
    Pt: () => false,
    Mt: ({ commandId }) => ({ menuTitle: commandId, menuTitleIntlId: `title.${commandId}` }),
    Ot: (commandId) => commands.find((command) => command.id === commandId) ?? null,
    Nt: () => true,
    xt: () => [],
    cu: { supportsReactScan: () => true },
    Mo: () => true,
  };
  const electron = {
    BrowserWindow: FakeBrowserWindow,
    MenuItem: FakeMenuItem,
    Menu: {
      buildFromTemplate(template) {
        const menu = new FakeMenu(template);
        state.menus.push(menu);
        return menu;
      },
      setApplicationMenu(menu) {
        state.applicationMenu = menu;
      },
    },
    app: {
      getName: () => "Codex Test",
      showTaskManager: () => { state.taskManagerCalls += 1; },
    },
    clipboard: {
      readText: () => state.clipboardText,
      writeText: (text) => state.clipboardWrites.push(text),
    },
    dialog: {
      showMessageBox: (options) => {
        state.dialogs.push(options);
        return Promise.resolve({ response: 0 });
      },
    },
    shell: { openExternal: (url) => state.externalUrls.push(url) },
    webContents: { getFocusedWebContents: () => null },
  };
  const windowManager = {
    getPrimaryWindow: () => primary,
    getAppShellShortcutState: () => ({
      temporaryChatEnabled: true,
      focusArea: "main",
      threadNavigationShortcutLocked: false,
    }),
    sendMessageToWindow: (window, message) => state.messages.push({ window, message }),
    sendMessageToAllRegisteredWindows: (message) => state.messages.push({ all: true, message }),
    isHotkeyWindowThread: () => false,
  };
  const buildApplicationMenu = createApplicationMenuBuilder({
    shared,
    bootstrap: {
      hn: () => ({
        formatMessage: (descriptor) => descriptor.values?.appName == null
          ? descriptor.messageId
          : `${descriptor.messageId}:${descriptor.values.appName}`,
      }),
    },
    electron,
    menuIds: { file: "file", edit: "edit", view: "view", window: "window", help: "help" },
    sparkleLogger: () => ({
      info: (message, fields) => state.loggerInfo.push({ message, fields }),
      warning: (message, fields) => state.loggerWarnings.push({ message, fields }),
    }),
    showAboutDialog: (options) => state.aboutCalls.push(options),
    resolveCloseTabCommand: () => null,
    resolveOriginPanel: () => "right",
    createTraceMenuItem: (options) => {
      state.traceCalls.push(options);
      return { id: "toggle-trace-recording", label: "Trace" };
    },
    publishTraceState: (manager) => state.tracePublications.push(manager),
    normalizeMenuAccelerator,
  });
  const options = {
    buildFlavor: "prod",
    isMacOS,
    allowDevtools: true,
    allowDebugMenu: true,
    allowWindowReload: true,
    enableUpdater,
    desktopFeatureAvailability: {
      codexLocalAccess: true,
      workLocalAccess: true,
      multiWindow: true,
      unifiedTabStrip: false,
      browserPane: true,
    },
    sparkleManager: {
      checkForUpdates: async () => { state.updateChecks += 1; },
      hasUpdater: () => true,
      getUnavailableReason: () => null,
    },
    ensurePrimaryWindowVisible: async () => {
      state.ensureWindowCalls += 1;
      return primary;
    },
    createFreshWindow: async (route) => {
      state.freshWindowCalls.push(route);
      return new FakeBrowserWindow(8);
    },
    getAuthenticatedUserId: async () => "user",
    queueCodexDeepLinkUrl: () => false,
    navigateToRoute: (window, route) => state.navigations.push({ window, route }),
    collapseHotkeyWindowToHome: async () => {},
    getElectronMessageHandlerForWindow: () => ({
      createOrSelectProject: async () => { state.projectCalls = (state.projectCalls ?? 0) + 1; },
      getBrowserHostManager: () => null,
    }),
    windowManager,
    traceRecordingUploadOptions: { appVersion: "1" },
  };
  return { state, primary, buildApplicationMenu, options };
}

{
  const harness = createHarness();
  equal(harness.buildApplicationMenu(harness.options), undefined);
  equal(harness.state.menus.length, 1);
  equal(harness.state.applicationMenu, harness.state.menus[0]);
  equal(harness.state.traceCalls.length, 1);
  equal(harness.state.traceCalls[0].allowDevtools, true);
  equal(harness.state.traceCalls[0].windowManager, harness.options.windowManager);
  equal(harness.state.tracePublications, [harness.options.windowManager]);
  equal(harness.state.applicationMenu.getMenuItemById("file") != null, true);
  equal(harness.state.applicationMenu.getMenuItemById("edit") != null, true);
  equal(harness.state.applicationMenu.getMenuItemById("view") != null, true);
  equal(harness.state.applicationMenu.getMenuItemById("help") != null, true);

  const settings = findByLabel(harness.state.applicationMenu, "title.settings");
  equal(settings.accelerator, "CmdOrCtrl+,");
  await settings.click({}, null, { triggeredByAccelerator: false });
  equal(harness.state.ensureWindowCalls, 1);
  equal(harness.state.navigations, [{
    window: harness.primary,
    route: "/settings/general-settings",
  }]);

  const searchFiles = findByLabel(harness.state.applicationMenu, "title.searchFiles");
  equal(searchFiles.accelerator, undefined, "find accelerators must remain reserved for page search");
  const newTaskItems = flatten(harness.state.applicationMenu)
    .filter((item) => item.label === "title.newTask");
  equal(newTaskItems.length >= 2, true, "primary and hidden alternate new-task entries must exist");
  await newTaskItems[0].click({}, null, { triggeredByAccelerator: false });
  equal(harness.state.messages.at(-1).message, { type: "run-command", id: "newTask" });

  const temporary = findByLabel(harness.state.applicationMenu, "title.temporaryChat");
  equal(temporary.enabled, true);
  temporary.click();
  equal(harness.state.messages.at(-1).message, { type: "run-command", id: "temporaryChat" });

  const openFolder = findByLabel(harness.state.applicationMenu, "title.openFolder");
  await openFolder.click();
  equal(harness.state.projectCalls, 1);

  const documentation = findByLabel(harness.state.applicationMenu, "loadingPage.documentationLink");
  documentation.click();
  equal(harness.state.externalUrls, ["https://developers.openai.com/codex/app"]);
  const taskManager = findByLabel(harness.state.applicationMenu, "electron.appMenu.help.taskManager");
  taskManager.click();
  equal(harness.state.taskManagerCalls, 1);
  equal(findByLabel(harness.state.applicationMenu, "Trace").id, "toggle-trace-recording");

  const update = findByLabel(harness.state.applicationMenu, "electron.appMenu.app.checkForUpdates");
  update.click();
  await Promise.resolve();
  equal(harness.state.updateChecks, 1);
  equal(harness.state.loggerInfo[0].message, "Check for updates requested via menu.");
}

{
  const harness = createHarness({ isMacOS: true, enableUpdater: false });
  harness.buildApplicationMenu(harness.options);
  equal(harness.state.applicationMenu.items[0].role, "appMenu");
  equal(harness.state.applicationMenu.getMenuItemById("window") != null, true);
  const editItems = harness.state.applicationMenu.getMenuItemById("edit").submenu.items;
  equal(editItems.some((item) => item.role === "pasteAndMatchStyle" && item.visible === false), true);
  equal(findByLabel(harness.state.applicationMenu, "electron.appMenu.app.checkForUpdates"), undefined);
  const about = findByLabel(harness.state.applicationMenu, "codex.aboutDialog.title:Codex Test");
  about.click({}, harness.primary);
  equal(harness.state.aboutCalls, [{ buildFlavor: "prod", parent: harness.primary }]);
}

{
  const harness = createHarness({ enableUpdater: true });
  harness.options.sparkleManager = {
    checkForUpdates: async () => { harness.state.updateChecks += 1; },
    hasUpdater: () => false,
    getUnavailableReason: () => "disabled",
  };
  harness.buildApplicationMenu(harness.options);
  findByLabel(harness.state.applicationMenu, "electron.appMenu.app.checkForUpdates").click();
  await Promise.resolve();
  await Promise.resolve();
  equal(harness.state.updateChecks, 1);
  equal(harness.state.loggerWarnings[0].fields.safe.reason, "disabled");
  equal(harness.state.dialogs[0].title, "Updates Unavailable");
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
const owner = fs.readFileSync(
  new URL("../src/main/main-app/app-shell/app-menu.ts", import.meta.url),
  "utf8",
);
equal(main.includes("var sit = createApplicationMenuBuilder({"), true);
equal(main.includes("function sit("), false);
equal(main.includes("function iit("), false);
equal(main.includes("var g7 ="), false);
equal(main.includes("sit({"), true, "application shell composition must consume the migrated builder");
equal(owner.includes("return [section(\"file-menu\")"), false, "the old skeleton implementation must be gone");
equal(owner.includes("l.Menu.setApplicationMenu(Lt)"), true);

console.log(`${assertions} main application-menu builder assertions passed`);
