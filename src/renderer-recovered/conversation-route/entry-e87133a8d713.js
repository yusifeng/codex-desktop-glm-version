const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "./note-25803e9da41c.js",
      "./rolldown-runtime-2d059c5e81f4.js",
      "./app-shared-7b9edc1bfb7f.js",
      "./app-shared-fa570b9eb9dd.css",
      "./preview-layout-8681d1f32093.js",
      "./library-file-preview-loading-4ccd894b5692.js",
      "./document-8b336e44c2be.js",
      "./app-initial-51da50e6c6e3.js",
      "./app-initial-e8ceb32eb626.css",
      "./yjs-ce18c78ffd5e.js",
      "./app-primary-d66705000d76.js",
      "./app-primary-484df789f2f5.css",
      "./CompilerIntrinsics-76729ba1d15d.js",
      "./writing-block-floating-slash-menu-c158ecd6de8f.js",
      "./model-picker-chevron-down-sm-db64b320c4a3.js",
      "./writing-block-surface-8e4ea0426261.js",
      "./writing-block-surface-5a3f8351b60f.css",
      "./writing-block-floating-slash-menu-8a44da7a3811.css",
      "./CancelablePromise-b98eecb6fb34.js",
      "./writing-block-9cfe51c7b081.js",
    ]),
) => i.map((i) => d[i]);
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { H3 as t, V3 as n } from "./app-shared-7b9edc1bfb7f.js";
async function r() {
  return (
    await n(
      async () => {
        let { MultiplayerNote: e } = await import(`./note-25803e9da41c.js`);
        return { MultiplayerNote: e };
      },
      __vite__mapDeps([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]),
      import.meta.url,
    )
  ).MultiplayerNote;
}
async function i() {
  return (
    await n(
      async () => {
        let { MultiplayerWritingBlock: e } = await import(`./writing-block-9cfe51c7b081.js`);
        return { MultiplayerWritingBlock: e };
      },
      __vite__mapDeps([19, 1, 2, 3, 7, 8, 15, 16, 6, 9, 10, 11, 12, 13, 14, 17, 5, 18]),
      import.meta.url,
    )
  ).MultiplayerWritingBlock;
}
function a() {
  return (a = e(() => {
    t();
  }))();
}
export { r as n, i as r, a as t };
