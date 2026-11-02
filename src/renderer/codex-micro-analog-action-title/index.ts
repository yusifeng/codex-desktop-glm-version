// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { M5t as t, P5t as n } from "@rchunk/app-initial";
import { i as r, n as i } from "@rchunk/codex-micro-commands";
import { n as a, r as o } from "@rchunk/command-messages";
function s(e, n, r) {
  switch (e.type) {
    case `command`: {
      let t = i(e.commandId);
      return t == null ? e.commandId : a(t, r);
    }
    case `skill`: {
      let r = n.find((t) => t.name === e.skillName && t.path === e.skillPath);
      return `$${r == null ? e.skillName : t(r)}`;
    }
  }
}
function c() {
  return (c = e(() => {
    (r(), o(), n());
  }))();
}
export { c as n, s as t };
