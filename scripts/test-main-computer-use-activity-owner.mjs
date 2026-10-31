import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/computer-use/activity-tracker.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const node = ast.body.find((entry) => entry.type === "FunctionDeclaration" && entry.id?.name === "trackComputerUseActivity");
assert.ok(node); assertions += 1;
const trackComputerUseActivity = Function(
  "itemNotificationSchema", "threadNotificationSchema", "isComputerUseServerName", "toolSurfaceSchema",
  `${transpiled.code.slice(node.start, node.end)}; return trackComputerUseActivity;`,
)(
  { safeParse: (value) => ({ success: value.params?.item != null, data: value }) },
  { safeParse: (value) => ({ success: typeof value.params?.threadId === "string", data: value }) },
  (server) => server === "computer-use-mcp",
  { safeParse: (meta) => ({ success: meta?.["codex/toolSurface"]?.kind === "computerUse" }) },
);

let handler;
let unsubscribed = 0;
const activity = [];
const deleted = [];
const dispose = trackComputerUseActivity({
  appServerConnection: {
    registerInternalNotificationHandler: (value) => { handler = value; return () => { unsubscribed += 1; }; },
  },
  onActivityChanged: (...args) => activity.push(args),
  onTaskDeleted: (threadId) => deleted.push(threadId),
});
equal(typeof handler, "function");
handler({ method: "item/started", params: { threadId: "t1", item: { type: "mcpToolCall", server: "computer-use" } } });
handler({ method: "item/completed", params: { threadId: "t1", item: { type: "mcpToolCall", server: "computer-use" } } });
equal(activity, [["t1", true]]);
handler({ method: "turn/completed", params: { threadId: "t1" } });
equal(activity.at(-1), ["t1", false]);
handler({ method: "item/started", params: { threadId: "t2", item: {
  type: "mcpToolCall", server: "computer-use-mcp", result: { _meta: { "codex/toolSurface": { kind: "computerUse" } } },
} } });
equal(activity.at(-1), ["t2", true]);
handler({ method: "thread/deleted", params: { threadId: "t2" } });
equal(activity.at(-1), ["t2", false]);
equal(deleted, ["t2"]);
handler({ method: "item/started", params: { threadId: "t3", item: { type: "mcpToolCall", server: "computer-use" } } });
dispose();
equal(unsubscribed, 1);
equal(activity.at(-1), ["t3", false]);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('const { trackComputerUseActivity: ele } = require("./main-app/computer-use/activity-tracker.js");'), true);
equal(main.includes("function ele("), false);
equal(main.includes("var Qce ="), false);
equal(main.includes("ele({"), true);
console.log(`${assertions} main computer-use activity owner assertions passed`);
