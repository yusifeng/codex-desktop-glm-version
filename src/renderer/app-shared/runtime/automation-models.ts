import { z } from "@rchunk/renderer-zod-runtime";

export type ReasoningEffort =
  "none" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max" | "ultra";

export interface ReasoningEffortOption extends Record<string, unknown> {
  reasoningEffort: ReasoningEffort;
}

export interface AutomationModel extends Record<string, unknown> {
  model: string;
  isDefault?: boolean;
  defaultReasoningEffort?: ReasoningEffort | null;
  supportedReasoningEfforts?: readonly ReasoningEffortOption[];
}

export interface AutomationModelPreference {
  model?: string | null;
  reasoningEffort?: ReasoningEffort | null;
}

export interface AutomationDefinition extends AutomationModelPreference {
  kind?: string;
}

export interface AutomationModelSelection {
  model: string;
  reasoningEffort: ReasoningEffort | null;
}

export interface RemoteModelConfiguration {
  automationModel: string;
  ephemeralGenerationModel: string;
  ambientSuggestionsModel: string;
  ambientSuggestionsSafetyModel: string;
}

export const DEFAULT_REMOTE_MODEL_CONFIGURATION: RemoteModelConfiguration = {
  automationModel: "gpt-5.6-terra",
  ephemeralGenerationModel: "gpt-5.6-luna",
  ambientSuggestionsModel: "gpt-5.6-luna",
  ambientSuggestionsSafetyModel: "gpt-5.6-luna",
};

export const DEFAULT_AUTOMATION_EXECUTION_ENVIRONMENT = "worktree";
export const LEGACY_AUTOMATION_MODEL = "gpt-5.3-codex";
export const DEFAULT_AUTOMATION_REASONING_EFFORT: ReasoningEffort = "medium";

const nonEmptyModelSlug = z.string().trim().min(1);
const remoteModelConfigurationSchema = z.object({
  codex_automation_model_slug: nonEmptyModelSlug.catch(
    DEFAULT_REMOTE_MODEL_CONFIGURATION.automationModel,
  ),
  codex_ephemeral_generation_model_slug: nonEmptyModelSlug.catch(
    DEFAULT_REMOTE_MODEL_CONFIGURATION.ephemeralGenerationModel,
  ),
  codex_ambient_suggestions_model_slug: nonEmptyModelSlug.catch(
    DEFAULT_REMOTE_MODEL_CONFIGURATION.ambientSuggestionsModel,
  ),
  codex_ambient_suggestions_safety_model_slug: nonEmptyModelSlug.catch(
    DEFAULT_REMOTE_MODEL_CONFIGURATION.ambientSuggestionsSafetyModel,
  ),
});

/** 原 `CNe` / 压缩导出 `UY`。 */
export function parseRemoteModelConfiguration(
  value: unknown,
): RemoteModelConfiguration {
  const parsed = remoteModelConfigurationSchema.safeParse(value);
  return parsed.success
    ? {
        automationModel: parsed.data.codex_automation_model_slug,
        ephemeralGenerationModel:
          parsed.data.codex_ephemeral_generation_model_slug,
        ambientSuggestionsModel:
          parsed.data.codex_ambient_suggestions_model_slug,
        ambientSuggestionsSafetyModel:
          parsed.data.codex_ambient_suggestions_safety_model_slug,
      }
    : DEFAULT_REMOTE_MODEL_CONFIGURATION;
}

/** 原 `TNe` / 压缩导出 `zY`。 */
export function isHeartbeatAutomation(
  automation: AutomationDefinition,
): boolean {
  return automation.kind === "heartbeat";
}

/** 原 `ENe` / 压缩导出 `BY`。 */
export function normalizeAutomationExecutionEnvironment(
  environment: unknown,
): "worktree" | "local" {
  return environment === "worktree" || environment === "local"
    ? environment
    : DEFAULT_AUTOMATION_EXECUTION_ENVIRONMENT;
}

/** 原 `QL` / 压缩导出 `FY`。 */
export function findAutomationModel(
  models: readonly AutomationModel[],
  model: string | null | undefined,
): AutomationModel | null {
  return model == null
    ? null
    : (models.find((candidate) => candidate.model === model) ?? null);
}

/** 原 `$L` / 压缩导出 `LY`。 */
export function resolveSupportedReasoningEffort({
  model,
  reasoningEffort,
}: {
  model: AutomationModel | null | undefined;
  reasoningEffort: ReasoningEffort | null | undefined;
}): ReasoningEffort | null {
  const supported = model?.supportedReasoningEfforts ?? [];
  return reasoningEffort != null &&
    supported.some((option) => option.reasoningEffort === reasoningEffort)
    ? reasoningEffort
    : (model?.defaultReasoningEffort ?? supported[0]?.reasoningEffort ?? null);
}

function selectFallbackAutomationModel(
  models: readonly AutomationModel[],
  defaultModel: string | null | undefined,
): AutomationModel | null {
  return (
    models.find((model) => model.model === defaultModel) ??
    models.find((model) => model.isDefault) ??
    models.find(
      (model) =>
        model.model === DEFAULT_REMOTE_MODEL_CONFIGURATION.automationModel,
    ) ??
    models[0] ??
    null
  );
}

/** 原 `ONe` / 压缩导出 `IY`。 */
export function resolveAutomationModelSelection({
  automation,
  models,
  defaultModel,
}: {
  automation: AutomationModelPreference;
  models: readonly AutomationModel[];
  defaultModel?: string | null;
}): AutomationModelSelection {
  const configuredModel = findAutomationModel(models, automation.model);
  if (configuredModel != null) {
    return {
      model: configuredModel.model,
      reasoningEffort: resolveSupportedReasoningEffort({
        model: configuredModel,
        reasoningEffort: automation.reasoningEffort,
      }),
    };
  }

  if (automation.model == null) {
    const legacyModel = findAutomationModel(models, LEGACY_AUTOMATION_MODEL);
    if (legacyModel != null) {
      return {
        model: legacyModel.model,
        reasoningEffort: resolveSupportedReasoningEffort({
          model: legacyModel,
          reasoningEffort:
            automation.reasoningEffort ?? DEFAULT_AUTOMATION_REASONING_EFFORT,
        }),
      };
    }
  }

  const fallbackModel = selectFallbackAutomationModel(models, defaultModel);
  return fallbackModel == null
    ? {
        model: automation.model ?? LEGACY_AUTOMATION_MODEL,
        reasoningEffort:
          automation.reasoningEffort ?? DEFAULT_AUTOMATION_REASONING_EFFORT,
      }
    : {
        model: fallbackModel.model,
        reasoningEffort: resolveSupportedReasoningEffort({
          model: fallbackModel,
          reasoningEffort: null,
        }),
      };
}

/** 原 `ZL` / 压缩导出 `HY`。 */
export function initializeRemoteModelConfiguration(): void {}

/** 原 `nR` / 压缩导出 `RY`。 */
export function initializeAutomationModels(): void {}
