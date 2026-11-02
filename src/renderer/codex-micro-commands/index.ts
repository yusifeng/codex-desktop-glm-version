// @ts-nocheck
import { isCommandAvailableIn as r } from "../app-shared/runtime/command-metadata-policy";
import { isElectronCommandEnabled as a } from "../app-initial/runtime/electron-command-policy";
import { n as e } from "@rchunk/rolldown-runtime";
import {
  Ep as t,
  Xp as n,
} from "@rchunk/app-shared";
import {
  hEt as i,
} from "@rchunk/app-initial";
function o(e) {
  let t = e === `newThread` ? `newTask` : e;
  return c.find((e) => e.id === t) ?? null;
}
function s(e) {
  let t = /^recentThread([1-6])$/.exec(e);
  return t == null ? null : Number(t[1]) - 1;
}
var c;
function l() {
  return (l = e(() => {
    (t(),
      i(),
      (c = n.filter(
        (e) =>
          (e.kind === `webview` && r(e, `electron`)) || (e.kind === `electron-only` && a(e.id)),
      )));
  }))();
}
export { l as i, o as n, s as r, c as t };
