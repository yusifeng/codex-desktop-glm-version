// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { FX as t, QI as n, ZI as r, sZ as i } from "@rchunk/app-shared";
import {
  $sn as a,
  Oln as o,
  Sln as s,
  Ysn as c,
  dgn as l,
  fgn as u,
} from "@rchunk/app-initial";
var d;
function f() {
  return (f = e(() => {
    (t(),
      o(),
      a(),
      n(),
      u(),
      (d = i(r, ({ get: e }) => {
        let { authLoading: t, authMethod: n } = e(s);
        if (t) return !1;
        let { data: r, isError: i } = e(c, { authMethod: n, hostId: l });
        return (
          !i && r != null && r.requirements?.inAppBrowser?.allowExternalBrowserSettingsImport !== !1
        );
      })));
  }))();
}
export { d as n, f as t };
