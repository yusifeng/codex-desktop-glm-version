import assert from "node:assert/strict";
import fs from "node:fs";
import { createDeepLinkRouteExecutor } from "../src/main/main-app/deep-links/route-executor.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

function createHarness(dependencyOverrides = {}, optionOverrides = {}) {
  const calls = {
    browser: [],
    logs: [],
    marketplace: [],
    messages: [],
    navigation: [],
    selected: [],
    shown: [],
    workspace: [],
  };
  const dependencies = {
    logger: { warning: (...args) => calls.logs.push(args) },
    findPluginMarketplacePath: async (options) => {
      calls.marketplace.push(options);
      return "/marketplace";
    },
    openBrowserForDeepLink: (options) => calls.browser.push(options),
    buildPluginDetailRoute: (options) => `plugin:${options.pluginId}`,
    buildMcpAppRoute: (pluginId, toolName) => `mcp:${pluginId}:${toolName}`,
    buildSharedConversationRoute: (id) => `shared:${id}`,
    buildConversationRoute: (id) => `conversation:${id}`,
    resolveProjectRoot: (roots) => roots[0],
    getLegacyProjects: () => ({}),
    resolveWorkspace: async (options) => {
      calls.workspace.push(options);
      return null;
    },
    selectWorkspaceProject: async (options) => {
      calls.selected.push(options);
      return { type: "local", projectId: "selected" };
    },
    now: () => 1234,
    ...dependencyOverrides,
  };
  const { executeDeepLinkRoute } = createDeepLinkRouteExecutor(dependencies);
  const window = { id: "window" };
  const options = {
    window,
    route: { kind: "launch" },
    globalState: { id: "global-state" },
    requestGitWorker: "git-worker",
    appServerClient: { id: "app-server" },
    listPlugins: "list-plugins",
    readThread: async () => ({ id: "thread" }),
    projectsManager: { getLocalProjects: () => ({}) },
    windowManager: {
      sendMessageToWindow: (...args) => calls.messages.push(args),
      showPrimaryWindow: (value) => calls.shown.push(value),
    },
    navigateToRoute: (...args) => calls.navigation.push(args),
    ...optionOverrides,
  };
  return {
    calls,
    execute: (route, overrides = {}) => executeDeepLinkRoute({ ...options, route, ...overrides }),
    options,
    window,
  };
}

for (const kind of [
  "applyCodexAppConfig",
  "orbitOnboarding",
  "team",
  "sharedCodexSnapshot",
  "spacePage",
]) {
  const harness = createHarness();
  equal(await harness.execute({ kind }), undefined);
  equal(harness.calls.navigation, []);
}

{
  const harness = createHarness();
  await harness.execute({ kind: "experienceActivation" });
  equal(harness.calls.messages, [[harness.window, { type: "show-chatgpt-rosalind-announcement" }]]);
}

{
  const harness = createHarness();
  await harness.execute({ kind: "pluginInstall", marketplaceName: "market", pluginName: "plugin" });
  equal(harness.calls.marketplace[0].route.pluginName, "plugin");
  equal(harness.calls.navigation, [[harness.window, "plugin:plugin"]]);
}

{
  const harness = createHarness({ findPluginMarketplacePath: async () => null });
  await harness.execute({ kind: "pluginInstall", marketplaceName: "market", pluginName: "plugin" });
  equal(harness.calls.navigation, [[harness.window, "/skills", { initialTab: "plugins" }]]);
}

{
  const failure = new Error("lookup failed");
  const harness = createHarness({ findPluginMarketplacePath: async () => { throw failure; } });
  await harness.execute({ kind: "pluginInstall", marketplaceName: "market", pluginName: "plugin" });
  equal(harness.calls.logs, [[
    "plugin_install_marketplace_lookup_failed",
    {
      safe: { marketplaceName: "market", pluginName: "plugin" },
      sensitive: { error: failure },
    },
  ]]);
  equal(harness.calls.navigation, [[harness.window, "/skills", { initialTab: "plugins" }]]);
}

{
  const harness = createHarness();
  const route = {
    kind: "petInstall",
    name: "pet",
    description: "description",
    imageUrl: "image",
    spriteVersionNumber: 2,
  };
  await harness.execute(route);
  equal(harness.calls.shown, [{ stealFocus: true }]);
  equal(harness.calls.messages, [[harness.window, {
    type: "open-pet-install-modal",
    name: "pet",
    description: "description",
    imageUrl: "image",
    spriteVersionNumber: 2,
  }]]);
}

{
  const harness = createHarness();
  await harness.execute({ kind: "pluginDetail", pluginId: "detail" });
  await harness.execute({
    kind: "pluginMcpApp",
    pluginId: "plugin",
    toolName: "tool",
    entrypoint: "entry",
    target: "target",
  });
  await harness.execute({
    kind: "localPluginDetail",
    pluginName: "local-plugin",
    marketplacePath: "/local",
    openShareDialog: true,
  });
  equal(harness.calls.navigation, [
    [harness.window, "plugin:detail"],
    [harness.window, "mcp:plugin:tool", { entrypoint: "entry", mcpAppDeepLink: "target" }],
    [harness.window, "plugin:local-plugin", { pluginDetailDeepLinkMode: "share" }],
  ]);
}

