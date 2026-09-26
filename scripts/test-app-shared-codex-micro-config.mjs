import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outfile = path.join(ROOT, "node_modules/.cache/codex-micro-config-test.mjs");
await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/app-shared/runtime/codex-micro-config.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  outfile,
  logLevel: "silent",
});
const config = await import(`${new URL(`file://${outfile}`).href}?v=${Date.now()}`);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

const timeoutCases = {
  off: null,
  "30-seconds": 30_000,
  "1-minute": 60_000,
  "3-minutes": 180_000,
  "10-minutes": 600_000,
  "30-minutes": 1_800_000,
  "1-hour": 3_600_000,
};
for (const [name, milliseconds] of Object.entries(timeoutCases)) {
  check(config.codexMicroIdleTimeoutSchema.parse(name) === name, `parses ${name} timeout`);
  check(config.getCodexMicroIdleTimeoutMs(name) === milliseconds, `maps ${name} timeout`);
}
check(!config.codexMicroIdleTimeoutSchema.safeParse("2-hours").success, "rejects unknown timeouts");

check(config.codexMicroTaskSortSchema.parse("priority") === "priority", "parses task sorting");
check(!config.codexMicroTaskSortSchema.safeParse("alphabetical").success, "rejects unknown sorting");
check(config.codexMicroEncoderModeSchema.parse("reasoning") === "reasoning", "parses encoder modes");
check(config.codexMicroVoiceButtonModeSchema.parse("realtime") === "realtime", "parses voice modes");
check(config.codexMicroAgentKeyIds.join(",") === "AG00,AG01,AG02,AG03,AG04,AG05", "preserves agent key ids");
check(config.composerSubmitModeValues.join(",") === "enter,cmdIfMultiline,cmdAlways", "preserves submit modes");

const parsedDefault = config.codexMicroConfigSchema.parse(config.DEFAULT_CODEX_MICRO_CONFIG);
check(parsedDefault.slots.ACT06.keycapId === "FAST", "parses the default keycap layout");
check(parsedDefault.analogStick.left.commandId === "navigateBack", "parses default analog actions");
check(parsedDefault.encoder.longPress === null, "parses default encoder actions");
check(parsedDefault.voiceButtonMode === "push-to-talk", "parses the default voice mode");

const withDefaults = config.codexMicroConfigSchema.parse({
  version: 1,
  slots: {
    ACT06: { keycapId: "FAST" },
    ACT07: { keycapId: "APPR" },
    ACT08: { keycapId: "REJ" },
    ACT09: { keycapId: "SPLIT" },
    ACT10_ACT11: { keycapId: "MIC" },
    ACT12: { keycapId: "CODEX" },
  },
});
check(withDefaults.slots.ACT10.keycapId === "MIC1", "defaults the first microphone key");
check(withDefaults.slots.ACT11.keycapId === "EMPT1", "defaults the second microphone key");
check(withDefaults.encoderMode === "composer-navigation", "defaults the encoder mode");
check(withDefaults.separateMicrophoneKeys === false, "defaults separate microphone keys");
check(
  !config.codexMicroConfigSchema.safeParse({ ...config.DEFAULT_CODEX_MICRO_CONFIG, version: 2 }).success,
  "rejects unsupported config versions",
);
check(
  !config.codexMicroConfigSchema.safeParse({
    ...config.DEFAULT_CODEX_MICRO_CONFIG,
    slots: { ...config.DEFAULT_CODEX_MICRO_CONFIG.slots, ACT06: { keycapId: "UNKNOWN" } },
  }).success,
  "rejects unknown keycap ids",
);

const statusColors = {
  working: 3_166_206,
  unread: 65_356,
  idle: 16_777_215,
  "awaiting-approval": 16_739_584,
  "awaiting-response": 16_739_584,
  error: 16_711_731,
  off: 0,
};
for (const [status, color] of Object.entries(statusColors)) {
  check(config.getCodexMicroStatusColor(status) === color, `maps ${status} status color`);
}

check(config.isAutomatedReviewSource("auto_review"), "recognizes auto review sources");
check(config.isAutomatedReviewSource("guardian_subagent"), "recognizes guardian review sources");
check(!config.isAutomatedReviewSource("user"), "rejects manual review sources");
const reviewConfig = { autoReview: { requiredOnModels: ["gpt-5", "custom"] } };
check(config.isAutoReviewRequiredForModel(reviewConfig, "gpt-5"), "matches bare model slugs");
check(config.isAutoReviewRequiredForModel(reviewConfig, "openai/gpt-5"), "strips a valid provider prefix");
check(!config.isAutoReviewRequiredForModel(reviewConfig, "/gpt-5"), "rejects an empty provider");
check(!config.isAutoReviewRequiredForModel(reviewConfig, "openai/team/gpt-5"), "rejects nested model paths");
check(!config.isAutoReviewRequiredForModel(reviewConfig, null), "rejects missing models");
check(!config.isAutoReviewRequiredForModel({}, "gpt-5"), "requires an auto-review model list");
check(config.initializeCodexMicroConfig() === undefined, "keeps config initialization idempotent");

console.log(`app-shared Codex Micro config behavior: ${assertions}/${assertions} assertions passed`);
