// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { yI as t } from "./app-shared-7b9edc1bfb7f.js";
import { mnt as n, pnt as r } from "./app-initial-51da50e6c6e3.js";
async function i(e) {
  try {
    try {
      var n = t();
      let i = n.u(
        await r.environmentConfigs?.preflightPersonalSecrets({
          accountId: e.accountId,
          userId: e.userId,
          configId: e.config.id,
        }),
      );
      return i?.ok ? i.data : null;
    } catch (e) {
      n.e = e;
    } finally {
      n.d();
    }
  } catch {
    return null;
  }
}
function a() {
  return (a = e(() => {
    n();
  }))();
}
export { i as n, a as t };
