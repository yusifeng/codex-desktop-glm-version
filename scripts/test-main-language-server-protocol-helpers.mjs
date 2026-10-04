import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const helpers = require("../app/.vite/build/main-app/language-server/protocol-helpers.js");
const posix = { sep: "/", normalize: (value) => value.replace(/\/+/g, "/") };
const win32 = { sep: "\\", normalize: (value) => value.replaceAll("/", "\\") };
const uri = {
  from({ authority = "", path, scheme }) {
    return { toString: () => `${scheme}://${authority}${encodeURI(path).replaceAll("#", "%23").replaceAll("?", "%3F")}` };
  },
  parse(value) {
    const match = /^file:\/\/([^/]*)(\/.*)$/.exec(value);
    return match ? { authority: match[1], path: decodeURI(match[2]) } : { authority: "", path: decodeURI(value.slice("file://".length)) };
  },
};
assert.deepEqual(helpers.resolveCapabilities({ hoverProvider: true, definitionProvider: true, referencesProvider: true }), { hover: true, locationKinds: ["definition", "references"] });
assert.equal(helpers.filePathToUri("/tmp/a b.ts", posix, uri), "file:///tmp/a%20b.ts");
assert.equal(helpers.filePathToUri("C:\\work\\main.ts", win32, uri), "file:///C:/work/main.ts");
assert.equal(helpers.filePathToUri("//server/share/main.ts", win32, uri), "file://server/share/main.ts");
assert.equal(helpers.uriToFilePath("file:///C:/work/main.ts", win32, uri), "C:\\work\\main.ts");
assert.deepEqual(helpers.resolveLocations({ targetUri: "file:///tmp/main.ts", targetSelectionRange: { start: 1 } }, posix, uri), [{ path: "/tmp/main.ts", range: { start: 1 } }]);
assert.deepEqual(helpers.normalizeHover([{ language: "ts", value: "const x = 1" }, "---\nExplanation"], { line: 2 }, () => false), { signature: "const x = 1", documentation: "Explanation", range: { start: { line: 2 }, end: { line: 2 } } });
assert.deepEqual(helpers.normalizeHover({ kind: "markdown", value: "```ts\nfoo()\n```\n---\nDocs" }, { line: 4 }, (value) => value?.kind === "markdown"), { signature: "foo()", documentation: "Docs", range: { start: { line: 4 }, end: { line: 4 } } });
console.log("test-main-language-server-protocol-helpers: 8 assertions passed");
