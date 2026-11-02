import assert from "node:assert/strict";
import path from "node:path";
import * as esbuild from "esbuild";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);

async function load(relativePath) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, relativePath)],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${relativePath}`);
}

const [order, profiles, settings, comments, descriptors, sandbox, routes, hosts] = await Promise.all([
  load("src/main/main-app/util/order-by.ts"),
  load("src/main/main-app/browser-sidebar/browser-profile-import-contracts.ts"),
  load("src/main/main-app/browser-sidebar/browser-settings-contracts.ts"),
  load("src/main/main-app/browser-sidebar/browser-comment-contracts.ts"),
  load("src/main/main-app/settings/runtime-descriptors.ts"),
  load("src/main/main-app/mcp-sandbox/contracts.ts"),
  load("src/main/main-app/window/route-contracts.ts"),
  load("src/main/shared/host-config.ts"),
]);

assert.deepEqual(order.orderBy([{ x: 2, i: 0 }, { x: 1, i: 1 }, { x: 2, i: 2 }], ["x"], ["asc"]).map(({ i }) => i), [1, 0, 2]);
assert.deepEqual(order.orderBy([{ x: { y: 1 } }, { x: { y: 2 } }], [["x", "y"]], ["desc"]).map((entry) => entry.x.y), [2, 1]);

assert.equal(profiles.browserProfileSignalsSchema.parse({ hasCookiesOlderThanProfile: true, hasPasswordsOlderThanProfile: false }).hasCookiesOlderThanProfile, true);
assert.equal(profiles.browserProfileSchema.array().parse([{ source: "chrome", appName: "Chrome", profileName: "Default", profileDirectoryName: "Default", profilePath: "/p", rootPath: "/", hasCookies: true, hasPasswords: false }])[0].hasHistory, false);
assert.equal(profiles.browserProfileImportRequestSchema.parse({ source: "atlas", profilePath: " /profile " }).importExtensions, false);

assert.equal(settings.browserSettingsRoutePathForUrl("chrome://downloads/?q=1"), "/settings/browser-use/downloads?q=1");
assert.equal(settings.browserSettingsRoutePathForUrl("https://example.com"), null);
assert.equal(settings.CONTACT_SETTINGS_PARTITION, "persist:codex-contact-info-settings");
assert.equal(descriptors.browserRuntimeSettings.debugChromePagesEnabled.key, "debug-chrome-pages-enabled");
assert.equal(descriptors.computerUseSettings.alwaysHidePictureInPicture.default, false);

const baseAnchor = { kind: "region", pageUrl: "https://example.com", title: "Page", elementPath: null, frameUrl: null, framePath: [], scrollContainers: [], isFixed: false, point: { xPercent: 0.5, y: 2 }, rect: { x: 1, y: 2, width: 3, height: 4 }, role: null, name: null, selector: null, nearbyText: null };
assert.equal(comments.browserAnchorsEqual(baseAnchor, { ...baseAnchor }), true);
assert.equal(comments.browserAnchorsEqual(baseAnchor, { ...baseAnchor, rect: { ...baseAnchor.rect, width: 4 } }), false);
assert.deepEqual(comments.sanitizeBrowserComments([{ body: "", designChange: {} }, { body: "kept", designChange: {}, additionalAnchors: [1] }], false, false), [{ body: "kept" }]);
assert.equal(comments.browserTransferKey("a", "b"), "a\0b");

assert.equal(sandbox.isMcpSandboxId("sandbox_1"), true);
assert.equal(sandbox.isMcpSandboxId("bad/id"), false);
assert.equal(sandbox.parseMcpSandboxPartition("persist:codex-mcp-app-sandbox:abc"), "abc");
const sandboxUrl = sandbox.buildMcpSandboxUrl({ locale: "en-US", subdomain: "abc" });
assert.equal(sandbox.parseMcpSandboxOrigin(sandboxUrl, { requireSkybridge: true }), "https://abc.web-sandbox.oaiusercontent.com");
assert.equal(sandbox.parsePersistentMcpSandboxId(`${sandboxUrl}#sandboxId=abc`), "abc");

assert.equal(routes.buildQuickChatRoute("thread id", null), "/chatgpt/quick-chat/thread%20id");
assert.equal(routes.buildMcpAppRoute("plugin", "tool"), "/mcp-app/plugins/plugin/tool");
assert.equal(routes.isSafeAppRoute("/local/thread"), true);
assert.equal(routes.isSafeAppRoute("/settings/secrets"), false);

assert.equal(hosts.isEligibleThreadSource("code_review"), true);
assert.equal(hosts.isEligibleThreadSource("unknown"), false);
assert.equal(hosts.normalizeRemotePath("C:\\Users\\David\\"), "/mnt/c/users/david");
assert.equal(hosts.canonicalizeRemotePath("C:\\Users\\David\\"), "C:/Users/David");
assert.equal(hosts.defaultProjectLabel("/workspace/project/"), "project");
assert.deepEqual(hosts.sshTargetArgs({ hostname: "host", sshPort: 22, identity: "key" }), ["-i", "key", "-p", "22", "host"]);

console.log("42 shared-root extraction assertions passed");
