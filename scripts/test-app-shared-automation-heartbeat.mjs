import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outfile = path.join(
  ROOT,
  "node_modules/.cache/automation-heartbeat-test.mjs",
);
await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/app-shared/runtime/automation-heartbeat.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  outfile,
  logLevel: "silent",
});
const heartbeat = await import(
  `${new URL(`file://${outfile}`).href}?v=${Date.now()}`
);

let assertions = 0;
function equal(actual, expected, message) {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
}

const source = `
  <heartbeat>
    <automation_id>automation-123</automation_id>
    <current_time_iso>2026-09-27T10:00:00+08:00</current_time_iso>
    <instructions>
      Check the build and report only failures.
    </instructions>
  </heartbeat>
`;
equal(
  heartbeat.parseHeartbeatPrompt(source),
  {
    automationId: "automation-123",
    currentTimeIso: "2026-09-27T10:00:00+08:00",
    instructions: "Check the build and report only failures.",
  },
  "parses a heartbeat envelope",
);
equal(
  heartbeat.parseHeartbeatPrompt(`
    <heartbeat>
      <current_time_iso>now</current_time_iso>
      <instructions>run</instructions>
    </heartbeat>
  `),
  { automationId: null, currentTimeIso: "now", instructions: "run" },
  "allows a missing automation id",
);
equal(
  heartbeat.parseHeartbeatPrompt(
    "<heartbeat><CURRENT_TIME_ISO>now</CURRENT_TIME_ISO><INSTRUCTIONS>run</INSTRUCTIONS></heartbeat>",
  ),
  { automationId: null, currentTimeIso: "now", instructions: "run" },
  "matches inner tags without case sensitivity",
);
equal(
  heartbeat.parseHeartbeatPrompt(
    "<HEARTBEAT><current_time_iso>now</current_time_iso><instructions>run</instructions></HEARTBEAT>",
  ),
  null,
  "keeps the outer envelope case sensitive",
);
equal(heartbeat.parseHeartbeatPrompt("plain text"), null, "rejects plain text");
equal(
  heartbeat.parseHeartbeatPrompt(
    "prefix <heartbeat><current_time_iso>now</current_time_iso><instructions>run</instructions></heartbeat>",
  ),
  null,
  "rejects content before the envelope",
);
equal(
  heartbeat.parseHeartbeatPrompt(
    "<heartbeat><instructions>run</instructions></heartbeat>",
  ),
  null,
  "requires a current time",
);
equal(
  heartbeat.parseHeartbeatPrompt(
    "<heartbeat><current_time_iso>now</current_time_iso></heartbeat>",
  ),
  null,
  "requires instructions",
);

equal(
  heartbeat.parseHeartbeatInput([
    { type: "image", url: "ignored" },
    { type: "text", text: "<heartbeat>" },
    { type: "text", text: "<current_time_iso>now</current_time_iso>" },
    { type: "text", text: "<instructions>run</instructions>" },
    { type: "text", text: "</heartbeat>" },
  ]),
  { automationId: null, currentTimeIso: "now", instructions: "run" },
  "joins text input items",
);
equal(heartbeat.parseHeartbeatInput(null), null, "handles missing input");
equal(
  heartbeat.parseHeartbeatInput([{ type: "image", text: source }]),
  null,
  "ignores non-text input items",
);

const legacyOutput = "Automation: Daily check\nAutomation ID: automation-123";
equal(
  heartbeat.extractAutomationUpdateOutput({
    namespace: "codex_app",
    name: "automation_update",
    output: legacyOutput,
  }),
  legacyOutput,
  "accepts legacy automation output",
);
equal(
  heartbeat.extractAutomationUpdateOutput({
    namespace: "codex_app",
    name: "automation_update",
    output: source,
  }),
  source,
  "accepts heartbeat automation output",
);
equal(
  heartbeat.extractAutomationUpdateOutput({
    namespace: "other",
    name: "automation_update",
    output: legacyOutput,
  }),
  null,
  "requires the Codex app namespace",
);
equal(
  heartbeat.extractAutomationUpdateOutput({
    namespace: "codex_app",
    name: "other_tool",
    output: legacyOutput,
  }),
  null,
  "requires the automation update tool",
);
equal(
  heartbeat.extractAutomationUpdateOutput({
    namespace: "codex_app",
    name: "automation_update",
    output: { value: legacyOutput },
  }),
  null,
  "requires string output",
);
equal(
  heartbeat.extractAutomationUpdateOutput({
    namespace: "codex_app",
    name: "automation_update",
    output: "Automation: incomplete",
  }),
  null,
  "rejects incomplete legacy output",
);
equal(
  heartbeat.initializeHeartbeatInputParser(),
  undefined,
  "keeps heartbeat initialization idempotent",
);
equal(
  heartbeat.initializeAutomationUpdateOutputParser(),
  undefined,
  "keeps tool output initialization idempotent",
);

console.log(
  `app-shared automation heartbeat behavior: ${assertions}/${assertions} assertions passed`,
);
