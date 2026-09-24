// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { SB as t, wL as n } from "./app-shared-7b9edc1bfb7f.js";
import {
  $2t as r,
  Bfn as i,
  G6t as a,
  K6t as o,
  L2 as s,
  R2 as c,
  e4t as l,
} from "./app-initial-51da50e6c6e3.js";
import { co as u, lo as d } from "./app-primary-d66705000d76.js";
import { n as f, t as p } from "./requested-plugin-connection-79ec09cadd00.js";
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
