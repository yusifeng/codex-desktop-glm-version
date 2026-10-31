import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => { assert.deepEqual(actual, expected, message); assertions += 1; };
const load = async (path) => {
  const source = fs.readFileSync(new URL(path, import.meta.url), "utf8");
  const output = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
  return import(`data:text/javascript;base64,${Buffer.from(output.code).toString("base64")}`);
};
const picker = await load("../src/main/main-app/artifacts/template-picker-runtime.ts");
const automation = await load("../src/main/main-app/automations/automation-update-tool.ts");

const rawSkills = [
  { name: "openai-templates:artifact-template-late", path: "/late", description: "late", enabled: true },
  { name: "vendor:artifact-template-middle", path: "/middle", description: "", interface: { displayName: "Middle" }, enabled: true },
  { name: "artifact-template-first", path: "/first", description: " first ", enabled: true },
  { name: "artifact-template-disabled", path: "/disabled", description: "disabled", enabled: false },
  { name: "not-a-template", path: "/ignored", description: "ignored", enabled: true },
  { name: "artifact-template-duplicate-path", path: "/FIRST", description: "duplicate", enabled: true },
];
const skills = picker.selectTemplateSkills(rawSkills, "win32");
equal(skills.map((skill) => skill.skillName), ["artifact-template-first", "vendor:artifact-template-middle", "openai-templates:artifact-template-late"]);
equal(skills[1].description, "Middle");
equal(picker.selectTemplateSkills([{ name: "artifact-template-long", path: "/long", description: "😀".repeat(700), enabled: true }], "darwin")[0].description.length, 1_200, "description limit counts code points without splitting surrogate pairs");

const calls = [];
const loadConfig = picker.createArtifactTemplatePickerRuntime({
  existsSync: (path) => { calls.push(["exists", path]); return true; },
  join: (...parts) => parts.join("/"),
  platform: "darwin",
  resolveDevResourcesPath: (path) => `${path}/dev`,
  resolveNodeExecutable: (path) => `${path}/node`,
});
const connection = { listSkills: async (input) => { calls.push(["skills", input]); return { data: [{ skills: rawSkills }] }; } };
const config = await loadConfig({ appServerConnection: connection, cwd: "/project", desktopFeatureAvailability: { artifactTemplatePicker: true }, isPackaged: false, resourcesPath: "/resources", shouldUseWslPaths: false });
equal(config["mcp_servers.openai_artifact_template_picker"].command, "/resources/dev/node");
equal(config["mcp_servers.openai_artifact_template_picker"].args, ["/resources/dev/artifact-template-picker/server.mjs"]);
equal(JSON.parse(config["mcp_servers.openai_artifact_template_picker"].env.CODEX_ARTIFACT_TEMPLATE_SKILLS).length, 4);
equal(calls.find(([kind]) => kind === "skills"), ["skills", { cwds: ["/project"] }]);
equal(await loadConfig({ appServerConnection: connection, cwd: null, desktopFeatureAvailability: { artifactTemplatePicker: false }, isPackaged: true, resourcesPath: "/resources", shouldUseWslPaths: false }), null);
equal(await loadConfig({ appServerConnection: connection, cwd: null, desktopFeatureAvailability: { artifactTemplatePicker: true }, isPackaged: true, resourcesPath: "/resources", shouldUseWslPaths: true }), null);

equal(automation.normalizeAutomationToolInputMode({ mode: "suggested_create", id: "x" }), { mode: "suggested-create", id: "x" });
const issues = [];
automation.validateHeartbeatTarget({}, { addIssue: (issue) => issues.push(issue) });
equal(issues[0].path, ["targetThreadId"]);
automation.validateHeartbeatTarget({ destination: "thread" }, { addIssue: (issue) => issues.push(issue) });
equal(issues.length, 1, "thread destination satisfies heartbeat target validation");

let schemaResult = { success: true, data: null };
const execute = automation.createAutomationUpdateTool({ inputSchema: { safeParse: () => schemaResult }, toolName: "automation_update" });
const callsToOperations = [];
const operations = {
  create: async (input) => { callsToOperations.push(["create", input]); return { item: { id: "created", status: "ACTIVE" } }; },
  update: async (input) => { callsToOperations.push(["update", input]); return { item: { id: input.id, status: input.status } }; },
  delete: async ({ id }) => { callsToOperations.push(["delete", id]); return { item: { id, kind: "cron", name: "Daily", rrule: "FREQ=DAILY" }, status: "deleted", success: true }; },
};
schemaResult = { success: false, error: { issues: [{ path: ["id"], message: "Required" }] } };
equal((await execute(operations, { threadId: "thread", argumentsValue: {} }, () => null)).response.contentItems[0].text, "automation_update received invalid arguments: id: Required.");
schemaResult = { success: true, data: { mode: "create", kind: "heartbeat", name: "Watch", prompt: "Check", status: "ACTIVE", rrule: "FREQ=DAILY" } };
const created = await execute(operations, { threadId: "thread", argumentsValue: {} }, () => null);
equal(callsToOperations.at(-1)[1].targetThreadId, "thread");
equal(created.mutation.mode, "create");
schemaResult = { success: true, data: { mode: "update", kind: "cron", id: "automation", notificationPolicy: null } };
const updated = await execute(operations, { threadId: "thread", argumentsValue: {} }, () => null);
equal(updated.mutation.input, { id: "automation", kind: "cron", name: "", prompt: "", status: "ACTIVE", projectId: null, executionEnvironment: "local", localEnvironmentConfigPath: undefined, model: null, reasoningEffort: null, notificationPolicy: null, rrule: "" });
schemaResult = { success: true, data: { mode: "update", kind: "cron", id: "unsafe", executionEnvironment: "worktree" } };
equal((await execute(operations, { threadId: "thread", argumentsValue: {} }, () => null)).response.success, false);
schemaResult = { success: true, data: { mode: "delete", id: "automation" } };
const deleted = await execute(operations, { threadId: "thread", argumentsValue: {} }, () => null);
equal(deleted.mutation.status, "deleted");
equal(JSON.parse(deleted.response.contentItems[1].text).snapshot.name, "Daily");

const failing = automation.createAutomationUpdateTool({ inputSchema: { safeParse: () => ({ success: true, data: { mode: "update", kind: "heartbeat", id: "missing" } }) }, toolName: "automation_update" });
const missing = await failing({ ...operations, update: async () => { throw Error("Automation does not exist in the app and could not be updated. It may have been deleted manually by the user."); } }, { threadId: "thread", argumentsValue: {} }, () => null);
equal(missing.mutation.failureReason, "missing_automation");

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
const fetchHandler = fs.readFileSync(new URL("../src/main/main-app/fetch-handler/electron-fetch-handler.ts", import.meta.url), "utf8");
equal(main.includes("createArtifactTemplatePickerRuntime({"), true);
equal(main.includes("createAutomationUpdateTool({ inputSchema: lP, toolName: vMe })"), true);
equal(fetchHandler.includes("loadArtifactTemplatePickerConfig({"), true);
for (const oldOwner of ["function JN(", "async function iMe(", "function yMe(", "async function xMe("]) equal(main.includes(oldOwner), false, `${oldOwner} removed`);

console.log(`${assertions} main artifact-template and automation-tool assertions passed`);
