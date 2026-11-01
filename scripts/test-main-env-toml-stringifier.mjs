import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const throws = (callback, expected) => {
  assert.throws(callback, expected);
  assertions += 1;
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/misc/env-toml-stringifier.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const loaded = { exports: {} };
Function("module", "exports", transpiled.code)(loaded, loaded.exports);
const { stringifyToml } = loaded.exports;

equal(
  stringifyToml({ integer: 1, float: 1.5, truthy: true, text: "a\x7fb", big: 3n }),
  'integer = 1\nfloat = 1.5\ntruthy = true\ntext = "a\\u007fb"\nbig = 3\n',
);
equal(stringifyToml({ nan: NaN, positive: Infinity, negative: -Infinity }), "nan = nan\npositive = inf\nnegative = -inf\n");
equal(stringifyToml({ integer: 1 }, { numbersAsFloat: true }), "integer = 1.0\n");
equal(stringifyToml({ createdAt: new Date("2024-01-02T03:04:05.000Z") }), "createdAt = 2024-01-02T03:04:05.000Z\n");
equal(
  stringifyToml({ title: "root", server: { host: "localhost", tls: { enabled: true } } }),
  'title = "root"\n\n[server]\nhost = "localhost"\n\n[server.tls]\nenabled = true\n',
);
equal(stringifyToml({ values: [1, "two", false] }), 'values = [ 1, "two", false ]\n');
equal(
  stringifyToml({ products: [{ name: "one", size: 1 }, { name: "two", size: 2 }] }),
  '[[products]]\nname = "one"\nsize = 1\n\n[[products]]\nname = "two"\nsize = 2\n',
);
equal(stringifyToml({ "quoted.key": "value", ignored: null, missing: undefined }), '"quoted.key" = "value"\n');
equal(stringifyToml({ values: [{ unsupported: Symbol("x") }, 1] }), "values = [ { unsupported = undefined }, 1 ]\n");
equal(stringifyToml({}), "\n");

throws(() => stringifyToml("not-an-object"), /stringify can only be called with an object/);
throws(() => stringifyToml({ unsupported: Symbol("x") }), /cannot serialize values of type 'symbol'/);
throws(() => stringifyToml({ unsupported() {} }), /cannot serialize values of type 'function'/);
throws(() => stringifyToml({ invalid: new Date(NaN) }), /cannot serialize invalid date/);
// 原 classifier 会把单个 null 当成 array-of-tables，再在 Object.keys(null) 处失败。
throws(() => stringifyToml({ values: [null] }), /Cannot convert undefined or null to object/);
throws(() => stringifyToml({ values: [null, 1] }), /arrays cannot contain null or undefined values/);
throws(() => stringifyToml({ nested: { value: 1 } }, { maxDepth: 1 }), /maximum object depth exceeded/);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes("function Wt("), false);
equal(main.includes("function Yt("), false);

for (const consumer of [
  "../src/main/main-app/import/cowork-history.ts",
  "../src/main/main-app/import/cowork-mcp-plugins.ts",
  "../src/main/main-app/computer-use/notify-config.ts",
  "../src/main/main-app/computer-use/approvals.ts",
  "../src/main/main-app/browser-use/origin-state.ts",
]) {
  equal(fs.readFileSync(new URL(consumer, import.meta.url), "utf8").includes("stringifyToml"), true);
}

console.log(`${assertions} env TOML stringifier assertions passed`);
