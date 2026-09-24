// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { KH as t, YH as n } from "./app-shared-7b9edc1bfb7f.js";
import { Mnt as r, Pnt as i, jon as a } from "./app-initial-51da50e6c6e3.js";
import { n as o, t as s } from "./connect-code-execution-sandbox-b02ae1d03047.js";
async function c({ webview: e, sourceUrl: n, host: i, signal: o }) {
  let c = new URL(n),
    l = `code-execution-${a(c.origin)}`;
  (c.searchParams.set(`app`, `skybridge`),
    c.searchParams.set(`unsafeSkipTargetOriginCheck`, `true`),
    e.setAttribute(`partition`, t(l)));
  let u = await r({ origin: c.origin, sandboxId: l, signal: o, sourceUrl: c.href, webview: e });
  if (
    u.ports.prepareEnvironment == null ||
    u.ports.runUserCode == null ||
    u.ports.screenshot == null ||
    u.ports.stop == null
  ) {
    for (let e of Object.values(u.ports)) e.close();
    return (u.replyPort.close(), null);
  }
  return s({ ...u, host: i, signal: o });
}
function l() {
  return (l = e(() => {
    (o(), n(), i());
  }))();
}
l();
export { c as connectNativeCodeExecutionSandbox };
