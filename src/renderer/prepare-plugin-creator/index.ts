// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { SB as t, wL as n } from "@rchunk/app-shared";
import {
  $2t as r,
  Bfn as i,
  G6t as a,
  K6t as o,
  L2 as s,
  R2 as c,
  e4t as l,
} from "@rchunk/app-initial";
import { co as u, lo as d } from "@rchunk/app-primary";
import { n as f, t as p } from "@rchunk/requested-plugin-connection";
async function m(e, n, r) {
  let i = e.get(o),
    a = () => !n.aborted && e.get(o) === i;
  if (i == null || !a()) return null;
  let s = r?.hostId ?? `durable`,
    d = { hostedAccountId: i, requestedConnectorId: h, requiresAppSetup: !0 },
    p = await u(e, h, s);
  if (!a()) return null;
  if (p == null) throw Error(`Plugin Creator could not be loaded`);
  let [m, g] = await Promise.all([
    e.query.fetch(l, {
      hostId: s,
      marketplacePath: null,
      pluginName: p.pluginId,
      remoteMarketplaceName: t,
    }),
    f(d),
  ]);
  return a()
    ? m.summary.installed &&
      m.summary.enabled &&
      m.summary.disabledReason == null &&
      m.summary.availability !== `DISABLED_BY_ADMIN` &&
      g.kind === `ready`
      ? { pluginId: p.pluginId, setupStarted: !1 }
      : new Promise((t) => {
          let i = (e) => {
              (n.removeEventListener(`abort`, o),
                t(e && a() ? { pluginId: p.pluginId, setupStarted: !0 } : null));
            },
            o = () => i(!1);
          (n.addEventListener(`abort`, o, { once: !0 }),
            c(
              e,
              {
                connectionAppId: h,
                displayName: p.displayName,
                remotePluginId: p.pluginId,
                remoteMarketplaceName: `chatgpt-workspace`,
              },
              { ...r, ...d, hostId: s, onSuccess: () => i(!0), onCancel: o, onError: o },
            ) || o());
        })
    : null;
}
var h;
function g() {
  return (g = e(() => {
    (n(), a(), r(), i(), d(), p(), s(), (h = `connector_openai_plugin_creator`));
  }))();
}
export { m as n, g as t };
