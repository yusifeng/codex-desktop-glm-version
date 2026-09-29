import { H3 as initializeAsyncRuntime, V3 as preloadModule } from "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";

async function loadVoiceDsp(): Promise<unknown> {
  const loaded = await preloadModule(async () => { const module = await import("@rchunk/voice-dsp"); return { initializeVoiceDsp: module.initializeVoiceDsp }; }, [], import.meta.url);
  return loaded.initializeVoiceDsp();
}
async function preloadSileroVoiceActivityDetector(options: unknown): Promise<unknown> {
  const loaded = await preloadModule(async () => { const module = await import("@rchunk/silero-vad"); return { preloadSileroVoiceActivityDetector: module.preloadSileroVoiceActivityDetector }; }, [], import.meta.url);
  return loaded.preloadSileroVoiceActivityDetector(options);
}
initializeAsyncRuntime();
export { loadVoiceDsp, preloadSileroVoiceActivityDetector };
