import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/chatgpt-user-context";
import "@rchunk/voice-preferences";
export type VoiceMode = "wingman" | "advanced" | "standard";
export interface VoicePolicyConfig { rollout_policy?: "unavailable" | "available_opt_in" | "available_default"; rollout_version?: number; unavailable_upsell_policy?: string; wingman_model_name?: string; wingman_model_picker_default_display_name?: string; wingman_model_picker_alternative_options?: Array<{ display_name?: string; slug: string }>; incall_voice_model_picker_available?: boolean }
export interface VoiceScope { policy?: VoicePolicyConfig; selectedVoiceMode?: VoiceMode; selectedPolicyVersion?: number; authenticated?: boolean; potatoHint?: boolean; unsupportedContext?: boolean }
class VoiceConfigurationManager {
  readPolicyConfig(scope: VoiceScope): VoicePolicyConfig { return scope.policy ?? {}; }
  shouldShowWingmanComingSoon(scope: VoiceScope, sessionType: string): boolean { const policy = this.readPolicyConfig(scope); return sessionType === "vp" && policy.rollout_policy === "unavailable" && policy.unavailable_upsell_policy === "coming_soon"; }
  wingmanModelName(scope: VoiceScope): string { return this.readPolicyConfig(scope).wingman_model_name || "GPT Live 1"; }
  wingmanDisplayName(scope: VoiceScope, slug?: string | null): string { const policy = this.readPolicyConfig(scope); return !slug ? policy.wingman_model_picker_default_display_name || "Live" : policy.wingman_model_picker_alternative_options?.find(option => option.slug === slug)?.display_name || slug; }
  policyVersion(scope: VoiceScope): number | undefined { const value = this.readPolicyConfig(scope).rollout_version; return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : undefined; }
  isInCallVoiceModelPickerAvailable(scope: VoiceScope): boolean { return Boolean(this.readPolicyConfig(scope).incall_voice_model_picker_available); }
  policyResolvedVoice(scope: VoiceScope): VoiceMode | undefined { const policy = this.readPolicyConfig(scope); const selected = scope.selectedVoiceMode; if (!scope.authenticated && policy.rollout_policy === "available_default" && !scope.unsupportedContext) return "wingman"; if (policy.rollout_policy === "unavailable") return selected === "wingman" ? "advanced" : scope.potatoHint && selected === "standard" ? "advanced" : selected; if (policy.rollout_policy === "available_default" && selected !== "standard" && !(scope.selectedPolicyVersion != null && policy.rollout_version != null && scope.selectedPolicyVersion >= policy.rollout_version)) return "wingman"; return selected === "wingman" && policy.rollout_policy == null ? "advanced" : selected; }
  isWmOptionAvailable(scope: VoiceScope): boolean { const rollout = this.readPolicyConfig(scope).rollout_policy; return rollout === "available_opt_in" || rollout === "available_default"; }
  getBaseVoiceOptions(scope: VoiceScope): Array<{ modelSlug: string; voiceModel: VoiceMode }> { return (this.isWmOptionAvailable(scope) ? ["wingman", "advanced", "standard"] : ["advanced", "standard"]).map(voiceModel => ({ modelSlug: "", voiceModel: voiceModel as VoiceMode })); }
  sessionType(mode?: string): "no-microphone" | "vp" { return mode === "no-microphone" ? "no-microphone" : "vp"; }
  speakingListeningTrigger(mode?: string): "energy" | "server" { return this.sessionType(mode) === "vp" ? "server" : "energy"; }
}
function isWingmanMode(value: string): boolean { return value === "wm"; }
function initializeVoiceHints(): void {}
function initializeVoiceConfigurationManager(): void {}
const voiceConfigurationManager = new VoiceConfigurationManager();
function isWingmanActive(scope: VoiceScope): boolean { return !scope.unsupportedContext && voiceConfigurationManager.policyResolvedVoice(scope) === "wingman"; }
function resolveVoiceContextId(pathname: string): string | undefined { const gizmo = pathname.match(/^\/g\/([^/]+)/)?.[1]; if (gizmo != null) { const decoded = decodeURIComponent(gizmo); const [prefix, kind, rest] = decoded.split("-"); return prefix !== "g" || !kind ? decoded : kind === "p" ? `g-p-${rest}` : `g-${kind}`; } return pathname.match(/^\/c\/([^/]+)/)?.[1]; }
export { initializeVoiceHints as a, voiceConfigurationManager as i, initializeVoiceConfigurationManager as n, isWingmanMode as o, isWingmanActive as r, resolveVoiceContextId as t };
