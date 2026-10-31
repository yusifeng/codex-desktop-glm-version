import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

const source = fs.readFileSync(
  new URL("../src/main/main-app/api/desktop-fetch.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, {
  loader: "ts",
  format: "esm",
  target: "es2022",
});
const ast = acorn.parse(transpiled.code, {
  ecmaVersion: "latest",
  sourceType: "module",
});
const classNode = ast.body.find(
  (node) => node.type === "ClassDeclaration" && node.id?.name === "DesktopFetchService",
);
assert.ok(classNode, "DesktopFetchService class should survive TypeScript transformation");
const classSource = transpiled.code.slice(classNode.start, classNode.end);
const DesktopFetchService = Function(
  "VSCODE_REQUEST_PREFIX",
  `${classSource}; return DesktopFetchService;`,
)("vscode://codex/");

let assertions = 1;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const service = new DesktopFetchService({}, {});
equal(service.getAbortControllerKey({ id: 17 }, "request-a"), "17:request-a");
equal(service.isVsCodeFetchRequest("vscode://codex/thread/read"), true);
equal(service.isVsCodeFetchRequest("https://chatgpt.com/"), false);
equal(service.prepareFetchInit({ body: '{"ok":true}', headers: {} }), {
  headers: { "Content-Type": "application/json" },
  body: '{"ok":true}',
});
equal(service.prepareFetchInit({ body: "not-json", headers: {} }), {
  headers: {},
  body: "not-json",
});
const headers = { "content-type": "text/plain", Accept: "text/plain" };
equal(service.hasHeader(headers, "Content-Type"), true);
service.setHeader(headers, "CONTENT-TYPE", "application/json");
equal(headers, { Accept: "text/plain", "CONTENT-TYPE": "application/json" });
service.deleteHeader(headers, "accept");
equal(headers, { "CONTENT-TYPE": "application/json" });
const clone = service.cloneHeaders(headers);
equal(clone, headers);
equal(clone === headers, false);

const methodNames = classNode.body.body
  .map((member) => member.key?.name ?? member.key?.value)
  .filter(Boolean);
equal(methodNames.length, 32);
equal(methodNames.includes("performDesktopFetch"), true);
equal(methodNames.includes("handleDictationStreamConnectInfoRequest"), true);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes('require("./main-app/api/desktop-fetch.js")'), true);
equal(main.includes("ZTe = DesktopFetchService"), true);
equal(main.includes("ZTe = class"), false);
equal(main.includes("new ZTe(this.fetchHandler"), false);

const windowContext = fs.readFileSync(
  new URL("../src/main/main-app/window/window-context.ts", import.meta.url),
  "utf8",
);
equal(windowContext.includes("this.fetchWrapper = new ZTe(this.fetchHandler"), true);

console.log(`${assertions} main desktop fetch service owner assertions passed`);
