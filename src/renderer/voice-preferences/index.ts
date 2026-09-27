import { dun as createPreference, ngn as readPreference, rgn as initializePreferenceRuntime, uun as initializePreferenceStorage } from "@rchunk/app-initial";
import type { ScopedSignal } from "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";

export type VoiceDuckingControl = "none" | "asr" | "volume";

function clampDuckingDecibels(value: unknown): number {
  return typeof value !== "number" || !Number.isFinite(value) ? -10 : Math.min(0, Math.max(-60, Math.round(value)));
}
function clampConfiguredDuckingDepth(value: unknown): number {
  const candidate = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return typeof candidate === "number" && Number.isFinite(candidate) ? Math.max(1, Math.min(60, Math.trunc(candidate))) : 8;
}
function createCoercedPreference<Value>(
  key: string,
  initialValue: Value,
  options?: { coerceStoredValue?(value: unknown): Value },
): ScopedSignal<Record<string, unknown>, Value> {
  return createPreference(key, initialValue, {
    coerceStoredValue: (value: unknown) =>
      value == null
        ? initialValue
        : options?.coerceStoredValue == null
          ? value as Value
          : options.coerceStoredValue(value),
  });
}
function normalizeDuckingControl(value: unknown): VoiceDuckingControl {
  if (value === "none" || value === "asr" || value === "volume") return value;
  return value === "server_transcription" ? "asr" : "volume";
}
function readVoiceDuckingControl(): VoiceDuckingControl | undefined {
  const value = readPreference("voiceDuckingControl");
  return value === "server_transcription" || value === "microphone" ? normalizeDuckingControl(value) : value === "none" || value === "asr" || value === "volume" ? value : undefined;
}
function readVoiceDuckingDecibels(): number | undefined {
  const value = readPreference("voiceDuckingDecibels");
  return value == null ? undefined : clampDuckingDecibels(value);
}

type VoicePreference<Value> = ScopedSignal<Record<string, unknown>, Value>;
let voiceLastUsed: VoicePreference<null> | undefined;
let voiceModelSlug: VoicePreference<string> | undefined;
let erleInformedDuckingEnabled: VoicePreference<boolean> | undefined;
let configuredDuckingDepth: VoicePreference<number> | undefined;
let initialized = false;

function initializeVoicePreferences(): void {
  if (initialized) return;
  initialized = true;
  initializePreferenceRuntime();
  initializePreferenceStorage();
  initializePreferenceStorage();
  voiceLastUsed = createPreference("oai/apps/voiceLastUsed", null);
  createPreference("jump-to-shade", null);
  voiceModelSlug = createCoercedPreference("oai/apps/voiceModelSlug", "");
  createCoercedPreference("voiceDuckingControl", "volume");
  createPreference("voiceDuckingDecibels", -10, { coerceStoredValue: clampDuckingDecibels });
  erleInformedDuckingEnabled = createCoercedPreference("voiceErleInformedDuckingEnabled", true);
  configuredDuckingDepth = createPreference("voiceErleConfiguredDuckingDepthDb", 8, { coerceStoredValue: clampConfiguredDuckingDepth });
}

export { readVoiceDuckingDecibels as a, voiceModelSlug as c, clampDuckingDecibels as i, erleInformedDuckingEnabled as n, initializeVoicePreferences as o, readVoiceDuckingControl as r, voiceLastUsed as s, configuredDuckingDepth as t };
