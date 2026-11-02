import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import * as esbuild from "esbuild";

const entryPoints = {
  "action-url-policy": "src/renderer/app-primary/runtime/action-url-policy.ts",
  "annotation-anchor-point": "src/renderer/app-primary/runtime/annotation-anchor-point.ts",
  "device-onboarding-policy": "src/renderer/app-primary/runtime/device-onboarding-policy.ts",
  "mcp-extension-policy": "src/renderer/app-primary/runtime/mcp-extension-policy.ts",
  "multi-agent-config": "src/renderer/app-primary/runtime/multi-agent-config.ts",
  "platform-shortcut-label": "src/renderer/app-primary/runtime/platform-shortcut-label.ts",
  "project-target-policy": "src/renderer/app-primary/runtime/project-target-policy.ts",
  "thread-navigation-keys": "src/renderer/app-primary/runtime/thread-navigation-keys.ts",
  "non-empty-collection": "src/renderer/app-shared/runtime/non-empty-collection.ts",
  "path-key-policy": "src/renderer/app-shared/runtime/path-key-policy.ts",
  "shortcut-scope-policy": "src/renderer/app-shared/runtime/shortcut-scope-policy.ts",
};
const modules = Object.fromEntries(await Promise.all(Object.entries(entryPoints).map(async ([name, entryPoint]) => {
  const result = await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
  });
  return [name, await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`)];
})));

let assertions = 0;
const equal = (actual, expected) => {
  assertions += 1;
  assert.deepEqual(actual, expected);
};

const urls = modules["action-url-policy"];
equal(urls.isAbsoluteHttpUrl("https://example.com/image.png"), true);
equal(urls.isAbsoluteHttpUrl("http://example.com/image.png"), true);
equal(urls.isAbsoluteHttpUrl("codex://image"), false);
equal(urls.isAbsoluteHttpUrl("/image.png"), false);

const projects = modules["project-target-policy"];
equal(projects.isGitBackedProjectTarget({ kind: "git" }, [], null), false);
equal(projects.isGitBackedProjectTarget({ kind: "folder" }, [{ projectId: "p", projectKind: "local", gitRepos: [{}] }], "p"), true);
equal(projects.isGitBackedProjectTarget({ kind: "git" }, [{ projectId: "p", projectKind: "remote", gitRepos: [] }], "p"), false);
equal(projects.isGitBackedProjectTarget({ kind: "git" }, [{ projectId: "p", projectKind: "local", gitRepos: [] }], "p"), true);
equal(projects.isGitBackedProjectTarget({ kind: "folder" }, [], "missing"), false);

const keys = modules["thread-navigation-keys"];
equal(keys.getThreadSearchKey({ kind: "local", hostId: "local", threadKey: "thread" }), "thread");
equal(keys.getThreadSearchKey({ kind: "local", hostId: "remote-host", threadKey: "thread" }), "thread:remote-host");
equal(keys.getThreadSearchKey({ kind: "remote", threadKey: "remote-thread" }), "remote-thread");
equal(keys.getThreadSearchKey({ kind: "chatgpt", conversationId: "conversation" }), "chatgpt:conversation");
equal(keys.createNavigationCacheKey({ accountId: "a", locale: "zh-CN", navigationKey: 7, pathname: "/home", product: "codex" }), '["a","zh-CN","codex","/home",7]');

const annotation = modules["annotation-anchor-point"];
equal(annotation.getAnnotationAnchorPoint({ askForEditAnchor: { point: { x: 2, y: 3 } }, rect: { x: 10, y: 20, width: 8 } }), { x: 2, y: 3 });
equal(annotation.getAnnotationAnchorPoint({ rect: { x: 10, y: 20, width: 8 } }), { x: 14, y: 20 });

const onboarding = modules["device-onboarding-policy"];
equal(onboarding.shouldShowDeviceOnboarding({ deviceStatus: "missing", hasEverBeenDetected: true, onboardingState: "pending" }), true);
equal(onboarding.shouldShowDeviceOnboarding({ deviceStatus: "detected", hasEverBeenDetected: false, onboardingState: "idle" }), true);
equal(onboarding.shouldShowDeviceOnboarding({ deviceStatus: "connected", hasEverBeenDetected: false, onboardingState: "idle" }), true);
equal(onboarding.shouldShowDeviceOnboarding({ deviceStatus: "missing", hasEverBeenDetected: false, onboardingState: "idle" }), false);
equal(onboarding.shouldShowDeviceOnboarding({ deviceStatus: "connected", hasEverBeenDetected: true, onboardingState: "idle" }), false);
equal(onboarding.shouldShowDeviceOnboarding({ deviceStatus: "connected", hasEverBeenDetected: false, onboardingState: "complete" }), false);

const mcp = modules["mcp-extension-policy"];
equal(mcp.isMcpExtensionKind({ kind: "mcp-extension" }), true);
equal(mcp.isMcpExtensionKind({ kind: "plugin" }), false);
equal(mcp.isMcpExtensionKind(null), false);

const shortcuts = modules["platform-shortcut-label"];
equal(shortcuts.getPlatformCommandShortcutLabel("Win32"), "Ctrl I");
equal(shortcuts.getPlatformCommandShortcutLabel("Linux x86_64"), "Ctrl I");
equal(shortcuts.getPlatformCommandShortcutLabel("MacIntel"), "⌘I");

const config = modules["multi-agent-config"];
const validConfig = { features: { multi_agent_v2: { max_concurrent_threads_per_session: 12 } } };
equal(config.getMaxConcurrentThreadsPerSession({ authMethod: "chatgpt", config: validConfig }), 12);
equal(config.getMaxConcurrentThreadsPerSession({ authMethod: "api-key", config: validConfig }), undefined);
equal(config.getMaxConcurrentThreadsPerSession({ authMethod: "chatgpt", config: { features: { multi_agent_v2: { max_concurrent_threads_per_session: 7 } } } }), undefined);
equal(config.getMaxConcurrentThreadsPerSession({ authMethod: "chatgpt", config: { features: { multi_agent_v2: { max_concurrent_threads_per_session: 8.5 } } } }), undefined);
equal(config.getMaxConcurrentThreadsPerSession({ authMethod: "chatgpt", config: null }), undefined);
equal(config.getMaxConcurrentThreadsPerSession({ authMethod: "chatgpt", config: { features: [] } }), undefined);

const collections = modules["non-empty-collection"];
equal(collections.hasItems([]), false);
equal(collections.hasItems([0]), true);
equal(collections.hasItems("text"), true);

const paths = modules["path-key-policy"];
equal(paths.isWindowsDrivePath("C:\\work\\repo"), true);
equal(paths.isWindowsDrivePath("d:/work/repo"), true);
equal(paths.isWindowsDrivePath("/work/repo"), false);
equal(paths.createCaseInsensitivePathKey("C:\\Work\\Repo"), "c:/work/repo");
equal(paths.createCaseInsensitivePathKey("\\\\?\\C:\\Work\\Repo"), "c:/work/repo");
equal(paths.createCaseInsensitivePathKey("\\\\?\\UNC\\Server\\Share"), "//server/share");

const shortcutsPolicy = modules["shortcut-scope-policy"];
equal(shortcutsPolicy.isOsGlobalShortcut({ shortcutScope: "os-global" }), true);
equal(shortcutsPolicy.isOsGlobalShortcut({ shortcutScope: "app" }), false);

console.log(`app-primary navigation policy cluster: ${assertions} assertions passed`);
