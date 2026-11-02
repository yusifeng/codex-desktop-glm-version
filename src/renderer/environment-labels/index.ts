// @ts-nocheck
import { normalizePathSeparators as n } from "../app-shared/runtime/path-key-policy";
import { n as e } from "@rchunk/rolldown-runtime";
import {
  RI as t,
} from "@rchunk/app-shared";
function r(e, t) {
  return t?.trim() || a(e);
}
function i(e) {
  return r(e.configPath, e.type === `success` ? e.environment.name : null);
}
function a(e) {
  let t = n(e),
    r = t.split(`/`).filter(Boolean);
  return r[r.length - 1] ?? t;
}
function o() {
  return (o = e(() => {
    t();
  }))();
}
export { o as n, i as t };
