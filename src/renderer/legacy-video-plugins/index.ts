// @ts-nocheck
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f || (m.f = ["@rchunk/third-party-umd-runtime", "@rchunk/rolldown-runtime"]),
) => i.map((i) => d[i]);
import { n as e, o as t } from "@rchunk/rolldown-runtime";
import { H3 as n, V3 as r, c4 as i, p4 as a, u4 as o } from "@rchunk/app-shared";
function s(e) {
  return i(this, void 0, void 0, function () {
    var n;
    return o(this, function (i) {
      switch (i.label) {
        case 0:
          return [
            4,
            r(
              () => import(`@rchunk/third-party-umd-runtime`).then((e) => t(e.default)),
              __vite__mapDeps([0, 1]),
              import.meta.url,
            ),
          ];
        case 1:
          return ((n = i.sent()), (e._plugins = n), [2]);
      }
    });
  });
}
function c() {
  return (c = e(() => {
    (a(), n());
  }))();
}
c();
export { s as loadLegacyVideoPlugins };
