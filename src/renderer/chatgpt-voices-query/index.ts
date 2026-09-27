import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import { rJt as chatGptApi } from "@rchunk/app-initial";

interface VoiceQueryInput { spoken_language?: string | null; voice_mode?: string }
interface VoiceResponse { voices: Array<{ description?: string | null; name?: string | null; preview_url?: string; voice: string }>; [key: string]: unknown }
interface VoiceQueryContext { accountId?: string | null; defaultLanguage?: string }
const t = ["chatgpt-settings-voices"] as const;
const n = {
  getOptions(input: VoiceQueryInput, context: VoiceQueryContext = {}) {
    const requested = input.spoken_language ?? context.defaultLanguage;
    const language = requested == null || requested === "auto" ? (context.defaultLanguage ?? "en") : requested;
    const mode = input.voice_mode ?? "advanced";
    return {
      queryKey: [...t, context.accountId ?? null, mode, language],
      queryFn: () => chatGptApi.safeGet<VoiceResponse>("/settings/voices", { parameters: { query: { spoken_language: language, voice_mode: mode } } }),
      select: (response: VoiceResponse) => ({ ...response, voices: response.voices.map(voice => ({ description: voice.description ?? "", name: voice.name ?? voice.voice, orbTreatment: "advanced-blue", previewUrl: voice.preview_url, slug: voice.voice })) }),
      staleTime: 0,
      refetchOnMount: "always" as const,
      retryOnMount: true,
    };
  },
};
function r(): void {}
export { n, r, t };
