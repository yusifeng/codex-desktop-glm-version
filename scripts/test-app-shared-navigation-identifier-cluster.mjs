import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import * as esbuild from "esbuild";

const entryPoints = {
  collection: "src/renderer/app-shared/runtime/non-empty-collection.ts",
  identifiers: "src/renderer/app-shared/runtime/runtime-identifier-policy.ts",
  paths: "src/renderer/app-shared/runtime/path-key-policy.ts",
  routes: "src/renderer/app-shared/runtime/navigation-route-policy.ts",
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
  const encoded = Buffer.from(result.outputFiles[0].text).toString("base64");
  return [name, await import(`data:text/javascript;base64,${encoded}`)];
})));

let assertions = 0;
const equal = (actual, expected) => {
  assertions += 1;
  assert.deepEqual(actual, expected);
};

const paths = modules.paths;
equal(paths.normalizePathSeparators("\\\\?\\C:\\Work\\Repo"), "C:/Work/Repo");
equal(paths.normalizePathSeparators("\\\\?\\UNC\\Server\\Share"), "//Server/Share");
equal(paths.normalizePathSeparators("/work/repo"), "/work/repo");
equal(paths.isAbsolutePath("/work/repo"), true);
equal(paths.isAbsolutePath("//server/share"), true);
equal(paths.isAbsolutePath("\\\\server\\share"), true);
equal(paths.isAbsolutePath("C:\\work"), true);
equal(paths.isAbsolutePath("relative/path"), false);
equal(paths.resolvePath("/work/repo", "src/file.ts"), "/work/repo/src/file.ts");
equal(paths.resolvePath("/work/repo", "/tmp/file.ts"), "/tmp/file.ts");
equal(paths.resolvePath("", "C:\\Work\\Repo"), "/C:/Work/Repo");
equal(paths.resolveDisplayPath("", "C:\\Work\\Repo", true), "C:/Work/Repo");
equal(paths.resolveDisplayPath("", "C:\\Work\\Repo", false), "/C:/Work/Repo");
equal(paths.areEquivalentPaths("C:\\Work\\Repo", "/mnt/c/work/repo"), true);
equal(paths.areEquivalentPaths("/C:/Work/Repo/", "/mnt/c/work/repo"), true);
equal(paths.areEquivalentPaths("\\\\wsl$\\Ubuntu\\mnt\\c\\Work", "C:\\work"), true);
equal(paths.areEquivalentPaths("//wsl.localhost/Ubuntu/home/user", "//wsl$/ubuntu/home/user"), true);
equal(paths.areEquivalentPaths("/work/repo", "/work/repo/"), true);
equal(paths.areEquivalentPaths("/work/repo", "/work/other"), false);

const routes = modules.routes;
equal(routes.createHotkeyThreadRoute("thread-1"), "/hotkey-window/thread/thread-1");
equal(routes.createLocalConversationRoute("thread-1"), "/local/thread-1");
equal(routes.createMcpAppRoute("server/name", "tool name"), "/mcp-app/server%2Fname/tool%20name");
equal(routes.createPluginSettingsRoute("server/name", "tool name"), "/settings/plugins/server%2Fname/tool%20name");

const identifiers = modules.identifiers;
const clientThreadId = identifiers.createClientNewThreadId();
equal(clientThreadId.startsWith("client-new-thread:"), true);
equal(identifiers.isClientNewThreadId(clientThreadId), true);
equal(identifiers.isClientNewThreadId("server-thread-id"), false);
equal(/^[0-9a-f-]{36}$/iu.test(identifiers.createRuntimeUuid()), true);
equal(identifiers.getPackageSourceSuffix("plugin@openai-curated-remote"), "openai-curated-remote");
equal(identifiers.getPackageSourceSuffix("plugin@scope@source"), "source");
equal(identifiers.getPackageSourceSuffix("@source"), null);
equal(identifiers.getPackageSourceSuffix("plugin@"), null);
equal(identifiers.getPackageSourceSuffix("plugin"), null);

const collection = modules.collection;
equal(collection.firstOrNull(["first", "second"]), "first");
equal(collection.firstOrNull([]), null);
equal(collection.firstOrNull(null), null);
equal(collection.firstOrNull(undefined), null);

console.log(`app-shared navigation/identifier cluster: ${assertions} assertions passed`);
