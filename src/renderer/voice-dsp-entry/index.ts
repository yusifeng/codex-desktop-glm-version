// @ts-nocheck
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "@rchunk/voice-dsp-composition-root",
      "@rchunk/rolldown-runtime",
      "@rchunk/app-shared",
      "./app-shared-fa570b9eb9dd.css",
      "@rchunk/app-initial",
      "./app-initial-e8ceb32eb626.css",
      "@rchunk/media-device-contracts",
      "@rchunk/voice-preferences",
      "@rchunk/voice-dsp-state",
      "@rchunk/silero-vad",
    ]),
) => i.map((i) => d[i]);
import { n as e } from "@rchunk/rolldown-runtime";
import { H3 as t, V3 as n } from "@rchunk/app-shared";
async function r() {
  return (
    await n(
      async () => {
        let { initializeVoiceDsp: e } = await import(`@rchunk/voice-dsp-composition-root`);
        return { initializeVoiceDsp: e };
      },
      __vite__mapDeps([0, 1, 2, 3, 4, 5, 6, 7, 8]),
      import.meta.url,
    )
  ).initializeVoiceDsp();
}
async function i(e) {
  let { preloadSileroVoiceActivityDetector: t } = await n(
    async () => {
      let { preloadSileroVoiceActivityDetector: e } = await import(`@rchunk/silero-vad`);
      return { preloadSileroVoiceActivityDetector: e };
    },
    __vite__mapDeps([9, 1, 2, 3, 4, 5]),
    import.meta.url,
  );
  return t(e);
}
function a() {
  return (a = e(() => {
    t();
  }))();
}
a();
export { r as loadVoiceDsp, i as preloadSileroVoiceActivityDetector };
