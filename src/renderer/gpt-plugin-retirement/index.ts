// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { iN as t, sN as n } from "@rchunk/app-initial";
function r(e) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e)) return a;
  let t = Date.parse(`${e}T00:00:00.000Z`);
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === e ? t : a;
}
function i(e, n) {
  let r = (t(e)?.locale ?? `en-US`).toLowerCase(),
    i = r === `en-us` ? `en` : r,
    a = `https://help.openai.com/${i}/collections/8475420-gpts`;
  try {
    let e = new URL(n.replaceAll(`{lang}`, i));
    return e.protocol === `https:` ? e.href : a;
  } catch {
    return a;
  }
}
var a;
function o() {
  return (o = e(() => {
    (n(), (a = Date.UTC(2026, 11, 11)));
  }))();
}
export { i as n, o as r, r as t };
