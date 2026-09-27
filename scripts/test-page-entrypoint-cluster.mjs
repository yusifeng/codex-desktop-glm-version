import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cases = [
  ["chatgpt-work-home-page-entry", "chatgpt-work-home-page-core", "n", { ChatGptWorkHomePage: "t" }],
  ["checkout-page-entry", "checkout-page-core", "r", { CheckoutPage: "t" }],
  ["loading-page", "app-initial", "Ret", { LoadingPage: "Let" }],
  ["credit-purchase-page-entry", "credit-purchase-page-core", "n", { CreditPurchasePage: "t" }],
  ["skills-page-entry", "skills-page-core", "t", { ManagePluginsPage: "r", SkillsPage: "n" }],
  ["authed-route-entry", "app-primary", "mc", { AppLayoutRoute: "fc", AuthedRoute: "pc" }],
  ["browser-login-handoff-page-entry", "browser-login-handoff-page-core", "n", { BrowserLoginHandoffPage: "t" }],
  ["local-conversation-page-entry", "local-conversation-page", "r", { AppServerConversationPage: "t", LocalConversationPage: "n" }],
  ["chatgpt-conversation-page-entry", "chatgpt-conversation-page-core", "c", { ChatGptConversationPage: "i", ChatGptSharedConversationPage: "s" }],
  ["plugin-detail-page-entry", "plugin-detail-page-core", "r", { ManagePluginDetailPage: "t", PluginDetailPage: "n" }],
  ["mcp-extension-view-page-entry", "mcp-extension-view-page-core", "i", { McpExtensionGlobalViewPage: "t", McpExtensionSettingsViewPage: "n", McpExtensionViewNotFoundState: "r" }],
];

let assertions = 0;
for (const [directory, provider, initializer, publicExports] of cases) {
  globalThis.__pageEntrypointClusterTest = { initialized: 0 };
  const providerExports = [
    `export const ${initializer} = () => globalThis.__pageEntrypointClusterTest.initialized++;`,
    ...Object.entries(publicExports).map(
      ([semanticName, compressedName]) =>
        `export const ${compressedName} = ${JSON.stringify(semanticName)};`,
    ),
  ].join("\n");
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [
      {
        name: "mock-renderer-chunks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
            path: importPath.slice("@rchunk/".length),
            namespace: "mock-renderer-chunk",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock-renderer-chunk" },
            ({ path: importPath }) => ({
              contents:
                importPath === provider
                  ? providerExports
                  : "export const sideEffect = true;",
              loader: "js",
            }),
          );
        },
      },
    ],
  });
  const entry = await import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
  );
  assert.equal(globalThis.__pageEntrypointClusterTest.initialized, 1);
  assertions += 1;
  for (const semanticName of Object.keys(publicExports)) {
    assert.equal(entry[semanticName], semanticName);
    assertions += 1;
  }
}

assert.equal(assertions, 29);
console.log(`${assertions} page entrypoint cluster assertions passed`);
