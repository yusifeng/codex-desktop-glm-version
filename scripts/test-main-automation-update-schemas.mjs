import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";
import { z } from "zod";

const source = fs.readFileSync(
  new URL("../src/main/main-app/automations/automation-update-tool.ts", import.meta.url),
  "utf8",
);
const output = await transform(source, { loader: "ts", format: "esm", target: "node22" });
const runtime = await import(`data:text/javascript;base64,${Buffer.from(output.code).toString("base64")}`);

let assertions = 0;
function equal(actual, expected, message) {
  assertions += 1;
  assert.deepEqual(actual, expected, message);
}
function parse(value, expected = true) {
  const result = inputSchema.safeParse(value);
  equal(result.success, expected);
  return result;
}

z.ZodType.prototype.meta = function meta() { return this; };
const schemaDsl = {
  Of: z.string,
  Pf: () => z.string().uuid(),
  df: z.enum,
  bf: z.literal,
  Df: z.strictObject,
  vf: (_key, schemas) => z.union(schemas),
};
const { inputSchema, toolName } = runtime.createAutomationUpdateSchemas({
  schema: schemaDsl,
  notificationPolicySchema: z.enum(["failed_runs_only"]),
  reasoningEffortSchema: z.enum(["none", "minimal", "low", "medium", "high", "xhigh", "max", "ultra"]),
});

equal(toolName, "automation_update");
equal(runtime.AUTOMATION_UPDATE_TOOL_NAME, "automation_update");
equal(parse({ mode: "view", id: "automation" }).data, { mode: "view", id: "automation" });
parse({ mode: "view", id: " " }, false);
equal(parse({ mode: "delete", id: "automation" }).data.mode, "delete");

const heartbeat = {
  kind: "heartbeat",
  mode: "create",
  name: "Monitor",
  prompt: "Check status",
  rrule: "FREQ=MINUTELY;INTERVAL=30",
  status: "ACTIVE",
  destination: "thread",
};
equal(parse(heartbeat).data, heartbeat);
parse({ ...heartbeat, destination: undefined }, false);
parse({ ...heartbeat, destination: undefined, targetThreadId: "not-a-uuid" }, false);
const heartbeatWithId = {
  ...heartbeat,
  destination: undefined,
  targetThreadId: "00000000-0000-4000-8000-000000000001",
};
equal(parse(heartbeatWithId).data.targetThreadId, heartbeatWithId.targetThreadId);

const cron = {
  kind: "cron",
  mode: "create",
  name: "Daily report",
  prompt: "Create report",
  rrule: "FREQ=DAILY;BYHOUR=9;BYMINUTE=0",
  status: "ACTIVE",
  projectId: null,
  model: "gpt-test",
  reasoningEffort: "high",
  executionEnvironment: "local",
};
equal(parse(cron).data, cron);
parse({ ...cron, executionEnvironment: "worktree" }, false);
parse({ ...cron, rrule: "DTSTART:20260101T090000\nFREQ=DAILY" }, false);
const suggestedCreate = parse({
  ...cron,
  mode: "suggested_create",
  rrule: "DTSTART:20260101T090000\nFREQ=DAILY",
});
equal(suggestedCreate.data.mode, "suggested-create");
const suggestedUpdate = parse({
  ...cron,
  mode: "suggested_update",
  id: "automation",
  executionEnvironment: "worktree",
  destination: "worktree",
});
equal(suggestedUpdate.data.mode, "suggested-update");
parse({ ...cron, mode: "update", id: "automation", executionEnvironment: "worktree" });
parse({ ...cron, notificationPolicy: "unknown" }, false);
parse({ ...cron, reasoningEffort: "extreme" }, false);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("createAutomationUpdateSchemas({"), true);
equal(main.includes("createAutomationUpdateTool({ inputSchema: lP, toolName: vMe })"), true);
for (const generatedSchema of ["aMe", "XN", "oMe", "ZN", "sMe", "cMe", "lMe", "QN", "$N", "eP", "tP", "nP", "rP", "mMe", "hMe", "_Me"]) {
  equal(new RegExp(`^[ ]{0,2}\\$?${generatedSchema.replace("$", "\\$")} = `, "m").test(main), false);
}

console.log(`${assertions} main automation update schema assertions passed`);
