// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { KH as t, YH as n } from "@rchunk/app-shared";
import { Mnt as r, Pnt as i, jon as a } from "@rchunk/app-initial";
import { n as o, t as s } from "@rchunk/code-execution-sandbox-connection";
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