{
  const harness = createHarness();
  await harness.execute({ kind: "automations" });
  await harness.execute({
    kind: "automation",
    automationId: "id with space",
    automationSource: "source",
    edit: true,
  });
  equal(harness.calls.navigation, [
    [harness.window, "/automations", { automationMode: "create" }],
    [harness.window, "/automations?automationId=id+with+space&automationSource=source&edit=true"],
  ]);
}

{
  const harness = createHarness();
  await harness.execute({
    kind: "connectorOAuthCallback",
    fullRedirectUrl: "https://callback",
    returnTo: "settings",
  });
  await harness.execute({ kind: "launch" });
  equal(harness.calls.shown, [{ stealFocus: true }, { stealFocus: true }]);
  equal(harness.calls.messages, [[harness.window, {
    type: "connector-oauth-callback",
    fullRedirectUrl: "https://callback",
    returnTo: "settings",
  }]]);
}

{
  const harness = createHarness();
  await harness.execute({ kind: "browser", browserUrl: "https://example.com" });
  equal(harness.calls.browser, [{
    browserUrl: "https://example.com",
    initiator: "external_link",
    window: harness.window,
    windowManager: harness.options.windowManager,
  }]);
}

{
  const harness = createHarness();
  await harness.execute({ kind: "sharedChatGptConversation", sharedConversationId: "shared" });
  await harness.execute({ kind: "libraryFile", libraryFileId: "file" });
  await harness.execute({ kind: "settings", section: "account", search: "?tab=x", hash: "#part" });
  await harness.execute({ kind: "settings" });
  await harness.execute({ kind: "skills", search: "?tab=installed" });
  equal(harness.calls.navigation, [
    [harness.window, "shared:shared"],
    [harness.window, "/library/file/file"],
    [harness.window, "/settings/account?tab=x#part"],
    [harness.window, "/settings"],
    [harness.window, "/skills?tab=installed"],
  ]);
}

{
  const harness = createHarness();
  await harness.execute({ kind: "localConversation", conversationId: "missing" }, { readThread: null });
  equal(harness.calls.navigation, []);
}

{
  const failure = new Error("read failed");
  const harness = createHarness();
  await harness.execute(
    { kind: "localConversation", conversationId: "failed" },
    { readThread: async () => { throw failure; } },
  );
  equal(harness.calls.logs, [[
    "local_conversation_deep_link_lookup_failed",
    { safe: { conversationId: "failed" }, sensitive: { error: failure } },
  ]]);
  equal(harness.calls.navigation, []);
}

{
  const harness = createHarness();
  const route = {
    kind: "localConversation",
    conversationId: "conversation",
    hostId: "remote host",
    openReview: true,
    reviewDiffFilter: "staged",
    reviewPath: "/repo",
    prompt: "continue",
    browserTabId: "tab",
    browserUrl: "https://example.com",
  };
  await harness.execute(route);
  equal(harness.calls.navigation, [[
    harness.window,
    "conversation:conversation?hostId=remote+host",
    {
      openReview: true,
      reviewDiffFilter: "staged",
      reviewPath: "/repo",
      focusComposerNonce: 1234,
      prefillPrompt: "continue",
    },
  ]]);
  equal(harness.calls.browser[0].conversationId, "conversation");
}

{
  const harness = createHarness();
  await harness.execute({
    kind: "localConversation",
    conversationId: "conversation",
    browserActive: false,
    browserTabId: "tab",
    browserUrl: "https://example.com",
  });
  equal(harness.calls.navigation, []);
  equal(harness.calls.browser[0].browserActive, false);
}

{
  const project = { id: "project", rootPaths: ["/project"] };
  const harness = createHarness();
  await harness.execute(
    { kind: "newThread", projectId: "project", prompt: "start", codexAppMode: "local" },
    { projectsManager: { getLocalProjects: () => ({ project }) } },
  );
  equal(harness.calls.workspace, []);
  equal(harness.calls.selected[0].workspaceRoot, "/project");
  equal(harness.calls.selected[0].projectId, "project");
  equal(harness.calls.navigation, [[harness.window, "/", {
    codexAppMode: "local",
    focusComposerNonce: 1234,
    prefillPrompt: "start",
    project: { type: "local", projectId: "selected" },
  }]]);
}

{
  const harness = createHarness({ resolveWorkspace: async (options) => {
    harness.calls.workspace.push(options);
    return "/resolved";
  } });
  await harness.execute({ kind: "newThread", browserUrl: "https://example.com" });
  equal(harness.calls.workspace.length, 1);
  equal(harness.calls.selected[0].workspaceRoot, "/resolved");
  equal(harness.calls.browser[0].browserUrl, "https://example.com");
}

{
  const harness = createHarness({
    resolveWorkspace: async () => "/resolved",
    selectWorkspaceProject: async () => undefined,
  });
  await harness.execute({ kind: "newThread" });
  equal(harness.calls.navigation, []);
  equal(harness.calls.browser, []);
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("createDeepLinkRouteExecutor"), true);
equal(main.includes("executeDeepLinkRoute({"), true);
equal(main.includes("async function lit("), false);

console.log(`${assertions} main deep-link route-executor assertions passed`);
