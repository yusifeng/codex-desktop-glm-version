// @ts-nocheck
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "@rchunk/file-preview-version-history",
      "@rchunk/app-shared",
      "@rchunk/rolldown-runtime",
      "./app-shared-fa570b9eb9dd.css",
      "@rchunk/version-history",
      "@rchunk/app-initial",
      "./app-initial-e8ceb32eb626.css",
    ]),
) => i.map((i) => d[i]);
import { n as e } from "@rchunk/rolldown-runtime";
import { H3 as t, Jm as n, V3 as r, qm as i } from "@rchunk/app-shared";
var a, o;
function s() {
  return (s = e(() => {
    (i(),
      t(),
      (a = n(
        async () =>
          (
            await r(
              async () => {
                let { ChatGptFilePreviewVersionHistory: e } = await import(
                  `@rchunk/file-preview-version-history`
                );
                return { ChatGptFilePreviewVersionHistory: e };
              },
              __vite__mapDeps([0, 1, 2, 3, 4, 5, 6]),
              import.meta.url,
            )
          ).ChatGptFilePreviewVersionHistory,
      )),
      (o = n(
        async () =>
          (
            await r(
              async () => {
                let { LibraryFilePreviewVersionHistory: e } = await import(
                  `@rchunk/file-preview-version-history`
                );
                return { LibraryFilePreviewVersionHistory: e };
              },
              __vite__mapDeps([0, 1, 2, 3, 4, 5, 6]),
              import.meta.url,
            )
          ).LibraryFilePreviewVersionHistory,
      )));
  }))();
}
export { o as n, s as r, a as t };
