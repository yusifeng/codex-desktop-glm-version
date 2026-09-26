import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outfile = path.join(
  ROOT,
  "node_modules/.cache/automation-models-test.mjs",
);
await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/app-shared/runtime/automation-models.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  outfile,
  logLevel: "silent",
});
const automationModels = await import(
  `${new URL(`file://${outfile}`).href}?v=${Date.now()}`
);

let assertions = 0;
function equal(actual, expected, message) {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
}

equal(
  automationModels.parseRemoteModelConfiguration(undefined),
  automationModels.DEFAULT_REMOTE_MODEL_CONFIGURATION,
  "defaults an invalid remote payload",
);
equal(
  automationModels.parseRemoteModelConfiguration({}),
  automationModels.DEFAULT_REMOTE_MODEL_CONFIGURATION,
  "defaults missing remote fields",
);
equal(
  automationModels.parseRemoteModelConfiguration({
    codex_automation_model_slug: " custom-automation ",
    codex_ephemeral_generation_model_slug: "custom-ephemeral",
    codex_ambient_suggestions_model_slug: "custom-ambient",
    codex_ambient_suggestions_safety_model_slug: "custom-safety",
  }),
  {
    automationModel: "custom-automation",
    ephemeralGenerationModel: "custom-ephemeral",
    ambientSuggestionsModel: "custom-ambient",
    ambientSuggestionsSafetyModel: "custom-safety",
  },
  "parses and trims remote model slugs",
);
equal(
  automationModels.parseRemoteModelConfiguration({
    codex_automation_model_slug: "",
    codex_ephemeral_generation_model_slug: 42,
    codex_ambient_suggestions_model_slug: "ambient",
  }),
  {
    automationModel: "gpt-5.6-terra",
    ephemeralGenerationModel: "gpt-5.6-luna",
    ambientSuggestionsModel: "ambient",
    ambientSuggestionsSafetyModel: "gpt-5.6-luna",
  },
  "defaults invalid fields independently",
);

equal(
  automationModels.isHeartbeatAutomation({ kind: "heartbeat" }),
  true,
  "recognizes heartbeat automation",
);
equal(
  automationModels.isHeartbeatAutomation({ kind: "cron" }),
  false,
  "rejects cron automation",
);
equal(
  automationModels.normalizeAutomationExecutionEnvironment("local"),
  "local",
  "preserves local execution",
);
equal(
  automationModels.normalizeAutomationExecutionEnvironment("worktree"),
  "worktree",
  "preserves worktree execution",
);
equal(
  automationModels.normalizeAutomationExecutionEnvironment("cloud"),
  "worktree",
  "defaults unknown execution",
);

const models = [
  {
    model: "requested",
    supportedReasoningEfforts: [
      { reasoningEffort: "low" },
      { reasoningEffort: "high" },
    ],
    defaultReasoningEffort: "high",
  },
  {
    model: "product-default",
    isDefault: true,
    supportedReasoningEfforts: [{ reasoningEffort: "medium" }],
  },
  {
    model: "gpt-5.6-terra",
    supportedReasoningEfforts: [{ reasoningEffort: "minimal" }],
  },
];

equal(
  automationModels.findAutomationModel(models, "requested"),
  models[0],
  "finds an exact model",
);
equal(
  automationModels.findAutomationModel(models, "missing"),
  null,
  "returns null for a missing model",
);
equal(
  automationModels.findAutomationModel(models, null),
  null,
  "returns null without a model slug",
);
equal(
  automationModels.resolveSupportedReasoningEffort({
    model: models[0],
    reasoningEffort: "low",
  }),
  "low",
  "preserves a supported effort",
);
equal(
  automationModels.resolveSupportedReasoningEffort({
    model: models[0],
    reasoningEffort: "ultra",
  }),
  "high",
  "falls back to the model default",
);
equal(
  automationModels.resolveSupportedReasoningEffort({
    model: {
      model: "first",
      supportedReasoningEfforts: [{ reasoningEffort: "xhigh" }],
    },
    reasoningEffort: null,
  }),
  "xhigh",
  "falls back to the first supported effort",
);
equal(
  automationModels.resolveSupportedReasoningEffort({
    model: { model: "empty" },
    reasoningEffort: "medium",
  }),
  null,
  "returns null without a supported effort",
);

equal(
  automationModels.resolveAutomationModelSelection({
    automation: { model: "requested", reasoningEffort: "low" },
    models,
  }),
  { model: "requested", reasoningEffort: "low" },
  "uses an available configured model",
);
equal(
  automationModels.resolveAutomationModelSelection({
    automation: { model: "requested", reasoningEffort: "ultra" },
    models,
  }),
  { model: "requested", reasoningEffort: "high" },
  "corrects unsupported configured effort",
);

const legacy = {
  model: "gpt-5.3-codex",
  supportedReasoningEfforts: [
    { reasoningEffort: "low" },
    { reasoningEffort: "medium" },
  ],
};
equal(
  automationModels.resolveAutomationModelSelection({
    automation: {},
    models: [legacy, ...models],
  }),
  { model: "gpt-5.3-codex", reasoningEffort: "medium" },
  "prefers the legacy model for unconfigured automation",
);
equal(
  automationModels.resolveAutomationModelSelection({
    automation: { reasoningEffort: "low" },
    models: [legacy, ...models],
  }),
  { model: "gpt-5.3-codex", reasoningEffort: "low" },
  "preserves a supported legacy effort",
);
equal(
  automationModels.resolveAutomationModelSelection({
    automation: { model: "missing" },
    models,
    defaultModel: "requested",
  }),
  { model: "requested", reasoningEffort: "high" },
  "falls back to the caller default model",
);
equal(
  automationModels.resolveAutomationModelSelection({
    automation: { model: "missing" },
    models,
    defaultModel: "absent",
  }),
  { model: "product-default", reasoningEffort: "medium" },
  "falls back to the product default model",
);
equal(
  automationModels.resolveAutomationModelSelection({
    automation: { model: "missing" },
    models: [models[2]],
  }),
  { model: "gpt-5.6-terra", reasoningEffort: "minimal" },
  "falls back to the configured automation model",
);
equal(
  automationModels.resolveAutomationModelSelection({
    automation: { model: "missing", reasoningEffort: "ultra" },
    models: [],
  }),
  { model: "missing", reasoningEffort: "ultra" },
  "retains explicit values without model metadata",
);
equal(
  automationModels.resolveAutomationModelSelection({
    automation: {},
    models: [],
  }),
  { model: "gpt-5.3-codex", reasoningEffort: "medium" },
  "uses hard defaults without model metadata",
);
equal(
  automationModels.initializeRemoteModelConfiguration(),
  undefined,
  "keeps remote configuration initialization idempotent",
);
equal(
  automationModels.initializeAutomationModels(),
  undefined,
  "keeps automation initialization idempotent",
);

console.log(
  `app-shared automation model behavior: ${assertions}/${assertions} assertions passed`,
);
