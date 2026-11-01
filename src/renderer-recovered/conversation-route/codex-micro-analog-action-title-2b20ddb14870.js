import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { M5t as t, P5t as n } from "./app-initial-51da50e6c6e3.js";
import { i as r, n as i } from "./codex-micro-commands-9468b21a98ee.js";
import { n as a, r as o } from "./command-messages-294d3e3133e1.js";
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
