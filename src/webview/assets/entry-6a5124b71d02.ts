// @ts-nocheck
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "./voice-dsp-14683bb15d00.js",
      "./rolldown-runtime-2d059c5e81f4.js",
      "./app-shared-7b9edc1bfb7f.js",
      "./app-shared-fa570b9eb9dd.css",
      "./app-initial-51da50e6c6e3.js",
      "./app-initial-e8ceb32eb626.css",
      "./contracts-96b363340ff1.js",
      "./preferences-c824e7299e20.js",
      "./dsp-d76b3132336b.js",
      "./silero-vad-52ec2f0850d3.js",
    ]),
) => i.map((i) => d[i]);
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { H3 as t, V3 as n } from "./app-shared-7b9edc1bfb7f.js";
async function r() {
  return (
    await n(
      async () => {
        let { initializeVoiceDsp: e } = await import(`./voice-dsp-14683bb15d00.js`);
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
      let { preloadSileroVoiceActivityDetector: e } = await import(`./silero-vad-52ec2f0850d3.js`);
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
