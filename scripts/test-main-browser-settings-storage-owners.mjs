import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/browser-use/origin-state.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const classNode = (name) => ast.body.find((node) => node.type === "ClassDeclaration" && node.id?.name === name);
const remoteNode = classNode("RemoteBrowserSettings");
const fileNode = classNode("BrowserConfigFile");
assert.ok(remoteNode && fileNode); assertions += 1;
equal(remoteNode.body.body.length, 5);
equal(fileNode.body.body.length, 5);

const requests = [];
const RemoteBrowserSettings = Function(
  "remoteBrowserSettingsSchema", "BROWSER_SETTINGS_ENDPOINT", "BROWSER_SETTINGS_TIMEOUT_MS",
  `${transpiled.code.slice(remoteNode.start, remoteNode.end)}; return RemoteBrowserSettings;`,
)({ parse: (value) => value }, "/wham/browser/settings", 15_000);
const api = new RemoteBrowserSettings(async (...args) => { requests.push(args); return { revision: requests.length }; }, { accountId: "a" });
const signal = new AbortController().signal;
equal(await api.read(signal), { revision: 1 });
equal(requests[0][0], "/wham/browser/settings");
equal(requests[0][1].expectedPrincipal, { accountId: "a" });
equal(await api.update(7, { preferences: { webmcp_enabled: true } }, signal), { revision: 2 });
equal(requests[1][1].method, "PATCH");
equal(requests[1][1].body, { preferences: { webmcp_enabled: true }, expected_revision: 7 });

const missing = Object.assign(new Error("missing"), { code: "ENOENT" });
const BrowserConfigFile = Function(
  "join", "BROWSER_CONFIG_FILENAME", "remoteToLocalDocument", "RULE_SECTION_KEYS", "isTomlTable",
  "remoteBrowserSettingsSchema", "stringifyToml", "mkdir", "dirname", "randomUUID", "writeFile", "rename", "rm", "readFile", "parseToml",
  `${transpiled.code.slice(fileNode.start, fileNode.end)}; return BrowserConfigFile;`,
)(
  (...parts) => parts.join("/"), "browser/config.toml", (value) => value, [], () => false,
  { shape: { preferences: { parse: (value) => value } } }, JSON.stringify, async () => {}, () => "", () => "id",
  async () => {}, async () => {}, async () => {}, async () => { throw missing; }, () => ({}),
);
const configFile = new BrowserConfigFile("/codex");
equal(configFile.path, "/codex/browser/config.toml");
equal(await configFile.read(), null);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes("RemoteBrowserSettings: uke"), true);
equal(main.includes("BrowserConfigFile: pke"), true);
equal(main.includes("uke = class"), false);
equal(main.includes("pke = class"), false);
const windowContext = fs.readFileSync(new URL("../src/main/main-app/window/window-context.ts", import.meta.url), "utf8");
equal(windowContext.includes("configFile: new pke(n.Oi())"), true);
equal(windowContext.includes("new uke(this.fetchWrapper.fetchAuthenticatedJson.bind(this.fetchWrapper), e)"), true);
console.log(`${assertions} main browser settings storage owner assertions passed`);
