// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { yI as t } from "@rchunk/app-shared";
import { mnt as n, pnt as r } from "@rchunk/app-initial";
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
