import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

const source = fs.readFileSync(
  new URL("../src/main/main-app/conversation/conversation-creation.ts", import.meta.url),
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
  (node) => node.type === "ClassDeclaration" && node.id?.name === "ConversationCreationExecutor",
);
assert.ok(classNode, "conversation creation executor should survive TypeScript transformation");
const classSource = transpiled.code.slice(classNode.start, classNode.end);
const ConversationCreationExecutor = Function(
  `${classSource}; return ConversationCreationExecutor;`,
)();

let assertions = 1;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const daybreakUpdates = [];
const executor = new ConversationCreationExecutor({
  threadStore: {
    applyThreadDaybreakUpdate: (threadId, enabled) => daybreakUpdates.push([threadId, enabled]),
  },
  usePaginatedThreadHistory: () => true,
});
await executor.saveInitialDaybreak("thread-1", true, false, async () => undefined);
equal(daybreakUpdates, [["thread-1", true]]);

await assert.rejects(
  executor.saveInitialDaybreak("thread-2", true, false, async () => {
    throw new Error("write failed");
  }),
  /write failed/,
);
assertions += 1;
equal(daybreakUpdates.slice(-2), [["thread-2", true], ["thread-2", false]]);

await executor.saveInitialDaybreak("thread-3", undefined, false, async () => {
  throw new Error("must not run");
});
equal(daybreakUpdates.some(([id]) => id === "thread-3"), false);
equal(executor.getRequestedThreadHistoryMode("default"), "paginated");
equal(executor.getRequestedThreadHistoryMode("full"), "legacy");

equal(classNode.body.body.length, 6);
const memberNames = classNode.body.body.map((member) => member.key?.name).filter(Boolean);
equal(memberNames.includes("prewarmConversation"), true);
equal(memberNames.includes("createConversation"), true);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
for (const generatedName of ["FSe", "ISe", "LSe", "CC", "RSe"])
  equal(new RegExp(`\\b${generatedName}\\b`).test(main), false);
for (const generatedName of ["ASe", "jSe", "MSe", "NSe", "PSe"])
  equal(new RegExp(`\\b${generatedName}\\b`).test(main), false);

const manager = fs.readFileSync(
  new URL("../src/main/main-app/conversation/app-server-manager.ts", import.meta.url),
  "utf8",
);
equal(manager.includes("ConversationCreationExecutor, ConversationParamsBuilder"), true);
equal(manager.includes("this.threadCreation = new ConversationCreationExecutor({"), true);

console.log(`${assertions} main conversation creation owner assertions passed`);
