import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

const source = fs.readFileSync(
  new URL("../src/main/main-app/threads/thread-store.ts", import.meta.url),
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
  (node) => node.type === "ClassDeclaration" && node.id?.name === "ThreadStore",
);
assert.ok(classNode, "ThreadStore should survive TypeScript transformation");

let assertions = 1;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

equal(classNode.body.body.length, 132);
const memberNames = classNode.body.body
  .map((member) => member.key?.name ?? member.key?.value)
  .filter(Boolean);
equal(memberNames.includes("registerThreadMetadata"), true);
equal(memberNames.includes("hydrateThreads"), true);
equal(memberNames.includes("setConversation"), true);
equal(memberNames.includes("refreshRecentConversations"), true);

const registrationMethod = classNode.body.body.find(
  (member) => member.key?.name === "registerThreadMetadata",
);
const registrationSource = transpiled.code.slice(
  registrationMethod.start,
  registrationMethod.end,
);
const availabilityIndex = registrationSource.indexOf("this.recordThreadAvailability");
const metadataIndex = registrationSource.indexOf("registerThreadMetadata({");
equal(availabilityIndex >= 0, true);
equal(metadataIndex > availabilityIndex, true);
equal((source.match(/this\.registerThreadMetadata\(/g) ?? []).length, 2);
equal((source.match(/^\s*registerThreadMetadata\(\{/gm) ?? []).length, 1);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes('require("./main-app/threads/thread-store.js")'), true);
equal(main.includes("T_e = ThreadStore"), true);
equal(main.includes("T_e = class"), false);
equal(main.includes("this.threadStore = new T_e({"), true);

console.log(`${assertions} main thread store owner assertions passed`);
