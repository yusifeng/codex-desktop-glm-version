// @ts-nocheck
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "@rchunk/multiplayer-note",
      "@rchunk/rolldown-runtime",
      "@rchunk/app-shared",
      "./app-shared-fa570b9eb9dd.css",
      "@rchunk/preview-layout",
      "@rchunk/library-file-preview-loading",
      "@rchunk/multiplayer-document-runtime",
      "@rchunk/app-initial",
      "./app-initial-e8ceb32eb626.css",
      "@rchunk/yjs-runtime",
      "@rchunk/app-primary",
      "./app-primary-484df789f2f5.css",
      "@exact-chunk/CompilerIntrinsics-76729ba1d15d.js",
      "@rchunk/writing-block-floating-slash-menu",
      "@rchunk/model-picker-chevron-down-sm",
      "@rchunk/writing-block-surface",
      "./writing-block-surface-5a3f8351b60f.css",
      "./writing-block-floating-slash-menu-8a44da7a3811.css",
      "@exact-chunk/CancelablePromise-b98eecb6fb34.js",
      "@rchunk/multiplayer-writing-block",
    ]),
) => i.map((i) => d[i]);
import { n as e } from "@rchunk/rolldown-runtime";
import { H3 as t, V3 as n } from "@rchunk/app-shared";
async function r() {
  return (
    await n(
      async () => {
        let { MultiplayerNote: e } = await import(`@rchunk/multiplayer-note`);
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
        let { MultiplayerWritingBlock: e } = await import(`@rchunk/multiplayer-writing-block`);
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
