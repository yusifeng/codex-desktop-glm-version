// @ts-nocheck
import { classNames as a, initializeClassNames as i } from "../app-shared/ui/class-names";
import { n as e, o as t } from "@rchunk/rolldown-runtime";
import {
  I3 as n,
  e6 as r,
  nd as o,
  rd as s,
} from "@rchunk/app-shared";
var c, l, u, d, f, p;
function m() {
  return (m = e(() => {
    ((c = `_RadioGroup_zo9z8_2`),
      (l = `_RadioLabel_zo9z8_2`),
      (u = `_RadioIndicatorWrapper_zo9z8_2`),
      (d = `_RadioItem_zo9z8_2`),
      (f = `_RadioIndicator_zo9z8_2`),
      (p = {
        RadioGroup: c,
        RadioLabel: l,
        RadioIndicatorWrapper: u,
        RadioItem: d,
        RadioIndicator: f,
        "fade-in": `_fade-in_zo9z8_1`,
        "scale-in": `_scale-in_zo9z8_1`,
      }));
  }))();
}
var h, g, _, v, y, b;
function x() {
  return (x = e(() => {
    (i(),
      s(),
      (h = t(r(), 1)),
      m(),
      (g = n()),
      (_ = (0, h.createContext)(null)),
      (v = () => {
        let e = (0, h.use)(_);
        if (!e) throw Error(`RadioGroup components must be wrapped in <RadioGroup />`);
        return e;
      }),
      (y = ({
        onChange: e,
        children: t,
        className: n,
        direction: r = `row`,
        disabled: i = !1,
        __isWidget: s,
        ...c
      }) => {
        let l = (0, h.useMemo)(() => ({ disabled: i, direction: r }), [i, r]);
        return (0, g.jsx)(_, {
          value: l,
          children: (0, g.jsx)(o.Root, {
            className: a(p.RadioGroup, n),
            "data-direction": r,
            "data-w-component": s ? `radio-group` : void 0,
            onValueChange: e,
            disabled: i,
            ...c,
            children: t,
          }),
        });
      }),
      (b = ({
        value: e,
        disabled: t = !1,
        id: n,
        required: r,
        children: i,
        className: s,
        block: c = !1,
        ...l
      }) => {
        let { disabled: u } = v(),
          d = u || t,
          f = (0, h.useId)(),
          m = n ?? `${e}-${f}`;
        return (0, g.jsx)(`div`, {
          className: `flex`,
          ...l,
          children: (0, g.jsxs)(`label`, {
            htmlFor: m,
            className: a(p.RadioLabel, s),
            "data-disabled": d ? `` : void 0,
            "data-block": c ? `` : void 0,
            onMouseDown: (e) => {
              !e.defaultPrevented && e.detail > 1 && e.preventDefault();
            },
            children: [
              (0, g.jsx)(`div`, {
                className: p.RadioIndicatorWrapper,
                children: (0, g.jsx)(o.Item, {
                  id: m,
                  value: e,
                  disabled: d,
                  required: r,
                  className: p.RadioItem,
                  children: (0, g.jsx)(o.Indicator, { className: p.RadioIndicator }),
                }),
              }),
              i,
            ],
          }),
        });
      }),
      (y.Item = b));
  }))();
}
function S() {
  return (S = e(() => {
    x();
  }))();
}
export { y as n, x as r, S as t };
