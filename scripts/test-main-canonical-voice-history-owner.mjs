import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const source = fs.readFileSync(
  new URL("../src/main/main-app/threads/automation-detector.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const module = { exports: {} };
Function("require", "module", "exports", transpiled.code)(
  (specifier) => {
    if (specifier === "@chunk/shared")
      return {
        Wu: (version, feature) => feature === "threadTimeline" && version === "supported",
        fd: (input) => input === "automation" ? {} : null,
      };
    throw new Error(`unexpected require ${specifier}`);
  },
  module,
  module.exports,
);
const { hasCanonicalVoiceHistory } = module.exports;
equal(hasCanonicalVoiceHistory({ forkedFromId: null, historyMode: "paginated", cliVersion: "supported" }), true);
equal(hasCanonicalVoiceHistory({ forkedFromId: "parent", historyMode: "paginated", cliVersion: "supported" }), false);
equal(hasCanonicalVoiceHistory({ forkedFromId: null, historyMode: "legacy", cliVersion: "supported" }), false);
equal(hasCanonicalVoiceHistory({ forkedFromId: null, historyMode: "paginated", cliVersion: "0.0.0" }), false);
equal(hasCanonicalVoiceHistory({ forkedFromId: null, historyMode: "paginated", cliVersion: "old" }), false);
equal(module.exports.parseHeartbeatDecision(
  "Visible\n<heartbeat><decision>NOTIFY</decision><message><![CDATA[ ping ]]></message></heartbeat>",
), { decision: "NOTIFY", visibleText: "Visible", notificationMessage: "ping" });
equal(module.exports.parseAutomationUserMessage("<![CDATA[ DONT_NOTIFY ]]>"), {
  decision: "DONT_NOTIFY",
  visibleText: "",
  notificationMessage: null,
});
equal(module.exports.AUTOMATION_DETECTOR.isAutomationUserInput("automation"), true);
equal(module.exports.AUTOMATION_DETECTOR.isAutomationAssistantMessage(
  "Visible <heartbeat><decision>DONT_NOTIFY</decision></heartbeat>",
), true);

const creation = fs.readFileSync(
  new URL("../src/main/main-app/conversation/conversation-creation.ts", import.meta.url),
  "utf8",
);
equal(creation.includes('import { hasCanonicalVoiceHistory as isCanonicalVoiceHistory } from "../threads/automation-detector"'), true);
equal(creation.includes("(projectionModule as any).isCanonicalVoiceHistory"), false);
equal(creation.includes("canonicalVoiceHistory: isCanonicalVoiceHistory(response.thread)"), true);

const hydration = fs.readFileSync(
  new URL("../src/main/main-app/threads/hydration.ts", import.meta.url),
  "utf8",
);
equal(hydration.includes('import { hasCanonicalVoiceHistory as hasCanonicalVoice } from "./automation-detector"'), true);
equal(hydration.includes("export function hasCanonicalVoice("), false);
equal(hydration.includes("export { hasCanonicalVoice };"), true);

const projection = fs.readFileSync(
  new URL("../src/main/main-app/threads/projection.ts", import.meta.url),
  "utf8",
);
equal(projection.includes('export { hasCanonicalVoiceHistory } from "./automation-detector"'), true);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes('parseHeartbeatDecision: J_, parseAutomationUserMessage: n_e, AUTOMATION_DETECTOR: Y_'), true);
equal(main.includes("function q_("), false);
for (const name of ["J_", "n_e", "r_e", "i_e", "a_e"])
  equal(main.includes(`function ${name}(`), false);
equal(main.includes("var Y_ ="), false);
for (const name of ["e_e", "G_", "t_e", "K_"])
  equal(main.includes(`function ${name}(`), false);

console.log(`${assertions} main canonical voice history owner assertions passed`);
