import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const root = path.resolve(import.meta.dirname, "..");
const assetRoot = "/Users/david/Workspace/ppio_github/chatgpt-desktop-src/app/webview/assets";
const catalog = [
  ["angular-html-af8a1b408ff5.js", "syntax-angular-html", "preserve", "language", ["default"]],
  ["architecture-TIHT7OUA-ad8e527a0b6e.js", "mermaid-architecture-services-current", "preserve", "parser-service", ["createArchitectureServices"]],
  ["architecture-TIHT7OUA-cfc5657bcd33.js", "mermaid-architecture-services-legacy", "preserve", "parser-service", ["createArchitectureServices"]],
  ["c-ac5eb10559fb.js", "syntax-c", "preserve", "language", ["default"]],
  ["channel-6a55bfb120f8.js", "color-channel-parser-modern", "rewrite", "semantic-runtime", ["t"]],
  ["channel-b05b0fc90e5c.js", "color-channel-parser-legacy", "rewrite", "semantic-runtime", ["n", "t"]],
  ["chatgpt-gizmo-header-b2d164e126a5.js", "chatgpt-gizmo-header-bridge", "preserve", "application-bridge", ["ChatGptGizmoHeader"]],
  ["chatgpt-project-query-b2bce6d9b6ee.js", "chatgpt-project-query-bridge", "preserve", "application-bridge", ["fetchChatGptProject"]],
  ["chatgpt-request-670b0ddb78e4.js", "chatgpt-request-bridge", "preserve", "application-bridge", ["Request", "chatGptCloudBrowserFormFillResponseSchema", "getChatGPTBrowserProxiedBackendUrl", "getChatGPTRequestHeaders", "getChatGptRequestProfile", "isChatGPTNativeDesktopSurface"]],
  ["chatgpt-temporary-chat-ui-9a5f159b3461.js", "chatgpt-temporary-chat-ui-bridge", "preserve", "application-bridge", ["ChatGptTemporaryChatOnboardingModalHost", "ChatGptTemporaryChatToggleButton"]],
  ["contracts-96b363340ff1.js", "media-device-contracts", "rewrite", "semantic-contract", ["i", "n", "r", "t"]],
  ["core-e0ac85b4f9b8.js", "mermaid-parser-core-default-bridge", "preserve", "runtime-bridge", ["n", "t"]],
  ["cynefin-VYW2F7L2-669e53f980a8.js", "mermaid-cynefin-services-legacy", "preserve", "parser-service", ["createCynefinServices"]],
  ["cynefin-VYW2F7L2-7ae4cdc77c53.js", "mermaid-cynefin-services-current", "preserve", "parser-service", ["createCynefinServices"]],
  ["fortran-free-form-cdbb0f6ffbe0.js", "syntax-fortran-free-form", "preserve", "language", ["default"]],
  ["html-derivative-60c0018e2a7c.js", "syntax-html-derivative", "preserve", "language", ["default"]],
  ["html-e0b96e3e1725.js", "syntax-html", "preserve", "language", ["default"]],
  ["info-DKCQHKI2-8310f358bb35.js", "mermaid-info-services", "preserve", "parser-service", ["createInfoServices"]],
  ["java-e7082f9b5716.js", "syntax-java", "preserve", "language", ["default"]],
  ["javascript-4ffd1caf0873.js", "syntax-javascript", "preserve", "language", ["default"]],
  ["jsx-1d597b40cbbc.js", "syntax-jsx", "preserve", "language", ["default"]],
  ["less-6e450891a185.js", "syntax-less", "preserve", "language", ["default"]],
  ["lua-ac29337895f8.js", "syntax-lua", "preserve", "language", ["default"]],
  ["packet-7NZHBO7P-a556b9452792.js", "mermaid-packet-services", "preserve", "parser-service", ["createPacketServices"]],
  ["php-cf1b91dd2d19.js", "syntax-php", "preserve", "language", ["default"]],
  ["postcss-866e5266f689.js", "syntax-postcss", "preserve", "language", ["default"]],
  ["python-805c25541893.js", "syntax-python", "preserve", "language", ["default"]],
  ["r-880e4ee3048b.js", "syntax-r", "preserve", "language", ["default"]],
  ["radar-I7S5WNFK-ea6bd36b3fbc.js", "mermaid-radar-services", "preserve", "parser-service", ["createRadarServices"]],
  ["railroad-3IZDKUUU-1907123bcc7a.js", "mermaid-railroad-services", "preserve", "parser-service", ["createRailroadServices"]],
  ["railroad-abnf-AHOZXSZD-d91ab9f0b260.js", "mermaid-railroad-abnf-services", "preserve", "parser-service", ["createRailroadAbnfServices"]],
  ["railroad-ebnf-EBAXGLYW-24586b366634.js", "mermaid-railroad-ebnf-services", "preserve", "parser-service", ["createRailroadEbnfServices"]],
  ["railroad-peg-LSFZ7HO6-2720ed1045e5.js", "mermaid-railroad-peg-services", "preserve", "parser-service", ["createRailroadPegServices"]],
  ["read-saved-plan-content-485c714fd0a9.js", "read-saved-plan-content-bridge", "preserve", "application-bridge", ["readSavedPlanContent"]],
  ["regexp-ad3b2e1330ac.js", "syntax-regexp", "preserve", "language", ["default"]],
  ["respond-36c75f33bf0b.js", "chatgpt-tool-request-response-bridge", "preserve", "application-bridge", ["respondToChatGptToolRequest"]],
  ["resume-chatgpt-completion-b6f2a2305780.js", "chatgpt-completion-resume-bridge", "preserve", "application-bridge", ["chatGptCompletionResumeQueryById$", "resumeChatGptCompletionFromTopic"]],
  ["ruby-6366a38aef51.js", "syntax-ruby", "preserve", "language", ["default"]],
  ["scss-53bcf4f12d13.js", "syntax-scss", "preserve", "language", ["default"]],
  ["sdbl-193315ecf9e2.js", "syntax-sdbl", "preserve", "language", ["default"]],
  ["shellscript-8ccca808d9e0.js", "syntax-shellscript", "preserve", "language", ["default"]],
  ["sql-1bbe31b620be.js", "syntax-sql", "preserve", "language", ["default"]],
  ["stylus-c53b33630761.js", "syntax-stylus", "preserve", "language", ["default"]],
  ["tex-f9292bf27eba.js", "syntax-tex", "preserve", "language", ["default"]],
  ["treeView-QDETBFTQ-5a62f64dd50d.js", "mermaid-tree-view-services", "preserve", "parser-service", ["createTreeViewServices"]],
  ["treemap-6X3UGDF4-bd0c63007aa8.js", "mermaid-treemap-services", "preserve", "parser-service", ["createTreemapServices"]],
  ["tsx-c2aadc6c4d39.js", "syntax-tsx", "preserve", "language", ["default"]],
  ["turtle-37245fe51e76.js", "syntax-turtle", "preserve", "language", ["default"]],
  ["vue-eb78715a4a6b.js", "syntax-vue", "preserve", "language", ["default"]],
  ["walnut-presentation-decoder.worker-85cd19519fff.js", "walnut-presentation-decoder-worker-model", "preserve", "worker-model", ["Presentation"]],
  ["walnut-workbook-decoder.worker-958a75a246b2.js", "walnut-workbook-decoder-worker-model", "preserve", "worker-model", ["Workbook"]],
  ["wardley-OPB4EBWU-255259239636.js", "mermaid-wardley-services-legacy", "preserve", "parser-service", ["createWardleyServices"]],
  ["wardley-OPB4EBWU-73d89dac25a5.js", "mermaid-wardley-services-current", "preserve", "parser-service", ["createWardleyServices"]],
  ["xml-e376fa40de0a.js", "syntax-xml", "preserve", "language", ["default"]],
  ["yaml-84335cdfd018.js", "syntax-yaml", "preserve", "language", ["default"]],
];
assert.equal(catalog.length, 55);
assert.equal(new Set(catalog.map(([file]) => file)).size, 55);
assert.equal(new Set(catalog.map(([, semantic]) => semantic)).size, 55);
let assertions = 3;
const allAssets = fs.readdirSync(assetRoot).filter((file) => file.endsWith(".js"));
const assetSources = new Map(allAssets.map((file) => [file, fs.readFileSync(path.join(assetRoot, file), "utf8")]));
function staticDependencies(source) {
  return [...source.matchAll(/(?:from\s*|import\s*)["']\.\/([^"']+\.js)["']/gu)].map((match) => match[1]);
}
function exportedNames(source) {
  const blocks = [...source.matchAll(/export\s*\{([\s\S]*?)\};/gu)];
  assert.ok(blocks.length > 0);
  return blocks.at(-1)[1].split(",").map((part) => part.trim()).filter(Boolean).map((part) => { const pieces = part.split(/\s+as\s+/u); return pieces.at(-1).trim(); }).sort();
}
for (const [file, semantic, action, kind, expectedExports] of catalog) {
  const source = assetSources.get(file);
  assert.equal(typeof source, "string", file + " exists");
  const dependencies = staticDependencies(source);
  assert.ok(dependencies.length > 0, file + " has paired runtime/source dependency");
  for (const dependency of dependencies) assert.equal(assetSources.has(dependency), true, file + " dependency exists: " + dependency);
  assert.deepEqual(exportedNames(source), [...expectedExports].sort(), file + " exports");
  assert.equal((source.match(/import\(/gu) ?? []).length, 0, file + " has no hidden dynamic dependency");
  const consumers = allAssets.filter((candidate) => candidate !== file && assetSources.get(candidate).includes("./" + file));
  assert.ok(consumers.length > 0, file + " has a real consumer");
  if (action === "preserve") {
    assert.ok(source.split("\n").length <= 20, file + " remains a small generated hub");
    assert.equal(/(?:safeGet|safePost|fetch\(|window\.|document\.|localStorage|sessionStorage|throw new)/u.test(source), false, file + " contains no standalone business logic");
    if (kind === "language") assert.deepEqual(expectedExports, ["default"]);
    if (kind === "worker-model") assert.match(dependencies[0], /^runtime\.worker-/u);
  } else {
    const recovered = fs.readFileSync(path.join(root, "src/renderer", semantic, "index.ts"), "utf8");
    assert.ok(recovered.includes("Release chunk: " + file));
    assert.equal(/(?:\bas\s+any\b|:\s*any\b|<any>)|@ts-(?:expect-error|nocheck)/u.test(recovered), false);
  }
  assertions += 7 + dependencies.length + (action === "preserve" ? 2 : 2);
}

const aliases = {
  "rolldown-runtime": [],
  "color-channel-runtime-modern": ["at", "ot"],
  "color-channel-runtime-legacy": ["ft", "ht", "mt", "pt"],
};
globalThis.__generatedHubMocks = Object.create(null);
async function load(semantic) {
  const entry = path.join(root, "src/renderer", semantic, "index.ts");
  const output = path.join(os.tmpdir(), "generated-hub-" + semantic + "-" + process.pid + "-" + Date.now() + "-" + Math.random() + ".mjs");
  await esbuild.build({ entryPoints: [entry], outfile: output, bundle: true, format: "esm", platform: "node", plugins: [{ name: "generated-hub-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, (args) => ({ path: args.path.slice(8), namespace: "generated-hub-mock" }));
    build.onLoad({ filter: /.*/, namespace: "generated-hub-mock" }, ({ path: alias }) => ({ loader: "js", contents: (aliases[alias] ?? []).map((name) => "export const " + name + "=globalThis.__generatedHubMocks[" + JSON.stringify(alias) + "][" + JSON.stringify(name) + "]").join(";\n") }));
  } }] });
  return import(pathToFileURL(output).href + "?v=" + Date.now());
}
globalThis.__generatedHubMocks["color-channel-runtime-modern"] = { at: { parse: () => ({ red: 12.6, alpha: 0.49 }) }, ot: { lang: { round: Math.round } } };
const modern = await load("color-channel-parser-modern");
assert.deepEqual(Object.keys(modern), ["t"]);
assert.equal(modern.t("rgb(12.6 0 0)", "red"), 13);
assert.equal(modern.t("rgb(0 0 0 / .49)", "alpha"), 0);
assertions += 3;
let legacyInitializers = 0;
globalThis.__generatedHubMocks["color-channel-runtime-legacy"] = { ft: { parse: () => ({ green: 19.7 }) }, ht: () => { legacyInitializers += 1; }, mt: { lang: { round: Math.round } }, pt: () => { legacyInitializers += 1; } };
const legacy = await load("color-channel-parser-legacy");
assert.deepEqual(Object.keys(legacy).sort(), ["n", "t"]);
assert.equal(legacy.t, undefined);
legacy.n(); legacy.n();
assert.equal(legacyInitializers, 2);
assert.equal(legacy.t("rgb(0 19.7 0)", "green"), 20);
assertions += 4;
const contracts = await load("media-device-contracts");
assert.deepEqual(Object.keys(contracts).sort(), ["i", "n", "r", "t"]);
assert.equal(contracts.n, undefined);
contracts.i();
const transportIdentity = contracts.n;
contracts.i();
assert.equal(contracts.n, transportIdentity);
assert.deepEqual(contracts.n, { Local: "local", Remote: "remote" });
assert.deepEqual(contracts.t, { Audio: "audio", Video: "video" });
assert.deepEqual(contracts.r, { Camera: "camera", Microphone: "microphone", ScreenShare: "screen_share" });
assertions += 7;

const preserveCount = catalog.filter(([, , action]) => action === "preserve").length;
const rewriteCount = catalog.length - preserveCount;
assert.equal(preserveCount, 52);
assert.equal(rewriteCount, 3);
assertions += 2;
const resumeReleaseAssertions = assertReleaseOwner("resume-chatgpt-completion");
console.log("incremental generated-language hubs: " + assertions + " assertions passed; preserve=" + preserveCount + ", rewrite=" + rewriteCount + "; resume release=" + resumeReleaseAssertions + ".");
