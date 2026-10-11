// @ts-nocheck
var e = Object.create,
  t = Object.defineProperty,
  n = Object.getOwnPropertyDescriptor,
  r = Object.getOwnPropertyNames,
  i = Object.getPrototypeOf,
  a = Object.prototype.hasOwnProperty,
  o = (e, t, n) => () => {
    if (n) throw n[0];
    try {
      return (e && (t = e((e = 0))), t);
    } catch (e) {
      throw ((n = [e]), e);
    }
  },
  s = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), (e = null)), t.exports),
  c = (e, n) => {
    let r = {};
    for (var i in e) t(r, i, { get: e[i], enumerable: !0 });
    return (n || t(r, Symbol.toStringTag, { value: `Module` }), r);
  },
  l = (e, i, o, s) => {
    if ((i && typeof i == `object`) || typeof i == `function`)
      for (var c = r(i), l = 0, u = c.length, d; l < u; l++)
        ((d = c[l]),
          !a.call(e, d) &&
            d !== o &&
            t(e, d, {
              get: ((e) => i[e]).bind(null, d),
              enumerable: !(s = n(i, d)) || s.enumerable,
            }));
    return e;
  },
  u = (n, r, o) => (
    (o = n == null ? {} : e(i(n))),
    l(
      r || !n || !n.__esModule || !a.call(n, `default`)
        ? t(o, `default`, { value: n, enumerable: !0 })
        : o,
      n,
    )
  );
let d = require("electron");
function f(e, t, n) {
  function r(n, r) {
    if (
      (n._zod ||
        Object.defineProperty(n, "_zod", {
          value: { def: r, constr: o, traits: new Set() },
          enumerable: !1,
        }),
      n._zod.traits.has(e))
    )
      return;
    (n._zod.traits.add(e), t(n, r));
    let i = o.prototype,
      a = Object.keys(i);
    for (let e = 0; e < a.length; e++) {
      let t = a[e];
      t in n || (n[t] = i[t].bind(n));
    }
  }
  let i = n?.Parent ?? Object;
  class a extends i {}
  Object.defineProperty(a, "name", { value: e });
  function o(e) {
    var t;
    let i = n?.Parent ? new a() : this;
    (r(i, e), (t = i._zod).deferred ?? (t.deferred = []));
    for (let e of i._zod.deferred) e();
    return i;
  }
  return (
    Object.defineProperty(o, "init", { value: r }),
    Object.defineProperty(o, Symbol.hasInstance, {
      value: (t) => (n?.Parent && t instanceof n.Parent ? !0 : t?._zod?.traits?.has(e)),
    }),
    Object.defineProperty(o, "name", { value: e }),
    o
  );
}
function p(e) {
  return (e && Object.assign(_, e), _);
}
var m,
  h,
  g,
  _,
  v = o(() => {
    ((h = class extends Error {
      constructor() {
        super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
      }
    }),
      (g = class extends Error {
        constructor(e) {
          (super(`Encountered unidirectional transform during encode: ${e}`),
            (this.name = `ZodEncodeError`));
        }
      }),
      (m = globalThis).__zod_globalConfig ?? (m.__zod_globalConfig = {}),
      (_ = globalThis.__zod_globalConfig));
  });
function y(e) {
  let t = Object.values(e).filter((e) => typeof e == `number`);
  return Object.entries(e)
    .filter(([e, n]) => t.indexOf(+e) === -1)
    .map(([e, t]) => t);
}
function b(e, t) {
  return typeof t == `bigint` ? t.toString() : t;
}
function x(e) {
  return {
    get value() {
      {
        let t = e();
        return (Object.defineProperty(this, "value", { value: t }), t);
      }
    },
  };
}
function S(e) {
  return e == null;
}
function ee(e) {
  let t = +!!e.startsWith(`^`),
    n = e.endsWith(`$`) ? e.length - 1 : e.length;
  return e.slice(t, n);
}
function C(e, t) {
  let n = e / t,
    r = Math.round(n),
    i = 2 ** -52 * Math.max(Math.abs(n), 1);
  return Math.abs(n - r) < i ? 0 : n - r;
}
function w(e, t, n) {
  let r;
  Object.defineProperty(e, t, {
    get() {
      if (r !== Se) return (r === void 0 && ((r = Se), (r = n())), r);
    },
    set(n) {
      Object.defineProperty(e, t, { value: n });
    },
    configurable: !0,
  });
}
function te(e, t, n) {
  Object.defineProperty(e, t, { value: n, writable: !0, enumerable: !0, configurable: !0 });
}
function ne(...e) {
  let t = {};
  for (let n of e) {
    let e = Object.getOwnPropertyDescriptors(n);
    Object.assign(t, e);
  }
  return Object.defineProperties({}, t);
}
function re(e) {
  return JSON.stringify(e);
}
function ie(e) {
  return e
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, ``)
    .replace(/[\s_-]+/g, `-`)
    .replace(/^-+|-+$/g, ``);
}
function ae(e) {
  return typeof e == `object` && !!e && !Array.isArray(e);
}
function oe(e) {
  if (ae(e) === !1) return !1;
  let t = e.constructor;
  if (t === void 0 || typeof t != `function`) return !0;
  let n = t.prototype;
  return ae(n) !== !1 && Object.prototype.hasOwnProperty.call(n, `isPrototypeOf`) !== !1;
}
function se(e) {
  return oe(e)
    ? { ...e }
    : Array.isArray(e)
      ? [...e]
      : e instanceof Map
        ? new Map(e)
        : e instanceof Set
          ? new Set(e)
          : e;
}
function T(e) {
  return e.replace(/[.*+?^${}()|[\]\\]/g, `\\$&`);
}
function E(e, t, n) {
  let r = new e._zod.constr(t ?? e._zod.def);
  return ((!t || n?.parent) && (r._zod.parent = e), r);
}
function D(e) {
  let t = e;
  if (!t) return {};
  if (typeof t == `string`) return { error: () => t };
  if (t?.message !== void 0) {
    if (t?.error !== void 0) throw Error("Cannot specify both `message` and `error` params");
    t.error = t.message;
  }
  return (delete t.message, typeof t.error == `string` ? { ...t, error: () => t.error } : t);
}
function ce(e) {
  return Object.keys(e).filter(
    (t) => e[t]._zod.optin === `optional` && e[t]._zod.optout === `optional`,
  );
}
function le(e, t) {
  let n = e._zod.def,
    r = n.checks;
  if (r && r.length > 0)
    throw Error(`.pick() cannot be used on object schemas containing refinements`);
  return E(
    e,
    ne(e._zod.def, {
      get shape() {
        let e = {};
        for (let r in t) {
          if (!(r in n.shape)) throw Error(`Unrecognized key: "${r}"`);
          t[r] && (e[r] = n.shape[r]);
        }
        return (te(this, `shape`, e), e);
      },
      checks: [],
    }),
  );
}
function ue(e, t) {
  let n = e._zod.def,
    r = n.checks;
  if (r && r.length > 0)
    throw Error(`.omit() cannot be used on object schemas containing refinements`);
  return E(
    e,
    ne(e._zod.def, {
      get shape() {
        let r = { ...e._zod.def.shape };
        for (let e in t) {
          if (!(e in n.shape)) throw Error(`Unrecognized key: "${e}"`);
          t[e] && delete r[e];
        }
        return (te(this, `shape`, r), r);
      },
      checks: [],
    }),
  );
}
function de(e, t) {
  if (!oe(t)) throw Error(`Invalid input to extend: expected a plain object`);
  let n = e._zod.def.checks;
  if (n && n.length > 0) {
    let n = e._zod.def.shape;
    for (let e in t)
      if (Object.getOwnPropertyDescriptor(n, e) !== void 0)
        throw Error(
          "Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.",
        );
  }
  return E(
    e,
    ne(e._zod.def, {
      get shape() {
        let n = { ...e._zod.def.shape, ...t };
        return (te(this, `shape`, n), n);
      },
    }),
  );
}
function O(e, t) {
  if (!oe(t)) throw Error(`Invalid input to safeExtend: expected a plain object`);
  return E(
    e,
    ne(e._zod.def, {
      get shape() {
        let n = { ...e._zod.def.shape, ...t };
        return (te(this, `shape`, n), n);
      },
    }),
  );
}
function fe(e, t) {
  if (e._zod.def.checks?.length)
    throw Error(
      `.merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.`,
    );
  return E(
    e,
    ne(e._zod.def, {
      get shape() {
        let n = { ...e._zod.def.shape, ...t._zod.def.shape };
        return (te(this, `shape`, n), n);
      },
      get catchall() {
        return t._zod.def.catchall;
      },
      checks: t._zod.def.checks ?? [],
    }),
  );
}
function pe(e, t, n) {
  let r = t._zod.def.checks;
  if (r && r.length > 0)
    throw Error(`.partial() cannot be used on object schemas containing refinements`);
  return E(
    t,
    ne(t._zod.def, {
      get shape() {
        let r = t._zod.def.shape,
          i = { ...r };
        if (n)
          for (let t in n) {
            if (!(t in r)) throw Error(`Unrecognized key: "${t}"`);
            n[t] && (i[t] = e ? new e({ type: `optional`, innerType: r[t] }) : r[t]);
          }
        else for (let t in r) i[t] = e ? new e({ type: `optional`, innerType: r[t] }) : r[t];
        return (te(this, `shape`, i), i);
      },
      checks: [],
    }),
  );
}
function me(e, t, n) {
  return E(
    t,
    ne(t._zod.def, {
      get shape() {
        let r = t._zod.def.shape,
          i = { ...r };
        if (n)
          for (let t in n) {
            if (!(t in i)) throw Error(`Unrecognized key: "${t}"`);
            n[t] && (i[t] = new e({ type: `nonoptional`, innerType: r[t] }));
          }
        else for (let t in r) i[t] = new e({ type: `nonoptional`, innerType: r[t] });
        return (te(this, `shape`, i), i);
      },
    }),
  );
}
function he(e, t = 0) {
  if (e.aborted === !0) return !0;
  for (let n = t; n < e.issues.length; n++) if (e.issues[n]?.continue !== !0) return !0;
  return !1;
}
function ge(e, t = 0) {
  if (e.aborted === !0) return !0;
  for (let n = t; n < e.issues.length; n++) if (e.issues[n]?.continue === !1) return !0;
  return !1;
}
function _e(e, t) {
  return t.map((t) => {
    var n;
    return ((n = t).path ?? (n.path = []), t.path.unshift(e), t);
  });
}
function ve(e) {
  return typeof e == `string` ? e : e?.message;
}
function ye(e, t, n) {
  let r = e.message
      ? e.message
      : (ve(e.inst?._zod.def?.error?.(e)) ??
        ve(t?.error?.(e)) ??
        ve(n.customError?.(e)) ??
        ve(n.localeError?.(e)) ??
        `Invalid input`),
    { inst: i, continue: a, input: o, ...s } = e;
  return ((s.path ??= []), (s.message = r), t?.reportInput && (s.input = o), s);
}
function be(e) {
  return Array.isArray(e) ? `array` : typeof e == `string` ? `string` : `unknown`;
}
function xe(...e) {
  let [t, n, r] = e;
  return typeof t == `string` ? { message: t, code: `custom`, input: n, inst: r } : { ...t };
}
var Se,
  Ce,
  we,
  Te,
  Ee,
  k = o(() => {
    (v(),
      (Se = Symbol(`evaluating`)),
      (Ce = `captureStackTrace` in Error ? Error.captureStackTrace : (...e) => {}),
      (we = x(() => {
        if (_.jitless || (typeof navigator < `u` && navigator?.userAgent?.includes(`Cloudflare`)))
          return !1;
        try {
          return (Function(``), !0);
        } catch {
          return !1;
        }
      })),
      (Te = new Set([`string`, `number`, `symbol`])),
      (Ee = {
        safeint: [-(2 ** 53 - 1), 2 ** 53 - 1],
        int32: [-2147483648, 2147483647],
        uint32: [0, 4294967295],
        float32: [-34028234663852886e22, 34028234663852886e22],
        float64: [-Number.MAX_VALUE, Number.MAX_VALUE],
      }));
  });
function De(e, t = (e) => e.message) {
  let n = {},
    r = [];
  for (let i of e.issues)
    i.path.length > 0
      ? ((n[i.path[0]] = n[i.path[0]] || []), n[i.path[0]].push(t(i)))
      : r.push(t(i));
  return { formErrors: r, fieldErrors: n };
}
function Oe(e, t = (e) => e.message) {
  let n = { _errors: [] },
    r = (e, i = []) => {
      for (let a of e.issues)
        if (a.code === `invalid_union` && a.errors.length)
          a.errors.map((e) => r({ issues: e }, [...i, ...a.path]));
        else if (a.code === `invalid_key`) r({ issues: a.issues }, [...i, ...a.path]);
        else if (a.code === `invalid_element`) r({ issues: a.issues }, [...i, ...a.path]);
        else {
          let e = [...i, ...a.path];
          if (e.length === 0) n._errors.push(t(a));
          else {
            let r = n,
              i = 0;
            for (; i < e.length;) {
              let n = e[i];
              (i === e.length - 1
                ? ((r[n] = r[n] || { _errors: [] }), r[n]._errors.push(t(a)))
                : (r[n] = r[n] || { _errors: [] }),
                (r = r[n]),
                i++);
            }
          }
        }
    };
  return (r(e), n);
}
var A,
  ke,
  j,
  Ae = o(() => {
    (v(),
      k(),
      (A = (e, t) => {
        ((e.name = `$ZodError`),
          Object.defineProperty(e, "_zod", { value: e._zod, enumerable: !1 }),
          Object.defineProperty(e, "issues", { value: t, enumerable: !1 }),
          (e.message = JSON.stringify(t, b, 2)),
          Object.defineProperty(e, "toString", { value: () => e.message, enumerable: !1 }));
      }),
      (ke = f(`$ZodError`, A)),
      (j = f(`$ZodError`, A, { Parent: Error })));
  }),
  je,
  Me,
  Ne,
  Pe,
  Fe,
  Ie,
  Le,
  Re,
  ze,
  Be,
  Ve,
  He,
  Ue,
  We,
  Ge = o(() => {
    (v(),
      Ae(),
      k(),
      (je = (e) => (t, n, r, i) => {
        let a = r ? { ...r, async: !1 } : { async: !1 },
          o = t._zod.run({ value: n, issues: [] }, a);
        if (o instanceof Promise) throw new h();
        if (o.issues.length) {
          let t = new (i?.Err ?? e)(o.issues.map((e) => ye(e, a, p())));
          throw (Ce(t, i?.callee), t);
        }
        return o.value;
      }),
      (Me = (e) => async (t, n, r, i) => {
        let a = r ? { ...r, async: !0 } : { async: !0 },
          o = t._zod.run({ value: n, issues: [] }, a);
        if ((o instanceof Promise && (o = await o), o.issues.length)) {
          let t = new (i?.Err ?? e)(o.issues.map((e) => ye(e, a, p())));
          throw (Ce(t, i?.callee), t);
        }
        return o.value;
      }),
      (Ne = (e) => (t, n, r) => {
        let i = r ? { ...r, async: !1 } : { async: !1 },
          a = t._zod.run({ value: n, issues: [] }, i);
        if (a instanceof Promise) throw new h();
        return a.issues.length
          ? { success: !1, error: new (e ?? ke)(a.issues.map((e) => ye(e, i, p()))) }
          : { success: !0, data: a.value };
      }),
      (Pe = Ne(j)),
      (Fe = (e) => async (t, n, r) => {
        let i = r ? { ...r, async: !0 } : { async: !0 },
          a = t._zod.run({ value: n, issues: [] }, i);
        return (
          a instanceof Promise && (a = await a),
          a.issues.length
            ? { success: !1, error: new e(a.issues.map((e) => ye(e, i, p()))) }
            : { success: !0, data: a.value }
        );
      }),
      (Ie = Fe(j)),
      (Le = (e) => (t, n, r) => {
        let i = r ? { ...r, direction: `backward` } : { direction: `backward` };
        return je(e)(t, n, i);
      }),
      (Re = (e) => (t, n, r) => je(e)(t, n, r)),
      (ze = (e) => async (t, n, r) => {
        let i = r ? { ...r, direction: `backward` } : { direction: `backward` };
        return Me(e)(t, n, i);
      }),
      (Be = (e) => async (t, n, r) => Me(e)(t, n, r)),
      (Ve = (e) => (t, n, r) => {
        let i = r ? { ...r, direction: `backward` } : { direction: `backward` };
        return Ne(e)(t, n, i);
      }),
      (He = (e) => (t, n, r) => Ne(e)(t, n, r)),
      (Ue = (e) => async (t, n, r) => {
        let i = r ? { ...r, direction: `backward` } : { direction: `backward` };
        return Fe(e)(t, n, i);
      }),
      (We = (e) => async (t, n, r) => Fe(e)(t, n, r)));
  });
function Ke() {
  return new RegExp(ot, `u`);
}
function qe(e) {
  let t = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
  return typeof e.precision == `number`
    ? e.precision === -1
      ? `${t}`
      : e.precision === 0
        ? `${t}:[0-5]\\d`
        : `${t}:[0-5]\\d\\.\\d{${e.precision}}`
    : `${t}(?::[0-5]\\d(?:\\.\\d+)?)?`;
}
function Je(e) {
  return RegExp(`^${qe(e)}$`);
}
function Ye(e) {
  let t = qe({ precision: e.precision }),
    n = [`Z`];
  (e.local && n.push(``), e.offset && n.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`));
  let r = `${t}(?:${n.join(`|`)})`;
  return RegExp(`^${ht}T(?:${r})$`);
}
var Xe,
  Ze,
  Qe,
  $e,
  et,
  tt,
  nt,
  rt,
  it,
  at,
  ot,
  st,
  ct,
  lt,
  ut,
  dt,
  ft,
  pt,
  mt,
  ht,
  gt,
  _t,
  vt,
  yt,
  bt,
  xt,
  St,
  Ct,
  wt = o(() => {
    ((Xe = /^[cC][0-9a-z]{6,}$/),
      (Ze = /^[0-9a-z]+$/),
      (Qe = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/),
      ($e = /^[0-9a-vA-V]{20}$/),
      (et = /^[A-Za-z0-9]{27}$/),
      (tt = /^[a-zA-Z0-9_-]{21}$/),
      (nt =
        /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/),
      (rt = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/),
      (it = (e) =>
        e
          ? RegExp(
              `^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${e}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`,
            )
          : /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/),
      (at =
        /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/),
      (ot = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`),
      (st =
        /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/),
      (ct =
        /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/),
      (lt =
        /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/),
      (ut =
        /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/),
      (dt = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/),
      (ft = /^[A-Za-z0-9_-]*$/),
      (pt = /^https?$/),
      (mt = /^\+[1-9]\d{6,14}$/),
      (ht = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`),
      (gt = RegExp(`^${ht}$`)),
      (_t = (e) => {
        let t = e ? `[\\s\\S]{${e?.minimum ?? 0},${e?.maximum ?? ``}}` : `[\\s\\S]*`;
        return RegExp(`^${t}$`);
      }),
      (vt = /^-?\d+$/),
      (yt = /^-?\d+(?:\.\d+)?$/),
      (bt = /^(?:true|false)$/i),
      (xt = /^null$/i),
      (St = /^[^A-Z]*$/),
      (Ct = /^[^a-z]*$/));
  }),
  Tt,
  M,
  Et,
  Dt,
  Ot,
  kt,
  At,
  jt,
  Mt,
  Nt,
  Pt,
  Ft,
  It,
  Lt,
  Rt,
  zt,
  Bt,
  Vt = o(() => {
    (v(),
      wt(),
      k(),
      (Tt = f(`$ZodCheck`, (e, t) => {
        var n;
        ((e._zod ??= {}), (e._zod.def = t), (n = e._zod).onattach ?? (n.onattach = []));
      })),
      (M = { number: `number`, bigint: `bigint`, object: `date` }),
      (Et = f(`$ZodCheckLessThan`, (e, t) => {
        Tt.init(e, t);
        let n = M[typeof t.value];
        (e._zod.onattach.push((e) => {
          let n = e._zod.bag,
            r = (t.inclusive ? n.maximum : n.exclusiveMaximum) ?? 1 / 0;
          t.value < r && (t.inclusive ? (n.maximum = t.value) : (n.exclusiveMaximum = t.value));
        }),
          (e._zod.check = (r) => {
            (t.inclusive ? r.value <= t.value : r.value < t.value) ||
              r.issues.push({
                origin: n,
                code: `too_big`,
                maximum: typeof t.value == `object` ? t.value.getTime() : t.value,
                input: r.value,
                inclusive: t.inclusive,
                inst: e,
                continue: !t.abort,
              });
          }));
      })),
      (Dt = f(`$ZodCheckGreaterThan`, (e, t) => {
        Tt.init(e, t);
        let n = M[typeof t.value];
        (e._zod.onattach.push((e) => {
          let n = e._zod.bag,
            r = (t.inclusive ? n.minimum : n.exclusiveMinimum) ?? -1 / 0;
          t.value > r && (t.inclusive ? (n.minimum = t.value) : (n.exclusiveMinimum = t.value));
        }),
          (e._zod.check = (r) => {
            (t.inclusive ? r.value >= t.value : r.value > t.value) ||
              r.issues.push({
                origin: n,
                code: `too_small`,
                minimum: typeof t.value == `object` ? t.value.getTime() : t.value,
                input: r.value,
                inclusive: t.inclusive,
                inst: e,
                continue: !t.abort,
              });
          }));
      })),
      (Ot = f(`$ZodCheckMultipleOf`, (e, t) => {
        (Tt.init(e, t),
          e._zod.onattach.push((e) => {
            var n;
            (n = e._zod.bag).multipleOf ?? (n.multipleOf = t.value);
          }),
          (e._zod.check = (n) => {
            if (typeof n.value != typeof t.value)
              throw Error(`Cannot mix number and bigint in multiple_of check.`);
            (typeof n.value == `bigint`
              ? n.value % t.value === BigInt(0)
              : C(n.value, t.value) === 0) ||
              n.issues.push({
                origin: typeof n.value,
                code: `not_multiple_of`,
                divisor: t.value,
                input: n.value,
                inst: e,
                continue: !t.abort,
              });
          }));
      })),
      (kt = f(`$ZodCheckNumberFormat`, (e, t) => {
        (Tt.init(e, t), (t.format = t.format || `float64`));
        let n = t.format?.includes(`int`),
          r = n ? `int` : `number`,
          [i, a] = Ee[t.format];
        (e._zod.onattach.push((e) => {
          let r = e._zod.bag;
          ((r.format = t.format), (r.minimum = i), (r.maximum = a), n && (r.pattern = vt));
        }),
          (e._zod.check = (o) => {
            let s = o.value;
            if (n) {
              if (!Number.isInteger(s)) {
                o.issues.push({
                  expected: r,
                  format: t.format,
                  code: `invalid_type`,
                  continue: !1,
                  input: s,
                  inst: e,
                });
                return;
              }
              if (!Number.isSafeInteger(s)) {
                s > 0
                  ? o.issues.push({
                      input: s,
                      code: `too_big`,
                      maximum: 2 ** 53 - 1,
                      note: `Integers must be within the safe integer range.`,
                      inst: e,
                      origin: r,
                      inclusive: !0,
                      continue: !t.abort,
                    })
                  : o.issues.push({
                      input: s,
                      code: `too_small`,
                      minimum: -(2 ** 53 - 1),
                      note: `Integers must be within the safe integer range.`,
                      inst: e,
                      origin: r,
                      inclusive: !0,
                      continue: !t.abort,
                    });
                return;
              }
            }
            (s < i &&
              o.issues.push({
                origin: `number`,
                input: s,
                code: `too_small`,
                minimum: i,
                inclusive: !0,
                inst: e,
                continue: !t.abort,
              }),
              s > a &&
                o.issues.push({
                  origin: `number`,
                  input: s,
                  code: `too_big`,
                  maximum: a,
                  inclusive: !0,
                  inst: e,
                  continue: !t.abort,
                }));
          }));
      })),
      (At = f(`$ZodCheckMaxLength`, (e, t) => {
        var n;
        (Tt.init(e, t),
          (n = e._zod.def).when ??
            (n.when = (e) => {
              let t = e.value;
              return !S(t) && t.length !== void 0;
            }),
          e._zod.onattach.push((e) => {
            let n = e._zod.bag.maximum ?? 1 / 0;
            t.maximum < n && (e._zod.bag.maximum = t.maximum);
          }),
          (e._zod.check = (n) => {
            let r = n.value;
            if (r.length <= t.maximum) return;
            let i = be(r);
            n.issues.push({
              origin: i,
              code: `too_big`,
              maximum: t.maximum,
              inclusive: !0,
              input: r,
              inst: e,
              continue: !t.abort,
            });
          }));
      })),
      (jt = f(`$ZodCheckMinLength`, (e, t) => {
        var n;
        (Tt.init(e, t),
          (n = e._zod.def).when ??
            (n.when = (e) => {
              let t = e.value;
              return !S(t) && t.length !== void 0;
            }),
          e._zod.onattach.push((e) => {
            let n = e._zod.bag.minimum ?? -1 / 0;
            t.minimum > n && (e._zod.bag.minimum = t.minimum);
          }),
          (e._zod.check = (n) => {
            let r = n.value;
            if (r.length >= t.minimum) return;
            let i = be(r);
            n.issues.push({
              origin: i,
              code: `too_small`,
              minimum: t.minimum,
              inclusive: !0,
              input: r,
              inst: e,
              continue: !t.abort,
            });
          }));
      })),
      (Mt = f(`$ZodCheckLengthEquals`, (e, t) => {
        var n;
        (Tt.init(e, t),
          (n = e._zod.def).when ??
            (n.when = (e) => {
              let t = e.value;
              return !S(t) && t.length !== void 0;
            }),
          e._zod.onattach.push((e) => {
            let n = e._zod.bag;
            ((n.minimum = t.length), (n.maximum = t.length), (n.length = t.length));
          }),
          (e._zod.check = (n) => {
            let r = n.value,
              i = r.length;
            if (i === t.length) return;
            let a = be(r),
              o = i > t.length;
            n.issues.push({
              origin: a,
              ...(o
                ? { code: `too_big`, maximum: t.length }
                : { code: `too_small`, minimum: t.length }),
              inclusive: !0,
              exact: !0,
              input: n.value,
              inst: e,
              continue: !t.abort,
            });
          }));
      })),
      (Nt = f(`$ZodCheckStringFormat`, (e, t) => {
        var n, r;
        (Tt.init(e, t),
          e._zod.onattach.push((e) => {
            let n = e._zod.bag;
            ((n.format = t.format),
              t.pattern && ((n.patterns ??= new Set()), n.patterns.add(t.pattern)));
          }),
          t.pattern
            ? ((n = e._zod).check ??
              (n.check = (n) => {
                ((t.pattern.lastIndex = 0),
                  !t.pattern.test(n.value) &&
                    n.issues.push({
                      origin: `string`,
                      code: `invalid_format`,
                      format: t.format,
                      input: n.value,
                      ...(t.pattern ? { pattern: t.pattern.toString() } : {}),
                      inst: e,
                      continue: !t.abort,
                    }));
              }))
            : ((r = e._zod).check ?? (r.check = () => {})));
      })),
      (Pt = f(`$ZodCheckRegex`, (e, t) => {
        (Nt.init(e, t),
          (e._zod.check = (n) => {
            ((t.pattern.lastIndex = 0),
              !t.pattern.test(n.value) &&
                n.issues.push({
                  origin: `string`,
                  code: `invalid_format`,
                  format: `regex`,
                  input: n.value,
                  pattern: t.pattern.toString(),
                  inst: e,
                  continue: !t.abort,
                }));
          }));
      })),
      (Ft = f(`$ZodCheckLowerCase`, (e, t) => {
        ((t.pattern ??= St), Nt.init(e, t));
      })),
      (It = f(`$ZodCheckUpperCase`, (e, t) => {
        ((t.pattern ??= Ct), Nt.init(e, t));
      })),
      (Lt = f(`$ZodCheckIncludes`, (e, t) => {
        Tt.init(e, t);
        let n = T(t.includes),
          r = new RegExp(typeof t.position == `number` ? `^.{${t.position}}${n}` : n);
        ((t.pattern = r),
          e._zod.onattach.push((e) => {
            let t = e._zod.bag;
            ((t.patterns ??= new Set()), t.patterns.add(r));
          }),
          (e._zod.check = (n) => {
            n.value.includes(t.includes, t.position) ||
              n.issues.push({
                origin: `string`,
                code: `invalid_format`,
                format: `includes`,
                includes: t.includes,
                input: n.value,
                inst: e,
                continue: !t.abort,
              });
          }));
      })),
      (Rt = f(`$ZodCheckStartsWith`, (e, t) => {
        Tt.init(e, t);
        let n = RegExp(`^${T(t.prefix)}.*`);
        ((t.pattern ??= n),
          e._zod.onattach.push((e) => {
            let t = e._zod.bag;
            ((t.patterns ??= new Set()), t.patterns.add(n));
          }),
          (e._zod.check = (n) => {
            n.value.startsWith(t.prefix) ||
              n.issues.push({
                origin: `string`,
                code: `invalid_format`,
                format: `starts_with`,
                prefix: t.prefix,
                input: n.value,
                inst: e,
                continue: !t.abort,
              });
          }));
      })),
      (zt = f(`$ZodCheckEndsWith`, (e, t) => {
        Tt.init(e, t);
        let n = RegExp(`.*${T(t.suffix)}$`);
        ((t.pattern ??= n),
          e._zod.onattach.push((e) => {
            let t = e._zod.bag;
            ((t.patterns ??= new Set()), t.patterns.add(n));
          }),
          (e._zod.check = (n) => {
            n.value.endsWith(t.suffix) ||
              n.issues.push({
                origin: `string`,
                code: `invalid_format`,
                format: `ends_with`,
                suffix: t.suffix,
                input: n.value,
                inst: e,
                continue: !t.abort,
              });
          }));
      })),
      (Bt = f(`$ZodCheckOverwrite`, (e, t) => {
        (Tt.init(e, t),
          (e._zod.check = (e) => {
            e.value = t.tx(e.value);
          }));
      })));
  }),
  Ht,
  Ut = o(() => {
    Ht = class {
      constructor(e = []) {
        ((this.content = []), (this.indent = 0), this && (this.args = e));
      }
      indented(e) {
        ((this.indent += 1), e(this), --this.indent);
      }
      write(e) {
        if (typeof e == `function`) {
          (e(this, { execution: `sync` }), e(this, { execution: `async` }));
          return;
        }
        let t = e
            .split(
              `
`,
            )
            .filter((e) => e),
          n = Math.min(...t.map((e) => e.length - e.trimStart().length)),
          r = t.map((e) => e.slice(n)).map((e) => ` `.repeat(this.indent * 2) + e);
        for (let e of r) this.content.push(e);
      }
      compile() {
        let e = Function,
          t = this?.args,
          n = [...(this?.content ?? [``]).map((e) => `  ${e}`)];
        return new e(
          ...t,
          n.join(`
`),
        );
      }
    };
  }),
  Wt,
  Gt = o(() => {
    Wt = { major: 4, minor: 4, patch: 3 };
  });
function Kt(e) {
  if (e === ``) return !0;
  if (/\s/.test(e) || e.length % 4 != 0) return !1;
  try {
    return (atob(e), !0);
  } catch {
    return !1;
  }
}
function qt(e) {
  if (!ft.test(e)) return !1;
  let t = e.replace(/[-_]/g, (e) => (e === `-` ? `+` : `/`));
  return Kt(t.padEnd(Math.ceil(t.length / 4) * 4, `=`));
}
function Jt(e, t = null) {
  try {
    let n = e.split(`.`);
    if (n.length !== 3) return !1;
    let [r] = n;
    if (!r) return !1;
    let i = JSON.parse(atob(r));
    return !((`typ` in i && i?.typ !== `JWT`) || !i.alg || (t && (!(`alg` in i) || i.alg !== t)));
  } catch {
    return !1;
  }
}
function Yt(e, t, n) {
  (e.issues.length && t.issues.push(..._e(n, e.issues)), (t.value[n] = e.value));
}
function Xt(e, t, n, r, i, a) {
  let o = n in r;
  if (e.issues.length) {
    if (i && a && !o) return;
    t.issues.push(..._e(n, e.issues));
  }
  if (!o && !i) {
    e.issues.length ||
      t.issues.push({ code: `invalid_type`, expected: `nonoptional`, input: void 0, path: [n] });
    return;
  }
  e.value === void 0 ? o && (t.value[n] = void 0) : (t.value[n] = e.value);
}
function Zt(e) {
  let t = Object.keys(e.shape);
  for (let n of t)
    if (!e.shape?.[n]?._zod?.traits?.has(`$ZodType`))
      throw Error(`Invalid element at key "${n}": expected a Zod schema`);
  let n = ce(e.shape);
  return { ...e, keys: t, keySet: new Set(t), numKeys: t.length, optionalKeys: new Set(n) };
}
function Qt(e, t, n, r, i, a) {
  let o = [],
    s = i.keySet,
    c = i.catchall._zod,
    l = c.def.type,
    u = c.optin === `optional`,
    d = c.optout === `optional`;
  for (let i in t) {
    if (i === `__proto__` || s.has(i)) continue;
    if (l === `never`) {
      o.push(i);
      continue;
    }
    let a = c.run({ value: t[i], issues: [] }, r);
    a instanceof Promise ? e.push(a.then((e) => Xt(e, n, i, t, u, d))) : Xt(a, n, i, t, u, d);
  }
  return (
    o.length && n.issues.push({ code: `unrecognized_keys`, keys: o, input: t, inst: a }),
    e.length ? Promise.all(e).then(() => n) : n
  );
}
function $t(e, t, n, r) {
  for (let n of e) if (n.issues.length === 0) return ((t.value = n.value), t);
  let i = e.filter((e) => !he(e));
  return i.length === 1
    ? ((t.value = i[0].value), i[0])
    : (t.issues.push({
        code: `invalid_union`,
        input: t.value,
        inst: n,
        errors: e.map((e) => e.issues.map((e) => ye(e, r, p()))),
      }),
      t);
}
function en(e, t) {
  if (e === t || (e instanceof Date && t instanceof Date && +e == +t))
    return { valid: !0, data: e };
  if (oe(e) && oe(t)) {
    let n = Object.keys(t),
      r = Object.keys(e).filter((e) => n.indexOf(e) !== -1),
      i = { ...e, ...t };
    for (let n of r) {
      let r = en(e[n], t[n]);
      if (!r.valid) return { valid: !1, mergeErrorPath: [n, ...r.mergeErrorPath] };
      i[n] = r.data;
    }
    return { valid: !0, data: i };
  }
  if (Array.isArray(e) && Array.isArray(t)) {
    if (e.length !== t.length) return { valid: !1, mergeErrorPath: [] };
    let n = [];
    for (let r = 0; r < e.length; r++) {
      let i = e[r],
        a = t[r],
        o = en(i, a);
      if (!o.valid) return { valid: !1, mergeErrorPath: [r, ...o.mergeErrorPath] };
      n.push(o.data);
    }
    return { valid: !0, data: n };
  }
  return { valid: !1, mergeErrorPath: [] };
}
function tn(e, t, n) {
  let r = new Map(),
    i;
  for (let n of t.issues)
    if (n.code === `unrecognized_keys`) {
      i ??= n;
      for (let e of n.keys) (r.has(e) || r.set(e, {}), (r.get(e).l = !0));
    } else e.issues.push(n);
  for (let t of n.issues)
    if (t.code === `unrecognized_keys`)
      for (let e of t.keys) (r.has(e) || r.set(e, {}), (r.get(e).r = !0));
    else e.issues.push(t);
  let a = [...r].filter(([, e]) => e.l && e.r).map(([e]) => e);
  if ((a.length && i && e.issues.push({ ...i, keys: a }), he(e))) return e;
  let o = en(t.value, n.value);
  if (!o.valid)
    throw Error(`Unmergable intersection. Error path: ${JSON.stringify(o.mergeErrorPath)}`);
  return ((e.value = o.data), e);
}
function nn(e, t) {
  return t === void 0 && (e.issues.length || e.fallback) ? { issues: [], value: void 0 } : e;
}
function rn(e, t) {
  return (e.value === void 0 && (e.value = t.defaultValue), e);
}
function an(e, t) {
  return (
    !e.issues.length &&
      e.value === void 0 &&
      e.issues.push({ code: `invalid_type`, expected: `nonoptional`, input: e.value, inst: t }),
    e
  );
}
function on(e, t, n) {
  return e.issues.length
    ? ((e.aborted = !0), e)
    : t._zod.run({ value: e.value, issues: e.issues, fallback: e.fallback }, n);
}
function sn(e) {
  return ((e.value = Object.freeze(e.value)), e);
}
function cn(e, t, n, r) {
  if (!e) {
    let e = {
      code: `custom`,
      input: n,
      inst: r,
      path: [...(r._zod.def.path ?? [])],
      continue: !r._zod.def.abort,
    };
    (r._zod.def.params && (e.params = r._zod.def.params), t.issues.push(xe(e)));
  }
}
var ln,
  un,
  dn,
  fn,
  pn,
  mn,
  hn,
  gn,
  _n,
  vn,
  yn,
  bn,
  xn,
  Sn,
  Cn,
  wn,
  Tn,
  En,
  Dn,
  On,
  kn,
  An,
  jn,
  Mn,
  Nn,
  Pn,
  Fn,
  In,
  Ln,
  Rn,
  zn,
  Bn,
  Vn,
  Hn,
  Un,
  Wn,
  Gn,
  Kn,
  qn,
  Jn,
  Yn,
  Xn,
  Zn,
  Qn,
  $n,
  er,
  tr,
  nr,
  rr,
  ir,
  ar,
  or,
  sr = o(() => {
    (Vt(),
      v(),
      Ut(),
      Ge(),
      wt(),
      k(),
      Gt(),
      (ln = f(`$ZodType`, (e, t) => {
        var n;
        ((e ??= {}), (e._zod.def = t), (e._zod.bag = e._zod.bag || {}), (e._zod.version = Wt));
        let r = [...(e._zod.def.checks ?? [])];
        e._zod.traits.has(`$ZodCheck`) && r.unshift(e);
        for (let t of r) for (let n of t._zod.onattach) n(e);
        if (r.length === 0)
          ((n = e._zod).deferred ?? (n.deferred = []),
            e._zod.deferred?.push(() => {
              e._zod.run = e._zod.parse;
            }));
        else {
          let t = (e, t, n) => {
              let r = he(e),
                i;
              for (let a of t) {
                if (a._zod.def.when) {
                  if (ge(e) || !a._zod.def.when(e)) continue;
                } else if (r) continue;
                let t = e.issues.length,
                  o = a._zod.check(e);
                if (o instanceof Promise && n?.async === !1) throw new h();
                if (i || o instanceof Promise)
                  i = (i ?? Promise.resolve()).then(async () => {
                    (await o, e.issues.length !== t && (r ||= he(e, t)));
                  });
                else {
                  if (e.issues.length === t) continue;
                  r ||= he(e, t);
                }
              }
              return i ? i.then(() => e) : e;
            },
            n = (n, i, a) => {
              if (he(n)) return ((n.aborted = !0), n);
              let o = t(i, r, a);
              if (o instanceof Promise) {
                if (a.async === !1) throw new h();
                return o.then((t) => e._zod.parse(t, a));
              }
              return e._zod.parse(o, a);
            };
          e._zod.run = (i, a) => {
            if (a.skipChecks) return e._zod.parse(i, a);
            if (a.direction === `backward`) {
              let t = e._zod.parse({ value: i.value, issues: [] }, { ...a, skipChecks: !0 });
              return t instanceof Promise ? t.then((e) => n(e, i, a)) : n(t, i, a);
            }
            let o = e._zod.parse(i, a);
            if (o instanceof Promise) {
              if (a.async === !1) throw new h();
              return o.then((e) => t(e, r, a));
            }
            return t(o, r, a);
          };
        }
        w(e, `~standard`, () => ({
          validate: (t) => {
            try {
              let n = Pe(e, t);
              return n.success ? { value: n.data } : { issues: n.error?.issues };
            } catch {
              return Ie(e, t).then((e) =>
                e.success ? { value: e.data } : { issues: e.error?.issues },
              );
            }
          },
          vendor: `zod`,
          version: 1,
        }));
      })),
      (un = f(`$ZodString`, (e, t) => {
        (ln.init(e, t),
          (e._zod.pattern = [...(e?._zod.bag?.patterns ?? [])].pop() ?? _t(e._zod.bag)),
          (e._zod.parse = (n, r) => {
            if (t.coerce)
              try {
                n.value = String(n.value);
              } catch {}
            return (
              typeof n.value == `string` ||
                n.issues.push({
                  expected: `string`,
                  code: `invalid_type`,
                  input: n.value,
                  inst: e,
                }),
              n
            );
          }));
      })),
      (dn = f(`$ZodStringFormat`, (e, t) => {
        (Nt.init(e, t), un.init(e, t));
      })),
      (fn = f(`$ZodGUID`, (e, t) => {
        ((t.pattern ??= rt), dn.init(e, t));
      })),
      (pn = f(`$ZodUUID`, (e, t) => {
        if (t.version) {
          let e = { v1: 1, v2: 2, v3: 3, v4: 4, v5: 5, v6: 6, v7: 7, v8: 8 }[t.version];
          if (e === void 0) throw Error(`Invalid UUID version: "${t.version}"`);
          t.pattern ??= it(e);
        } else t.pattern ??= it();
        dn.init(e, t);
      })),
      (mn = f(`$ZodEmail`, (e, t) => {
        ((t.pattern ??= at), dn.init(e, t));
      })),
      (hn = f(`$ZodURL`, (e, t) => {
        (dn.init(e, t),
          (e._zod.check = (n) => {
            try {
              let r = n.value.trim();
              if (!t.normalize && t.protocol?.source === pt.source && !/^https?:\/\//i.test(r)) {
                n.issues.push({
                  code: `invalid_format`,
                  format: `url`,
                  note: `Invalid URL format`,
                  input: n.value,
                  inst: e,
                  continue: !t.abort,
                });
                return;
              }
              let i = new URL(r);
              (t.hostname &&
                ((t.hostname.lastIndex = 0),
                t.hostname.test(i.hostname) ||
                  n.issues.push({
                    code: `invalid_format`,
                    format: `url`,
                    note: `Invalid hostname`,
                    pattern: t.hostname.source,
                    input: n.value,
                    inst: e,
                    continue: !t.abort,
                  })),
                t.protocol &&
                  ((t.protocol.lastIndex = 0),
                  t.protocol.test(
                    i.protocol.endsWith(`:`) ? i.protocol.slice(0, -1) : i.protocol,
                  ) ||
                    n.issues.push({
                      code: `invalid_format`,
                      format: `url`,
                      note: `Invalid protocol`,
                      pattern: t.protocol.source,
                      input: n.value,
                      inst: e,
                      continue: !t.abort,
                    })),
                (n.value = t.normalize ? i.href : r));
              return;
            } catch {
              n.issues.push({
                code: `invalid_format`,
                format: `url`,
                input: n.value,
                inst: e,
                continue: !t.abort,
              });
            }
          }));
      })),
      (gn = f(`$ZodEmoji`, (e, t) => {
        ((t.pattern ??= Ke()), dn.init(e, t));
      })),
      (_n = f(`$ZodNanoID`, (e, t) => {
        ((t.pattern ??= tt), dn.init(e, t));
      })),
      (vn = f(`$ZodCUID`, (e, t) => {
        ((t.pattern ??= Xe), dn.init(e, t));
      })),
      (yn = f(`$ZodCUID2`, (e, t) => {
        ((t.pattern ??= Ze), dn.init(e, t));
      })),
      (bn = f(`$ZodULID`, (e, t) => {
        ((t.pattern ??= Qe), dn.init(e, t));
      })),
      (xn = f(`$ZodXID`, (e, t) => {
        ((t.pattern ??= $e), dn.init(e, t));
      })),
      (Sn = f(`$ZodKSUID`, (e, t) => {
        ((t.pattern ??= et), dn.init(e, t));
      })),
      (Cn = f(`$ZodISODateTime`, (e, t) => {
        ((t.pattern ??= Ye(t)), dn.init(e, t));
      })),
      (wn = f(`$ZodISODate`, (e, t) => {
        ((t.pattern ??= gt), dn.init(e, t));
      })),
      (Tn = f(`$ZodISOTime`, (e, t) => {
        ((t.pattern ??= Je(t)), dn.init(e, t));
      })),
      (En = f(`$ZodISODuration`, (e, t) => {
        ((t.pattern ??= nt), dn.init(e, t));
      })),
      (Dn = f(`$ZodIPv4`, (e, t) => {
        ((t.pattern ??= st), dn.init(e, t), (e._zod.bag.format = `ipv4`));
      })),
      (On = f(`$ZodIPv6`, (e, t) => {
        ((t.pattern ??= ct),
          dn.init(e, t),
          (e._zod.bag.format = `ipv6`),
          (e._zod.check = (n) => {
            try {
              new URL(`http://[${n.value}]`);
            } catch {
              n.issues.push({
                code: `invalid_format`,
                format: `ipv6`,
                input: n.value,
                inst: e,
                continue: !t.abort,
              });
            }
          }));
      })),
      (kn = f(`$ZodCIDRv4`, (e, t) => {
        ((t.pattern ??= lt), dn.init(e, t));
      })),
      (An = f(`$ZodCIDRv6`, (e, t) => {
        ((t.pattern ??= ut),
          dn.init(e, t),
          (e._zod.check = (n) => {
            let r = n.value.split(`/`);
            try {
              if (r.length !== 2) throw Error();
              let [e, t] = r;
              if (!t) throw Error();
              let n = Number(t);
              if (`${n}` !== t || n < 0 || n > 128) throw Error();
              new URL(`http://[${e}]`);
            } catch {
              n.issues.push({
                code: `invalid_format`,
                format: `cidrv6`,
                input: n.value,
                inst: e,
                continue: !t.abort,
              });
            }
          }));
      })),
      (jn = f(`$ZodBase64`, (e, t) => {
        ((t.pattern ??= dt),
          dn.init(e, t),
          (e._zod.bag.contentEncoding = `base64`),
          (e._zod.check = (n) => {
            Kt(n.value) ||
              n.issues.push({
                code: `invalid_format`,
                format: `base64`,
                input: n.value,
                inst: e,
                continue: !t.abort,
              });
          }));
      })),
      (Mn = f(`$ZodBase64URL`, (e, t) => {
        ((t.pattern ??= ft),
          dn.init(e, t),
          (e._zod.bag.contentEncoding = `base64url`),
          (e._zod.check = (n) => {
            qt(n.value) ||
              n.issues.push({
                code: `invalid_format`,
                format: `base64url`,
                input: n.value,
                inst: e,
                continue: !t.abort,
              });
          }));
      })),
      (Nn = f(`$ZodE164`, (e, t) => {
        ((t.pattern ??= mt), dn.init(e, t));
      })),
      (Pn = f(`$ZodJWT`, (e, t) => {
        (dn.init(e, t),
          (e._zod.check = (n) => {
            Jt(n.value, t.alg) ||
              n.issues.push({
                code: `invalid_format`,
                format: `jwt`,
                input: n.value,
                inst: e,
                continue: !t.abort,
              });
          }));
      })),
      (Fn = f(`$ZodNumber`, (e, t) => {
        (ln.init(e, t),
          (e._zod.pattern = e._zod.bag.pattern ?? yt),
          (e._zod.parse = (n, r) => {
            if (t.coerce)
              try {
                n.value = Number(n.value);
              } catch {}
            let i = n.value;
            if (typeof i == `number` && !Number.isNaN(i) && Number.isFinite(i)) return n;
            let a =
              typeof i == `number`
                ? Number.isNaN(i)
                  ? `NaN`
                  : Number.isFinite(i)
                    ? void 0
                    : `Infinity`
                : void 0;
            return (
              n.issues.push({
                expected: `number`,
                code: `invalid_type`,
                input: i,
                inst: e,
                ...(a ? { received: a } : {}),
              }),
              n
            );
          }));
      })),
      (In = f(`$ZodNumberFormat`, (e, t) => {
        (kt.init(e, t), Fn.init(e, t));
      })),
      (Ln = f(`$ZodBoolean`, (e, t) => {
        (ln.init(e, t),
          (e._zod.pattern = bt),
          (e._zod.parse = (n, r) => {
            if (t.coerce)
              try {
                n.value = !!n.value;
              } catch {}
            let i = n.value;
            return (
              typeof i == `boolean` ||
                n.issues.push({ expected: `boolean`, code: `invalid_type`, input: i, inst: e }),
              n
            );
          }));
      })),
      (Rn = f(`$ZodNull`, (e, t) => {
        (ln.init(e, t),
          (e._zod.pattern = xt),
          (e._zod.values = new Set([null])),
          (e._zod.parse = (t, n) => {
            let r = t.value;
            return (
              r === null ||
                t.issues.push({ expected: `null`, code: `invalid_type`, input: r, inst: e }),
              t
            );
          }));
      })),
      (zn = f(`$ZodUnknown`, (e, t) => {
        (ln.init(e, t), (e._zod.parse = (e) => e));
      })),
      (Bn = f(`$ZodNever`, (e, t) => {
        (ln.init(e, t),
          (e._zod.parse = (t, n) => (
            t.issues.push({ expected: `never`, code: `invalid_type`, input: t.value, inst: e }),
            t
          )));
      })),
      (Vn = f(`$ZodArray`, (e, t) => {
        (ln.init(e, t),
          (e._zod.parse = (n, r) => {
            let i = n.value;
            if (!Array.isArray(i))
              return (
                n.issues.push({ expected: `array`, code: `invalid_type`, input: i, inst: e }),
                n
              );
            n.value = Array(i.length);
            let a = [];
            for (let e = 0; e < i.length; e++) {
              let o = i[e],
                s = t.element._zod.run({ value: o, issues: [] }, r);
              s instanceof Promise ? a.push(s.then((t) => Yt(t, n, e))) : Yt(s, n, e);
            }
            return a.length ? Promise.all(a).then(() => n) : n;
          }));
      })),
      (Hn = f(`$ZodObject`, (e, t) => {
        if ((ln.init(e, t), !Object.getOwnPropertyDescriptor(t, `shape`)?.get)) {
          let e = t.shape;
          Object.defineProperty(t, "shape", {
            get: () => {
              let n = { ...e };
              return (Object.defineProperty(t, "shape", { value: n }), n);
            },
          });
        }
        let n = x(() => Zt(t));
        w(e._zod, `propValues`, () => {
          let e = t.shape,
            n = {};
          for (let t in e) {
            let r = e[t]._zod;
            if (r.values) {
              n[t] ?? (n[t] = new Set());
              for (let e of r.values) n[t].add(e);
            }
          }
          return n;
        });
        let r = ae,
          i = t.catchall,
          a;
        e._zod.parse = (t, o) => {
          a ??= n.value;
          let s = t.value;
          if (!r(s))
            return (
              t.issues.push({ expected: `object`, code: `invalid_type`, input: s, inst: e }),
              t
            );
          t.value = {};
          let c = [],
            l = a.shape;
          for (let e of a.keys) {
            let n = l[e],
              r = n._zod.optin === `optional`,
              i = n._zod.optout === `optional`,
              a = n._zod.run({ value: s[e], issues: [] }, o);
            a instanceof Promise
              ? c.push(a.then((n) => Xt(n, t, e, s, r, i)))
              : Xt(a, t, e, s, r, i);
          }
          return i ? Qt(c, s, t, o, n.value, e) : c.length ? Promise.all(c).then(() => t) : t;
        };
      })),
      (Un = f(`$ZodObjectJIT`, (e, t) => {
        Hn.init(e, t);
        let n = e._zod.parse,
          r = x(() => Zt(t)),
          i = (e) => {
            let t = new Ht([`shape`, `payload`, `ctx`]),
              n = r.value,
              i = (e) => {
                let t = re(e);
                return `shape[${t}]._zod.run({ value: input[${t}], issues: [] }, ctx)`;
              };
            t.write(`const input = payload.value;`);
            let a = Object.create(null),
              o = 0;
            for (let e of n.keys) a[e] = `key_${o++}`;
            t.write(`const newResult = {};`);
            for (let r of n.keys) {
              let n = a[r],
                o = re(r),
                s = e[r],
                c = s?._zod?.optin === `optional`,
                l = s?._zod?.optout === `optional`;
              (t.write(`const ${n} = ${i(r)};`),
                c && l
                  ? t.write(`
        if (${n}.issues.length) {
          if (${o} in input) {
            payload.issues = payload.issues.concat(${n}.issues.map(iss => ({
              ...iss,
              path: iss.path ? [${o}, ...iss.path] : [${o}]
            })));
          }
        }
        
        if (${n}.value === undefined) {
          if (${o} in input) {
            newResult[${o}] = undefined;
          }
        } else {
          newResult[${o}] = ${n}.value;
        }
        
      `)
                  : c
                    ? t.write(`
        if (${n}.issues.length) {
          payload.issues = payload.issues.concat(${n}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${o}, ...iss.path] : [${o}]
          })));
        }
        
        if (${n}.value === undefined) {
          if (${o} in input) {
            newResult[${o}] = undefined;
          }
        } else {
          newResult[${o}] = ${n}.value;
        }
        
      `)
                    : t.write(`
        const ${n}_present = ${o} in input;
        if (${n}.issues.length) {
          payload.issues = payload.issues.concat(${n}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${o}, ...iss.path] : [${o}]
          })));
        }
        if (!${n}_present && !${n}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${o}]
          });
        }

        if (${n}_present) {
          if (${n}.value === undefined) {
            newResult[${o}] = undefined;
          } else {
            newResult[${o}] = ${n}.value;
          }
        }

      `));
            }
            (t.write(`payload.value = newResult;`), t.write(`return payload;`));
            let s = t.compile();
            return (t, n) => s(e, t, n);
          },
          a,
          o = ae,
          s = !_.jitless,
          c = s && we.value,
          l = t.catchall,
          u;
        e._zod.parse = (d, f) => {
          u ??= r.value;
          let p = d.value;
          return o(p)
            ? s && c && f?.async === !1 && f.jitless !== !0
              ? ((a ||= i(t.shape)), (d = a(d, f)), l ? Qt([], p, d, f, u, e) : d)
              : n(d, f)
            : (d.issues.push({ expected: `object`, code: `invalid_type`, input: p, inst: e }), d);
        };
      })),
      (Wn = f(`$ZodUnion`, (e, t) => {
        (ln.init(e, t),
          w(e._zod, `optin`, () =>
            t.options.some((e) => e._zod.optin === `optional`) ? `optional` : void 0,
          ),
          w(e._zod, `optout`, () =>
            t.options.some((e) => e._zod.optout === `optional`) ? `optional` : void 0,
          ),
          w(e._zod, `values`, () => {
            if (t.options.every((e) => e._zod.values))
              return new Set(t.options.flatMap((e) => Array.from(e._zod.values)));
          }),
          w(e._zod, `pattern`, () => {
            if (t.options.every((e) => e._zod.pattern)) {
              let e = t.options.map((e) => e._zod.pattern);
              return RegExp(`^(${e.map((e) => ee(e.source)).join(`|`)})$`);
            }
          }));
        let n = t.options.length === 1 ? t.options[0]._zod.run : null;
        e._zod.parse = (r, i) => {
          if (n) return n(r, i);
          let a = !1,
            o = [];
          for (let e of t.options) {
            let t = e._zod.run({ value: r.value, issues: [] }, i);
            if (t instanceof Promise) (o.push(t), (a = !0));
            else {
              if (t.issues.length === 0) return t;
              o.push(t);
            }
          }
          return a ? Promise.all(o).then((t) => $t(t, r, e, i)) : $t(o, r, e, i);
        };
      })),
      (Gn = f(`$ZodDiscriminatedUnion`, (e, t) => {
        ((t.inclusive = !1), Wn.init(e, t));
        let n = e._zod.parse;
        w(e._zod, `propValues`, () => {
          let e = {};
          for (let n of t.options) {
            let r = n._zod.propValues;
            if (!r || Object.keys(r).length === 0)
              throw Error(`Invalid discriminated union option at index "${t.options.indexOf(n)}"`);
            for (let [t, n] of Object.entries(r)) {
              e[t] || (e[t] = new Set());
              for (let r of n) e[t].add(r);
            }
          }
          return e;
        });
        let r = x(() => {
          let e = t.options,
            n = new Map();
          for (let r of e) {
            let e = r._zod.propValues?.[t.discriminator];
            if (!e || e.size === 0)
              throw Error(`Invalid discriminated union option at index "${t.options.indexOf(r)}"`);
            for (let t of e) {
              if (n.has(t)) throw Error(`Duplicate discriminator value "${String(t)}"`);
              n.set(t, r);
            }
          }
          return n;
        });
        e._zod.parse = (i, a) => {
          let o = i.value;
          if (!ae(o))
            return (
              i.issues.push({ code: `invalid_type`, expected: `object`, input: o, inst: e }),
              i
            );
          let s = r.value.get(o?.[t.discriminator]);
          return s
            ? s._zod.run(i, a)
            : t.unionFallback || a.direction === `backward`
              ? n(i, a)
              : (i.issues.push({
                  code: `invalid_union`,
                  errors: [],
                  note: `No matching discriminator`,
                  discriminator: t.discriminator,
                  options: Array.from(r.value.keys()),
                  input: o,
                  path: [t.discriminator],
                  inst: e,
                }),
                i);
        };
      })),
      (Kn = f(`$ZodIntersection`, (e, t) => {
        (ln.init(e, t),
          (e._zod.parse = (e, n) => {
            let r = e.value,
              i = t.left._zod.run({ value: r, issues: [] }, n),
              a = t.right._zod.run({ value: r, issues: [] }, n);
            return i instanceof Promise || a instanceof Promise
              ? Promise.all([i, a]).then(([t, n]) => tn(e, t, n))
              : tn(e, i, a);
          }));
      })),
      (qn = f(`$ZodRecord`, (e, t) => {
        (ln.init(e, t),
          (e._zod.parse = (n, r) => {
            let i = n.value;
            if (!oe(i))
              return (
                n.issues.push({ expected: `record`, code: `invalid_type`, input: i, inst: e }),
                n
              );
            let a = [],
              o = t.keyType._zod.values;
            if (o) {
              n.value = {};
              let s = new Set();
              for (let c of o)
                if (typeof c == `string` || typeof c == `number` || typeof c == `symbol`) {
                  s.add(typeof c == `number` ? c.toString() : c);
                  let o = t.keyType._zod.run({ value: c, issues: [] }, r);
                  if (o instanceof Promise)
                    throw Error(`Async schemas not supported in object keys currently`);
                  if (o.issues.length) {
                    n.issues.push({
                      code: `invalid_key`,
                      origin: `record`,
                      issues: o.issues.map((e) => ye(e, r, p())),
                      input: c,
                      path: [c],
                      inst: e,
                    });
                    continue;
                  }
                  let l = o.value,
                    u = t.valueType._zod.run({ value: i[c], issues: [] }, r);
                  u instanceof Promise
                    ? a.push(
                        u.then((e) => {
                          (e.issues.length && n.issues.push(..._e(c, e.issues)),
                            (n.value[l] = e.value));
                        }),
                      )
                    : (u.issues.length && n.issues.push(..._e(c, u.issues)),
                      (n.value[l] = u.value));
                }
              let c;
              for (let e in i) s.has(e) || ((c ??= []), c.push(e));
              c &&
                c.length > 0 &&
                n.issues.push({ code: `unrecognized_keys`, input: i, inst: e, keys: c });
            } else {
              n.value = {};
              for (let o of Reflect.ownKeys(i)) {
                if (o === `__proto__` || !Object.prototype.propertyIsEnumerable.call(i, o))
                  continue;
                let s = t.keyType._zod.run({ value: o, issues: [] }, r);
                if (s instanceof Promise)
                  throw Error(`Async schemas not supported in object keys currently`);
                if (typeof o == `string` && yt.test(o) && s.issues.length) {
                  let e = t.keyType._zod.run({ value: Number(o), issues: [] }, r);
                  if (e instanceof Promise)
                    throw Error(`Async schemas not supported in object keys currently`);
                  e.issues.length === 0 && (s = e);
                }
                if (s.issues.length) {
                  t.mode === `loose`
                    ? (n.value[o] = i[o])
                    : n.issues.push({
                        code: `invalid_key`,
                        origin: `record`,
                        issues: s.issues.map((e) => ye(e, r, p())),
                        input: o,
                        path: [o],
                        inst: e,
                      });
                  continue;
                }
                let c = t.valueType._zod.run({ value: i[o], issues: [] }, r);
                c instanceof Promise
                  ? a.push(
                      c.then((e) => {
                        (e.issues.length && n.issues.push(..._e(o, e.issues)),
                          (n.value[s.value] = e.value));
                      }),
                    )
                  : (c.issues.length && n.issues.push(..._e(o, c.issues)),
                    (n.value[s.value] = c.value));
              }
            }
            return a.length ? Promise.all(a).then(() => n) : n;
          }));
      })),
      (Jn = f(`$ZodEnum`, (e, t) => {
        ln.init(e, t);
        let n = y(t.entries),
          r = new Set(n);
        ((e._zod.values = r),
          (e._zod.pattern = RegExp(
            `^(${n
              .filter((e) => Te.has(typeof e))
              .map((e) => (typeof e == `string` ? T(e) : e.toString()))
              .join(`|`)})$`,
          )),
          (e._zod.parse = (t, i) => {
            let a = t.value;
            return (
              r.has(a) || t.issues.push({ code: `invalid_value`, values: n, input: a, inst: e }),
              t
            );
          }));
      })),
      (Yn = f(`$ZodLiteral`, (e, t) => {
        if ((ln.init(e, t), t.values.length === 0))
          throw Error(`Cannot create literal schema with no valid values`);
        let n = new Set(t.values);
        ((e._zod.values = n),
          (e._zod.pattern = RegExp(
            `^(${t.values.map((e) => (typeof e == `string` ? T(e) : e ? T(e.toString()) : String(e))).join(`|`)})$`,
          )),
          (e._zod.parse = (r, i) => {
            let a = r.value;
            return (
              n.has(a) ||
                r.issues.push({ code: `invalid_value`, values: t.values, input: a, inst: e }),
              r
            );
          }));
      })),
      (Xn = f(`$ZodTransform`, (e, t) => {
        (ln.init(e, t),
          (e._zod.optin = `optional`),
          (e._zod.parse = (n, r) => {
            if (r.direction === `backward`) throw new g(e.constructor.name);
            let i = t.transform(n.value, n);
            if (r.async)
              return (i instanceof Promise ? i : Promise.resolve(i)).then(
                (e) => ((n.value = e), (n.fallback = !0), n),
              );
            if (i instanceof Promise) throw new h();
            return ((n.value = i), (n.fallback = !0), n);
          }));
      })),
      (Zn = f(`$ZodOptional`, (e, t) => {
        (ln.init(e, t),
          (e._zod.optin = `optional`),
          (e._zod.optout = `optional`),
          w(e._zod, `values`, () =>
            t.innerType._zod.values ? new Set([...t.innerType._zod.values, void 0]) : void 0,
          ),
          w(e._zod, `pattern`, () => {
            let e = t.innerType._zod.pattern;
            return e ? RegExp(`^(${ee(e.source)})?$`) : void 0;
          }),
          (e._zod.parse = (e, n) => {
            if (t.innerType._zod.optin === `optional`) {
              let r = e.value,
                i = t.innerType._zod.run(e, n);
              return i instanceof Promise ? i.then((e) => nn(e, r)) : nn(i, r);
            }
            return e.value === void 0 ? e : t.innerType._zod.run(e, n);
          }));
      })),
      (Qn = f(`$ZodExactOptional`, (e, t) => {
        (Zn.init(e, t),
          w(e._zod, `values`, () => t.innerType._zod.values),
          w(e._zod, `pattern`, () => t.innerType._zod.pattern),
          (e._zod.parse = (e, n) => t.innerType._zod.run(e, n)));
      })),
      ($n = f(`$ZodNullable`, (e, t) => {
        (ln.init(e, t),
          w(e._zod, `optin`, () => t.innerType._zod.optin),
          w(e._zod, `optout`, () => t.innerType._zod.optout),
          w(e._zod, `pattern`, () => {
            let e = t.innerType._zod.pattern;
            return e ? RegExp(`^(${ee(e.source)}|null)$`) : void 0;
          }),
          w(e._zod, `values`, () =>
            t.innerType._zod.values ? new Set([...t.innerType._zod.values, null]) : void 0,
          ),
          (e._zod.parse = (e, n) => (e.value === null ? e : t.innerType._zod.run(e, n))));
      })),
      (er = f(`$ZodDefault`, (e, t) => {
        (ln.init(e, t),
          (e._zod.optin = `optional`),
          w(e._zod, `values`, () => t.innerType._zod.values),
          (e._zod.parse = (e, n) => {
            if (n.direction === `backward`) return t.innerType._zod.run(e, n);
            if (e.value === void 0) return ((e.value = t.defaultValue), e);
            let r = t.innerType._zod.run(e, n);
            return r instanceof Promise ? r.then((e) => rn(e, t)) : rn(r, t);
          }));
      })),
      (tr = f(`$ZodPrefault`, (e, t) => {
        (ln.init(e, t),
          (e._zod.optin = `optional`),
          w(e._zod, `values`, () => t.innerType._zod.values),
          (e._zod.parse = (e, n) => (
            n.direction === `backward` || (e.value === void 0 && (e.value = t.defaultValue)),
            t.innerType._zod.run(e, n)
          )));
      })),
      (nr = f(`$ZodNonOptional`, (e, t) => {
        (ln.init(e, t),
          w(e._zod, `values`, () => {
            let e = t.innerType._zod.values;
            return e ? new Set([...e].filter((e) => e !== void 0)) : void 0;
          }),
          (e._zod.parse = (n, r) => {
            let i = t.innerType._zod.run(n, r);
            return i instanceof Promise ? i.then((t) => an(t, e)) : an(i, e);
          }));
      })),
      (rr = f(`$ZodCatch`, (e, t) => {
        (ln.init(e, t),
          (e._zod.optin = `optional`),
          w(e._zod, `optout`, () => t.innerType._zod.optout),
          w(e._zod, `values`, () => t.innerType._zod.values),
          (e._zod.parse = (e, n) => {
            if (n.direction === `backward`) return t.innerType._zod.run(e, n);
            let r = t.innerType._zod.run(e, n);
            return r instanceof Promise
              ? r.then(
                  (r) => (
                    (e.value = r.value),
                    r.issues.length &&
                      ((e.value = t.catchValue({
                        ...e,
                        error: { issues: r.issues.map((e) => ye(e, n, p())) },
                        input: e.value,
                      })),
                      (e.issues = []),
                      (e.fallback = !0)),
                    e
                  ),
                )
              : ((e.value = r.value),
                r.issues.length &&
                  ((e.value = t.catchValue({
                    ...e,
                    error: { issues: r.issues.map((e) => ye(e, n, p())) },
                    input: e.value,
                  })),
                  (e.issues = []),
                  (e.fallback = !0)),
                e);
          }));
      })),
      (ir = f(`$ZodPipe`, (e, t) => {
        (ln.init(e, t),
          w(e._zod, `values`, () => t.in._zod.values),
          w(e._zod, `optin`, () => t.in._zod.optin),
          w(e._zod, `optout`, () => t.out._zod.optout),
          w(e._zod, `propValues`, () => t.in._zod.propValues),
          (e._zod.parse = (e, n) => {
            if (n.direction === `backward`) {
              let r = t.out._zod.run(e, n);
              return r instanceof Promise ? r.then((e) => on(e, t.in, n)) : on(r, t.in, n);
            }
            let r = t.in._zod.run(e, n);
            return r instanceof Promise ? r.then((e) => on(e, t.out, n)) : on(r, t.out, n);
          }));
      })),
      (ar = f(`$ZodReadonly`, (e, t) => {
        (ln.init(e, t),
          w(e._zod, `propValues`, () => t.innerType._zod.propValues),
          w(e._zod, `values`, () => t.innerType._zod.values),
          w(e._zod, `optin`, () => t.innerType?._zod?.optin),
          w(e._zod, `optout`, () => t.innerType?._zod?.optout),
          (e._zod.parse = (e, n) => {
            if (n.direction === `backward`) return t.innerType._zod.run(e, n);
            let r = t.innerType._zod.run(e, n);
            return r instanceof Promise ? r.then(sn) : sn(r);
          }));
      })),
      (or = f(`$ZodCustom`, (e, t) => {
        (Tt.init(e, t),
          ln.init(e, t),
          (e._zod.parse = (e, t) => e),
          (e._zod.check = (n) => {
            let r = n.value,
              i = t.fn(r);
            if (i instanceof Promise) return i.then((t) => cn(t, n, r, e));
            cn(i, n, r, e);
          }));
      })));
  });
function cr() {
  return new ur();
}
var lr,
  ur,
  dr,
  fr = o(() => {
    ((ur = class {
      constructor() {
        ((this._map = new WeakMap()), (this._idmap = new Map()));
      }
      add(e, ...t) {
        let n = t[0];
        return (
          this._map.set(e, n),
          n && typeof n == `object` && `id` in n && this._idmap.set(n.id, e),
          this
        );
      }
      clear() {
        return ((this._map = new WeakMap()), (this._idmap = new Map()), this);
      }
      remove(e) {
        let t = this._map.get(e);
        return (
          t && typeof t == `object` && `id` in t && this._idmap.delete(t.id),
          this._map.delete(e),
          this
        );
      }
      get(e) {
        let t = e._zod.parent;
        if (t) {
          let n = { ...(this.get(t) ?? {}) };
          delete n.id;
          let r = { ...n, ...this._map.get(e) };
          return Object.keys(r).length ? r : void 0;
        }
        return this._map.get(e);
      }
      has(e) {
        return this._map.has(e);
      }
    }),
      (lr = globalThis).__zod_globalRegistry ?? (lr.__zod_globalRegistry = cr()),
      (dr = globalThis.__zod_globalRegistry));
  });
function pr(e, t) {
  return new e({ type: `string`, ...D(t) });
}
function mr(e, t) {
  return new e({ type: `string`, format: `email`, check: `string_format`, abort: !1, ...D(t) });
}
function hr(e, t) {
  return new e({ type: `string`, format: `guid`, check: `string_format`, abort: !1, ...D(t) });
}
function gr(e, t) {
  return new e({ type: `string`, format: `uuid`, check: `string_format`, abort: !1, ...D(t) });
}
function _r(e, t) {
  return new e({
    type: `string`,
    format: `uuid`,
    check: `string_format`,
    abort: !1,
    version: `v4`,
    ...D(t),
  });
}
function vr(e, t) {
  return new e({
    type: `string`,
    format: `uuid`,
    check: `string_format`,
    abort: !1,
    version: `v6`,
    ...D(t),
  });
}
function yr(e, t) {
  return new e({
    type: `string`,
    format: `uuid`,
    check: `string_format`,
    abort: !1,
    version: `v7`,
    ...D(t),
  });
}
function br(e, t) {
  return new e({ type: `string`, format: `url`, check: `string_format`, abort: !1, ...D(t) });
}
function xr(e, t) {
  return new e({ type: `string`, format: `emoji`, check: `string_format`, abort: !1, ...D(t) });
}
function Sr(e, t) {
  return new e({ type: `string`, format: `nanoid`, check: `string_format`, abort: !1, ...D(t) });
}
function Cr(e, t) {
  return new e({ type: `string`, format: `cuid`, check: `string_format`, abort: !1, ...D(t) });
}
function wr(e, t) {
  return new e({ type: `string`, format: `cuid2`, check: `string_format`, abort: !1, ...D(t) });
}
function Tr(e, t) {
  return new e({ type: `string`, format: `ulid`, check: `string_format`, abort: !1, ...D(t) });
}
function Er(e, t) {
  return new e({ type: `string`, format: `xid`, check: `string_format`, abort: !1, ...D(t) });
}
function Dr(e, t) {
  return new e({ type: `string`, format: `ksuid`, check: `string_format`, abort: !1, ...D(t) });
}
function Or(e, t) {
  return new e({ type: `string`, format: `ipv4`, check: `string_format`, abort: !1, ...D(t) });
}
function kr(e, t) {
  return new e({ type: `string`, format: `ipv6`, check: `string_format`, abort: !1, ...D(t) });
}
function Ar(e, t) {
  return new e({ type: `string`, format: `cidrv4`, check: `string_format`, abort: !1, ...D(t) });
}
function jr(e, t) {
  return new e({ type: `string`, format: `cidrv6`, check: `string_format`, abort: !1, ...D(t) });
}
function Mr(e, t) {
  return new e({ type: `string`, format: `base64`, check: `string_format`, abort: !1, ...D(t) });
}
function Nr(e, t) {
  return new e({ type: `string`, format: `base64url`, check: `string_format`, abort: !1, ...D(t) });
}
function Pr(e, t) {
  return new e({ type: `string`, format: `e164`, check: `string_format`, abort: !1, ...D(t) });
}
function Fr(e, t) {
  return new e({ type: `string`, format: `jwt`, check: `string_format`, abort: !1, ...D(t) });
}
function Ir(e, t) {
  return new e({
    type: `string`,
    format: `datetime`,
    check: `string_format`,
    offset: !1,
    local: !1,
    precision: null,
    ...D(t),
  });
}
function Lr(e, t) {
  return new e({ type: `string`, format: `date`, check: `string_format`, ...D(t) });
}
function Rr(e, t) {
  return new e({
    type: `string`,
    format: `time`,
    check: `string_format`,
    precision: null,
    ...D(t),
  });
}
function zr(e, t) {
  return new e({ type: `string`, format: `duration`, check: `string_format`, ...D(t) });
}
function Br(e, t) {
  return new e({ type: `number`, checks: [], ...D(t) });
}
function Vr(e, t) {
  return new e({ type: `number`, check: `number_format`, abort: !1, format: `safeint`, ...D(t) });
}
function Hr(e, t) {
  return new e({ type: `boolean`, ...D(t) });
}
function Ur(e, t) {
  return new e({ type: `null`, ...D(t) });
}
function Wr(e) {
  return new e({ type: `unknown` });
}
function Gr(e, t) {
  return new e({ type: `never`, ...D(t) });
}
function Kr(e, t) {
  return new Et({ check: `less_than`, ...D(t), value: e, inclusive: !1 });
}
function qr(e, t) {
  return new Et({ check: `less_than`, ...D(t), value: e, inclusive: !0 });
}
function Jr(e, t) {
  return new Dt({ check: `greater_than`, ...D(t), value: e, inclusive: !1 });
}
function Yr(e, t) {
  return new Dt({ check: `greater_than`, ...D(t), value: e, inclusive: !0 });
}
function Xr(e, t) {
  return new Ot({ check: `multiple_of`, ...D(t), value: e });
}
function Zr(e, t) {
  return new At({ check: `max_length`, ...D(t), maximum: e });
}
function Qr(e, t) {
  return new jt({ check: `min_length`, ...D(t), minimum: e });
}
function $r(e, t) {
  return new Mt({ check: `length_equals`, ...D(t), length: e });
}
function ei(e, t) {
  return new Pt({ check: `string_format`, format: `regex`, ...D(t), pattern: e });
}
function ti(e) {
  return new Ft({ check: `string_format`, format: `lowercase`, ...D(e) });
}
function ni(e) {
  return new It({ check: `string_format`, format: `uppercase`, ...D(e) });
}
function ri(e, t) {
  return new Lt({ check: `string_format`, format: `includes`, ...D(t), includes: e });
}
function ii(e, t) {
  return new Rt({ check: `string_format`, format: `starts_with`, ...D(t), prefix: e });
}
function ai(e, t) {
  return new zt({ check: `string_format`, format: `ends_with`, ...D(t), suffix: e });
}
function oi(e) {
  return new Bt({ check: `overwrite`, tx: e });
}
function si(e) {
  return oi((t) => t.normalize(e));
}
function ci() {
  return oi((e) => e.trim());
}
function li() {
  return oi((e) => e.toLowerCase());
}
function ui() {
  return oi((e) => e.toUpperCase());
}
function di() {
  return oi((e) => ie(e));
}
function fi(e, t, n) {
  return new e({ type: `array`, element: t, ...D(n) });
}
function pi(e, t, n) {
  return new e({ type: `custom`, check: `custom`, fn: t, ...D(n) });
}
function mi(e, t) {
  let n = hi(
    (t) => (
      (t.addIssue = (e) => {
        if (typeof e == `string`) t.issues.push(xe(e, t.value, n._zod.def));
        else {
          let r = e;
          (r.fatal && (r.continue = !1),
            (r.code ??= `custom`),
            (r.input ??= t.value),
            (r.inst ??= n),
            (r.continue ??= !n._zod.def.abort),
            t.issues.push(xe(r)));
        }
      }),
      e(t.value, t)
    ),
    t,
  );
  return n;
}
function hi(e, t) {
  let n = new Tt({ check: `custom`, ...D(t) });
  return ((n._zod.check = e), n);
}
var gi = o(() => {
  (Vt(), k());
});
function _i(e) {
  let t = e?.target ?? `draft-2020-12`;
  return (
    t === `draft-4` && (t = `draft-04`),
    t === `draft-7` && (t = `draft-07`),
    {
      processors: e.processors ?? {},
      metadataRegistry: e?.metadata ?? dr,
      target: t,
      unrepresentable: e?.unrepresentable ?? `throw`,
      override: e?.override ?? (() => {}),
      io: e?.io ?? `output`,
      counter: 0,
      seen: new Map(),
      cycles: e?.cycles ?? `ref`,
      reused: e?.reused ?? `inline`,
      external: e?.external ?? void 0,
    }
  );
}
function vi(e, t, n = { path: [], schemaPath: [] }) {
  var r;
  let i = e._zod.def,
    a = t.seen.get(e);
  if (a) return (a.count++, n.schemaPath.includes(e) && (a.cycle = n.path), a.schema);
  let o = { schema: {}, count: 1, cycle: void 0, path: n.path };
  t.seen.set(e, o);
  let s = e._zod.toJSONSchema?.();
  if (s) o.schema = s;
  else {
    let r = { ...n, schemaPath: [...n.schemaPath, e], path: n.path };
    if (e._zod.processJSONSchema) e._zod.processJSONSchema(t, o.schema, r);
    else {
      let n = o.schema,
        a = t.processors[i.type];
      if (!a) throw Error(`[toJSONSchema]: Non-representable type encountered: ${i.type}`);
      a(e, t, n, r);
    }
    let a = e._zod.parent;
    a && ((o.ref ||= a), vi(a, t, r), (t.seen.get(a).isParent = !0));
  }
  let c = t.metadataRegistry.get(e);
  return (
    c && Object.assign(o.schema, c),
    t.io === `input` && xi(e) && (delete o.schema.examples, delete o.schema.default),
    t.io === `input` &&
      `_prefault` in o.schema &&
      ((r = o.schema).default ?? (r.default = o.schema._prefault)),
    delete o.schema._prefault,
    t.seen.get(e).schema
  );
}
function yi(e, t) {
  let n = e.seen.get(t);
  if (!n) throw Error(`Unprocessed schema. This is a bug in Zod.`);
  let r = new Map();
  for (let t of e.seen.entries()) {
    let n = e.metadataRegistry.get(t[0])?.id;
    if (n) {
      let e = r.get(n);
      if (e && e !== t[0])
        throw Error(
          `Duplicate schema id "${n}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`,
        );
      r.set(n, t[0]);
    }
  }
  let i = (t) => {
      let r = e.target === `draft-2020-12` ? `$defs` : `definitions`;
      if (e.external) {
        let n = e.external.registry.get(t[0])?.id,
          i = e.external.uri ?? ((e) => e);
        if (n) return { ref: i(n) };
        let a = t[1].defId ?? t[1].schema.id ?? `schema${e.counter++}`;
        return ((t[1].defId = a), { defId: a, ref: `${i(`__shared`)}#/${r}/${a}` });
      }
      if (t[1] === n) return { ref: `#` };
      let i = `#/${r}/`,
        a = t[1].schema.id ?? `__schema${e.counter++}`;
      return { defId: a, ref: i + a };
    },
    a = (e) => {
      if (e[1].schema.$ref) return;
      let t = e[1],
        { ref: n, defId: r } = i(e);
      ((t.def = { ...t.schema }), r && (t.defId = r));
      let a = t.schema;
      for (let e in a) delete a[e];
      a.$ref = n;
    };
  if (e.cycles === `throw`)
    for (let t of e.seen.entries()) {
      let e = t[1];
      if (e.cycle)
        throw Error(`Cycle detected: #/${e.cycle?.join(`/`)}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
    }
  for (let n of e.seen.entries()) {
    let r = n[1];
    if (t === n[0]) {
      a(n);
      continue;
    }
    if (e.external) {
      let r = e.external.registry.get(n[0])?.id;
      if (t !== n[0] && r) {
        a(n);
        continue;
      }
    }
    if (e.metadataRegistry.get(n[0])?.id) {
      a(n);
      continue;
    }
    if (r.cycle) {
      a(n);
      continue;
    }
    if (r.count > 1 && e.reused === `ref`) {
      a(n);
      continue;
    }
  }
}
function bi(e, t) {
  let n = e.seen.get(t);
  if (!n) throw Error(`Unprocessed schema. This is a bug in Zod.`);
  let r = (t) => {
    let n = e.seen.get(t);
    if (n.ref === null) return;
    let i = n.def ?? n.schema,
      a = { ...i },
      o = n.ref;
    if (((n.ref = null), o)) {
      r(o);
      let n = e.seen.get(o),
        s = n.schema;
      if (
        (s.$ref &&
        (e.target === `draft-07` || e.target === `draft-04` || e.target === `openapi-3.0`)
          ? ((i.allOf = i.allOf ?? []), i.allOf.push(s))
          : Object.assign(i, s),
        Object.assign(i, a),
        t._zod.parent === o)
      )
        for (let e in i) e !== `$ref` && e !== `allOf` && (e in a || delete i[e]);
      if (s.$ref && n.def)
        for (let e in i)
          e !== `$ref` &&
            e !== `allOf` &&
            e in n.def &&
            JSON.stringify(i[e]) === JSON.stringify(n.def[e]) &&
            delete i[e];
    }
    let s = t._zod.parent;
    if (s && s !== o) {
      r(s);
      let t = e.seen.get(s);
      if (t?.schema.$ref && ((i.$ref = t.schema.$ref), t.def))
        for (let e in i)
          e !== `$ref` &&
            e !== `allOf` &&
            e in t.def &&
            JSON.stringify(i[e]) === JSON.stringify(t.def[e]) &&
            delete i[e];
    }
    e.override({ zodSchema: t, jsonSchema: i, path: n.path ?? [] });
  };
  for (let t of [...e.seen.entries()].reverse()) r(t[0]);
  let i = {};
  if (
    (e.target === `draft-2020-12`
      ? (i.$schema = `https://json-schema.org/draft/2020-12/schema`)
      : e.target === `draft-07`
        ? (i.$schema = `http://json-schema.org/draft-07/schema#`)
        : e.target === `draft-04`
          ? (i.$schema = `http://json-schema.org/draft-04/schema#`)
          : e.target,
    e.external?.uri)
  ) {
    let n = e.external.registry.get(t)?.id;
    if (!n) throw Error("Schema is missing an `id` property");
    i.$id = e.external.uri(n);
  }
  Object.assign(i, n.def ?? n.schema);
  let a = e.metadataRegistry.get(t)?.id;
  a !== void 0 && i.id === a && delete i.id;
  let o = e.external?.defs ?? {};
  for (let t of e.seen.entries()) {
    let e = t[1];
    e.def && e.defId && (e.def.id === e.defId && delete e.def.id, (o[e.defId] = e.def));
  }
  e.external ||
    (Object.keys(o).length > 0 &&
      (e.target === `draft-2020-12` ? (i.$defs = o) : (i.definitions = o)));
  try {
    let n = JSON.parse(JSON.stringify(i));
    return (
      Object.defineProperty(n, "~standard", {
        value: {
          ...t[`~standard`],
          jsonSchema: {
            input: Ci(t, `input`, e.processors),
            output: Ci(t, `output`, e.processors),
          },
        },
        enumerable: !1,
        writable: !1,
      }),
      n
    );
  } catch {
    throw Error(`Error converting schema to JSON.`);
  }
}
function xi(e, t) {
  let n = t ?? { seen: new Set() };
  if (n.seen.has(e)) return !1;
  n.seen.add(e);
  let r = e._zod.def;
  if (r.type === `transform`) return !0;
  if (r.type === `array`) return xi(r.element, n);
  if (r.type === `set`) return xi(r.valueType, n);
  if (r.type === `lazy`) return xi(r.getter(), n);
  if (
    r.type === `promise` ||
    r.type === `optional` ||
    r.type === `nonoptional` ||
    r.type === `nullable` ||
    r.type === `readonly` ||
    r.type === "default" ||
    r.type === `prefault`
  )
    return xi(r.innerType, n);
  if (r.type === `intersection`) return xi(r.left, n) || xi(r.right, n);
  if (r.type === `record` || r.type === `map`) return xi(r.keyType, n) || xi(r.valueType, n);
  if (r.type === `pipe`) return e._zod.traits.has(`$ZodCodec`) ? !0 : xi(r.in, n) || xi(r.out, n);
  if (r.type === `object`) {
    for (let e in r.shape) if (xi(r.shape[e], n)) return !0;
    return !1;
  }
  if (r.type === `union`) {
    for (let e of r.options) if (xi(e, n)) return !0;
    return !1;
  }
  if (r.type === `tuple`) {
    for (let e of r.items) if (xi(e, n)) return !0;
    return !!(r.rest && xi(r.rest, n));
  }
  return !1;
}
var Si,
  Ci,
  wi = o(() => {
    (fr(),
      (Si =
        (e, t = {}) =>
        (n) => {
          let r = _i({ ...n, processors: t });
          return (vi(e, r), yi(r, e), bi(r, e));
        }),
      (Ci =
        (e, t, n = {}) =>
        (r) => {
          let { libraryOptions: i, target: a } = r ?? {},
            o = _i({ ...(i ?? {}), target: a, io: t, processors: n });
          return (vi(e, o), yi(o, e), bi(o, e));
        }));
  }),
  Ti,
  Ei,
  Di,
  Oi,
  ki,
  Ai,
  ji,
  Mi,
  Ni,
  Pi,
  Fi,
  Ii,
  Li,
  N,
  Ri,
  zi,
  Bi,
  Vi,
  Hi,
  Ui,
  Wi,
  Gi,
  Ki,
  qi,
  Ji = o(() => {
    (wi(),
      k(),
      (Ti = {
        guid: `uuid`,
        url: `uri`,
        datetime: `date-time`,
        json_string: `json-string`,
        regex: ``,
      }),
      (Ei = (e, t, n, r) => {
        let i = n;
        i.type = `string`;
        let { minimum: a, maximum: o, format: s, patterns: c, contentEncoding: l } = e._zod.bag;
        if (
          (typeof a == `number` && (i.minLength = a),
          typeof o == `number` && (i.maxLength = o),
          s &&
            ((i.format = Ti[s] ?? s),
            i.format === `` && delete i.format,
            s === `time` && delete i.format),
          l && (i.contentEncoding = l),
          c && c.size > 0)
        ) {
          let e = [...c];
          e.length === 1
            ? (i.pattern = e[0].source)
            : e.length > 1 &&
              (i.allOf = [
                ...e.map((e) => ({
                  ...(t.target === `draft-07` ||
                  t.target === `draft-04` ||
                  t.target === `openapi-3.0`
                    ? { type: `string` }
                    : {}),
                  pattern: e.source,
                })),
              ]);
        }
      }),
      (Di = (e, t, n, r) => {
        let i = n,
          {
            minimum: a,
            maximum: o,
            format: s,
            multipleOf: c,
            exclusiveMaximum: l,
            exclusiveMinimum: u,
          } = e._zod.bag;
        i.type = typeof s == `string` && s.includes(`int`) ? `integer` : `number`;
        let d = typeof u == `number` && u >= (a ?? -1 / 0),
          f = typeof l == `number` && l <= (o ?? 1 / 0),
          p = t.target === `draft-04` || t.target === `openapi-3.0`;
        (d
          ? p
            ? ((i.minimum = u), (i.exclusiveMinimum = !0))
            : (i.exclusiveMinimum = u)
          : typeof a == `number` && (i.minimum = a),
          f
            ? p
              ? ((i.maximum = l), (i.exclusiveMaximum = !0))
              : (i.exclusiveMaximum = l)
            : typeof o == `number` && (i.maximum = o),
          typeof c == `number` && (i.multipleOf = c));
      }),
      (Oi = (e, t, n, r) => {
        n.type = `boolean`;
      }),
      (ki = (e, t, n, r) => {
        t.target === `openapi-3.0`
          ? ((n.type = `string`), (n.nullable = !0), (n.enum = [null]))
          : (n.type = `null`);
      }),
      (Ai = (e, t, n, r) => {
        n.not = {};
      }),
      (ji = (e, t, n, r) => {}),
      (Mi = (e, t, n, r) => {
        let i = e._zod.def,
          a = y(i.entries);
        (a.every((e) => typeof e == `number`) && (n.type = `number`),
          a.every((e) => typeof e == `string`) && (n.type = `string`),
          (n.enum = a));
      }),
      (Ni = (e, t, n, r) => {
        let i = e._zod.def,
          a = [];
        for (let e of i.values)
          if (e === void 0) {
            if (t.unrepresentable === `throw`)
              throw Error("Literal `undefined` cannot be represented in JSON Schema");
          } else if (typeof e == `bigint`) {
            if (t.unrepresentable === `throw`)
              throw Error(`BigInt literals cannot be represented in JSON Schema`);
            a.push(Number(e));
          } else a.push(e);
        if (a.length !== 0) {
          if (a.length === 1) {
            let e = a[0];
            ((n.type = e === null ? `null` : typeof e),
              t.target === `draft-04` || t.target === `openapi-3.0`
                ? (n.enum = [e])
                : (n.const = e));
          } else
            (a.every((e) => typeof e == `number`) && (n.type = `number`),
              a.every((e) => typeof e == `string`) && (n.type = `string`),
              a.every((e) => typeof e == `boolean`) && (n.type = `boolean`),
              a.every((e) => e === null) && (n.type = `null`),
              (n.enum = a));
        }
      }),
      (Pi = (e, t, n, r) => {
        if (t.unrepresentable === `throw`)
          throw Error(`Custom types cannot be represented in JSON Schema`);
      }),
      (Fi = (e, t, n, r) => {
        if (t.unrepresentable === `throw`)
          throw Error(`Transforms cannot be represented in JSON Schema`);
      }),
      (Ii = (e, t, n, r) => {
        let i = n,
          a = e._zod.def,
          { minimum: o, maximum: s } = e._zod.bag;
        (typeof o == `number` && (i.minItems = o),
          typeof s == `number` && (i.maxItems = s),
          (i.type = `array`),
          (i.items = vi(a.element, t, { ...r, path: [...r.path, `items`] })));
      }),
      (Li = (e, t, n, r) => {
        let i = n,
          a = e._zod.def;
        ((i.type = `object`), (i.properties = {}));
        let o = a.shape;
        for (let e in o)
          i.properties[e] = vi(o[e], t, { ...r, path: [...r.path, `properties`, e] });
        let s = new Set(Object.keys(o)),
          c = new Set(
            [...s].filter((e) => {
              let n = a.shape[e]._zod;
              return t.io === `input` ? n.optin === void 0 : n.optout === void 0;
            }),
          );
        (c.size > 0 && (i.required = Array.from(c)),
          a.catchall?._zod.def.type === `never`
            ? (i.additionalProperties = !1)
            : a.catchall
              ? a.catchall &&
                (i.additionalProperties = vi(a.catchall, t, {
                  ...r,
                  path: [...r.path, `additionalProperties`],
                }))
              : t.io === `output` && (i.additionalProperties = !1));
      }),
      (N = (e, t, n, r) => {
        let i = e._zod.def,
          a = i.inclusive === !1,
          o = i.options.map((e, n) =>
            vi(e, t, { ...r, path: [...r.path, a ? `oneOf` : `anyOf`, n] }),
          );
        a ? (n.oneOf = o) : (n.anyOf = o);
      }),
      (Ri = (e, t, n, r) => {
        let i = e._zod.def,
          a = vi(i.left, t, { ...r, path: [...r.path, `allOf`, 0] }),
          o = vi(i.right, t, { ...r, path: [...r.path, `allOf`, 1] }),
          s = (e) => `allOf` in e && Object.keys(e).length === 1;
        n.allOf = [...(s(a) ? a.allOf : [a]), ...(s(o) ? o.allOf : [o])];
      }),
      (zi = (e, t, n, r) => {
        let i = n,
          a = e._zod.def;
        i.type = `object`;
        let o = a.keyType,
          s = o._zod.bag?.patterns;
        if (a.mode === `loose` && s && s.size > 0) {
          let e = vi(a.valueType, t, { ...r, path: [...r.path, `patternProperties`, `*`] });
          i.patternProperties = {};
          for (let t of s) i.patternProperties[t.source] = e;
        } else
          ((t.target === `draft-07` || t.target === `draft-2020-12`) &&
            (i.propertyNames = vi(a.keyType, t, { ...r, path: [...r.path, `propertyNames`] })),
            (i.additionalProperties = vi(a.valueType, t, {
              ...r,
              path: [...r.path, `additionalProperties`],
            })));
        let c = o._zod.values;
        if (c) {
          let e = [...c].filter((e) => typeof e == `string` || typeof e == `number`);
          e.length > 0 && (i.required = e);
        }
      }),
      (Bi = (e, t, n, r) => {
        let i = e._zod.def,
          a = vi(i.innerType, t, r),
          o = t.seen.get(e);
        t.target === `openapi-3.0`
          ? ((o.ref = i.innerType), (n.nullable = !0))
          : (n.anyOf = [a, { type: `null` }]);
      }),
      (Vi = (e, t, n, r) => {
        let i = e._zod.def;
        vi(i.innerType, t, r);
        let a = t.seen.get(e);
        a.ref = i.innerType;
      }),
      (Hi = (e, t, n, r) => {
        let i = e._zod.def;
        vi(i.innerType, t, r);
        let a = t.seen.get(e);
        ((a.ref = i.innerType), (n.default = JSON.parse(JSON.stringify(i.defaultValue))));
      }),
      (Ui = (e, t, n, r) => {
        let i = e._zod.def;
        vi(i.innerType, t, r);
        let a = t.seen.get(e);
        ((a.ref = i.innerType),
          t.io === `input` && (n._prefault = JSON.parse(JSON.stringify(i.defaultValue))));
      }),
      (Wi = (e, t, n, r) => {
        let i = e._zod.def;
        vi(i.innerType, t, r);
        let a = t.seen.get(e);
        a.ref = i.innerType;
        let o;
        try {
          o = i.catchValue(void 0);
        } catch {
          throw Error(`Dynamic catch values are not supported in JSON Schema`);
        }
        n.default = o;
      }),
      (Gi = (e, t, n, r) => {
        let i = e._zod.def,
          a = i.in._zod.traits.has(`$ZodTransform`),
          o = t.io === `input` ? (a ? i.out : i.in) : i.out;
        vi(o, t, r);
        let s = t.seen.get(e);
        s.ref = o;
      }),
      (Ki = (e, t, n, r) => {
        let i = e._zod.def;
        vi(i.innerType, t, r);
        let a = t.seen.get(e);
        ((a.ref = i.innerType), (n.readOnly = !0));
      }),
      (qi = (e, t, n, r) => {
        let i = e._zod.def;
        vi(i.innerType, t, r);
        let a = t.seen.get(e);
        a.ref = i.innerType;
      }));
  }),
  Yi = o(() => {
    (v(), Ge(), Ae(), sr(), Vt(), Gt(), k(), wt(), fr(), Ut(), gi(), wi(), Ji(), wi());
  }),
  Xi = o(() => {
    Yi();
  });
function Zi(e) {
  return Ir(ta, e);
}
function Qi(e) {
  return Lr(na, e);
}
function $i(e) {
  return Rr(ra, e);
}
function ea(e) {
  return zr(ia, e);
}
var ta,
  na,
  ra,
  ia,
  aa = o(() => {
    (Yi(),
      Ko(),
      (ta = f(`ZodISODateTime`, (e, t) => {
        (Cn.init(e, t), to.init(e, t));
      })),
      (na = f(`ZodISODate`, (e, t) => {
        (wn.init(e, t), to.init(e, t));
      })),
      (ra = f(`ZodISOTime`, (e, t) => {
        (Tn.init(e, t), to.init(e, t));
      })),
      (ia = f(`ZodISODuration`, (e, t) => {
        (En.init(e, t), to.init(e, t));
      })));
  }),
  oa,
  sa,
  ca = o(() => {
    (Yi(),
      k(),
      (oa = (e, t) => {
        (ke.init(e, t),
          (e.name = `ZodError`),
          Object.defineProperties(e, {
            format: { value: (t) => Oe(e, t) },
            flatten: { value: (t) => De(e, t) },
            addIssue: {
              value: (t) => {
                (e.issues.push(t), (e.message = JSON.stringify(e.issues, b, 2)));
              },
            },
            addIssues: {
              value: (t) => {
                (e.issues.push(...t), (e.message = JSON.stringify(e.issues, b, 2)));
              },
            },
            isEmpty: {
              get() {
                return e.issues.length === 0;
              },
            },
          }));
      }),
      (sa = f(`ZodError`, oa, { Parent: Error })));
  }),
  la,
  ua,
  da,
  fa,
  pa,
  ma,
  ha,
  ga,
  _a,
  va,
  ya,
  ba,
  xa = o(() => {
    (Yi(),
      ca(),
      (la = je(sa)),
      (ua = Me(sa)),
      (da = Ne(sa)),
      (fa = Fe(sa)),
      (pa = Le(sa)),
      (ma = Re(sa)),
      (ha = ze(sa)),
      (ga = Be(sa)),
      (_a = Ve(sa)),
      (va = He(sa)),
      (ya = Ue(sa)),
      (ba = We(sa)));
  });
function Sa(e, t, n) {
  let r = Object.getPrototypeOf(e),
    i = Za.get(r);
  if ((i || ((i = new Set()), Za.set(r, i)), !i.has(t))) {
    i.add(t);
    for (let e in n) {
      let t = n[e];
      Object.defineProperty(r, e, {
        configurable: !0,
        enumerable: !1,
        get() {
          let n = t.bind(this);
          return (
            Object.defineProperty(this, e, {
              configurable: !0,
              writable: !0,
              enumerable: !0,
              value: n,
            }),
            n
          );
        },
        set(t) {
          Object.defineProperty(this, e, {
            configurable: !0,
            writable: !0,
            enumerable: !0,
            value: t,
          });
        },
      });
    }
  }
}
function Ca(e) {
  return pr(eo, e);
}
function wa(e) {
  return Br(xo, e);
}
function Ta(e) {
  return Vr(So, e);
}
function Ea(e) {
  return Hr(Co, e);
}
function Da(e) {
  return Ur(wo, e);
}
function Oa() {
  return Wr(To);
}
function ka(e) {
  return Gr(Eo, e);
}
function Aa(e, t) {
  return fi(Do, e, t);
}
function ja(e, t) {
  let n = { type: `object`, shape: e ?? {}, ...D(t) };
  return new Oo(n);
}
function Ma(e, t) {
  return new Oo({ type: `object`, shape: e, catchall: ka(), ...D(t) });
}
function Na(e, t) {
  return new ko({ type: `union`, options: e, ...D(t) });
}
function Pa(e, t, n) {
  return new Ao({ type: `union`, options: t, discriminator: e, ...D(n) });
}
function Fa(e, t) {
  return new jo({ type: `intersection`, left: e, right: t });
}
function Ia(e, t, n) {
  return !t || !t._zod
    ? new Mo({ type: `record`, keyType: Ca(), valueType: e, ...D(t) })
    : new Mo({ type: `record`, keyType: e, valueType: t, ...D(n) });
}
function La(e, t) {
  let n = Array.isArray(e) ? Object.fromEntries(e.map((e) => [e, e])) : e;
  return new No({ type: `enum`, entries: n, ...D(t) });
}
function Ra(e, t) {
  return new Po({ type: `literal`, values: Array.isArray(e) ? e : [e], ...D(t) });
}
function za(e) {
  return new Fo({ type: `transform`, transform: e });
}
function Ba(e) {
  return new Io({ type: `optional`, innerType: e });
}
function Va(e) {
  return new Lo({ type: `optional`, innerType: e });
}
function Ha(e) {
  return new Ro({ type: `nullable`, innerType: e });
}
function Ua(e, t) {
  return new zo({
    type: `default`,
    innerType: e,
    get defaultValue() {
      return typeof t == `function` ? t() : se(t);
    },
  });
}
function Wa(e, t) {
  return new Bo({
    type: `prefault`,
    innerType: e,
    get defaultValue() {
      return typeof t == `function` ? t() : se(t);
    },
  });
}
function Ga(e, t) {
  return new Vo({ type: `nonoptional`, innerType: e, ...D(t) });
}
function Ka(e, t) {
  return new Ho({ type: `catch`, innerType: e, catchValue: typeof t == `function` ? t : () => t });
}
function qa(e, t) {
  return new Uo({ type: `pipe`, in: e, out: t });
}
function Ja(e) {
  return new Wo({ type: `readonly`, innerType: e });
}
function Ya(e, t = {}) {
  return pi(Go, e, t);
}
function Xa(e, t) {
  return mi(e, t);
}
var Za,
  Qa,
  $a,
  eo,
  to,
  no,
  ro,
  io,
  ao,
  oo,
  so,
  co,
  lo,
  uo,
  fo,
  po,
  mo,
  ho,
  go,
  P,
  _o,
  vo,
  yo,
  bo,
  xo,
  So,
  Co,
  wo,
  To,
  Eo,
  Do,
  Oo,
  ko,
  Ao,
  jo,
  Mo,
  No,
  Po,
  Fo,
  Io,
  Lo,
  Ro,
  zo,
  Bo,
  Vo,
  Ho,
  Uo,
  Wo,
  Go,
  Ko = o(() => {
    (Yi(),
      Ji(),
      wi(),
      Xi(),
      aa(),
      xa(),
      (Za = new WeakMap()),
      (Qa = f(
        `ZodType`,
        (e, t) => (
          ln.init(e, t),
          Object.assign(e[`~standard`], {
            jsonSchema: { input: Ci(e, `input`), output: Ci(e, `output`) },
          }),
          (e.toJSONSchema = Si(e, {})),
          (e.def = t),
          (e.type = t.type),
          Object.defineProperty(e, "_def", { value: t }),
          (e.parse = (t, n) => la(e, t, n, { callee: e.parse })),
          (e.safeParse = (t, n) => da(e, t, n)),
          (e.parseAsync = async (t, n) => ua(e, t, n, { callee: e.parseAsync })),
          (e.safeParseAsync = async (t, n) => fa(e, t, n)),
          (e.spa = e.safeParseAsync),
          (e.encode = (t, n) => pa(e, t, n)),
          (e.decode = (t, n) => ma(e, t, n)),
          (e.encodeAsync = async (t, n) => ha(e, t, n)),
          (e.decodeAsync = async (t, n) => ga(e, t, n)),
          (e.safeEncode = (t, n) => _a(e, t, n)),
          (e.safeDecode = (t, n) => va(e, t, n)),
          (e.safeEncodeAsync = async (t, n) => ya(e, t, n)),
          (e.safeDecodeAsync = async (t, n) => ba(e, t, n)),
          Sa(e, `ZodType`, {
            check(...e) {
              let t = this.def;
              return this.clone(
                ne(t, {
                  checks: [
                    ...(t.checks ?? []),
                    ...e.map((e) =>
                      typeof e == `function`
                        ? { _zod: { check: e, def: { check: `custom` }, onattach: [] } }
                        : e,
                    ),
                  ],
                }),
                { parent: !0 },
              );
            },
            with(...e) {
              return this.check(...e);
            },
            clone(e, t) {
              return E(this, e, t);
            },
            brand() {
              return this;
            },
            register(e, t) {
              return (e.add(this, t), this);
            },
            refine(e, t) {
              return this.check(Ya(e, t));
            },
            superRefine(e, t) {
              return this.check(Xa(e, t));
            },
            overwrite(e) {
              return this.check(oi(e));
            },
            optional() {
              return Ba(this);
            },
            exactOptional() {
              return Va(this);
            },
            nullable() {
              return Ha(this);
            },
            nullish() {
              return Ba(Ha(this));
            },
            nonoptional(e) {
              return Ga(this, e);
            },
            array() {
              return Aa(this);
            },
            or(e) {
              return Na([this, e]);
            },
            and(e) {
              return Fa(this, e);
            },
            transform(e) {
              return qa(this, za(e));
            },
            default(e) {
              return Ua(this, e);
            },
            prefault(e) {
              return Wa(this, e);
            },
            catch(e) {
              return Ka(this, e);
            },
            pipe(e) {
              return qa(this, e);
            },
            readonly() {
              return Ja(this);
            },
            describe(e) {
              let t = this.clone();
              return (dr.add(t, { description: e }), t);
            },
            meta(...e) {
              if (e.length === 0) return dr.get(this);
              let t = this.clone();
              return (dr.add(t, e[0]), t);
            },
            isOptional() {
              return this.safeParse(void 0).success;
            },
            isNullable() {
              return this.safeParse(null).success;
            },
            apply(e) {
              return e(this);
            },
          }),
          Object.defineProperty(e, "description", {
            get() {
              return dr.get(e)?.description;
            },
            configurable: !0,
          }),
          e
        ),
      )),
      ($a = f(`_ZodString`, (e, t) => {
        (un.init(e, t), Qa.init(e, t), (e._zod.processJSONSchema = (t, n, r) => Ei(e, t, n, r)));
        let n = e._zod.bag;
        ((e.format = n.format ?? null),
          (e.minLength = n.minimum ?? null),
          (e.maxLength = n.maximum ?? null),
          Sa(e, `_ZodString`, {
            regex(...e) {
              return this.check(ei(...e));
            },
            includes(...e) {
              return this.check(ri(...e));
            },
            startsWith(...e) {
              return this.check(ii(...e));
            },
            endsWith(...e) {
              return this.check(ai(...e));
            },
            min(...e) {
              return this.check(Qr(...e));
            },
            max(...e) {
              return this.check(Zr(...e));
            },
            length(...e) {
              return this.check($r(...e));
            },
            nonempty(...e) {
              return this.check(Qr(1, ...e));
            },
            lowercase(e) {
              return this.check(ti(e));
            },
            uppercase(e) {
              return this.check(ni(e));
            },
            trim() {
              return this.check(ci());
            },
            normalize(...e) {
              return this.check(si(...e));
            },
            toLowerCase() {
              return this.check(li());
            },
            toUpperCase() {
              return this.check(ui());
            },
            slugify() {
              return this.check(di());
            },
          }));
      })),
      (eo = f(`ZodString`, (e, t) => {
        (un.init(e, t),
          $a.init(e, t),
          (e.email = (t) => e.check(mr(no, t))),
          (e.url = (t) => e.check(br(ao, t))),
          (e.jwt = (t) => e.check(Fr(bo, t))),
          (e.emoji = (t) => e.check(xr(oo, t))),
          (e.guid = (t) => e.check(hr(ro, t))),
          (e.uuid = (t) => e.check(gr(io, t))),
          (e.uuidv4 = (t) => e.check(_r(io, t))),
          (e.uuidv6 = (t) => e.check(vr(io, t))),
          (e.uuidv7 = (t) => e.check(yr(io, t))),
          (e.nanoid = (t) => e.check(Sr(so, t))),
          (e.guid = (t) => e.check(hr(ro, t))),
          (e.cuid = (t) => e.check(Cr(co, t))),
          (e.cuid2 = (t) => e.check(wr(lo, t))),
          (e.ulid = (t) => e.check(Tr(uo, t))),
          (e.base64 = (t) => e.check(Mr(_o, t))),
          (e.base64url = (t) => e.check(Nr(vo, t))),
          (e.xid = (t) => e.check(Er(fo, t))),
          (e.ksuid = (t) => e.check(Dr(po, t))),
          (e.ipv4 = (t) => e.check(Or(mo, t))),
          (e.ipv6 = (t) => e.check(kr(ho, t))),
          (e.cidrv4 = (t) => e.check(Ar(go, t))),
          (e.cidrv6 = (t) => e.check(jr(P, t))),
          (e.e164 = (t) => e.check(Pr(yo, t))),
          (e.datetime = (t) => e.check(Zi(t))),
          (e.date = (t) => e.check(Qi(t))),
          (e.time = (t) => e.check($i(t))),
          (e.duration = (t) => e.check(ea(t))));
      })),
      (to = f(`ZodStringFormat`, (e, t) => {
        (dn.init(e, t), $a.init(e, t));
      })),
      (no = f(`ZodEmail`, (e, t) => {
        (mn.init(e, t), to.init(e, t));
      })),
      (ro = f(`ZodGUID`, (e, t) => {
        (fn.init(e, t), to.init(e, t));
      })),
      (io = f(`ZodUUID`, (e, t) => {
        (pn.init(e, t), to.init(e, t));
      })),
      (ao = f(`ZodURL`, (e, t) => {
        (hn.init(e, t), to.init(e, t));
      })),
      (oo = f(`ZodEmoji`, (e, t) => {
        (gn.init(e, t), to.init(e, t));
      })),
      (so = f(`ZodNanoID`, (e, t) => {
        (_n.init(e, t), to.init(e, t));
      })),
      (co = f(`ZodCUID`, (e, t) => {
        (vn.init(e, t), to.init(e, t));
      })),
      (lo = f(`ZodCUID2`, (e, t) => {
        (yn.init(e, t), to.init(e, t));
      })),
      (uo = f(`ZodULID`, (e, t) => {
        (bn.init(e, t), to.init(e, t));
      })),
      (fo = f(`ZodXID`, (e, t) => {
        (xn.init(e, t), to.init(e, t));
      })),
      (po = f(`ZodKSUID`, (e, t) => {
        (Sn.init(e, t), to.init(e, t));
      })),
      (mo = f(`ZodIPv4`, (e, t) => {
        (Dn.init(e, t), to.init(e, t));
      })),
      (ho = f(`ZodIPv6`, (e, t) => {
        (On.init(e, t), to.init(e, t));
      })),
      (go = f(`ZodCIDRv4`, (e, t) => {
        (kn.init(e, t), to.init(e, t));
      })),
      (P = f(`ZodCIDRv6`, (e, t) => {
        (An.init(e, t), to.init(e, t));
      })),
      (_o = f(`ZodBase64`, (e, t) => {
        (jn.init(e, t), to.init(e, t));
      })),
      (vo = f(`ZodBase64URL`, (e, t) => {
        (Mn.init(e, t), to.init(e, t));
      })),
      (yo = f(`ZodE164`, (e, t) => {
        (Nn.init(e, t), to.init(e, t));
      })),
      (bo = f(`ZodJWT`, (e, t) => {
        (Pn.init(e, t), to.init(e, t));
      })),
      (xo = f(`ZodNumber`, (e, t) => {
        (Fn.init(e, t),
          Qa.init(e, t),
          (e._zod.processJSONSchema = (t, n, r) => Di(e, t, n, r)),
          Sa(e, `ZodNumber`, {
            gt(e, t) {
              return this.check(Jr(e, t));
            },
            gte(e, t) {
              return this.check(Yr(e, t));
            },
            min(e, t) {
              return this.check(Yr(e, t));
            },
            lt(e, t) {
              return this.check(Kr(e, t));
            },
            lte(e, t) {
              return this.check(qr(e, t));
            },
            max(e, t) {
              return this.check(qr(e, t));
            },
            int(e) {
              return this.check(Ta(e));
            },
            safe(e) {
              return this.check(Ta(e));
            },
            positive(e) {
              return this.check(Jr(0, e));
            },
            nonnegative(e) {
              return this.check(Yr(0, e));
            },
            negative(e) {
              return this.check(Kr(0, e));
            },
            nonpositive(e) {
              return this.check(qr(0, e));
            },
            multipleOf(e, t) {
              return this.check(Xr(e, t));
            },
            step(e, t) {
              return this.check(Xr(e, t));
            },
            finite() {
              return this;
            },
          }));
        let n = e._zod.bag;
        ((e.minValue = Math.max(n.minimum ?? -1 / 0, n.exclusiveMinimum ?? -1 / 0) ?? null),
          (e.maxValue = Math.min(n.maximum ?? 1 / 0, n.exclusiveMaximum ?? 1 / 0) ?? null),
          (e.isInt = (n.format ?? ``).includes(`int`) || Number.isSafeInteger(n.multipleOf ?? 0.5)),
          (e.isFinite = !0),
          (e.format = n.format ?? null));
      })),
      (So = f(`ZodNumberFormat`, (e, t) => {
        (In.init(e, t), xo.init(e, t));
      })),
      (Co = f(`ZodBoolean`, (e, t) => {
        (Ln.init(e, t), Qa.init(e, t), (e._zod.processJSONSchema = (t, n, r) => Oi(e, t, n, r)));
      })),
      (wo = f(`ZodNull`, (e, t) => {
        (Rn.init(e, t), Qa.init(e, t), (e._zod.processJSONSchema = (t, n, r) => ki(e, t, n, r)));
      })),
      (To = f(`ZodUnknown`, (e, t) => {
        (zn.init(e, t), Qa.init(e, t), (e._zod.processJSONSchema = (t, n, r) => ji(e, t, n, r)));
      })),
      (Eo = f(`ZodNever`, (e, t) => {
        (Bn.init(e, t), Qa.init(e, t), (e._zod.processJSONSchema = (t, n, r) => Ai(e, t, n, r)));
      })),
      (Do = f(`ZodArray`, (e, t) => {
        (Vn.init(e, t),
          Qa.init(e, t),
          (e._zod.processJSONSchema = (t, n, r) => Ii(e, t, n, r)),
          (e.element = t.element),
          Sa(e, `ZodArray`, {
            min(e, t) {
              return this.check(Qr(e, t));
            },
            nonempty(e) {
              return this.check(Qr(1, e));
            },
            max(e, t) {
              return this.check(Zr(e, t));
            },
            length(e, t) {
              return this.check($r(e, t));
            },
            unwrap() {
              return this.element;
            },
          }));
      })),
      (Oo = f(`ZodObject`, (e, t) => {
        (Un.init(e, t),
          Qa.init(e, t),
          (e._zod.processJSONSchema = (t, n, r) => Li(e, t, n, r)),
          w(e, `shape`, () => t.shape),
          Sa(e, `ZodObject`, {
            keyof() {
              return La(Object.keys(this._zod.def.shape));
            },
            catchall(e) {
              return this.clone({ ...this._zod.def, catchall: e });
            },
            passthrough() {
              return this.clone({ ...this._zod.def, catchall: Oa() });
            },
            loose() {
              return this.clone({ ...this._zod.def, catchall: Oa() });
            },
            strict() {
              return this.clone({ ...this._zod.def, catchall: ka() });
            },
            strip() {
              return this.clone({ ...this._zod.def, catchall: void 0 });
            },
            extend(e) {
              return de(this, e);
            },
            safeExtend(e) {
              return O(this, e);
            },
            merge(e) {
              return fe(this, e);
            },
            pick(e) {
              return le(this, e);
            },
            omit(e) {
              return ue(this, e);
            },
            partial(...e) {
              return pe(Io, this, e[0]);
            },
            required(...e) {
              return me(Vo, this, e[0]);
            },
          }));
      })),
      (ko = f(`ZodUnion`, (e, t) => {
        (Wn.init(e, t),
          Qa.init(e, t),
          (e._zod.processJSONSchema = (t, n, r) => N(e, t, n, r)),
          (e.options = t.options));
      })),
      (Ao = f(`ZodDiscriminatedUnion`, (e, t) => {
        (ko.init(e, t), Gn.init(e, t));
      })),
      (jo = f(`ZodIntersection`, (e, t) => {
        (Kn.init(e, t), Qa.init(e, t), (e._zod.processJSONSchema = (t, n, r) => Ri(e, t, n, r)));
      })),
      (Mo = f(`ZodRecord`, (e, t) => {
        (qn.init(e, t),
          Qa.init(e, t),
          (e._zod.processJSONSchema = (t, n, r) => zi(e, t, n, r)),
          (e.keyType = t.keyType),
          (e.valueType = t.valueType));
      })),
      (No = f(`ZodEnum`, (e, t) => {
        (Jn.init(e, t),
          Qa.init(e, t),
          (e._zod.processJSONSchema = (t, n, r) => Mi(e, t, n, r)),
          (e.enum = t.entries),
          (e.options = Object.values(t.entries)));
        let n = new Set(Object.keys(t.entries));
        ((e.extract = (e, r) => {
          let i = {};
          for (let r of e)
            if (n.has(r)) i[r] = t.entries[r];
            else throw Error(`Key ${r} not found in enum`);
          return new No({ ...t, checks: [], ...D(r), entries: i });
        }),
          (e.exclude = (e, r) => {
            let i = { ...t.entries };
            for (let t of e)
              if (n.has(t)) delete i[t];
              else throw Error(`Key ${t} not found in enum`);
            return new No({ ...t, checks: [], ...D(r), entries: i });
          }));
      })),
      (Po = f(`ZodLiteral`, (e, t) => {
        (Yn.init(e, t),
          Qa.init(e, t),
          (e._zod.processJSONSchema = (t, n, r) => Ni(e, t, n, r)),
          (e.values = new Set(t.values)),
          Object.defineProperty(e, "value", {
            get() {
              if (t.values.length > 1)
                throw Error(
                  "This schema contains multiple valid literal values. Use `.values` instead.",
                );
              return t.values[0];
            },
          }));
      })),
      (Fo = f(`ZodTransform`, (e, t) => {
        (Xn.init(e, t),
          Qa.init(e, t),
          (e._zod.processJSONSchema = (t, n, r) => Fi(e, t, n, r)),
          (e._zod.parse = (n, r) => {
            if (r.direction === `backward`) throw new g(e.constructor.name);
            n.addIssue = (r) => {
              if (typeof r == `string`) n.issues.push(xe(r, n.value, t));
              else {
                let t = r;
                (t.fatal && (t.continue = !1),
                  (t.code ??= `custom`),
                  (t.input ??= n.value),
                  (t.inst ??= e),
                  n.issues.push(xe(t)));
              }
            };
            let i = t.transform(n.value, n);
            return i instanceof Promise
              ? i.then((e) => ((n.value = e), (n.fallback = !0), n))
              : ((n.value = i), (n.fallback = !0), n);
          }));
      })),
      (Io = f(`ZodOptional`, (e, t) => {
        (Zn.init(e, t),
          Qa.init(e, t),
          (e._zod.processJSONSchema = (t, n, r) => qi(e, t, n, r)),
          (e.unwrap = () => e._zod.def.innerType));
      })),
      (Lo = f(`ZodExactOptional`, (e, t) => {
        (Qn.init(e, t),
          Qa.init(e, t),
          (e._zod.processJSONSchema = (t, n, r) => qi(e, t, n, r)),
          (e.unwrap = () => e._zod.def.innerType));
      })),
      (Ro = f(`ZodNullable`, (e, t) => {
        ($n.init(e, t),
          Qa.init(e, t),
          (e._zod.processJSONSchema = (t, n, r) => Bi(e, t, n, r)),
          (e.unwrap = () => e._zod.def.innerType));
      })),
      (zo = f(`ZodDefault`, (e, t) => {
        (er.init(e, t),
          Qa.init(e, t),
          (e._zod.processJSONSchema = (t, n, r) => Hi(e, t, n, r)),
          (e.unwrap = () => e._zod.def.innerType),
          (e.removeDefault = e.unwrap));
      })),
      (Bo = f(`ZodPrefault`, (e, t) => {
        (tr.init(e, t),
          Qa.init(e, t),
          (e._zod.processJSONSchema = (t, n, r) => Ui(e, t, n, r)),
          (e.unwrap = () => e._zod.def.innerType));
      })),
      (Vo = f(`ZodNonOptional`, (e, t) => {
        (nr.init(e, t),
          Qa.init(e, t),
          (e._zod.processJSONSchema = (t, n, r) => Vi(e, t, n, r)),
          (e.unwrap = () => e._zod.def.innerType));
      })),
      (Ho = f(`ZodCatch`, (e, t) => {
        (rr.init(e, t),
          Qa.init(e, t),
          (e._zod.processJSONSchema = (t, n, r) => Wi(e, t, n, r)),
          (e.unwrap = () => e._zod.def.innerType),
          (e.removeCatch = e.unwrap));
      })),
      (Uo = f(`ZodPipe`, (e, t) => {
        (ir.init(e, t),
          Qa.init(e, t),
          (e._zod.processJSONSchema = (t, n, r) => Gi(e, t, n, r)),
          (e.in = t.in),
          (e.out = t.out));
      })),
      (Wo = f(`ZodReadonly`, (e, t) => {
        (ar.init(e, t),
          Qa.init(e, t),
          (e._zod.processJSONSchema = (t, n, r) => Ki(e, t, n, r)),
          (e.unwrap = () => e._zod.def.innerType));
      })),
      (Go = f(`ZodCustom`, (e, t) => {
        (or.init(e, t), Qa.init(e, t), (e._zod.processJSONSchema = (t, n, r) => Pi(e, t, n, r)));
      })));
  }),
  qo = o(() => {
    Yi();
  }),
  Jo = o(() => {
    (Yi(), Ko(), Xi(), ca(), xa(), qo(), Ji(), fr(), Xi(), aa(), Ko(), k());
  }),
  Yo = o(() => {
    (Jo(), Jo());
  });
function Xo(e) { return annotationSerialization.normalizeName(e); }
function Zo(e) { return annotationSerialization.sanitizeMetadata(e); }
function Qo(e) { return annotationSerialization.parseMetadata(e); }
function $o(e) { return annotationSerialization.withinLimit(e); }
var annotationSerialization;
var es,
  ts,
  ns,
  rs,
  is,
  as,
  os = o(() => {
    (Yo(),
      (es = { maxSerializedBytes: 2048, maxKeys: 6, maxKeyLength: 64, maxStringValueLength: 256 }),
      (ts = Ca().regex(/^[^\p{Cc}\p{Cf}\p{Cs}\u2028\u2029]*$/u)),
      (ns = Ca()
        .max(es.maxKeyLength)
        .regex(/^[A-Za-z][A-Za-z0-9_-]*(?: [A-Za-z0-9_-]+)*$/)
        .refine((e) => e !== `__proto__` && e !== `constructor` && e !== `prototype`)),
      (rs = Na([ts.max(es.maxStringValueLength), wa(), Ea(), Da()])),
      (is = Ia(ns, rs)),
      (as = ts.max(128).refine((e) => e.trim().length > 0)));
  });
function ss(e) {
  return hasAnnotationComments(e);
}
function cs(e) {
  return getAnnotationCommentCount(e);
}
function ls(e, t) {
  return annotationDesignStyles.collectAnnotationStyleDeclarations(e, t);
}
function us(e, t) {
  return annotationDesignStyles.mergeAnnotationStyleDeclarations(e, t);
}
function ds(e) {
  return annotationDesignStyles.readAnnotationDirectText(e);
}
function fs(e) {
  return annotationDesignStyles.createAnnotationTextDraft(e);
}
function ps(e) {
  return annotationDesignStyles.projectAnnotationStyleProvenance(e);
}
function ms(e, t) {
  return annotationDesignStyles.isAnnotationInteractionTargetMatch(e, t);
}
function hs(e) {
  return parseGoogleDocsUrlHelper(e);
}
function gs(e) {
  return isGoogleDocsOrSheetsUrlHelper(e);
}
function _s(e) {
  return parseGoogleSheetsIdHelper(e);
}
function vs({ documentTitle: e, pageUrl: t, selectedText: n, visibleText: r }) {
  return createGoogleDocsContextHelper({ documentTitle: e, pageUrl: t, selectedText: n, visibleText: r });
}
function ys(e) {
  return readTabIdHelper(e);
}
function bs(e) {
  return normalizeGoogleDocsText(e);
}
function xs(e) {
  return getAnnotationInverseViewportScale(e);
}
function Ss(e, { viewport: t, viewportScale: n, zoomFactor: r = 1 }) {
  return projectAnnotationTooltipPosition(e, { viewport: t, viewportScale: n, zoomFactor: r });
/*
  let i = xs(n),
    a = Ms(e, r),
    o = t.width * r,
    s = t.height * r,
    c = 16 * i,
    l = Ws * i,
    u = Math.min(Us * i, o - c * 2),
    d = Ps(a.x, c, o - u - c),
    f = a.y - l - Gs * i,
    p = a.y + a.height + Gs * i;
  return { x: d, y: f >= c ? f : Ps(p, c, s - l - c), width: u, height: l };
*/
}
function Cs(e, t = Js) {
  return annotationDesignStyles.buildAnnotationDesignStyles(e, t);
}
function ws(e) {
  return normalizeAnnotationColorPolicy(e);
}
function Ts(e, t) {
  return spreadAnnotationMarkerPoints(e, t, Ks, qs);
}
function Es(e, t) {
  return annotationDesignStyles.buildAnnotationDesignStyleRule(e, t);
}
function Ds(e) {
  return annotationDesignStyles.escapeAnnotationDesignSelector(e);
}
/* migrated color parser */
/* function Os(e) {
  let t = e.match(/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i)?.[1];
  return t == null
    ? null
    : t.length === 3 || t.length === 4
      ? `#${Array.from(t)
          .map((e) => e + e)
          .join(``)
          .toUpperCase()}`
      : `#${t.toUpperCase()}`;
}
function ks(e) {
  let t = e.match(/^rgba?\((.*)\)$/i)?.[1];
  if (t == null) return null;
  let [n, r] = t.split(`/`).map((e) => e.trim()),
    i = n.includes(`,`) ? n.split(`,`).map((e) => e.trim()) : n.split(/\s+/),
    a = r ?? i[3],
    o = Number.parseFloat(i[0] ?? ``),
    s = Number.parseFloat(i[1] ?? ``),
    c = Number.parseFloat(i[2] ?? ``);
  return [o, s, c].some(Number.isNaN)
    ? null
    : { alpha: a == null ? null : As(a), blue: c, green: s, red: o };
}
function As(e) {
  return e.endsWith(`%`) ? (Number.parseFloat(e) / 100) * 255 : Number.parseFloat(e) * 255;
}
function js(e) {
  return Math.round(Ps(e, 0, 255))
    .toString(16)
    .padStart(2, `0`)
    .toUpperCase();
} */
function Ms(e, t) {
  return scaleAnnotationRect(e, t);
}
function Ns(e, t) {
  return areAnnotationScrollContainersEqual(e, t);
}
function Ps(e, t, n) {
  return clampAnnotationCoordinate(e, t, n);
}
function Fs(e, t) {
  return areAnnotationAnchorsEqual(e, t);
/*
  if (
    e.kind !== t.kind ||
    !(
      e.pageUrl === t.pageUrl &&
      e.title === t.title &&
      e.elementPath === t.elementPath &&
      e.frameUrl === t.frameUrl &&
      e.framePath.length === t.framePath.length &&
      e.framePath.every((e, n) => e === t.framePath[n]) &&
      Ns(e.scrollContainers, t.scrollContainers) &&
      e.isFixed === t.isFixed &&
      e.point.xPercent === t.point.xPercent &&
      e.point.y === t.point.y &&
      e.rect.x === t.rect.x &&
      e.rect.y === t.rect.y &&
      e.rect.width === t.rect.width &&
      e.rect.height === t.rect.height &&
      e.role === t.role &&
      e.name === t.name &&
      e.selector === t.selector &&
      e.nearbyText === t.nearbyText
    )
  )
    return !1;
  switch (e.kind) {
    case `virtual`:
      return t.kind === `virtual` && e.surfaceId === t.surfaceId && e.targetId === t.targetId;
    case `element`:
      return t.kind === `element` && e.runtimeElementId === t.runtimeElementId;
    case `region`:
      return !0;
    case `text`:
      return (
        t.kind === `text` &&
        e.selectedText === t.selectedText &&
        e.textLocator.kind === t.textLocator.kind &&
        e.textLocator.direction === t.textLocator.direction &&
        (e.textLocator.kind === `form-control` ||
          (t.textLocator.kind === `dom` && e.textLocator.rangeText === t.textLocator.rangeText)) &&
        e.textLocator.selector === t.textLocator.selector &&
        e.textLocator.shadowHosts.length === t.textLocator.shadowHosts.length &&
        e.textLocator.shadowHosts.every((e, n) => e === t.textLocator.shadowHosts[n]) &&
        e.textLocator.startOffset === t.textLocator.startOffset &&
        e.textLocator.endOffset === t.textLocator.endOffset &&
        e.selectionRects.length === t.selectionRects.length &&
        e.selectionRects.every((e, n) => {
          let r = t.selectionRects[n];
          return (
            r != null && e.x === r.x && e.y === r.y && e.width === r.width && e.height === r.height
          );
        })
      );
  }
*/
}
var zs,
  Bs,
  Vs,
  Hs,
  Us,
  Ws,
  Gs,
  Ks,
  qs,
  Js,
  Ys,
  Xs,
  Zs,
  Qs,
  $s = o(() => {
    (Yo(),
      os(),
      (zs = Ca().max(240)),
      (Bs = { BATCH: `batch`, QUICK: `quick` }),
      Bs.BATCH,
      Bs.QUICK,
      (Vs = 3),
      (Hs = 2e4),
      (Us = 240),
      (Ws = 72),
      (Gs = 8),
      (Ks = 25),
      (qs = Ks / 2),
      (Js = `data-codex-browser-design-group`),
      (Ys = `
  .element-metadata-tooltip {
    position: fixed;
    z-index: 2;
    display: grid;
    grid-template-columns: minmax(56px, auto) minmax(0, 1fr);
    align-items: baseline;
    gap: var(--browser-sidebar-metadata-row-gap) var(--browser-sidebar-metadata-column-gap);
    height: var(--browser-sidebar-metadata-height);
    border-radius: var(--browser-sidebar-metadata-radius);
    outline: 1px solid rgba(15, 23, 42, 0.08);
    outline-offset: 0;
    background: white;
    color: rgb(15, 23, 42);
    padding: var(--browser-sidebar-metadata-padding-y) var(--browser-sidebar-metadata-padding-x);
    box-sizing: border-box;
    font-size: var(--browser-sidebar-overlay-font-size);
    line-height: 1.25;
    box-shadow: 0px 2px 4px -1px rgba(0, 0, 0, 0.08);
    pointer-events: none;
  }

  .element-metadata-cell {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .element-metadata-tag {
    color: rgb(28, 28, 28);
  }

  .element-metadata-label {
    color: rgb(125, 125, 125);
    text-transform: lowercase;
  }

  .element-metadata-value {
    color: rgb(15, 23, 42);
    text-align: right;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
  }

  @media (prefers-color-scheme: dark) {
    .element-metadata-tooltip {
      border-color: rgba(255, 255, 255, 0.04);
      background: rgba(15, 23, 42, 0.95);
      color: white;
    }

    .element-metadata-tag,
    .element-metadata-value {
      color: white;
    }

    .element-metadata-label {
      color: rgba(226, 232, 240, 0.62);
    }
  }
`),
      (Xs = { height: 25, hotspot: { x: 4.0791, y: 22.8209 }, width: 26 }),
      (Zs = Xs.width),
      (Qs = { defaultLocale: `en-US`, locale: `en-US`, messages: {} }));
  });
function ec(e) {
  return e == null ? null : projectAnnotationFramePath(e, {
    rootWindow: window,
    getFrameElement: (windowLike) => windowLike.frameElement,
    isIframe: (value) => ac(value),
    getSelector: (element) => Rc(element),
    getOwnerWindow: (element) => element.ownerDocument.defaultView,
  });
}
function rc(e) {
  return isAnnotationDocumentRoot(e, document);
}
function F(e) {
  return isAnnotationElementLike(e, {
    getOwnerWindow: (value) => value.ownerDocument?.defaultView,
    getFallbackHTMLElement: () => (typeof HTMLElement > `u` ? null : HTMLElement),
    getFallbackNode: () => (typeof Node > `u` ? null : Node),
    getElementNodeType: () => Node.ELEMENT_NODE,
  });
}
function ic(e) {
  return getAnnotationComposedParent(e, {
    getAssignedSlot: (value) => value.assignedSlot,
    getParentElement: (value) => value.parentElement,
    getRootNode: (value) => value.getRootNode(),
    isShadowRoot: (value) => Uc(value),
  });
}
function ac(e) {
  return isAnnotationIframeElement(e, {
    getOwnerWindow: (value) => value.ownerDocument?.defaultView,
    getFallbackIframe: () => (typeof HTMLIFrameElement > `u` ? null : HTMLIFrameElement),
  });
}
function oc(e) {
  return readAnnotationDocumentSafely(e);
}
function sc(e) {
  return resolveAnnotationIframeWindow(e, { isIframe: (value) => ac(value) });
}
function cc(e, t, n) {
  let r = lc(window, e, t, n);
  return r === el ? null : r;
}
function lc(e, t, n, r) {
  let i = e.document.elementFromPoint(t, n);
  if (i == null) return null;
  for (; i.shadowRoot != null;) {
    let e = i.shadowRoot.elementFromPoint(t, n);
    if (!F(e) || e === i) break;
    i = e;
  }
  if (ac(i)) {
    let e = r?.(i, { x: t, y: n });
    if (e !== void 0) return e ?? el;
    let a = sc(i);
    if (a != null) {
      let e = i.getBoundingClientRect(),
        o = lc(a, t - e.left, n - e.top, r);
      if (o != null) return o;
    }
  }
  return i;
}
function uc(e = window) {
  let t = [],
    n = [e],
    r = new Set();
  for (; n.length > 0;) {
    let e = n.pop();
    if (e == null || r.has(e)) continue;
    (r.add(e), t.push(e));
    let i = oc(e);
    if (i != null)
      for (let e of zc(i)) {
        let t = sc(e);
        t != null && n.push(t);
      }
  }
  return t;
}
function dc(e) {
  let t = new Map(),
    n = () => {
      let e = uc(),
        i = new Set(e);
      for (let i of e) {
        let e = oc(i);
        if (e == null) continue;
        let a = t.get(i),
          o = e.documentElement;
        (a?.document !== e || a.documentElement !== o) &&
          (Hc(a?.cleanup), t.set(i, { cleanup: r(e, i, n), document: e, documentElement: o }));
      }
      for (let [e, n] of t) i.has(e) || (Hc(n.cleanup), t.delete(e));
    },
    r = (t, n, r) => {
      let i = e(t, n, r),
        a = (e) => {
          ac(e.target) && r();
        };
      t.addEventListener(`load`, a, !0);
      let o = new MutationObserver(r);
      return (
        o.observe(t, { childList: !0 }),
        () => {
          o.disconnect();
          try {
            t.removeEventListener(`load`, a, !0);
          } catch {}
          Hc(i);
        }
      );
    };
  return (
    n(),
    () => {
      for (let { cleanup: e } of t.values()) Hc(e);
      t.clear();
    }
  );
}
function fc(e, t, n = !1, r) {
  n ? r != null && Bc(r) : Vc(e);
  let i = `html, body, body *, #${t}, #${t} *`,
    a = e.querySelector(`style[${Qc}]`),
    o = `${i} { cursor: none !important;${n ? `` : ` -webkit-user-select: none !important; user-select: none !important;`} }`;
  if (a != null) {
    let t = a.sheet?.cssRules,
      r = t?.item(0),
      s = e.defaultView?.CSSStyleRule;
    return (
      (a.textContent !== o ||
        t?.length !== 1 ||
        s == null ||
        !(r instanceof s) ||
        r.selectorText !== i ||
        r.style.length !== (n ? 1 : 2) ||
        r.style.getPropertyValue(`cursor`) !== `none` ||
        r.style.getPropertyPriority(`cursor`) !== `important` ||
        r.style.getPropertyValue(`user-select`) !== (n ? `` : `none`) ||
        r.style.getPropertyPriority(`user-select`) !== (n ? `` : `important`)) &&
        (a.textContent = o),
      a
    );
  }
  let s = e.createElement(`style`);
  return (
    s.setAttribute(Qc, `true`),
    (s.textContent = o),
    (e.head ?? e.documentElement).append(s),
    s
  );
}
function pc(e) {
  (Vc(e),
    e.querySelectorAll(`style[${Qc}]`).forEach((e) => {
      e.remove();
    }));
}
function mc() {
  for (let e of uc()) {
    let t = oc(e);
    t != null && pc(t);
  }
}
function hc(e, t, n) {
  let r = new MutationObserver((i) => {
    r.disconnect();
    try {
      let r = i.some((t) => Array.from(t.removedNodes).some((t) => t.contains(e))),
        a = document.documentElement,
        o = e.parentElement !== a;
      if ((o && a.appendChild(e), r || o)) {
        gc(e, n);
        let r = e.shadowRoot?.querySelector(`[data-browser-comment-annotation-selection-cursor]`);
        r != null && fc(document, t, r.hasAttribute(`data-browser-comment-native-text-selection`));
      }
    } finally {
      (r.observe(document, { childList: !0 }),
        r.observe(document.documentElement, { childList: !0 }));
    }
  });
  return (
    r.observe(document, { childList: !0 }),
    r.observe(document.documentElement, { childList: !0 }),
    () => r.disconnect()
  );
}
function gc(e, t) {
  let n = e.shadowRoot?.querySelector(`[${t}]`);
  return n != null && _c(n, !0);
}
function _c(e, t) {
  if (!e.isConnected || typeof e.showPopover != `function`) return !1;
  try {
    if (t && e.matches(`:popover-open`)) {
      if (typeof e.hidePopover != `function`) return !1;
      e.hidePopover();
    }
    return (e.matches(`:popover-open`) || e.showPopover(), e.matches(`:popover-open`));
  } catch {
    return !1;
  }
}
function vc(e) {
  if (typeof e.hidePopover == `function`)
    try {
      e.matches(`:popover-open`) && e.hidePopover();
    } catch {}
}
function yc(e) {
  return projectAnnotationAccessibleLabel(e, (element) => element.getAttribute(`aria-label`), bc);
}
function bc(e) {
  return projectAnnotationElementLabel(e, rc);
}
function xc(e) {
  return projectAnnotationNearbyText(e, bc, (element) => element.closest(`section,article,main,form,nav,aside,header,footer`), F);
}
function Sc(e) {
  return projectAnnotationElementPath(e, ic);
}
function Cc(e) {
  return ec(e.ownerDocument.defaultView);
}
function wc(e) {
  let t = window,
    n = document;
  for (let r of e) {
    let e = Tc(n, r);
    if (e == null) return null;
    let i = sc(e);
    if (i == null) return null;
    ((t = i), (n = i.document));
  }
  return t;
}
function Tc(e, t) {
  return resolveAnnotationFrameElement(e, t, {
    querySelector: (documentLike, selector) => Ec(documentLike, selector),
    isIframe: (value) => ac(value),
  });
}
function Ec(e, t) {
  let n = t.startsWith(Xc) ? t.slice(7).split(Zc) : [t],
    r = e;
  for (let [e, t] of n.entries()) {
    let i = r.querySelector(t);
    if (e === n.length - 1) return F(i) ? i : null;
    if (!F(i) || i.shadowRoot == null) return null;
    r = i.shadowRoot;
  }
  return null;
}
function Dc(e) {
  return resolveAnnotationFrameDocument(e, { resolveWindow: (framePath) => wc(framePath) });
}
function Oc(e, { requireUnique: t = !1 } = {}) {
  let n = [],
    r = e,
    i = 0;
  for (; r != null && (t || i < 4);) {
    let a = r.tagName.toLowerCase(),
      o = r.tagName;
    if (r.id) {
      a += `#${qc(r.id)}`;
      let i = [a, ...n].join(` > `);
      if (!t || Wc(e, i)) return i;
    }
    let s = Array.from(r.classList)
      .filter((e) => /^[a-zA-Z0-9_-]+$/.test(e))
      .slice(0, 2);
    s.length > 0 && (a += `.${s.map(qc).join(`.`)}`);
    let c = r.parentElement;
    if (c != null) {
      let e = Array.from(c.children).filter((e) => F(e) && e.tagName === o);
      e.length > 1 && (a += `:nth-of-type(${e.indexOf(r) + 1})`);
    }
    n.unshift(a);
    let l = n.join(` > `);
    if (t && Wc(e, l)) return l;
    ((r = c), (i += 1));
  }
  return t || n.length === 0 ? null : n.join(` > `);
}
function kc(e, { requireUnique: t = !0 } = {}) {
  let n = [],
    r = e;
  for (;;) {
    let e = Oc(r, { requireUnique: t });
    if (e == null) return null;
    n.unshift(e);
    let i = r.getRootNode();
    if (i.nodeType === Node.DOCUMENT_NODE) break;
    if (!Uc(i)) return null;
    r = i.host;
  }
  return n.length === 1 ? n[0] : `${Xc}${n.join(Zc)}`;
}
function Ac(e) {
  return isAnnotationElementFixedOrSticky(e, {
    getOwnerWindow: (element) => element.ownerDocument.defaultView,
    currentWindow: window,
    getDocumentBody: (_element, ownerWindow) => ownerWindow.document.body,
    getParent: (element) => ic(element),
    getPosition: (element) => Fc(element).getComputedStyle(element).position,
  });
}
function jc(e, t) {
  if (typeof e.document.elementFromPoint != `function`) return [];
  let n = e.document.elementFromPoint(t.x, t.y);
  return F(n) ? Mc(n, { includeElement: !0 }) : [];
}
function Mc(e, { includeElement: t = !1 } = {}) {
  let n = Fc(e),
    r = [],
    i = t ? e : ic(e);
  for (; i != null && i !== n.document.body && i !== n.document.documentElement;) {
    if (Kc(i, n)) {
      let e = kc(i);
      e != null && r.push({ selector: e, scrollLeft: i.scrollLeft, scrollTop: i.scrollTop });
    }
    i = ic(i);
  }
  return r;
}
function Nc(e, t) {
  return getAnnotationScrollContainerOffset(e, t.document, {
    resolveSelector: (documentLike, selector) => Ec(documentLike, selector),
    isElement: (value) => F(value),
    getScrollLeft: (element) => element.scrollLeft,
    getScrollTop: (element) => element.scrollTop,
  });
}
function Pc(e, t, n) {
  let r = new Set();
  for (let n of t)
    if (n.scrollContainers != null && wc(n.framePath) === e)
      for (let t of n.scrollContainers) {
        let n = Ec(e.document, t.selector);
        n != null && r.add(n);
      }
  for (let e of r) e.addEventListener(`scroll`, n);
  return () => {
    for (let e of r) e.removeEventListener(`scroll`, n);
  };
}
function Fc(e) {
  return e.ownerDocument.defaultView ?? window;
}
function Ic(e) {
  return getAnnotationFrameOffset(e, {
    currentWindow: window,
    getFrameElement: (windowLike) => windowLike.frameElement,
    isFrameElement: (value) => ac(value),
    getParentWindow: (frameElement) => frameElement.ownerDocument.defaultView,
    getRect: (frameElement) => frameElement.getBoundingClientRect(),
    getParentOffset: (windowLike) => Ic(windowLike),
  });
}
function Lc(e, t) {
  return projectAnnotationFramePoint(t, Ic(e));
}
function Rc(e) {
  return kc(e);
}
function zc(e) {
  let t = [];
  for (let n of e.querySelectorAll(`*`))
    (ac(n) && t.push(n), F(n) && n.shadowRoot != null && t.push(...zc(n.shadowRoot)));
  return t;
}
function Bc(e) {
  let t = e.ownerDocument;
  $c.get(t)?.element !== e && Vc(t);
  let n = e.style.getPropertyValue(`cursor`),
    r = e.style.getPropertyPriority(`cursor`);
  (n !== `none` || r !== `important`) &&
    ($c.set(t, { element: e, cursor: n, priority: r }),
    e.style.setProperty(`cursor`, `none`, `important`));
}
function Vc(e) {
  let t = $c.get(e);
  t != null &&
    ($c.delete(e),
    t.element.style.getPropertyValue(`cursor`) === `none` &&
      t.element.style.getPropertyPriority(`cursor`) === `important` &&
      t.element.style.setProperty(`cursor`, t.cursor, t.priority));
}
function Hc(e) {
  if (e != null)
    try {
      e();
    } catch {}
}
function Uc(e) {
  return isAnnotationShadowRoot(e, {
    documentFragmentNodeType: Node.DOCUMENT_FRAGMENT_NODE,
    isElement: (value) => F(value),
  });
}
function Wc(e, t) {
  return isAnnotationUniqueSelectorMatch(e, t, {
    getRootNode: (element) => element.getRootNode(),
    isQueryableRoot: (root) => Gc(root),
    queryAll: (root, selector) => Array.from(root.querySelectorAll(selector)),
  });
}
function Gc(e) {
  return isAnnotationQueryableRoot(e, { documentNodeType: Node.DOCUMENT_NODE, fragmentNodeType: Node.DOCUMENT_FRAGMENT_NODE });
}
function Kc(e, t) {
  return isAnnotationClippingBoundary(e, {
    getStyle: (element) => t.getComputedStyle(element),
    isClippingOverflow: (value) => nc(value),
  });
}
function qc(e) {
  return escapeAnnotationSelectorToken(e, typeof CSS < `u` && typeof CSS.escape == `function` ? CSS.escape.bind(CSS) : undefined);
}
function Jc(e, { preventDefault: t = !0 } = {}) {
  stopAnnotationEventPropagation(e, { preventDefault: t });
}
var Yc,
  Xc,
  Zc,
  Qc,
  $c,
  el,
  tl = o(() => {
    ((Yc = {
      attributeFilter: [
        `aria-hidden`,
        `aria-expanded`,
        `class`,
        `data-state`,
        `hidden`,
        `inert`,
        `open`,
        `popover`,
        `style`,
      ],
      attributes: !0,
      childList: !0,
      subtree: !0,
    }),
      (Xc = `shadow:`),
      (Zc = `>>>`),
      (Qc = `data-browser-comment-cursor-style`),
      ($c = new WeakMap()),
      (el = Symbol(`denied-browser-frame-target`)));
  });
function nl(e, t) {
  let n = il(e, t);
  return n === void 0 ? sl(e) : n;
}
function rl(e) {
  let t = e?.ownerDocument,
    n = e;
  for (; n != null && n.ownerDocument === t;) {
    if (n.hasAttribute(`oai-annotation-container-text`)) return n;
    if (n.hasAttribute(`oai-annotation-container`)) return null;
    n = ic(n);
  }
  return null;
}
function il(e, t) {
  let n = e.ownerDocument,
    r = n.defaultView,
    i = e,
    a = null;
  for (; i?.ownerDocument === n;) {
    if (i.hasAttribute(`oai-annotation-container-text`)) return null;
    let e = i === n.body || i === n.documentElement,
      o = i.hasAttribute(`oai-annotation-container`);
    if (!e && !o && a == null && i.hasAttribute(`oai-annotatable`)) {
      let e = i.getBoundingClientRect();
      r != null &&
        Number.isFinite(e.left) &&
        Number.isFinite(e.top) &&
        Number.isFinite(e.right) &&
        Number.isFinite(e.bottom) &&
        e.width > 0 &&
        e.height > 0 &&
        e.left < r.innerWidth &&
        e.right > 0 &&
        e.top < r.innerHeight &&
        e.bottom > 0 &&
        (t == null || (t.x >= e.left && t.x <= e.right && t.y >= e.top && t.y <= e.bottom)) &&
        (typeof i.checkVisibility != `function` ||
          i.checkVisibility({ checkOpacity: !0, checkVisibilityCSS: !0 })) &&
        (a = i);
    }
    if (o) return a ?? document.documentElement;
    i = ic(i);
  }
}
function al(e, t, n) {
  if (e.primary.anchor.kind === `virtual` || t.anchor.kind === `virtual`)
    return n ? e : { additional: [], primary: t };
  if (!n) return { additional: [], primary: t };
  let r = [e.primary, ...e.additional],
    i = r.findIndex((e) => ol(e, t));
  if (i === -1) return { additional: [...e.additional, t], primary: e.primary };
  let [a, ...o] = r.filter((e, t) => t !== i);
  return a == null ? null : { additional: o, primary: a };
}
function ol(e, t) {
  return e.anchor.kind === `element` &&
    t.anchor.kind === `element` &&
    e.liveElement?.isConnected &&
    t.liveElement?.isConnected
    ? e.liveElement === t.liveElement
    : e.anchor.kind === t.anchor.kind
      ? e.anchor.kind === `virtual`
        ? t.anchor.kind === `virtual` &&
          e.anchor.pageUrl === t.anchor.pageUrl &&
          e.anchor.surfaceId === t.anchor.surfaceId &&
          e.anchor.targetId === t.anchor.targetId
        : e.anchor.pageUrl === t.anchor.pageUrl &&
          e.anchor.frameUrl === t.anchor.frameUrl &&
          (e.anchor.kind === `element`
            ? e.anchor.selector === t.anchor.selector &&
              e.anchor.elementPath === t.anchor.elementPath
            : e.anchor.rect.x === t.anchor.rect.x &&
              e.anchor.rect.y === t.anchor.rect.y &&
              e.anchor.rect.width === t.anchor.rect.width &&
              e.anchor.rect.height === t.anchor.rect.height) &&
          e.anchor.framePath.length === t.anchor.framePath.length &&
          e.anchor.framePath.every((e, n) => e === t.anchor.framePath[n])
      : !1;
}
function sl(e) {
  return resolveAnnotationTargetElement(e, {
    getOwnerDocument: (element) => element.ownerDocument,
    getBody: (documentLike) => documentLike.body,
    getDocumentElement: (documentLike) => documentLike.documentElement,
    getParentElement: (element) => element.parentElement,
    getRect: (element) => element.getBoundingClientRect(),
    getTagName: (element) => element.tagName,
    getRole: (element) => element.getAttribute(`role`),
    hasDirectText: (element) => bc(element) != null,
  });
}
var ll,
  ul,
  dl = o(() => {
    (tl(), (ll = { width: 48, height: 24 }), (ul = { width: 24, height: 16 }));
  });
function fl(e, t, n) {
  return rl(hl(e, t, n, `text`));
}
function pl(e, t, n, r, i = `annotation`) {
  let a = r == null ? cc(e, t, i === `annotation` && n ? il : void 0) : hl(e, t, r, i, n),
    o = a?.ownerDocument.defaultView;
  if (a == null || o == null) return null;
  let s = Lc(o, { x: 0, y: 0 });
  return Sl(a, { x: e - s.x, y: t - s.y }, i, n);
}
function ml(e, t, n = `annotation`) {
  let r = e.composedPath().find((e) => F(e) && e.namespaceURI === `http://www.w3.org/1999/xhtml`);
  if (r == null) return null;
  let i = { x: e.clientX, y: e.clientY };
  if (n === `annotation` && t && r.ownerDocument !== document) {
    let e = r.ownerDocument.defaultView;
    if (e == null) return null;
    let a = Lc(e, i),
      o = [],
      s = e;
    for (; s !== window;) {
      let e = s.frameElement;
      if (!ac(e)) return null;
      let t = e.ownerDocument.defaultView;
      if (t == null) return null;
      let n = Lc(t, { x: 0, y: 0 });
      (o.unshift({ frame: e, point: { x: a.x - n.x, y: a.y - n.y } }), (s = t));
    }
    for (let { frame: e, point: r } of o) {
      let i = il(e, r);
      if (i !== void 0) return i == null ? null : Sl(i, r, n, t);
    }
  }
  return Sl(r, i, n, t);
}
function hl(e, t, n, r = `design`, i = !1) {
  let a = n.shadowRoot?.querySelector(`[data-browser-comment-root]`),
    o = r === `annotation` && i ? il : void 0;
  if (
    (r === `text` && (o = (e, t) => (il(e, t) === void 0 ? void 0 : null)),
    !(a instanceof HTMLElement))
  )
    return cc(e, t, o);
  let s = n.shadowRoot?.querySelector(`[${Tl}]`),
    c = n.shadowRoot?.querySelector(`[${El}]`),
    l = n.style.pointerEvents,
    u = a.style.pointerEvents,
    d = c instanceof HTMLElement ? c.style.pointerEvents : void 0,
    f = s instanceof HTMLElement ? s.style.pointerEvents : void 0;
  ((n.style.pointerEvents = `none`),
    (a.style.pointerEvents = `none`),
    c instanceof HTMLElement && (c.style.pointerEvents = `none`),
    s instanceof HTMLElement && (s.style.pointerEvents = `none`));
  try {
    return cc(e, t, o);
  } finally {
    ((n.style.pointerEvents = l),
      (a.style.pointerEvents = u),
      c instanceof HTMLElement && (c.style.pointerEvents = d ?? ``),
      s instanceof HTMLElement && (s.style.pointerEvents = f ?? ``));
  }
}
function gl(e) {
  return isAnnotationOverlayElement(e, wl, {
    isElement: (value) => value instanceof HTMLElement,
    closest: (element, selector) => element.closest(selector),
    getRootNode: (element) => element.getRootNode(),
    isShadowRoot: (value) => value instanceof ShadowRoot,
    getShadowHost: (root) => root.host,
    getComposedPath: (event) => event.composedPath(),
    hasAttribute: (element, attribute) => element.hasAttribute(attribute),
  });
}
function _l(e, t) {
  let n = cc(e.x, e.y);
  n == null || gl(n) || gc(t, El);
}
function vl(e, t, n, r) {
  return xl(n) ? yl(e, t, r) : pl(e.x, e.y, r, t);
}
function yl(e, t, n) {
  let r = t.shadowRoot?.querySelectorAll(`[data-browser-comment-marker]`);
  if (r == null || r.length === 0) return pl(e.x, e.y, n, t);
  let i = Array.from(r, (e) => {
    let t = e.style.pointerEvents;
    return ((e.style.pointerEvents = `none`), t);
  });
  try {
    return pl(e.x, e.y, n, t);
  } finally {
    r.forEach((e, t) => {
      e.style.pointerEvents = i[t] ?? ``;
    });
  }
}
function bl(e, t) {
  return e.composedPath().includes(t) && !Cl(e);
}
function xl(e) {
  return isAnnotationMarkerEvent(e, `data-browser-comment-marker`, {
    isElement: (value) => value instanceof HTMLElement,
    closest: (element, selector) => element.closest(selector),
    getRootNode: (element) => element.getRootNode(),
    isShadowRoot: (value) => value instanceof ShadowRoot,
    getShadowHost: (root) => root.host,
    getComposedPath: (event) => event.composedPath(),
    hasAttribute: (element, attribute) => element.hasAttribute(attribute),
  });
}
function Sl(e, t, n, r) {
  if (gl(e)) return null;
  if (rc(e)) return n === `annotation` && r && rl(e) != null ? null : e;
  let i = n === `design` || !r ? sl(e) : nl(e, t);
  return i == null || gl(i) ? null : i;
}
function Cl(e) {
  return isAnnotationInteractionBlocked(e, Tl, {
    isElement: (value) => value instanceof HTMLElement,
    closest: (element, selector) => element.closest(selector),
    getRootNode: (element) => element.getRootNode(),
    isShadowRoot: (value) => value instanceof ShadowRoot,
    getShadowHost: (root) => root.host,
    getComposedPath: (event) => event.composedPath(),
    hasAttribute: (element, attribute) => element.hasAttribute(attribute),
  });
}
var wl,
  Tl,
  El,
  Dl = o(() => {
    (dl(),
      tl(),
      (wl = `codex-browser-sidebar-comments-root`),
      (Tl = `data-browser-comment-interaction-blocker`),
      (El = `data-browser-comment-interaction-layer`));
  });
function Ol(e, t = 0) {
  return (
    kl[e[t + 0]] +
    kl[e[t + 1]] +
    kl[e[t + 2]] +
    kl[e[t + 3]] +
    `-` +
    kl[e[t + 4]] +
    kl[e[t + 5]] +
    `-` +
    kl[e[t + 6]] +
    kl[e[t + 7]] +
    `-` +
    kl[e[t + 8]] +
    kl[e[t + 9]] +
    `-` +
    kl[e[t + 10]] +
    kl[e[t + 11]] +
    kl[e[t + 12]] +
    kl[e[t + 13]] +
    kl[e[t + 14]] +
    kl[e[t + 15]]
  ).toLowerCase();
}
var kl,
  Al = o(() => {
    kl = [];
    for (let e = 0; e < 256; ++e) kl.push((e + 256).toString(16).slice(1));
  });
function jl() {
  if (!Ml) {
    if (typeof crypto > `u` || !crypto.getRandomValues)
      throw Error(
        `crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported`,
      );
    Ml = crypto.getRandomValues.bind(crypto);
  }
  return Ml(Nl);
}
var Ml,
  Nl,
  Pl = o(() => {
    Nl = new Uint8Array(16);
  }),
  Fl,
  Il,
  Ll = o(() => {
    ((Fl = typeof crypto < `u` && crypto.randomUUID && crypto.randomUUID.bind(crypto)),
      (Il = { randomUUID: Fl }));
  });
function Rl(e, t, n) {
  if (Il.randomUUID && !t && !e) return Il.randomUUID();
  e ||= {};
  let r = e.random ?? e.rng?.() ?? jl();
  if (r.length < 16) throw Error(`Random bytes length must be >= 16`);
  if (((r[6] = (r[6] & 15) | 64), (r[8] = (r[8] & 63) | 128), t)) {
    if (((n ||= 0), n < 0 || n + 16 > t.length))
      throw RangeError(`UUID byte range ${n}:${n + 15} is out of buffer bounds`);
    for (let e = 0; e < 16; ++e) t[n + e] = r[e];
    return t;
  }
  return Ol(r);
}
var zl = o(() => {
    (Ll(), Pl(), Al());
  }),
  Bl = o(() => {
    (Al(), Pl(), zl());
  });
function Vl(e) {
  return normalizeAnnotationText(e, R);
}
function Hl(e) {
  return isAnnotationTextInput(e, e?.ownerDocument?.defaultView, new Set([`email`, `search`, `tel`, `text`, `url`]));
}
function Ul(e) {
  return readAnnotationDocumentSafely(e);
}
function Wl(e) {
  return isAnnotationVisibleTextElement(e, {
    hasExcludedAncestor: (element) => element.closest(`script,style,noscript,template,[hidden],[aria-hidden='true']`) != null,
    getStyle: (element) => Gl(element).getComputedStyle(element),
  });
}
function Gl(e) {
  return getAnnotationOwnerWindow(e, window);
}
function I(e) {
  return isAnnotationHtmlElement(e, {
    getOwnerWindow: (value) => value.ownerDocument?.defaultView,
    getFallbackHTMLElement: () => HTMLElement,
  });
}
function Kl(e, t, n) {
  return isAnnotationRangeIntersectingRect(t, n, {
    createRange: () => e.createRange(),
    getClientRects: (range) => Array.from(range.getClientRects()),
    intersects: (candidate, rect) => L(candidate, rect),
  });
}
function L(e, t) {
  return intersectsAnnotationRect(e, t);
}
var R,
  ql,
  Jl,
  Yl,
  Xl,
  Zl = o(() => {
    ($s(),
      (R = 2e3),
      (ql = 4),
      (Jl = 1),
      (Yl = 2),
      (Xl = createAnnotationDocumentContext({
        parseGoogleDocsUrl: hs,
        createGoogleDocsContext: vs,
        normalizeText: Vl,
        getDocument: Ul,
        isHTMLElement: I,
        isVisibleElement: Wl,
        rangeIntersectsRect: Kl,
      }).AnnotationDocumentContext)); /*
        pageUrl;
        constructor(e) {
          this.pageUrl = e;
        }
        isGoogleDocsPage() {
          return hs(this.pageUrl) != null;
        }
        getDocumentContext({ documentTitle: e, selectedText: t, visibleText: n }) {
          return vs({ documentTitle: e, pageUrl: this.pageUrl, selectedText: t, visibleText: n });
        }
        getElementDocumentContext({ documentTitle: e, elementWindow: t, fallbackWindow: n }) {
          return this.getDocumentContext({
            documentTitle: e,
            selectedText: this.getWindowSelectionText(t) ?? this.getWindowSelectionText(n),
          });
        }
        getRegionDocumentContext({
          documentTitle: e,
          fallbackWindow: t,
          frameWindow: n,
          viewportRect: r,
        }) {
          if (this.isGoogleDocsPage())
            return this.getDocumentContext({
              documentTitle: e,
              selectedText: this.getWindowSelectionText(n) ?? this.getWindowSelectionText(t),
              visibleText: this.getVisibleTextInViewportRect(n, r),
            });
        }
        static isGoogleDocsAnchor(e) {
          return e.documentContext?.kind === `google-docs` || hs(e.pageUrl) != null;
        }
        getWindowSelectionText(e) {
          try {
            return Vl(e.getSelection()?.toString()) ?? this.getActiveElementSelectionText(e);
          } catch {
            return null;
          }
        }
        getActiveElementSelectionText(e) {
          let t = e.document.activeElement;
          if (!Hl(t)) return null;
          let n = t.selectionStart,
            r = t.selectionEnd;
          return n == null || r == null || r <= n ? null : Vl(t.value.slice(n, r));
        }
        getVisibleTextInViewportRect(e, t) {
          let n = Ul(e),
            r = n?.body;
          if (n == null || r == null) return null;
          let i = ``,
            a = n.createTreeWalker(r, ql, {
              acceptNode: (e) => {
                if (Vl(e.textContent) == null) return Yl;
                let t = e.parentElement;
                return !I(t) || !Wl(t) ? Yl : Jl;
              },
            }),
            o = a.nextNode();
          for (; o != null;) {
            let e = Vl(o.textContent);
            if (e != null && Kl(n, o, t) && ((i = i.length === 0 ? e : `${i} ${e}`), i.length >= R))
              break;
            o = a.nextNode();
          }
          return Vl(i);
        }
      })); */
  });
function Ql(e) {
  return resolveAnnotationHighlightContext(e, {
    getRoot: (range) => range.commonAncestorContainer.getRootNode(),
    isStyleRoot: (root) => tu(root),
    getOwnerWindow: (root) => `defaultView` in root ? root.defaultView : root.ownerDocument.defaultView,
    supportsHighlights: (windowLike) => eu(windowLike),
  });
}
function $l({ color: e, name: t, ownerWindow: n, range: r, styleRoot: i }) {
  let a = new n.Highlight(r),
    o = n.CSS.highlights,
    s = o.get(t),
    c = new n.CSSStyleSheet();
  return (
    c.replaceSync(`::highlight(${t}) { background-color: ${e} !important; }`),
    (i.adoptedStyleSheets = [...i.adoptedStyleSheets, c]),
    o.set(t, a),
    () => {
      (o.get(t) === a && (s == null ? o.delete(t) : o.set(t, s)),
        (i.adoptedStyleSheets = i.adoptedStyleSheets.filter((e) => e !== c)));
    }
  );
}
function eu(e) {
  return supportsAnnotationCssHighlights(e);
/*
  return (
    `CSS` in e &&
    typeof e.CSS == `object` &&
    e.CSS != null &&
    `highlights` in e.CSS &&
    `Highlight` in e &&
    typeof e.Highlight == `function` &&
    `CSSStyleSheet` in e &&
    typeof e.CSSStyleSheet == `function` &&
    typeof e.CSSStyleSheet.prototype.replaceSync == `function`
  );
*/
}
function tu(e) {
  return canUseAnnotationAdoptedStyleSheets(e);
/*
  return (
    `adoptedStyleSheets` in e &&
    (e.nodeType === Node.DOCUMENT_NODE ||
      (e.nodeType === Node.DOCUMENT_FRAGMENT_NODE && `host` in e))
  );
*/
}
var nu = o(() => {});
function ru(e, t, n) {
  return getAnnotationRangeTextLength(e, t, n, { createRange: (element) => element.ownerDocument.createRange() });
}
function iu(e, t) {
  return projectAnnotationTextOffset(e, t, {
    createTextWalker: (root) => root.ownerDocument.createTreeWalker(root, 4),
    nextNode: (walker) => walker.nextNode(),
  });
}
var au = o(() => {});
function ou(e) {
  let t = e ?? window;
  if (e == null)
    for (;;) {
      let e = Ou(t.document),
        n = e == null ? null : sc(e);
      if (n == null) {
        if (ac(e)) return null;
        break;
      }
      t = n;
    }
  let n = Du(t) ?? vu(t);
  return n == null ? null : Au(n);
}
function su(e) {
  let t = e.startContainer.ownerDocument?.defaultView;
  if (t == null) return null;
  let n = yu(t, e, e.toString(), `forward`);
  return n == null ? null : Au(n);
}
function cu(e) {
  let t = wc(e.framePath);
  if (t == null || !hu(e.frameUrl, t)) return null;
  let n = Nu(t, e.textLocator);
  if (n == null) return null;
  let r = Eu(n, e.textLocator);
  return r?.toString() === e.textLocator.rangeText ? { range: r, target: n } : null;
}
function lu(e) {
  let t = wc(e.framePath);
  if (t == null || !hu(e.frameUrl, t)) return null;
  let n = Nu(t, e.textLocator);
  if (n == null) return null;
  let r;
  switch (e.textLocator.kind) {
    case `dom`:
      r = Tu(t, n, e.textLocator, e.selectedText);
      break;
    case `form-control`:
      r =
        F(n) && Ju(n)
          ? ku(t, n, e.textLocator.startOffset, e.textLocator.endOffset, e.textLocator.direction)
          : null;
  }
  return r == null || r.selectedText !== e.selectedText ? null : Au(r);
}
function uu(e, t) {
  let n = new Map();
  for (let t of e) {
    if (t.anchor.kind !== `text`) continue;
    let e = lu(t.anchor)?.anchor;
    e?.kind === `text` && n.set(t.id, { sourceAnchor: t.anchor, value: e });
  }
  return t?.size === n.size &&
    Array.from(n).every(([e, n]) => {
      let r = t.get(e);
      return r?.sourceAnchor === n.sourceAnchor && Fs(r.value, n.value);
    })
    ? t
    : n;
}
function du(e, t) {
  let n = new Set(),
    r = new Set(),
    i = new Set(),
    a = !1,
    o = null,
    s = () => {
      o ??= window.requestAnimationFrame(() => {
        ((o = null), t());
      });
    },
    c = () => {
      s();
    },
    l = () => {
      (f(), s());
    },
    u = (e) => {
      (e.type === `load` && ac(e.target) && f(), s());
    },
    d = new MutationObserver((e) => {
      e.every(Uu) ||
        ((a ||
          Array.from(n).some((e) => !e.isConnected) ||
          e.some((e) => e.type === `attributes` && Array.from(n).some((t) => t === e.target))) &&
          f(),
        s());
    }),
    f = () => {
      d.disconnect();
      for (let e of n) e.removeEventListener(`input`, l);
      for (let e of r) e.removeEventListener(`scroll`, c);
      for (let e of i) for (let t of z) e.removeEventListener(t, u, !0);
      ((n = new Set()), (r = new Set()), (i = new Set()), (a = !1));
      let t = new Set(),
        o = new Set();
      for (let s of e) {
        for (let e of Pu(s.framePath)) (i.add(e), t.add(e.documentElement));
        let e = wc(s.framePath);
        if (e == null) {
          a = !0;
          continue;
        }
        let c = Nu(e, s.textLocator);
        if (c == null) {
          a = !0;
          let n = Fu(e, s.textLocator);
          (t.add(n), Lu(n) && i.add(n));
          continue;
        }
        (n.add(c), t.add(c), Lu(c) && i.add(c));
        let l = c.parentNode ?? Iu(c);
        for (; l != null;) (Lu(l) ? (t.add(l), i.add(l)) : o.add(l), (l = l.parentNode ?? Iu(l)));
        let u = F(c) ? c : Iu(c);
        for (; u != null;) (r.add(u), (u = u.parentElement ?? Iu(u.getRootNode())));
      }
      for (let e of t) d.observe(e, $u);
      for (let e of o)
        t.has(e) || d.observe(e, { ...(F(e) ? { attributes: !0 } : {}), childList: !0 });
      for (let e of n) e.addEventListener(`input`, l);
      for (let e of r) e.addEventListener(`scroll`, c);
      for (let e of i) for (let t of z) e.addEventListener(t, u, !0);
    };
  return (
    f(),
    () => {
      d.disconnect();
      for (let e of n) e.removeEventListener(`input`, l);
      for (let e of r) e.removeEventListener(`scroll`, c);
      for (let e of i) for (let t of z) e.removeEventListener(t, u, !0);
      o != null && window.cancelAnimationFrame(o);
    }
  );
}
function fu(e) {
  if (e.textLocator.kind !== `dom`) return null;
  let t = cu({ framePath: e.framePath, frameUrl: e.frameUrl, textLocator: e.textLocator });
  return t == null ? null : Ql(t.range);
}
function pu(e) {
  return $l({ ...e, color: Qu, name: Zu });
}
function mu(e) {
  let t = e.document,
    n = null,
    r = () => {
      (n?.dispose(), (n = null));
    },
    i = () => {
      let i = e.getSelection(),
        a = i != null && i.rangeCount > 0 && !Ju(Ou(t)) ? bu(e, i) : null,
        o = a == null ? null : Ql(a);
      if (o == null) {
        r();
        return;
      }
      if (n?.target.styleRoot === o.styleRoot) {
        (n.target.range.setStart(o.range.startContainer, o.range.startOffset),
          n.target.range.setEnd(o.range.endContainer, o.range.endOffset));
        return;
      }
      (r(), (o.range = o.range.cloneRange()));
      let s = $l({ ...o, color: Qu, name: `${Zu}-drag` }),
        c = new o.ownerWindow.CSSStyleSheet();
      (c.replaceSync(
        `::selection { background-color: transparent !important; color: currentColor !important; }`,
      ),
        (o.styleRoot.adoptedStyleSheets = [...o.styleRoot.adoptedStyleSheets, c]),
        (n = {
          target: o,
          dispose: () => {
            (s(),
              (o.styleRoot.adoptedStyleSheets = o.styleRoot.adoptedStyleSheets.filter(
                (e) => e !== c,
              )));
          },
        }));
    };
  return (
    t.addEventListener(`selectionchange`, i),
    i(),
    () => {
      (t.removeEventListener(`selectionchange`, i), r());
    }
  );
}
function hu(e, t) {
  return matchesAnnotationFrameUrl(e, t);
}
function gu() {
  for (let e of uc())
    try {
      e.getSelection()?.removeAllRanges();
      let t = Ou(e.document);
      Ju(t) && t.setSelectionRange(t.selectionEnd, t.selectionEnd);
    } catch {}
}
function _u(e, t) {
  return getAnnotationScrollOffset(e, t);
}
function vu(e) {
  let t = e.getSelection();
  if (t == null || t.rangeCount === 0) return null;
  let n = bu(e, t);
  return n == null ? null : yu(e, n, t.toString(), wu(t, n));
}
function yu(e, t, n, r) {
  if (
    t.collapsed ||
    !t.startContainer.isConnected ||
    !t.endContainer.isConnected ||
    t.startContainer.ownerDocument !== e.document ||
    t.endContainer.ownerDocument !== e.document ||
    n.trim().length === 0 ||
    n.length > 2e4 ||
    t.toString().length > 2e4
  )
    return null;
  let i = ju(t.commonAncestorContainer);
  if (i == null || zu(t, e)) return null;
  let a = Mu(i);
  if (a == null) return null;
  let o = ru(i, t.startContainer, t.startOffset),
    s = ru(i, t.endContainer, t.endOffset);
  if (o == null || s == null || s <= o) return null;
  let c = Vu(t);
  if (c.length === 0) return null;
  let l = r === `forward`;
  return {
    frameWindow: e,
    isFixed: Ru(i, e),
    locator: {
      ...a,
      kind: `dom`,
      direction: r,
      rangeText: t.toString(),
      startOffset: o,
      endOffset: s,
    },
    rects: c,
    selectedText: n,
    viewportPoint: qu(c, l),
  };
}
function bu(e, t) {
  let n = t.getRangeAt(0);
  if (!n.collapsed && xu(t, n)) return n;
  if (!Su(t)) return null;
  let r = t.getComposedRanges({ shadowRoots: Cu(e.document) })[0];
  if (r == null) return null;
  let i = e.document.createRange();
  return (
    i.setStart(r.startContainer, r.startOffset),
    i.setEnd(r.endContainer, r.endOffset),
    i.collapsed ? null : i
  );
}
function xu(e, t) {
  return (
    (e.anchorNode === t.startContainer &&
      e.anchorOffset === t.startOffset &&
      e.focusNode === t.endContainer &&
      e.focusOffset === t.endOffset) ||
    (e.focusNode === t.startContainer &&
      e.focusOffset === t.startOffset &&
      e.anchorNode === t.endContainer &&
      e.anchorOffset === t.endOffset)
  );
}
function Su(e) {
  return `getComposedRanges` in e && typeof e.getComposedRanges == `function`;
}
function Cu(e) {
  let t = [];
  for (let n of e.querySelectorAll(`*`))
    F(n) && n.shadowRoot != null && t.push(n.shadowRoot, ...Cu(n.shadowRoot));
  return t;
}
function wu(e, t) {
  return e.anchorNode === t.startContainer && e.anchorOffset === t.startOffset
    ? `forward`
    : (e.focusNode === t.startContainer && e.focusOffset === t.startOffset) ||
        (`direction` in e && e.direction === `backward`)
      ? `backward`
      : `forward`;
}
function Tu(e, t, n, r) {
  let i = Eu(t, n);
  if (i == null || i.toString() !== n.rangeText || zu(i, e) || r.length > 2e4) return null;
  let a = Vu(i);
  return a.length === 0
    ? null
    : {
        frameWindow: e,
        isFixed: Ru(t, e),
        locator: n,
        rects: a,
        selectedText: r,
        viewportPoint: qu(a, n.direction === `forward`),
      };
}
function Eu(e, t) {
  let n = iu(e, t.startOffset),
    r = iu(e, t.endOffset);
  if (n == null || r == null) return null;
  let i = e.ownerDocument.createRange();
  return (i.setStart(n.node, n.offset), i.setEnd(r.node, r.offset), i);
}
function Du(e) {
  let t = Ou(e.document);
  if (!Ju(t) || Bu(t, e)) return null;
  let n = t.selectionStart,
    r = t.selectionEnd;
  if (n == null || r == null) {
    let i = e.getSelection()?.toString() ?? ``;
    if (
      ((n = t.value.indexOf(i)),
      (r = n + i.length),
      i.length === 0 || n === -1 || t.value.indexOf(i, n + 1) !== -1)
    )
      return null;
  }
  return r <= n || t.value.slice(n, r).trim().length === 0
    ? null
    : ku(e, t, n, r, t.selectionDirection === `backward` ? `backward` : `forward`);
}
function Ou(e) {
  let t = e.activeElement;
  for (; t?.shadowRoot?.activeElement != null;) t = t.shadowRoot.activeElement;
  return t;
}
function ku(e, t, n, r, i) {
  let a = Mu(t),
    o = t.value.slice(n, r);
  if (a?.selector == null || Bu(t, e) || o.trim().length === 0 || o.length > 2e4) return null;
  let s = Hu(t, n, r);
  return s.length === 0
    ? null
    : {
        frameWindow: e,
        isFixed: Ru(t, e),
        locator: {
          ...a,
          selector: a.selector,
          kind: `form-control`,
          direction: i,
          startOffset: n,
          endOffset: r,
        },
        rects: s,
        selectedText: o,
        viewportPoint: qu(s, i === `forward`),
      };
}
function Au(e) {
  let t = ec(e.frameWindow);
  if (t == null) return null;
  let n = Ic(e.frameWindow),
    r = Ku(e.rects),
    i = e.isFixed ? 0 : e.frameWindow.scrollX,
    a = e.rects.map((t) => ({
      ...t,
      x: t.x + i,
      y: e.isFixed ? t.y : t.y + e.frameWindow.scrollY,
    })),
    o = Ku(a),
    s = jc(e.frameWindow, e.viewportPoint),
    c = { x: e.viewportPoint.x + n.x, y: e.viewportPoint.y + n.y };
  return {
    anchor: {
      kind: `text`,
      pageUrl: window.location.href,
      frameUrl: e.frameWindow === window ? null : e.frameWindow.location.href,
      title: `Selected text`,
      elementPath: `browser text selection`,
      point: {
        xPercent: ((e.viewportPoint.x + i) / e.frameWindow.innerWidth) * 100,
        y: e.isFixed ? e.viewportPoint.y : e.viewportPoint.y + e.frameWindow.scrollY,
      },
      rect: o,
      isFixed: e.isFixed,
      role: null,
      name: null,
      selector: null,
      framePath: t,
      nearbyText: null,
      selectedText: e.selectedText,
      selectionRects: a,
      textLocator: e.locator,
      ...(s.length === 0 ? {} : { scrollContainers: s }),
    },
    themeVariant: window.matchMedia?.(`(prefers-color-scheme: dark)`)?.matches ? `dark` : `light`,
    viewportRect: { ...r, x: r.x + n.x, y: r.y + n.y },
    viewportPoint: c,
    viewportSize: { width: window.innerWidth, height: window.innerHeight },
  };
}
function ju(e) {
  if (Lu(e)) return e;
  let t = e.nodeType === 1 ? e : e.parentElement;
  for (; F(t);) {
    if (Oc(t) != null) return t;
    t = t.parentElement;
  }
  return null;
}
function Mu(e) {
  let t = F(e) ? Oc(e, { requireUnique: !0 }) : null;
  if (F(e) && t == null) return null;
  let n = [],
    r = e.getRootNode();
  for (; r !== e.ownerDocument;) {
    let e = Iu(r);
    if (e == null || e.shadowRoot !== r) return null;
    let t = Oc(e, { requireUnique: !0 });
    if (t == null) return null;
    (n.unshift(t), (r = e.getRootNode()));
  }
  return { selector: t, shadowHosts: n };
}
function Nu(e, t) {
  let n = e.document;
  for (let e of t.shadowHosts) {
    let t = n.querySelector(e);
    if (!F(t) || t.shadowRoot == null) return null;
    n = t.shadowRoot;
  }
  let r = t.selector;
  if (t.kind === `dom` && r == null) return Lu(n) ? n : null;
  if (r == null) return null;
  let i = n.querySelector(r);
  return F(i) ? i : null;
}
function Pu(e) {
  let t = window,
    n = [t.document];
  for (let r of e) {
    let e = Tc(t.document, r);
    if (e == null) break;
    let i = sc(e);
    if (i == null) break;
    ((t = i), n.push(t.document));
  }
  return n;
}
function Fu(e, t) {
  let n = e.document;
  for (let e of t.shadowHosts) {
    let t = n.querySelector(e);
    if (!F(t) || t.shadowRoot == null) return n;
    n = t.shadowRoot;
  }
  return n;
}
function Iu(e) {
  return getAnnotationShadowHost(e, { isShadowRoot: (value) => Lu(value) });
}
function Lu(e) {
  return isAnnotationShadowHostRoot(e, { fragmentNodeType: Node.DOCUMENT_FRAGMENT_NODE, isElement: (value) => F(value) });
}
function Ru(e, t) {
  return isAnnotationRangeFixedPosition(e, {
    isElement: (value) => F(value),
    getShadowHost: (value) => Iu(value),
    getParent: (value) => value.parentElement ?? Iu(value.getRootNode()),
    getStylePosition: (value) => t.getComputedStyle(value).position,
    getBody: () => t.document.body,
  });
}
function zu(e, t) {
  let n = e.commonAncestorContainer;
  if (n.nodeType === Node.TEXT_NODE) return n.parentElement != null && Bu(n.parentElement, t);
  let r = t.document.createTreeWalker(n, NodeFilter.SHOW_TEXT),
    i = r.nextNode();
  for (; i != null;) {
    if (e.intersectsNode(i) && i.parentElement != null && Bu(i.parentElement, t)) return !0;
    i = r.nextNode();
  }
  return !1;
}
function Bu(e, t) {
  return isAnnotationTextSecurityEnabled(e, { getTextSecurity: (element) => t.getComputedStyle(element).getPropertyValue(`-webkit-text-security`) });
}
function Vu(e) {
  return projectAnnotationClientRects(e, { getClientRects: (value) => value.getClientRects() });
}
function Hu(e, t, n) {
  let r = e.getBoundingClientRect();
  if (r.width <= 0 || r.height <= 0) return [];
  let i = e.ownerDocument.defaultView;
  if (i == null || Wu(e, i)) return [];
  let a = i.getComputedStyle(e),
    o = e.offsetWidth > 0 ? r.width / e.offsetWidth : 1,
    s = e.offsetHeight > 0 ? r.height / e.offsetHeight : 1,
    c = e.ownerDocument.createElement(`div`);
  (c.setAttribute(ed, ``),
    (c.style.position = `fixed`),
    (c.style.left = `${r.left}px`),
    (c.style.top = `${r.top}px`),
    (c.style.width = `${r.width / o}px`),
    (c.style.height = `${r.height / s}px`),
    (c.style.overflow = `auto`),
    (c.style.visibility = `hidden`),
    (c.style.pointerEvents = `none`),
    (c.style.whiteSpace = e.tagName === `TEXTAREA` ? `pre-wrap` : `pre`),
    (c.style.overflowWrap = e.tagName === `TEXTAREA` ? `break-word` : `normal`),
    (o !== 1 || s !== 1) &&
      ((c.style.transform = `scale(${o}, ${s})`), (c.style.transformOrigin = `top left`)));
  for (let e of Xu) c.style[e] = a[e];
  ((c.style.boxSizing = `border-box`), c.append(e.value.slice(0, t)));
  let l = e.ownerDocument.createElement(`span`);
  ((l.textContent = e.value.slice(t, n) || `​`),
    c.append(l, e.value.slice(n)),
    e.ownerDocument.body.append(c),
    (c.scrollLeft = e.scrollLeft),
    (c.scrollTop = e.scrollTop));
  let u = l.getClientRects(),
    d = Array.from(u.length > 1e3 ? [] : u)
      .map((e) => Gu(e, r))
      .filter((e) => e != null);
  return (c.remove(), d);
}
function Uu(e) {
  return isAnnotationMirrorMutation(e, {
    isElement: (value) => F(value),
    hasMarker: (value) => value.hasAttribute(ed),
  });
}
function Wu(e, t) {
  return hasAnnotationAncestorTransform(e, {
    getStyle: (element) => t.getComputedStyle(element),
    getParent: (element) => element.parentElement,
    getShadowHost: (element) => Iu(element.getRootNode()),
  });
}
function Gu(e, t) {
  return intersectAnnotationRects(e, t);
}
function Ku(e) {
  return projectAnnotationRectBounds(e);
}
function qu(e, t) {
  return projectAnnotationRectPoint(e, t);
}
function Ju(e) {
  return hasAnnotationInputSelection(e, { isTextInput: (value) => isAnnotationTextInput(value, value?.ownerDocument?.defaultView, Yu) });
}
var Yu,
  Xu,
  Zu,
  Qu,
  $u,
  z,
  ed,
  td = o(() => {
    ($s(),
      nu(),
      au(),
      tl(),
      (Yu = new Set([`email`, `search`, `tel`, `text`, `url`])),
      (Xu =
        `borderBottomStyle.borderBottomWidth.borderLeftStyle.borderLeftWidth.borderRightStyle.borderRightWidth.borderTopStyle.borderTopWidth.boxSizing.direction.fontFamily.fontFeatureSettings.fontKerning.fontSize.fontStretch.fontStyle.fontVariant.fontWeight.letterSpacing.lineHeight.paddingBottom.paddingLeft.paddingRight.paddingTop.tabSize.textAlign.textIndent.textTransform.wordBreak.wordSpacing`.split(
          `.`,
        )),
      (Zu = `codex-browser-text-selection`),
      (Qu = `#128dff66`),
      ($u = { attributes: !0, childList: !0, characterData: !0, subtree: !0 }),
      (z = [`animationcancel`, `animationend`, `load`, `transitioncancel`, `transitionend`]),
      (ed = `data-browser-comment-text-selection-mirror`));
  });
function nd(e) {
  return projectAnnotationElementMetadata(e, { getRect: cd, getComputedStyle: (element) => Fc(element).getComputedStyle(element), normalizeColor: ws, collectStyles: ls, flexProperties: Sd, baseProperties: xd });
}
function rd(e) {
  return isTopLevelAnnotationRoot(e);
}
function id(e, t, n, r, i = window.innerWidth) {
  let a = Cd.get(e.ownerDocument);
  a ?? ((a = new WeakMap()), Cd.set(e.ownerDocument, a));
  let o = a.get(e);
  o ?? ((o = Rl()), a.set(e, o));
  let s = Fc(e),
    c = Cc(e),
    l = c == null ? null : kc(e, { requireUnique: !1 }),
    u = Mc(e),
    d = fd(),
    f = new Xl(d).getElementDocumentContext({
      documentTitle: document.title,
      elementWindow: s,
      fallbackWindow: window,
    });
  return {
    kind: `element`,
    runtimeElementId: o,
    pageUrl: d,
    frameUrl: pd(s, c),
    title: yc(e),
    elementPath: Sc(e),
    point: { xPercent: (n.x / i) * 100, y: r ? n.y : n.y + window.scrollY },
    rect: { x: t.x, y: r ? t.y : t.y + window.scrollY, width: t.width, height: t.height },
    isFixed: r,
    role: e.getAttribute(`role`),
    name: e.getAttribute(`aria-label`) ?? bc(e),
    selector: l,
    framePath: c ?? [],
    nearbyText: xc(e),
    immediateText: vd(e),
    documentContext: f,
    ...(u.length === 0 ? {} : { scrollContainers: u }),
  };
}
function ad(e, t, n, r) {
  let i = cd(e);
  return i == null
    ? t
    : {
        ...id(e, i, hd(t, i, n, r), Ac(e), n?.width),
        elementMetadata: t.elementMetadata,
        elementName: t.elementName,
      };
}
function od(e, t, n, r) {
  return projectAnnotationElementMetadataAttributes(e, t, n, r, {
    isTopWindow: () => window.top === window,
    isDocumentRoot: (element) => element.ownerDocument === document,
    isHtmlElement: (element) => element.namespaceURI === `http://www.w3.org/1999/xhtml`,
    isExcluded: (element) => rc(element),
    hasVisibleRect: (element) => cd(element) != null,
    hasAttribute: (element, name) => element.hasAttribute(name),
    getAttribute: (element, name) => element.getAttribute(name),
    parseMetadata: (value) => Qo(value),
    parseName: (value) => Xo(value),
  });
}
function sd(e, t, n) {
  if (e.kind !== `element`) return null;
  if (t != null) {
    let e = n.get(t) ?? null;
    if (e?.isConnected) return cd(e) == null ? null : e;
    e != null && n.delete(t);
  }
  if (e.selector == null || !md(e.pageUrl, fd())) return null;
  try {
    let t = Dc(e.framePath);
    return t == null ? null : ud(t, e);
  } catch {
    return null;
  }
}
function cd(e) {
  return getAnnotationVisibleElementRect(e, {
    isConnected: (element) => element.isConnected,
    isVisible: (element) => _d(element),
    getRect: (element) => element.getBoundingClientRect(),
    getFrameOffset: (element) => Ic(Fc(element)),
  });
}
function ld(e) {
  return e.getAttribute(`aria-label`) ?? bc(e);
}
function ud(e, t) {
  if (t.selector == null) return null;
  let n = t.selector.startsWith(`shadow:`)
    ? [Ec(e, t.selector)].filter(F)
    : Array.from(e.querySelectorAll(t.selector)).filter(F);
  if (n.length === 0) return null;
  let r = n.filter((e) => cd(e) != null);
  if (r.length === 0) return null;
  let i = r;
  if (t.name != null) {
    let e = i.filter((e) => ld(e) === t.name);
    e.length > 0 && (i = e);
  }
  if (t.nearbyText != null) {
    let e = i.filter((e) => xc(e) === t.nearbyText);
    e.length > 0 && (i = e);
  }
  if (i.length === 1) return i[0] ?? null;
  let a = null,
    o = -1 / 0;
  for (let e of i) {
    let n = gd(t, e);
    n > o && ((a = e), (o = n));
  }
  return a;
}
function dd(e) {
  if (e == null) return null;
  if (e.kind === `virtual`) return e.rect;
  let t = wc(e.framePath),
    n = Nc(e, t ?? window),
    r = n.x + _u(e, t ?? window);
  if (e.kind !== `element` && t != null && t !== window) {
    let i = Ic(t);
    return {
      x: e.rect.x + i.x - r,
      y: e.rect.y + i.y - (e.isFixed ? 0 : t.scrollY) - n.y,
      width: e.rect.width,
      height: e.rect.height,
    };
  }
  return {
    x: e.rect.x - r,
    y: (e.isFixed ? e.rect.y : e.rect.y - window.scrollY) - n.y,
    width: e.rect.width,
    height: e.rect.height,
  };
}
function fd() {
  return getCurrentAnnotationPageUrl(window);
}
function pd(e, t) {
  return resolveAnnotationFrameDocumentUrl(e, t, fd(), ac);
}
function md(e, t) {
  return areAnnotationUrlsEquivalent(e, t);
}
function hd(e, t, n, r) {
  return projectAnnotationAnchorPoint(e, t, n, r?.x);
/*
  let i = r?.x ?? (e.point.xPercent / 100) * (n?.width ?? window.innerWidth),
    a = e.rect.width === 0 ? 0.5 : (i - e.rect.x) / e.rect.width,
    o = e.rect.height === 0 ? 0.5 : (e.point.y - e.rect.y) / e.rect.height;
  return { x: t.x + bd(a, 0, 1) * t.width, y: t.y + bd(o, 0, 1) * t.height };
*/
}
function gd(e, t) {
  return scoreAnnotationAnchorCandidate(e, t, { getName: ld, getNearbyText: xc, getTitle: yc, getElementPath: Sc, getRect: cd, getAnchorPoint: dd });
}
function _d(e) {
  return isAnnotationElementVisibleByPolicy(e, {
    getParent: (element) => element.parentElement,
    getComputedStyle: (element) => Fc(element).getComputedStyle(element),
    checkVisibility: typeof e.checkVisibility === `function`
      ? (element) => element.checkVisibility({ checkOpacity: !0, checkVisibilityCSS: !0 })
      : undefined,
  });
}
function vd(e) {
  return projectAnnotationDirectTextPreview(e, rc);
}
function yd(e) {
  return parseAnnotationUrl(e);
}
function bd(e, t, n) {
  return clampAnnotationCoordinate(e, t, n);
}
var xd,
  Sd,
  Cd,
  wd = o(() => {
    ($s(),
      Bl(),
      tl(),
      Zl(),
      td(),
      (xd = [
        `color`,
        `background-color`,
        `font-size`,
        `font-family`,
        `font-weight`,
        `border-radius`,
        `border-color`,
        `border-width`,
        `padding-top`,
        `padding-right`,
        `padding-bottom`,
        `padding-left`,
        `margin-top`,
        `margin-right`,
        `margin-bottom`,
        `margin-left`,
        `width`,
        `height`,
        `opacity`,
      ]),
      (Sd = [`flex-direction`, `justify-content`, `align-items`, `gap`, `row-gap`, `column-gap`]),
      (Cd = new WeakMap()));
  });
($s(), Yo(), Dl(), dl(), wd(), tl(), td());
var Td = ja({
  enterAnnotationMode: Ea().catch(!1),
  initialComment: zs.optional().catch(void 0),
  metadata: Oa().transform((e) => {
    let t = Zo(e);
    return t == null || Object.keys(t).length === 0 ? void 0 : t;
  }),
  mode: La([`default`, `advanced`]).catch(`default`),
  range: ja({
    startPath: Aa(wa().int().nonnegative()).max(128),
    endPath: Aa(wa().int().nonnegative()).max(128),
    startOffset: wa().int().nonnegative(),
    endOffset: wa().int().nonnegative(),
    rangeText: Ca().min(1).max(Hs),
  }).optional(),
});
var annotationRequestContext;
function getAnnotationRequestContext() {
  return (annotationRequestContext ??= createAnnotationRequestContext({
    documentRef: document,
    windowRef: window,
    globalLike: globalThis,
    isRange: (value) => value instanceof Range,
    isHTMLElement: (value) => value instanceof HTMLElement,
    isExcludedElement: gl,
    getVisibleRect: cd,
    resolveRangeAnchor: su,
    getRangeClientRects: (value) => value.getClientRects(),
    isRangeSelectable: Od,
  }));
}
function Ed({ getState: e, requestPermission: t }) {
  let context = getAnnotationRequestContext();
  return createAnnotationSiteRequests({
    documentRef: document,
    windowRef: window,
    navigatorRef: navigator,
    getState: e,
    requestPermission: t,
    prepareRequest: (l, state) => {
      if (!context.isAllowed(state)) return null;
      let u = Md(l),
        d = l.composedPath()[0] ?? l.target;
      if (u == null || !(d instanceof HTMLElement) || gl(d)) return null;
      let f = u.range == null ? null : context.resolveSerializedRange(d, u.range);
      if (u.range != null && f == null) return null;
      let p = { initialComment: u.initialComment, siteInitiated: !0 };
      (u.enterAnnotationMode && (p.enterAnnotationMode = !0),
        u.mode === `advanced` && (p.openTweaks = !0));
      let m = {
        target: f ?? d,
        rangeText: u.range?.rangeText,
        request: p,
        metadata: u.range == null && d.getRootNode() === document ? u.metadata : void 0,
        permissionGranted: !1,
      };
      let resolved = context.resolveTarget(m, state);
      return resolved == null
        ? null
        : { target: m.target, resolvedTarget: resolved, request: m.request, metadata: m.metadata, validationInput: m };
    },
    resolveRequest: (candidate, state) => {
      let resolved = context.resolveTarget(candidate.validationInput, state);
      return resolved == null
        ? null
        : {
            resolvedTarget: resolved,
            metadata:
              candidate.target instanceof HTMLElement && candidate.target.getRootNode() === document
                ? candidate.metadata
                : void 0,
          };
    },
  });
}
function Od(e) {
  return isAnnotationRangeSelectable(e, {
    createTextWalker: (root) => document.createTreeWalker(root, NodeFilter.SHOW_TEXT),
    isTextNode: (node) => node instanceof Text,
    getTextContent: (node) => node.textContent,
    getAssignedSlot: (node) => node.assignedSlot,
    getParentElement: (node) => node.parentElement,
    intersectsNode: (range, node) => range.intersectsNode(node),
    isVisibleElement: (element) => B(element),
  });
}
function B(e) {
  return isAnnotationElementVisible(e, {
    getComputedStyle: (value) => window.getComputedStyle(value),
    getParent: (value) => ic(value),
  });
}
function Md(e) {
  try {
    let t = `detail` in e ? (e.detail ?? {}) : {};
    if (typeof t != `object`) return;
    let n = Object.getPrototypeOf(t);
    if (n !== Object.prototype && n != null) return;
    let r = Td.safeParse(
      Object.fromEntries(
        [`mode`, `enterAnnotationMode`, `initialComment`, `metadata`, `range`].map((e) => {
          try {
            let n = Object.getOwnPropertyDescriptor(t, e);
            return n != null && !Object.hasOwn(n, `value`) ? [e, void 0] : [e, n?.value];
          } catch {
            return [e, void 0];
          }
        }),
      ),
    );
    return r.success ? r.data : void 0;
  } catch {
    return;
  }
}
function Nd(e) {
  return Math.min(Ld, Math.max(Id, e));
}
function Pd(e) {
  return Nd(e) / 100;
}
var Fd,
  Id,
  Ld,
  Rd = o(() => {
    ((Fd = [25, 33, 50, 67, 75, 80, 90, 100, 110, 125, 150, 175, 200, 250, 300, 400, 500]),
      (Id = Fd[0]),
      (Ld = Fd[Fd.length - 1]));
  });
Rd();
var zd = `codex_desktop:message-for-view`,
  Bd = `codex_desktop:browser-sidebar-runtime-message`,
  Vd = `codex_desktop:browser-page-event`,
  Hd = `codex_desktop:get-browser-annotation-api-policy`;
var { createAnnotationProtocol } = require("./browser-page-preload/annotation-protocol");
var { createAnnotationSerialization } = require("./browser-page-preload/annotation-serialization");
var { attachAnnotationControlTargets, collectAnnotationControlTargets, createAnnotationControlHandle, createAnnotationOpenRequestDetail, createAnnotationRangeDetail, createAnnotationResponseDetail, detachAnnotationControlTargets, getAnnotationControlsForTarget, isValidAnnotationHitTestRequest, isValidAnnotationSurfaceElement, normalizeAnnotationControlTargets, parseAnnotationControlTargetList, parseAnnotationControlsPayload, readAnnotationEventDetail, readAnnotationEventField, sanitizeAnnotationControlMetadata, sanitizeAnnotationHit, serializeAnnotationControls, shouldDisposeAnnotationRegistryOnPagehide, shouldRenderAnnotationSelection } = require("./browser-page-preload/annotation-runtime");
var { createAnnotationControlsRegistry } = require("./browser-page-preload/annotation-controls-registry");
var { installAnnotationSurfaceObserver } = require("./browser-page-preload/annotation-surface-observer");
var { installAnnotationFramePointerGuard } = require("./browser-page-preload/annotation-frame-pointer-guard");
var { createAnnotationSurfaceRegistry } = require("./browser-page-preload/annotation-surface-registry");
var { createVirtualAnnotationTarget } = require("./browser-page-preload/annotation-virtual-target");
var { clampAnnotationCoordinate, clipAnnotationSurfaceRect, inferAnnotationMarkerViewportSize, intersectAnnotationRect, isAnnotationPointInViewport, isLargeAnnotationRect, resolveAnnotationCanvasSize, scaleAnnotationRect, unionAnnotationRects, updateAnnotationRegionDrag } = require("./browser-page-preload/annotation-surface-geometry");
var { interceptAnnotationSpaceKey } = require("./browser-page-preload/annotation-keyboard");
var { reducePendingEditorMessage } = require("./browser-page-preload/pending-editor-message");
var { isLocalHttpUrl } = require("./browser-page-preload/local-url");
var { createAnnotationOverlayRuntime } = require("./browser-page-preload/annotation-overlay-runtime");
var { getAnnotationElementOverlayClassName } = require("./browser-page-preload/annotation-overlay-class-policy");
var { createAnnotationPreviewLayer } = require("./browser-page-preload/annotation-preview-layer");
var { createAnnotationAnchorGeometry } = require("./browser-page-preload/annotation-anchor-geometry");
var { escapeAnnotationSelectorToken } = require("./browser-page-preload/annotation-selector-token");
var { createGoogleDocsContext: createGoogleDocsContextHelper, isGoogleDocsOrSheetsUrl: isGoogleDocsOrSheetsUrlHelper, parseGoogleDocsUrl: parseGoogleDocsUrlHelper, parseGoogleSheetsId: parseGoogleSheetsIdHelper, readTabId: readTabIdHelper, normalizeText: normalizeGoogleDocsText } = require("./browser-page-preload/google-docs-context");
var { parseAnnotationUrl } = require("./browser-page-preload/annotation-url-parser-policy");
var { createAnnotationDocumentContext } = require("./browser-page-preload/annotation-document-context");
var { normalizeAnnotationColor: normalizeAnnotationColorPolicy } = require("./browser-page-preload/annotation-color-policy");
var { spreadAnnotationMarkerPoints } = require("./browser-page-preload/annotation-marker-position");
var { projectAnnotationTooltipPosition } = require("./browser-page-preload/annotation-tooltip-position");
var { areAnnotationScrollContainersEqual } = require("./browser-page-preload/annotation-scroll-container-equality");
var { areAnnotationAnchorsEqual } = require("./browser-page-preload/annotation-anchor-equality");
var { getAnnotationInverseViewportScale } = require("./browser-page-preload/annotation-viewport-scale");
var { hasAnnotationComments, getAnnotationCommentCount } = require("./browser-page-preload/annotation-comment-count");
var { supportsAnnotationCssHighlights } = require("./browser-page-preload/annotation-highlight-capability");
var { canUseAnnotationAdoptedStyleSheets } = require("./browser-page-preload/annotation-adopted-stylesheet-target");
var { matchesAnnotationFrameUrl } = require("./browser-page-preload/annotation-frame-url-policy");
var { projectAnnotationDirectTextPreview } = require("./browser-page-preload/annotation-direct-text-preview");
var { getAnnotationScrollOffset } = require("./browser-page-preload/annotation-scroll-offset");
var { resolveAnnotationFrameDocumentUrl } = require("./browser-page-preload/annotation-frame-document-url");
var { projectAnnotationAnchorPoint } = require("./browser-page-preload/annotation-anchor-point-projection");
var { scoreAnnotationAnchorCandidate } = require("./browser-page-preload/annotation-anchor-candidate-score");
var { isTopLevelAnnotationRoot } = require("./browser-page-preload/annotation-anchor-root-policy");
var { isAnnotationDocumentRoot } = require("./browser-page-preload/annotation-document-root-policy");
var { projectAnnotationElementLabel } = require("./browser-page-preload/annotation-element-label-policy");
var { projectAnnotationAccessibleLabel } = require("./browser-page-preload/annotation-accessible-label-policy");
var { projectAnnotationNearbyText } = require("./browser-page-preload/annotation-nearby-text-policy");
var { projectAnnotationElementPath } = require("./browser-page-preload/annotation-element-path-policy");
var { projectAnnotationElementMetadata } = require("./browser-page-preload/annotation-element-metadata-projection");
var { projectAnnotationElementMetadataAttributes } = require("./browser-page-preload/annotation-element-metadata-attributes");
var { isAnnotationElementVisibleByPolicy } = require("./browser-page-preload/annotation-element-visibility-policy");
var { getAnnotationFrameOffset } = require("./browser-page-preload/annotation-frame-offset-policy");
var { isAnnotationElementLike } = require("./browser-page-preload/annotation-element-like-policy");
var { getAnnotationScrollContainerOffset } = require("./browser-page-preload/annotation-scroll-container-offset");
var { projectAnnotationFramePoint } = require("./browser-page-preload/annotation-frame-point-projection");
var { isAnnotationIframeElement } = require("./browser-page-preload/annotation-iframe-element-policy");
var { resolveAnnotationIframeWindow } = require("./browser-page-preload/annotation-iframe-window-policy");
var { isAnnotationClippingBoundary } = require("./browser-page-preload/annotation-clipping-boundary-policy");
var { isAnnotationShadowRoot } = require("./browser-page-preload/annotation-shadow-root-policy");
var { isAnnotationUniqueSelectorMatch } = require("./browser-page-preload/annotation-unique-selector-policy");
var { isAnnotationQueryableRoot } = require("./browser-page-preload/annotation-queryable-root-policy");
var { readAnnotationDocumentSafely } = require("./browser-page-preload/annotation-document-access-policy");
var { getAnnotationOwnerWindow } = require("./browser-page-preload/annotation-owner-window-policy");
var { intersectsAnnotationRect } = require("./browser-page-preload/annotation-rect-intersection-policy");
var { isAnnotationHtmlElement } = require("./browser-page-preload/annotation-html-element-policy");
var { getAnnotationRangeTextLength } = require("./browser-page-preload/annotation-range-text-length");
var { projectAnnotationTextOffset } = require("./browser-page-preload/annotation-text-offset-projection");
var { resolveAnnotationHighlightContext } = require("./browser-page-preload/annotation-highlight-context-policy");
var { projectAnnotationClientRects } = require("./browser-page-preload/annotation-client-rect-projection");
var { isAnnotationTextSecurityEnabled } = require("./browser-page-preload/annotation-text-security-policy");
var { isAnnotationShadowHostRoot, getAnnotationShadowHost } = require("./browser-page-preload/annotation-shadow-host-policy");
var { isAnnotationRangeFixedPosition } = require("./browser-page-preload/annotation-range-fixed-position-policy");
var { hasAnnotationAncestorTransform } = require("./browser-page-preload/annotation-transform-policy");
var { intersectAnnotationRects } = require("./browser-page-preload/annotation-rect-clip-intersection");
var { projectAnnotationRectBounds } = require("./browser-page-preload/annotation-rect-bounds-projection");
var { projectAnnotationRectPoint } = require("./browser-page-preload/annotation-rect-point-projection");
var { isAnnotationMirrorMutation } = require("./browser-page-preload/annotation-mirror-mutation-policy");
var { hasAnnotationInputSelection } = require("./browser-page-preload/annotation-input-selection-policy");
var { getAnnotationVisibleElementRect } = require("./browser-page-preload/annotation-visible-element-rect");
var { getAnnotationControlDefaultValue } = require("./browser-page-preload/annotation-control-default-value");
var { isAnnotationSidebarTarget } = require("./browser-page-preload/annotation-sidebar-target-policy");
var { reduceAnnotationSidebarEditorTransition } = require("./browser-page-preload/annotation-sidebar-editor-transition");
var { resolveAnnotationFrameElement } = require("./browser-page-preload/annotation-frame-element-resolver");
var { resolveAnnotationFrameDocument } = require("./browser-page-preload/annotation-frame-document-resolver");
var { projectAnnotationFramePath } = require("./browser-page-preload/annotation-frame-path-projection");
var { getAnnotationComposedParent } = require("./browser-page-preload/annotation-composed-parent-policy");
var { stopAnnotationEventPropagation } = require("./browser-page-preload/annotation-event-propagation-policy");
var { normalizeAnnotationText } = require("./browser-page-preload/annotation-text-normalization");
var { isAnnotationRangeIntersectingRect } = require("./browser-page-preload/annotation-range-viewport-intersection");
var { isAnnotationVisibleTextElement } = require("./browser-page-preload/annotation-visible-text-element-policy");
var { isAnnotationElementFixedOrSticky } = require("./browser-page-preload/annotation-fixed-position-policy");
var { isAnnotationAnchorOnCurrentPage, isAnnotationRectLargeEnough } = require("./browser-page-preload/annotation-anchor-viewport-policy");
var { isAnnotationRangeSelectable } = require("./browser-page-preload/annotation-range-validation");
var { resolveAnnotationTargetElement } = require("./browser-page-preload/annotation-target-element-resolver");
var { observeAnnotationShadowRoots } = require("./browser-page-preload/annotation-shadow-root-observer");
var { dispatchAnnotationSurfaceRequest, isAnnotationSurfaceResponseEvent } = require("./browser-page-preload/annotation-surface-events");
var { readAnnotationEditorDefaultMode } = require("./browser-page-preload/annotation-editor-default-mode");
var { isAnnotationTextInput } = require("./browser-page-preload/annotation-input-target");
var { isAnnotationInteractionBlocked, isAnnotationMarkerEvent, isAnnotationOverlayElement } = require("./browser-page-preload/annotation-interaction-policy");
var { hasRunningAnnotationAnimation } = require("./browser-page-preload/annotation-motion");
var { isStableAnnotationFrame } = require("./browser-page-preload/annotation-frame-stability");
var { isAnnotationContainedBy } = require("./browser-page-preload/annotation-containment");
var { findLatestDraftTextChange } = require("./browser-page-preload/annotation-draft-text");
var { parseAnnotationAttributeTokens } = require("./browser-page-preload/annotation-attribute-tokens");
var { snapshotAnnotationDesign } = require("./browser-page-preload/annotation-design-snapshot");
var { getAnnotationTargetLabel } = require("./browser-page-preload/annotation-target-label");
var { normalizeAnnotationWheelDelta } = require("./browser-page-preload/annotation-wheel-delta");
var { canScrollAnnotationAxis } = require("./browser-page-preload/annotation-scroll-boundary");
var { findScrollableAnnotationAncestor } = require("./browser-page-preload/annotation-scroll-container");
var { isClippingAnnotationOverflow, isScrollableAnnotationOverflow } = require("./browser-page-preload/annotation-overflow");
var { resolveAnnotationThemeVariant } = require("./browser-page-preload/annotation-theme");
var { readAnnotationViewportSize } = require("./browser-page-preload/annotation-viewport");
var { readAnnotationViewportState } = require("./browser-page-preload/annotation-viewport-state");
var { overrideAnnotationViewportSize } = require("./browser-page-preload/annotation-viewport-override");
var { isAnnotationElementVisible } = require("./browser-page-preload/annotation-visibility");
var { buildAnnotationRoundedRectPath, resolveAnnotationCornerRadii } = require("./browser-page-preload/annotation-preview-geometry");
var { createAnnotationPreviewVisibilityPredicate } = require("./browser-page-preload/annotation-preview-visibility");
var { createAnnotationPreviewScheduler } = require("./browser-page-preload/annotation-preview-scheduler");
var { createAnnotationPreviewController } = require("./browser-page-preload/annotation-preview-controller");
var { createAnnotationPreloadBridge } = require("./browser-page-preload/annotation-preload-bridge");
var { createAnnotationRequestContext } = require("./browser-page-preload/annotation-request-context");
var annotationDesignStyles = require("./browser-page-preload/annotation-design-styles");
var { createAnnotationDesignControlSync } = require("./browser-page-preload/annotation-design-control-sync");
var { createAnnotationSiteRequests } = require("./browser-page-preload/annotation-site-requests");
var { collectAnnotationDraftAttributes } = require("./browser-page-preload/annotation-draft-runtime");
var { createAnnotationPointerSelection } = require("./browser-page-preload/annotation-pointer-selection");
var { isAnnotationSelectionBlocked } = require("./browser-page-preload/annotation-selection");
var { resolveAnnotationDisplayAnchors } = require("./browser-page-preload/annotation-display-anchors");
var { projectAnnotationMetadataTooltipRows } = require("./browser-page-preload/annotation-metadata-tooltip");
var { areAnnotationUrlsEquivalent, getCurrentAnnotationPageUrl } = require("./browser-page-preload/annotation-url");
Yo();
annotationSerialization = createAnnotationSerialization({
  getLimits: () => es,
  parseName: (value) => as.safeParse(value),
  parseKey: (value) => ns.safeParse(value),
  parseValue: (value) => rs.safeParse(value),
  parseMetadata: (value) => is.safeParse(value),
  parseString: (value) => ts.safeParse(value),
});
var Ud = { type: `site_annotation_features_changed`, version: 1 };
ja({
  type: Ra(Ud.type),
  version: Ra(Ud.version),
  payload: ja({
    features: Aa(
      La([
        `containers`,
        `controls`,
        `surfaces`,
        `metadata`,
        `metadata-with-targets`,
        `mode-toggle`,
        `requests`,
        `requests-with-prompts`,
      ]),
    )
      .max(6)
      .refine((e) => !e.includes(`requests`) || !e.includes(`requests-with-prompts`))
      .refine((e) => !e.includes(`metadata`) || !e.includes(`metadata-with-targets`)),
  }),
});
var Wd,
  Gd = o(() => {
    (Yo(),
      (Wd = Ca()
        .min(1)
        .max(128)
        .regex(/^[^\p{Cc}\p{Cf}\p{Cs}\u2028\u2029]*$/u)));
  });
function Kd(e) {
  let t = Jd.safeParse(e);
  return t.success ? t.data : void 0;
}
var qd,
  Jd,
  Yd,
  Xd,
  Zd = o(() => {
    (Yo(),
      os(),
      Gd(),
      (qd = {
        requestEvent: `codex:annotation-surface-request`,
        responseEvent: `codex:annotation-surface-response`,
        removeEvent: `codex:annotation-surfaces-remove`,
        availableEvent: `codex:annotation-surface-available`,
        busySlot: `codex:annotation-surface-pending`,
        deadlineMs: 250,
        maxPayloadLength: 8192,
        maxIdLength: 128,
        maxRoleLength: 64,
        rolePattern: `^[a-z][a-z0-9-]*(?![\\s\\S])`,
        metadataLimits: es,
      }),
      (Jd = Ca().max(qd.maxRoleLength).regex(new RegExp(qd.rolePattern))),
      (Yd = ja({
        id: Wd,
        name: Oa().optional(),
        role: Oa().optional(),
        metadata: Oa().optional(),
        rect: ja({ x: wa(), y: wa(), width: wa().positive(), height: wa().positive() }).optional(),
      })),
      (Xd = ja({
        type: La([`registered`, `invalidated`, `disposed`, `rendering-failed`, `result`]),
        registrationId: Wd,
        requestId: Ca().max(128).optional(),
        customRendering: Ea().optional(),
        hit: Yd.nullable().optional(),
      })));
  });
Zd();
({ channels: qd, id: Wd, role: Jd, hit: Yd, response: Xd } = createAnnotationProtocol({
  object: ja,
  string: Ca,
  unknown: Oa,
  number: wa,
  boolean: Ea,
  enumValues: La,
  metadataLimits: es,
}));
function Qd(e, t) {
  let n = new Map(),
    r = null,
    i = null,
    a = !1,
    o = 0;
  if (window !== window.top || !globalThis.isSecureContext) return !1;
  let s = crypto.randomUUID(),
    c = new RegExp(e.rolePattern),
    l = Symbol.for(e.busySlot),
    u = m();
  if (u == null) return !1;
  let d = (e) => {
    if (
      a ||
      e == null ||
      !isValidAnnotationSurfaceElement(e.element, document, HTMLElement, HTMLIFrameElement) ||
      typeof e.hitTest != `function` ||
      (e.renderSelection != null && typeof e.renderSelection != `function`)
    )
      throw TypeError(
        `Annotation surfaces require a connected top-document element and hitTest callback.`,
      );
    let c = e.element,
      l = n.get(c);
    l != null && ee(l);
    let u = {
      id: `${s}-${++o}`,
      options: { element: c, hitTest: e.hitTest, renderSelection: e.renderSelection },
      renderFailed: !1,
      selection: { hoveredId: null, selectedId: null },
    };
    return (
      n.set(c, u),
      t(`surfaces`),
      C(u, `registered`),
      {
        invalidate() {
          n.get(c) === u &&
            (r?.registration === u && y(), i?.registration === u && b(), C(u, `invalidated`));
        },
        dispose() {
          n.get(c) === u && ee(u);
        },
      }
    );
  };
  try {
    if (
      !Reflect.defineProperty(u, "registerSurface", { configurable: !0, enumerable: !1, value: d })
    )
      return !1;
  } catch {
    return !1;
  }
  let f = () => {
    a = !0;
    for (let e of n.values()) ee(e);
    (p.disconnect(),
      document.removeEventListener(e.requestEvent, g),
      document.removeEventListener(e.removeEvent, f),
      document.removeEventListener(e.availableEvent, _),
      Reflect.getOwnPropertyDescriptor(u, `registerSurface`)?.value === d &&
        Reflect.deleteProperty(u, `registerSurface`));
  };
  (document.addEventListener(e.requestEvent, g),
    document.addEventListener(e.removeEvent, f),
    document.addEventListener(e.availableEvent, _));
  let p = new MutationObserver(() => {
    for (let e of n.values()) isValidAnnotationSurfaceElement(e.options.element, document, HTMLElement, HTMLIFrameElement) || ee(e);
  });
  return (p.observe(document, { childList: !0, subtree: !0 }), !0);
  function m() {
    try {
      let e = Reflect.get(document, `oai`);
      if (e == null || (typeof e != `object` && typeof e != `function`)) return null;
      let t = Reflect.get(e, `annotation`);
      return typeof t == `object` && t && !Reflect.has(t, `registerSurface`) ? t : null;
    } catch {
      return null;
    }
  }
  function h(e) {
    return (
      isValidAnnotationSurfaceElement(e, document, HTMLElement, HTMLIFrameElement)
    );
  }
  function g(t) {
    if (
      !(t instanceof CustomEvent) ||
      typeof t.detail != `string` ||
      t.detail.length > e.maxPayloadLength
    )
      return;
    let r;
    try {
      r = ne(JSON.parse(t.detail), 6);
    } catch {
      return;
    }
    if (r == null || a) return;
    if (r.type === `list`) {
      for (let e of n.values()) h(e.options.element) && C(e, `registered`);
      return;
    }
    if (r.type === `cancel` || r.type === `clear`) {
      if ((y(), b(), r.type === `clear`))
        for (let e of n.values()) x(e, { hoveredId: null, selectedId: null });
      return;
    }
    let o = t.target instanceof HTMLElement ? n.get(t.target) : null;
    if (o != null && h(o.options.element)) {
      if (r.type === `probe`) {
        C(o, `registered`);
        return;
      }
      if (r.registrationId === o.id) {
        if (r.type === `render`) {
          te(r.hoveredId) &&
            te(r.selectedId) &&
            x(o, { hoveredId: r.hoveredId, selectedId: r.selectedId });
          return;
        }
        !isValidAnnotationHitTestRequest(r, 128) ||
          (b(),
          (i = {
            registration: o,
            requestId: r.requestId,
            x: r.x,
            y: r.y,
            deadline: performance.now() + e.deadlineMs,
            timer: setTimeout(b, e.deadlineMs),
          }),
          _());
      }
    }
  }
  function _() {
    if (r != null || i == null || Reflect.getOwnPropertyDescriptor(document, l) != null) return;
    let e = i;
    ((i = null), clearTimeout(e.timer));
    let { registration: t } = e,
      n = e.deadline - performance.now();
    if (n <= 0) {
      C(t, `result`, e.requestId);
      return;
    }
    if (!Reflect.defineProperty(document, l, { configurable: !0, value: s })) {
      C(t, `result`, e.requestId);
      return;
    }
    let a = {
      registration: t,
      requestId: e.requestId,
      controller: new AbortController(),
      timer: setTimeout(y, n),
      deadline: e.deadline,
      answered: !1,
    };
    r = a;
    try {
      let n = t.options.hitTest({ clientX: e.x, clientY: e.y, signal: a.controller.signal });
      Promise.resolve(n).then(
        (e) => v(a, e),
        () => v(a, void 0),
      );
    } catch {
      v(a, void 0);
    }
  }
  function v(t, o) {
    (clearTimeout(t.timer),
      r === t &&
        (performance.now() >= t.deadline && y(),
        (r = null),
        Reflect.getOwnPropertyDescriptor(document, l)?.value === s &&
          Reflect.deleteProperty(document, l),
        t.answered
          ? i == null
            ? !a &&
              n.get(t.registration.options.element) === t.registration &&
              C(t.registration, `invalidated`)
            : _()
          : ((t.answered = !0), C(t.registration, `result`, t.requestId, re(o)), _()),
        document.dispatchEvent(new Event(e.availableEvent))));
  }
  function y() {
    r == null ||
      r.answered ||
      ((r.answered = !0),
      clearTimeout(r.timer),
      r.controller.abort(),
      C(r.registration, `result`, r.requestId));
  }
  function b() {
    if (i == null) return;
    let e = i;
    ((i = null), clearTimeout(e.timer), C(e.registration, `result`, e.requestId));
  }
  function x(e, t) {
    let n = e.options.renderSelection;
    if (shouldRenderAnnotationSelection(e.selection, t, e.renderFailed, n != null)) {
      e.selection = t;
      try {
        let r = n({ ...t });
        r != null && Promise.resolve(r).catch(() => S(e));
      } catch {
        S(e);
      }
    }
  }
  function S(e) {
    e.renderFailed ||
      ((e.renderFailed = !0),
      x(e, { hoveredId: null, selectedId: null }),
      C(e, `rendering-failed`));
  }
  function ee(e) {
    (n.delete(e.options.element),
      r?.registration === e && y(),
      i?.registration === e && b(),
      x(e, { hoveredId: null, selectedId: null }),
      C(e, `disposed`));
  }
  function C(n, r, i, a) {
    (a?.metadata != null && Object.keys(a.metadata).length > 0 && t(`metadata`),
      n.options.element.dispatchEvent(
        new CustomEvent(e.responseEvent, {
          bubbles: !0,
          detail: JSON.stringify(createAnnotationResponseDetail({
            type: r,
            registrationId: n.id,
            customRendering: n.options.renderSelection != null && !n.renderFailed,
            requestId: i,
            hit: a,
          })),
        }),
      ));
  }
  function w(t) {
    return (
      typeof t == `string` &&
      t.length > 0 &&
      t.length <= e.maxIdLength &&
      /^[^\p{Cc}\p{Cf}\p{Cs}\u2028\u2029]*$/u.test(t)
    );
  }
  function te(e) {
    return e === null || w(e);
  }
  function ne(e, t) {
    if (typeof e != `object` || !e) return null;
    let n = Object.getPrototypeOf(e);
    if (n !== Object.prototype && n != null) return null;
    let r = Object.getOwnPropertyDescriptors(e);
    if (Reflect.ownKeys(r).length > t || Reflect.ownKeys(r).some((e) => typeof e != `string`))
      return null;
    let i = Object.create(null);
    for (let [e, t] of Object.entries(r)) {
      if (
        !t.enumerable ||
        !Object.hasOwn(t, `value`) ||
        e === `__proto__` ||
        e === `constructor` ||
        e === `prototype`
      )
        return null;
      i[e] = t.value;
    }
    return i;
  }
  function re(t) {
    return sanitizeAnnotationHit(t, e);
    /* istanbul ignore next -- retained generated implementation for source parity reference */
    if (t === null) return null;
    try {
      let n = ne(t, 5);
      if (n == null || !w(n.id)) return;
      let r = { id: n.id };
      if (
        (typeof n.name == `string` &&
          n.name.trim().length > 0 &&
          n.name.length <= 128 &&
          /^[^\p{Cc}\p{Cf}\p{Cs}\u2028\u2029]*$/u.test(n.name) &&
          (r.name = n.name),
        typeof n.role == `string` &&
          n.role.length <= e.maxRoleLength &&
          c.test(n.role) &&
          (r.role = n.role),
        n.rect !== void 0)
      ) {
        let e = ne(n.rect, 4);
        if (
          e == null ||
          typeof e.x != `number` ||
          !Number.isFinite(e.x) ||
          typeof e.y != `number` ||
          !Number.isFinite(e.y) ||
          typeof e.width != `number` ||
          !Number.isFinite(e.width) ||
          e.width <= 0 ||
          typeof e.height != `number` ||
          !Number.isFinite(e.height) ||
          e.height <= 0
        )
          return;
        r.rect = { x: e.x, y: e.y, width: e.width, height: e.height };
      }
      let i = ne(n.metadata, e.metadataLimits.maxKeys);
      if (
        i != null &&
        Object.entries(i).every(
          ([t, n]) =>
            t.length <= e.metadataLimits.maxKeyLength &&
            /^[A-Za-z][A-Za-z0-9_-]*(?: [A-Za-z0-9_-]+)*$/.test(t) &&
            (n === null ||
              typeof n == `boolean` ||
              (typeof n == `number` && Number.isFinite(n)) ||
              (typeof n == `string` &&
                n.length <= e.metadataLimits.maxStringValueLength &&
                /^[^\p{Cc}\p{Cf}\p{Cs}\u2028\u2029]*$/u.test(n))),
        )
      ) {
        let t = JSON.stringify(i);
        new TextEncoder().encode(t).byteLength <= e.metadataLimits.maxSerializedBytes &&
          (r.metadata = JSON.parse(t));
      }
      return r;
    } catch {
      return;
    }
  }
}
$s();
var { createAnnotationModeController } = require("./browser-page-preload/annotation-mode-controller");
function $d(e, t, n, r) {
  return createAnnotationModeController({
    isAvailable: e,
    isActive: t,
    recordUse: n,
    toggle: r,
    registerControls: (active) => ef(active, e, t, n, r),
    installMainWorldListener: (notify) => {
      try {
        return d.contextBridge.executeInMainWorld({ func: Qd, args: [qd, notify] }) === !0;
      } catch {
        return false;
      }
    },
    removeMainWorldListener: () => document.dispatchEvent(new Event(qd.removeEvent)),
  });
}
function ef(e, t, n, r, i) {
  return d.contextBridge.executeInMainWorld({
    func: (e, t, n, r, i, a, o) => {
      let s = 0,
        c = !1,
        l = (e) => {
          if (typeof e != `object` || !e) throw TypeError(`Invalid annotation controls`);
          return serializeAnnotationControls(e, 16384);
        },
        u = {
          toggle: (e) => ({
            accepted: !c && (e === void 0 || typeof e == `boolean`) && m() && i(e),
          }),
          isActive: () => !c && a(),
          request: (r, i = {}) => {
            if (
              typeof i != `object` ||
              !i ||
              c ||
              !m() ||
              (!(r instanceof Element) && !(r instanceof Range))
            )
              return { accepted: !1 };
            let a = r instanceof Range ? r : void 0,
              s = r instanceof Range ? r.commonAncestorContainer : r,
              l = s instanceof Element ? s : s.parentElement;
            if (l == null || l.ownerDocument !== document || !l.isConnected || a?.collapsed)
              return { accepted: !1 };
            let u = l.getRootNode();
            if (a != null && u instanceof ShadowRoot && u.mode === `closed`)
              return { accepted: !1 };
            let f = a == null ? void 0 : d(a.startContainer, l),
              p = a == null ? void 0 : d(a.endContainer, l),
              h = a?.toString();
            if (
              a != null &&
              (f == null || p == null || h == null || h.trim().length === 0 || h.length > n)
            )
              return { accepted: !1 };
            let g = S(`initialComment`),
              _ = typeof g == `string` && g.length <= t ? g : void 0,
              v = S(`mode`) === `advanced` ? `advanced` : `default`,
              y = S(`enterAnnotationMode`) === !0,
              b = sanitizeAnnotationControlMetadata(S(`metadata`), e);
            (a != null || l.getRootNode() !== document) && (b = void 0);
            let x = !l.dispatchEvent(
              new CustomEvent(`codex:open-annotation`, {
                bubbles: !0,
                cancelable: !0,
                composed: !0,
                detail: createAnnotationOpenRequestDetail({ mode: v, enterAnnotationMode: y, metadata: b, initialComment: _, range: a == null ? void 0 : createAnnotationRangeDetail({ startPath: f, endPath: p, startOffset: a.startOffset, endOffset: a.endOffset, rangeText: h }) }),
              }),
            );
            return (o(b, _, x), { accepted: x });
            function S(e) {
              try {
                let t = Object.getOwnPropertyDescriptor(i, e);
                return t != null && Object.hasOwn(t, `value`) ? t.value : void 0;
              } catch {
                return;
              }
            }
          },
          registerControls: (e) => {
            if (typeof e != `object` || !e)
              throw TypeError(`Invalid annotation controls registration`);
            let t = f(e.targets);
            if (t.length === 0) throw TypeError(`Annotation controls require element targets`);
            let n = l(e);
            s += 1;
            let i = String(s);
            if (!r(`register`, { id: i, payload: n, targets: t }))
              throw TypeError(`Invalid annotation controls registration`);
            return p(i);
          },
        };
      try {
        let e = Reflect.get(document, `oai`);
        if (e != null && typeof e != `object` && typeof e != `function`) return null;
        let t = e ?? {};
        if (Reflect.get(t, `annotation`) != null) return null;
        let n = Reflect.getOwnPropertyDescriptor(document, `oai`),
          r = Reflect.getOwnPropertyDescriptor(t, `annotation`);
        if (
          !Reflect.defineProperty(t, "annotation", {
            configurable: !0,
            enumerable: !1,
            value: u,
          }) ||
          (e == null &&
            !Reflect.defineProperty(document, "oai", {
              configurable: !0,
              enumerable: !1,
              value: t,
            }))
        )
          return null;
        let i = u.toggle,
          a = u.isActive,
          o = u.request,
          s = u.registerControls;
        return () => {
          c = !0;
          try {
            (h(u, `toggle`, i, void 0),
              h(u, `isActive`, a, void 0),
              h(u, `registerControls`, s, void 0),
              h(u, `request`, o, void 0),
              Reflect.ownKeys(u).length === 0 && h(t, `annotation`, u, r),
              e == null && Reflect.ownKeys(t).length === 0 && h(document, `oai`, t, n));
          } catch {}
        };
      } catch {
        return null;
      }
      function d(e, t) {
        let n = [],
          r = e;
        for (; r !== t;) {
          let e = r.parentNode;
          if (e == null || n.length >= 128) return null;
          (n.unshift(Array.from(e.childNodes).findIndex((e) => e === r)), (r = e));
        }
        return n;
      }
      function f(e) {
        return normalizeAnnotationControlTargets(e, Element, document, 128);
      }
      function p(e) {
        return createAnnotationControlHandle(e, l, f, (t, n) => r(t, n));
      }
      function m() {
        return navigator.userActivation?.isActive === !0;
      }
      function h(e, t, n, r) {
        Reflect.getOwnPropertyDescriptor(e, t)?.value === n &&
          (r == null ? Reflect.deleteProperty(e, t) : Reflect.defineProperty(e, t, r));
      }
    },
    args: [
      es,
      240,
      Hs,
      (t, n) => {
        if (!e() || (t !== `register` && t !== `update` && t !== `dispose`)) return !1;
        let i = !window.dispatchEvent(
          new CustomEvent(`codex:${t}-annotation-controls`, { cancelable: !0, detail: n }),
        );
        return (i && t === `register` && r(`controls`), i);
      },
      (n) => {
        if (!e()) return !1;
        let a = t(n);
        return ((a || !i()) && r(`mode-toggle`), a);
      },
      n,
      (t, n, a) => {
        if (!e() || (!a && i())) return;
        r(
          typeof n == `string` && n.length <= 240 && n.trim().length > 0
            ? `requests-with-prompts`
            : `requests`,
        );
        let o = Zo(t);
        o != null && Object.keys(o).length > 0 && r(`metadata`);
      },
    ],
  });
}
function tf(e) {
  return getAnnotationControlDefaultValue(e);
}
var nf,
  rf,
  af,
  of,
  sf,
  cf,
  lf,
  uf,
  df,
  ff,
  pf = o(() => {
    (Yo(),
      (nf = Ca()
        .max(512)
        .regex(/^[^\u0000-\u001f\u007f-\u009f\u061c\u200e\u200f\u2028-\u202e\u2066-\u2069]*$/u)),
      (rf = nf.trim().min(1).max(80)),
      (af = Ca()
        .trim()
        .min(1)
        .max(80)
        .regex(/^[A-Za-z][A-Za-z0-9_-]*$/)),
      (of = Ca()
        .min(1)
        .max(80)
        .regex(/^[A-Za-z0-9_./:@$#-]+$/)),
      (sf = wa().min(-1e4).max(1e4)),
      (cf = nf.regex(/^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i)),
      (lf = Na([nf, sf, Ea()])),
      Aa(
        Ma({ label: rf, reference: of.optional(), previousValue: lf.optional(), value: lf }).refine(
          (e) => e.previousValue == null || typeof e.previousValue == typeof e.value,
          { message: `Control changes must preserve the original value type`, path: [`value`] },
        ),
      ).max(12),
      (uf = Ma({ callback: af, label: rf, reference: of.optional() })),
      (df = Pa(`type`, [
        uf.extend({ currentValue: cf.optional(), defaultValue: cf.optional(), type: Ra(`color`) }),
        uf.extend({
          currentValue: nf.optional(),
          defaultValue: nf.optional(),
          options: Aa(Ma({ label: rf, value: nf }))
            .min(1)
            .max(12),
          type: Ra(`select`),
        }),
        uf.extend({
          currentValue: sf.optional(),
          defaultValue: sf.optional(),
          max: sf,
          min: sf,
          step: wa().min(0.001).max(1e4),
          type: Ra(`range`),
        }),
        uf.extend({
          currentValue: Ea().optional(),
          defaultValue: Ea().optional(),
          type: Ra(`toggle`),
        }),
      ]).superRefine((e, t) => {
        if (e.type === `range`) {
          (e.min >= e.max || e.step > e.max - e.min) &&
            t.addIssue({
              code: `custom`,
              message: `Ranges require valid bounds and step`,
              path: [`min`],
            });
          for (let n of [`currentValue`, `defaultValue`]) {
            let r = e[n];
            r != null &&
              (r < e.min || r > e.max) &&
              t.addIssue({
                code: `custom`,
                message: `Range control values must be within bounds`,
                path: [n],
              });
          }
          return;
        }
        if (e.type !== `select`) return;
        let n = new Set(e.options.map((e) => e.value));
        n.size !== e.options.length &&
          t.addIssue({
            code: `custom`,
            message: `Selection controls require distinct options`,
            path: [`options`],
          });
        for (let r of [`currentValue`, `defaultValue`]) {
          let i = e[r];
          i != null &&
            !n.has(i) &&
            t.addIssue({
              code: `custom`,
              message: `Selection control values must match an option`,
              path: [r],
            });
        }
      })),
      Ma({ callback: af, previousValue: lf.optional(), value: lf }).superRefine((e, t) => {
        e.previousValue != null &&
          typeof e.previousValue != typeof e.value &&
          t.addIssue({
            code: `custom`,
            message: `Control changes must preserve the original value type`,
            path: [`value`],
          });
      }),
      (ff = Ma({
        controls: Aa(df).max(12),
        controlsHeading: rf.optional(),
        controlsMode: La([`extend`, `replace`]).optional(),
      }).superRefine(({ controls: e }, t) => {
        new Set(e.map((e) => e.callback)).size !== e.length &&
          t.addIssue({
            code: `custom`,
            message: `Each control must have a unique callback`,
            path: [`controls`],
          });
      })));
  });
(pf(), Yo());
var mf = 64,
  hf = 128,
  gf = 1024,
  _f = 16384,
  vf = `codex:register-annotation-controls`,
  yf = `codex:update-annotation-controls`,
  bf = `codex:dispose-annotation-controls`,
  xf = `codex-browser-sidebar-comments-root`,
  Sf = Ma({
    controls: ff.shape.controls.optional(),
    controlsHeading: ff.shape.controlsHeading,
    controlsMode: ff.shape.controlsMode,
  });
function Cf() {
  return createAnnotationControlsRegistry({
    documentRef: document,
    windowRef: window,
    registerEvent: vf,
    updateEvent: yf,
    disposeEvent: bf,
    pagehideEvent: `pagehide`,
    maxControls: mf,
    maxTotalTargets: gf,
    readDetail: wf,
    readField: Tf,
    parsePayload: (value, current) => Ef(value, current),
    parseTargets: (value) => Df(document, value),
    attachTargets: attachAnnotationControlTargets,
    detachTargets: detachAnnotationControlTargets,
    collectTargets: collectAnnotationControlTargets,
    getControls: getAnnotationControlsForTarget,
    isValidTarget: (target) => target instanceof HTMLElement && target.isConnected && target.ownerDocument === document,
    shouldDisposePagehide: shouldDisposeAnnotationRegistryOnPagehide,
  });
}
function wf(e) {
  return readAnnotationEventDetail(e);
}
function Tf(e, t) {
  return readAnnotationEventField(e, t);
}
function Ef(e, t) {
  return parseAnnotationControlsPayload(e, (e) => ff.safeParse(e), (e) => Sf.safeParse(e), t, _f);
}
function Df(e, t) {
  return parseAnnotationControlTargetList(t, e, Element, (t) => Of(e, t), hf);
}
function Of(e, t) {
  return isAnnotationSidebarTarget(t, { getRoot: () => e.getElementById?.(xf) });
}
$s();
var kf = `oai-annotation-container`,
  Af = `oai-annotation-container-text`,
  jf = `oai-annotation-metadata`,
  Mf = `oai-annotatable`,
  Nf = `codex:annotation-shadow-root-attached`,
  Pf = { childList: !0, subtree: !0, attributes: !0, attributeFilter: [kf, Af, jf, Mf] };
function Ff(e) {
  return installAnnotationSurfaceObserver({
    documentRef: document,
    windowRef: window,
    elementConstructor: Element,
    htmlElementConstructor: HTMLElement,
    mutationObserverConstructor: MutationObserver,
    shadowEvent: Nf,
    containersAttribute: kf,
    containerTextAttribute: Af,
    metadataAttribute: jf,
    annotatableAttribute: Mf,
    observerOptions: Pf,
    parseMetadata: Qo,
    executeInMainWorld: (args) => d.contextBridge.executeInMainWorld(args),
    onFeaturesChanged: (features) => e(features),
  });
  /* istanbul ignore next -- retained generated implementation for source parity reference */
  let t = new Set(),
    n = new Set(),
    r = new Set(),
    i = new Map(),
    a = !1,
    o = !1,
    s = () => e([...t]),
    c = () => {
      for (let e of n)
        (!e.isConnected ||
          e.ownerDocument !== document ||
          (!e.hasAttribute(kf) && !e.hasAttribute(Af))) &&
          n.delete(e);
      for (let e of r) (!e.isConnected || e.ownerDocument !== document) && r.delete(e);
      for (let [e, t] of i)
        (!e.host.isConnected || e.host.ownerDocument !== document) && (t.disconnect(), i.delete(e));
      let e = t.has(`containers`),
        a = r.size > 0 ? `metadata-with-targets` : `metadata`,
        c = t.has(a),
        l = r.size > 0 || o,
        u = t.delete(a === `metadata` ? `metadata-with-targets` : `metadata`);
      (n.size > 0 ? t.add(`containers`) : t.delete(`containers`),
        l ? t.add(a) : t.delete(a),
        (e !== t.has(`containers`) || c !== l || u) && s());
    },
    l = (e) => {
      if (!e.isConnected || e.ownerDocument !== document) return;
      (e.hasAttribute(kf) || e.hasAttribute(Af)) && n.add(e);
      let t =
        e instanceof HTMLElement &&
        e !== document.body &&
        e !== document.documentElement &&
        e.hasAttribute(Mf)
          ? Qo(e.getAttribute(jf))
          : void 0;
      t != null && Object.keys(t).length > 0 ? r.add(e) : r.delete(e);
      let a = e.shadowRoot;
      if (a != null && !i.has(a)) {
        let e = new MutationObserver(f);
        (e.observe(a, Pf), i.set(a, e), a.querySelectorAll(`*`).forEach(l));
      }
    },
    u = (e) => {
      e.isConnected && e.ownerDocument === document && (l(e), e.querySelectorAll(`*`).forEach(l));
    };
  function f(e) {
    for (let t of e)
      if (t.type === `attributes` && t.target instanceof Element) l(t.target);
      else for (let e of t.addedNodes) e instanceof Element && u(e);
    c();
  }
  let p = (e) => {
      let t = e.composedPath()[0];
      t instanceof Element && (u(t), c());
    },
    m = new MutationObserver(f);
  (m.observe(document, Pf), document.addEventListener(Nf, p));
  let h = d.contextBridge.executeInMainWorld({ func: If, args: [Nf] });
  return (
    document.querySelectorAll(`*`).forEach(l),
    c(),
    window.addEventListener(`pageshow`, s),
    {
      recordUse(e) {
        if (!(a || (e === `requests` && t.has(`requests-with-prompts`)))) {
          if (e === `metadata`) {
            ((o = !0), c());
            return;
          }
          (e === `requests-with-prompts` && t.delete(`requests`), t.has(e) || (t.add(e), s()));
        }
      },
      dispose() {
        ((a = !0), m.disconnect());
        for (let e of i.values()) e.disconnect();
        (i.clear(),
          n.clear(),
          r.clear(),
          h?.(),
          document.removeEventListener(Nf, p),
          window.removeEventListener(`pageshow`, s),
          t.clear(),
          s());
      },
    }
  );
}
function If(e) {
  let t = Object.getOwnPropertyDescriptor(Element.prototype, `attachShadow`),
    n = Element.prototype.attachShadow;
  if (t?.configurable !== !0 || typeof n != `function`) return null;
  let r = !0;
  function i(t) {
    let i = Reflect.apply(n, this, [t]);
    return (
      r && i.mode === `open` && this.dispatchEvent(new Event(e, { bubbles: !0, composed: !0 })),
      i
    );
  }
  return Reflect.defineProperty(Element.prototype, "attachShadow", { ...t, value: i })
    ? () => {
        ((r = !1),
          Reflect.getOwnPropertyDescriptor(Element.prototype, `attachShadow`)?.value === i &&
            Reflect.defineProperty(Element.prototype, "attachShadow", t));
      }
    : null;
}
function Lf(e, t) {
  return reduceAnnotationSidebarEditorTransition(e, t);
}
var Rf = function (e, t, n) {
    let r = Promise.resolve();
    function i(e) {
      let t = new Event(`vite:preloadError`, { cancelable: !0 });
      if (((t.payload = e), window.dispatchEvent(t), !t.defaultPrevented)) throw e;
    }
    return r.then((t) => {
      for (let e of t || []) e.status === `rejected` && i(e.reason);
      return e().catch(i);
    });
  },
  zf = s((e) => {
    var t = Symbol.for(`react.transitional.element`),
      n = Symbol.for(`react.portal`),
      r = Symbol.for(`react.fragment`),
      i = Symbol.for(`react.strict_mode`),
      a = Symbol.for(`react.profiler`),
      o = Symbol.for(`react.consumer`),
      s = Symbol.for(`react.context`),
      c = Symbol.for(`react.forward_ref`),
      l = Symbol.for(`react.suspense`),
      u = Symbol.for(`react.memo`),
      d = Symbol.for(`react.lazy`),
      f = Symbol.for(`react.activity`),
      p = Symbol.iterator;
    function m(e) {
      return typeof e != `object` || !e
        ? null
        : ((e = (p && e[p]) || e[`@@iterator`]), typeof e == `function` ? e : null);
    }
    var h = {
        isMounted: function () {
          return !1;
        },
        enqueueForceUpdate: function () {},
        enqueueReplaceState: function () {},
        enqueueSetState: function () {},
      },
      g = Object.assign,
      _ = {};
    function v(e, t, n) {
      ((this.props = e), (this.context = t), (this.refs = _), (this.updater = n || h));
    }
    ((v.prototype.isReactComponent = {}),
      (v.prototype.setState = function (e, t) {
        if (typeof e != `object` && typeof e != `function` && e != null)
          throw Error(
            `takes an object of state variables to update or a function which returns an object of state variables.`,
          );
        this.updater.enqueueSetState(this, e, t, `setState`);
      }),
      (v.prototype.forceUpdate = function (e) {
        this.updater.enqueueForceUpdate(this, e, `forceUpdate`);
      }));
    function y() {}
    y.prototype = v.prototype;
    function b(e, t, n) {
      ((this.props = e), (this.context = t), (this.refs = _), (this.updater = n || h));
    }
    var x = (b.prototype = new y());
    ((x.constructor = b), g(x, v.prototype), (x.isPureReactComponent = !0));
    var S = Array.isArray;
    function ee() {}
    var C = { H: null, A: null, T: null, S: null },
      w = Object.prototype.hasOwnProperty;
    function te(e, n, r) {
      var i = r.ref;
      return { $$typeof: t, type: e, key: n, ref: i === void 0 ? null : i, props: r };
    }
    function ne(e, t) {
      return te(e.type, t, e.props);
    }
    function re(e) {
      return typeof e == `object` && !!e && e.$$typeof === t;
    }
    function ie(e) {
      var t = { "=": `=0`, ":": `=2` };
      return (
        `$` +
        e.replace(/[=:]/g, function (e) {
          return t[e];
        })
      );
    }
    var ae = /\/+/g;
    function oe(e, t) {
      return typeof e == `object` && e && e.key != null ? ie(`` + e.key) : t.toString(36);
    }
    function se(e) {
      switch (e.status) {
        case `fulfilled`:
          return e.value;
        case `rejected`:
          throw e.reason;
        default:
          switch (
            (typeof e.status == `string`
              ? e.then(ee, ee)
              : ((e.status = `pending`),
                e.then(
                  function (t) {
                    e.status === `pending` && ((e.status = `fulfilled`), (e.value = t));
                  },
                  function (t) {
                    e.status === `pending` && ((e.status = `rejected`), (e.reason = t));
                  },
                )),
            e.status)
          ) {
            case `fulfilled`:
              return e.value;
            case `rejected`:
              throw e.reason;
          }
      }
      throw e;
    }
    function T(e, r, i, a, o) {
      var s = typeof e;
      (s === `undefined` || s === `boolean`) && (e = null);
      var c = !1;
      if (e === null) c = !0;
      else
        switch (s) {
          case `bigint`:
          case `string`:
          case `number`:
            c = !0;
            break;
          case `object`:
            switch (e.$$typeof) {
              case t:
              case n:
                c = !0;
                break;
              case d:
                return ((c = e._init), T(c(e._payload), r, i, a, o));
            }
        }
      if (c)
        return (
          (o = o(e)),
          (c = a === `` ? `.` + oe(e, 0) : a),
          S(o)
            ? ((i = ``),
              c != null && (i = c.replace(ae, `$&/`) + `/`),
              T(o, r, i, ``, function (e) {
                return e;
              }))
            : o != null &&
              (re(o) &&
                (o = ne(
                  o,
                  i +
                    (o.key == null || (e && e.key === o.key)
                      ? ``
                      : (`` + o.key).replace(ae, `$&/`) + `/`) +
                    c,
                )),
              r.push(o)),
          1
        );
      c = 0;
      var l = a === `` ? `.` : a + `:`;
      if (S(e))
        for (var u = 0; u < e.length; u++)
          ((a = e[u]), (s = l + oe(a, u)), (c += T(a, r, i, s, o)));
      else if (((u = m(e)), typeof u == `function`))
        for (e = u.call(e), u = 0; !(a = e.next()).done;)
          ((a = a.value), (s = l + oe(a, u++)), (c += T(a, r, i, s, o)));
      else if (s === `object`) {
        if (typeof e.then == `function`) return T(se(e), r, i, a, o);
        throw (
          (r = String(e)),
          Error(
            `Objects are not valid as a React child (found: ` +
              (r === `[object Object]`
                ? `object with keys {` + Object.keys(e).join(`, `) + `}`
                : r) +
              `). If you meant to render a collection of children, use an array instead.`,
          )
        );
      }
      return c;
    }
    function E(e, t, n) {
      if (e == null) return e;
      var r = [],
        i = 0;
      return (
        T(e, r, ``, ``, function (e) {
          return t.call(n, e, i++);
        }),
        r
      );
    }
    function D(e) {
      if (e._status === -1) {
        var t = e._result;
        ((t = t()),
          t.then(
            function (t) {
              (e._status === 0 || e._status === -1) && ((e._status = 1), (e._result = t));
            },
            function (t) {
              (e._status === 0 || e._status === -1) && ((e._status = 2), (e._result = t));
            },
          ),
          e._status === -1 && ((e._status = 0), (e._result = t)));
      }
      if (e._status === 1) return e._result.default;
      throw e._result;
    }
    var ce =
        typeof reportError == `function`
          ? reportError
          : function (e) {
              if (typeof window == `object` && typeof window.ErrorEvent == `function`) {
                var t = new window.ErrorEvent(`error`, {
                  bubbles: !0,
                  cancelable: !0,
                  message:
                    typeof e == `object` && e && typeof e.message == `string`
                      ? String(e.message)
                      : String(e),
                  error: e,
                });
                if (!window.dispatchEvent(t)) return;
              } else if (typeof process == `object` && typeof process.emit == `function`) {
                process.emit(`uncaughtException`, e);
                return;
              }
              console.error(e);
            },
      le = {
        map: E,
        forEach: function (e, t, n) {
          E(
            e,
            function () {
              t.apply(this, arguments);
            },
            n,
          );
        },
        count: function (e) {
          var t = 0;
          return (
            E(e, function () {
              t++;
            }),
            t
          );
        },
        toArray: function (e) {
          return (
            E(e, function (e) {
              return e;
            }) || []
          );
        },
        only: function (e) {
          if (!re(e))
            throw Error(`React.Children.only expected to receive a single React element child.`);
          return e;
        },
      };
    ((e.Activity = f),
      (e.Children = le),
      (e.Component = v),
      (e.Fragment = r),
      (e.Profiler = a),
      (e.PureComponent = b),
      (e.StrictMode = i),
      (e.Suspense = l),
      (e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = C),
      (e.__COMPILER_RUNTIME = {
        __proto__: null,
        c: function (e) {
          return C.H.useMemoCache(e);
        },
      }),
      (e.cache = function (e) {
        return function () {
          return e.apply(null, arguments);
        };
      }),
      (e.cacheSignal = function () {
        return null;
      }),
      (e.cloneElement = function (e, t, n) {
        if (e == null)
          throw Error(`The argument must be a React element, but you passed ` + e + `.`);
        var r = g({}, e.props),
          i = e.key;
        if (t != null)
          for (a in (t.key !== void 0 && (i = `` + t.key), t))
            !w.call(t, a) ||
              a === `key` ||
              a === `__self` ||
              a === `__source` ||
              (a === `ref` && t.ref === void 0) ||
              (r[a] = t[a]);
        var a = arguments.length - 2;
        if (a === 1) r.children = n;
        else if (1 < a) {
          for (var o = Array(a), s = 0; s < a; s++) o[s] = arguments[s + 2];
          r.children = o;
        }
        return te(e.type, i, r);
      }),
      (e.createContext = function (e) {
        return (
          (e = {
            $$typeof: s,
            _currentValue: e,
            _currentValue2: e,
            _threadCount: 0,
            Provider: null,
            Consumer: null,
          }),
          (e.Provider = e),
          (e.Consumer = { $$typeof: o, _context: e }),
          e
        );
      }),
      (e.createElement = function (e, t, n) {
        var r,
          i = {},
          a = null;
        if (t != null)
          for (r in (t.key !== void 0 && (a = `` + t.key), t))
            w.call(t, r) && r !== `key` && r !== `__self` && r !== `__source` && (i[r] = t[r]);
        var o = arguments.length - 2;
        if (o === 1) i.children = n;
        else if (1 < o) {
          for (var s = Array(o), c = 0; c < o; c++) s[c] = arguments[c + 2];
          i.children = s;
        }
        if (e && e.defaultProps)
          for (r in ((o = e.defaultProps), o)) i[r] === void 0 && (i[r] = o[r]);
        return te(e, a, i);
      }),
      (e.createRef = function () {
        return { current: null };
      }),
      (e.forwardRef = function (e) {
        return { $$typeof: c, render: e };
      }),
      (e.isValidElement = re),
      (e.lazy = function (e) {
        return { $$typeof: d, _payload: { _status: -1, _result: e }, _init: D };
      }),
      (e.memo = function (e, t) {
        return { $$typeof: u, type: e, compare: t === void 0 ? null : t };
      }),
      (e.startTransition = function (e) {
        var t = C.T,
          n = {};
        C.T = n;
        try {
          var r = e(),
            i = C.S;
          (i !== null && i(n, r),
            typeof r == `object` && r && typeof r.then == `function` && r.then(ee, ce));
        } catch (e) {
          ce(e);
        } finally {
          (t !== null && n.types !== null && (t.types = n.types), (C.T = t));
        }
      }),
      (e.unstable_useCacheRefresh = function () {
        return C.H.useCacheRefresh();
      }),
      (e.use = function (e) {
        return C.H.use(e);
      }),
      (e.useActionState = function (e, t, n) {
        return C.H.useActionState(e, t, n);
      }),
      (e.useCallback = function (e, t) {
        return C.H.useCallback(e, t);
      }),
      (e.useContext = function (e) {
        return C.H.useContext(e);
      }),
      (e.useDebugValue = function () {}),
      (e.useDeferredValue = function (e, t) {
        return C.H.useDeferredValue(e, t);
      }),
      (e.useEffect = function (e, t) {
        return C.H.useEffect(e, t);
      }),
      (e.useEffectEvent = function (e) {
        return C.H.useEffectEvent(e);
      }),
      (e.useId = function () {
        return C.H.useId();
      }),
      (e.useImperativeHandle = function (e, t, n) {
        return C.H.useImperativeHandle(e, t, n);
      }),
      (e.useInsertionEffect = function (e, t) {
        return C.H.useInsertionEffect(e, t);
      }),
      (e.useLayoutEffect = function (e, t) {
        return C.H.useLayoutEffect(e, t);
      }),
      (e.useMemo = function (e, t) {
        return C.H.useMemo(e, t);
      }),
      (e.useOptimistic = function (e, t) {
        return C.H.useOptimistic(e, t);
      }),
      (e.useReducer = function (e, t, n) {
        return C.H.useReducer(e, t, n);
      }),
      (e.useRef = function (e) {
        return C.H.useRef(e);
      }),
      (e.useState = function (e) {
        return C.H.useState(e);
      }),
      (e.useSyncExternalStore = function (e, t, n) {
        return C.H.useSyncExternalStore(e, t, n);
      }),
      (e.useTransition = function () {
        return C.H.useTransition();
      }),
      (e.version = `19.2.7`));
  }),
  Bf = s((e, t) => {
    t.exports = zf();
  }),
  Vf = s((e) => {
    var t = Bf();
    function n(e) {
      var t = `https://react.dev/errors/` + e;
      if (1 < arguments.length) {
        t += `?args[]=` + encodeURIComponent(arguments[1]);
        for (var n = 2; n < arguments.length; n++)
          t += `&args[]=` + encodeURIComponent(arguments[n]);
      }
      return (
        `Minified React error #` +
        e +
        `; visit ` +
        t +
        ` for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`
      );
    }
    function r() {}
    var i = {
        d: {
          f: r,
          r: function () {
            throw Error(n(522));
          },
          D: r,
          C: r,
          L: r,
          m: r,
          X: r,
          S: r,
          M: r,
        },
        p: 0,
        findDOMNode: null,
      },
      a = Symbol.for(`react.portal`);
    function o(e, t, n) {
      var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
      return {
        $$typeof: a,
        key: r == null ? null : `` + r,
        children: e,
        containerInfo: t,
        implementation: n,
      };
    }
    var s = t.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
    function c(e, t) {
      if (e === `font`) return ``;
      if (typeof t == `string`) return t === `use-credentials` ? t : ``;
    }
    ((e.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = i),
      (e.createPortal = function (e, t) {
        var r = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
        if (!t || (t.nodeType !== 1 && t.nodeType !== 9 && t.nodeType !== 11)) throw Error(n(299));
        return o(e, t, null, r);
      }),
      (e.flushSync = function (e) {
        var t = s.T,
          n = i.p;
        try {
          if (((s.T = null), (i.p = 2), e)) return e();
        } finally {
          ((s.T = t), (i.p = n), i.d.f());
        }
      }),
      (e.preconnect = function (e, t) {
        typeof e == `string` &&
          (t
            ? ((t = t.crossOrigin),
              (t = typeof t == `string` ? (t === `use-credentials` ? t : ``) : void 0))
            : (t = null),
          i.d.C(e, t));
      }),
      (e.prefetchDNS = function (e) {
        typeof e == `string` && i.d.D(e);
      }),
      (e.preinit = function (e, t) {
        if (typeof e == `string` && t && typeof t.as == `string`) {
          var n = t.as,
            r = c(n, t.crossOrigin),
            a = typeof t.integrity == `string` ? t.integrity : void 0,
            o = typeof t.fetchPriority == `string` ? t.fetchPriority : void 0;
          n === `style`
            ? i.d.S(e, typeof t.precedence == `string` ? t.precedence : void 0, {
                crossOrigin: r,
                integrity: a,
                fetchPriority: o,
              })
            : n === `script` &&
              i.d.X(e, {
                crossOrigin: r,
                integrity: a,
                fetchPriority: o,
                nonce: typeof t.nonce == `string` ? t.nonce : void 0,
              });
        }
      }),
      (e.preinitModule = function (e, t) {
        if (typeof e == `string`) {
          if (typeof t == `object` && t) {
            if (t.as == null || t.as === `script`) {
              var n = c(t.as, t.crossOrigin);
              i.d.M(e, {
                crossOrigin: n,
                integrity: typeof t.integrity == `string` ? t.integrity : void 0,
                nonce: typeof t.nonce == `string` ? t.nonce : void 0,
              });
            }
          } else t ?? i.d.M(e);
        }
      }),
      (e.preload = function (e, t) {
        if (typeof e == `string` && typeof t == `object` && t && typeof t.as == `string`) {
          var n = t.as,
            r = c(n, t.crossOrigin);
          i.d.L(e, n, {
            crossOrigin: r,
            integrity: typeof t.integrity == `string` ? t.integrity : void 0,
            nonce: typeof t.nonce == `string` ? t.nonce : void 0,
            type: typeof t.type == `string` ? t.type : void 0,
            fetchPriority: typeof t.fetchPriority == `string` ? t.fetchPriority : void 0,
            referrerPolicy: typeof t.referrerPolicy == `string` ? t.referrerPolicy : void 0,
            imageSrcSet: typeof t.imageSrcSet == `string` ? t.imageSrcSet : void 0,
            imageSizes: typeof t.imageSizes == `string` ? t.imageSizes : void 0,
            media: typeof t.media == `string` ? t.media : void 0,
          });
        }
      }),
      (e.preloadModule = function (e, t) {
        if (typeof e == `string`) {
          if (t) {
            var n = c(t.as, t.crossOrigin);
            i.d.m(e, {
              as: typeof t.as == `string` && t.as !== `script` ? t.as : void 0,
              crossOrigin: n,
              integrity: typeof t.integrity == `string` ? t.integrity : void 0,
            });
          } else i.d.m(e);
        }
      }),
      (e.requestFormReset = function (e) {
        i.d.r(e);
      }),
      (e.unstable_batchedUpdates = function (e, t) {
        return e(t);
      }),
      (e.useFormState = function (e, t, n) {
        return s.H.useFormState(e, t, n);
      }),
      (e.useFormStatus = function () {
        return s.H.useHostTransitionStatus();
      }),
      (e.version = `19.2.7`));
  }),
  Hf = s((e, t) => {
    function n() {
      if (!(
        typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > `u` ||
        typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != `function`
      ))
        try {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
        } catch (e) {
          console.error(e);
        }
    }
    (n(), (t.exports = Vf()));
  }),
  Uf = s((e) => {
    function t(e, t) {
      var n = e.length;
      e.push(t);
      a: for (; 0 < n;) {
        var r = (n - 1) >>> 1,
          a = e[r];
        if (0 < i(a, t)) ((e[r] = t), (e[n] = a), (n = r));
        else break a;
      }
    }
    function n(e) {
      return e.length === 0 ? null : e[0];
    }
    function r(e) {
      if (e.length === 0) return null;
      var t = e[0],
        n = e.pop();
      if (n !== t) {
        e[0] = n;
        a: for (var r = 0, a = e.length, o = a >>> 1; r < o;) {
          var s = 2 * (r + 1) - 1,
            c = e[s],
            l = s + 1,
            u = e[l];
          if (0 > i(c, n))
            l < a && 0 > i(u, c)
              ? ((e[r] = u), (e[l] = n), (r = l))
              : ((e[r] = c), (e[s] = n), (r = s));
          else if (l < a && 0 > i(u, n)) ((e[r] = u), (e[l] = n), (r = l));
          else break a;
        }
      }
      return t;
    }
    function i(e, t) {
      var n = e.sortIndex - t.sortIndex;
      return n === 0 ? e.id - t.id : n;
    }
    if (
      ((e.unstable_now = void 0),
      typeof performance == `object` && typeof performance.now == `function`)
    ) {
      var a = performance;
      e.unstable_now = function () {
        return a.now();
      };
    } else {
      var o = Date,
        s = o.now();
      e.unstable_now = function () {
        return o.now() - s;
      };
    }
    var c = [],
      l = [],
      u = 1,
      d = null,
      f = 3,
      p = !1,
      m = !1,
      h = !1,
      g = !1,
      _ = typeof setTimeout == `function` ? setTimeout : null,
      v = typeof clearTimeout == `function` ? clearTimeout : null,
      y = typeof setImmediate < `u` ? setImmediate : null;
    function b(e) {
      for (var i = n(l); i !== null;) {
        if (i.callback === null) r(l);
        else if (i.startTime <= e) (r(l), (i.sortIndex = i.expirationTime), t(c, i));
        else break;
        i = n(l);
      }
    }
    function x(e) {
      if (((h = !1), b(e), !m)) {
        if (n(c) !== null) ((m = !0), S || ((S = !0), re()));
        else {
          var t = n(l);
          t !== null && oe(x, t.startTime - e);
        }
      }
    }
    var S = !1,
      ee = -1,
      C = 5,
      w = -1;
    function te() {
      return g ? !0 : !(e.unstable_now() - w < C);
    }
    function ne() {
      if (((g = !1), S)) {
        var t = e.unstable_now();
        w = t;
        var i = !0;
        try {
          a: {
            ((m = !1), h && ((h = !1), v(ee), (ee = -1)), (p = !0));
            var a = f;
            try {
              b: {
                for (b(t), d = n(c); d !== null && !(d.expirationTime > t && te());) {
                  var o = d.callback;
                  if (typeof o == `function`) {
                    ((d.callback = null), (f = d.priorityLevel));
                    var s = o(d.expirationTime <= t);
                    if (((t = e.unstable_now()), typeof s == `function`)) {
                      ((d.callback = s), b(t), (i = !0));
                      break b;
                    }
                    (d === n(c) && r(c), b(t));
                  } else r(c);
                  d = n(c);
                }
                if (d !== null) i = !0;
                else {
                  var u = n(l);
                  (u !== null && oe(x, u.startTime - t), (i = !1));
                }
              }
              break a;
            } finally {
              ((d = null), (f = a), (p = !1));
            }
            i = void 0;
          }
        } finally {
          i ? re() : (S = !1);
        }
      }
    }
    var re;
    if (typeof y == `function`)
      re = function () {
        y(ne);
      };
    else if (typeof MessageChannel < `u`) {
      var ie = new MessageChannel(),
        ae = ie.port2;
      ((ie.port1.onmessage = ne),
        (re = function () {
          ae.postMessage(null);
        }));
    } else
      re = function () {
        _(ne, 0);
      };
    function oe(t, n) {
      ee = _(function () {
        t(e.unstable_now());
      }, n);
    }
    ((e.unstable_IdlePriority = 5),
      (e.unstable_ImmediatePriority = 1),
      (e.unstable_LowPriority = 4),
      (e.unstable_NormalPriority = 3),
      (e.unstable_Profiling = null),
      (e.unstable_UserBlockingPriority = 2),
      (e.unstable_cancelCallback = function (e) {
        e.callback = null;
      }),
      (e.unstable_forceFrameRate = function (e) {
        0 > e || 125 < e
          ? console.error(
              `forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported`,
            )
          : (C = 0 < e ? Math.floor(1e3 / e) : 5);
      }),
      (e.unstable_getCurrentPriorityLevel = function () {
        return f;
      }),
      (e.unstable_next = function (e) {
        switch (f) {
          case 1:
          case 2:
          case 3:
            var t = 3;
            break;
          default:
            t = f;
        }
        var n = f;
        f = t;
        try {
          return e();
        } finally {
          f = n;
        }
      }),
      (e.unstable_requestPaint = function () {
        g = !0;
      }),
      (e.unstable_runWithPriority = function (e, t) {
        switch (e) {
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
            break;
          default:
            e = 3;
        }
        var n = f;
        f = e;
        try {
          return t();
        } finally {
          f = n;
        }
      }),
      (e.unstable_scheduleCallback = function (r, i, a) {
        var o = e.unstable_now();
        switch (
          (typeof a == `object` && a
            ? ((a = a.delay), (a = typeof a == `number` && 0 < a ? o + a : o))
            : (a = o),
          r)
        ) {
          case 1:
            var s = -1;
            break;
          case 2:
            s = 250;
            break;
          case 5:
            s = 1073741823;
            break;
          case 4:
            s = 1e4;
            break;
          default:
            s = 5e3;
        }
        return (
          (s = a + s),
          (r = {
            id: u++,
            callback: i,
            priorityLevel: r,
            startTime: a,
            expirationTime: s,
            sortIndex: -1,
          }),
          a > o
            ? ((r.sortIndex = a),
              t(l, r),
              n(c) === null && r === n(l) && (h ? (v(ee), (ee = -1)) : (h = !0), oe(x, a - o)))
            : ((r.sortIndex = s), t(c, r), m || p || ((m = !0), S || ((S = !0), re()))),
          r
        );
      }),
      (e.unstable_shouldYield = te),
      (e.unstable_wrapCallback = function (e) {
        var t = f;
        return function () {
          var n = f;
          f = t;
          try {
            return e.apply(this, arguments);
          } finally {
            f = n;
          }
        };
      }));
  }),
  Wf = s((e, t) => {
    t.exports = Uf();
  }),
  Gf = s((e) => {
    var t = Wf(),
      n = Bf(),
      r = Hf();
    function i(e) {
      var t = `https://react.dev/errors/` + e;
      if (1 < arguments.length) {
        t += `?args[]=` + encodeURIComponent(arguments[1]);
        for (var n = 2; n < arguments.length; n++)
          t += `&args[]=` + encodeURIComponent(arguments[n]);
      }
      return (
        `Minified React error #` +
        e +
        `; visit ` +
        t +
        ` for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`
      );
    }
    function a(e) {
      return !(!e || (e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11));
    }
    function o(e) {
      var t = e,
        n = e;
      if (e.alternate) for (; t.return;) t = t.return;
      else {
        e = t;
        do ((t = e), t.flags & 4098 && (n = t.return), (e = t.return));
        while (e);
      }
      return t.tag === 3 ? n : null;
    }
    function s(e) {
      if (e.tag === 13) {
        var t = e.memoizedState;
        if ((t === null && ((e = e.alternate), e !== null && (t = e.memoizedState)), t !== null))
          return t.dehydrated;
      }
      return null;
    }
    function c(e) {
      if (e.tag === 31) {
        var t = e.memoizedState;
        if ((t === null && ((e = e.alternate), e !== null && (t = e.memoizedState)), t !== null))
          return t.dehydrated;
      }
      return null;
    }
    function l(e) {
      if (o(e) !== e) throw Error(i(188));
    }
    function u(e) {
      var t = e.alternate;
      if (!t) {
        if (((t = o(e)), t === null)) throw Error(i(188));
        return t === e ? e : null;
      }
      for (var n = e, r = t; ;) {
        var a = n.return;
        if (a === null) break;
        var s = a.alternate;
        if (s === null) {
          if (((r = a.return), r !== null)) {
            n = r;
            continue;
          }
          break;
        }
        if (a.child === s.child) {
          for (s = a.child; s;) {
            if (s === n) return (l(a), e);
            if (s === r) return (l(a), t);
            s = s.sibling;
          }
          throw Error(i(188));
        }
        if (n.return !== r.return) ((n = a), (r = s));
        else {
          for (var c = !1, u = a.child; u;) {
            if (u === n) {
              ((c = !0), (n = a), (r = s));
              break;
            }
            if (u === r) {
              ((c = !0), (r = a), (n = s));
              break;
            }
            u = u.sibling;
          }
          if (!c) {
            for (u = s.child; u;) {
              if (u === n) {
                ((c = !0), (n = s), (r = a));
                break;
              }
              if (u === r) {
                ((c = !0), (r = s), (n = a));
                break;
              }
              u = u.sibling;
            }
            if (!c) throw Error(i(189));
          }
        }
        if (n.alternate !== r) throw Error(i(190));
      }
      if (n.tag !== 3) throw Error(i(188));
      return n.stateNode.current === n ? e : t;
    }
    function d(e) {
      var t = e.tag;
      if (t === 5 || t === 26 || t === 27 || t === 6) return e;
      for (e = e.child; e !== null;) {
        if (((t = d(e)), t !== null)) return t;
        e = e.sibling;
      }
      return null;
    }
    var f = Object.assign,
      p = Symbol.for(`react.element`),
      m = Symbol.for(`react.transitional.element`),
      h = Symbol.for(`react.portal`),
      g = Symbol.for(`react.fragment`),
      _ = Symbol.for(`react.strict_mode`),
      v = Symbol.for(`react.profiler`),
      y = Symbol.for(`react.consumer`),
      b = Symbol.for(`react.context`),
      x = Symbol.for(`react.forward_ref`),
      S = Symbol.for(`react.suspense`),
      ee = Symbol.for(`react.suspense_list`),
      C = Symbol.for(`react.memo`),
      w = Symbol.for(`react.lazy`),
      te = Symbol.for(`react.activity`),
      ne = Symbol.for(`react.memo_cache_sentinel`),
      re = Symbol.iterator;
    function ie(e) {
      return typeof e != `object` || !e
        ? null
        : ((e = (re && e[re]) || e[`@@iterator`]), typeof e == `function` ? e : null);
    }
    var ae = Symbol.for(`react.client.reference`);
    function oe(e) {
      if (e == null) return null;
      if (typeof e == `function`) return e.$$typeof === ae ? null : e.displayName || e.name || null;
      if (typeof e == `string`) return e;
      switch (e) {
        case g:
          return `Fragment`;
        case v:
          return `Profiler`;
        case _:
          return `StrictMode`;
        case S:
          return `Suspense`;
        case ee:
          return `SuspenseList`;
        case te:
          return `Activity`;
      }
      if (typeof e == `object`)
        switch (e.$$typeof) {
          case h:
            return `Portal`;
          case b:
            return e.displayName || `Context`;
          case y:
            return (e._context.displayName || `Context`) + `.Consumer`;
          case x:
            var t = e.render;
            return (
              (e = e.displayName),
              (e ||=
                ((e = t.displayName || t.name || ``),
                e === `` ? `ForwardRef` : `ForwardRef(` + e + `)`)),
              e
            );
          case C:
            return ((t = e.displayName || null), t === null ? oe(e.type) || `Memo` : t);
          case w:
            ((t = e._payload), (e = e._init));
            try {
              return oe(e(t));
            } catch {}
        }
      return null;
    }
    var se = Array.isArray,
      T = n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
      E = r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
      D = { pending: !1, data: null, method: null, action: null },
      ce = [],
      le = -1;
    function ue(e) {
      return { current: e };
    }
    function de(e) {
      0 > le || ((e.current = ce[le]), (ce[le] = null), le--);
    }
    function O(e, t) {
      (le++, (ce[le] = e.current), (e.current = t));
    }
    var fe = ue(null),
      pe = ue(null),
      me = ue(null),
      he = ue(null);
    function ge(e, t) {
      switch ((O(me, t), O(pe, e), O(fe, null), t.nodeType)) {
        case 9:
        case 11:
          e = (e = t.documentElement) && (e = e.namespaceURI) ? Zd(e) : 0;
          break;
        default:
          if (((e = t.tagName), (t = t.namespaceURI))) ((t = Zd(t)), (e = Qd(t, e)));
          else
            switch (e) {
              case `svg`:
                e = 1;
                break;
              case `math`:
                e = 2;
                break;
              default:
                e = 0;
            }
      }
      (de(fe), O(fe, e));
    }
    function _e() {
      (de(fe), de(pe), de(me));
    }
    function ve(e) {
      e.memoizedState !== null && O(he, e);
      var t = fe.current,
        n = Qd(t, e.type);
      t !== n && (O(pe, e), O(fe, n));
    }
    function ye(e) {
      (pe.current === e && (de(fe), de(pe)), he.current === e && (de(he), (up._currentValue = D)));
    }
    var be, xe;
    function Se(e) {
      if (be === void 0)
        try {
          throw Error();
        } catch (e) {
          var t = e.stack.trim().match(/\n( *(at )?)/);
          ((be = (t && t[1]) || ``),
            (xe =
              -1 <
              e.stack.indexOf(`
    at`)
                ? ` (<anonymous>)`
                : -1 < e.stack.indexOf(`@`)
                  ? `@unknown:0:0`
                  : ``));
        }
      return (
        `
` +
        be +
        e +
        xe
      );
    }
    var Ce = !1;
    function we(e, t) {
      if (!e || Ce) return ``;
      Ce = !0;
      var n = Error.prepareStackTrace;
      Error.prepareStackTrace = void 0;
      try {
        var r = {
          DetermineComponentFrameRoot: function () {
            try {
              if (t) {
                var n = function () {
                  throw Error();
                };
                if (
                  (Object.defineProperty(n.prototype, "props", {
                    set: function () {
                      throw Error();
                    },
                  }),
                  typeof Reflect == `object` && Reflect.construct)
                ) {
                  try {
                    Reflect.construct(n, []);
                  } catch (e) {
                    var r = e;
                  }
                  Reflect.construct(e, [], n);
                } else {
                  try {
                    n.call();
                  } catch (e) {
                    r = e;
                  }
                  e.call(n.prototype);
                }
              } else {
                try {
                  throw Error();
                } catch (e) {
                  r = e;
                }
                (n = e()) && typeof n.catch == `function` && n.catch(function () {});
              }
            } catch (e) {
              if (e && r && typeof e.stack == `string`) return [e.stack, r.stack];
            }
            return [null, null];
          },
        };
        r.DetermineComponentFrameRoot.displayName = `DetermineComponentFrameRoot`;
        var i = Object.getOwnPropertyDescriptor(r.DetermineComponentFrameRoot, `name`);
        i &&
          i.configurable &&
          Object.defineProperty(r.DetermineComponentFrameRoot, "name", {
            value: `DetermineComponentFrameRoot`,
          });
        var a = r.DetermineComponentFrameRoot(),
          o = a[0],
          s = a[1];
        if (o && s) {
          var c = o.split(`
`),
            l = s.split(`
`);
          for (i = r = 0; r < c.length && !c[r].includes(`DetermineComponentFrameRoot`);) r++;
          for (; i < l.length && !l[i].includes(`DetermineComponentFrameRoot`);) i++;
          if (r === c.length || i === l.length)
            for (r = c.length - 1, i = l.length - 1; 1 <= r && 0 <= i && c[r] !== l[i];) i--;
          for (; 1 <= r && 0 <= i; r--, i--)
            if (c[r] !== l[i]) {
              if (r !== 1 || i !== 1)
                do
                  if ((r--, i--, 0 > i || c[r] !== l[i])) {
                    var u =
                      `
` + c[r].replace(` at new `, ` at `);
                    return (
                      e.displayName &&
                        u.includes(`<anonymous>`) &&
                        (u = u.replace(`<anonymous>`, e.displayName)),
                      u
                    );
                  }
                while (1 <= r && 0 <= i);
              break;
            }
        }
      } finally {
        ((Ce = !1), (Error.prepareStackTrace = n));
      }
      return (n = e ? e.displayName || e.name : ``) ? Se(n) : ``;
    }
    function Te(e, t) {
      switch (e.tag) {
        case 26:
        case 27:
        case 5:
          return Se(e.type);
        case 16:
          return Se(`Lazy`);
        case 13:
          return e.child !== t && t !== null ? Se(`Suspense Fallback`) : Se(`Suspense`);
        case 19:
          return Se(`SuspenseList`);
        case 0:
        case 15:
          return we(e.type, !1);
        case 11:
          return we(e.type.render, !1);
        case 1:
          return we(e.type, !0);
        case 31:
          return Se(`Activity`);
        default:
          return ``;
      }
    }
    function Ee(e) {
      try {
        var t = ``,
          n = null;
        do ((t += Te(e, n)), (n = e), (e = e.return));
        while (e);
        return t;
      } catch (e) {
        return (
          `
Error generating stack: ` +
          e.message +
          `
` +
          e.stack
        );
      }
    }
    var k = Object.prototype.hasOwnProperty,
      De = t.unstable_scheduleCallback,
      Oe = t.unstable_cancelCallback,
      A = t.unstable_shouldYield,
      ke = t.unstable_requestPaint,
      j = t.unstable_now,
      Ae = t.unstable_getCurrentPriorityLevel,
      je = t.unstable_ImmediatePriority,
      Me = t.unstable_UserBlockingPriority,
      Ne = t.unstable_NormalPriority,
      Pe = t.unstable_LowPriority,
      Fe = t.unstable_IdlePriority,
      Ie = t.log,
      Le = t.unstable_setDisableYieldValue,
      Re = null,
      ze = null;
    function Be(e) {
      if ((typeof Ie == `function` && Le(e), ze && typeof ze.setStrictMode == `function`))
        try {
          ze.setStrictMode(Re, e);
        } catch {}
    }
    var Ve = Math.clz32 ? Math.clz32 : We,
      He = Math.log,
      Ue = Math.LN2;
    function We(e) {
      return ((e >>>= 0), e === 0 ? 32 : (31 - ((He(e) / Ue) | 0)) | 0);
    }
    var Ge = 256,
      Ke = 262144,
      qe = 4194304;
    function Je(e) {
      var t = e & 42;
      if (t !== 0) return t;
      switch (e & -e) {
        case 1:
          return 1;
        case 2:
          return 2;
        case 4:
          return 4;
        case 8:
          return 8;
        case 16:
          return 16;
        case 32:
          return 32;
        case 64:
          return 64;
        case 128:
          return 128;
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
          return e & 261888;
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
          return e & 3932160;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
          return e & 62914560;
        case 67108864:
          return 67108864;
        case 134217728:
          return 134217728;
        case 268435456:
          return 268435456;
        case 536870912:
          return 536870912;
        case 1073741824:
          return 0;
        default:
          return e;
      }
    }
    function Ye(e, t, n) {
      var r = e.pendingLanes;
      if (r === 0) return 0;
      var i = 0,
        a = e.suspendedLanes,
        o = e.pingedLanes;
      e = e.warmLanes;
      var s = r & 134217727;
      return (
        s === 0
          ? ((s = r & ~a),
            s === 0
              ? o === 0
                ? n || ((n = r & ~e), n !== 0 && (i = Je(n)))
                : (i = Je(o))
              : (i = Je(s)))
          : ((r = s & ~a),
            r === 0
              ? ((o &= s), o === 0 ? n || ((n = s & ~e), n !== 0 && (i = Je(n))) : (i = Je(o)))
              : (i = Je(r))),
        i === 0
          ? 0
          : t !== 0 &&
              t !== i &&
              (t & a) === 0 &&
              ((a = i & -i), (n = t & -t), a >= n || (a === 32 && n & 4194048))
            ? t
            : i
      );
    }
    function Xe(e, t) {
      return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0;
    }
    function Ze(e, t) {
      switch (e) {
        case 1:
        case 2:
        case 4:
        case 8:
        case 64:
          return t + 250;
        case 16:
        case 32:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
          return t + 5e3;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
          return -1;
        case 67108864:
        case 134217728:
        case 268435456:
        case 536870912:
        case 1073741824:
          return -1;
        default:
          return -1;
      }
    }
    function Qe() {
      var e = qe;
      return ((qe <<= 1), !(qe & 62914560) && (qe = 4194304), e);
    }
    function $e(e) {
      for (var t = [], n = 0; 31 > n; n++) t.push(e);
      return t;
    }
    function et(e, t) {
      ((e.pendingLanes |= t),
        t !== 268435456 && ((e.suspendedLanes = 0), (e.pingedLanes = 0), (e.warmLanes = 0)));
    }
    function tt(e, t, n, r, i, a) {
      var o = e.pendingLanes;
      ((e.pendingLanes = n),
        (e.suspendedLanes = 0),
        (e.pingedLanes = 0),
        (e.warmLanes = 0),
        (e.expiredLanes &= n),
        (e.entangledLanes &= n),
        (e.errorRecoveryDisabledLanes &= n),
        (e.shellSuspendCounter = 0));
      var s = e.entanglements,
        c = e.expirationTimes,
        l = e.hiddenUpdates;
      for (n = o & ~n; 0 < n;) {
        var u = 31 - Ve(n),
          d = 1 << u;
        ((s[u] = 0), (c[u] = -1));
        var f = l[u];
        if (f !== null)
          for (l[u] = null, u = 0; u < f.length; u++) {
            var p = f[u];
            p !== null && (p.lane &= -536870913);
          }
        n &= ~d;
      }
      (r !== 0 && nt(e, r, 0),
        a !== 0 && i === 0 && e.tag !== 0 && (e.suspendedLanes |= a & ~(o & ~t)));
    }
    function nt(e, t, n) {
      ((e.pendingLanes |= t), (e.suspendedLanes &= ~t));
      var r = 31 - Ve(t);
      ((e.entangledLanes |= t),
        (e.entanglements[r] = e.entanglements[r] | 1073741824 | (n & 261930)));
    }
    function rt(e, t) {
      var n = (e.entangledLanes |= t);
      for (e = e.entanglements; n;) {
        var r = 31 - Ve(n),
          i = 1 << r;
        ((i & t) | (e[r] & t) && (e[r] |= t), (n &= ~i));
      }
    }
    function it(e, t) {
      var n = t & -t;
      return ((n = n & 42 ? 1 : at(n)), (n & (e.suspendedLanes | t)) === 0 ? n : 0);
    }
    function at(e) {
      switch (e) {
        case 2:
          e = 1;
          break;
        case 8:
          e = 4;
          break;
        case 32:
          e = 16;
          break;
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
          e = 128;
          break;
        case 268435456:
          e = 134217728;
          break;
        default:
          e = 0;
      }
      return e;
    }
    function ot(e) {
      return ((e &= -e), 2 < e ? (8 < e ? (e & 134217727 ? 32 : 268435456) : 8) : 2);
    }
    function st() {
      var e = E.p;
      return e === 0 ? ((e = window.event), e === void 0 ? 32 : Tp(e.type)) : e;
    }
    function ct(e, t) {
      var n = E.p;
      try {
        return ((E.p = e), t());
      } finally {
        E.p = n;
      }
    }
    var lt = Math.random().toString(36).slice(2),
      ut = `__reactFiber$` + lt,
      dt = `__reactProps$` + lt,
      ft = `__reactContainer$` + lt,
      pt = `__reactEvents$` + lt,
      mt = `__reactListeners$` + lt,
      ht = `__reactHandles$` + lt,
      gt = `__reactResources$` + lt,
      _t = `__reactMarker$` + lt;
    function vt(e) {
      (delete e[ut], delete e[dt], delete e[pt], delete e[mt], delete e[ht]);
    }
    function yt(e) {
      var t = e[ut];
      if (t) return t;
      for (var n = e.parentNode; n;) {
        if ((t = n[ft] || n[ut])) {
          if (((n = t.alternate), t.child !== null || (n !== null && n.child !== null)))
            for (e = xf(e); e !== null;) {
              if ((n = e[ut])) return n;
              e = xf(e);
            }
          return t;
        }
        ((e = n), (n = e.parentNode));
      }
      return null;
    }
    function bt(e) {
      if ((e = e[ut] || e[ft])) {
        var t = e.tag;
        if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3) return e;
      }
      return null;
    }
    function xt(e) {
      var t = e.tag;
      if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
      throw Error(i(33));
    }
    function St(e) {
      var t = e[gt];
      return ((t ||= e[gt] = { hoistableStyles: new Map(), hoistableScripts: new Map() }), t);
    }
    function Ct(e) {
      e[_t] = !0;
    }
    var wt = new Set(),
      Tt = {};
    function M(e, t) {
      (Et(e, t), Et(e + `Capture`, t));
    }
    function Et(e, t) {
      for (Tt[e] = t, e = 0; e < t.length; e++) wt.add(t[e]);
    }
    var Dt = RegExp(
        `^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$`,
      ),
      Ot = {},
      kt = {};
    function At(e) {
      return k.call(kt, e)
        ? !0
        : k.call(Ot, e)
          ? !1
          : Dt.test(e)
            ? (kt[e] = !0)
            : ((Ot[e] = !0), !1);
    }
    function jt(e, t, n) {
      if (At(t)) {
        if (n === null) e.removeAttribute(t);
        else {
          switch (typeof n) {
            case `undefined`:
            case `function`:
            case `symbol`:
              e.removeAttribute(t);
              return;
            case `boolean`:
              var r = t.toLowerCase().slice(0, 5);
              if (r !== `data-` && r !== `aria-`) {
                e.removeAttribute(t);
                return;
              }
          }
          e.setAttribute(t, `` + n);
        }
      }
    }
    function Mt(e, t, n) {
      if (n === null) e.removeAttribute(t);
      else {
        switch (typeof n) {
          case `undefined`:
          case `function`:
          case `symbol`:
          case `boolean`:
            e.removeAttribute(t);
            return;
        }
        e.setAttribute(t, `` + n);
      }
    }
    function Nt(e, t, n, r) {
      if (r === null) e.removeAttribute(n);
      else {
        switch (typeof r) {
          case `undefined`:
          case `function`:
          case `symbol`:
          case `boolean`:
            e.removeAttribute(n);
            return;
        }
        e.setAttributeNS(t, n, `` + r);
      }
    }
    function Pt(e) {
      switch (typeof e) {
        case `bigint`:
        case `boolean`:
        case `number`:
        case `string`:
        case `undefined`:
          return e;
        case `object`:
          return e;
        default:
          return ``;
      }
    }
    function Ft(e) {
      var t = e.type;
      return (e = e.nodeName) && e.toLowerCase() === `input` && (t === `checkbox` || t === `radio`);
    }
    function It(e, t, n) {
      var r = Object.getOwnPropertyDescriptor(e.constructor.prototype, t);
      if (
        !e.hasOwnProperty(t) &&
        r !== void 0 &&
        typeof r.get == `function` &&
        typeof r.set == `function`
      ) {
        var i = r.get,
          a = r.set;
        return (
          Object.defineProperty(e, t, {
            configurable: !0,
            get: function () {
              return i.call(this);
            },
            set: function (e) {
              ((n = `` + e), a.call(this, e));
            },
          }),
          Object.defineProperty(e, t, { enumerable: r.enumerable }),
          {
            getValue: function () {
              return n;
            },
            setValue: function (e) {
              n = `` + e;
            },
            stopTracking: function () {
              ((e._valueTracker = null), delete e[t]);
            },
          }
        );
      }
    }
    function Lt(e) {
      if (!e._valueTracker) {
        var t = Ft(e) ? `checked` : `value`;
        e._valueTracker = It(e, t, `` + e[t]);
      }
    }
    function Rt(e) {
      if (!e) return !1;
      var t = e._valueTracker;
      if (!t) return !0;
      var n = t.getValue(),
        r = ``;
      return (
        e && (r = Ft(e) ? (e.checked ? `true` : `false`) : e.value),
        (e = r),
        e !== n && (t.setValue(e), !0)
      );
    }
    function zt(e) {
      if (((e ||= typeof document < `u` ? document : void 0), e === void 0)) return null;
      try {
        return e.activeElement || e.body;
      } catch {
        return e.body;
      }
    }
    var Bt = /[\n"\\]/g;
    function Vt(e) {
      return e.replace(Bt, function (e) {
        return `\\` + e.charCodeAt(0).toString(16) + ` `;
      });
    }
    function Ht(e, t, n, r, i, a, o, s) {
      ((e.name = ``),
        o != null && typeof o != `function` && typeof o != `symbol` && typeof o != `boolean`
          ? (e.type = o)
          : e.removeAttribute(`type`),
        t == null
          ? (o !== `submit` && o !== `reset`) || e.removeAttribute(`value`)
          : o === `number`
            ? ((t === 0 && e.value === ``) || e.value != t) && (e.value = `` + Pt(t))
            : e.value !== `` + Pt(t) && (e.value = `` + Pt(t)),
        t == null
          ? n == null
            ? r != null && e.removeAttribute(`value`)
            : Wt(e, o, Pt(n))
          : Wt(e, o, Pt(t)),
        i == null && a != null && (e.defaultChecked = !!a),
        i != null && (e.checked = i && typeof i != `function` && typeof i != `symbol`),
        s != null && typeof s != `function` && typeof s != `symbol` && typeof s != `boolean`
          ? (e.name = `` + Pt(s))
          : e.removeAttribute(`name`));
    }
    function Ut(e, t, n, r, i, a, o, s) {
      if (
        (a != null &&
          typeof a != `function` &&
          typeof a != `symbol` &&
          typeof a != `boolean` &&
          (e.type = a),
        t != null || n != null)
      ) {
        if (!((a !== `submit` && a !== `reset`) || t != null)) {
          Lt(e);
          return;
        }
        ((n = n == null ? `` : `` + Pt(n)),
          (t = t == null ? n : `` + Pt(t)),
          s || t === e.value || (e.value = t),
          (e.defaultValue = t));
      }
      ((r ??= i),
        (r = typeof r != `function` && typeof r != `symbol` && !!r),
        (e.checked = s ? e.checked : !!r),
        (e.defaultChecked = !!r),
        o != null &&
          typeof o != `function` &&
          typeof o != `symbol` &&
          typeof o != `boolean` &&
          (e.name = o),
        Lt(e));
    }
    function Wt(e, t, n) {
      (t === `number` && zt(e.ownerDocument) === e) ||
        e.defaultValue === `` + n ||
        (e.defaultValue = `` + n);
    }
    function Gt(e, t, n, r) {
      if (((e = e.options), t)) {
        t = {};
        for (var i = 0; i < n.length; i++) t[`$` + n[i]] = !0;
        for (n = 0; n < e.length; n++)
          ((i = t.hasOwnProperty(`$` + e[n].value)),
            e[n].selected !== i && (e[n].selected = i),
            i && r && (e[n].defaultSelected = !0));
      } else {
        for (n = `` + Pt(n), t = null, i = 0; i < e.length; i++) {
          if (e[i].value === n) {
            ((e[i].selected = !0), r && (e[i].defaultSelected = !0));
            return;
          }
          t !== null || e[i].disabled || (t = e[i]);
        }
        t !== null && (t.selected = !0);
      }
    }
    function Kt(e, t, n) {
      if (t != null && ((t = `` + Pt(t)), t !== e.value && (e.value = t), n == null)) {
        e.defaultValue !== t && (e.defaultValue = t);
        return;
      }
      e.defaultValue = n == null ? `` : `` + Pt(n);
    }
    function qt(e, t, n, r) {
      if (t == null) {
        if (r != null) {
          if (n != null) throw Error(i(92));
          if (se(r)) {
            if (1 < r.length) throw Error(i(93));
            r = r[0];
          }
          n = r;
        }
        ((n ??= ``), (t = n));
      }
      ((n = Pt(t)),
        (e.defaultValue = n),
        (r = e.textContent),
        r === n && r !== `` && r !== null && (e.value = r),
        Lt(e));
    }
    function Jt(e, t) {
      if (t) {
        var n = e.firstChild;
        if (n && n === e.lastChild && n.nodeType === 3) {
          n.nodeValue = t;
          return;
        }
      }
      e.textContent = t;
    }
    var Yt = new Set(
      `animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp`.split(
        ` `,
      ),
    );
    function Xt(e, t, n) {
      var r = t.indexOf(`--`) === 0;
      n == null || typeof n == `boolean` || n === ``
        ? r
          ? e.setProperty(t, ``)
          : t === `float`
            ? (e.cssFloat = ``)
            : (e[t] = ``)
        : r
          ? e.setProperty(t, n)
          : typeof n != `number` || n === 0 || Yt.has(t)
            ? t === `float`
              ? (e.cssFloat = n)
              : (e[t] = (`` + n).trim())
            : (e[t] = n + `px`);
    }
    function Zt(e, t, n) {
      if (t != null && typeof t != `object`) throw Error(i(62));
      if (((e = e.style), n != null)) {
        for (var r in n)
          !n.hasOwnProperty(r) ||
            (t != null && t.hasOwnProperty(r)) ||
            (r.indexOf(`--`) === 0
              ? e.setProperty(r, ``)
              : r === `float`
                ? (e.cssFloat = ``)
                : (e[r] = ``));
        for (var a in t) ((r = t[a]), t.hasOwnProperty(a) && n[a] !== r && Xt(e, a, r));
      } else for (var o in t) t.hasOwnProperty(o) && Xt(e, o, t[o]);
    }
    function Qt(e) {
      if (e.indexOf(`-`) === -1) return !1;
      switch (e) {
        case `annotation-xml`:
        case `color-profile`:
        case `font-face`:
        case `font-face-src`:
        case `font-face-uri`:
        case `font-face-format`:
        case `font-face-name`:
        case `missing-glyph`:
          return !1;
        default:
          return !0;
      }
    }
    var $t = new Map([
        [`acceptCharset`, `accept-charset`],
        [`htmlFor`, `for`],
        [`httpEquiv`, `http-equiv`],
        [`crossOrigin`, `crossorigin`],
        [`accentHeight`, `accent-height`],
        [`alignmentBaseline`, `alignment-baseline`],
        [`arabicForm`, `arabic-form`],
        [`baselineShift`, `baseline-shift`],
        [`capHeight`, `cap-height`],
        [`clipPath`, `clip-path`],
        [`clipRule`, `clip-rule`],
        [`colorInterpolation`, `color-interpolation`],
        [`colorInterpolationFilters`, `color-interpolation-filters`],
        [`colorProfile`, `color-profile`],
        [`colorRendering`, `color-rendering`],
        [`dominantBaseline`, `dominant-baseline`],
        [`enableBackground`, `enable-background`],
        [`fillOpacity`, `fill-opacity`],
        [`fillRule`, `fill-rule`],
        [`floodColor`, `flood-color`],
        [`floodOpacity`, `flood-opacity`],
        [`fontFamily`, `font-family`],
        [`fontSize`, `font-size`],
        [`fontSizeAdjust`, `font-size-adjust`],
        [`fontStretch`, `font-stretch`],
        [`fontStyle`, `font-style`],
        [`fontVariant`, `font-variant`],
        [`fontWeight`, `font-weight`],
        [`glyphName`, `glyph-name`],
        [`glyphOrientationHorizontal`, `glyph-orientation-horizontal`],
        [`glyphOrientationVertical`, `glyph-orientation-vertical`],
        [`horizAdvX`, `horiz-adv-x`],
        [`horizOriginX`, `horiz-origin-x`],
        [`imageRendering`, `image-rendering`],
        [`letterSpacing`, `letter-spacing`],
        [`lightingColor`, `lighting-color`],
        [`markerEnd`, `marker-end`],
        [`markerMid`, `marker-mid`],
        [`markerStart`, `marker-start`],
        [`overlinePosition`, `overline-position`],
        [`overlineThickness`, `overline-thickness`],
        [`paintOrder`, `paint-order`],
        [`panose-1`, `panose-1`],
        [`pointerEvents`, `pointer-events`],
        [`renderingIntent`, `rendering-intent`],
        [`shapeRendering`, `shape-rendering`],
        [`stopColor`, `stop-color`],
        [`stopOpacity`, `stop-opacity`],
        [`strikethroughPosition`, `strikethrough-position`],
        [`strikethroughThickness`, `strikethrough-thickness`],
        [`strokeDasharray`, `stroke-dasharray`],
        [`strokeDashoffset`, `stroke-dashoffset`],
        [`strokeLinecap`, `stroke-linecap`],
        [`strokeLinejoin`, `stroke-linejoin`],
        [`strokeMiterlimit`, `stroke-miterlimit`],
        [`strokeOpacity`, `stroke-opacity`],
        [`strokeWidth`, `stroke-width`],
        [`textAnchor`, `text-anchor`],
        [`textDecoration`, `text-decoration`],
        [`textRendering`, `text-rendering`],
        [`transformOrigin`, `transform-origin`],
        [`underlinePosition`, `underline-position`],
        [`underlineThickness`, `underline-thickness`],
        [`unicodeBidi`, `unicode-bidi`],
        [`unicodeRange`, `unicode-range`],
        [`unitsPerEm`, `units-per-em`],
        [`vAlphabetic`, `v-alphabetic`],
        [`vHanging`, `v-hanging`],
        [`vIdeographic`, `v-ideographic`],
        [`vMathematical`, `v-mathematical`],
        [`vectorEffect`, `vector-effect`],
        [`vertAdvY`, `vert-adv-y`],
        [`vertOriginX`, `vert-origin-x`],
        [`vertOriginY`, `vert-origin-y`],
        [`wordSpacing`, `word-spacing`],
        [`writingMode`, `writing-mode`],
        [`xmlnsXlink`, `xmlns:xlink`],
        [`xHeight`, `x-height`],
      ]),
      en =
        /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
    function tn(e) {
      return en.test(`` + e)
        ? `javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')`
        : e;
    }
    function nn() {}
    var rn = null;
    function an(e) {
      return (
        (e = e.target || e.srcElement || window),
        e.correspondingUseElement && (e = e.correspondingUseElement),
        e.nodeType === 3 ? e.parentNode : e
      );
    }
    var on = null,
      sn = null;
    function cn(e) {
      var t = bt(e);
      if (t && (e = t.stateNode)) {
        var n = e[dt] || null;
        a: switch (((e = t.stateNode), t.type)) {
          case `input`:
            if (
              (Ht(
                e,
                n.value,
                n.defaultValue,
                n.defaultValue,
                n.checked,
                n.defaultChecked,
                n.type,
                n.name,
              ),
              (t = n.name),
              n.type === `radio` && t != null)
            ) {
              for (n = e; n.parentNode;) n = n.parentNode;
              for (
                n = n.querySelectorAll(`input[name="` + Vt(`` + t) + `"][type="radio"]`), t = 0;
                t < n.length;
                t++
              ) {
                var r = n[t];
                if (r !== e && r.form === e.form) {
                  var a = r[dt] || null;
                  if (!a) throw Error(i(90));
                  Ht(
                    r,
                    a.value,
                    a.defaultValue,
                    a.defaultValue,
                    a.checked,
                    a.defaultChecked,
                    a.type,
                    a.name,
                  );
                }
              }
              for (t = 0; t < n.length; t++) ((r = n[t]), r.form === e.form && Rt(r));
            }
            break a;
          case `textarea`:
            Kt(e, n.value, n.defaultValue);
            break a;
          case `select`:
            ((t = n.value), t != null && Gt(e, !!n.multiple, t, !1));
        }
      }
    }
    var ln = !1;
    function un(e, t, n) {
      if (ln) return e(t, n);
      ln = !0;
      try {
        return e(t);
      } finally {
        if (
          ((ln = !1),
          (on !== null || sn !== null) &&
            (ku(), on && ((t = on), (e = sn), (sn = on = null), cn(t), e)))
        )
          for (t = 0; t < e.length; t++) cn(e[t]);
      }
    }
    function dn(e, t) {
      var n = e.stateNode;
      if (n === null) return null;
      var r = n[dt] || null;
      if (r === null) return null;
      n = r[t];
      a: switch (t) {
        case `onClick`:
        case `onClickCapture`:
        case `onDoubleClick`:
        case `onDoubleClickCapture`:
        case `onMouseDown`:
        case `onMouseDownCapture`:
        case `onMouseMove`:
        case `onMouseMoveCapture`:
        case `onMouseUp`:
        case `onMouseUpCapture`:
        case `onMouseEnter`:
          ((r = !r.disabled) ||
            ((e = e.type),
            (r = e !== `button` && e !== `input` && e !== `select` && e !== `textarea`)),
            (e = !r));
          break a;
        default:
          e = !1;
      }
      if (e) return null;
      if (n && typeof n != `function`) throw Error(i(231, t, typeof n));
      return n;
    }
    var fn = !(
        typeof window > `u` ||
        window.document === void 0 ||
        window.document.createElement === void 0
      ),
      pn = !1;
    if (fn)
      try {
        var mn = {};
        (Object.defineProperty(mn, "passive", {
          get: function () {
            pn = !0;
          },
        }),
          window.addEventListener(`test`, mn, mn),
          window.removeEventListener(`test`, mn, mn));
      } catch {
        pn = !1;
      }
    var hn = null,
      gn = null,
      _n = null;
    function vn() {
      if (_n) return _n;
      var e,
        t = gn,
        n = t.length,
        r,
        i = `value` in hn ? hn.value : hn.textContent,
        a = i.length;
      for (e = 0; e < n && t[e] === i[e]; e++);
      var o = n - e;
      for (r = 1; r <= o && t[n - r] === i[a - r]; r++);
      return (_n = i.slice(e, 1 < r ? 1 - r : void 0));
    }
    function yn(e) {
      var t = e.keyCode;
      return (
        `charCode` in e ? ((e = e.charCode), e === 0 && t === 13 && (e = 13)) : (e = t),
        e === 10 && (e = 13),
        32 <= e || e === 13 ? e : 0
      );
    }
    function bn() {
      return !0;
    }
    function xn() {
      return !1;
    }
    function Sn(e) {
      function t(t, n, r, i, a) {
        for (var o in ((this._reactName = t),
        (this._targetInst = r),
        (this.type = n),
        (this.nativeEvent = i),
        (this.target = a),
        (this.currentTarget = null),
        e))
          e.hasOwnProperty(o) && ((t = e[o]), (this[o] = t ? t(i) : i[o]));
        return (
          (this.isDefaultPrevented = (
            i.defaultPrevented == null ? !1 === i.returnValue : i.defaultPrevented
          )
            ? bn
            : xn),
          (this.isPropagationStopped = xn),
          this
        );
      }
      return (
        f(t.prototype, {
          preventDefault: function () {
            this.defaultPrevented = !0;
            var e = this.nativeEvent;
            e &&
              (e.preventDefault
                ? e.preventDefault()
                : typeof e.returnValue != `unknown` && (e.returnValue = !1),
              (this.isDefaultPrevented = bn));
          },
          stopPropagation: function () {
            var e = this.nativeEvent;
            e &&
              (e.stopPropagation
                ? e.stopPropagation()
                : typeof e.cancelBubble != `unknown` && (e.cancelBubble = !0),
              (this.isPropagationStopped = bn));
          },
          persist: function () {},
          isPersistent: bn,
        }),
        t
      );
    }
    var Cn = {
        eventPhase: 0,
        bubbles: 0,
        cancelable: 0,
        timeStamp: function (e) {
          return e.timeStamp || Date.now();
        },
        defaultPrevented: 0,
        isTrusted: 0,
      },
      wn = Sn(Cn),
      Tn = f({}, Cn, { view: 0, detail: 0 }),
      En = Sn(Tn),
      Dn,
      On,
      kn,
      An = f({}, Tn, {
        screenX: 0,
        screenY: 0,
        clientX: 0,
        clientY: 0,
        pageX: 0,
        pageY: 0,
        ctrlKey: 0,
        shiftKey: 0,
        altKey: 0,
        metaKey: 0,
        getModifierState: Vn,
        button: 0,
        buttons: 0,
        relatedTarget: function (e) {
          return e.relatedTarget === void 0
            ? e.fromElement === e.srcElement
              ? e.toElement
              : e.fromElement
            : e.relatedTarget;
        },
        movementX: function (e) {
          return `movementX` in e
            ? e.movementX
            : (e !== kn &&
                (kn && e.type === `mousemove`
                  ? ((Dn = e.screenX - kn.screenX), (On = e.screenY - kn.screenY))
                  : (On = Dn = 0),
                (kn = e)),
              Dn);
        },
        movementY: function (e) {
          return `movementY` in e ? e.movementY : On;
        },
      }),
      jn = Sn(An),
      Mn = Sn(f({}, An, { dataTransfer: 0 })),
      Nn = Sn(f({}, Tn, { relatedTarget: 0 })),
      Pn = Sn(f({}, Cn, { animationName: 0, elapsedTime: 0, pseudoElement: 0 })),
      Fn = Sn(
        f({}, Cn, {
          clipboardData: function (e) {
            return `clipboardData` in e ? e.clipboardData : window.clipboardData;
          },
        }),
      ),
      In = Sn(f({}, Cn, { data: 0 })),
      Ln = {
        Esc: `Escape`,
        Spacebar: ` `,
        Left: `ArrowLeft`,
        Up: `ArrowUp`,
        Right: `ArrowRight`,
        Down: `ArrowDown`,
        Del: `Delete`,
        Win: `OS`,
        Menu: `ContextMenu`,
        Apps: `ContextMenu`,
        Scroll: `ScrollLock`,
        MozPrintableKey: `Unidentified`,
      },
      Rn = {
        8: `Backspace`,
        9: `Tab`,
        12: `Clear`,
        13: `Enter`,
        16: `Shift`,
        17: `Control`,
        18: `Alt`,
        19: `Pause`,
        20: `CapsLock`,
        27: `Escape`,
        32: ` `,
        33: `PageUp`,
        34: `PageDown`,
        35: `End`,
        36: `Home`,
        37: `ArrowLeft`,
        38: `ArrowUp`,
        39: `ArrowRight`,
        40: `ArrowDown`,
        45: `Insert`,
        46: `Delete`,
        112: `F1`,
        113: `F2`,
        114: `F3`,
        115: `F4`,
        116: `F5`,
        117: `F6`,
        118: `F7`,
        119: `F8`,
        120: `F9`,
        121: `F10`,
        122: `F11`,
        123: `F12`,
        144: `NumLock`,
        145: `ScrollLock`,
        224: `Meta`,
      },
      zn = { Alt: `altKey`, Control: `ctrlKey`, Meta: `metaKey`, Shift: `shiftKey` };
    function Bn(e) {
      var t = this.nativeEvent;
      return t.getModifierState ? t.getModifierState(e) : (e = zn[e]) ? !!t[e] : !1;
    }
    function Vn() {
      return Bn;
    }
    var Hn = Sn(
        f({}, Tn, {
          key: function (e) {
            if (e.key) {
              var t = Ln[e.key] || e.key;
              if (t !== `Unidentified`) return t;
            }
            return e.type === `keypress`
              ? ((e = yn(e)), e === 13 ? `Enter` : String.fromCharCode(e))
              : e.type === `keydown` || e.type === `keyup`
                ? Rn[e.keyCode] || `Unidentified`
                : ``;
          },
          code: 0,
          location: 0,
          ctrlKey: 0,
          shiftKey: 0,
          altKey: 0,
          metaKey: 0,
          repeat: 0,
          locale: 0,
          getModifierState: Vn,
          charCode: function (e) {
            return e.type === `keypress` ? yn(e) : 0;
          },
          keyCode: function (e) {
            return e.type === `keydown` || e.type === `keyup` ? e.keyCode : 0;
          },
          which: function (e) {
            return e.type === `keypress`
              ? yn(e)
              : e.type === `keydown` || e.type === `keyup`
                ? e.keyCode
                : 0;
          },
        }),
      ),
      Un = Sn(
        f({}, An, {
          pointerId: 0,
          width: 0,
          height: 0,
          pressure: 0,
          tangentialPressure: 0,
          tiltX: 0,
          tiltY: 0,
          twist: 0,
          pointerType: 0,
          isPrimary: 0,
        }),
      ),
      Wn = Sn(
        f({}, Tn, {
          touches: 0,
          targetTouches: 0,
          changedTouches: 0,
          altKey: 0,
          metaKey: 0,
          ctrlKey: 0,
          shiftKey: 0,
          getModifierState: Vn,
        }),
      ),
      Gn = Sn(f({}, Cn, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 })),
      Kn = Sn(
        f({}, An, {
          deltaX: function (e) {
            return `deltaX` in e ? e.deltaX : `wheelDeltaX` in e ? -e.wheelDeltaX : 0;
          },
          deltaY: function (e) {
            return `deltaY` in e
              ? e.deltaY
              : `wheelDeltaY` in e
                ? -e.wheelDeltaY
                : `wheelDelta` in e
                  ? -e.wheelDelta
                  : 0;
          },
          deltaZ: 0,
          deltaMode: 0,
        }),
      ),
      qn = Sn(f({}, Cn, { newState: 0, oldState: 0 })),
      Jn = [9, 13, 27, 32],
      Yn = fn && `CompositionEvent` in window,
      Xn = null;
    fn && `documentMode` in document && (Xn = document.documentMode);
    var Zn = fn && `TextEvent` in window && !Xn,
      Qn = fn && (!Yn || (Xn && 8 < Xn && 11 >= Xn)),
      $n = ` `,
      er = !1;
    function tr(e, t) {
      switch (e) {
        case `keyup`:
          return Jn.indexOf(t.keyCode) !== -1;
        case `keydown`:
          return t.keyCode !== 229;
        case `keypress`:
        case `mousedown`:
        case `focusout`:
          return !0;
        default:
          return !1;
      }
    }
    function nr(e) {
      return ((e = e.detail), typeof e == `object` && `data` in e ? e.data : null);
    }
    var rr = !1;
    function ir(e, t) {
      switch (e) {
        case `compositionend`:
          return nr(t);
        case `keypress`:
          return t.which === 32 ? ((er = !0), $n) : null;
        case `textInput`:
          return ((e = t.data), e === $n && er ? null : e);
        default:
          return null;
      }
    }
    function ar(e, t) {
      if (rr)
        return e === `compositionend` || (!Yn && tr(e, t))
          ? ((e = vn()), (_n = gn = hn = null), (rr = !1), e)
          : null;
      switch (e) {
        case `paste`:
          return null;
        case `keypress`:
          if (!(t.ctrlKey || t.altKey || t.metaKey) || (t.ctrlKey && t.altKey)) {
            if (t.char && 1 < t.char.length) return t.char;
            if (t.which) return String.fromCharCode(t.which);
          }
          return null;
        case `compositionend`:
          return Qn && t.locale !== `ko` ? null : t.data;
        default:
          return null;
      }
    }
    var or = {
      color: !0,
      date: !0,
      datetime: !0,
      "datetime-local": !0,
      email: !0,
      month: !0,
      number: !0,
      password: !0,
      range: !0,
      search: !0,
      tel: !0,
      text: !0,
      time: !0,
      url: !0,
      week: !0,
    };
    function sr(e) {
      var t = e && e.nodeName && e.nodeName.toLowerCase();
      return t === `input` ? !!or[e.type] : t === `textarea`;
    }
    function cr(e, t, n, r) {
      (on ? (sn ? sn.push(r) : (sn = [r])) : (on = r),
        (t = Fd(t, `onChange`)),
        0 < t.length &&
          ((n = new wn(`onChange`, `change`, null, n, r)), e.push({ event: n, listeners: t })));
    }
    var lr = null,
      ur = null;
    function dr(e) {
      Od(e, 0);
    }
    function fr(e) {
      if (Rt(xt(e))) return e;
    }
    function pr(e, t) {
      if (e === `change`) return t;
    }
    var mr = !1;
    if (fn) {
      var hr;
      if (fn) {
        var gr = `oninput` in document;
        if (!gr) {
          var _r = document.createElement(`div`);
          (_r.setAttribute(`oninput`, `return;`), (gr = typeof _r.oninput == `function`));
        }
        hr = gr;
      } else hr = !1;
      mr = hr && (!document.documentMode || 9 < document.documentMode);
    }
    function vr() {
      lr && (lr.detachEvent(`onpropertychange`, yr), (ur = lr = null));
    }
    function yr(e) {
      if (e.propertyName === `value` && fr(ur)) {
        var t = [];
        (cr(t, ur, e, an(e)), un(dr, t));
      }
    }
    function br(e, t, n) {
      e === `focusin`
        ? (vr(), (lr = t), (ur = n), lr.attachEvent(`onpropertychange`, yr))
        : e === `focusout` && vr();
    }
    function xr(e) {
      if (e === `selectionchange` || e === `keyup` || e === `keydown`) return fr(ur);
    }
    function Sr(e, t) {
      if (e === `click`) return fr(t);
    }
    function Cr(e, t) {
      if (e === `input` || e === `change`) return fr(t);
    }
    function wr(e, t) {
      return (e === t && (e !== 0 || 1 / e == 1 / t)) || (e !== e && t !== t);
    }
    var Tr = typeof Object.is == `function` ? Object.is : wr;
    function Er(e, t) {
      if (Tr(e, t)) return !0;
      if (typeof e != `object` || !e || typeof t != `object` || !t) return !1;
      var n = Object.keys(e),
        r = Object.keys(t);
      if (n.length !== r.length) return !1;
      for (r = 0; r < n.length; r++) {
        var i = n[r];
        if (!k.call(t, i) || !Tr(e[i], t[i])) return !1;
      }
      return !0;
    }
    function Dr(e) {
      for (; e && e.firstChild;) e = e.firstChild;
      return e;
    }
    function Or(e, t) {
      var n = Dr(e);
      e = 0;
      for (var r; n;) {
        if (n.nodeType === 3) {
          if (((r = e + n.textContent.length), e <= t && r >= t)) return { node: n, offset: t - e };
          e = r;
        }
        a: {
          for (; n;) {
            if (n.nextSibling) {
              n = n.nextSibling;
              break a;
            }
            n = n.parentNode;
          }
          n = void 0;
        }
        n = Dr(n);
      }
    }
    function kr(e, t) {
      return e && t
        ? e === t
          ? !0
          : e && e.nodeType === 3
            ? !1
            : t && t.nodeType === 3
              ? kr(e, t.parentNode)
              : `contains` in e
                ? e.contains(t)
                : e.compareDocumentPosition
                  ? !!(e.compareDocumentPosition(t) & 16)
                  : !1
        : !1;
    }
    function Ar(e) {
      e =
        e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null
          ? e.ownerDocument.defaultView
          : window;
      for (var t = zt(e.document); t instanceof e.HTMLIFrameElement;) {
        try {
          var n = typeof t.contentWindow.location.href == `string`;
        } catch {
          n = !1;
        }
        if (n) e = t.contentWindow;
        else break;
        t = zt(e.document);
      }
      return t;
    }
    function jr(e) {
      var t = e && e.nodeName && e.nodeName.toLowerCase();
      return (
        t &&
        ((t === `input` &&
          (e.type === `text` ||
            e.type === `search` ||
            e.type === `tel` ||
            e.type === `url` ||
            e.type === `password`)) ||
          t === `textarea` ||
          e.contentEditable === `true`)
      );
    }
    var Mr = fn && `documentMode` in document && 11 >= document.documentMode,
      Nr = null,
      Pr = null,
      Fr = null,
      Ir = !1;
    function Lr(e, t, n) {
      var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
      Ir ||
        Nr == null ||
        Nr !== zt(r) ||
        ((r = Nr),
        `selectionStart` in r && jr(r)
          ? (r = { start: r.selectionStart, end: r.selectionEnd })
          : ((r = ((r.ownerDocument && r.ownerDocument.defaultView) || window).getSelection()),
            (r = {
              anchorNode: r.anchorNode,
              anchorOffset: r.anchorOffset,
              focusNode: r.focusNode,
              focusOffset: r.focusOffset,
            })),
        (Fr && Er(Fr, r)) ||
          ((Fr = r),
          (r = Fd(Pr, `onSelect`)),
          0 < r.length &&
            ((t = new wn(`onSelect`, `select`, null, t, n)),
            e.push({ event: t, listeners: r }),
            (t.target = Nr))));
    }
    function Rr(e, t) {
      var n = {};
      return (
        (n[e.toLowerCase()] = t.toLowerCase()),
        (n[`Webkit` + e] = `webkit` + t),
        (n[`Moz` + e] = `moz` + t),
        n
      );
    }
    var zr = {
        animationend: Rr(`Animation`, `AnimationEnd`),
        animationiteration: Rr(`Animation`, `AnimationIteration`),
        animationstart: Rr(`Animation`, `AnimationStart`),
        transitionrun: Rr(`Transition`, `TransitionRun`),
        transitionstart: Rr(`Transition`, `TransitionStart`),
        transitioncancel: Rr(`Transition`, `TransitionCancel`),
        transitionend: Rr(`Transition`, `TransitionEnd`),
      },
      Br = {},
      Vr = {};
    fn &&
      ((Vr = document.createElement(`div`).style),
      `AnimationEvent` in window ||
        (delete zr.animationend.animation,
        delete zr.animationiteration.animation,
        delete zr.animationstart.animation),
      `TransitionEvent` in window || delete zr.transitionend.transition);
    function Hr(e) {
      if (Br[e]) return Br[e];
      if (!zr[e]) return e;
      var t = zr[e],
        n;
      for (n in t) if (t.hasOwnProperty(n) && n in Vr) return (Br[e] = t[n]);
      return e;
    }
    var Ur = Hr(`animationend`),
      Wr = Hr(`animationiteration`),
      Gr = Hr(`animationstart`),
      Kr = Hr(`transitionrun`),
      qr = Hr(`transitionstart`),
      Jr = Hr(`transitioncancel`),
      Yr = Hr(`transitionend`),
      Xr = new Map(),
      Zr =
        `abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel`.split(
          ` `,
        );
    Zr.push(`scrollEnd`);
    function Qr(e, t) {
      (Xr.set(e, t), M(t, [e]));
    }
    var $r =
        typeof reportError == `function`
          ? reportError
          : function (e) {
              if (typeof window == `object` && typeof window.ErrorEvent == `function`) {
                var t = new window.ErrorEvent(`error`, {
                  bubbles: !0,
                  cancelable: !0,
                  message:
                    typeof e == `object` && e && typeof e.message == `string`
                      ? String(e.message)
                      : String(e),
                  error: e,
                });
                if (!window.dispatchEvent(t)) return;
              } else if (typeof process == `object` && typeof process.emit == `function`) {
                process.emit(`uncaughtException`, e);
                return;
              }
              console.error(e);
            },
      ei = [],
      ti = 0,
      ni = 0;
    function ri() {
      for (var e = ti, t = (ni = ti = 0); t < e;) {
        var n = ei[t];
        ei[t++] = null;
        var r = ei[t];
        ei[t++] = null;
        var i = ei[t];
        ei[t++] = null;
        var a = ei[t];
        if (((ei[t++] = null), r !== null && i !== null)) {
          var o = r.pending;
          (o === null ? (i.next = i) : ((i.next = o.next), (o.next = i)), (r.pending = i));
        }
        a !== 0 && si(n, i, a);
      }
    }
    function ii(e, t, n, r) {
      ((ei[ti++] = e),
        (ei[ti++] = t),
        (ei[ti++] = n),
        (ei[ti++] = r),
        (ni |= r),
        (e.lanes |= r),
        (e = e.alternate),
        e !== null && (e.lanes |= r));
    }
    function ai(e, t, n, r) {
      return (ii(e, t, n, r), ci(e));
    }
    function oi(e, t) {
      return (ii(e, null, null, t), ci(e));
    }
    function si(e, t, n) {
      e.lanes |= n;
      var r = e.alternate;
      r !== null && (r.lanes |= n);
      for (var i = !1, a = e.return; a !== null;)
        ((a.childLanes |= n),
          (r = a.alternate),
          r !== null && (r.childLanes |= n),
          a.tag === 22 && ((e = a.stateNode), e === null || e._visibility & 1 || (i = !0)),
          (e = a),
          (a = a.return));
      return e.tag === 3
        ? ((a = e.stateNode),
          i &&
            t !== null &&
            ((i = 31 - Ve(n)),
            (e = a.hiddenUpdates),
            (r = e[i]),
            r === null ? (e[i] = [t]) : r.push(t),
            (t.lane = n | 536870912)),
          a)
        : null;
    }
    function ci(e) {
      if (50 < bu) throw ((bu = 0), (xu = null), Error(i(185)));
      for (var t = e.return; t !== null;) ((e = t), (t = e.return));
      return e.tag === 3 ? e.stateNode : null;
    }
    var li = {};
    function ui(e, t, n, r) {
      ((this.tag = e),
        (this.key = n),
        (this.sibling =
          this.child =
          this.return =
          this.stateNode =
          this.type =
          this.elementType =
            null),
        (this.index = 0),
        (this.refCleanup = this.ref = null),
        (this.pendingProps = t),
        (this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null),
        (this.mode = r),
        (this.subtreeFlags = this.flags = 0),
        (this.deletions = null),
        (this.childLanes = this.lanes = 0),
        (this.alternate = null));
    }
    function di(e, t, n, r) {
      return new ui(e, t, n, r);
    }
    function fi(e) {
      return ((e = e.prototype), !(!e || !e.isReactComponent));
    }
    function pi(e, t) {
      var n = e.alternate;
      return (
        n === null
          ? ((n = di(e.tag, t, e.key, e.mode)),
            (n.elementType = e.elementType),
            (n.type = e.type),
            (n.stateNode = e.stateNode),
            (n.alternate = e),
            (e.alternate = n))
          : ((n.pendingProps = t),
            (n.type = e.type),
            (n.flags = 0),
            (n.subtreeFlags = 0),
            (n.deletions = null)),
        (n.flags = e.flags & 65011712),
        (n.childLanes = e.childLanes),
        (n.lanes = e.lanes),
        (n.child = e.child),
        (n.memoizedProps = e.memoizedProps),
        (n.memoizedState = e.memoizedState),
        (n.updateQueue = e.updateQueue),
        (t = e.dependencies),
        (n.dependencies = t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }),
        (n.sibling = e.sibling),
        (n.index = e.index),
        (n.ref = e.ref),
        (n.refCleanup = e.refCleanup),
        n
      );
    }
    function mi(e, t) {
      e.flags &= 65011714;
      var n = e.alternate;
      return (
        n === null
          ? ((e.childLanes = 0),
            (e.lanes = t),
            (e.child = null),
            (e.subtreeFlags = 0),
            (e.memoizedProps = null),
            (e.memoizedState = null),
            (e.updateQueue = null),
            (e.dependencies = null),
            (e.stateNode = null))
          : ((e.childLanes = n.childLanes),
            (e.lanes = n.lanes),
            (e.child = n.child),
            (e.subtreeFlags = 0),
            (e.deletions = null),
            (e.memoizedProps = n.memoizedProps),
            (e.memoizedState = n.memoizedState),
            (e.updateQueue = n.updateQueue),
            (e.type = n.type),
            (t = n.dependencies),
            (e.dependencies =
              t === null ? null : { lanes: t.lanes, firstContext: t.firstContext })),
        e
      );
    }
    function hi(e, t, n, r, a, o) {
      var s = 0;
      if (((r = e), typeof e == `function`)) fi(e) && (s = 1);
      else if (typeof e == `string`)
        s = tp(e, n, fe.current) ? 26 : e === `html` || e === `head` || e === `body` ? 27 : 5;
      else
        a: switch (e) {
          case te:
            return ((e = di(31, n, t, a)), (e.elementType = te), (e.lanes = o), e);
          case g:
            return gi(n.children, a, o, t);
          case _:
            ((s = 8), (a |= 24));
            break;
          case v:
            return ((e = di(12, n, t, a | 2)), (e.elementType = v), (e.lanes = o), e);
          case S:
            return ((e = di(13, n, t, a)), (e.elementType = S), (e.lanes = o), e);
          case ee:
            return ((e = di(19, n, t, a)), (e.elementType = ee), (e.lanes = o), e);
          default:
            if (typeof e == `object` && e)
              switch (e.$$typeof) {
                case b:
                  s = 10;
                  break a;
                case y:
                  s = 9;
                  break a;
                case x:
                  s = 11;
                  break a;
                case C:
                  s = 14;
                  break a;
                case w:
                  ((s = 16), (r = null));
                  break a;
              }
            ((s = 29), (n = Error(i(130, e === null ? `null` : typeof e, ``))), (r = null));
        }
      return ((t = di(s, n, t, a)), (t.elementType = e), (t.type = r), (t.lanes = o), t);
    }
    function gi(e, t, n, r) {
      return ((e = di(7, e, r, t)), (e.lanes = n), e);
    }
    function _i(e, t, n) {
      return ((e = di(6, e, null, t)), (e.lanes = n), e);
    }
    function vi(e) {
      var t = di(18, null, null, 0);
      return ((t.stateNode = e), t);
    }
    function yi(e, t, n) {
      return (
        (t = di(4, e.children === null ? [] : e.children, e.key, t)),
        (t.lanes = n),
        (t.stateNode = {
          containerInfo: e.containerInfo,
          pendingChildren: null,
          implementation: e.implementation,
        }),
        t
      );
    }
    var bi = new WeakMap();
    function xi(e, t) {
      if (typeof e == `object` && e) {
        var n = bi.get(e);
        return n === void 0 ? ((t = { value: e, source: t, stack: Ee(t) }), bi.set(e, t), t) : n;
      }
      return { value: e, source: t, stack: Ee(t) };
    }
    var Si = [],
      Ci = 0,
      wi = null,
      Ti = 0,
      Ei = [],
      Di = 0,
      Oi = null,
      ki = 1,
      Ai = ``;
    function ji(e, t) {
      ((Si[Ci++] = Ti), (Si[Ci++] = wi), (wi = e), (Ti = t));
    }
    function Mi(e, t, n) {
      ((Ei[Di++] = ki), (Ei[Di++] = Ai), (Ei[Di++] = Oi), (Oi = e));
      var r = ki;
      e = Ai;
      var i = 32 - Ve(r) - 1;
      ((r &= ~(1 << i)), (n += 1));
      var a = 32 - Ve(t) + i;
      if (30 < a) {
        var o = i - (i % 5);
        ((a = (r & ((1 << o) - 1)).toString(32)),
          (r >>= o),
          (i -= o),
          (ki = (1 << (32 - Ve(t) + i)) | (n << i) | r),
          (Ai = a + e));
      } else ((ki = (1 << a) | (n << i) | r), (Ai = e));
    }
    function Ni(e) {
      e.return !== null && (ji(e, 1), Mi(e, 1, 0));
    }
    function Pi(e) {
      for (; e === wi;) ((wi = Si[--Ci]), (Si[Ci] = null), (Ti = Si[--Ci]), (Si[Ci] = null));
      for (; e === Oi;)
        ((Oi = Ei[--Di]),
          (Ei[Di] = null),
          (Ai = Ei[--Di]),
          (Ei[Di] = null),
          (ki = Ei[--Di]),
          (Ei[Di] = null));
    }
    function Fi(e, t) {
      ((Ei[Di++] = ki), (Ei[Di++] = Ai), (Ei[Di++] = Oi), (ki = t.id), (Ai = t.overflow), (Oi = e));
    }
    var Ii = null,
      Li = null,
      N = !1,
      Ri = null,
      zi = !1,
      Bi = Error(i(519));
    function Vi(e) {
      throw (
        qi(
          xi(
            Error(
              i(
                418,
                1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? `text` : `HTML`,
                ``,
              ),
            ),
            e,
          ),
        ),
        Bi
      );
    }
    function Hi(e) {
      var t = e.stateNode,
        n = e.type,
        r = e.memoizedProps;
      switch (((t[ut] = e), (t[dt] = r), n)) {
        case `dialog`:
          (B(`cancel`, t), B(`close`, t));
          break;
        case `iframe`:
        case `object`:
        case `embed`:
          B(`load`, t);
          break;
        case `video`:
        case `audio`:
          for (n = 0; n < Ed.length; n++) B(Ed[n], t);
          break;
        case `source`:
          B(`error`, t);
          break;
        case `img`:
        case `image`:
        case `link`:
          (B(`error`, t), B(`load`, t));
          break;
        case `details`:
          B(`toggle`, t);
          break;
        case `input`:
          (B(`invalid`, t),
            Ut(t, r.value, r.defaultValue, r.checked, r.defaultChecked, r.type, r.name, !0));
          break;
        case `select`:
          B(`invalid`, t);
          break;
        case `textarea`:
          (B(`invalid`, t), qt(t, r.value, r.defaultValue, r.children));
      }
      ((n = r.children),
        (typeof n != `string` && typeof n != `number` && typeof n != `bigint`) ||
        t.textContent === `` + n ||
        !0 === r.suppressHydrationWarning ||
        Vd(t.textContent, n)
          ? (r.popover != null && (B(`beforetoggle`, t), B(`toggle`, t)),
            r.onScroll != null && B(`scroll`, t),
            r.onScrollEnd != null && B(`scrollend`, t),
            r.onClick != null && (t.onclick = nn),
            (t = !0))
          : (t = !1),
        t || Vi(e, !0));
    }
    function Ui(e) {
      for (Ii = e.return; Ii;)
        switch (Ii.tag) {
          case 5:
          case 31:
          case 13:
            zi = !1;
            return;
          case 27:
          case 3:
            zi = !0;
            return;
          default:
            Ii = Ii.return;
        }
    }
    function Wi(e) {
      if (e !== Ii) return !1;
      if (!N) return (Ui(e), (N = !0), !1);
      var t = e.tag,
        n;
      if (
        ((n = t !== 3 && t !== 27) &&
          ((n = t === 5) &&
            ((n = e.type), (n = n === `form` || n === `button` || $d(e.type, e.memoizedProps))),
          (n = !n)),
        n && Li && Vi(e),
        Ui(e),
        t === 13)
      ) {
        if (((e = e.memoizedState), (e = e === null ? null : e.dehydrated), !e))
          throw Error(i(317));
        Li = bf(e);
      } else if (t === 31) {
        if (((e = e.memoizedState), (e = e === null ? null : e.dehydrated), !e))
          throw Error(i(317));
        Li = bf(e);
      } else
        t === 27
          ? ((t = Li), cf(e.type) ? ((e = yf), (yf = null), (Li = e)) : (Li = t))
          : (Li = Ii ? vf(e.stateNode.nextSibling) : null);
      return !0;
    }
    function Gi() {
      ((Li = Ii = null), (N = !1));
    }
    function Ki() {
      var e = Ri;
      return (e !== null && (ou === null ? (ou = e) : ou.push.apply(ou, e), (Ri = null)), e);
    }
    function qi(e) {
      Ri === null ? (Ri = [e]) : Ri.push(e);
    }
    var Ji = ue(null),
      Yi = null,
      Xi = null;
    function Zi(e, t, n) {
      (O(Ji, t._currentValue), (t._currentValue = n));
    }
    function Qi(e) {
      ((e._currentValue = Ji.current), de(Ji));
    }
    function $i(e, t, n) {
      for (; e !== null;) {
        var r = e.alternate;
        if (
          ((e.childLanes & t) === t
            ? r !== null && (r.childLanes & t) !== t && (r.childLanes |= t)
            : ((e.childLanes |= t), r !== null && (r.childLanes |= t)),
          e === n)
        )
          break;
        e = e.return;
      }
    }
    function ea(e, t, n, r) {
      var a = e.child;
      for (a !== null && (a.return = e); a !== null;) {
        var o = a.dependencies;
        if (o !== null) {
          var s = a.child;
          o = o.firstContext;
          a: for (; o !== null;) {
            var c = o;
            o = a;
            for (var l = 0; l < t.length; l++)
              if (c.context === t[l]) {
                ((o.lanes |= n),
                  (c = o.alternate),
                  c !== null && (c.lanes |= n),
                  $i(o.return, n, e),
                  r || (s = null));
                break a;
              }
            o = c.next;
          }
        } else if (a.tag === 18) {
          if (((s = a.return), s === null)) throw Error(i(341));
          ((s.lanes |= n),
            (o = s.alternate),
            o !== null && (o.lanes |= n),
            $i(s, n, e),
            (s = null));
        } else s = a.child;
        if (s !== null) s.return = a;
        else
          for (s = a; s !== null;) {
            if (s === e) {
              s = null;
              break;
            }
            if (((a = s.sibling), a !== null)) {
              ((a.return = s.return), (s = a));
              break;
            }
            s = s.return;
          }
        a = s;
      }
    }
    function ta(e, t, n, r) {
      e = null;
      for (var a = t, o = !1; a !== null;) {
        if (!o) {
          if (a.flags & 524288) o = !0;
          else if (a.flags & 262144) break;
        }
        if (a.tag === 10) {
          var s = a.alternate;
          if (s === null) throw Error(i(387));
          if (((s = s.memoizedProps), s !== null)) {
            var c = a.type;
            Tr(a.pendingProps.value, s.value) || (e === null ? (e = [c]) : e.push(c));
          }
        } else if (a === he.current) {
          if (((s = a.alternate), s === null)) throw Error(i(387));
          s.memoizedState.memoizedState !== a.memoizedState.memoizedState &&
            (e === null ? (e = [up]) : e.push(up));
        }
        a = a.return;
      }
      (e !== null && ea(t, e, n, r), (t.flags |= 262144));
    }
    function na(e) {
      for (e = e.firstContext; e !== null;) {
        if (!Tr(e.context._currentValue, e.memoizedValue)) return !0;
        e = e.next;
      }
      return !1;
    }
    function ra(e) {
      ((Yi = e), (Xi = null), (e = e.dependencies), e !== null && (e.firstContext = null));
    }
    function ia(e) {
      return oa(Yi, e);
    }
    function aa(e, t) {
      return (Yi === null && ra(e), oa(e, t));
    }
    function oa(e, t) {
      var n = t._currentValue;
      if (((t = { context: t, memoizedValue: n, next: null }), Xi === null)) {
        if (e === null) throw Error(i(308));
        ((Xi = t), (e.dependencies = { lanes: 0, firstContext: t }), (e.flags |= 524288));
      } else Xi = Xi.next = t;
      return n;
    }
    var sa =
        typeof AbortController < `u`
          ? AbortController
          : function () {
              var e = [],
                t = (this.signal = {
                  aborted: !1,
                  addEventListener: function (t, n) {
                    e.push(n);
                  },
                });
              this.abort = function () {
                ((t.aborted = !0),
                  e.forEach(function (e) {
                    return e();
                  }));
              };
            },
      ca = t.unstable_scheduleCallback,
      la = t.unstable_NormalPriority,
      ua = {
        $$typeof: b,
        Consumer: null,
        Provider: null,
        _currentValue: null,
        _currentValue2: null,
        _threadCount: 0,
      };
    function da() {
      return { controller: new sa(), data: new Map(), refCount: 0 };
    }
    function fa(e) {
      (e.refCount--,
        e.refCount === 0 &&
          ca(la, function () {
            e.controller.abort();
          }));
    }
    var pa = null,
      ma = 0,
      ha = 0,
      ga = null;
    function _a(e, t) {
      if (pa === null) {
        var n = (pa = []);
        ((ma = 0),
          (ha = bd()),
          (ga = {
            status: `pending`,
            value: void 0,
            then: function (e) {
              n.push(e);
            },
          }));
      }
      return (ma++, t.then(va, va), t);
    }
    function va() {
      if (--ma === 0 && pa !== null) {
        ga !== null && (ga.status = `fulfilled`);
        var e = pa;
        ((pa = null), (ha = 0), (ga = null));
        for (var t = 0; t < e.length; t++) (0, e[t])();
      }
    }
    function ya(e, t) {
      var n = [],
        r = {
          status: `pending`,
          value: null,
          reason: null,
          then: function (e) {
            n.push(e);
          },
        };
      return (
        e.then(
          function () {
            ((r.status = `fulfilled`), (r.value = t));
            for (var e = 0; e < n.length; e++) (0, n[e])(t);
          },
          function (e) {
            for (r.status = `rejected`, r.reason = e, e = 0; e < n.length; e++) (0, n[e])(void 0);
          },
        ),
        r
      );
    }
    var ba = T.S;
    T.S = function (e, t) {
      ((lu = j()),
        typeof t == `object` && t && typeof t.then == `function` && _a(e, t),
        ba !== null && ba(e, t));
    };
    var xa = ue(null);
    function Sa() {
      var e = xa.current;
      return e === null ? Kl.pooledCache : e;
    }
    function Ca(e, t) {
      t === null ? O(xa, xa.current) : O(xa, t.pool);
    }
    function wa() {
      var e = Sa();
      return e === null ? null : { parent: ua._currentValue, pool: e };
    }
    var Ta = Error(i(460)),
      Ea = Error(i(474)),
      Da = Error(i(542)),
      Oa = { then: function () {} };
    function ka(e) {
      return ((e = e.status), e === `fulfilled` || e === `rejected`);
    }
    function Aa(e, t, n) {
      switch (
        ((n = e[n]), n === void 0 ? e.push(t) : n !== t && (t.then(nn, nn), (t = n)), t.status)
      ) {
        case `fulfilled`:
          return t.value;
        case `rejected`:
          throw ((e = t.reason), Pa(e), e);
        default:
          if (typeof t.status == `string`) t.then(nn, nn);
          else {
            if (((e = Kl), e !== null && 100 < e.shellSuspendCounter)) throw Error(i(482));
            ((e = t),
              (e.status = `pending`),
              e.then(
                function (e) {
                  if (t.status === `pending`) {
                    var n = t;
                    ((n.status = `fulfilled`), (n.value = e));
                  }
                },
                function (e) {
                  if (t.status === `pending`) {
                    var n = t;
                    ((n.status = `rejected`), (n.reason = e));
                  }
                },
              ));
          }
          switch (t.status) {
            case `fulfilled`:
              return t.value;
            case `rejected`:
              throw ((e = t.reason), Pa(e), e);
          }
          throw ((Ma = t), Ta);
      }
    }
    function ja(e) {
      try {
        var t = e._init;
        return t(e._payload);
      } catch (e) {
        throw typeof e == `object` && e && typeof e.then == `function` ? ((Ma = e), Ta) : e;
      }
    }
    var Ma = null;
    function Na() {
      if (Ma === null) throw Error(i(459));
      var e = Ma;
      return ((Ma = null), e);
    }
    function Pa(e) {
      if (e === Ta || e === Da) throw Error(i(483));
    }
    var Fa = null,
      Ia = 0;
    function La(e) {
      var t = Ia;
      return ((Ia += 1), Fa === null && (Fa = []), Aa(Fa, e, t));
    }
    function Ra(e, t) {
      ((t = t.props.ref), (e.ref = t === void 0 ? null : t));
    }
    function za(e, t) {
      throw t.$$typeof === p
        ? Error(i(525))
        : ((e = Object.prototype.toString.call(t)),
          Error(
            i(
              31,
              e === `[object Object]` ? `object with keys {` + Object.keys(t).join(`, `) + `}` : e,
            ),
          ));
    }
    function Ba(e) {
      function t(t, n) {
        if (e) {
          var r = t.deletions;
          r === null ? ((t.deletions = [n]), (t.flags |= 16)) : r.push(n);
        }
      }
      function n(n, r) {
        if (!e) return null;
        for (; r !== null;) (t(n, r), (r = r.sibling));
        return null;
      }
      function r(e) {
        for (var t = new Map(); e !== null;)
          (e.key === null ? t.set(e.index, e) : t.set(e.key, e), (e = e.sibling));
        return t;
      }
      function a(e, t) {
        return ((e = pi(e, t)), (e.index = 0), (e.sibling = null), e);
      }
      function o(t, n, r) {
        return (
          (t.index = r),
          e
            ? ((r = t.alternate),
              r === null
                ? ((t.flags |= 67108866), n)
                : ((r = r.index), r < n ? ((t.flags |= 67108866), n) : r))
            : ((t.flags |= 1048576), n)
        );
      }
      function s(t) {
        return (e && t.alternate === null && (t.flags |= 67108866), t);
      }
      function c(e, t, n, r) {
        return t === null || t.tag !== 6
          ? ((t = _i(n, e.mode, r)), (t.return = e), t)
          : ((t = a(t, n)), (t.return = e), t);
      }
      function l(e, t, n, r) {
        var i = n.type;
        return i === g
          ? d(e, t, n.props.children, r, n.key)
          : t !== null &&
              (t.elementType === i ||
                (typeof i == `object` && i && i.$$typeof === w && ja(i) === t.type))
            ? ((t = a(t, n.props)), Ra(t, n), (t.return = e), t)
            : ((t = hi(n.type, n.key, n.props, null, e.mode, r)), Ra(t, n), (t.return = e), t);
      }
      function u(e, t, n, r) {
        return t === null ||
          t.tag !== 4 ||
          t.stateNode.containerInfo !== n.containerInfo ||
          t.stateNode.implementation !== n.implementation
          ? ((t = yi(n, e.mode, r)), (t.return = e), t)
          : ((t = a(t, n.children || [])), (t.return = e), t);
      }
      function d(e, t, n, r, i) {
        return t === null || t.tag !== 7
          ? ((t = gi(n, e.mode, r, i)), (t.return = e), t)
          : ((t = a(t, n)), (t.return = e), t);
      }
      function f(e, t, n) {
        if ((typeof t == `string` && t !== ``) || typeof t == `number` || typeof t == `bigint`)
          return ((t = _i(`` + t, e.mode, n)), (t.return = e), t);
        if (typeof t == `object` && t) {
          switch (t.$$typeof) {
            case m:
              return (
                (n = hi(t.type, t.key, t.props, null, e.mode, n)),
                Ra(n, t),
                (n.return = e),
                n
              );
            case h:
              return ((t = yi(t, e.mode, n)), (t.return = e), t);
            case w:
              return ((t = ja(t)), f(e, t, n));
          }
          if (se(t) || ie(t)) return ((t = gi(t, e.mode, n, null)), (t.return = e), t);
          if (typeof t.then == `function`) return f(e, La(t), n);
          if (t.$$typeof === b) return f(e, aa(e, t), n);
          za(e, t);
        }
        return null;
      }
      function p(e, t, n, r) {
        var i = t === null ? null : t.key;
        if ((typeof n == `string` && n !== ``) || typeof n == `number` || typeof n == `bigint`)
          return i === null ? c(e, t, `` + n, r) : null;
        if (typeof n == `object` && n) {
          switch (n.$$typeof) {
            case m:
              return n.key === i ? l(e, t, n, r) : null;
            case h:
              return n.key === i ? u(e, t, n, r) : null;
            case w:
              return ((n = ja(n)), p(e, t, n, r));
          }
          if (se(n) || ie(n)) return i === null ? d(e, t, n, r, null) : null;
          if (typeof n.then == `function`) return p(e, t, La(n), r);
          if (n.$$typeof === b) return p(e, t, aa(e, n), r);
          za(e, n);
        }
        return null;
      }
      function _(e, t, n, r, i) {
        if ((typeof r == `string` && r !== ``) || typeof r == `number` || typeof r == `bigint`)
          return ((e = e.get(n) || null), c(t, e, `` + r, i));
        if (typeof r == `object` && r) {
          switch (r.$$typeof) {
            case m:
              return ((e = e.get(r.key === null ? n : r.key) || null), l(t, e, r, i));
            case h:
              return ((e = e.get(r.key === null ? n : r.key) || null), u(t, e, r, i));
            case w:
              return ((r = ja(r)), _(e, t, n, r, i));
          }
          if (se(r) || ie(r)) return ((e = e.get(n) || null), d(t, e, r, i, null));
          if (typeof r.then == `function`) return _(e, t, n, La(r), i);
          if (r.$$typeof === b) return _(e, t, n, aa(t, r), i);
          za(t, r);
        }
        return null;
      }
      function v(i, a, s, c) {
        for (
          var l = null, u = null, d = a, m = (a = 0), h = null;
          d !== null && m < s.length;
          m++
        ) {
          d.index > m ? ((h = d), (d = null)) : (h = d.sibling);
          var g = p(i, d, s[m], c);
          if (g === null) {
            d === null && (d = h);
            break;
          }
          (e && d && g.alternate === null && t(i, d),
            (a = o(g, a, m)),
            u === null ? (l = g) : (u.sibling = g),
            (u = g),
            (d = h));
        }
        if (m === s.length) return (n(i, d), N && ji(i, m), l);
        if (d === null) {
          for (; m < s.length; m++)
            ((d = f(i, s[m], c)),
              d !== null && ((a = o(d, a, m)), u === null ? (l = d) : (u.sibling = d), (u = d)));
          return (N && ji(i, m), l);
        }
        for (d = r(d); m < s.length; m++)
          ((h = _(d, i, m, s[m], c)),
            h !== null &&
              (e && h.alternate !== null && d.delete(h.key === null ? m : h.key),
              (a = o(h, a, m)),
              u === null ? (l = h) : (u.sibling = h),
              (u = h)));
        return (
          e &&
            d.forEach(function (e) {
              return t(i, e);
            }),
          N && ji(i, m),
          l
        );
      }
      function y(a, s, c, l) {
        if (c == null) throw Error(i(151));
        for (
          var u = null, d = null, m = s, h = (s = 0), g = null, v = c.next();
          m !== null && !v.done;
          h++, v = c.next()
        ) {
          m.index > h ? ((g = m), (m = null)) : (g = m.sibling);
          var y = p(a, m, v.value, l);
          if (y === null) {
            m === null && (m = g);
            break;
          }
          (e && m && y.alternate === null && t(a, m),
            (s = o(y, s, h)),
            d === null ? (u = y) : (d.sibling = y),
            (d = y),
            (m = g));
        }
        if (v.done) return (n(a, m), N && ji(a, h), u);
        if (m === null) {
          for (; !v.done; h++, v = c.next())
            ((v = f(a, v.value, l)),
              v !== null && ((s = o(v, s, h)), d === null ? (u = v) : (d.sibling = v), (d = v)));
          return (N && ji(a, h), u);
        }
        for (m = r(m); !v.done; h++, v = c.next())
          ((v = _(m, a, h, v.value, l)),
            v !== null &&
              (e && v.alternate !== null && m.delete(v.key === null ? h : v.key),
              (s = o(v, s, h)),
              d === null ? (u = v) : (d.sibling = v),
              (d = v)));
        return (
          e &&
            m.forEach(function (e) {
              return t(a, e);
            }),
          N && ji(a, h),
          u
        );
      }
      function x(e, r, o, c) {
        if (
          (typeof o == `object` && o && o.type === g && o.key === null && (o = o.props.children),
          typeof o == `object` && o)
        ) {
          switch (o.$$typeof) {
            case m:
              a: {
                for (var l = o.key; r !== null;) {
                  if (r.key === l) {
                    if (((l = o.type), l === g)) {
                      if (r.tag === 7) {
                        (n(e, r.sibling), (c = a(r, o.props.children)), (c.return = e), (e = c));
                        break a;
                      }
                    } else if (
                      r.elementType === l ||
                      (typeof l == `object` && l && l.$$typeof === w && ja(l) === r.type)
                    ) {
                      (n(e, r.sibling), (c = a(r, o.props)), Ra(c, o), (c.return = e), (e = c));
                      break a;
                    }
                    n(e, r);
                    break;
                  }
                  (t(e, r), (r = r.sibling));
                }
                o.type === g
                  ? ((c = gi(o.props.children, e.mode, c, o.key)), (c.return = e), (e = c))
                  : ((c = hi(o.type, o.key, o.props, null, e.mode, c)),
                    Ra(c, o),
                    (c.return = e),
                    (e = c));
              }
              return s(e);
            case h:
              a: {
                for (l = o.key; r !== null;) {
                  if (r.key === l) {
                    if (
                      r.tag === 4 &&
                      r.stateNode.containerInfo === o.containerInfo &&
                      r.stateNode.implementation === o.implementation
                    ) {
                      (n(e, r.sibling), (c = a(r, o.children || [])), (c.return = e), (e = c));
                      break a;
                    }
                    n(e, r);
                    break;
                  }
                  (t(e, r), (r = r.sibling));
                }
                ((c = yi(o, e.mode, c)), (c.return = e), (e = c));
              }
              return s(e);
            case w:
              return ((o = ja(o)), x(e, r, o, c));
          }
          if (se(o)) return v(e, r, o, c);
          if (ie(o)) {
            if (((l = ie(o)), typeof l != `function`)) throw Error(i(150));
            return ((o = l.call(o)), y(e, r, o, c));
          }
          if (typeof o.then == `function`) return x(e, r, La(o), c);
          if (o.$$typeof === b) return x(e, r, aa(e, o), c);
          za(e, o);
        }
        return (typeof o == `string` && o !== ``) || typeof o == `number` || typeof o == `bigint`
          ? ((o = `` + o),
            r !== null && r.tag === 6
              ? (n(e, r.sibling), (c = a(r, o)), (c.return = e), (e = c))
              : (n(e, r), (c = _i(o, e.mode, c)), (c.return = e), (e = c)),
            s(e))
          : n(e, r);
      }
      return function (e, t, n, r) {
        try {
          Ia = 0;
          var i = x(e, t, n, r);
          return ((Fa = null), i);
        } catch (t) {
          if (t === Ta || t === Da) throw t;
          var a = di(29, t, null, e.mode);
          return ((a.lanes = r), (a.return = e), a);
        }
      };
    }
    var Va = Ba(!0),
      Ha = Ba(!1),
      Ua = !1;
    function Wa(e) {
      e.updateQueue = {
        baseState: e.memoizedState,
        firstBaseUpdate: null,
        lastBaseUpdate: null,
        shared: { pending: null, lanes: 0, hiddenCallbacks: null },
        callbacks: null,
      };
    }
    function Ga(e, t) {
      ((e = e.updateQueue),
        t.updateQueue === e &&
          (t.updateQueue = {
            baseState: e.baseState,
            firstBaseUpdate: e.firstBaseUpdate,
            lastBaseUpdate: e.lastBaseUpdate,
            shared: e.shared,
            callbacks: null,
          }));
    }
    function Ka(e) {
      return { lane: e, tag: 0, payload: null, callback: null, next: null };
    }
    function qa(e, t, n) {
      var r = e.updateQueue;
      if (r === null) return null;
      if (((r = r.shared), I & 2)) {
        var i = r.pending;
        return (
          i === null ? (t.next = t) : ((t.next = i.next), (i.next = t)),
          (r.pending = t),
          (t = ci(e)),
          si(e, null, n),
          t
        );
      }
      return (ii(e, r, t, n), ci(e));
    }
    function Ja(e, t, n) {
      if (((t = t.updateQueue), t !== null && ((t = t.shared), n & 4194048))) {
        var r = t.lanes;
        ((r &= e.pendingLanes), (n |= r), (t.lanes = n), rt(e, n));
      }
    }
    function Ya(e, t) {
      var n = e.updateQueue,
        r = e.alternate;
      if (r !== null && ((r = r.updateQueue), n === r)) {
        var i = null,
          a = null;
        if (((n = n.firstBaseUpdate), n !== null)) {
          do {
            var o = { lane: n.lane, tag: n.tag, payload: n.payload, callback: null, next: null };
            (a === null ? (i = a = o) : (a = a.next = o), (n = n.next));
          } while (n !== null);
          a === null ? (i = a = t) : (a = a.next = t);
        } else i = a = t;
        ((n = {
          baseState: r.baseState,
          firstBaseUpdate: i,
          lastBaseUpdate: a,
          shared: r.shared,
          callbacks: r.callbacks,
        }),
          (e.updateQueue = n));
        return;
      }
      ((e = n.lastBaseUpdate),
        e === null ? (n.firstBaseUpdate = t) : (e.next = t),
        (n.lastBaseUpdate = t));
    }
    var Xa = !1;
    function Za() {
      if (Xa) {
        var e = ga;
        if (e !== null) throw e;
      }
    }
    function Qa(e, t, n, r) {
      Xa = !1;
      var i = e.updateQueue;
      Ua = !1;
      var a = i.firstBaseUpdate,
        o = i.lastBaseUpdate,
        s = i.shared.pending;
      if (s !== null) {
        i.shared.pending = null;
        var c = s,
          l = c.next;
        ((c.next = null), o === null ? (a = l) : (o.next = l), (o = c));
        var u = e.alternate;
        u !== null &&
          ((u = u.updateQueue),
          (s = u.lastBaseUpdate),
          s !== o && (s === null ? (u.firstBaseUpdate = l) : (s.next = l), (u.lastBaseUpdate = c)));
      }
      if (a !== null) {
        var d = i.baseState;
        ((o = 0), (u = l = c = null), (s = a));
        do {
          var p = s.lane & -536870913,
            m = p !== s.lane;
          if (m ? (R & p) === p : (r & p) === p) {
            (p !== 0 && p === ha && (Xa = !0),
              u !== null &&
                (u = u.next =
                  { lane: 0, tag: s.tag, payload: s.payload, callback: null, next: null }));
            a: {
              var h = e,
                g = s;
              p = t;
              var _ = n;
              switch (g.tag) {
                case 1:
                  if (((h = g.payload), typeof h == `function`)) {
                    d = h.call(_, d, p);
                    break a;
                  }
                  d = h;
                  break a;
                case 3:
                  h.flags = (h.flags & -65537) | 128;
                case 0:
                  if (
                    ((h = g.payload), (p = typeof h == `function` ? h.call(_, d, p) : h), p == null)
                  )
                    break a;
                  d = f({}, d, p);
                  break a;
                case 2:
                  Ua = !0;
              }
            }
            ((p = s.callback),
              p !== null &&
                ((e.flags |= 64),
                m && (e.flags |= 8192),
                (m = i.callbacks),
                m === null ? (i.callbacks = [p]) : m.push(p)));
          } else
            ((m = { lane: p, tag: s.tag, payload: s.payload, callback: s.callback, next: null }),
              u === null ? ((l = u = m), (c = d)) : (u = u.next = m),
              (o |= p));
          if (((s = s.next), s === null)) {
            if (((s = i.shared.pending), s === null)) break;
            ((m = s),
              (s = m.next),
              (m.next = null),
              (i.lastBaseUpdate = m),
              (i.shared.pending = null));
          }
        } while (1);
        (u === null && (c = d),
          (i.baseState = c),
          (i.firstBaseUpdate = l),
          (i.lastBaseUpdate = u),
          a === null && (i.shared.lanes = 0),
          (eu |= o),
          (e.lanes = o),
          (e.memoizedState = d));
      }
    }
    function $a(e, t) {
      if (typeof e != `function`) throw Error(i(191, e));
      e.call(t);
    }
    function eo(e, t) {
      var n = e.callbacks;
      if (n !== null) for (e.callbacks = null, e = 0; e < n.length; e++) $a(n[e], t);
    }
    var to = ue(null),
      no = ue(0);
    function ro(e, t) {
      ((e = Ql), O(no, e), O(to, t), (Ql = e | t.baseLanes));
    }
    function io() {
      (O(no, Ql), O(to, to.current));
    }
    function ao() {
      ((Ql = no.current), de(to), de(no));
    }
    var oo = ue(null),
      so = null;
    function co(e) {
      var t = e.alternate;
      (O(mo, mo.current & 1),
        O(oo, e),
        so === null && (t === null || to.current !== null || t.memoizedState !== null) && (so = e));
    }
    function lo(e) {
      (O(mo, mo.current), O(oo, e), so === null && (so = e));
    }
    function uo(e) {
      e.tag === 22 ? (O(mo, mo.current), O(oo, e), so === null && (so = e)) : fo(e);
    }
    function fo() {
      (O(mo, mo.current), O(oo, oo.current));
    }
    function po(e) {
      (de(oo), so === e && (so = null), de(mo));
    }
    var mo = ue(0);
    function ho(e) {
      for (var t = e; t !== null;) {
        if (t.tag === 13) {
          var n = t.memoizedState;
          if (n !== null && ((n = n.dehydrated), n === null || hf(n) || gf(n))) return t;
        } else if (
          t.tag === 19 &&
          (t.memoizedProps.revealOrder === `forwards` ||
            t.memoizedProps.revealOrder === `backwards` ||
            t.memoizedProps.revealOrder === `unstable_legacy-backwards` ||
            t.memoizedProps.revealOrder === `together`)
        ) {
          if (t.flags & 128) return t;
        } else if (t.child !== null) {
          ((t.child.return = t), (t = t.child));
          continue;
        }
        if (t === e) break;
        for (; t.sibling === null;) {
          if (t.return === null || t.return === e) return null;
          t = t.return;
        }
        ((t.sibling.return = t.return), (t = t.sibling));
      }
      return null;
    }
    var go = 0,
      P = null,
      _o = null,
      vo = null,
      yo = !1,
      bo = !1,
      xo = !1,
      So = 0,
      Co = 0,
      wo = null,
      To = 0;
    function Eo() {
      throw Error(i(321));
    }
    function Do(e, t) {
      if (t === null) return !1;
      for (var n = 0; n < t.length && n < e.length; n++) if (!Tr(e[n], t[n])) return !1;
      return !0;
    }
    function Oo(e, t, n, r, i, a) {
      return (
        (go = a),
        (P = t),
        (t.memoizedState = null),
        (t.updateQueue = null),
        (t.lanes = 0),
        (T.H = e === null || e.memoizedState === null ? Gs : Ks),
        (xo = !1),
        (a = n(r, i)),
        (xo = !1),
        bo && (a = Ao(t, n, r, i)),
        ko(e),
        a
      );
    }
    function ko(e) {
      T.H = Ws;
      var t = _o !== null && _o.next !== null;
      if (((go = 0), (vo = _o = P = null), (yo = !1), (Co = 0), (wo = null), t))
        throw Error(i(300));
      e === null || cc || ((e = e.dependencies), e !== null && na(e) && (cc = !0));
    }
    function Ao(e, t, n, r) {
      P = e;
      var a = 0;
      do {
        if ((bo && (wo = null), (Co = 0), (bo = !1), 25 <= a)) throw Error(i(301));
        if (((a += 1), (vo = _o = null), e.updateQueue != null)) {
          var o = e.updateQueue;
          ((o.lastEffect = null),
            (o.events = null),
            (o.stores = null),
            o.memoCache != null && (o.memoCache.index = 0));
        }
        ((T.H = qs), (o = t(n, r)));
      } while (bo);
      return o;
    }
    function jo() {
      var e = T.H,
        t = e.useState()[0];
      return (
        (t = typeof t.then == `function` ? Ro(t) : t),
        (e = e.useState()[0]),
        (_o === null ? null : _o.memoizedState) !== e && (P.flags |= 1024),
        t
      );
    }
    function Mo() {
      var e = So !== 0;
      return ((So = 0), e);
    }
    function No(e, t, n) {
      ((t.updateQueue = e.updateQueue), (t.flags &= -2053), (e.lanes &= ~n));
    }
    function Po(e) {
      if (yo) {
        for (e = e.memoizedState; e !== null;) {
          var t = e.queue;
          (t !== null && (t.pending = null), (e = e.next));
        }
        yo = !1;
      }
      ((go = 0), (vo = _o = P = null), (bo = !1), (Co = So = 0), (wo = null));
    }
    function Fo() {
      var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
      return (vo === null ? (P.memoizedState = vo = e) : (vo = vo.next = e), vo);
    }
    function Io() {
      if (_o === null) {
        var e = P.alternate;
        e = e === null ? null : e.memoizedState;
      } else e = _o.next;
      var t = vo === null ? P.memoizedState : vo.next;
      if (t !== null) ((vo = t), (_o = e));
      else {
        if (e === null) throw P.alternate === null ? Error(i(467)) : Error(i(310));
        ((_o = e),
          (e = {
            memoizedState: _o.memoizedState,
            baseState: _o.baseState,
            baseQueue: _o.baseQueue,
            queue: _o.queue,
            next: null,
          }),
          vo === null ? (P.memoizedState = vo = e) : (vo = vo.next = e));
      }
      return vo;
    }
    function Lo() {
      return { lastEffect: null, events: null, stores: null, memoCache: null };
    }
    function Ro(e) {
      var t = Co;
      return (
        (Co += 1),
        wo === null && (wo = []),
        (e = Aa(wo, e, t)),
        (t = P),
        (vo === null ? t.memoizedState : vo.next) === null &&
          ((t = t.alternate), (T.H = t === null || t.memoizedState === null ? Gs : Ks)),
        e
      );
    }
    function zo(e) {
      if (typeof e == `object` && e) {
        if (typeof e.then == `function`) return Ro(e);
        if (e.$$typeof === b) return ia(e);
      }
      throw Error(i(438, String(e)));
    }
    function Bo(e) {
      var t = null,
        n = P.updateQueue;
      if ((n !== null && (t = n.memoCache), t == null)) {
        var r = P.alternate;
        r !== null &&
          ((r = r.updateQueue),
          r !== null &&
            ((r = r.memoCache),
            r != null &&
              (t = {
                data: r.data.map(function (e) {
                  return e.slice();
                }),
                index: 0,
              })));
      }
      if (
        ((t ??= { data: [], index: 0 }),
        n === null && ((n = Lo()), (P.updateQueue = n)),
        (n.memoCache = t),
        (n = t.data[t.index]),
        n === void 0)
      )
        for (n = t.data[t.index] = Array(e), r = 0; r < e; r++) n[r] = ne;
      return (t.index++, n);
    }
    function Vo(e, t) {
      return typeof t == `function` ? t(e) : t;
    }
    function Ho(e) {
      return Uo(Io(), _o, e);
    }
    function Uo(e, t, n) {
      var r = e.queue;
      if (r === null) throw Error(i(311));
      r.lastRenderedReducer = n;
      var a = e.baseQueue,
        o = r.pending;
      if (o !== null) {
        if (a !== null) {
          var s = a.next;
          ((a.next = o.next), (o.next = s));
        }
        ((t.baseQueue = a = o), (r.pending = null));
      }
      if (((o = e.baseState), a === null)) e.memoizedState = o;
      else {
        t = a.next;
        var c = (s = null),
          l = null,
          u = t,
          d = !1;
        do {
          var f = u.lane & -536870913;
          if (f === u.lane ? (go & f) === f : (R & f) === f) {
            var p = u.revertLane;
            if (p === 0)
              (l !== null &&
                (l = l.next =
                  {
                    lane: 0,
                    revertLane: 0,
                    gesture: null,
                    action: u.action,
                    hasEagerState: u.hasEagerState,
                    eagerState: u.eagerState,
                    next: null,
                  }),
                f === ha && (d = !0));
            else if ((go & p) === p) {
              ((u = u.next), p === ha && (d = !0));
              continue;
            } else
              ((f = {
                lane: 0,
                revertLane: u.revertLane,
                gesture: null,
                action: u.action,
                hasEagerState: u.hasEagerState,
                eagerState: u.eagerState,
                next: null,
              }),
                l === null ? ((c = l = f), (s = o)) : (l = l.next = f),
                (P.lanes |= p),
                (eu |= p));
            ((f = u.action), xo && n(o, f), (o = u.hasEagerState ? u.eagerState : n(o, f)));
          } else
            ((p = {
              lane: f,
              revertLane: u.revertLane,
              gesture: u.gesture,
              action: u.action,
              hasEagerState: u.hasEagerState,
              eagerState: u.eagerState,
              next: null,
            }),
              l === null ? ((c = l = p), (s = o)) : (l = l.next = p),
              (P.lanes |= f),
              (eu |= f));
          u = u.next;
        } while (u !== null && u !== t);
        if (
          (l === null ? (s = o) : (l.next = c),
          !Tr(o, e.memoizedState) && ((cc = !0), d && ((n = ga), n !== null)))
        )
          throw n;
        ((e.memoizedState = o), (e.baseState = s), (e.baseQueue = l), (r.lastRenderedState = o));
      }
      return (a === null && (r.lanes = 0), [e.memoizedState, r.dispatch]);
    }
    function Wo(e) {
      var t = Io(),
        n = t.queue;
      if (n === null) throw Error(i(311));
      n.lastRenderedReducer = e;
      var r = n.dispatch,
        a = n.pending,
        o = t.memoizedState;
      if (a !== null) {
        n.pending = null;
        var s = (a = a.next);
        do ((o = e(o, s.action)), (s = s.next));
        while (s !== a);
        (Tr(o, t.memoizedState) || (cc = !0),
          (t.memoizedState = o),
          t.baseQueue === null && (t.baseState = o),
          (n.lastRenderedState = o));
      }
      return [o, r];
    }
    function Go(e, t, n) {
      var r = P,
        a = Io(),
        o = N;
      if (o) {
        if (n === void 0) throw Error(i(407));
        n = n();
      } else n = t();
      var s = !Tr((_o || a).memoizedState, n);
      if (
        (s && ((a.memoizedState = n), (cc = !0)),
        (a = a.queue),
        gs(Jo.bind(null, r, a, e), [e]),
        a.getSnapshot !== t || s || (vo !== null && vo.memoizedState.tag & 1))
      ) {
        if (
          ((r.flags |= 2048),
          ds(9, { destroy: void 0 }, qo.bind(null, r, a, n, t), null),
          Kl === null)
        )
          throw Error(i(349));
        o || go & 127 || Ko(r, t, n);
      }
      return n;
    }
    function Ko(e, t, n) {
      ((e.flags |= 16384),
        (e = { getSnapshot: t, value: n }),
        (t = P.updateQueue),
        t === null
          ? ((t = Lo()), (P.updateQueue = t), (t.stores = [e]))
          : ((n = t.stores), n === null ? (t.stores = [e]) : n.push(e)));
    }
    function qo(e, t, n, r) {
      ((t.value = n), (t.getSnapshot = r), Yo(t) && Xo(e));
    }
    function Jo(e, t, n) {
      return n(function () {
        Yo(t) && Xo(e);
      });
    }
    function Yo(e) {
      var t = e.getSnapshot;
      e = e.value;
      try {
        var n = t();
        return !Tr(e, n);
      } catch {
        return !0;
      }
    }
    function Xo(e) {
      var t = oi(e, 2);
      t !== null && wu(t, e, 2);
    }
    function Zo(e) {
      var t = Fo();
      if (typeof e == `function`) {
        var n = e;
        if (((e = n()), xo)) {
          Be(!0);
          try {
            n();
          } finally {
            Be(!1);
          }
        }
      }
      return (
        (t.memoizedState = t.baseState = e),
        (t.queue = {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: Vo,
          lastRenderedState: e,
        }),
        t
      );
    }
    function Qo(e, t, n, r) {
      return ((e.baseState = n), Uo(e, _o, typeof r == `function` ? r : Vo));
    }
    function $o(e, t, n, r, a) {
      if (Vs(e)) throw Error(i(485));
      if (((e = t.action), e !== null)) {
        var o = {
          payload: a,
          action: e,
          next: null,
          isTransition: !0,
          status: `pending`,
          value: null,
          reason: null,
          listeners: [],
          then: function (e) {
            o.listeners.push(e);
          },
        };
        (T.T === null ? (o.isTransition = !1) : n(!0),
          r(o),
          (n = t.pending),
          n === null
            ? ((o.next = t.pending = o), es(t, o))
            : ((o.next = n.next), (t.pending = n.next = o)));
      }
    }
    function es(e, t) {
      var n = t.action,
        r = t.payload,
        i = e.state;
      if (t.isTransition) {
        var a = T.T,
          o = {};
        T.T = o;
        try {
          var s = n(i, r),
            c = T.S;
          (c !== null && c(o, s), ts(e, t, s));
        } catch (n) {
          rs(e, t, n);
        } finally {
          (a !== null && o.types !== null && (a.types = o.types), (T.T = a));
        }
      } else
        try {
          ((a = n(i, r)), ts(e, t, a));
        } catch (n) {
          rs(e, t, n);
        }
    }
    function ts(e, t, n) {
      typeof n == `object` && n && typeof n.then == `function`
        ? n.then(
            function (n) {
              ns(e, t, n);
            },
            function (n) {
              return rs(e, t, n);
            },
          )
        : ns(e, t, n);
    }
    function ns(e, t, n) {
      ((t.status = `fulfilled`),
        (t.value = n),
        is(t),
        (e.state = n),
        (t = e.pending),
        t !== null &&
          ((n = t.next), n === t ? (e.pending = null) : ((n = n.next), (t.next = n), es(e, n))));
    }
    function rs(e, t, n) {
      var r = e.pending;
      if (((e.pending = null), r !== null)) {
        r = r.next;
        do ((t.status = `rejected`), (t.reason = n), is(t), (t = t.next));
        while (t !== r);
      }
      e.action = null;
    }
    function is(e) {
      e = e.listeners;
      for (var t = 0; t < e.length; t++) (0, e[t])();
    }
    function as(e, t) {
      return t;
    }
    function os(e, t) {
      if (N) {
        var n = Kl.formState;
        if (n !== null) {
          a: {
            var r = P;
            if (N) {
              if (Li) {
                b: {
                  for (var i = Li, a = zi; i.nodeType !== 8;) {
                    if (!a) {
                      i = null;
                      break b;
                    }
                    if (((i = vf(i.nextSibling)), i === null)) {
                      i = null;
                      break b;
                    }
                  }
                  ((a = i.data), (i = a === `F!` || a === `F` ? i : null));
                }
                if (i) {
                  ((Li = vf(i.nextSibling)), (r = i.data === `F!`));
                  break a;
                }
              }
              Vi(r);
            }
            r = !1;
          }
          r && (t = n[0]);
        }
      }
      return (
        (n = Fo()),
        (n.memoizedState = n.baseState = t),
        (r = {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: as,
          lastRenderedState: t,
        }),
        (n.queue = r),
        (n = Rs.bind(null, P, r)),
        (r.dispatch = n),
        (r = Zo(!1)),
        (a = Bs.bind(null, P, !1, r.queue)),
        (r = Fo()),
        (i = { state: t, dispatch: null, action: e, pending: null }),
        (r.queue = i),
        (n = $o.bind(null, P, i, a, n)),
        (i.dispatch = n),
        (r.memoizedState = e),
        [t, n, !1]
      );
    }
    function ss(e) {
      return cs(Io(), _o, e);
    }
    function cs(e, t, n) {
      if (
        ((t = Uo(e, t, as)[0]),
        (e = Ho(Vo)[0]),
        typeof t == `object` && t && typeof t.then == `function`)
      )
        try {
          var r = Ro(t);
        } catch (e) {
          throw e === Ta ? Da : e;
        }
      else r = t;
      t = Io();
      var i = t.queue,
        a = i.dispatch;
      return (
        n !== t.memoizedState &&
          ((P.flags |= 2048), ds(9, { destroy: void 0 }, ls.bind(null, i, n), null)),
        [r, a, e]
      );
    }
    function ls(e, t) {
      e.action = t;
    }
    function us(e) {
      var t = Io(),
        n = _o;
      if (n !== null) return cs(t, n, e);
      (Io(), (t = t.memoizedState), (n = Io()));
      var r = n.queue.dispatch;
      return ((n.memoizedState = e), [t, r, !1]);
    }
    function ds(e, t, n, r) {
      return (
        (e = { tag: e, create: n, deps: r, inst: t, next: null }),
        (t = P.updateQueue),
        t === null && ((t = Lo()), (P.updateQueue = t)),
        (n = t.lastEffect),
        n === null
          ? (t.lastEffect = e.next = e)
          : ((r = n.next), (n.next = e), (e.next = r), (t.lastEffect = e)),
        e
      );
    }
    function fs() {
      return Io().memoizedState;
    }
    function ps(e, t, n, r) {
      var i = Fo();
      ((P.flags |= e),
        (i.memoizedState = ds(1 | t, { destroy: void 0 }, n, r === void 0 ? null : r)));
    }
    function ms(e, t, n, r) {
      var i = Io();
      r = r === void 0 ? null : r;
      var a = i.memoizedState.inst;
      _o !== null && r !== null && Do(r, _o.memoizedState.deps)
        ? (i.memoizedState = ds(t, a, n, r))
        : ((P.flags |= e), (i.memoizedState = ds(1 | t, a, n, r)));
    }
    function hs(e, t) {
      ps(8390656, 8, e, t);
    }
    function gs(e, t) {
      ms(2048, 8, e, t);
    }
    function _s(e) {
      P.flags |= 4;
      var t = P.updateQueue;
      if (t === null) ((t = Lo()), (P.updateQueue = t), (t.events = [e]));
      else {
        var n = t.events;
        n === null ? (t.events = [e]) : n.push(e);
      }
    }
    function vs(e) {
      var t = Io().memoizedState;
      return (
        _s({ ref: t, nextImpl: e }),
        function () {
          if (I & 2) throw Error(i(440));
          return t.impl.apply(void 0, arguments);
        }
      );
    }
    function ys(e, t) {
      return ms(4, 2, e, t);
    }
    function bs(e, t) {
      return ms(4, 4, e, t);
    }
    function xs(e, t) {
      if (typeof t == `function`) {
        e = e();
        var n = t(e);
        return function () {
          typeof n == `function` ? n() : t(null);
        };
      }
      if (t != null)
        return (
          (e = e()),
          (t.current = e),
          function () {
            t.current = null;
          }
        );
    }
    function Ss(e, t, n) {
      ((n = n == null ? null : n.concat([e])), ms(4, 4, xs.bind(null, t, e), n));
    }
    function Cs() {}
    function ws(e, t) {
      var n = Io();
      t = t === void 0 ? null : t;
      var r = n.memoizedState;
      return t !== null && Do(t, r[1]) ? r[0] : ((n.memoizedState = [e, t]), e);
    }
    function Ts(e, t) {
      var n = Io();
      t = t === void 0 ? null : t;
      var r = n.memoizedState;
      if (t !== null && Do(t, r[1])) return r[0];
      if (((r = e()), xo)) {
        Be(!0);
        try {
          e();
        } finally {
          Be(!1);
        }
      }
      return ((n.memoizedState = [r, t]), r);
    }
    function Es(e, t, n) {
      return n === void 0 || (go & 1073741824 && !(R & 261930))
        ? (e.memoizedState = t)
        : ((e.memoizedState = n), (e = Cu()), (P.lanes |= e), (eu |= e), n);
    }
    function Ds(e, t, n, r) {
      return Tr(n, t)
        ? n
        : to.current === null
          ? !(go & 42) || (go & 1073741824 && !(R & 261930))
            ? ((cc = !0), (e.memoizedState = n))
            : ((e = Cu()), (P.lanes |= e), (eu |= e), t)
          : ((e = Es(e, n, r)), Tr(e, t) || (cc = !0), e);
    }
    function Os(e, t, n, r, i) {
      var a = E.p;
      E.p = a !== 0 && 8 > a ? a : 8;
      var o = T.T,
        s = {};
      ((T.T = s), Bs(e, !1, t, n));
      try {
        var c = i(),
          l = T.S;
        (l !== null && l(s, c),
          typeof c == `object` && c && typeof c.then == `function`
            ? zs(e, t, ya(c, r), Su(e))
            : zs(e, t, r, Su(e)));
      } catch (n) {
        zs(e, t, { then: function () {}, status: `rejected`, reason: n }, Su());
      } finally {
        ((E.p = a), o !== null && s.types !== null && (o.types = s.types), (T.T = o));
      }
    }
    function ks() {}
    function As(e, t, n, r) {
      if (e.tag !== 5) throw Error(i(476));
      var a = js(e).queue;
      Os(
        e,
        a,
        t,
        D,
        n === null
          ? ks
          : function () {
              return (Ms(e), n(r));
            },
      );
    }
    function js(e) {
      var t = e.memoizedState;
      if (t !== null) return t;
      t = {
        memoizedState: D,
        baseState: D,
        baseQueue: null,
        queue: {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: Vo,
          lastRenderedState: D,
        },
        next: null,
      };
      var n = {};
      return (
        (t.next = {
          memoizedState: n,
          baseState: n,
          baseQueue: null,
          queue: {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: Vo,
            lastRenderedState: n,
          },
          next: null,
        }),
        (e.memoizedState = t),
        (e = e.alternate),
        e !== null && (e.memoizedState = t),
        t
      );
    }
    function Ms(e) {
      var t = js(e);
      (t.next === null && (t = e.alternate.memoizedState), zs(e, t.next.queue, {}, Su()));
    }
    function Ns() {
      return ia(up);
    }
    function Ps() {
      return Io().memoizedState;
    }
    function Fs() {
      return Io().memoizedState;
    }
    function Is(e) {
      for (var t = e.return; t !== null;) {
        switch (t.tag) {
          case 24:
          case 3:
            var n = Su();
            e = Ka(n);
            var r = qa(t, e, n);
            (r !== null && (wu(r, t, n), Ja(r, t, n)), (t = { cache: da() }), (e.payload = t));
            return;
        }
        t = t.return;
      }
    }
    function Ls(e, t, n) {
      var r = Su();
      ((n = {
        lane: r,
        revertLane: 0,
        gesture: null,
        action: n,
        hasEagerState: !1,
        eagerState: null,
        next: null,
      }),
        Vs(e) ? Hs(t, n) : ((n = ai(e, t, n, r)), n !== null && (wu(n, e, r), Us(n, t, r))));
    }
    function Rs(e, t, n) {
      zs(e, t, n, Su());
    }
    function zs(e, t, n, r) {
      var i = {
        lane: r,
        revertLane: 0,
        gesture: null,
        action: n,
        hasEagerState: !1,
        eagerState: null,
        next: null,
      };
      if (Vs(e)) Hs(t, i);
      else {
        var a = e.alternate;
        if (
          e.lanes === 0 &&
          (a === null || a.lanes === 0) &&
          ((a = t.lastRenderedReducer), a !== null)
        )
          try {
            var o = t.lastRenderedState,
              s = a(o, n);
            if (((i.hasEagerState = !0), (i.eagerState = s), Tr(s, o)))
              return (ii(e, t, i, 0), Kl === null && ri(), !1);
          } catch {}
        if (((n = ai(e, t, i, r)), n !== null)) return (wu(n, e, r), Us(n, t, r), !0);
      }
      return !1;
    }
    function Bs(e, t, n, r) {
      if (
        ((r = {
          lane: 2,
          revertLane: bd(),
          gesture: null,
          action: r,
          hasEagerState: !1,
          eagerState: null,
          next: null,
        }),
        Vs(e))
      ) {
        if (t) throw Error(i(479));
      } else ((t = ai(e, n, r, 2)), t !== null && wu(t, e, 2));
    }
    function Vs(e) {
      var t = e.alternate;
      return e === P || (t !== null && t === P);
    }
    function Hs(e, t) {
      bo = yo = !0;
      var n = e.pending;
      (n === null ? (t.next = t) : ((t.next = n.next), (n.next = t)), (e.pending = t));
    }
    function Us(e, t, n) {
      if (n & 4194048) {
        var r = t.lanes;
        ((r &= e.pendingLanes), (n |= r), (t.lanes = n), rt(e, n));
      }
    }
    var Ws = {
      readContext: ia,
      use: zo,
      useCallback: Eo,
      useContext: Eo,
      useEffect: Eo,
      useImperativeHandle: Eo,
      useLayoutEffect: Eo,
      useInsertionEffect: Eo,
      useMemo: Eo,
      useReducer: Eo,
      useRef: Eo,
      useState: Eo,
      useDebugValue: Eo,
      useDeferredValue: Eo,
      useTransition: Eo,
      useSyncExternalStore: Eo,
      useId: Eo,
      useHostTransitionStatus: Eo,
      useFormState: Eo,
      useActionState: Eo,
      useOptimistic: Eo,
      useMemoCache: Eo,
      useCacheRefresh: Eo,
    };
    Ws.useEffectEvent = Eo;
    var Gs = {
        readContext: ia,
        use: zo,
        useCallback: function (e, t) {
          return ((Fo().memoizedState = [e, t === void 0 ? null : t]), e);
        },
        useContext: ia,
        useEffect: hs,
        useImperativeHandle: function (e, t, n) {
          ((n = n == null ? null : n.concat([e])), ps(4194308, 4, xs.bind(null, t, e), n));
        },
        useLayoutEffect: function (e, t) {
          return ps(4194308, 4, e, t);
        },
        useInsertionEffect: function (e, t) {
          ps(4, 2, e, t);
        },
        useMemo: function (e, t) {
          var n = Fo();
          t = t === void 0 ? null : t;
          var r = e();
          if (xo) {
            Be(!0);
            try {
              e();
            } finally {
              Be(!1);
            }
          }
          return ((n.memoizedState = [r, t]), r);
        },
        useReducer: function (e, t, n) {
          var r = Fo();
          if (n !== void 0) {
            var i = n(t);
            if (xo) {
              Be(!0);
              try {
                n(t);
              } finally {
                Be(!1);
              }
            }
          } else i = t;
          return (
            (r.memoizedState = r.baseState = i),
            (e = {
              pending: null,
              lanes: 0,
              dispatch: null,
              lastRenderedReducer: e,
              lastRenderedState: i,
            }),
            (r.queue = e),
            (e = e.dispatch = Ls.bind(null, P, e)),
            [r.memoizedState, e]
          );
        },
        useRef: function (e) {
          var t = Fo();
          return ((e = { current: e }), (t.memoizedState = e));
        },
        useState: function (e) {
          e = Zo(e);
          var t = e.queue,
            n = Rs.bind(null, P, t);
          return ((t.dispatch = n), [e.memoizedState, n]);
        },
        useDebugValue: Cs,
        useDeferredValue: function (e, t) {
          return Es(Fo(), e, t);
        },
        useTransition: function () {
          var e = Zo(!1);
          return ((e = Os.bind(null, P, e.queue, !0, !1)), (Fo().memoizedState = e), [!1, e]);
        },
        useSyncExternalStore: function (e, t, n) {
          var r = P,
            a = Fo();
          if (N) {
            if (n === void 0) throw Error(i(407));
            n = n();
          } else {
            if (((n = t()), Kl === null)) throw Error(i(349));
            R & 127 || Ko(r, t, n);
          }
          a.memoizedState = n;
          var o = { value: n, getSnapshot: t };
          return (
            (a.queue = o),
            hs(Jo.bind(null, r, o, e), [e]),
            (r.flags |= 2048),
            ds(9, { destroy: void 0 }, qo.bind(null, r, o, n, t), null),
            n
          );
        },
        useId: function () {
          var e = Fo(),
            t = Kl.identifierPrefix;
          if (N) {
            var n = Ai,
              r = ki;
            ((n = (r & ~(1 << (32 - Ve(r) - 1))).toString(32) + n),
              (t = `_` + t + `R_` + n),
              (n = So++),
              0 < n && (t += `H` + n.toString(32)),
              (t += `_`));
          } else ((n = To++), (t = `_` + t + `r_` + n.toString(32) + `_`));
          return (e.memoizedState = t);
        },
        useHostTransitionStatus: Ns,
        useFormState: os,
        useActionState: os,
        useOptimistic: function (e) {
          var t = Fo();
          t.memoizedState = t.baseState = e;
          var n = {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: null,
            lastRenderedState: null,
          };
          return ((t.queue = n), (t = Bs.bind(null, P, !0, n)), (n.dispatch = t), [e, t]);
        },
        useMemoCache: Bo,
        useCacheRefresh: function () {
          return (Fo().memoizedState = Is.bind(null, P));
        },
        useEffectEvent: function (e) {
          var t = Fo(),
            n = { impl: e };
          return (
            (t.memoizedState = n),
            function () {
              if (I & 2) throw Error(i(440));
              return n.impl.apply(void 0, arguments);
            }
          );
        },
      },
      Ks = {
        readContext: ia,
        use: zo,
        useCallback: ws,
        useContext: ia,
        useEffect: gs,
        useImperativeHandle: Ss,
        useInsertionEffect: ys,
        useLayoutEffect: bs,
        useMemo: Ts,
        useReducer: Ho,
        useRef: fs,
        useState: function () {
          return Ho(Vo);
        },
        useDebugValue: Cs,
        useDeferredValue: function (e, t) {
          return Ds(Io(), _o.memoizedState, e, t);
        },
        useTransition: function () {
          var e = Ho(Vo)[0],
            t = Io().memoizedState;
          return [typeof e == `boolean` ? e : Ro(e), t];
        },
        useSyncExternalStore: Go,
        useId: Ps,
        useHostTransitionStatus: Ns,
        useFormState: ss,
        useActionState: ss,
        useOptimistic: function (e, t) {
          return Qo(Io(), _o, e, t);
        },
        useMemoCache: Bo,
        useCacheRefresh: Fs,
      };
    Ks.useEffectEvent = vs;
    var qs = {
      readContext: ia,
      use: zo,
      useCallback: ws,
      useContext: ia,
      useEffect: gs,
      useImperativeHandle: Ss,
      useInsertionEffect: ys,
      useLayoutEffect: bs,
      useMemo: Ts,
      useReducer: Wo,
      useRef: fs,
      useState: function () {
        return Wo(Vo);
      },
      useDebugValue: Cs,
      useDeferredValue: function (e, t) {
        var n = Io();
        return _o === null ? Es(n, e, t) : Ds(n, _o.memoizedState, e, t);
      },
      useTransition: function () {
        var e = Wo(Vo)[0],
          t = Io().memoizedState;
        return [typeof e == `boolean` ? e : Ro(e), t];
      },
      useSyncExternalStore: Go,
      useId: Ps,
      useHostTransitionStatus: Ns,
      useFormState: us,
      useActionState: us,
      useOptimistic: function (e, t) {
        var n = Io();
        return _o === null ? ((n.baseState = e), [e, n.queue.dispatch]) : Qo(n, _o, e, t);
      },
      useMemoCache: Bo,
      useCacheRefresh: Fs,
    };
    qs.useEffectEvent = vs;
    function Js(e, t, n, r) {
      ((t = e.memoizedState),
        (n = n(r, t)),
        (n = n == null ? t : f({}, t, n)),
        (e.memoizedState = n),
        e.lanes === 0 && (e.updateQueue.baseState = n));
    }
    var Ys = {
      enqueueSetState: function (e, t, n) {
        e = e._reactInternals;
        var r = Su(),
          i = Ka(r);
        ((i.payload = t),
          n != null && (i.callback = n),
          (t = qa(e, i, r)),
          t !== null && (wu(t, e, r), Ja(t, e, r)));
      },
      enqueueReplaceState: function (e, t, n) {
        e = e._reactInternals;
        var r = Su(),
          i = Ka(r);
        ((i.tag = 1),
          (i.payload = t),
          n != null && (i.callback = n),
          (t = qa(e, i, r)),
          t !== null && (wu(t, e, r), Ja(t, e, r)));
      },
      enqueueForceUpdate: function (e, t) {
        e = e._reactInternals;
        var n = Su(),
          r = Ka(n);
        ((r.tag = 2),
          t != null && (r.callback = t),
          (t = qa(e, r, n)),
          t !== null && (wu(t, e, n), Ja(t, e, n)));
      },
    };
    function Xs(e, t, n, r, i, a, o) {
      return (
        (e = e.stateNode),
        typeof e.shouldComponentUpdate == `function`
          ? e.shouldComponentUpdate(r, a, o)
          : t.prototype && t.prototype.isPureReactComponent
            ? !Er(n, r) || !Er(i, a)
            : !0
      );
    }
    function Zs(e, t, n, r) {
      ((e = t.state),
        typeof t.componentWillReceiveProps == `function` && t.componentWillReceiveProps(n, r),
        typeof t.UNSAFE_componentWillReceiveProps == `function` &&
          t.UNSAFE_componentWillReceiveProps(n, r),
        t.state !== e && Ys.enqueueReplaceState(t, t.state, null));
    }
    function Qs(e, t) {
      var n = t;
      if (`ref` in t) for (var r in ((n = {}), t)) r !== `ref` && (n[r] = t[r]);
      if ((e = e.defaultProps))
        for (var i in (n === t && (n = f({}, n)), e)) n[i] === void 0 && (n[i] = e[i]);
      return n;
    }
    function $s(e) {
      $r(e);
    }
    function ec(e) {
      console.error(e);
    }
    function tc(e) {
      $r(e);
    }
    function nc(e, t) {
      try {
        var n = e.onUncaughtError;
        n(t.value, { componentStack: t.stack });
      } catch (e) {
        setTimeout(function () {
          throw e;
        });
      }
    }
    function rc(e, t, n) {
      try {
        var r = e.onCaughtError;
        r(n.value, { componentStack: n.stack, errorBoundary: t.tag === 1 ? t.stateNode : null });
      } catch (e) {
        setTimeout(function () {
          throw e;
        });
      }
    }
    function F(e, t, n) {
      return (
        (n = Ka(n)),
        (n.tag = 3),
        (n.payload = { element: null }),
        (n.callback = function () {
          nc(e, t);
        }),
        n
      );
    }
    function ic(e) {
      return ((e = Ka(e)), (e.tag = 3), e);
    }
    function ac(e, t, n, r) {
      var i = n.type.getDerivedStateFromError;
      if (typeof i == `function`) {
        var a = r.value;
        ((e.payload = function () {
          return i(a);
        }),
          (e.callback = function () {
            rc(t, n, r);
          }));
      }
      var o = n.stateNode;
      o !== null &&
        typeof o.componentDidCatch == `function` &&
        (e.callback = function () {
          (rc(t, n, r),
            typeof i != `function` && (fu === null ? (fu = new Set([this])) : fu.add(this)));
          var e = r.stack;
          this.componentDidCatch(r.value, { componentStack: e === null ? `` : e });
        });
    }
    function oc(e, t, n, r, a) {
      if (((n.flags |= 32768), typeof r == `object` && r && typeof r.then == `function`)) {
        if (((t = n.alternate), t !== null && ta(t, n, a, !0), (n = oo.current), n !== null)) {
          switch (n.tag) {
            case 31:
            case 13:
              return (
                so === null ? Iu() : n.alternate === null && $l === 0 && ($l = 3),
                (n.flags &= -257),
                (n.flags |= 65536),
                (n.lanes = a),
                r === Oa
                  ? (n.flags |= 16384)
                  : ((t = n.updateQueue),
                    t === null ? (n.updateQueue = new Set([r])) : t.add(r),
                    ed(e, r, a)),
                !1
              );
            case 22:
              return (
                (n.flags |= 65536),
                r === Oa
                  ? (n.flags |= 16384)
                  : ((t = n.updateQueue),
                    t === null
                      ? ((t = {
                          transitions: null,
                          markerInstances: null,
                          retryQueue: new Set([r]),
                        }),
                        (n.updateQueue = t))
                      : ((n = t.retryQueue), n === null ? (t.retryQueue = new Set([r])) : n.add(r)),
                    ed(e, r, a)),
                !1
              );
          }
          throw Error(i(435, n.tag));
        }
        return (ed(e, r, a), Iu(), !1);
      }
      if (N)
        return (
          (t = oo.current),
          t === null
            ? (r !== Bi && ((t = Error(i(423), { cause: r })), qi(xi(t, n))),
              (e = e.current.alternate),
              (e.flags |= 65536),
              (a &= -a),
              (e.lanes |= a),
              (r = xi(r, n)),
              (a = F(e.stateNode, r, a)),
              Ya(e, a),
              $l !== 4 && ($l = 2))
            : (!(t.flags & 65536) && (t.flags |= 256),
              (t.flags |= 65536),
              (t.lanes = a),
              r !== Bi && ((e = Error(i(422), { cause: r })), qi(xi(e, n)))),
          !1
        );
      var o = Error(i(520), { cause: r });
      if (((o = xi(o, n)), au === null ? (au = [o]) : au.push(o), $l !== 4 && ($l = 2), t === null))
        return !0;
      ((r = xi(r, n)), (n = t));
      do {
        switch (n.tag) {
          case 3:
            return (
              (n.flags |= 65536),
              (e = a & -a),
              (n.lanes |= e),
              (e = F(n.stateNode, r, e)),
              Ya(n, e),
              !1
            );
          case 1:
            if (
              ((t = n.type),
              (o = n.stateNode),
              !(n.flags & 128) &&
                (typeof t.getDerivedStateFromError == `function` ||
                  (o !== null &&
                    typeof o.componentDidCatch == `function` &&
                    (fu === null || !fu.has(o)))))
            )
              return (
                (n.flags |= 65536),
                (a &= -a),
                (n.lanes |= a),
                (a = ic(a)),
                ac(a, e, n, r),
                Ya(n, a),
                !1
              );
        }
        n = n.return;
      } while (n !== null);
      return !1;
    }
    var sc = Error(i(461)),
      cc = !1;
    function lc(e, t, n, r) {
      t.child = e === null ? Ha(t, null, n, r) : Va(t, e.child, n, r);
    }
    function uc(e, t, n, r, i) {
      n = n.render;
      var a = t.ref;
      if (`ref` in r) {
        var o = {};
        for (var s in r) s !== `ref` && (o[s] = r[s]);
      } else o = r;
      return (
        ra(t),
        (r = Oo(e, t, n, o, a, i)),
        (s = Mo()),
        e !== null && !cc
          ? (No(e, t, i), Pc(e, t, i))
          : (N && s && Ni(t), (t.flags |= 1), lc(e, t, r, i), t.child)
      );
    }
    function dc(e, t, n, r, i) {
      if (e === null) {
        var a = n.type;
        return typeof a == `function` && !fi(a) && a.defaultProps === void 0 && n.compare === null
          ? ((t.tag = 15), (t.type = a), fc(e, t, a, r, i))
          : ((e = hi(n.type, null, r, t, t.mode, i)),
            (e.ref = t.ref),
            (e.return = t),
            (t.child = e));
      }
      if (((a = e.child), !Fc(e, i))) {
        var o = a.memoizedProps;
        if (((n = n.compare), (n = n === null ? Er : n), n(o, r) && e.ref === t.ref))
          return Pc(e, t, i);
      }
      return ((t.flags |= 1), (e = pi(a, r)), (e.ref = t.ref), (e.return = t), (t.child = e));
    }
    function fc(e, t, n, r, i) {
      if (e !== null) {
        var a = e.memoizedProps;
        if (Er(a, r) && e.ref === t.ref) {
          if (((cc = !1), (t.pendingProps = r = a), Fc(e, i))) e.flags & 131072 && (cc = !0);
          else return ((t.lanes = e.lanes), Pc(e, t, i));
        }
      }
      return bc(e, t, n, r, i);
    }
    function pc(e, t, n, r) {
      var i = r.children,
        a = e === null ? null : e.memoizedState;
      if (
        (e === null &&
          t.stateNode === null &&
          (t.stateNode = {
            _visibility: 1,
            _pendingMarkers: null,
            _retryCache: null,
            _transitions: null,
          }),
        r.mode === `hidden`)
      ) {
        if (t.flags & 128) {
          if (((a = a === null ? n : a.baseLanes | n), e !== null)) {
            for (r = t.child = e.child, i = 0; r !== null;)
              ((i = i | r.lanes | r.childLanes), (r = r.sibling));
            r = i & ~a;
          } else ((r = 0), (t.child = null));
          return hc(e, t, a, n, r);
        }
        if (n & 536870912)
          ((t.memoizedState = { baseLanes: 0, cachePool: null }),
            e !== null && Ca(t, a === null ? null : a.cachePool),
            a === null ? io() : ro(t, a),
            uo(t));
        else return ((r = t.lanes = 536870912), hc(e, t, a === null ? n : a.baseLanes | n, n, r));
      } else
        a === null
          ? (e !== null && Ca(t, null), io(), fo(t))
          : (Ca(t, a.cachePool), ro(t, a), fo(t), (t.memoizedState = null));
      return (lc(e, t, i, n), t.child);
    }
    function mc(e, t) {
      return (
        (e !== null && e.tag === 22) ||
          t.stateNode !== null ||
          (t.stateNode = {
            _visibility: 1,
            _pendingMarkers: null,
            _retryCache: null,
            _transitions: null,
          }),
        t.sibling
      );
    }
    function hc(e, t, n, r, i) {
      var a = Sa();
      return (
        (a = a === null ? null : { parent: ua._currentValue, pool: a }),
        (t.memoizedState = { baseLanes: n, cachePool: a }),
        e !== null && Ca(t, null),
        io(),
        uo(t),
        e !== null && ta(e, t, r, !0),
        (t.childLanes = i),
        null
      );
    }
    function gc(e, t) {
      return (
        (t = kc({ mode: t.mode, children: t.children }, e.mode)),
        (t.ref = e.ref),
        (e.child = t),
        (t.return = e),
        t
      );
    }
    function _c(e, t, n) {
      return (
        Va(t, e.child, null, n),
        (e = gc(t, t.pendingProps)),
        (e.flags |= 2),
        po(t),
        (t.memoizedState = null),
        e
      );
    }
    function vc(e, t, n) {
      var r = t.pendingProps,
        a = !!(t.flags & 128);
      if (((t.flags &= -129), e === null)) {
        if (N) {
          if (r.mode === `hidden`) return ((e = gc(t, r)), (t.lanes = 536870912), mc(null, e));
          if (
            (lo(t),
            (e = Li)
              ? ((e = mf(e, zi)),
                (e = e !== null && e.data === `&` ? e : null),
                e !== null &&
                  ((t.memoizedState = {
                    dehydrated: e,
                    treeContext: Oi === null ? null : { id: ki, overflow: Ai },
                    retryLane: 536870912,
                    hydrationErrors: null,
                  }),
                  (n = vi(e)),
                  (n.return = t),
                  (t.child = n),
                  (Ii = t),
                  (Li = null)))
              : (e = null),
            e === null)
          )
            throw Vi(t);
          return ((t.lanes = 536870912), null);
        }
        return gc(t, r);
      }
      var o = e.memoizedState;
      if (o !== null) {
        var s = o.dehydrated;
        if ((lo(t), a)) {
          if (t.flags & 256) ((t.flags &= -257), (t = _c(e, t, n)));
          else if (t.memoizedState !== null) ((t.child = e.child), (t.flags |= 128), (t = null));
          else throw Error(i(558));
        } else if ((cc || ta(e, t, n, !1), (a = (n & e.childLanes) !== 0), cc || a)) {
          if (((r = Kl), r !== null && ((s = it(r, n)), s !== 0 && s !== o.retryLane)))
            throw ((o.retryLane = s), oi(e, s), wu(r, e, s), sc);
          (Iu(), (t = _c(e, t, n)));
        } else
          ((e = o.treeContext),
            (Li = vf(s.nextSibling)),
            (Ii = t),
            (N = !0),
            (Ri = null),
            (zi = !1),
            e !== null && Fi(t, e),
            (t = gc(t, r)),
            (t.flags |= 4096));
        return t;
      }
      return (
        (e = pi(e.child, { mode: r.mode, children: r.children })),
        (e.ref = t.ref),
        (t.child = e),
        (e.return = t),
        e
      );
    }
    function yc(e, t) {
      var n = t.ref;
      if (n === null) e !== null && e.ref !== null && (t.flags |= 4194816);
      else {
        if (typeof n != `function` && typeof n != `object`) throw Error(i(284));
        (e === null || e.ref !== n) && (t.flags |= 4194816);
      }
    }
    function bc(e, t, n, r, i) {
      return (
        ra(t),
        (n = Oo(e, t, n, r, void 0, i)),
        (r = Mo()),
        e !== null && !cc
          ? (No(e, t, i), Pc(e, t, i))
          : (N && r && Ni(t), (t.flags |= 1), lc(e, t, n, i), t.child)
      );
    }
    function xc(e, t, n, r, i, a) {
      return (
        ra(t),
        (t.updateQueue = null),
        (n = Ao(t, r, n, i)),
        ko(e),
        (r = Mo()),
        e !== null && !cc
          ? (No(e, t, a), Pc(e, t, a))
          : (N && r && Ni(t), (t.flags |= 1), lc(e, t, n, a), t.child)
      );
    }
    function Sc(e, t, n, r, i) {
      if ((ra(t), t.stateNode === null)) {
        var a = li,
          o = n.contextType;
        (typeof o == `object` && o && (a = ia(o)),
          (a = new n(r, a)),
          (t.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null),
          (a.updater = Ys),
          (t.stateNode = a),
          (a._reactInternals = t),
          (a = t.stateNode),
          (a.props = r),
          (a.state = t.memoizedState),
          (a.refs = {}),
          Wa(t),
          (o = n.contextType),
          (a.context = typeof o == `object` && o ? ia(o) : li),
          (a.state = t.memoizedState),
          (o = n.getDerivedStateFromProps),
          typeof o == `function` && (Js(t, n, o, r), (a.state = t.memoizedState)),
          typeof n.getDerivedStateFromProps == `function` ||
            typeof a.getSnapshotBeforeUpdate == `function` ||
            (typeof a.UNSAFE_componentWillMount != `function` &&
              typeof a.componentWillMount != `function`) ||
            ((o = a.state),
            typeof a.componentWillMount == `function` && a.componentWillMount(),
            typeof a.UNSAFE_componentWillMount == `function` && a.UNSAFE_componentWillMount(),
            o !== a.state && Ys.enqueueReplaceState(a, a.state, null),
            Qa(t, r, a, i),
            Za(),
            (a.state = t.memoizedState)),
          typeof a.componentDidMount == `function` && (t.flags |= 4194308),
          (r = !0));
      } else if (e === null) {
        a = t.stateNode;
        var s = t.memoizedProps,
          c = Qs(n, s);
        a.props = c;
        var l = a.context,
          u = n.contextType;
        ((o = li), typeof u == `object` && u && (o = ia(u)));
        var d = n.getDerivedStateFromProps;
        ((u = typeof d == `function` || typeof a.getSnapshotBeforeUpdate == `function`),
          (s = t.pendingProps !== s),
          u ||
            (typeof a.UNSAFE_componentWillReceiveProps != `function` &&
              typeof a.componentWillReceiveProps != `function`) ||
            ((s || l !== o) && Zs(t, a, r, o)),
          (Ua = !1));
        var f = t.memoizedState;
        ((a.state = f),
          Qa(t, r, a, i),
          Za(),
          (l = t.memoizedState),
          s || f !== l || Ua
            ? (typeof d == `function` && (Js(t, n, d, r), (l = t.memoizedState)),
              (c = Ua || Xs(t, n, c, r, f, l, o))
                ? (u ||
                    (typeof a.UNSAFE_componentWillMount != `function` &&
                      typeof a.componentWillMount != `function`) ||
                    (typeof a.componentWillMount == `function` && a.componentWillMount(),
                    typeof a.UNSAFE_componentWillMount == `function` &&
                      a.UNSAFE_componentWillMount()),
                  typeof a.componentDidMount == `function` && (t.flags |= 4194308))
                : (typeof a.componentDidMount == `function` && (t.flags |= 4194308),
                  (t.memoizedProps = r),
                  (t.memoizedState = l)),
              (a.props = r),
              (a.state = l),
              (a.context = o),
              (r = c))
            : (typeof a.componentDidMount == `function` && (t.flags |= 4194308), (r = !1)));
      } else {
        ((a = t.stateNode),
          Ga(e, t),
          (o = t.memoizedProps),
          (u = Qs(n, o)),
          (a.props = u),
          (d = t.pendingProps),
          (f = a.context),
          (l = n.contextType),
          (c = li),
          typeof l == `object` && l && (c = ia(l)),
          (s = n.getDerivedStateFromProps),
          (l = typeof s == `function` || typeof a.getSnapshotBeforeUpdate == `function`) ||
            (typeof a.UNSAFE_componentWillReceiveProps != `function` &&
              typeof a.componentWillReceiveProps != `function`) ||
            ((o !== d || f !== c) && Zs(t, a, r, c)),
          (Ua = !1),
          (f = t.memoizedState),
          (a.state = f),
          Qa(t, r, a, i),
          Za());
        var p = t.memoizedState;
        o !== d || f !== p || Ua || (e !== null && e.dependencies !== null && na(e.dependencies))
          ? (typeof s == `function` && (Js(t, n, s, r), (p = t.memoizedState)),
            (u =
              Ua ||
              Xs(t, n, u, r, f, p, c) ||
              (e !== null && e.dependencies !== null && na(e.dependencies)))
              ? (l ||
                  (typeof a.UNSAFE_componentWillUpdate != `function` &&
                    typeof a.componentWillUpdate != `function`) ||
                  (typeof a.componentWillUpdate == `function` && a.componentWillUpdate(r, p, c),
                  typeof a.UNSAFE_componentWillUpdate == `function` &&
                    a.UNSAFE_componentWillUpdate(r, p, c)),
                typeof a.componentDidUpdate == `function` && (t.flags |= 4),
                typeof a.getSnapshotBeforeUpdate == `function` && (t.flags |= 1024))
              : (typeof a.componentDidUpdate != `function` ||
                  (o === e.memoizedProps && f === e.memoizedState) ||
                  (t.flags |= 4),
                typeof a.getSnapshotBeforeUpdate != `function` ||
                  (o === e.memoizedProps && f === e.memoizedState) ||
                  (t.flags |= 1024),
                (t.memoizedProps = r),
                (t.memoizedState = p)),
            (a.props = r),
            (a.state = p),
            (a.context = c),
            (r = u))
          : (typeof a.componentDidUpdate != `function` ||
              (o === e.memoizedProps && f === e.memoizedState) ||
              (t.flags |= 4),
            typeof a.getSnapshotBeforeUpdate != `function` ||
              (o === e.memoizedProps && f === e.memoizedState) ||
              (t.flags |= 1024),
            (r = !1));
      }
      return (
        (a = r),
        yc(e, t),
        (r = !!(t.flags & 128)),
        a || r
          ? ((a = t.stateNode),
            (n = r && typeof n.getDerivedStateFromError != `function` ? null : a.render()),
            (t.flags |= 1),
            e !== null && r
              ? ((t.child = Va(t, e.child, null, i)), (t.child = Va(t, null, n, i)))
              : lc(e, t, n, i),
            (t.memoizedState = a.state),
            (e = t.child))
          : (e = Pc(e, t, i)),
        e
      );
    }
    function Cc(e, t, n, r) {
      return (Gi(), (t.flags |= 256), lc(e, t, n, r), t.child);
    }
    var wc = { dehydrated: null, treeContext: null, retryLane: 0, hydrationErrors: null };
    function Tc(e) {
      return { baseLanes: e, cachePool: wa() };
    }
    function Ec(e, t, n) {
      return ((e = e === null ? 0 : e.childLanes & ~n), t && (e |= ru), e);
    }
    function Dc(e, t, n) {
      var r = t.pendingProps,
        a = !1,
        o = !!(t.flags & 128),
        s;
      if (
        ((s = o) || (s = e !== null && e.memoizedState === null ? !1 : !!(mo.current & 2)),
        s && ((a = !0), (t.flags &= -129)),
        (s = !!(t.flags & 32)),
        (t.flags &= -33),
        e === null)
      ) {
        if (N) {
          if (
            (a ? co(t) : fo(t),
            (e = Li)
              ? ((e = mf(e, zi)),
                (e = e !== null && e.data !== `&` ? e : null),
                e !== null &&
                  ((t.memoizedState = {
                    dehydrated: e,
                    treeContext: Oi === null ? null : { id: ki, overflow: Ai },
                    retryLane: 536870912,
                    hydrationErrors: null,
                  }),
                  (n = vi(e)),
                  (n.return = t),
                  (t.child = n),
                  (Ii = t),
                  (Li = null)))
              : (e = null),
            e === null)
          )
            throw Vi(t);
          return (gf(e) ? (t.lanes = 32) : (t.lanes = 536870912), null);
        }
        var c = r.children;
        return (
          (r = r.fallback),
          a
            ? (fo(t),
              (a = t.mode),
              (c = kc({ mode: `hidden`, children: c }, a)),
              (r = gi(r, a, n, null)),
              (c.return = t),
              (r.return = t),
              (c.sibling = r),
              (t.child = c),
              (r = t.child),
              (r.memoizedState = Tc(n)),
              (r.childLanes = Ec(e, s, n)),
              (t.memoizedState = wc),
              mc(null, r))
            : (co(t), Oc(t, c))
        );
      }
      var l = e.memoizedState;
      if (l !== null && ((c = l.dehydrated), c !== null)) {
        if (o)
          t.flags & 256
            ? (co(t), (t.flags &= -257), (t = Ac(e, t, n)))
            : t.memoizedState === null
              ? (fo(t),
                (c = r.fallback),
                (a = t.mode),
                (r = kc({ mode: `visible`, children: r.children }, a)),
                (c = gi(c, a, n, null)),
                (c.flags |= 2),
                (r.return = t),
                (c.return = t),
                (r.sibling = c),
                (t.child = r),
                Va(t, e.child, null, n),
                (r = t.child),
                (r.memoizedState = Tc(n)),
                (r.childLanes = Ec(e, s, n)),
                (t.memoizedState = wc),
                (t = mc(null, r)))
              : (fo(t), (t.child = e.child), (t.flags |= 128), (t = null));
        else if ((co(t), gf(c))) {
          if (((s = c.nextSibling && c.nextSibling.dataset), s)) var u = s.dgst;
          ((s = u),
            (r = Error(i(419))),
            (r.stack = ``),
            (r.digest = s),
            qi({ value: r, source: null, stack: null }),
            (t = Ac(e, t, n)));
        } else if ((cc || ta(e, t, n, !1), (s = (n & e.childLanes) !== 0), cc || s)) {
          if (((s = Kl), s !== null && ((r = it(s, n)), r !== 0 && r !== l.retryLane)))
            throw ((l.retryLane = r), oi(e, r), wu(s, e, r), sc);
          (hf(c) || Iu(), (t = Ac(e, t, n)));
        } else
          hf(c)
            ? ((t.flags |= 192), (t.child = e.child), (t = null))
            : ((e = l.treeContext),
              (Li = vf(c.nextSibling)),
              (Ii = t),
              (N = !0),
              (Ri = null),
              (zi = !1),
              e !== null && Fi(t, e),
              (t = Oc(t, r.children)),
              (t.flags |= 4096));
        return t;
      }
      return a
        ? (fo(t),
          (c = r.fallback),
          (a = t.mode),
          (l = e.child),
          (u = l.sibling),
          (r = pi(l, { mode: `hidden`, children: r.children })),
          (r.subtreeFlags = l.subtreeFlags & 65011712),
          u === null ? ((c = gi(c, a, n, null)), (c.flags |= 2)) : (c = pi(u, c)),
          (c.return = t),
          (r.return = t),
          (r.sibling = c),
          (t.child = r),
          mc(null, r),
          (r = t.child),
          (c = e.child.memoizedState),
          c === null
            ? (c = Tc(n))
            : ((a = c.cachePool),
              a === null
                ? (a = wa())
                : ((l = ua._currentValue), (a = a.parent === l ? a : { parent: l, pool: l })),
              (c = { baseLanes: c.baseLanes | n, cachePool: a })),
          (r.memoizedState = c),
          (r.childLanes = Ec(e, s, n)),
          (t.memoizedState = wc),
          mc(e.child, r))
        : (co(t),
          (n = e.child),
          (e = n.sibling),
          (n = pi(n, { mode: `visible`, children: r.children })),
          (n.return = t),
          (n.sibling = null),
          e !== null &&
            ((s = t.deletions), s === null ? ((t.deletions = [e]), (t.flags |= 16)) : s.push(e)),
          (t.child = n),
          (t.memoizedState = null),
          n);
    }
    function Oc(e, t) {
      return ((t = kc({ mode: `visible`, children: t }, e.mode)), (t.return = e), (e.child = t));
    }
    function kc(e, t) {
      return ((e = di(22, e, null, t)), (e.lanes = 0), e);
    }
    function Ac(e, t, n) {
      return (
        Va(t, e.child, null, n),
        (e = Oc(t, t.pendingProps.children)),
        (e.flags |= 2),
        (t.memoizedState = null),
        e
      );
    }
    function jc(e, t, n) {
      e.lanes |= t;
      var r = e.alternate;
      (r !== null && (r.lanes |= t), $i(e.return, t, n));
    }
    function Mc(e, t, n, r, i, a) {
      var o = e.memoizedState;
      o === null
        ? (e.memoizedState = {
            isBackwards: t,
            rendering: null,
            renderingStartTime: 0,
            last: r,
            tail: n,
            tailMode: i,
            treeForkCount: a,
          })
        : ((o.isBackwards = t),
          (o.rendering = null),
          (o.renderingStartTime = 0),
          (o.last = r),
          (o.tail = n),
          (o.tailMode = i),
          (o.treeForkCount = a));
    }
    function Nc(e, t, n) {
      var r = t.pendingProps,
        i = r.revealOrder,
        a = r.tail;
      r = r.children;
      var o = mo.current,
        s = !!(o & 2);
      if (
        (s ? ((o = (o & 1) | 2), (t.flags |= 128)) : (o &= 1),
        O(mo, o),
        lc(e, t, r, n),
        (r = N ? Ti : 0),
        !s && e !== null && e.flags & 128)
      )
        a: for (e = t.child; e !== null;) {
          if (e.tag === 13) e.memoizedState !== null && jc(e, n, t);
          else if (e.tag === 19) jc(e, n, t);
          else if (e.child !== null) {
            ((e.child.return = e), (e = e.child));
            continue;
          }
          if (e === t) break a;
          for (; e.sibling === null;) {
            if (e.return === null || e.return === t) break a;
            e = e.return;
          }
          ((e.sibling.return = e.return), (e = e.sibling));
        }
      switch (i) {
        case `forwards`:
          for (n = t.child, i = null; n !== null;)
            ((e = n.alternate), e !== null && ho(e) === null && (i = n), (n = n.sibling));
          ((n = i),
            n === null ? ((i = t.child), (t.child = null)) : ((i = n.sibling), (n.sibling = null)),
            Mc(t, !1, i, n, a, r));
          break;
        case `backwards`:
        case `unstable_legacy-backwards`:
          for (n = null, i = t.child, t.child = null; i !== null;) {
            if (((e = i.alternate), e !== null && ho(e) === null)) {
              t.child = i;
              break;
            }
            ((e = i.sibling), (i.sibling = n), (n = i), (i = e));
          }
          Mc(t, !0, n, null, a, r);
          break;
        case `together`:
          Mc(t, !1, null, null, void 0, r);
          break;
        default:
          t.memoizedState = null;
      }
      return t.child;
    }
    function Pc(e, t, n) {
      if (
        (e !== null && (t.dependencies = e.dependencies), (eu |= t.lanes), (n & t.childLanes) === 0)
      ) {
        if (e !== null) {
          if ((ta(e, t, n, !1), (n & t.childLanes) === 0)) return null;
        } else return null;
      }
      if (e !== null && t.child !== e.child) throw Error(i(153));
      if (t.child !== null) {
        for (e = t.child, n = pi(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null;)
          ((e = e.sibling), (n = n.sibling = pi(e, e.pendingProps)), (n.return = t));
        n.sibling = null;
      }
      return t.child;
    }
    function Fc(e, t) {
      return (e.lanes & t) !== 0 || ((e = e.dependencies), !!(e !== null && na(e)));
    }
    function Ic(e, t, n) {
      switch (t.tag) {
        case 3:
          (ge(t, t.stateNode.containerInfo), Zi(t, ua, e.memoizedState.cache), Gi());
          break;
        case 27:
        case 5:
          ve(t);
          break;
        case 4:
          ge(t, t.stateNode.containerInfo);
          break;
        case 10:
          Zi(t, t.type, t.memoizedProps.value);
          break;
        case 31:
          if (t.memoizedState !== null) return ((t.flags |= 128), lo(t), null);
          break;
        case 13:
          var r = t.memoizedState;
          if (r !== null)
            return r.dehydrated === null
              ? (n & t.child.childLanes) === 0
                ? (co(t), (e = Pc(e, t, n)), e === null ? null : e.sibling)
                : Dc(e, t, n)
              : (co(t), (t.flags |= 128), null);
          co(t);
          break;
        case 19:
          var i = !!(e.flags & 128);
          if (
            ((r = (n & t.childLanes) !== 0), (r ||= (ta(e, t, n, !1), (n & t.childLanes) !== 0)), i)
          ) {
            if (r) return Nc(e, t, n);
            t.flags |= 128;
          }
          if (
            ((i = t.memoizedState),
            i !== null && ((i.rendering = null), (i.tail = null), (i.lastEffect = null)),
            O(mo, mo.current),
            r)
          )
            break;
          return null;
        case 22:
          return ((t.lanes = 0), pc(e, t, n, t.pendingProps));
        case 24:
          Zi(t, ua, e.memoizedState.cache);
      }
      return Pc(e, t, n);
    }
    function Lc(e, t, n) {
      if (e !== null) {
        if (e.memoizedProps !== t.pendingProps) cc = !0;
        else {
          if (!Fc(e, n) && !(t.flags & 128)) return ((cc = !1), Ic(e, t, n));
          cc = !!(e.flags & 131072);
        }
      } else ((cc = !1), N && t.flags & 1048576 && Mi(t, Ti, t.index));
      switch (((t.lanes = 0), t.tag)) {
        case 16:
          a: {
            var r = t.pendingProps;
            if (((e = ja(t.elementType)), (t.type = e), typeof e == `function`))
              fi(e)
                ? ((r = Qs(e, r)), (t.tag = 1), (t = Sc(null, t, e, r, n)))
                : ((t.tag = 0), (t = bc(null, t, e, r, n)));
            else {
              if (e != null) {
                var a = e.$$typeof;
                if (a === x) {
                  ((t.tag = 11), (t = uc(null, t, e, r, n)));
                  break a;
                }
                if (a === C) {
                  ((t.tag = 14), (t = dc(null, t, e, r, n)));
                  break a;
                }
              }
              throw ((t = oe(e) || e), Error(i(306, t, ``)));
            }
          }
          return t;
        case 0:
          return bc(e, t, t.type, t.pendingProps, n);
        case 1:
          return ((r = t.type), (a = Qs(r, t.pendingProps)), Sc(e, t, r, a, n));
        case 3:
          a: {
            if ((ge(t, t.stateNode.containerInfo), e === null)) throw Error(i(387));
            r = t.pendingProps;
            var o = t.memoizedState;
            ((a = o.element), Ga(e, t), Qa(t, r, null, n));
            var s = t.memoizedState;
            if (
              ((r = s.cache),
              Zi(t, ua, r),
              r !== o.cache && ea(t, [ua], n, !0),
              Za(),
              (r = s.element),
              o.isDehydrated)
            ) {
              if (
                ((o = { element: r, isDehydrated: !1, cache: s.cache }),
                (t.updateQueue.baseState = o),
                (t.memoizedState = o),
                t.flags & 256)
              ) {
                t = Cc(e, t, r, n);
                break a;
              }
              if (r !== a) {
                ((a = xi(Error(i(424)), t)), qi(a), (t = Cc(e, t, r, n)));
                break a;
              }
              switch (((e = t.stateNode.containerInfo), e.nodeType)) {
                case 9:
                  e = e.body;
                  break;
                default:
                  e = e.nodeName === `HTML` ? e.ownerDocument.body : e;
              }
              for (
                Li = vf(e.firstChild),
                  Ii = t,
                  N = !0,
                  Ri = null,
                  zi = !0,
                  n = Ha(t, null, r, n),
                  t.child = n;
                n;
              )
                ((n.flags = (n.flags & -3) | 4096), (n = n.sibling));
            } else {
              if ((Gi(), r === a)) {
                t = Pc(e, t, n);
                break a;
              }
              lc(e, t, r, n);
            }
            t = t.child;
          }
          return t;
        case 26:
          return (
            yc(e, t),
            e === null
              ? (n = zf(t.type, null, t.pendingProps, null))
                ? (t.memoizedState = n)
                : N ||
                  ((n = t.type),
                  (e = t.pendingProps),
                  (r = Xd(me.current).createElement(n)),
                  (r[ut] = t),
                  (r[dt] = e),
                  Wd(r, n, e),
                  Ct(r),
                  (t.stateNode = r))
              : (t.memoizedState = zf(t.type, e.memoizedProps, t.pendingProps, e.memoizedState)),
            null
          );
        case 27:
          return (
            ve(t),
            e === null &&
              N &&
              ((r = t.stateNode = Sf(t.type, t.pendingProps, me.current)),
              (Ii = t),
              (zi = !0),
              (a = Li),
              cf(t.type) ? ((yf = a), (Li = vf(r.firstChild))) : (Li = a)),
            lc(e, t, t.pendingProps.children, n),
            yc(e, t),
            e === null && (t.flags |= 4194304),
            t.child
          );
        case 5:
          return (
            e === null &&
              N &&
              ((a = r = Li) &&
                ((r = ff(r, t.type, t.pendingProps, zi)),
                r === null
                  ? (a = !1)
                  : ((t.stateNode = r), (Ii = t), (Li = vf(r.firstChild)), (zi = !1), (a = !0))),
              a || Vi(t)),
            ve(t),
            (a = t.type),
            (o = t.pendingProps),
            (s = e === null ? null : e.memoizedProps),
            (r = o.children),
            $d(a, o) ? (r = null) : s !== null && $d(a, s) && (t.flags |= 32),
            t.memoizedState !== null && ((a = Oo(e, t, jo, null, null, n)), (up._currentValue = a)),
            yc(e, t),
            lc(e, t, r, n),
            t.child
          );
        case 6:
          return (
            e === null &&
              N &&
              ((e = n = Li) &&
                ((n = pf(n, t.pendingProps, zi)),
                n === null ? (e = !1) : ((t.stateNode = n), (Ii = t), (Li = null), (e = !0))),
              e || Vi(t)),
            null
          );
        case 13:
          return Dc(e, t, n);
        case 4:
          return (
            ge(t, t.stateNode.containerInfo),
            (r = t.pendingProps),
            e === null ? (t.child = Va(t, null, r, n)) : lc(e, t, r, n),
            t.child
          );
        case 11:
          return uc(e, t, t.type, t.pendingProps, n);
        case 7:
          return (lc(e, t, t.pendingProps, n), t.child);
        case 8:
          return (lc(e, t, t.pendingProps.children, n), t.child);
        case 12:
          return (lc(e, t, t.pendingProps.children, n), t.child);
        case 10:
          return ((r = t.pendingProps), Zi(t, t.type, r.value), lc(e, t, r.children, n), t.child);
        case 9:
          return (
            (a = t.type._context),
            (r = t.pendingProps.children),
            ra(t),
            (a = ia(a)),
            (r = r(a)),
            (t.flags |= 1),
            lc(e, t, r, n),
            t.child
          );
        case 14:
          return dc(e, t, t.type, t.pendingProps, n);
        case 15:
          return fc(e, t, t.type, t.pendingProps, n);
        case 19:
          return Nc(e, t, n);
        case 31:
          return vc(e, t, n);
        case 22:
          return pc(e, t, n, t.pendingProps);
        case 24:
          return (
            ra(t),
            (r = ia(ua)),
            e === null
              ? ((a = Sa()),
                a === null &&
                  ((a = Kl),
                  (o = da()),
                  (a.pooledCache = o),
                  o.refCount++,
                  o !== null && (a.pooledCacheLanes |= n),
                  (a = o)),
                (t.memoizedState = { parent: r, cache: a }),
                Wa(t),
                Zi(t, ua, a))
              : ((e.lanes & n) !== 0 && (Ga(e, t), Qa(t, null, null, n), Za()),
                (a = e.memoizedState),
                (o = t.memoizedState),
                a.parent === r
                  ? ((r = o.cache), Zi(t, ua, r), r !== a.cache && ea(t, [ua], n, !0))
                  : ((a = { parent: r, cache: r }),
                    (t.memoizedState = a),
                    t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = a),
                    Zi(t, ua, r))),
            lc(e, t, t.pendingProps.children, n),
            t.child
          );
        case 29:
          throw t.pendingProps;
      }
      throw Error(i(156, t.tag));
    }
    function Rc(e) {
      e.flags |= 4;
    }
    function zc(e, t, n, r, i) {
      if (((t = !!(e.mode & 32)) && (t = !1), t)) {
        if (((e.flags |= 16777216), (i & 335544128) === i)) {
          if (e.stateNode.complete) e.flags |= 8192;
          else if (Nu()) e.flags |= 8192;
          else throw ((Ma = Oa), Ea);
        }
      } else e.flags &= -16777217;
    }
    function Bc(e, t) {
      if (t.type !== `stylesheet` || t.state.loading & 4) e.flags &= -16777217;
      else if (((e.flags |= 16777216), !np(t))) {
        if (Nu()) e.flags |= 8192;
        else throw ((Ma = Oa), Ea);
      }
    }
    function Vc(e, t) {
      (t !== null && (e.flags |= 4),
        e.flags & 16384 && ((t = e.tag === 22 ? 536870912 : Qe()), (e.lanes |= t), (iu |= t)));
    }
    function Hc(e, t) {
      if (!N)
        switch (e.tailMode) {
          case `hidden`:
            t = e.tail;
            for (var n = null; t !== null;) (t.alternate !== null && (n = t), (t = t.sibling));
            n === null ? (e.tail = null) : (n.sibling = null);
            break;
          case `collapsed`:
            n = e.tail;
            for (var r = null; n !== null;) (n.alternate !== null && (r = n), (n = n.sibling));
            r === null
              ? t || e.tail === null
                ? (e.tail = null)
                : (e.tail.sibling = null)
              : (r.sibling = null);
        }
    }
    function Uc(e) {
      var t = e.alternate !== null && e.alternate.child === e.child,
        n = 0,
        r = 0;
      if (t)
        for (var i = e.child; i !== null;)
          ((n |= i.lanes | i.childLanes),
            (r |= i.subtreeFlags & 65011712),
            (r |= i.flags & 65011712),
            (i.return = e),
            (i = i.sibling));
      else
        for (i = e.child; i !== null;)
          ((n |= i.lanes | i.childLanes),
            (r |= i.subtreeFlags),
            (r |= i.flags),
            (i.return = e),
            (i = i.sibling));
      return ((e.subtreeFlags |= r), (e.childLanes = n), t);
    }
    function Wc(e, t, n) {
      var r = t.pendingProps;
      switch ((Pi(t), t.tag)) {
        case 16:
        case 15:
        case 0:
        case 11:
        case 7:
        case 8:
        case 12:
        case 9:
        case 14:
          return (Uc(t), null);
        case 1:
          return (Uc(t), null);
        case 3:
          return (
            (n = t.stateNode),
            (r = null),
            e !== null && (r = e.memoizedState.cache),
            t.memoizedState.cache !== r && (t.flags |= 2048),
            Qi(ua),
            _e(),
            n.pendingContext && ((n.context = n.pendingContext), (n.pendingContext = null)),
            (e === null || e.child === null) &&
              (Wi(t)
                ? Rc(t)
                : e === null ||
                  (e.memoizedState.isDehydrated && !(t.flags & 256)) ||
                  ((t.flags |= 1024), Ki())),
            Uc(t),
            null
          );
        case 26:
          var a = t.type,
            o = t.memoizedState;
          return (
            e === null
              ? (Rc(t), o === null ? (Uc(t), zc(t, a, null, r, n)) : (Uc(t), Bc(t, o)))
              : o
                ? o === e.memoizedState
                  ? (Uc(t), (t.flags &= -16777217))
                  : (Rc(t), Uc(t), Bc(t, o))
                : ((e = e.memoizedProps), e !== r && Rc(t), Uc(t), zc(t, a, e, r, n)),
            null
          );
        case 27:
          if ((ye(t), (n = me.current), (a = t.type), e !== null && t.stateNode != null))
            e.memoizedProps !== r && Rc(t);
          else {
            if (!r) {
              if (t.stateNode === null) throw Error(i(166));
              return (Uc(t), null);
            }
            ((e = fe.current), Wi(t) ? Hi(t, e) : ((e = Sf(a, r, n)), (t.stateNode = e), Rc(t)));
          }
          return (Uc(t), null);
        case 5:
          if ((ye(t), (a = t.type), e !== null && t.stateNode != null))
            e.memoizedProps !== r && Rc(t);
          else {
            if (!r) {
              if (t.stateNode === null) throw Error(i(166));
              return (Uc(t), null);
            }
            if (((o = fe.current), Wi(t))) Hi(t, o);
            else {
              var s = Xd(me.current);
              switch (o) {
                case 1:
                  o = s.createElementNS(`http://www.w3.org/2000/svg`, a);
                  break;
                case 2:
                  o = s.createElementNS(`http://www.w3.org/1998/Math/MathML`, a);
                  break;
                default:
                  switch (a) {
                    case `svg`:
                      o = s.createElementNS(`http://www.w3.org/2000/svg`, a);
                      break;
                    case `math`:
                      o = s.createElementNS(`http://www.w3.org/1998/Math/MathML`, a);
                      break;
                    case `script`:
                      ((o = s.createElement(`div`)),
                        (o.innerHTML = `<script><\/script>`),
                        (o = o.removeChild(o.firstChild)));
                      break;
                    case `select`:
                      ((o =
                        typeof r.is == `string`
                          ? s.createElement(`select`, { is: r.is })
                          : s.createElement(`select`)),
                        r.multiple ? (o.multiple = !0) : r.size && (o.size = r.size));
                      break;
                    default:
                      o =
                        typeof r.is == `string`
                          ? s.createElement(a, { is: r.is })
                          : s.createElement(a);
                  }
              }
              ((o[ut] = t), (o[dt] = r));
              a: for (s = t.child; s !== null;) {
                if (s.tag === 5 || s.tag === 6) o.appendChild(s.stateNode);
                else if (s.tag !== 4 && s.tag !== 27 && s.child !== null) {
                  ((s.child.return = s), (s = s.child));
                  continue;
                }
                if (s === t) break a;
                for (; s.sibling === null;) {
                  if (s.return === null || s.return === t) break a;
                  s = s.return;
                }
                ((s.sibling.return = s.return), (s = s.sibling));
              }
              t.stateNode = o;
              a: switch ((Wd(o, a, r), a)) {
                case `button`:
                case `input`:
                case `select`:
                case `textarea`:
                  r = !!r.autoFocus;
                  break a;
                case `img`:
                  r = !0;
                  break a;
                default:
                  r = !1;
              }
              r && Rc(t);
            }
          }
          return (
            Uc(t),
            zc(t, t.type, e === null ? null : e.memoizedProps, t.pendingProps, n),
            null
          );
        case 6:
          if (e && t.stateNode != null) e.memoizedProps !== r && Rc(t);
          else {
            if (typeof r != `string` && t.stateNode === null) throw Error(i(166));
            if (((e = me.current), Wi(t))) {
              if (((e = t.stateNode), (n = t.memoizedProps), (r = null), (a = Ii), a !== null))
                switch (a.tag) {
                  case 27:
                  case 5:
                    r = a.memoizedProps;
                }
              ((e[ut] = t),
                (e = !!(
                  e.nodeValue === n ||
                  (r !== null && !0 === r.suppressHydrationWarning) ||
                  Vd(e.nodeValue, n)
                )),
                e || Vi(t, !0));
            } else ((e = Xd(e).createTextNode(r)), (e[ut] = t), (t.stateNode = e));
          }
          return (Uc(t), null);
        case 31:
          if (((n = t.memoizedState), e === null || e.memoizedState !== null)) {
            if (((r = Wi(t)), n !== null)) {
              if (e === null) {
                if (!r) throw Error(i(318));
                if (((e = t.memoizedState), (e = e === null ? null : e.dehydrated), !e))
                  throw Error(i(557));
                e[ut] = t;
              } else (Gi(), !(t.flags & 128) && (t.memoizedState = null), (t.flags |= 4));
              (Uc(t), (e = !1));
            } else
              ((n = Ki()),
                e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = n),
                (e = !0));
            if (!e) return t.flags & 256 ? (po(t), t) : (po(t), null);
            if (t.flags & 128) throw Error(i(558));
          }
          return (Uc(t), null);
        case 13:
          if (
            ((r = t.memoizedState),
            e === null || (e.memoizedState !== null && e.memoizedState.dehydrated !== null))
          ) {
            if (((a = Wi(t)), r !== null && r.dehydrated !== null)) {
              if (e === null) {
                if (!a) throw Error(i(318));
                if (((a = t.memoizedState), (a = a === null ? null : a.dehydrated), !a))
                  throw Error(i(317));
                a[ut] = t;
              } else (Gi(), !(t.flags & 128) && (t.memoizedState = null), (t.flags |= 4));
              (Uc(t), (a = !1));
            } else
              ((a = Ki()),
                e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = a),
                (a = !0));
            if (!a) return t.flags & 256 ? (po(t), t) : (po(t), null);
          }
          return (
            po(t),
            t.flags & 128
              ? ((t.lanes = n), t)
              : ((n = r !== null),
                (e = e !== null && e.memoizedState !== null),
                n &&
                  ((r = t.child),
                  (a = null),
                  r.alternate !== null &&
                    r.alternate.memoizedState !== null &&
                    r.alternate.memoizedState.cachePool !== null &&
                    (a = r.alternate.memoizedState.cachePool.pool),
                  (o = null),
                  r.memoizedState !== null &&
                    r.memoizedState.cachePool !== null &&
                    (o = r.memoizedState.cachePool.pool),
                  o !== a && (r.flags |= 2048)),
                n !== e && n && (t.child.flags |= 8192),
                Vc(t, t.updateQueue),
                Uc(t),
                null)
          );
        case 4:
          return (_e(), e === null && jd(t.stateNode.containerInfo), Uc(t), null);
        case 10:
          return (Qi(t.type), Uc(t), null);
        case 19:
          if ((de(mo), (r = t.memoizedState), r === null)) return (Uc(t), null);
          if (((a = !!(t.flags & 128)), (o = r.rendering), o === null)) {
            if (a) Hc(r, !1);
            else {
              if ($l !== 0 || (e !== null && e.flags & 128))
                for (e = t.child; e !== null;) {
                  if (((o = ho(e)), o !== null)) {
                    for (
                      t.flags |= 128,
                        Hc(r, !1),
                        e = o.updateQueue,
                        t.updateQueue = e,
                        Vc(t, e),
                        t.subtreeFlags = 0,
                        e = n,
                        n = t.child;
                      n !== null;
                    )
                      (mi(n, e), (n = n.sibling));
                    return (O(mo, (mo.current & 1) | 2), N && ji(t, r.treeForkCount), t.child);
                  }
                  e = e.sibling;
                }
              r.tail !== null &&
                j() > uu &&
                ((t.flags |= 128), (a = !0), Hc(r, !1), (t.lanes = 4194304));
            }
          } else {
            if (!a) {
              if (((e = ho(o)), e !== null)) {
                if (
                  ((t.flags |= 128),
                  (a = !0),
                  (e = e.updateQueue),
                  (t.updateQueue = e),
                  Vc(t, e),
                  Hc(r, !0),
                  r.tail === null && r.tailMode === `hidden` && !o.alternate && !N)
                )
                  return (Uc(t), null);
              } else
                2 * j() - r.renderingStartTime > uu &&
                  n !== 536870912 &&
                  ((t.flags |= 128), (a = !0), Hc(r, !1), (t.lanes = 4194304));
            }
            r.isBackwards
              ? ((o.sibling = t.child), (t.child = o))
              : ((e = r.last), e === null ? (t.child = o) : (e.sibling = o), (r.last = o));
          }
          return r.tail === null
            ? (Uc(t), null)
            : ((e = r.tail),
              (r.rendering = e),
              (r.tail = e.sibling),
              (r.renderingStartTime = j()),
              (e.sibling = null),
              (n = mo.current),
              O(mo, a ? (n & 1) | 2 : n & 1),
              N && ji(t, r.treeForkCount),
              e);
        case 22:
        case 23:
          return (
            po(t),
            ao(),
            (r = t.memoizedState !== null),
            e === null
              ? r && (t.flags |= 8192)
              : (e.memoizedState !== null) !== r && (t.flags |= 8192),
            r
              ? n & 536870912 &&
                !(t.flags & 128) &&
                (Uc(t), t.subtreeFlags & 6 && (t.flags |= 8192))
              : Uc(t),
            (n = t.updateQueue),
            n !== null && Vc(t, n.retryQueue),
            (n = null),
            e !== null &&
              e.memoizedState !== null &&
              e.memoizedState.cachePool !== null &&
              (n = e.memoizedState.cachePool.pool),
            (r = null),
            t.memoizedState !== null &&
              t.memoizedState.cachePool !== null &&
              (r = t.memoizedState.cachePool.pool),
            r !== n && (t.flags |= 2048),
            e !== null && de(xa),
            null
          );
        case 24:
          return (
            (n = null),
            e !== null && (n = e.memoizedState.cache),
            t.memoizedState.cache !== n && (t.flags |= 2048),
            Qi(ua),
            Uc(t),
            null
          );
        case 25:
          return null;
        case 30:
          return null;
      }
      throw Error(i(156, t.tag));
    }
    function Gc(e, t) {
      switch ((Pi(t), t.tag)) {
        case 1:
          return ((e = t.flags), e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null);
        case 3:
          return (
            Qi(ua),
            _e(),
            (e = t.flags),
            e & 65536 && !(e & 128) ? ((t.flags = (e & -65537) | 128), t) : null
          );
        case 26:
        case 27:
        case 5:
          return (ye(t), null);
        case 31:
          if (t.memoizedState !== null) {
            if ((po(t), t.alternate === null)) throw Error(i(340));
            Gi();
          }
          return ((e = t.flags), e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null);
        case 13:
          if ((po(t), (e = t.memoizedState), e !== null && e.dehydrated !== null)) {
            if (t.alternate === null) throw Error(i(340));
            Gi();
          }
          return ((e = t.flags), e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null);
        case 19:
          return (de(mo), null);
        case 4:
          return (_e(), null);
        case 10:
          return (Qi(t.type), null);
        case 22:
        case 23:
          return (
            po(t),
            ao(),
            e !== null && de(xa),
            (e = t.flags),
            e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null
          );
        case 24:
          return (Qi(ua), null);
        case 25:
          return null;
        default:
          return null;
      }
    }
    function Kc(e, t) {
      switch ((Pi(t), t.tag)) {
        case 3:
          (Qi(ua), _e());
          break;
        case 26:
        case 27:
        case 5:
          ye(t);
          break;
        case 4:
          _e();
          break;
        case 31:
          t.memoizedState !== null && po(t);
          break;
        case 13:
          po(t);
          break;
        case 19:
          de(mo);
          break;
        case 10:
          Qi(t.type);
          break;
        case 22:
        case 23:
          (po(t), ao(), e !== null && de(xa));
          break;
        case 24:
          Qi(ua);
      }
    }
    function qc(e, t) {
      try {
        var n = t.updateQueue,
          r = n === null ? null : n.lastEffect;
        if (r !== null) {
          var i = r.next;
          n = i;
          do {
            if ((n.tag & e) === e) {
              r = void 0;
              var a = n.create,
                o = n.inst;
              ((r = a()), (o.destroy = r));
            }
            n = n.next;
          } while (n !== i);
        }
      } catch (e) {
        z(t, t.return, e);
      }
    }
    function Jc(e, t, n) {
      try {
        var r = t.updateQueue,
          i = r === null ? null : r.lastEffect;
        if (i !== null) {
          var a = i.next;
          r = a;
          do {
            if ((r.tag & e) === e) {
              var o = r.inst,
                s = o.destroy;
              if (s !== void 0) {
                ((o.destroy = void 0), (i = t));
                var c = n,
                  l = s;
                try {
                  l();
                } catch (e) {
                  z(i, c, e);
                }
              }
            }
            r = r.next;
          } while (r !== a);
        }
      } catch (e) {
        z(t, t.return, e);
      }
    }
    function Yc(e) {
      var t = e.updateQueue;
      if (t !== null) {
        var n = e.stateNode;
        try {
          eo(t, n);
        } catch (t) {
          z(e, e.return, t);
        }
      }
    }
    function Xc(e, t, n) {
      ((n.props = Qs(e.type, e.memoizedProps)), (n.state = e.memoizedState));
      try {
        n.componentWillUnmount();
      } catch (n) {
        z(e, t, n);
      }
    }
    function Zc(e, t) {
      try {
        var n = e.ref;
        if (n !== null) {
          switch (e.tag) {
            case 26:
            case 27:
            case 5:
              var r = e.stateNode;
              break;
            case 30:
              r = e.stateNode;
              break;
            default:
              r = e.stateNode;
          }
          typeof n == `function` ? (e.refCleanup = n(r)) : (n.current = r);
        }
      } catch (n) {
        z(e, t, n);
      }
    }
    function Qc(e, t) {
      var n = e.ref,
        r = e.refCleanup;
      if (n !== null) {
        if (typeof r == `function`)
          try {
            r();
          } catch (n) {
            z(e, t, n);
          } finally {
            ((e.refCleanup = null), (e = e.alternate), e != null && (e.refCleanup = null));
          }
        else if (typeof n == `function`)
          try {
            n(null);
          } catch (n) {
            z(e, t, n);
          }
        else n.current = null;
      }
    }
    function $c(e) {
      var t = e.type,
        n = e.memoizedProps,
        r = e.stateNode;
      try {
        a: switch (t) {
          case `button`:
          case `input`:
          case `select`:
          case `textarea`:
            n.autoFocus && r.focus();
            break a;
          case `img`:
            n.src ? (r.src = n.src) : n.srcSet && (r.srcset = n.srcSet);
        }
      } catch (t) {
        z(e, e.return, t);
      }
    }
    function el(e, t, n) {
      try {
        var r = e.stateNode;
        (Gd(r, e.type, n, t), (r[dt] = t));
      } catch (t) {
        z(e, e.return, t);
      }
    }
    function tl(e) {
      return (
        e.tag === 5 || e.tag === 3 || e.tag === 26 || (e.tag === 27 && cf(e.type)) || e.tag === 4
      );
    }
    function nl(e) {
      a: for (;;) {
        for (; e.sibling === null;) {
          if (e.return === null || tl(e.return)) return null;
          e = e.return;
        }
        for (
          e.sibling.return = e.return, e = e.sibling;
          e.tag !== 5 && e.tag !== 6 && e.tag !== 18;
        ) {
          if ((e.tag === 27 && cf(e.type)) || e.flags & 2 || e.child === null || e.tag === 4)
            continue a;
          ((e.child.return = e), (e = e.child));
        }
        if (!(e.flags & 2)) return e.stateNode;
      }
    }
    function rl(e, t, n) {
      var r = e.tag;
      if (r === 5 || r === 6)
        ((e = e.stateNode),
          t
            ? (n.nodeType === 9
                ? n.body
                : n.nodeName === `HTML`
                  ? n.ownerDocument.body
                  : n
              ).insertBefore(e, t)
            : ((t = n.nodeType === 9 ? n.body : n.nodeName === `HTML` ? n.ownerDocument.body : n),
              t.appendChild(e),
              (n = n._reactRootContainer),
              n != null || t.onclick !== null || (t.onclick = nn)));
      else if (
        r !== 4 &&
        (r === 27 && cf(e.type) && ((n = e.stateNode), (t = null)), (e = e.child), e !== null)
      )
        for (rl(e, t, n), e = e.sibling; e !== null;) (rl(e, t, n), (e = e.sibling));
    }
    function il(e, t, n) {
      var r = e.tag;
      if (r === 5 || r === 6) ((e = e.stateNode), t ? n.insertBefore(e, t) : n.appendChild(e));
      else if (r !== 4 && (r === 27 && cf(e.type) && (n = e.stateNode), (e = e.child), e !== null))
        for (il(e, t, n), e = e.sibling; e !== null;) (il(e, t, n), (e = e.sibling));
    }
    function al(e) {
      var t = e.stateNode,
        n = e.memoizedProps;
      try {
        for (var r = e.type, i = t.attributes; i.length;) t.removeAttributeNode(i[0]);
        (Wd(t, r, n), (t[ut] = e), (t[dt] = n));
      } catch (t) {
        z(e, e.return, t);
      }
    }
    var ol = !1,
      sl = !1,
      cl = !1,
      ll = typeof WeakSet == `function` ? WeakSet : Set,
      ul = null;
    function dl(e, t) {
      if (((e = e.containerInfo), (Jd = vp), (e = Ar(e)), jr(e))) {
        if (`selectionStart` in e) var n = { start: e.selectionStart, end: e.selectionEnd };
        else
          a: {
            n = ((n = e.ownerDocument) && n.defaultView) || window;
            var r = n.getSelection && n.getSelection();
            if (r && r.rangeCount !== 0) {
              n = r.anchorNode;
              var a = r.anchorOffset,
                o = r.focusNode;
              r = r.focusOffset;
              try {
                (n.nodeType, o.nodeType);
              } catch {
                n = null;
                break a;
              }
              var s = 0,
                c = -1,
                l = -1,
                u = 0,
                d = 0,
                f = e,
                p = null;
              b: for (;;) {
                for (
                  var m;
                  f !== n || (a !== 0 && f.nodeType !== 3) || (c = s + a),
                    f !== o || (r !== 0 && f.nodeType !== 3) || (l = s + r),
                    f.nodeType === 3 && (s += f.nodeValue.length),
                    (m = f.firstChild) !== null;
                )
                  ((p = f), (f = m));
                for (;;) {
                  if (f === e) break b;
                  if (
                    (p === n && ++u === a && (c = s),
                    p === o && ++d === r && (l = s),
                    (m = f.nextSibling) !== null)
                  )
                    break;
                  ((f = p), (p = f.parentNode));
                }
                f = m;
              }
              n = c === -1 || l === -1 ? null : { start: c, end: l };
            } else n = null;
          }
        n ||= { start: 0, end: 0 };
      } else n = null;
      for (Yd = { focusedElem: e, selectionRange: n }, vp = !1, ul = t; ul !== null;)
        if (((t = ul), (e = t.child), t.subtreeFlags & 1028 && e !== null))
          ((e.return = t), (ul = e));
        else
          for (; ul !== null;) {
            switch (((t = ul), (o = t.alternate), (e = t.flags), t.tag)) {
              case 0:
                if (e & 4 && ((e = t.updateQueue), (e = e === null ? null : e.events), e !== null))
                  for (n = 0; n < e.length; n++) ((a = e[n]), (a.ref.impl = a.nextImpl));
                break;
              case 11:
              case 15:
                break;
              case 1:
                if (e & 1024 && o !== null) {
                  ((e = void 0),
                    (n = t),
                    (a = o.memoizedProps),
                    (o = o.memoizedState),
                    (r = n.stateNode));
                  try {
                    var h = Qs(n.type, a);
                    ((e = r.getSnapshotBeforeUpdate(h, o)),
                      (r.__reactInternalSnapshotBeforeUpdate = e));
                  } catch (e) {
                    z(n, n.return, e);
                  }
                }
                break;
              case 3:
                if (e & 1024) {
                  if (((e = t.stateNode.containerInfo), (n = e.nodeType), n === 9)) df(e);
                  else if (n === 1)
                    switch (e.nodeName) {
                      case `HEAD`:
                      case `HTML`:
                      case `BODY`:
                        df(e);
                        break;
                      default:
                        e.textContent = ``;
                    }
                }
                break;
              case 5:
              case 26:
              case 27:
              case 6:
              case 4:
              case 17:
                break;
              default:
                if (e & 1024) throw Error(i(163));
            }
            if (((e = t.sibling), e !== null)) {
              ((e.return = t.return), (ul = e));
              break;
            }
            ul = t.return;
          }
    }
    function fl(e, t, n) {
      var r = n.flags;
      switch (n.tag) {
        case 0:
        case 11:
        case 15:
          (Dl(e, n), r & 4 && qc(5, n));
          break;
        case 1:
          if ((Dl(e, n), r & 4)) {
            if (((e = n.stateNode), t === null))
              try {
                e.componentDidMount();
              } catch (e) {
                z(n, n.return, e);
              }
            else {
              var i = Qs(n.type, t.memoizedProps);
              t = t.memoizedState;
              try {
                e.componentDidUpdate(i, t, e.__reactInternalSnapshotBeforeUpdate);
              } catch (e) {
                z(n, n.return, e);
              }
            }
          }
          (r & 64 && Yc(n), r & 512 && Zc(n, n.return));
          break;
        case 3:
          if ((Dl(e, n), r & 64 && ((e = n.updateQueue), e !== null))) {
            if (((t = null), n.child !== null))
              switch (n.child.tag) {
                case 27:
                case 5:
                  t = n.child.stateNode;
                  break;
                case 1:
                  t = n.child.stateNode;
              }
            try {
              eo(e, t);
            } catch (e) {
              z(n, n.return, e);
            }
          }
          break;
        case 27:
          t === null && r & 4 && al(n);
        case 26:
        case 5:
          (Dl(e, n), t === null && r & 4 && $c(n), r & 512 && Zc(n, n.return));
          break;
        case 12:
          Dl(e, n);
          break;
        case 31:
          (Dl(e, n), r & 4 && vl(e, n));
          break;
        case 13:
          (Dl(e, n),
            r & 4 && yl(e, n),
            r & 64 &&
              ((e = n.memoizedState),
              e !== null &&
                ((e = e.dehydrated), e !== null && ((n = rd.bind(null, n)), _f(e, n)))));
          break;
        case 22:
          if (((r = n.memoizedState !== null || ol), !r)) {
            ((t = (t !== null && t.memoizedState !== null) || sl), (i = ol));
            var a = sl;
            ((ol = r),
              (sl = t) && !a ? kl(e, n, !!(n.subtreeFlags & 8772)) : Dl(e, n),
              (ol = i),
              (sl = a));
          }
          break;
        case 30:
          break;
        default:
          Dl(e, n);
      }
    }
    function pl(e) {
      var t = e.alternate;
      (t !== null && ((e.alternate = null), pl(t)),
        (e.child = null),
        (e.deletions = null),
        (e.sibling = null),
        e.tag === 5 && ((t = e.stateNode), t !== null && vt(t)),
        (e.stateNode = null),
        (e.return = null),
        (e.dependencies = null),
        (e.memoizedProps = null),
        (e.memoizedState = null),
        (e.pendingProps = null),
        (e.stateNode = null),
        (e.updateQueue = null));
    }
    var ml = null,
      hl = !1;
    function gl(e, t, n) {
      for (n = n.child; n !== null;) (_l(e, t, n), (n = n.sibling));
    }
    function _l(e, t, n) {
      if (ze && typeof ze.onCommitFiberUnmount == `function`)
        try {
          ze.onCommitFiberUnmount(Re, n);
        } catch {}
      switch (n.tag) {
        case 26:
          (sl || Qc(n, t),
            gl(e, t, n),
            n.memoizedState
              ? n.memoizedState.count--
              : n.stateNode && ((n = n.stateNode), n.parentNode.removeChild(n)));
          break;
        case 27:
          sl || Qc(n, t);
          var r = ml,
            i = hl;
          (cf(n.type) && ((ml = n.stateNode), (hl = !1)),
            gl(e, t, n),
            Cf(n.stateNode),
            (ml = r),
            (hl = i));
          break;
        case 5:
          sl || Qc(n, t);
        case 6:
          if (((r = ml), (i = hl), (ml = null), gl(e, t, n), (ml = r), (hl = i), ml !== null)) {
            if (hl)
              try {
                (ml.nodeType === 9
                  ? ml.body
                  : ml.nodeName === `HTML`
                    ? ml.ownerDocument.body
                    : ml
                ).removeChild(n.stateNode);
              } catch (e) {
                z(n, t, e);
              }
            else
              try {
                ml.removeChild(n.stateNode);
              } catch (e) {
                z(n, t, e);
              }
          }
          break;
        case 18:
          ml !== null &&
            (hl
              ? ((e = ml),
                lf(
                  e.nodeType === 9 ? e.body : e.nodeName === `HTML` ? e.ownerDocument.body : e,
                  n.stateNode,
                ),
                Wp(e))
              : lf(ml, n.stateNode));
          break;
        case 4:
          ((r = ml),
            (i = hl),
            (ml = n.stateNode.containerInfo),
            (hl = !0),
            gl(e, t, n),
            (ml = r),
            (hl = i));
          break;
        case 0:
        case 11:
        case 14:
        case 15:
          (Jc(2, n, t), sl || Jc(4, n, t), gl(e, t, n));
          break;
        case 1:
          (sl ||
            (Qc(n, t),
            (r = n.stateNode),
            typeof r.componentWillUnmount == `function` && Xc(n, t, r)),
            gl(e, t, n));
          break;
        case 21:
          gl(e, t, n);
          break;
        case 22:
          ((sl = (r = sl) || n.memoizedState !== null), gl(e, t, n), (sl = r));
          break;
        default:
          gl(e, t, n);
      }
    }
    function vl(e, t) {
      if (
        t.memoizedState === null &&
        ((e = t.alternate), e !== null && ((e = e.memoizedState), e !== null))
      ) {
        e = e.dehydrated;
        try {
          Wp(e);
        } catch (e) {
          z(t, t.return, e);
        }
      }
    }
    function yl(e, t) {
      if (
        t.memoizedState === null &&
        ((e = t.alternate),
        e !== null && ((e = e.memoizedState), e !== null && ((e = e.dehydrated), e !== null)))
      )
        try {
          Wp(e);
        } catch (e) {
          z(t, t.return, e);
        }
    }
    function bl(e) {
      switch (e.tag) {
        case 31:
        case 13:
        case 19:
          var t = e.stateNode;
          return (t === null && (t = e.stateNode = new ll()), t);
        case 22:
          return (
            (e = e.stateNode),
            (t = e._retryCache),
            t === null && (t = e._retryCache = new ll()),
            t
          );
        default:
          throw Error(i(435, e.tag));
      }
    }
    function xl(e, t) {
      var n = bl(e);
      t.forEach(function (t) {
        if (!n.has(t)) {
          n.add(t);
          var r = id.bind(null, e, t);
          t.then(r, r);
        }
      });
    }
    function Sl(e, t) {
      var n = t.deletions;
      if (n !== null)
        for (var r = 0; r < n.length; r++) {
          var a = n[r],
            o = e,
            s = t,
            c = s;
          a: for (; c !== null;) {
            switch (c.tag) {
              case 27:
                if (cf(c.type)) {
                  ((ml = c.stateNode), (hl = !1));
                  break a;
                }
                break;
              case 5:
                ((ml = c.stateNode), (hl = !1));
                break a;
              case 3:
              case 4:
                ((ml = c.stateNode.containerInfo), (hl = !0));
                break a;
            }
            c = c.return;
          }
          if (ml === null) throw Error(i(160));
          (_l(o, s, a),
            (ml = null),
            (hl = !1),
            (o = a.alternate),
            o !== null && (o.return = null),
            (a.return = null));
        }
      if (t.subtreeFlags & 13886) for (t = t.child; t !== null;) (wl(t, e), (t = t.sibling));
    }
    var Cl = null;
    function wl(e, t) {
      var n = e.alternate,
        r = e.flags;
      switch (e.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
          (Sl(t, e), Tl(e), r & 4 && (Jc(3, e, e.return), qc(3, e), Jc(5, e, e.return)));
          break;
        case 1:
          (Sl(t, e),
            Tl(e),
            r & 512 && (sl || n === null || Qc(n, n.return)),
            r & 64 &&
              ol &&
              ((e = e.updateQueue),
              e !== null &&
                ((r = e.callbacks),
                r !== null &&
                  ((n = e.shared.hiddenCallbacks),
                  (e.shared.hiddenCallbacks = n === null ? r : n.concat(r))))));
          break;
        case 26:
          var a = Cl;
          if ((Sl(t, e), Tl(e), r & 512 && (sl || n === null || Qc(n, n.return)), r & 4)) {
            var o = n === null ? null : n.memoizedState;
            if (((r = e.memoizedState), n === null)) {
              if (r === null) {
                if (e.stateNode === null) {
                  a: {
                    ((r = e.type), (n = e.memoizedProps), (a = a.ownerDocument || a));
                    b: switch (r) {
                      case `title`:
                        ((o = a.getElementsByTagName(`title`)[0]),
                          (!o ||
                            o[_t] ||
                            o[ut] ||
                            o.namespaceURI === `http://www.w3.org/2000/svg` ||
                            o.hasAttribute(`itemprop`)) &&
                            ((o = a.createElement(r)),
                            a.head.insertBefore(o, a.querySelector(`head > title`))),
                          Wd(o, r, n),
                          (o[ut] = e),
                          Ct(o),
                          (r = o));
                        break a;
                      case `link`:
                        var s = $f(`link`, `href`, a).get(r + (n.href || ``));
                        if (s) {
                          for (var c = 0; c < s.length; c++)
                            if (
                              ((o = s[c]),
                              o.getAttribute(`href`) ===
                                (n.href == null || n.href === `` ? null : n.href) &&
                                o.getAttribute(`rel`) === (n.rel == null ? null : n.rel) &&
                                o.getAttribute(`title`) === (n.title == null ? null : n.title) &&
                                o.getAttribute(`crossorigin`) ===
                                  (n.crossOrigin == null ? null : n.crossOrigin))
                            ) {
                              s.splice(c, 1);
                              break b;
                            }
                        }
                        ((o = a.createElement(r)), Wd(o, r, n), a.head.appendChild(o));
                        break;
                      case `meta`:
                        if ((s = $f(`meta`, `content`, a).get(r + (n.content || ``)))) {
                          for (c = 0; c < s.length; c++)
                            if (
                              ((o = s[c]),
                              o.getAttribute(`content`) ===
                                (n.content == null ? null : `` + n.content) &&
                                o.getAttribute(`name`) === (n.name == null ? null : n.name) &&
                                o.getAttribute(`property`) ===
                                  (n.property == null ? null : n.property) &&
                                o.getAttribute(`http-equiv`) ===
                                  (n.httpEquiv == null ? null : n.httpEquiv) &&
                                o.getAttribute(`charset`) ===
                                  (n.charSet == null ? null : n.charSet))
                            ) {
                              s.splice(c, 1);
                              break b;
                            }
                        }
                        ((o = a.createElement(r)), Wd(o, r, n), a.head.appendChild(o));
                        break;
                      default:
                        throw Error(i(468, r));
                    }
                    ((o[ut] = e), Ct(o), (r = o));
                  }
                  e.stateNode = r;
                } else ep(a, e.type, e.stateNode);
              } else e.stateNode = Yf(a, r, e.memoizedProps);
            } else
              o === r
                ? r === null && e.stateNode !== null && el(e, e.memoizedProps, n.memoizedProps)
                : (o === null
                    ? n.stateNode !== null && ((n = n.stateNode), n.parentNode.removeChild(n))
                    : o.count--,
                  r === null ? ep(a, e.type, e.stateNode) : Yf(a, r, e.memoizedProps));
          }
          break;
        case 27:
          (Sl(t, e),
            Tl(e),
            r & 512 && (sl || n === null || Qc(n, n.return)),
            n !== null && r & 4 && el(e, e.memoizedProps, n.memoizedProps));
          break;
        case 5:
          if ((Sl(t, e), Tl(e), r & 512 && (sl || n === null || Qc(n, n.return)), e.flags & 32)) {
            a = e.stateNode;
            try {
              Jt(a, ``);
            } catch (t) {
              z(e, e.return, t);
            }
          }
          (r & 4 &&
            e.stateNode != null &&
            ((a = e.memoizedProps), el(e, a, n === null ? a : n.memoizedProps)),
            r & 1024 && (cl = !0));
          break;
        case 6:
          if ((Sl(t, e), Tl(e), r & 4)) {
            if (e.stateNode === null) throw Error(i(162));
            ((r = e.memoizedProps), (n = e.stateNode));
            try {
              n.nodeValue = r;
            } catch (t) {
              z(e, e.return, t);
            }
          }
          break;
        case 3:
          if (
            ((Qf = null),
            (a = Cl),
            (Cl = Ef(t.containerInfo)),
            Sl(t, e),
            (Cl = a),
            Tl(e),
            r & 4 && n !== null && n.memoizedState.isDehydrated)
          )
            try {
              Wp(t.containerInfo);
            } catch (t) {
              z(e, e.return, t);
            }
          cl && ((cl = !1), El(e));
          break;
        case 4:
          ((r = Cl), (Cl = Ef(e.stateNode.containerInfo)), Sl(t, e), Tl(e), (Cl = r));
          break;
        case 12:
          (Sl(t, e), Tl(e));
          break;
        case 31:
          (Sl(t, e),
            Tl(e),
            r & 4 && ((r = e.updateQueue), r !== null && ((e.updateQueue = null), xl(e, r))));
          break;
        case 13:
          (Sl(t, e),
            Tl(e),
            e.child.flags & 8192 &&
              (e.memoizedState !== null) != (n !== null && n.memoizedState !== null) &&
              (cu = j()),
            r & 4 && ((r = e.updateQueue), r !== null && ((e.updateQueue = null), xl(e, r))));
          break;
        case 22:
          a = e.memoizedState !== null;
          var l = n !== null && n.memoizedState !== null,
            u = ol,
            d = sl;
          if (((ol = u || a), (sl = d || l), Sl(t, e), (sl = d), (ol = u), Tl(e), r & 8192))
            a: for (
              t = e.stateNode,
                t._visibility = a ? t._visibility & -2 : t._visibility | 1,
                a && (n === null || l || ol || sl || Ol(e)),
                n = null,
                t = e;
              ;
            ) {
              if (t.tag === 5 || t.tag === 26) {
                if (n === null) {
                  l = n = t;
                  try {
                    if (((o = l.stateNode), a))
                      ((s = o.style),
                        typeof s.setProperty == `function`
                          ? s.setProperty(`display`, `none`, `important`)
                          : (s.display = `none`));
                    else {
                      c = l.stateNode;
                      var f = l.memoizedProps.style,
                        p = f != null && f.hasOwnProperty(`display`) ? f.display : null;
                      c.style.display = p == null || typeof p == `boolean` ? `` : (`` + p).trim();
                    }
                  } catch (e) {
                    z(l, l.return, e);
                  }
                }
              } else if (t.tag === 6) {
                if (n === null) {
                  l = t;
                  try {
                    l.stateNode.nodeValue = a ? `` : l.memoizedProps;
                  } catch (e) {
                    z(l, l.return, e);
                  }
                }
              } else if (t.tag === 18) {
                if (n === null) {
                  l = t;
                  try {
                    var m = l.stateNode;
                    a ? uf(m, !0) : uf(l.stateNode, !1);
                  } catch (e) {
                    z(l, l.return, e);
                  }
                }
              } else if (
                ((t.tag !== 22 && t.tag !== 23) || t.memoizedState === null || t === e) &&
                t.child !== null
              ) {
                ((t.child.return = t), (t = t.child));
                continue;
              }
              if (t === e) break a;
              for (; t.sibling === null;) {
                if (t.return === null || t.return === e) break a;
                (n === t && (n = null), (t = t.return));
              }
              (n === t && (n = null), (t.sibling.return = t.return), (t = t.sibling));
            }
          r & 4 &&
            ((r = e.updateQueue),
            r !== null && ((n = r.retryQueue), n !== null && ((r.retryQueue = null), xl(e, n))));
          break;
        case 19:
          (Sl(t, e),
            Tl(e),
            r & 4 && ((r = e.updateQueue), r !== null && ((e.updateQueue = null), xl(e, r))));
          break;
        case 30:
          break;
        case 21:
          break;
        default:
          (Sl(t, e), Tl(e));
      }
    }
    function Tl(e) {
      var t = e.flags;
      if (t & 2) {
        try {
          for (var n, r = e.return; r !== null;) {
            if (tl(r)) {
              n = r;
              break;
            }
            r = r.return;
          }
          if (n == null) throw Error(i(160));
          switch (n.tag) {
            case 27:
              var a = n.stateNode;
              il(e, nl(e), a);
              break;
            case 5:
              var o = n.stateNode;
              (n.flags & 32 && (Jt(o, ``), (n.flags &= -33)), il(e, nl(e), o));
              break;
            case 3:
            case 4:
              var s = n.stateNode.containerInfo;
              rl(e, nl(e), s);
              break;
            default:
              throw Error(i(161));
          }
        } catch (t) {
          z(e, e.return, t);
        }
        e.flags &= -3;
      }
      t & 4096 && (e.flags &= -4097);
    }
    function El(e) {
      if (e.subtreeFlags & 1024)
        for (e = e.child; e !== null;) {
          var t = e;
          (El(t), t.tag === 5 && t.flags & 1024 && t.stateNode.reset(), (e = e.sibling));
        }
    }
    function Dl(e, t) {
      if (t.subtreeFlags & 8772)
        for (t = t.child; t !== null;) (fl(e, t.alternate, t), (t = t.sibling));
    }
    function Ol(e) {
      for (e = e.child; e !== null;) {
        var t = e;
        switch (t.tag) {
          case 0:
          case 11:
          case 14:
          case 15:
            (Jc(4, t, t.return), Ol(t));
            break;
          case 1:
            Qc(t, t.return);
            var n = t.stateNode;
            (typeof n.componentWillUnmount == `function` && Xc(t, t.return, n), Ol(t));
            break;
          case 27:
            Cf(t.stateNode);
          case 26:
          case 5:
            (Qc(t, t.return), Ol(t));
            break;
          case 22:
            t.memoizedState === null && Ol(t);
            break;
          case 30:
            Ol(t);
            break;
          default:
            Ol(t);
        }
        e = e.sibling;
      }
    }
    function kl(e, t, n) {
      for (n &&= !!(t.subtreeFlags & 8772), t = t.child; t !== null;) {
        var r = t.alternate,
          i = e,
          a = t,
          o = a.flags;
        switch (a.tag) {
          case 0:
          case 11:
          case 15:
            (kl(i, a, n), qc(4, a));
            break;
          case 1:
            if ((kl(i, a, n), (r = a), (i = r.stateNode), typeof i.componentDidMount == `function`))
              try {
                i.componentDidMount();
              } catch (e) {
                z(r, r.return, e);
              }
            if (((r = a), (i = r.updateQueue), i !== null)) {
              var s = r.stateNode;
              try {
                var c = i.shared.hiddenCallbacks;
                if (c !== null)
                  for (i.shared.hiddenCallbacks = null, i = 0; i < c.length; i++) $a(c[i], s);
              } catch (e) {
                z(r, r.return, e);
              }
            }
            (n && o & 64 && Yc(a), Zc(a, a.return));
            break;
          case 27:
            al(a);
          case 26:
          case 5:
            (kl(i, a, n), n && r === null && o & 4 && $c(a), Zc(a, a.return));
            break;
          case 12:
            kl(i, a, n);
            break;
          case 31:
            (kl(i, a, n), n && o & 4 && vl(i, a));
            break;
          case 13:
            (kl(i, a, n), n && o & 4 && yl(i, a));
            break;
          case 22:
            (a.memoizedState === null && kl(i, a, n), Zc(a, a.return));
            break;
          case 30:
            break;
          default:
            kl(i, a, n);
        }
        t = t.sibling;
      }
    }
    function Al(e, t) {
      var n = null;
      (e !== null &&
        e.memoizedState !== null &&
        e.memoizedState.cachePool !== null &&
        (n = e.memoizedState.cachePool.pool),
        (e = null),
        t.memoizedState !== null &&
          t.memoizedState.cachePool !== null &&
          (e = t.memoizedState.cachePool.pool),
        e !== n && (e != null && e.refCount++, n != null && fa(n)));
    }
    function jl(e, t) {
      ((e = null),
        t.alternate !== null && (e = t.alternate.memoizedState.cache),
        (t = t.memoizedState.cache),
        t !== e && (t.refCount++, e != null && fa(e)));
    }
    function Ml(e, t, n, r) {
      if (t.subtreeFlags & 10256) for (t = t.child; t !== null;) (Nl(e, t, n, r), (t = t.sibling));
    }
    function Nl(e, t, n, r) {
      var i = t.flags;
      switch (t.tag) {
        case 0:
        case 11:
        case 15:
          (Ml(e, t, n, r), i & 2048 && qc(9, t));
          break;
        case 1:
          Ml(e, t, n, r);
          break;
        case 3:
          (Ml(e, t, n, r),
            i & 2048 &&
              ((e = null),
              t.alternate !== null && (e = t.alternate.memoizedState.cache),
              (t = t.memoizedState.cache),
              t !== e && (t.refCount++, e != null && fa(e))));
          break;
        case 12:
          if (i & 2048) {
            (Ml(e, t, n, r), (e = t.stateNode));
            try {
              var a = t.memoizedProps,
                o = a.id,
                s = a.onPostCommit;
              typeof s == `function` &&
                s(o, t.alternate === null ? `mount` : `update`, e.passiveEffectDuration, -0);
            } catch (e) {
              z(t, t.return, e);
            }
          } else Ml(e, t, n, r);
          break;
        case 31:
          Ml(e, t, n, r);
          break;
        case 13:
          Ml(e, t, n, r);
          break;
        case 23:
          break;
        case 22:
          ((a = t.stateNode),
            (o = t.alternate),
            t.memoizedState === null
              ? a._visibility & 2
                ? Ml(e, t, n, r)
                : ((a._visibility |= 2), Pl(e, t, n, r, !!(t.subtreeFlags & 10256) || !1))
              : a._visibility & 2
                ? Ml(e, t, n, r)
                : Fl(e, t),
            i & 2048 && Al(o, t));
          break;
        case 24:
          (Ml(e, t, n, r), i & 2048 && jl(t.alternate, t));
          break;
        default:
          Ml(e, t, n, r);
      }
    }
    function Pl(e, t, n, r, i) {
      for (i &&= !!(t.subtreeFlags & 10256) || !1, t = t.child; t !== null;) {
        var a = e,
          o = t,
          s = n,
          c = r,
          l = o.flags;
        switch (o.tag) {
          case 0:
          case 11:
          case 15:
            (Pl(a, o, s, c, i), qc(8, o));
            break;
          case 23:
            break;
          case 22:
            var u = o.stateNode;
            (o.memoizedState === null
              ? ((u._visibility |= 2), Pl(a, o, s, c, i))
              : u._visibility & 2
                ? Pl(a, o, s, c, i)
                : Fl(a, o),
              i && l & 2048 && Al(o.alternate, o));
            break;
          case 24:
            (Pl(a, o, s, c, i), i && l & 2048 && jl(o.alternate, o));
            break;
          default:
            Pl(a, o, s, c, i);
        }
        t = t.sibling;
      }
    }
    function Fl(e, t) {
      if (t.subtreeFlags & 10256)
        for (t = t.child; t !== null;) {
          var n = e,
            r = t,
            i = r.flags;
          switch (r.tag) {
            case 22:
              (Fl(n, r), i & 2048 && Al(r.alternate, r));
              break;
            case 24:
              (Fl(n, r), i & 2048 && jl(r.alternate, r));
              break;
            default:
              Fl(n, r);
          }
          t = t.sibling;
        }
    }
    var Il = 8192;
    function Ll(e, t, n) {
      if (e.subtreeFlags & Il) for (e = e.child; e !== null;) (Rl(e, t, n), (e = e.sibling));
    }
    function Rl(e, t, n) {
      switch (e.tag) {
        case 26:
          (Ll(e, t, n),
            e.flags & Il &&
              e.memoizedState !== null &&
              rp(n, Cl, e.memoizedState, e.memoizedProps));
          break;
        case 5:
          Ll(e, t, n);
          break;
        case 3:
        case 4:
          var r = Cl;
          ((Cl = Ef(e.stateNode.containerInfo)), Ll(e, t, n), (Cl = r));
          break;
        case 22:
          e.memoizedState === null &&
            ((r = e.alternate),
            r !== null && r.memoizedState !== null
              ? ((r = Il), (Il = 16777216), Ll(e, t, n), (Il = r))
              : Ll(e, t, n));
          break;
        default:
          Ll(e, t, n);
      }
    }
    function zl(e) {
      var t = e.alternate;
      if (t !== null && ((e = t.child), e !== null)) {
        t.child = null;
        do ((t = e.sibling), (e.sibling = null), (e = t));
        while (e !== null);
      }
    }
    function Bl(e) {
      var t = e.deletions;
      if (e.flags & 16) {
        if (t !== null)
          for (var n = 0; n < t.length; n++) {
            var r = t[n];
            ((ul = r), Ul(r, e));
          }
        zl(e);
      }
      if (e.subtreeFlags & 10256) for (e = e.child; e !== null;) (Vl(e), (e = e.sibling));
    }
    function Vl(e) {
      switch (e.tag) {
        case 0:
        case 11:
        case 15:
          (Bl(e), e.flags & 2048 && Jc(9, e, e.return));
          break;
        case 3:
          Bl(e);
          break;
        case 12:
          Bl(e);
          break;
        case 22:
          var t = e.stateNode;
          e.memoizedState !== null &&
          t._visibility & 2 &&
          (e.return === null || e.return.tag !== 13)
            ? ((t._visibility &= -3), Hl(e))
            : Bl(e);
          break;
        default:
          Bl(e);
      }
    }
    function Hl(e) {
      var t = e.deletions;
      if (e.flags & 16) {
        if (t !== null)
          for (var n = 0; n < t.length; n++) {
            var r = t[n];
            ((ul = r), Ul(r, e));
          }
        zl(e);
      }
      for (e = e.child; e !== null;) {
        switch (((t = e), t.tag)) {
          case 0:
          case 11:
          case 15:
            (Jc(8, t, t.return), Hl(t));
            break;
          case 22:
            ((n = t.stateNode), n._visibility & 2 && ((n._visibility &= -3), Hl(t)));
            break;
          default:
            Hl(t);
        }
        e = e.sibling;
      }
    }
    function Ul(e, t) {
      for (; ul !== null;) {
        var n = ul;
        switch (n.tag) {
          case 0:
          case 11:
          case 15:
            Jc(8, n, t);
            break;
          case 23:
          case 22:
            if (n.memoizedState !== null && n.memoizedState.cachePool !== null) {
              var r = n.memoizedState.cachePool.pool;
              r != null && r.refCount++;
            }
            break;
          case 24:
            fa(n.memoizedState.cache);
        }
        if (((r = n.child), r !== null)) ((r.return = n), (ul = r));
        else
          a: for (n = e; ul !== null;) {
            r = ul;
            var i = r.sibling,
              a = r.return;
            if ((pl(r), r === n)) {
              ul = null;
              break a;
            }
            if (i !== null) {
              ((i.return = a), (ul = i));
              break a;
            }
            ul = a;
          }
      }
    }
    var Wl = {
        getCacheForType: function (e) {
          var t = ia(ua),
            n = t.data.get(e);
          return (n === void 0 && ((n = e()), t.data.set(e, n)), n);
        },
        cacheSignal: function () {
          return ia(ua).controller.signal;
        },
      },
      Gl = typeof WeakMap == `function` ? WeakMap : Map,
      I = 0,
      Kl = null,
      L = null,
      R = 0,
      ql = 0,
      Jl = null,
      Yl = !1,
      Xl = !1,
      Zl = !1,
      Ql = 0,
      $l = 0,
      eu = 0,
      tu = 0,
      nu = 0,
      ru = 0,
      iu = 0,
      au = null,
      ou = null,
      su = !1,
      cu = 0,
      lu = 0,
      uu = 1 / 0,
      du = null,
      fu = null,
      pu = 0,
      mu = null,
      hu = null,
      gu = 0,
      _u = 0,
      vu = null,
      yu = null,
      bu = 0,
      xu = null;
    function Su() {
      return I & 2 && R !== 0 ? R & -R : T.T === null ? st() : bd();
    }
    function Cu() {
      if (ru === 0) {
        if (!(R & 536870912) || N) {
          var e = Ke;
          ((Ke <<= 1), !(Ke & 3932160) && (Ke = 262144), (ru = e));
        } else ru = 536870912;
      }
      return ((e = oo.current), e !== null && (e.flags |= 32), ru);
    }
    function wu(e, t, n) {
      (((e === Kl && (ql === 2 || ql === 9)) || e.cancelPendingCommit !== null) &&
        (ju(e, 0), Ou(e, R, ru, !1)),
        et(e, n),
        (!(I & 2) || e !== Kl) &&
          (e === Kl && (!(I & 2) && (tu |= n), $l === 4 && Ou(e, R, ru, !1)), fd(e)));
    }
    function Tu(e, t, n) {
      if (I & 6) throw Error(i(327));
      var r = (!n && !(t & 127) && (t & e.expiredLanes) === 0) || Xe(e, t),
        a = r ? zu(e, t) : Lu(e, t, !0),
        o = r;
      do {
        if (a === 0) {
          Xl && !r && Ou(e, t, 0, !1);
          break;
        }
        if (((n = e.current.alternate), o && !Du(n))) {
          ((a = Lu(e, t, !1)), (o = !1));
          continue;
        }
        if (a === 2) {
          if (((o = t), e.errorRecoveryDisabledLanes & o)) var s = 0;
          else
            ((s = e.pendingLanes & -536870913),
              (s = s === 0 ? (s & 536870912 ? 536870912 : 0) : s));
          if (s !== 0) {
            t = s;
            a: {
              var c = e;
              a = au;
              var l = c.current.memoizedState.isDehydrated;
              if ((l && (ju(c, s).flags |= 256), (s = Lu(c, s, !1)), s !== 2)) {
                if (Zl && !l) {
                  ((c.errorRecoveryDisabledLanes |= o), (tu |= o), (a = 4));
                  break a;
                }
                ((o = ou), (ou = a), o !== null && (ou === null ? (ou = o) : ou.push.apply(ou, o)));
              }
              a = s;
            }
            if (((o = !1), a !== 2)) continue;
          }
        }
        if (a === 1) {
          (ju(e, 0), Ou(e, t, 0, !0));
          break;
        }
        a: {
          switch (((r = e), (o = a), o)) {
            case 0:
            case 1:
              throw Error(i(345));
            case 4:
              if ((t & 4194048) !== t) break;
            case 6:
              Ou(r, t, ru, !Yl);
              break a;
            case 2:
              ou = null;
              break;
            case 3:
            case 5:
              break;
            default:
              throw Error(i(329));
          }
          if ((t & 62914560) === t && ((a = cu + 300 - j()), 10 < a)) {
            if ((Ou(r, t, ru, !Yl), Ye(r, 0, !0) !== 0)) break a;
            ((gu = t),
              (r.timeoutHandle = nf(
                Eu.bind(null, r, n, ou, du, su, t, ru, tu, iu, Yl, o, `Throttled`, -0, 0),
                a,
              )));
            break a;
          }
          Eu(r, n, ou, du, su, t, ru, tu, iu, Yl, o, null, -0, 0);
        }
        break;
      } while (1);
      fd(e);
    }
    function Eu(e, t, n, r, i, a, o, s, c, l, u, d, f, p) {
      if (((e.timeoutHandle = -1), (d = t.subtreeFlags), d & 8192 || (d & 16785408) == 16785408)) {
        ((d = {
          stylesheets: null,
          count: 0,
          imgCount: 0,
          imgBytes: 0,
          suspenseyImages: [],
          waitingForImages: !0,
          waitingForViewTransition: !1,
          unsuspend: nn,
        }),
          Rl(t, a, d));
        var m = (a & 62914560) === a ? cu - j() : (a & 4194048) === a ? lu - j() : 0;
        if (((m = ap(d, m)), m !== null)) {
          ((gu = a),
            (e.cancelPendingCommit = m(Ku.bind(null, e, t, a, n, r, i, o, s, c, u, d, null, f, p))),
            Ou(e, a, o, !l));
          return;
        }
      }
      Ku(e, t, a, n, r, i, o, s, c);
    }
    function Du(e) {
      for (var t = e; ;) {
        var n = t.tag;
        if (
          (n === 0 || n === 11 || n === 15) &&
          t.flags & 16384 &&
          ((n = t.updateQueue), n !== null && ((n = n.stores), n !== null))
        )
          for (var r = 0; r < n.length; r++) {
            var i = n[r],
              a = i.getSnapshot;
            i = i.value;
            try {
              if (!Tr(a(), i)) return !1;
            } catch {
              return !1;
            }
          }
        if (((n = t.child), t.subtreeFlags & 16384 && n !== null)) ((n.return = t), (t = n));
        else {
          if (t === e) break;
          for (; t.sibling === null;) {
            if (t.return === null || t.return === e) return !0;
            t = t.return;
          }
          ((t.sibling.return = t.return), (t = t.sibling));
        }
      }
      return !0;
    }
    function Ou(e, t, n, r) {
      ((t &= ~nu),
        (t &= ~tu),
        (e.suspendedLanes |= t),
        (e.pingedLanes &= ~t),
        r && (e.warmLanes |= t),
        (r = e.expirationTimes));
      for (var i = t; 0 < i;) {
        var a = 31 - Ve(i),
          o = 1 << a;
        ((r[a] = -1), (i &= ~o));
      }
      n !== 0 && nt(e, n, t);
    }
    function ku() {
      return I & 6 ? !0 : (pd(0, !1), !1);
    }
    function Au() {
      if (L !== null) {
        if (ql === 0) var e = L.return;
        else ((e = L), (Xi = Yi = null), Po(e), (Fa = null), (Ia = 0), (e = L));
        for (; e !== null;) (Kc(e.alternate, e), (e = e.return));
        L = null;
      }
    }
    function ju(e, t) {
      var n = e.timeoutHandle;
      (n !== -1 && ((e.timeoutHandle = -1), rf(n)),
        (n = e.cancelPendingCommit),
        n !== null && ((e.cancelPendingCommit = null), n()),
        (gu = 0),
        Au(),
        (Kl = e),
        (L = n = pi(e.current, null)),
        (R = t),
        (ql = 0),
        (Jl = null),
        (Yl = !1),
        (Xl = Xe(e, t)),
        (Zl = !1),
        (iu = ru = nu = tu = eu = $l = 0),
        (ou = au = null),
        (su = !1),
        t & 8 && (t |= t & 32));
      var r = e.entangledLanes;
      if (r !== 0)
        for (e = e.entanglements, r &= t; 0 < r;) {
          var i = 31 - Ve(r),
            a = 1 << i;
          ((t |= e[i]), (r &= ~a));
        }
      return ((Ql = t), ri(), n);
    }
    function Mu(e, t) {
      ((P = null),
        (T.H = Ws),
        t === Ta || t === Da
          ? ((t = Na()), (ql = 3))
          : t === Ea
            ? ((t = Na()), (ql = 4))
            : (ql =
                t === sc ? 8 : typeof t == `object` && t && typeof t.then == `function` ? 6 : 1),
        (Jl = t),
        L === null && (($l = 1), nc(e, xi(t, e.current))));
    }
    function Nu() {
      var e = oo.current;
      return e === null
        ? !0
        : (R & 4194048) === R
          ? so === null
          : (R & 62914560) === R || R & 536870912
            ? e === so
            : !1;
    }
    function Pu() {
      var e = T.H;
      return ((T.H = Ws), e === null ? Ws : e);
    }
    function Fu() {
      var e = T.A;
      return ((T.A = Wl), e);
    }
    function Iu() {
      (($l = 4),
        Yl || ((R & 4194048) !== R && oo.current !== null) || (Xl = !0),
        (!(eu & 134217727) && !(tu & 134217727)) || Kl === null || Ou(Kl, R, ru, !1));
    }
    function Lu(e, t, n) {
      var r = I;
      I |= 2;
      var i = Pu(),
        a = Fu();
      ((Kl !== e || R !== t) && ((du = null), ju(e, t)), (t = !1));
      var o = $l;
      a: do
        try {
          if (ql !== 0 && L !== null) {
            var s = L,
              c = Jl;
            switch (ql) {
              case 8:
                (Au(), (o = 6));
                break a;
              case 3:
              case 2:
              case 9:
              case 6:
                oo.current === null && (t = !0);
                var l = ql;
                if (((ql = 0), (Jl = null), Uu(e, s, c, l), n && Xl)) {
                  o = 0;
                  break a;
                }
                break;
              default:
                ((l = ql), (ql = 0), (Jl = null), Uu(e, s, c, l));
            }
          }
          (Ru(), (o = $l));
          break;
        } catch (t) {
          Mu(e, t);
        }
      while (1);
      return (
        t && e.shellSuspendCounter++,
        (Xi = Yi = null),
        (I = r),
        (T.H = i),
        (T.A = a),
        L === null && ((Kl = null), (R = 0), ri()),
        o
      );
    }
    function Ru() {
      for (; L !== null;) Vu(L);
    }
    function zu(e, t) {
      var n = I;
      I |= 2;
      var r = Pu(),
        a = Fu();
      Kl !== e || R !== t ? ((du = null), (uu = j() + 500), ju(e, t)) : (Xl = Xe(e, t));
      a: do
        try {
          if (ql !== 0 && L !== null) {
            t = L;
            var o = Jl;
            b: switch (ql) {
              case 1:
                ((ql = 0), (Jl = null), Uu(e, t, o, 1));
                break;
              case 2:
              case 9:
                if (ka(o)) {
                  ((ql = 0), (Jl = null), Hu(t));
                  break;
                }
                ((t = function () {
                  ((ql !== 2 && ql !== 9) || Kl !== e || (ql = 7), fd(e));
                }),
                  o.then(t, t));
                break a;
              case 3:
                ql = 7;
                break a;
              case 4:
                ql = 5;
                break a;
              case 7:
                ka(o) ? ((ql = 0), (Jl = null), Hu(t)) : ((ql = 0), (Jl = null), Uu(e, t, o, 7));
                break;
              case 5:
                var s = null;
                switch (L.tag) {
                  case 26:
                    s = L.memoizedState;
                  case 5:
                  case 27:
                    var c = L;
                    if (s ? np(s) : c.stateNode.complete) {
                      ((ql = 0), (Jl = null));
                      var l = c.sibling;
                      if (l !== null) L = l;
                      else {
                        var u = c.return;
                        u === null ? (L = null) : ((L = u), Wu(u));
                      }
                      break b;
                    }
                }
                ((ql = 0), (Jl = null), Uu(e, t, o, 5));
                break;
              case 6:
                ((ql = 0), (Jl = null), Uu(e, t, o, 6));
                break;
              case 8:
                (Au(), ($l = 6));
                break a;
              default:
                throw Error(i(462));
            }
          }
          Bu();
          break;
        } catch (t) {
          Mu(e, t);
        }
      while (1);
      return (
        (Xi = Yi = null),
        (T.H = r),
        (T.A = a),
        (I = n),
        L === null ? ((Kl = null), (R = 0), ri(), $l) : 0
      );
    }
    function Bu() {
      for (; L !== null && !A();) Vu(L);
    }
    function Vu(e) {
      var t = Lc(e.alternate, e, Ql);
      ((e.memoizedProps = e.pendingProps), t === null ? Wu(e) : (L = t));
    }
    function Hu(e) {
      var t = e,
        n = t.alternate;
      switch (t.tag) {
        case 15:
        case 0:
          t = xc(n, t, t.pendingProps, t.type, void 0, R);
          break;
        case 11:
          t = xc(n, t, t.pendingProps, t.type.render, t.ref, R);
          break;
        case 5:
          Po(t);
        default:
          (Kc(n, t), (t = L = mi(t, Ql)), (t = Lc(n, t, Ql)));
      }
      ((e.memoizedProps = e.pendingProps), t === null ? Wu(e) : (L = t));
    }
    function Uu(e, t, n, r) {
      ((Xi = Yi = null), Po(t), (Fa = null), (Ia = 0));
      var i = t.return;
      try {
        if (oc(e, i, t, n, R)) {
          (($l = 1), nc(e, xi(n, e.current)), (L = null));
          return;
        }
      } catch (t) {
        if (i !== null) throw ((L = i), t);
        (($l = 1), nc(e, xi(n, e.current)), (L = null));
        return;
      }
      t.flags & 32768
        ? (N || r === 1
            ? (e = !0)
            : Xl || R & 536870912
              ? (e = !1)
              : ((Yl = e = !0),
                (r === 2 || r === 9 || r === 3 || r === 6) &&
                  ((r = oo.current), r !== null && r.tag === 13 && (r.flags |= 16384))),
          Gu(t, e))
        : Wu(t);
    }
    function Wu(e) {
      var t = e;
      do {
        if (t.flags & 32768) {
          Gu(t, Yl);
          return;
        }
        e = t.return;
        var n = Wc(t.alternate, t, Ql);
        if (n !== null) {
          L = n;
          return;
        }
        if (((t = t.sibling), t !== null)) {
          L = t;
          return;
        }
        L = t = e;
      } while (t !== null);
      $l === 0 && ($l = 5);
    }
    function Gu(e, t) {
      do {
        var n = Gc(e.alternate, e);
        if (n !== null) {
          ((n.flags &= 32767), (L = n));
          return;
        }
        if (
          ((n = e.return),
          n !== null && ((n.flags |= 32768), (n.subtreeFlags = 0), (n.deletions = null)),
          !t && ((e = e.sibling), e !== null))
        ) {
          L = e;
          return;
        }
        L = e = n;
      } while (e !== null);
      (($l = 6), (L = null));
    }
    function Ku(e, t, n, r, a, o, s, c, l) {
      e.cancelPendingCommit = null;
      do Zu();
      while (pu !== 0);
      if (I & 6) throw Error(i(327));
      if (t !== null) {
        if (t === e.current) throw Error(i(177));
        if (
          ((o = t.lanes | t.childLanes),
          (o |= ni),
          tt(e, n, o, s, c, l),
          e === Kl && ((L = Kl = null), (R = 0)),
          (hu = t),
          (mu = e),
          (gu = n),
          (_u = o),
          (vu = a),
          (yu = r),
          t.subtreeFlags & 10256 || t.flags & 10256
            ? ((e.callbackNode = null),
              (e.callbackPriority = 0),
              ad(Ne, function () {
                return (Qu(), null);
              }))
            : ((e.callbackNode = null), (e.callbackPriority = 0)),
          (r = !!(t.flags & 13878)),
          t.subtreeFlags & 13878 || r)
        ) {
          ((r = T.T), (T.T = null), (a = E.p), (E.p = 2), (s = I), (I |= 4));
          try {
            dl(e, t, n);
          } finally {
            ((I = s), (E.p = a), (T.T = r));
          }
        }
        ((pu = 1), qu(), Ju(), Yu());
      }
    }
    function qu() {
      if (pu === 1) {
        pu = 0;
        var e = mu,
          t = hu,
          n = !!(t.flags & 13878);
        if (t.subtreeFlags & 13878 || n) {
          ((n = T.T), (T.T = null));
          var r = E.p;
          E.p = 2;
          var i = I;
          I |= 4;
          try {
            wl(t, e);
            var a = Yd,
              o = Ar(e.containerInfo),
              s = a.focusedElem,
              c = a.selectionRange;
            if (o !== s && s && s.ownerDocument && kr(s.ownerDocument.documentElement, s)) {
              if (c !== null && jr(s)) {
                var l = c.start,
                  u = c.end;
                if ((u === void 0 && (u = l), `selectionStart` in s))
                  ((s.selectionStart = l), (s.selectionEnd = Math.min(u, s.value.length)));
                else {
                  var d = s.ownerDocument || document,
                    f = (d && d.defaultView) || window;
                  if (f.getSelection) {
                    var p = f.getSelection(),
                      m = s.textContent.length,
                      h = Math.min(c.start, m),
                      g = c.end === void 0 ? h : Math.min(c.end, m);
                    !p.extend && h > g && ((o = g), (g = h), (h = o));
                    var _ = Or(s, h),
                      v = Or(s, g);
                    if (
                      _ &&
                      v &&
                      (p.rangeCount !== 1 ||
                        p.anchorNode !== _.node ||
                        p.anchorOffset !== _.offset ||
                        p.focusNode !== v.node ||
                        p.focusOffset !== v.offset)
                    ) {
                      var y = d.createRange();
                      (y.setStart(_.node, _.offset),
                        p.removeAllRanges(),
                        h > g
                          ? (p.addRange(y), p.extend(v.node, v.offset))
                          : (y.setEnd(v.node, v.offset), p.addRange(y)));
                    }
                  }
                }
              }
              for (d = [], p = s; (p = p.parentNode);)
                p.nodeType === 1 && d.push({ element: p, left: p.scrollLeft, top: p.scrollTop });
              for (typeof s.focus == `function` && s.focus(), s = 0; s < d.length; s++) {
                var b = d[s];
                ((b.element.scrollLeft = b.left), (b.element.scrollTop = b.top));
              }
            }
            ((vp = !!Jd), (Yd = Jd = null));
          } finally {
            ((I = i), (E.p = r), (T.T = n));
          }
        }
        ((e.current = t), (pu = 2));
      }
    }
    function Ju() {
      if (pu === 2) {
        pu = 0;
        var e = mu,
          t = hu,
          n = !!(t.flags & 8772);
        if (t.subtreeFlags & 8772 || n) {
          ((n = T.T), (T.T = null));
          var r = E.p;
          E.p = 2;
          var i = I;
          I |= 4;
          try {
            fl(e, t.alternate, t);
          } finally {
            ((I = i), (E.p = r), (T.T = n));
          }
        }
        pu = 3;
      }
    }
    function Yu() {
      if (pu === 4 || pu === 3) {
        ((pu = 0), ke());
        var e = mu,
          t = hu,
          n = gu,
          r = yu;
        t.subtreeFlags & 10256 || t.flags & 10256
          ? (pu = 5)
          : ((pu = 0), (hu = mu = null), Xu(e, e.pendingLanes));
        var i = e.pendingLanes;
        if (
          (i === 0 && (fu = null),
          ot(n),
          (t = t.stateNode),
          ze && typeof ze.onCommitFiberRoot == `function`)
        )
          try {
            ze.onCommitFiberRoot(Re, t, void 0, (t.current.flags & 128) == 128);
          } catch {}
        if (r !== null) {
          ((t = T.T), (i = E.p), (E.p = 2), (T.T = null));
          try {
            for (var a = e.onRecoverableError, o = 0; o < r.length; o++) {
              var s = r[o];
              a(s.value, { componentStack: s.stack });
            }
          } finally {
            ((T.T = t), (E.p = i));
          }
        }
        (gu & 3 && Zu(),
          fd(e),
          (i = e.pendingLanes),
          n & 261930 && i & 42 ? (e === xu ? bu++ : ((bu = 0), (xu = e))) : (bu = 0),
          pd(0, !1));
      }
    }
    function Xu(e, t) {
      (e.pooledCacheLanes &= t) === 0 &&
        ((t = e.pooledCache), t != null && ((e.pooledCache = null), fa(t)));
    }
    function Zu() {
      return (qu(), Ju(), Yu(), Qu());
    }
    function Qu() {
      if (pu !== 5) return !1;
      var e = mu,
        t = _u;
      _u = 0;
      var n = ot(gu),
        r = T.T,
        a = E.p;
      try {
        ((E.p = 32 > n ? 32 : n), (T.T = null), (n = vu), (vu = null));
        var o = mu,
          s = gu;
        if (((pu = 0), (hu = mu = null), (gu = 0), I & 6)) throw Error(i(331));
        var c = I;
        if (
          ((I |= 4),
          Vl(o.current),
          Nl(o, o.current, s, n),
          (I = c),
          pd(0, !1),
          ze && typeof ze.onPostCommitFiberRoot == `function`)
        )
          try {
            ze.onPostCommitFiberRoot(Re, o);
          } catch {}
        return !0;
      } finally {
        ((E.p = a), (T.T = r), Xu(e, t));
      }
    }
    function $u(e, t, n) {
      ((t = xi(n, t)),
        (t = F(e.stateNode, t, 2)),
        (e = qa(e, t, 2)),
        e !== null && (et(e, 2), fd(e)));
    }
    function z(e, t, n) {
      if (e.tag === 3) $u(e, e, n);
      else
        for (; t !== null;) {
          if (t.tag === 3) {
            $u(t, e, n);
            break;
          }
          if (t.tag === 1) {
            var r = t.stateNode;
            if (
              typeof t.type.getDerivedStateFromError == `function` ||
              (typeof r.componentDidCatch == `function` && (fu === null || !fu.has(r)))
            ) {
              ((e = xi(n, e)),
                (n = ic(2)),
                (r = qa(t, n, 2)),
                r !== null && (ac(n, r, t, e), et(r, 2), fd(r)));
              break;
            }
          }
          t = t.return;
        }
    }
    function ed(e, t, n) {
      var r = e.pingCache;
      if (r === null) {
        r = e.pingCache = new Gl();
        var i = new Set();
        r.set(t, i);
      } else ((i = r.get(t)), i === void 0 && ((i = new Set()), r.set(t, i)));
      i.has(n) || ((Zl = !0), i.add(n), (e = td.bind(null, e, t, n)), t.then(e, e));
    }
    function td(e, t, n) {
      var r = e.pingCache;
      (r !== null && r.delete(t),
        (e.pingedLanes |= e.suspendedLanes & n),
        (e.warmLanes &= ~n),
        Kl === e &&
          (R & n) === n &&
          ($l === 4 || ($l === 3 && (R & 62914560) === R && 300 > j() - cu)
            ? !(I & 2) && ju(e, 0)
            : (nu |= n),
          iu === R && (iu = 0)),
        fd(e));
    }
    function nd(e, t) {
      (t === 0 && (t = Qe()), (e = oi(e, t)), e !== null && (et(e, t), fd(e)));
    }
    function rd(e) {
      var t = e.memoizedState,
        n = 0;
      (t !== null && (n = t.retryLane), nd(e, n));
    }
    function id(e, t) {
      var n = 0;
      switch (e.tag) {
        case 31:
        case 13:
          var r = e.stateNode,
            a = e.memoizedState;
          a !== null && (n = a.retryLane);
          break;
        case 19:
          r = e.stateNode;
          break;
        case 22:
          r = e.stateNode._retryCache;
          break;
        default:
          throw Error(i(314));
      }
      (r !== null && r.delete(t), nd(e, n));
    }
    function ad(e, t) {
      return De(e, t);
    }
    var od = null,
      sd = null,
      cd = !1,
      ld = !1,
      ud = !1,
      dd = 0;
    function fd(e) {
      (e !== sd && e.next === null && (sd === null ? (od = sd = e) : (sd = sd.next = e)),
        (ld = !0),
        cd || ((cd = !0), yd()));
    }
    function pd(e, t) {
      if (!ud && ld) {
        ud = !0;
        do
          for (var n = !1, r = od; r !== null;) {
            if (!t) {
              if (e !== 0) {
                var i = r.pendingLanes;
                if (i === 0) var a = 0;
                else {
                  var o = r.suspendedLanes,
                    s = r.pingedLanes;
                  ((a = (1 << (31 - Ve(42 | e) + 1)) - 1),
                    (a &= i & ~(o & ~s)),
                    (a = a & 201326741 ? (a & 201326741) | 1 : a ? a | 2 : 0));
                }
                a !== 0 && ((n = !0), vd(r, a));
              } else
                ((a = R),
                  (a = Ye(
                    r,
                    r === Kl ? a : 0,
                    r.cancelPendingCommit !== null || r.timeoutHandle !== -1,
                  )),
                  !(a & 3) || Xe(r, a) || ((n = !0), vd(r, a)));
            }
            r = r.next;
          }
        while (n);
        ud = !1;
      }
    }
    function md() {
      hd();
    }
    function hd() {
      ld = cd = !1;
      var e = 0;
      dd !== 0 && tf() && (e = dd);
      for (var t = j(), n = null, r = od; r !== null;) {
        var i = r.next,
          a = gd(r, t);
        (a === 0
          ? ((r.next = null), n === null ? (od = i) : (n.next = i), i === null && (sd = n))
          : ((n = r), (e !== 0 || a & 3) && (ld = !0)),
          (r = i));
      }
      ((pu !== 0 && pu !== 5) || pd(e, !1), dd !== 0 && (dd = 0));
    }
    function gd(e, t) {
      for (
        var n = e.suspendedLanes,
          r = e.pingedLanes,
          i = e.expirationTimes,
          a = e.pendingLanes & -62914561;
        0 < a;
      ) {
        var o = 31 - Ve(a),
          s = 1 << o,
          c = i[o];
        (c === -1
          ? ((s & n) === 0 || (s & r) !== 0) && (i[o] = Ze(s, t))
          : c <= t && (e.expiredLanes |= s),
          (a &= ~s));
      }
      if (
        ((t = Kl),
        (n = R),
        (n = Ye(e, e === t ? n : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1)),
        (r = e.callbackNode),
        n === 0 || (e === t && (ql === 2 || ql === 9)) || e.cancelPendingCommit !== null)
      )
        return (
          r !== null && r !== null && Oe(r),
          (e.callbackNode = null),
          (e.callbackPriority = 0)
        );
      if (!(n & 3) || Xe(e, n)) {
        if (((t = n & -n), t === e.callbackPriority)) return t;
        switch ((r !== null && Oe(r), ot(n))) {
          case 2:
          case 8:
            n = Me;
            break;
          case 32:
            n = Ne;
            break;
          case 268435456:
            n = Fe;
            break;
          default:
            n = Ne;
        }
        return (
          (r = _d.bind(null, e)),
          (n = De(n, r)),
          (e.callbackPriority = t),
          (e.callbackNode = n),
          t
        );
      }
      return (
        r !== null && r !== null && Oe(r),
        (e.callbackPriority = 2),
        (e.callbackNode = null),
        2
      );
    }
    function _d(e, t) {
      if (pu !== 0 && pu !== 5) return ((e.callbackNode = null), (e.callbackPriority = 0), null);
      var n = e.callbackNode;
      if (Zu() && e.callbackNode !== n) return null;
      var r = R;
      return (
        (r = Ye(e, e === Kl ? r : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1)),
        r === 0
          ? null
          : (Tu(e, r, t),
            gd(e, j()),
            e.callbackNode != null && e.callbackNode === n ? _d.bind(null, e) : null)
      );
    }
    function vd(e, t) {
      if (Zu()) return null;
      Tu(e, t, !0);
    }
    function yd() {
      of(function () {
        I & 6 ? De(je, md) : hd();
      });
    }
    function bd() {
      if (dd === 0) {
        var e = ha;
        (e === 0 && ((e = Ge), (Ge <<= 1), !(Ge & 261888) && (Ge = 256)), (dd = e));
      }
      return dd;
    }
    function xd(e) {
      return e == null || typeof e == `symbol` || typeof e == `boolean`
        ? null
        : typeof e == `function`
          ? e
          : tn(`` + e);
    }
    function Sd(e, t) {
      var n = t.ownerDocument.createElement(`input`);
      return (
        (n.name = t.name),
        (n.value = t.value),
        e.id && n.setAttribute(`form`, e.id),
        t.parentNode.insertBefore(n, t),
        (e = new FormData(e)),
        n.parentNode.removeChild(n),
        e
      );
    }
    function Cd(e, t, n, r, i) {
      if (t === `submit` && n && n.stateNode === i) {
        var a = xd((i[dt] || null).action),
          o = r.submitter;
        o &&
          ((t = (t = o[dt] || null) ? xd(t.formAction) : o.getAttribute(`formAction`)),
          t !== null && ((a = t), (o = null)));
        var s = new wn(`action`, `action`, null, r, i);
        e.push({
          event: s,
          listeners: [
            {
              instance: null,
              listener: function () {
                if (r.defaultPrevented) {
                  if (dd !== 0) {
                    var e = o ? Sd(i, o) : new FormData(i);
                    As(n, { pending: !0, data: e, method: i.method, action: a }, null, e);
                  }
                } else
                  typeof a == `function` &&
                    (s.preventDefault(),
                    (e = o ? Sd(i, o) : new FormData(i)),
                    As(n, { pending: !0, data: e, method: i.method, action: a }, a, e));
              },
              currentTarget: i,
            },
          ],
        });
      }
    }
    for (var wd = 0; wd < Zr.length; wd++) {
      var Td = Zr[wd];
      Qr(Td.toLowerCase(), `on` + (Td[0].toUpperCase() + Td.slice(1)));
    }
    (Qr(Ur, `onAnimationEnd`),
      Qr(Wr, `onAnimationIteration`),
      Qr(Gr, `onAnimationStart`),
      Qr(`dblclick`, `onDoubleClick`),
      Qr(`focusin`, `onFocus`),
      Qr(`focusout`, `onBlur`),
      Qr(Kr, `onTransitionRun`),
      Qr(qr, `onTransitionStart`),
      Qr(Jr, `onTransitionCancel`),
      Qr(Yr, `onTransitionEnd`),
      Et(`onMouseEnter`, [`mouseout`, `mouseover`]),
      Et(`onMouseLeave`, [`mouseout`, `mouseover`]),
      Et(`onPointerEnter`, [`pointerout`, `pointerover`]),
      Et(`onPointerLeave`, [`pointerout`, `pointerover`]),
      M(`onChange`, `change click focusin focusout input keydown keyup selectionchange`.split(` `)),
      M(
        `onSelect`,
        `focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange`.split(
          ` `,
        ),
      ),
      M(`onBeforeInput`, [`compositionend`, `keypress`, `textInput`, `paste`]),
      M(`onCompositionEnd`, `compositionend focusout keydown keypress keyup mousedown`.split(` `)),
      M(
        `onCompositionStart`,
        `compositionstart focusout keydown keypress keyup mousedown`.split(` `),
      ),
      M(
        `onCompositionUpdate`,
        `compositionupdate focusout keydown keypress keyup mousedown`.split(` `),
      ));
    var Ed =
        `abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting`.split(
          ` `,
        ),
      Dd = new Set(
        `beforetoggle cancel close invalid load scroll scrollend toggle`.split(` `).concat(Ed),
      );
    function Od(e, t) {
      t = !!(t & 4);
      for (var n = 0; n < e.length; n++) {
        var r = e[n],
          i = r.event;
        r = r.listeners;
        a: {
          var a = void 0;
          if (t)
            for (var o = r.length - 1; 0 <= o; o--) {
              var s = r[o],
                c = s.instance,
                l = s.currentTarget;
              if (((s = s.listener), c !== a && i.isPropagationStopped())) break a;
              ((a = s), (i.currentTarget = l));
              try {
                a(i);
              } catch (e) {
                $r(e);
              }
              ((i.currentTarget = null), (a = c));
            }
          else
            for (o = 0; o < r.length; o++) {
              if (
                ((s = r[o]),
                (c = s.instance),
                (l = s.currentTarget),
                (s = s.listener),
                c !== a && i.isPropagationStopped())
              )
                break a;
              ((a = s), (i.currentTarget = l));
              try {
                a(i);
              } catch (e) {
                $r(e);
              }
              ((i.currentTarget = null), (a = c));
            }
        }
      }
    }
    function B(e, t) {
      var n = t[pt];
      n === void 0 && (n = t[pt] = new Set());
      var r = e + `__bubble`;
      n.has(r) || (Md(t, e, 2, !1), n.add(r));
    }
    function kd(e, t, n) {
      var r = 0;
      (t && (r |= 4), Md(n, e, r, t));
    }
    var Ad = `_reactListening` + Math.random().toString(36).slice(2);
    function jd(e) {
      if (!e[Ad]) {
        ((e[Ad] = !0),
          wt.forEach(function (t) {
            t !== `selectionchange` && (Dd.has(t) || kd(t, !1, e), kd(t, !0, e));
          }));
        var t = e.nodeType === 9 ? e : e.ownerDocument;
        t === null || t[Ad] || ((t[Ad] = !0), kd(`selectionchange`, !1, t));
      }
    }
    function Md(e, t, n, r) {
      switch (Tp(t)) {
        case 2:
          var i = yp;
          break;
        case 8:
          i = bp;
          break;
        default:
          i = xp;
      }
      ((n = i.bind(null, t, n, e)),
        (i = void 0),
        !pn || (t !== `touchstart` && t !== `touchmove` && t !== `wheel`) || (i = !0),
        r
          ? i === void 0
            ? e.addEventListener(t, n, !0)
            : e.addEventListener(t, n, { capture: !0, passive: i })
          : i === void 0
            ? e.addEventListener(t, n, !1)
            : e.addEventListener(t, n, { passive: i }));
    }
    function Nd(e, t, n, r, i) {
      var a = r;
      if (!(t & 1) && !(t & 2) && r !== null)
        a: for (;;) {
          if (r === null) return;
          var s = r.tag;
          if (s === 3 || s === 4) {
            var c = r.stateNode.containerInfo;
            if (c === i) break;
            if (s === 4)
              for (s = r.return; s !== null;) {
                var l = s.tag;
                if ((l === 3 || l === 4) && s.stateNode.containerInfo === i) return;
                s = s.return;
              }
            for (; c !== null;) {
              if (((s = yt(c)), s === null)) return;
              if (((l = s.tag), l === 5 || l === 6 || l === 26 || l === 27)) {
                r = a = s;
                continue a;
              }
              c = c.parentNode;
            }
          }
          r = r.return;
        }
      un(function () {
        var r = a,
          i = an(n),
          s = [];
        a: {
          var c = Xr.get(e);
          if (c !== void 0) {
            var l = wn,
              u = e;
            switch (e) {
              case `keypress`:
                if (yn(n) === 0) break a;
              case `keydown`:
              case `keyup`:
                l = Hn;
                break;
              case `focusin`:
                ((u = `focus`), (l = Nn));
                break;
              case `focusout`:
                ((u = `blur`), (l = Nn));
                break;
              case `beforeblur`:
              case `afterblur`:
                l = Nn;
                break;
              case `click`:
                if (n.button === 2) break a;
              case `auxclick`:
              case `dblclick`:
              case `mousedown`:
              case `mousemove`:
              case `mouseup`:
              case `mouseout`:
              case `mouseover`:
              case `contextmenu`:
                l = jn;
                break;
              case `drag`:
              case `dragend`:
              case `dragenter`:
              case `dragexit`:
              case `dragleave`:
              case `dragover`:
              case `dragstart`:
              case `drop`:
                l = Mn;
                break;
              case `touchcancel`:
              case `touchend`:
              case `touchmove`:
              case `touchstart`:
                l = Wn;
                break;
              case Ur:
              case Wr:
              case Gr:
                l = Pn;
                break;
              case Yr:
                l = Gn;
                break;
              case `scroll`:
              case `scrollend`:
                l = En;
                break;
              case `wheel`:
                l = Kn;
                break;
              case `copy`:
              case `cut`:
              case `paste`:
                l = Fn;
                break;
              case `gotpointercapture`:
              case `lostpointercapture`:
              case `pointercancel`:
              case `pointerdown`:
              case `pointermove`:
              case `pointerout`:
              case `pointerover`:
              case `pointerup`:
                l = Un;
                break;
              case `toggle`:
              case `beforetoggle`:
                l = qn;
            }
            var d = !!(t & 4),
              f = !d && (e === `scroll` || e === `scrollend`),
              p = d ? (c === null ? null : c + `Capture`) : c;
            d = [];
            for (var m = r, h; m !== null;) {
              var g = m;
              if (
                ((h = g.stateNode),
                (g = g.tag),
                (g !== 5 && g !== 26 && g !== 27) ||
                  h === null ||
                  p === null ||
                  ((g = dn(m, p)), g != null && d.push(Pd(m, g, h))),
                f)
              )
                break;
              m = m.return;
            }
            0 < d.length && ((c = new l(c, u, null, n, i)), s.push({ event: c, listeners: d }));
          }
        }
        if (!(t & 7)) {
          a: {
            if (
              ((c = e === `mouseover` || e === `pointerover`),
              (l = e === `mouseout` || e === `pointerout`),
              c && n !== rn && (u = n.relatedTarget || n.fromElement) && (yt(u) || u[ft]))
            )
              break a;
            if (
              (l || c) &&
              ((c =
                i.window === i
                  ? i
                  : (c = i.ownerDocument)
                    ? c.defaultView || c.parentWindow
                    : window),
              l
                ? ((u = n.relatedTarget || n.toElement),
                  (l = r),
                  (u = u ? yt(u) : null),
                  u !== null &&
                    ((f = o(u)), (d = u.tag), u !== f || (d !== 5 && d !== 27 && d !== 6)) &&
                    (u = null))
                : ((l = null), (u = r)),
              l !== u)
            ) {
              if (
                ((d = jn),
                (g = `onMouseLeave`),
                (p = `onMouseEnter`),
                (m = `mouse`),
                (e === `pointerout` || e === `pointerover`) &&
                  ((d = Un), (g = `onPointerLeave`), (p = `onPointerEnter`), (m = `pointer`)),
                (f = l == null ? c : xt(l)),
                (h = u == null ? c : xt(u)),
                (c = new d(g, m + `leave`, l, n, i)),
                (c.target = f),
                (c.relatedTarget = h),
                (g = null),
                yt(i) === r &&
                  ((d = new d(p, m + `enter`, u, n, i)),
                  (d.target = h),
                  (d.relatedTarget = f),
                  (g = d)),
                (f = g),
                l && u)
              )
                b: {
                  for (d = Id, p = l, m = u, h = 0, g = p; g; g = d(g)) h++;
                  g = 0;
                  for (var _ = m; _; _ = d(_)) g++;
                  for (; 0 < h - g;) ((p = d(p)), h--);
                  for (; 0 < g - h;) ((m = d(m)), g--);
                  for (; h--;) {
                    if (p === m || (m !== null && p === m.alternate)) {
                      d = p;
                      break b;
                    }
                    ((p = d(p)), (m = d(m)));
                  }
                  d = null;
                }
              else d = null;
              (l !== null && Ld(s, c, l, d, !1), u !== null && f !== null && Ld(s, f, u, d, !0));
            }
          }
          a: {
            if (
              ((c = r ? xt(r) : window),
              (l = c.nodeName && c.nodeName.toLowerCase()),
              l === `select` || (l === `input` && c.type === `file`))
            )
              var v = pr;
            else if (sr(c)) {
              if (mr) v = Cr;
              else {
                v = xr;
                var y = br;
              }
            } else
              ((l = c.nodeName),
                !l || l.toLowerCase() !== `input` || (c.type !== `checkbox` && c.type !== `radio`)
                  ? r && Qt(r.elementType) && (v = pr)
                  : (v = Sr));
            if ((v &&= v(e, r))) {
              cr(s, v, n, i);
              break a;
            }
            (y && y(e, c, r),
              e === `focusout` &&
                r &&
                c.type === `number` &&
                r.memoizedProps.value != null &&
                Wt(c, `number`, c.value));
          }
          switch (((y = r ? xt(r) : window), e)) {
            case `focusin`:
              (sr(y) || y.contentEditable === `true`) && ((Nr = y), (Pr = r), (Fr = null));
              break;
            case `focusout`:
              Fr = Pr = Nr = null;
              break;
            case `mousedown`:
              Ir = !0;
              break;
            case `contextmenu`:
            case `mouseup`:
            case `dragend`:
              ((Ir = !1), Lr(s, n, i));
              break;
            case `selectionchange`:
              if (Mr) break;
            case `keydown`:
            case `keyup`:
              Lr(s, n, i);
          }
          var b;
          if (Yn)
            b: {
              switch (e) {
                case `compositionstart`:
                  var x = `onCompositionStart`;
                  break b;
                case `compositionend`:
                  x = `onCompositionEnd`;
                  break b;
                case `compositionupdate`:
                  x = `onCompositionUpdate`;
                  break b;
              }
              x = void 0;
            }
          else
            rr
              ? tr(e, n) && (x = `onCompositionEnd`)
              : e === `keydown` && n.keyCode === 229 && (x = `onCompositionStart`);
          (x &&
            (Qn &&
              n.locale !== `ko` &&
              (rr || x !== `onCompositionStart`
                ? x === `onCompositionEnd` && rr && (b = vn())
                : ((hn = i), (gn = `value` in hn ? hn.value : hn.textContent), (rr = !0))),
            (y = Fd(r, x)),
            0 < y.length &&
              ((x = new In(x, e, null, n, i)),
              s.push({ event: x, listeners: y }),
              b ? (x.data = b) : ((b = nr(n)), b !== null && (x.data = b)))),
            (b = Zn ? ir(e, n) : ar(e, n)) &&
              ((x = Fd(r, `onBeforeInput`)),
              0 < x.length &&
                ((y = new In(`onBeforeInput`, `beforeinput`, null, n, i)),
                s.push({ event: y, listeners: x }),
                (y.data = b))),
            Cd(s, e, r, n, i));
        }
        Od(s, t);
      });
    }
    function Pd(e, t, n) {
      return { instance: e, listener: t, currentTarget: n };
    }
    function Fd(e, t) {
      for (var n = t + `Capture`, r = []; e !== null;) {
        var i = e,
          a = i.stateNode;
        if (
          ((i = i.tag),
          (i !== 5 && i !== 26 && i !== 27) ||
            a === null ||
            ((i = dn(e, n)),
            i != null && r.unshift(Pd(e, i, a)),
            (i = dn(e, t)),
            i != null && r.push(Pd(e, i, a))),
          e.tag === 3)
        )
          return r;
        e = e.return;
      }
      return [];
    }
    function Id(e) {
      if (e === null) return null;
      do e = e.return;
      while (e && e.tag !== 5 && e.tag !== 27);
      return e || null;
    }
    function Ld(e, t, n, r, i) {
      for (var a = t._reactName, o = []; n !== null && n !== r;) {
        var s = n,
          c = s.alternate,
          l = s.stateNode;
        if (((s = s.tag), c !== null && c === r)) break;
        ((s !== 5 && s !== 26 && s !== 27) ||
          l === null ||
          ((c = l),
          i
            ? ((l = dn(n, a)), l != null && o.unshift(Pd(n, l, c)))
            : i || ((l = dn(n, a)), l != null && o.push(Pd(n, l, c)))),
          (n = n.return));
      }
      o.length !== 0 && e.push({ event: t, listeners: o });
    }
    var Rd = /\r\n?/g,
      zd = /\u0000|\uFFFD/g;
    function Bd(e) {
      return (typeof e == `string` ? e : `` + e)
        .replace(
          Rd,
          `
`,
        )
        .replace(zd, ``);
    }
    function Vd(e, t) {
      return ((t = Bd(t)), Bd(e) === t);
    }
    function Hd(e, t, n, r, a, o) {
      switch (n) {
        case `children`:
          typeof r == `string`
            ? t === `body` || (t === `textarea` && r === ``) || Jt(e, r)
            : (typeof r == `number` || typeof r == `bigint`) && t !== `body` && Jt(e, `` + r);
          break;
        case `className`:
          Mt(e, `class`, r);
          break;
        case `tabIndex`:
          Mt(e, `tabindex`, r);
          break;
        case `dir`:
        case `role`:
        case `viewBox`:
        case `width`:
        case `height`:
          Mt(e, n, r);
          break;
        case `style`:
          Zt(e, r, o);
          break;
        case `data`:
          if (t !== `object`) {
            Mt(e, `data`, r);
            break;
          }
        case `src`:
        case `href`:
          if (r === `` && (t !== `a` || n !== `href`)) {
            e.removeAttribute(n);
            break;
          }
          if (
            r == null ||
            typeof r == `function` ||
            typeof r == `symbol` ||
            typeof r == `boolean`
          ) {
            e.removeAttribute(n);
            break;
          }
          ((r = tn(`` + r)), e.setAttribute(n, r));
          break;
        case `action`:
        case `formAction`:
          if (typeof r == `function`) {
            e.setAttribute(
              n,
              `javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')`,
            );
            break;
          }
          if (
            (typeof o == `function` &&
              (n === `formAction`
                ? (t !== `input` && Hd(e, t, `name`, a.name, a, null),
                  Hd(e, t, `formEncType`, a.formEncType, a, null),
                  Hd(e, t, `formMethod`, a.formMethod, a, null),
                  Hd(e, t, `formTarget`, a.formTarget, a, null))
                : (Hd(e, t, `encType`, a.encType, a, null),
                  Hd(e, t, `method`, a.method, a, null),
                  Hd(e, t, `target`, a.target, a, null))),
            r == null || typeof r == `symbol` || typeof r == `boolean`)
          ) {
            e.removeAttribute(n);
            break;
          }
          ((r = tn(`` + r)), e.setAttribute(n, r));
          break;
        case `onClick`:
          r != null && (e.onclick = nn);
          break;
        case `onScroll`:
          r != null && B(`scroll`, e);
          break;
        case `onScrollEnd`:
          r != null && B(`scrollend`, e);
          break;
        case `dangerouslySetInnerHTML`:
          if (r != null) {
            if (typeof r != `object` || !(`__html` in r)) throw Error(i(61));
            if (((n = r.__html), n != null)) {
              if (a.children != null) throw Error(i(60));
              e.innerHTML = n;
            }
          }
          break;
        case `multiple`:
          e.multiple = r && typeof r != `function` && typeof r != `symbol`;
          break;
        case `muted`:
          e.muted = r && typeof r != `function` && typeof r != `symbol`;
          break;
        case `suppressContentEditableWarning`:
        case `suppressHydrationWarning`:
        case `defaultValue`:
        case `defaultChecked`:
        case `innerHTML`:
        case `ref`:
          break;
        case `autoFocus`:
          break;
        case `xlinkHref`:
          if (
            r == null ||
            typeof r == `function` ||
            typeof r == `boolean` ||
            typeof r == `symbol`
          ) {
            e.removeAttribute(`xlink:href`);
            break;
          }
          ((n = tn(`` + r)), e.setAttributeNS(`http://www.w3.org/1999/xlink`, `xlink:href`, n));
          break;
        case `contentEditable`:
        case `spellCheck`:
        case `draggable`:
        case `value`:
        case `autoReverse`:
        case `externalResourcesRequired`:
        case `focusable`:
        case `preserveAlpha`:
          r != null && typeof r != `function` && typeof r != `symbol`
            ? e.setAttribute(n, `` + r)
            : e.removeAttribute(n);
          break;
        case `inert`:
        case `allowFullScreen`:
        case `async`:
        case `autoPlay`:
        case `controls`:
        case `default`:
        case `defer`:
        case `disabled`:
        case `disablePictureInPicture`:
        case `disableRemotePlayback`:
        case `formNoValidate`:
        case `hidden`:
        case `loop`:
        case `noModule`:
        case `noValidate`:
        case `open`:
        case `playsInline`:
        case `readOnly`:
        case `required`:
        case `reversed`:
        case `scoped`:
        case `seamless`:
        case `itemScope`:
          r && typeof r != `function` && typeof r != `symbol`
            ? e.setAttribute(n, ``)
            : e.removeAttribute(n);
          break;
        case `capture`:
        case `download`:
          !0 === r
            ? e.setAttribute(n, ``)
            : !1 !== r && r != null && typeof r != `function` && typeof r != `symbol`
              ? e.setAttribute(n, r)
              : e.removeAttribute(n);
          break;
        case `cols`:
        case `rows`:
        case `size`:
        case `span`:
          r != null && typeof r != `function` && typeof r != `symbol` && !isNaN(r) && 1 <= r
            ? e.setAttribute(n, r)
            : e.removeAttribute(n);
          break;
        case `rowSpan`:
        case `start`:
          r == null || typeof r == `function` || typeof r == `symbol` || isNaN(r)
            ? e.removeAttribute(n)
            : e.setAttribute(n, r);
          break;
        case `popover`:
          (B(`beforetoggle`, e), B(`toggle`, e), jt(e, `popover`, r));
          break;
        case `xlinkActuate`:
          Nt(e, `http://www.w3.org/1999/xlink`, `xlink:actuate`, r);
          break;
        case `xlinkArcrole`:
          Nt(e, `http://www.w3.org/1999/xlink`, `xlink:arcrole`, r);
          break;
        case `xlinkRole`:
          Nt(e, `http://www.w3.org/1999/xlink`, `xlink:role`, r);
          break;
        case `xlinkShow`:
          Nt(e, `http://www.w3.org/1999/xlink`, `xlink:show`, r);
          break;
        case `xlinkTitle`:
          Nt(e, `http://www.w3.org/1999/xlink`, `xlink:title`, r);
          break;
        case `xlinkType`:
          Nt(e, `http://www.w3.org/1999/xlink`, `xlink:type`, r);
          break;
        case `xmlBase`:
          Nt(e, `http://www.w3.org/XML/1998/namespace`, `xml:base`, r);
          break;
        case `xmlLang`:
          Nt(e, `http://www.w3.org/XML/1998/namespace`, `xml:lang`, r);
          break;
        case `xmlSpace`:
          Nt(e, `http://www.w3.org/XML/1998/namespace`, `xml:space`, r);
          break;
        case `is`:
          jt(e, `is`, r);
          break;
        case `innerText`:
        case `textContent`:
          break;
        default:
          (!(2 < n.length) || (n[0] !== `o` && n[0] !== `O`) || (n[1] !== `n` && n[1] !== `N`)) &&
            ((n = $t.get(n) || n), jt(e, n, r));
      }
    }
    function Ud(e, t, n, r, a, o) {
      switch (n) {
        case `style`:
          Zt(e, r, o);
          break;
        case `dangerouslySetInnerHTML`:
          if (r != null) {
            if (typeof r != `object` || !(`__html` in r)) throw Error(i(61));
            if (((n = r.__html), n != null)) {
              if (a.children != null) throw Error(i(60));
              e.innerHTML = n;
            }
          }
          break;
        case `children`:
          typeof r == `string`
            ? Jt(e, r)
            : (typeof r == `number` || typeof r == `bigint`) && Jt(e, `` + r);
          break;
        case `onScroll`:
          r != null && B(`scroll`, e);
          break;
        case `onScrollEnd`:
          r != null && B(`scrollend`, e);
          break;
        case `onClick`:
          r != null && (e.onclick = nn);
          break;
        case `suppressContentEditableWarning`:
        case `suppressHydrationWarning`:
        case `innerHTML`:
        case `ref`:
          break;
        case `innerText`:
        case `textContent`:
          break;
        default:
          if (!Tt.hasOwnProperty(n))
            a: {
              if (
                n[0] === `o` &&
                n[1] === `n` &&
                ((a = n.endsWith(`Capture`)),
                (t = n.slice(2, a ? n.length - 7 : void 0)),
                (o = e[dt] || null),
                (o = o == null ? null : o[n]),
                typeof o == `function` && e.removeEventListener(t, o, a),
                typeof r == `function`)
              ) {
                (typeof o != `function` &&
                  o !== null &&
                  (n in e ? (e[n] = null) : e.hasAttribute(n) && e.removeAttribute(n)),
                  e.addEventListener(t, r, a));
                break a;
              }
              n in e ? (e[n] = r) : !0 === r ? e.setAttribute(n, ``) : jt(e, n, r);
            }
      }
    }
    function Wd(e, t, n) {
      switch (t) {
        case `div`:
        case `span`:
        case `svg`:
        case `path`:
        case `a`:
        case `g`:
        case `p`:
        case `li`:
          break;
        case `img`:
          (B(`error`, e), B(`load`, e));
          var r = !1,
            a = !1,
            o;
          for (o in n)
            if (n.hasOwnProperty(o)) {
              var s = n[o];
              if (s != null)
                switch (o) {
                  case `src`:
                    r = !0;
                    break;
                  case `srcSet`:
                    a = !0;
                    break;
                  case `children`:
                  case `dangerouslySetInnerHTML`:
                    throw Error(i(137, t));
                  default:
                    Hd(e, t, o, s, n, null);
                }
            }
          (a && Hd(e, t, `srcSet`, n.srcSet, n, null), r && Hd(e, t, `src`, n.src, n, null));
          return;
        case `input`:
          B(`invalid`, e);
          var c = (o = s = a = null),
            l = null,
            u = null;
          for (r in n)
            if (n.hasOwnProperty(r)) {
              var d = n[r];
              if (d != null)
                switch (r) {
                  case `name`:
                    a = d;
                    break;
                  case `type`:
                    s = d;
                    break;
                  case `checked`:
                    l = d;
                    break;
                  case `defaultChecked`:
                    u = d;
                    break;
                  case `value`:
                    o = d;
                    break;
                  case `defaultValue`:
                    c = d;
                    break;
                  case `children`:
                  case `dangerouslySetInnerHTML`:
                    if (d != null) throw Error(i(137, t));
                    break;
                  default:
                    Hd(e, t, r, d, n, null);
                }
            }
          Ut(e, o, c, l, u, s, a, !1);
          return;
        case `select`:
          for (a in (B(`invalid`, e), (r = s = o = null), n))
            if (n.hasOwnProperty(a) && ((c = n[a]), c != null))
              switch (a) {
                case `value`:
                  o = c;
                  break;
                case `defaultValue`:
                  s = c;
                  break;
                case `multiple`:
                  r = c;
                default:
                  Hd(e, t, a, c, n, null);
              }
          ((t = o),
            (n = s),
            (e.multiple = !!r),
            t == null ? n != null && Gt(e, !!r, n, !0) : Gt(e, !!r, t, !1));
          return;
        case `textarea`:
          for (s in (B(`invalid`, e), (o = a = r = null), n))
            if (n.hasOwnProperty(s) && ((c = n[s]), c != null))
              switch (s) {
                case `value`:
                  r = c;
                  break;
                case `defaultValue`:
                  a = c;
                  break;
                case `children`:
                  o = c;
                  break;
                case `dangerouslySetInnerHTML`:
                  if (c != null) throw Error(i(91));
                  break;
                default:
                  Hd(e, t, s, c, n, null);
              }
          qt(e, r, a, o);
          return;
        case `option`:
          for (l in n)
            if (n.hasOwnProperty(l) && ((r = n[l]), r != null))
              switch (l) {
                case `selected`:
                  e.selected = r && typeof r != `function` && typeof r != `symbol`;
                  break;
                default:
                  Hd(e, t, l, r, n, null);
              }
          return;
        case `dialog`:
          (B(`beforetoggle`, e), B(`toggle`, e), B(`cancel`, e), B(`close`, e));
          break;
        case `iframe`:
        case `object`:
          B(`load`, e);
          break;
        case `video`:
        case `audio`:
          for (r = 0; r < Ed.length; r++) B(Ed[r], e);
          break;
        case `image`:
          (B(`error`, e), B(`load`, e));
          break;
        case `details`:
          B(`toggle`, e);
          break;
        case `embed`:
        case `source`:
        case `link`:
          (B(`error`, e), B(`load`, e));
        case `area`:
        case `base`:
        case `br`:
        case `col`:
        case `hr`:
        case `keygen`:
        case `meta`:
        case `param`:
        case `track`:
        case `wbr`:
        case `menuitem`:
          for (u in n)
            if (n.hasOwnProperty(u) && ((r = n[u]), r != null))
              switch (u) {
                case `children`:
                case `dangerouslySetInnerHTML`:
                  throw Error(i(137, t));
                default:
                  Hd(e, t, u, r, n, null);
              }
          return;
        default:
          if (Qt(t)) {
            for (d in n)
              n.hasOwnProperty(d) && ((r = n[d]), r !== void 0 && Ud(e, t, d, r, n, void 0));
            return;
          }
      }
      for (c in n) n.hasOwnProperty(c) && ((r = n[c]), r != null && Hd(e, t, c, r, n, null));
    }
    function Gd(e, t, n, r) {
      switch (t) {
        case `div`:
        case `span`:
        case `svg`:
        case `path`:
        case `a`:
        case `g`:
        case `p`:
        case `li`:
          break;
        case `input`:
          var a = null,
            o = null,
            s = null,
            c = null,
            l = null,
            u = null,
            d = null;
          for (m in n) {
            var f = n[m];
            if (n.hasOwnProperty(m) && f != null)
              switch (m) {
                case `checked`:
                  break;
                case `value`:
                  break;
                case `defaultValue`:
                  l = f;
                default:
                  r.hasOwnProperty(m) || Hd(e, t, m, null, r, f);
              }
          }
          for (var p in r) {
            var m = r[p];
            if (((f = n[p]), r.hasOwnProperty(p) && (m != null || f != null)))
              switch (p) {
                case `type`:
                  o = m;
                  break;
                case `name`:
                  a = m;
                  break;
                case `checked`:
                  u = m;
                  break;
                case `defaultChecked`:
                  d = m;
                  break;
                case `value`:
                  s = m;
                  break;
                case `defaultValue`:
                  c = m;
                  break;
                case `children`:
                case `dangerouslySetInnerHTML`:
                  if (m != null) throw Error(i(137, t));
                  break;
                default:
                  m !== f && Hd(e, t, p, m, r, f);
              }
          }
          Ht(e, s, c, l, u, d, o, a);
          return;
        case `select`:
          for (o in ((m = s = c = p = null), n))
            if (((l = n[o]), n.hasOwnProperty(o) && l != null))
              switch (o) {
                case `value`:
                  break;
                case `multiple`:
                  m = l;
                default:
                  r.hasOwnProperty(o) || Hd(e, t, o, null, r, l);
              }
          for (a in r)
            if (((o = r[a]), (l = n[a]), r.hasOwnProperty(a) && (o != null || l != null)))
              switch (a) {
                case `value`:
                  p = o;
                  break;
                case `defaultValue`:
                  c = o;
                  break;
                case `multiple`:
                  s = o;
                default:
                  o !== l && Hd(e, t, a, o, r, l);
              }
          ((t = c),
            (n = s),
            (r = m),
            p == null
              ? !!r != !!n && (t == null ? Gt(e, !!n, n ? [] : ``, !1) : Gt(e, !!n, t, !0))
              : Gt(e, !!n, p, !1));
          return;
        case `textarea`:
          for (c in ((m = p = null), n))
            if (((a = n[c]), n.hasOwnProperty(c) && a != null && !r.hasOwnProperty(c)))
              switch (c) {
                case `value`:
                  break;
                case `children`:
                  break;
                default:
                  Hd(e, t, c, null, r, a);
              }
          for (s in r)
            if (((a = r[s]), (o = n[s]), r.hasOwnProperty(s) && (a != null || o != null)))
              switch (s) {
                case `value`:
                  p = a;
                  break;
                case `defaultValue`:
                  m = a;
                  break;
                case `children`:
                  break;
                case `dangerouslySetInnerHTML`:
                  if (a != null) throw Error(i(91));
                  break;
                default:
                  a !== o && Hd(e, t, s, a, r, o);
              }
          Kt(e, p, m);
          return;
        case `option`:
          for (var h in n)
            if (((p = n[h]), n.hasOwnProperty(h) && p != null && !r.hasOwnProperty(h)))
              switch (h) {
                case `selected`:
                  e.selected = !1;
                  break;
                default:
                  Hd(e, t, h, null, r, p);
              }
          for (l in r)
            if (
              ((p = r[l]), (m = n[l]), r.hasOwnProperty(l) && p !== m && (p != null || m != null))
            )
              switch (l) {
                case `selected`:
                  e.selected = p && typeof p != `function` && typeof p != `symbol`;
                  break;
                default:
                  Hd(e, t, l, p, r, m);
              }
          return;
        case `img`:
        case `link`:
        case `area`:
        case `base`:
        case `br`:
        case `col`:
        case `embed`:
        case `hr`:
        case `keygen`:
        case `meta`:
        case `param`:
        case `source`:
        case `track`:
        case `wbr`:
        case `menuitem`:
          for (var g in n)
            ((p = n[g]),
              n.hasOwnProperty(g) && p != null && !r.hasOwnProperty(g) && Hd(e, t, g, null, r, p));
          for (u in r)
            if (
              ((p = r[u]), (m = n[u]), r.hasOwnProperty(u) && p !== m && (p != null || m != null))
            )
              switch (u) {
                case `children`:
                case `dangerouslySetInnerHTML`:
                  if (p != null) throw Error(i(137, t));
                  break;
                default:
                  Hd(e, t, u, p, r, m);
              }
          return;
        default:
          if (Qt(t)) {
            for (var _ in n)
              ((p = n[_]),
                n.hasOwnProperty(_) &&
                  p !== void 0 &&
                  !r.hasOwnProperty(_) &&
                  Ud(e, t, _, void 0, r, p));
            for (d in r)
              ((p = r[d]),
                (m = n[d]),
                !r.hasOwnProperty(d) ||
                  p === m ||
                  (p === void 0 && m === void 0) ||
                  Ud(e, t, d, p, r, m));
            return;
          }
      }
      for (var v in n)
        ((p = n[v]),
          n.hasOwnProperty(v) && p != null && !r.hasOwnProperty(v) && Hd(e, t, v, null, r, p));
      for (f in r)
        ((p = r[f]),
          (m = n[f]),
          !r.hasOwnProperty(f) || p === m || (p == null && m == null) || Hd(e, t, f, p, r, m));
    }
    function Kd(e) {
      switch (e) {
        case `css`:
        case `script`:
        case `font`:
        case `img`:
        case `image`:
        case `input`:
        case `link`:
          return !0;
        default:
          return !1;
      }
    }
    function qd() {
      if (typeof performance.getEntriesByType == `function`) {
        for (
          var e = 0, t = 0, n = performance.getEntriesByType(`resource`), r = 0;
          r < n.length;
          r++
        ) {
          var i = n[r],
            a = i.transferSize,
            o = i.initiatorType,
            s = i.duration;
          if (a && s && Kd(o)) {
            for (o = 0, s = i.responseEnd, r += 1; r < n.length; r++) {
              var c = n[r],
                l = c.startTime;
              if (l > s) break;
              var u = c.transferSize,
                d = c.initiatorType;
              u && Kd(d) && ((c = c.responseEnd), (o += u * (c < s ? 1 : (s - l) / (c - l))));
            }
            if ((--r, (t += (8 * (a + o)) / (i.duration / 1e3)), e++, 10 < e)) break;
          }
        }
        if (0 < e) return t / e / 1e6;
      }
      return navigator.connection && ((e = navigator.connection.downlink), typeof e == `number`)
        ? e
        : 5;
    }
    var Jd = null,
      Yd = null;
    function Xd(e) {
      return e.nodeType === 9 ? e : e.ownerDocument;
    }
    function Zd(e) {
      switch (e) {
        case `http://www.w3.org/2000/svg`:
          return 1;
        case `http://www.w3.org/1998/Math/MathML`:
          return 2;
        default:
          return 0;
      }
    }
    function Qd(e, t) {
      if (e === 0)
        switch (t) {
          case `svg`:
            return 1;
          case `math`:
            return 2;
          default:
            return 0;
        }
      return e === 1 && t === `foreignObject` ? 0 : e;
    }
    function $d(e, t) {
      return (
        e === `textarea` ||
        e === `noscript` ||
        typeof t.children == `string` ||
        typeof t.children == `number` ||
        typeof t.children == `bigint` ||
        (typeof t.dangerouslySetInnerHTML == `object` &&
          t.dangerouslySetInnerHTML !== null &&
          t.dangerouslySetInnerHTML.__html != null)
      );
    }
    var ef = null;
    function tf() {
      var e = window.event;
      return e && e.type === `popstate` ? e !== ef && ((ef = e), !0) : ((ef = null), !1);
    }
    var nf = typeof setTimeout == `function` ? setTimeout : void 0,
      rf = typeof clearTimeout == `function` ? clearTimeout : void 0,
      af = typeof Promise == `function` ? Promise : void 0,
      of =
        typeof queueMicrotask == `function`
          ? queueMicrotask
          : af === void 0
            ? nf
            : function (e) {
                return af.resolve(null).then(e).catch(sf);
              };
    function sf(e) {
      setTimeout(function () {
        throw e;
      });
    }
    function cf(e) {
      return e === `head`;
    }
    function lf(e, t) {
      var n = t,
        r = 0;
      do {
        var i = n.nextSibling;
        if ((e.removeChild(n), i && i.nodeType === 8)) {
          if (((n = i.data), n === `/$` || n === `/&`)) {
            if (r === 0) {
              (e.removeChild(i), Wp(t));
              return;
            }
            r--;
          } else if (n === `$` || n === `$?` || n === `$~` || n === `$!` || n === `&`) r++;
          else if (n === `html`) Cf(e.ownerDocument.documentElement);
          else if (n === `head`) {
            ((n = e.ownerDocument.head), Cf(n));
            for (var a = n.firstChild; a;) {
              var o = a.nextSibling,
                s = a.nodeName;
              (a[_t] ||
                s === `SCRIPT` ||
                s === `STYLE` ||
                (s === `LINK` && a.rel.toLowerCase() === `stylesheet`) ||
                n.removeChild(a),
                (a = o));
            }
          } else n === `body` && Cf(e.ownerDocument.body);
        }
        n = i;
      } while (n);
      Wp(t);
    }
    function uf(e, t) {
      var n = e;
      e = 0;
      do {
        var r = n.nextSibling;
        if (
          (n.nodeType === 1
            ? t
              ? ((n._stashedDisplay = n.style.display), (n.style.display = `none`))
              : ((n.style.display = n._stashedDisplay || ``),
                n.getAttribute(`style`) === `` && n.removeAttribute(`style`))
            : n.nodeType === 3 &&
              (t
                ? ((n._stashedText = n.nodeValue), (n.nodeValue = ``))
                : (n.nodeValue = n._stashedText || ``)),
          r && r.nodeType === 8)
        ) {
          if (((n = r.data), n === `/$`)) {
            if (e === 0) break;
            e--;
          } else (n !== `$` && n !== `$?` && n !== `$~` && n !== `$!`) || e++;
        }
        n = r;
      } while (n);
    }
    function df(e) {
      var t = e.firstChild;
      for (t && t.nodeType === 10 && (t = t.nextSibling); t;) {
        var n = t;
        switch (((t = t.nextSibling), n.nodeName)) {
          case `HTML`:
          case `HEAD`:
          case `BODY`:
            (df(n), vt(n));
            continue;
          case `SCRIPT`:
          case `STYLE`:
            continue;
          case `LINK`:
            if (n.rel.toLowerCase() === `stylesheet`) continue;
        }
        e.removeChild(n);
      }
    }
    function ff(e, t, n, r) {
      for (; e.nodeType === 1;) {
        var i = n;
        if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
          if (!r && (e.nodeName !== `INPUT` || e.type !== `hidden`)) break;
        } else if (!r) {
          if (t === `input` && e.type === `hidden`) {
            var a = i.name == null ? null : `` + i.name;
            if (i.type === `hidden` && e.getAttribute(`name`) === a) return e;
          } else return e;
        } else if (!e[_t])
          switch (t) {
            case `meta`:
              if (!e.hasAttribute(`itemprop`)) break;
              return e;
            case `link`:
              if (
                ((a = e.getAttribute(`rel`)),
                (a === `stylesheet` && e.hasAttribute(`data-precedence`)) ||
                  a !== i.rel ||
                  e.getAttribute(`href`) !== (i.href == null || i.href === `` ? null : i.href) ||
                  e.getAttribute(`crossorigin`) !==
                    (i.crossOrigin == null ? null : i.crossOrigin) ||
                  e.getAttribute(`title`) !== (i.title == null ? null : i.title))
              )
                break;
              return e;
            case `style`:
              if (e.hasAttribute(`data-precedence`)) break;
              return e;
            case `script`:
              if (
                ((a = e.getAttribute(`src`)),
                (a !== (i.src == null ? null : i.src) ||
                  e.getAttribute(`type`) !== (i.type == null ? null : i.type) ||
                  e.getAttribute(`crossorigin`) !==
                    (i.crossOrigin == null ? null : i.crossOrigin)) &&
                  a &&
                  e.hasAttribute(`async`) &&
                  !e.hasAttribute(`itemprop`))
              )
                break;
              return e;
            default:
              return e;
          }
        if (((e = vf(e.nextSibling)), e === null)) break;
      }
      return null;
    }
    function pf(e, t, n) {
      if (t === ``) return null;
      for (; e.nodeType !== 3;)
        if (
          ((e.nodeType !== 1 || e.nodeName !== `INPUT` || e.type !== `hidden`) && !n) ||
          ((e = vf(e.nextSibling)), e === null)
        )
          return null;
      return e;
    }
    function mf(e, t) {
      for (; e.nodeType !== 8;)
        if (
          ((e.nodeType !== 1 || e.nodeName !== `INPUT` || e.type !== `hidden`) && !t) ||
          ((e = vf(e.nextSibling)), e === null)
        )
          return null;
      return e;
    }
    function hf(e) {
      return e.data === `$?` || e.data === `$~`;
    }
    function gf(e) {
      return e.data === `$!` || (e.data === `$?` && e.ownerDocument.readyState !== `loading`);
    }
    function _f(e, t) {
      var n = e.ownerDocument;
      if (e.data === `$~`) e._reactRetry = t;
      else if (e.data !== `$?` || n.readyState !== `loading`) t();
      else {
        var r = function () {
          (t(), n.removeEventListener(`DOMContentLoaded`, r));
        };
        (n.addEventListener(`DOMContentLoaded`, r), (e._reactRetry = r));
      }
    }
    function vf(e) {
      for (; e != null; e = e.nextSibling) {
        var t = e.nodeType;
        if (t === 1 || t === 3) break;
        if (t === 8) {
          if (
            ((t = e.data),
            t === `$` ||
              t === `$!` ||
              t === `$?` ||
              t === `$~` ||
              t === `&` ||
              t === `F!` ||
              t === `F`)
          )
            break;
          if (t === `/$` || t === `/&`) return null;
        }
      }
      return e;
    }
    var yf = null;
    function bf(e) {
      e = e.nextSibling;
      for (var t = 0; e;) {
        if (e.nodeType === 8) {
          var n = e.data;
          if (n === `/$` || n === `/&`) {
            if (t === 0) return vf(e.nextSibling);
            t--;
          } else (n !== `$` && n !== `$!` && n !== `$?` && n !== `$~` && n !== `&`) || t++;
        }
        e = e.nextSibling;
      }
      return null;
    }
    function xf(e) {
      e = e.previousSibling;
      for (var t = 0; e;) {
        if (e.nodeType === 8) {
          var n = e.data;
          if (n === `$` || n === `$!` || n === `$?` || n === `$~` || n === `&`) {
            if (t === 0) return e;
            t--;
          } else (n !== `/$` && n !== `/&`) || t++;
        }
        e = e.previousSibling;
      }
      return null;
    }
    function Sf(e, t, n) {
      switch (((t = Xd(n)), e)) {
        case `html`:
          if (((e = t.documentElement), !e)) throw Error(i(452));
          return e;
        case `head`:
          if (((e = t.head), !e)) throw Error(i(453));
          return e;
        case `body`:
          if (((e = t.body), !e)) throw Error(i(454));
          return e;
        default:
          throw Error(i(451));
      }
    }
    function Cf(e) {
      for (var t = e.attributes; t.length;) e.removeAttributeNode(t[0]);
      vt(e);
    }
    var wf = new Map(),
      Tf = new Set();
    function Ef(e) {
      return typeof e.getRootNode == `function`
        ? e.getRootNode()
        : e.nodeType === 9
          ? e
          : e.ownerDocument;
    }
    var Df = E.d;
    E.d = { f: Of, r: kf, D: Mf, C: Nf, L: Pf, m: Ff, X: Lf, S: If, M: Rf };
    function Of() {
      var e = Df.f(),
        t = ku();
      return e || t;
    }
    function kf(e) {
      var t = bt(e);
      t !== null && t.tag === 5 && t.type === `form` ? Ms(t) : Df.r(e);
    }
    var Af = typeof document > `u` ? null : document;
    function jf(e, t, n) {
      var r = Af;
      if (r && typeof t == `string` && t) {
        var i = Vt(t);
        ((i = `link[rel="` + e + `"][href="` + i + `"]`),
          typeof n == `string` && (i += `[crossorigin="` + n + `"]`),
          Tf.has(i) ||
            (Tf.add(i),
            (e = { rel: e, crossOrigin: n, href: t }),
            r.querySelector(i) === null &&
              ((t = r.createElement(`link`)), Wd(t, `link`, e), Ct(t), r.head.appendChild(t))));
      }
    }
    function Mf(e) {
      (Df.D(e), jf(`dns-prefetch`, e, null));
    }
    function Nf(e, t) {
      (Df.C(e, t), jf(`preconnect`, e, t));
    }
    function Pf(e, t, n) {
      Df.L(e, t, n);
      var r = Af;
      if (r && e && t) {
        var i = `link[rel="preload"][as="` + Vt(t) + `"]`;
        t === `image` && n && n.imageSrcSet
          ? ((i += `[imagesrcset="` + Vt(n.imageSrcSet) + `"]`),
            typeof n.imageSizes == `string` && (i += `[imagesizes="` + Vt(n.imageSizes) + `"]`))
          : (i += `[href="` + Vt(e) + `"]`);
        var a = i;
        switch (t) {
          case `style`:
            a = Vf(e);
            break;
          case `script`:
            a = qf(e);
        }
        wf.has(a) ||
          ((e = f(
            { rel: `preload`, href: t === `image` && n && n.imageSrcSet ? void 0 : e, as: t },
            n,
          )),
          wf.set(a, e),
          r.querySelector(i) !== null ||
            (t === `style` && r.querySelector(Uf(a))) ||
            (t === `script` && r.querySelector(Jf(a))) ||
            ((t = r.createElement(`link`)), Wd(t, `link`, e), Ct(t), r.head.appendChild(t)));
      }
    }
    function Ff(e, t) {
      Df.m(e, t);
      var n = Af;
      if (n && e) {
        var r = t && typeof t.as == `string` ? t.as : `script`,
          i = `link[rel="modulepreload"][as="` + Vt(r) + `"][href="` + Vt(e) + `"]`,
          a = i;
        switch (r) {
          case `audioworklet`:
          case `paintworklet`:
          case `serviceworker`:
          case `sharedworker`:
          case `worker`:
          case `script`:
            a = qf(e);
        }
        if (
          !wf.has(a) &&
          ((e = f({ rel: `modulepreload`, href: e }, t)), wf.set(a, e), n.querySelector(i) === null)
        ) {
          switch (r) {
            case `audioworklet`:
            case `paintworklet`:
            case `serviceworker`:
            case `sharedworker`:
            case `worker`:
            case `script`:
              if (n.querySelector(Jf(a))) return;
          }
          ((r = n.createElement(`link`)), Wd(r, `link`, e), Ct(r), n.head.appendChild(r));
        }
      }
    }
    function If(e, t, n) {
      Df.S(e, t, n);
      var r = Af;
      if (r && e) {
        var i = St(r).hoistableStyles,
          a = Vf(e);
        t ||= `default`;
        var o = i.get(a);
        if (!o) {
          var s = { loading: 0, preload: null };
          if ((o = r.querySelector(Uf(a)))) s.loading = 5;
          else {
            ((e = f({ rel: `stylesheet`, href: e, "data-precedence": t }, n)),
              (n = wf.get(a)) && V(e, n));
            var c = (o = r.createElement(`link`));
            (Ct(c),
              Wd(c, `link`, e),
              (c._p = new Promise(function (e, t) {
                ((c.onload = e), (c.onerror = t));
              })),
              c.addEventListener(`load`, function () {
                s.loading |= 1;
              }),
              c.addEventListener(`error`, function () {
                s.loading |= 2;
              }),
              (s.loading |= 4),
              Xf(o, t, r));
          }
          ((o = { type: `stylesheet`, instance: o, count: 1, state: s }), i.set(a, o));
        }
      }
    }
    function Lf(e, t) {
      Df.X(e, t);
      var n = Af;
      if (n && e) {
        var r = St(n).hoistableScripts,
          i = qf(e),
          a = r.get(i);
        a ||
          ((a = n.querySelector(Jf(i))),
          a ||
            ((e = f({ src: e, async: !0 }, t)),
            (t = wf.get(i)) && Zf(e, t),
            (a = n.createElement(`script`)),
            Ct(a),
            Wd(a, `link`, e),
            n.head.appendChild(a)),
          (a = { type: `script`, instance: a, count: 1, state: null }),
          r.set(i, a));
      }
    }
    function Rf(e, t) {
      Df.M(e, t);
      var n = Af;
      if (n && e) {
        var r = St(n).hoistableScripts,
          i = qf(e),
          a = r.get(i);
        a ||
          ((a = n.querySelector(Jf(i))),
          a ||
            ((e = f({ src: e, async: !0, type: `module` }, t)),
            (t = wf.get(i)) && Zf(e, t),
            (a = n.createElement(`script`)),
            Ct(a),
            Wd(a, `link`, e),
            n.head.appendChild(a)),
          (a = { type: `script`, instance: a, count: 1, state: null }),
          r.set(i, a));
      }
    }
    function zf(e, t, n, r) {
      var a = (a = me.current) ? Ef(a) : null;
      if (!a) throw Error(i(446));
      switch (e) {
        case `meta`:
        case `title`:
          return null;
        case `style`:
          return typeof n.precedence == `string` && typeof n.href == `string`
            ? ((t = Vf(n.href)),
              (n = St(a).hoistableStyles),
              (r = n.get(t)),
              r || ((r = { type: `style`, instance: null, count: 0, state: null }), n.set(t, r)),
              r)
            : { type: `void`, instance: null, count: 0, state: null };
        case `link`:
          if (
            n.rel === `stylesheet` &&
            typeof n.href == `string` &&
            typeof n.precedence == `string`
          ) {
            e = Vf(n.href);
            var o = St(a).hoistableStyles,
              s = o.get(e);
            if (
              (s ||
                ((a = a.ownerDocument || a),
                (s = {
                  type: `stylesheet`,
                  instance: null,
                  count: 0,
                  state: { loading: 0, preload: null },
                }),
                o.set(e, s),
                (o = a.querySelector(Uf(e))) && !o._p && ((s.instance = o), (s.state.loading = 5)),
                wf.has(e) ||
                  ((n = {
                    rel: `preload`,
                    as: `style`,
                    href: n.href,
                    crossOrigin: n.crossOrigin,
                    integrity: n.integrity,
                    media: n.media,
                    hrefLang: n.hrefLang,
                    referrerPolicy: n.referrerPolicy,
                  }),
                  wf.set(e, n),
                  o || Kf(a, e, n, s.state))),
              t && r === null)
            )
              throw Error(i(528, ``));
            return s;
          }
          if (t && r !== null) throw Error(i(529, ``));
          return null;
        case `script`:
          return (
            (t = n.async),
            (n = n.src),
            typeof n == `string` && t && typeof t != `function` && typeof t != `symbol`
              ? ((t = qf(n)),
                (n = St(a).hoistableScripts),
                (r = n.get(t)),
                r || ((r = { type: `script`, instance: null, count: 0, state: null }), n.set(t, r)),
                r)
              : { type: `void`, instance: null, count: 0, state: null }
          );
        default:
          throw Error(i(444, e));
      }
    }
    function Vf(e) {
      return `href="` + Vt(e) + `"`;
    }
    function Uf(e) {
      return `link[rel="stylesheet"][` + e + `]`;
    }
    function Gf(e) {
      return f({}, e, { "data-precedence": e.precedence, precedence: null });
    }
    function Kf(e, t, n, r) {
      e.querySelector(`link[rel="preload"][as="style"][` + t + `]`)
        ? (r.loading = 1)
        : ((t = e.createElement(`link`)),
          (r.preload = t),
          t.addEventListener(`load`, function () {
            return (r.loading |= 1);
          }),
          t.addEventListener(`error`, function () {
            return (r.loading |= 2);
          }),
          Wd(t, `link`, n),
          Ct(t),
          e.head.appendChild(t));
    }
    function qf(e) {
      return `[src="` + Vt(e) + `"]`;
    }
    function Jf(e) {
      return `script[async]` + e;
    }
    function Yf(e, t, n) {
      if ((t.count++, t.instance === null))
        switch (t.type) {
          case `style`:
            var r = e.querySelector(`style[data-href~="` + Vt(n.href) + `"]`);
            if (r) return ((t.instance = r), Ct(r), r);
            var a = f({}, n, {
              "data-href": n.href,
              "data-precedence": n.precedence,
              href: null,
              precedence: null,
            });
            return (
              (r = (e.ownerDocument || e).createElement(`style`)),
              Ct(r),
              Wd(r, `style`, a),
              Xf(r, n.precedence, e),
              (t.instance = r)
            );
          case `stylesheet`:
            a = Vf(n.href);
            var o = e.querySelector(Uf(a));
            if (o) return ((t.state.loading |= 4), (t.instance = o), Ct(o), o);
            ((r = Gf(n)),
              (a = wf.get(a)) && V(r, a),
              (o = (e.ownerDocument || e).createElement(`link`)),
              Ct(o));
            var s = o;
            return (
              (s._p = new Promise(function (e, t) {
                ((s.onload = e), (s.onerror = t));
              })),
              Wd(o, `link`, r),
              (t.state.loading |= 4),
              Xf(o, n.precedence, e),
              (t.instance = o)
            );
          case `script`:
            return (
              (o = qf(n.src)),
              (a = e.querySelector(Jf(o)))
                ? ((t.instance = a), Ct(a), a)
                : ((r = n),
                  (a = wf.get(o)) && ((r = f({}, n)), Zf(r, a)),
                  (e = e.ownerDocument || e),
                  (a = e.createElement(`script`)),
                  Ct(a),
                  Wd(a, `link`, r),
                  e.head.appendChild(a),
                  (t.instance = a))
            );
          case `void`:
            return null;
          default:
            throw Error(i(443, t.type));
        }
      else
        t.type === `stylesheet` &&
          !(t.state.loading & 4) &&
          ((r = t.instance), (t.state.loading |= 4), Xf(r, n.precedence, e));
      return t.instance;
    }
    function Xf(e, t, n) {
      for (
        var r = n.querySelectorAll(
            `link[rel="stylesheet"][data-precedence],style[data-precedence]`,
          ),
          i = r.length ? r[r.length - 1] : null,
          a = i,
          o = 0;
        o < r.length;
        o++
      ) {
        var s = r[o];
        if (s.dataset.precedence === t) a = s;
        else if (a !== i) break;
      }
      a
        ? a.parentNode.insertBefore(e, a.nextSibling)
        : ((t = n.nodeType === 9 ? n.head : n), t.insertBefore(e, t.firstChild));
    }
    function V(e, t) {
      ((e.crossOrigin ??= t.crossOrigin),
        (e.referrerPolicy ??= t.referrerPolicy),
        (e.title ??= t.title));
    }
    function Zf(e, t) {
      ((e.crossOrigin ??= t.crossOrigin),
        (e.referrerPolicy ??= t.referrerPolicy),
        (e.integrity ??= t.integrity));
    }
    var Qf = null;
    function $f(e, t, n) {
      if (Qf === null) {
        var r = new Map(),
          i = (Qf = new Map());
        i.set(n, r);
      } else ((i = Qf), (r = i.get(n)), r || ((r = new Map()), i.set(n, r)));
      if (r.has(e)) return r;
      for (r.set(e, null), n = n.getElementsByTagName(e), i = 0; i < n.length; i++) {
        var a = n[i];
        if (
          !(a[_t] || a[ut] || (e === `link` && a.getAttribute(`rel`) === `stylesheet`)) &&
          a.namespaceURI !== `http://www.w3.org/2000/svg`
        ) {
          var o = a.getAttribute(t) || ``;
          o = e + o;
          var s = r.get(o);
          s ? s.push(a) : r.set(o, [a]);
        }
      }
      return r;
    }
    function ep(e, t, n) {
      ((e = e.ownerDocument || e),
        e.head.insertBefore(n, t === `title` ? e.querySelector(`head > title`) : null));
    }
    function tp(e, t, n) {
      if (n === 1 || t.itemProp != null) return !1;
      switch (e) {
        case `meta`:
        case `title`:
          return !0;
        case `style`:
          if (typeof t.precedence != `string` || typeof t.href != `string` || t.href === ``) break;
          return !0;
        case `link`:
          if (
            typeof t.rel != `string` ||
            typeof t.href != `string` ||
            t.href === `` ||
            t.onLoad ||
            t.onError
          )
            break;
          switch (t.rel) {
            case `stylesheet`:
              return ((e = t.disabled), typeof t.precedence == `string` && e == null);
            default:
              return !0;
          }
        case `script`:
          if (
            t.async &&
            typeof t.async != `function` &&
            typeof t.async != `symbol` &&
            !t.onLoad &&
            !t.onError &&
            t.src &&
            typeof t.src == `string`
          )
            return !0;
      }
      return !1;
    }
    function np(e) {
      return !(e.type === `stylesheet` && !(e.state.loading & 3));
    }
    function rp(e, t, n, r) {
      if (
        n.type === `stylesheet` &&
        (typeof r.media != `string` || !1 !== matchMedia(r.media).matches) &&
        !(n.state.loading & 4)
      ) {
        if (n.instance === null) {
          var i = Vf(r.href),
            a = t.querySelector(Uf(i));
          if (a) {
            ((t = a._p),
              typeof t == `object` &&
                t &&
                typeof t.then == `function` &&
                (e.count++, (e = op.bind(e)), t.then(e, e)),
              (n.state.loading |= 4),
              (n.instance = a),
              Ct(a));
            return;
          }
          ((a = t.ownerDocument || t),
            (r = Gf(r)),
            (i = wf.get(i)) && V(r, i),
            (a = a.createElement(`link`)),
            Ct(a));
          var o = a;
          ((o._p = new Promise(function (e, t) {
            ((o.onload = e), (o.onerror = t));
          })),
            Wd(a, `link`, r),
            (n.instance = a));
        }
        (e.stylesheets === null && (e.stylesheets = new Map()),
          e.stylesheets.set(n, t),
          (t = n.state.preload) &&
            !(n.state.loading & 3) &&
            (e.count++,
            (n = op.bind(e)),
            t.addEventListener(`load`, n),
            t.addEventListener(`error`, n)));
      }
    }
    var ip = 0;
    function ap(e, t) {
      return (
        e.stylesheets && e.count === 0 && cp(e, e.stylesheets),
        0 < e.count || 0 < e.imgCount
          ? function (n) {
              var r = setTimeout(function () {
                if ((e.stylesheets && cp(e, e.stylesheets), e.unsuspend)) {
                  var t = e.unsuspend;
                  ((e.unsuspend = null), t());
                }
              }, 6e4 + t);
              0 < e.imgBytes && ip === 0 && (ip = 62500 * qd());
              var i = setTimeout(
                function () {
                  if (
                    ((e.waitingForImages = !1),
                    e.count === 0 && (e.stylesheets && cp(e, e.stylesheets), e.unsuspend))
                  ) {
                    var t = e.unsuspend;
                    ((e.unsuspend = null), t());
                  }
                },
                (e.imgBytes > ip ? 50 : 800) + t,
              );
              return (
                (e.unsuspend = n),
                function () {
                  ((e.unsuspend = null), clearTimeout(r), clearTimeout(i));
                }
              );
            }
          : null
      );
    }
    function op() {
      if ((this.count--, this.count === 0 && (this.imgCount === 0 || !this.waitingForImages))) {
        if (this.stylesheets) cp(this, this.stylesheets);
        else if (this.unsuspend) {
          var e = this.unsuspend;
          ((this.unsuspend = null), e());
        }
      }
    }
    var sp = null;
    function cp(e, t) {
      ((e.stylesheets = null),
        e.unsuspend !== null &&
          (e.count++, (sp = new Map()), t.forEach(lp, e), (sp = null), op.call(e)));
    }
    function lp(e, t) {
      if (!(t.state.loading & 4)) {
        var n = sp.get(e);
        if (n) var r = n.get(null);
        else {
          ((n = new Map()), sp.set(e, n));
          for (
            var i = e.querySelectorAll(`link[data-precedence],style[data-precedence]`), a = 0;
            a < i.length;
            a++
          ) {
            var o = i[a];
            (o.nodeName === `LINK` || o.getAttribute(`media`) !== `not all`) &&
              (n.set(o.dataset.precedence, o), (r = o));
          }
          r && n.set(null, r);
        }
        ((i = t.instance),
          (o = i.getAttribute(`data-precedence`)),
          (a = n.get(o) || r),
          a === r && n.set(null, i),
          n.set(o, i),
          this.count++,
          (r = op.bind(this)),
          i.addEventListener(`load`, r),
          i.addEventListener(`error`, r),
          a
            ? a.parentNode.insertBefore(i, a.nextSibling)
            : ((e = e.nodeType === 9 ? e.head : e), e.insertBefore(i, e.firstChild)),
          (t.state.loading |= 4));
      }
    }
    var up = {
      $$typeof: b,
      Provider: null,
      Consumer: null,
      _currentValue: D,
      _currentValue2: D,
      _threadCount: 0,
    };
    function dp(e, t, n, r, i, a, o, s, c) {
      ((this.tag = 1),
        (this.containerInfo = e),
        (this.pingCache = this.current = this.pendingChildren = null),
        (this.timeoutHandle = -1),
        (this.callbackNode =
          this.next =
          this.pendingContext =
          this.context =
          this.cancelPendingCommit =
            null),
        (this.callbackPriority = 0),
        (this.expirationTimes = $e(-1)),
        (this.entangledLanes =
          this.shellSuspendCounter =
          this.errorRecoveryDisabledLanes =
          this.expiredLanes =
          this.warmLanes =
          this.pingedLanes =
          this.suspendedLanes =
          this.pendingLanes =
            0),
        (this.entanglements = $e(0)),
        (this.hiddenUpdates = $e(null)),
        (this.identifierPrefix = r),
        (this.onUncaughtError = i),
        (this.onCaughtError = a),
        (this.onRecoverableError = o),
        (this.pooledCache = null),
        (this.pooledCacheLanes = 0),
        (this.formState = c),
        (this.incompleteTransitions = new Map()));
    }
    function H(e, t, n, r, i, a, o, s, c, l, u, d) {
      return (
        (e = new dp(e, t, n, o, c, l, u, d, s)),
        (t = 1),
        !0 === a && (t |= 24),
        (a = di(3, null, null, t)),
        (e.current = a),
        (a.stateNode = e),
        (t = da()),
        t.refCount++,
        (e.pooledCache = t),
        t.refCount++,
        (a.memoizedState = { element: r, isDehydrated: n, cache: t }),
        Wa(a),
        e
      );
    }
    function fp(e) {
      return e ? ((e = li), e) : li;
    }
    function pp(e, t, n, r, i, a) {
      ((i = fp(i)),
        r.context === null ? (r.context = i) : (r.pendingContext = i),
        (r = Ka(t)),
        (r.payload = { element: n }),
        (a = a === void 0 ? null : a),
        a !== null && (r.callback = a),
        (n = qa(e, r, t)),
        n !== null && (wu(n, e, t), Ja(n, e, t)));
    }
    function mp(e, t) {
      if (((e = e.memoizedState), e !== null && e.dehydrated !== null)) {
        var n = e.retryLane;
        e.retryLane = n !== 0 && n < t ? n : t;
      }
    }
    function hp(e, t) {
      (mp(e, t), (e = e.alternate) && mp(e, t));
    }
    function gp(e) {
      if (e.tag === 13 || e.tag === 31) {
        var t = oi(e, 67108864);
        (t !== null && wu(t, e, 67108864), hp(e, 67108864));
      }
    }
    function _p(e) {
      if (e.tag === 13 || e.tag === 31) {
        var t = Su();
        t = at(t);
        var n = oi(e, t);
        (n !== null && wu(n, e, t), hp(e, t));
      }
    }
    var vp = !0;
    function yp(e, t, n, r) {
      var i = T.T;
      T.T = null;
      var a = E.p;
      try {
        ((E.p = 2), xp(e, t, n, r));
      } finally {
        ((E.p = a), (T.T = i));
      }
    }
    function bp(e, t, n, r) {
      var i = T.T;
      T.T = null;
      var a = E.p;
      try {
        ((E.p = 8), xp(e, t, n, r));
      } finally {
        ((E.p = a), (T.T = i));
      }
    }
    function xp(e, t, n, r) {
      if (vp) {
        var i = Sp(r);
        if (i === null) (Nd(e, t, r, Cp, n), Pp(e, r));
        else if (Ip(i, e, t, n, r)) r.stopPropagation();
        else if ((Pp(e, r), t & 4 && -1 < Np.indexOf(e))) {
          for (; i !== null;) {
            var a = bt(i);
            if (a !== null)
              switch (a.tag) {
                case 3:
                  if (((a = a.stateNode), a.current.memoizedState.isDehydrated)) {
                    var o = Je(a.pendingLanes);
                    if (o !== 0) {
                      var s = a;
                      for (s.pendingLanes |= 2, s.entangledLanes |= 2; o;) {
                        var c = 1 << (31 - Ve(o));
                        ((s.entanglements[1] |= c), (o &= ~c));
                      }
                      (fd(a), !(I & 6) && ((uu = j() + 500), pd(0, !1)));
                    }
                  }
                  break;
                case 31:
                case 13:
                  ((s = oi(a, 2)), s !== null && wu(s, a, 2), ku(), hp(a, 2));
              }
            if (((a = Sp(r)), a === null && Nd(e, t, r, Cp, n), a === i)) break;
            i = a;
          }
          i !== null && r.stopPropagation();
        } else Nd(e, t, r, null, n);
      }
    }
    function Sp(e) {
      return ((e = an(e)), wp(e));
    }
    var Cp = null;
    function wp(e) {
      if (((Cp = null), (e = yt(e)), e !== null)) {
        var t = o(e);
        if (t === null) e = null;
        else {
          var n = t.tag;
          if (n === 13) {
            if (((e = s(t)), e !== null)) return e;
            e = null;
          } else if (n === 31) {
            if (((e = c(t)), e !== null)) return e;
            e = null;
          } else if (n === 3) {
            if (t.stateNode.current.memoizedState.isDehydrated)
              return t.tag === 3 ? t.stateNode.containerInfo : null;
            e = null;
          } else t !== e && (e = null);
        }
      }
      return ((Cp = e), null);
    }
    function Tp(e) {
      switch (e) {
        case `beforetoggle`:
        case `cancel`:
        case `click`:
        case `close`:
        case `contextmenu`:
        case `copy`:
        case `cut`:
        case `auxclick`:
        case `dblclick`:
        case `dragend`:
        case `dragstart`:
        case `drop`:
        case `focusin`:
        case `focusout`:
        case `input`:
        case `invalid`:
        case `keydown`:
        case `keypress`:
        case `keyup`:
        case `mousedown`:
        case `mouseup`:
        case `paste`:
        case `pause`:
        case `play`:
        case `pointercancel`:
        case `pointerdown`:
        case `pointerup`:
        case `ratechange`:
        case `reset`:
        case `resize`:
        case `seeked`:
        case `submit`:
        case `toggle`:
        case `touchcancel`:
        case `touchend`:
        case `touchstart`:
        case `volumechange`:
        case `change`:
        case `selectionchange`:
        case `textInput`:
        case `compositionstart`:
        case `compositionend`:
        case `compositionupdate`:
        case `beforeblur`:
        case `afterblur`:
        case `beforeinput`:
        case `blur`:
        case `fullscreenchange`:
        case `focus`:
        case `hashchange`:
        case `popstate`:
        case `select`:
        case `selectstart`:
          return 2;
        case `drag`:
        case `dragenter`:
        case `dragexit`:
        case `dragleave`:
        case `dragover`:
        case `mousemove`:
        case `mouseout`:
        case `mouseover`:
        case `pointermove`:
        case `pointerout`:
        case `pointerover`:
        case `scroll`:
        case `touchmove`:
        case `wheel`:
        case `mouseenter`:
        case `mouseleave`:
        case `pointerenter`:
        case `pointerleave`:
          return 8;
        case `message`:
          switch (Ae()) {
            case je:
              return 2;
            case Me:
              return 8;
            case Ne:
            case Pe:
              return 32;
            case Fe:
              return 268435456;
            default:
              return 32;
          }
        default:
          return 32;
      }
    }
    var Ep = !1,
      Dp = null,
      Op = null,
      kp = null,
      Ap = new Map(),
      jp = new Map(),
      Mp = [],
      Np =
        `mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset`.split(
          ` `,
        );
    function Pp(e, t) {
      switch (e) {
        case `focusin`:
        case `focusout`:
          Dp = null;
          break;
        case `dragenter`:
        case `dragleave`:
          Op = null;
          break;
        case `mouseover`:
        case `mouseout`:
          kp = null;
          break;
        case `pointerover`:
        case `pointerout`:
          Ap.delete(t.pointerId);
          break;
        case `gotpointercapture`:
        case `lostpointercapture`:
          jp.delete(t.pointerId);
      }
    }
    function Fp(e, t, n, r, i, a) {
      return e === null || e.nativeEvent !== a
        ? ((e = {
            blockedOn: t,
            domEventName: n,
            eventSystemFlags: r,
            nativeEvent: a,
            targetContainers: [i],
          }),
          t !== null && ((t = bt(t)), t !== null && gp(t)),
          e)
        : ((e.eventSystemFlags |= r),
          (t = e.targetContainers),
          i !== null && t.indexOf(i) === -1 && t.push(i),
          e);
    }
    function Ip(e, t, n, r, i) {
      switch (t) {
        case `focusin`:
          return ((Dp = Fp(Dp, e, t, n, r, i)), !0);
        case `dragenter`:
          return ((Op = Fp(Op, e, t, n, r, i)), !0);
        case `mouseover`:
          return ((kp = Fp(kp, e, t, n, r, i)), !0);
        case `pointerover`:
          var a = i.pointerId;
          return (Ap.set(a, Fp(Ap.get(a) || null, e, t, n, r, i)), !0);
        case `gotpointercapture`:
          return ((a = i.pointerId), jp.set(a, Fp(jp.get(a) || null, e, t, n, r, i)), !0);
      }
      return !1;
    }
    function Lp(e) {
      var t = yt(e.target);
      if (t !== null) {
        var n = o(t);
        if (n !== null) {
          if (((t = n.tag), t === 13)) {
            if (((t = s(n)), t !== null)) {
              ((e.blockedOn = t),
                ct(e.priority, function () {
                  _p(n);
                }));
              return;
            }
          } else if (t === 31) {
            if (((t = c(n)), t !== null)) {
              ((e.blockedOn = t),
                ct(e.priority, function () {
                  _p(n);
                }));
              return;
            }
          } else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
            e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
            return;
          }
        }
      }
      e.blockedOn = null;
    }
    function Rp(e) {
      if (e.blockedOn !== null) return !1;
      for (var t = e.targetContainers; 0 < t.length;) {
        var n = Sp(e.nativeEvent);
        if (n === null) {
          n = e.nativeEvent;
          var r = new n.constructor(n.type, n);
          ((rn = r), n.target.dispatchEvent(r), (rn = null));
        } else return ((t = bt(n)), t !== null && gp(t), (e.blockedOn = n), !1);
        t.shift();
      }
      return !0;
    }
    function zp(e, t, n) {
      Rp(e) && n.delete(t);
    }
    function Bp() {
      ((Ep = !1),
        Dp !== null && Rp(Dp) && (Dp = null),
        Op !== null && Rp(Op) && (Op = null),
        kp !== null && Rp(kp) && (kp = null),
        Ap.forEach(zp),
        jp.forEach(zp));
    }
    function Vp(e, n) {
      e.blockedOn === n &&
        ((e.blockedOn = null),
        Ep || ((Ep = !0), t.unstable_scheduleCallback(t.unstable_NormalPriority, Bp)));
    }
    var Hp = null;
    function Up(e) {
      Hp !== e &&
        ((Hp = e),
        t.unstable_scheduleCallback(t.unstable_NormalPriority, function () {
          Hp === e && (Hp = null);
          for (var t = 0; t < e.length; t += 3) {
            var n = e[t],
              r = e[t + 1],
              i = e[t + 2];
            if (typeof r != `function`) {
              if (wp(r || n) === null) continue;
              break;
            }
            var a = bt(n);
            a !== null &&
              (e.splice(t, 3),
              (t -= 3),
              As(a, { pending: !0, data: i, method: n.method, action: r }, r, i));
          }
        }));
    }
    function Wp(e) {
      function t(t) {
        return Vp(t, e);
      }
      (Dp !== null && Vp(Dp, e),
        Op !== null && Vp(Op, e),
        kp !== null && Vp(kp, e),
        Ap.forEach(t),
        jp.forEach(t));
      for (var n = 0; n < Mp.length; n++) {
        var r = Mp[n];
        r.blockedOn === e && (r.blockedOn = null);
      }
      for (; 0 < Mp.length && ((n = Mp[0]), n.blockedOn === null);)
        (Lp(n), n.blockedOn === null && Mp.shift());
      if (((n = (e.ownerDocument || e).$$reactFormReplay), n != null))
        for (r = 0; r < n.length; r += 3) {
          var i = n[r],
            a = n[r + 1],
            o = i[dt] || null;
          if (typeof a == `function`) o || Up(n);
          else if (o) {
            var s = null;
            if (a && a.hasAttribute(`formAction`)) {
              if (((i = a), (o = a[dt] || null))) s = o.formAction;
              else if (wp(i) !== null) continue;
            } else s = o.action;
            (typeof s == `function` ? (n[r + 1] = s) : (n.splice(r, 3), (r -= 3)), Up(n));
          }
        }
    }
    function Gp() {
      function e(e) {
        e.canIntercept &&
          e.info === `react-transition` &&
          e.intercept({
            handler: function () {
              return new Promise(function (e) {
                return (i = e);
              });
            },
            focusReset: `manual`,
            scroll: `manual`,
          });
      }
      function t() {
        (i !== null && (i(), (i = null)), r || setTimeout(n, 20));
      }
      function n() {
        if (!r && !navigation.transition) {
          var e = navigation.currentEntry;
          e &&
            e.url != null &&
            navigation.navigate(e.url, {
              state: e.getState(),
              info: `react-transition`,
              history: `replace`,
            });
        }
      }
      if (typeof navigation == `object`) {
        var r = !1,
          i = null;
        return (
          navigation.addEventListener(`navigate`, e),
          navigation.addEventListener(`navigatesuccess`, t),
          navigation.addEventListener(`navigateerror`, t),
          setTimeout(n, 100),
          function () {
            ((r = !0),
              navigation.removeEventListener(`navigate`, e),
              navigation.removeEventListener(`navigatesuccess`, t),
              navigation.removeEventListener(`navigateerror`, t),
              i !== null && (i(), (i = null)));
          }
        );
      }
    }
    function Kp(e) {
      this._internalRoot = e;
    }
    ((qp.prototype.render = Kp.prototype.render =
      function (e) {
        var t = this._internalRoot;
        if (t === null) throw Error(i(409));
        var n = t.current;
        pp(n, Su(), e, t, null, null);
      }),
      (qp.prototype.unmount = Kp.prototype.unmount =
        function () {
          var e = this._internalRoot;
          if (e !== null) {
            this._internalRoot = null;
            var t = e.containerInfo;
            (pp(e.current, 2, null, e, null, null), ku(), (t[ft] = null));
          }
        }));
    function qp(e) {
      this._internalRoot = e;
    }
    qp.prototype.unstable_scheduleHydration = function (e) {
      if (e) {
        var t = st();
        e = { blockedOn: null, target: e, priority: t };
        for (var n = 0; n < Mp.length && t !== 0 && t < Mp[n].priority; n++);
        (Mp.splice(n, 0, e), n === 0 && Lp(e));
      }
    };
    var Jp = n.version;
    if (Jp !== `19.2.7`) throw Error(i(527, Jp, `19.2.7`));
    E.findDOMNode = function (e) {
      var t = e._reactInternals;
      if (t === void 0)
        throw typeof e.render == `function`
          ? Error(i(188))
          : ((e = Object.keys(e).join(`,`)), Error(i(268, e)));
      return ((e = u(t)), (e = e === null ? null : d(e)), (e = e === null ? null : e.stateNode), e);
    };
    var Yp = {
      bundleType: 0,
      version: `19.2.7`,
      rendererPackageName: `react-dom`,
      currentDispatcherRef: T,
      reconcilerVersion: `19.2.7`,
    };
    if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < `u`) {
      var Xp = __REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (!Xp.isDisabled && Xp.supportsFiber)
        try {
          ((Re = Xp.inject(Yp)), (ze = Xp));
        } catch {}
    }
    e.createRoot = function (e, t) {
      if (!a(e)) throw Error(i(299));
      var n = !1,
        r = ``,
        o = $s,
        s = ec,
        c = tc;
      return (
        t != null &&
          (!0 === t.unstable_strictMode && (n = !0),
          t.identifierPrefix !== void 0 && (r = t.identifierPrefix),
          t.onUncaughtError !== void 0 && (o = t.onUncaughtError),
          t.onCaughtError !== void 0 && (s = t.onCaughtError),
          t.onRecoverableError !== void 0 && (c = t.onRecoverableError)),
        (t = H(e, 1, !1, null, null, n, r, null, o, s, c, Gp)),
        (e[ft] = t.current),
        jd(e),
        new Kp(t)
      );
    };
  }),
  Kf = s((e, t) => {
    function n() {
      if (!(
        typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > `u` ||
        typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != `function`
      ))
        try {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
        } catch (e) {
          console.error(e);
        }
    }
    (n(), (t.exports = Gf()));
  });
function qf(e, t) {
  if (typeof t != `function` && t !== null)
    throw TypeError(`Class extends value ` + String(t) + ` is not a constructor or null`);
  Xf(e, t);
  function n() {
    this.constructor = e;
  }
  e.prototype = t === null ? Object.create(t) : ((n.prototype = t.prototype), new n());
}
function Jf(e, t) {
  var n = {};
  for (var r in e) Object.prototype.hasOwnProperty.call(e, r) && t.indexOf(r) < 0 && (n[r] = e[r]);
  if (e != null && typeof Object.getOwnPropertySymbols == `function`)
    for (var i = 0, r = Object.getOwnPropertySymbols(e); i < r.length; i++)
      t.indexOf(r[i]) < 0 &&
        Object.prototype.propertyIsEnumerable.call(e, r[i]) &&
        (n[r[i]] = e[r[i]]);
  return n;
}
function Yf(e, t, n) {
  if (n || arguments.length === 2)
    for (var r = 0, i = t.length, a; r < i; r++)
      (a || !(r in t)) && ((a ||= Array.prototype.slice.call(t, 0, r)), (a[r] = t[r]));
  return e.concat(a || Array.prototype.slice.call(t));
}
var Xf,
  V,
  Zf = o(() => {
    ((Xf = function (e, t) {
      return (
        (Xf =
          Object.setPrototypeOf ||
          ({ __proto__: [] } instanceof Array &&
            function (e, t) {
              e.__proto__ = t;
            }) ||
          function (e, t) {
            for (var n in t) Object.prototype.hasOwnProperty.call(t, n) && (e[n] = t[n]);
          }),
        Xf(e, t)
      );
    }),
      (V = function () {
        return (
          (V =
            Object.assign ||
            function (e) {
              for (var t, n = 1, r = arguments.length; n < r; n++)
                for (var i in ((t = arguments[n]), t))
                  Object.prototype.hasOwnProperty.call(t, i) && (e[i] = t[i]);
              return e;
            }),
          V.apply(this, arguments)
        );
      }));
  }),
  Qf = o(() => {});
function $f(e, t) {
  var n = t && t.cache ? t.cache : lp,
    r = t && t.serializer ? t.serializer : sp;
  return (t && t.strategy ? t.strategy : ip)(e, { cache: n, serializer: r });
}
function ep(e) {
  return e == null || typeof e == `number` || typeof e == `boolean`;
}
function tp(e, t, n, r) {
  var i = ep(r) ? r : n(r),
    a = t.get(i);
  return (a === void 0 && ((a = e.call(this, r)), t.set(i, a)), a);
}
function np(e, t, n) {
  var r = Array.prototype.slice.call(arguments, 3),
    i = n(r),
    a = t.get(i);
  return (a === void 0 && ((a = e.apply(this, r)), t.set(i, a)), a);
}
function rp(e, t, n, r, i) {
  return n.bind(t, e, r, i);
}
function ip(e, t) {
  var n = e.length === 1 ? tp : np;
  return rp(e, this, n, t.cache.create(), t.serializer);
}
function ap(e, t) {
  return rp(e, this, np, t.cache.create(), t.serializer);
}
function op(e, t) {
  return rp(e, this, tp, t.cache.create(), t.serializer);
}
var sp,
  cp,
  lp,
  up,
  dp = o(() => {
    ((sp = function () {
      return JSON.stringify(arguments);
    }),
      (cp = (function () {
        function e() {
          this.cache = Object.create(null);
        }
        return (
          (e.prototype.get = function (e) {
            return this.cache[e];
          }),
          (e.prototype.set = function (e, t) {
            this.cache[e] = t;
          }),
          e
        );
      })()),
      (lp = {
        create: function () {
          return new cp();
        },
      }),
      (up = { variadic: ap, monadic: op }));
  }),
  H,
  fp = o(() => {
    (function (e) {
      ((e[(e.EXPECT_ARGUMENT_CLOSING_BRACE = 1)] = `EXPECT_ARGUMENT_CLOSING_BRACE`),
        (e[(e.EMPTY_ARGUMENT = 2)] = `EMPTY_ARGUMENT`),
        (e[(e.MALFORMED_ARGUMENT = 3)] = `MALFORMED_ARGUMENT`),
        (e[(e.EXPECT_ARGUMENT_TYPE = 4)] = `EXPECT_ARGUMENT_TYPE`),
        (e[(e.INVALID_ARGUMENT_TYPE = 5)] = `INVALID_ARGUMENT_TYPE`),
        (e[(e.EXPECT_ARGUMENT_STYLE = 6)] = `EXPECT_ARGUMENT_STYLE`),
        (e[(e.INVALID_NUMBER_SKELETON = 7)] = `INVALID_NUMBER_SKELETON`),
        (e[(e.INVALID_DATE_TIME_SKELETON = 8)] = `INVALID_DATE_TIME_SKELETON`),
        (e[(e.EXPECT_NUMBER_SKELETON = 9)] = `EXPECT_NUMBER_SKELETON`),
        (e[(e.EXPECT_DATE_TIME_SKELETON = 10)] = `EXPECT_DATE_TIME_SKELETON`),
        (e[(e.UNCLOSED_QUOTE_IN_ARGUMENT_STYLE = 11)] = `UNCLOSED_QUOTE_IN_ARGUMENT_STYLE`),
        (e[(e.EXPECT_SELECT_ARGUMENT_OPTIONS = 12)] = `EXPECT_SELECT_ARGUMENT_OPTIONS`),
        (e[(e.EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE = 13)] = `EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE`),
        (e[(e.INVALID_PLURAL_ARGUMENT_OFFSET_VALUE = 14)] = `INVALID_PLURAL_ARGUMENT_OFFSET_VALUE`),
        (e[(e.EXPECT_SELECT_ARGUMENT_SELECTOR = 15)] = `EXPECT_SELECT_ARGUMENT_SELECTOR`),
        (e[(e.EXPECT_PLURAL_ARGUMENT_SELECTOR = 16)] = `EXPECT_PLURAL_ARGUMENT_SELECTOR`),
        (e[(e.EXPECT_SELECT_ARGUMENT_SELECTOR_FRAGMENT = 17)] =
          `EXPECT_SELECT_ARGUMENT_SELECTOR_FRAGMENT`),
        (e[(e.EXPECT_PLURAL_ARGUMENT_SELECTOR_FRAGMENT = 18)] =
          `EXPECT_PLURAL_ARGUMENT_SELECTOR_FRAGMENT`),
        (e[(e.INVALID_PLURAL_ARGUMENT_SELECTOR = 19)] = `INVALID_PLURAL_ARGUMENT_SELECTOR`),
        (e[(e.DUPLICATE_PLURAL_ARGUMENT_SELECTOR = 20)] = `DUPLICATE_PLURAL_ARGUMENT_SELECTOR`),
        (e[(e.DUPLICATE_SELECT_ARGUMENT_SELECTOR = 21)] = `DUPLICATE_SELECT_ARGUMENT_SELECTOR`),
        (e[(e.MISSING_OTHER_CLAUSE = 22)] = `MISSING_OTHER_CLAUSE`),
        (e[(e.INVALID_TAG = 23)] = `INVALID_TAG`),
        (e[(e.INVALID_TAG_NAME = 25)] = `INVALID_TAG_NAME`),
        (e[(e.UNMATCHED_CLOSING_TAG = 26)] = `UNMATCHED_CLOSING_TAG`),
        (e[(e.UNCLOSED_TAG = 27)] = `UNCLOSED_TAG`));
    })((H ||= {}));
  });
function pp(e) {
  return e.type === wp.literal;
}
function mp(e) {
  return e.type === wp.argument;
}
function hp(e) {
  return e.type === wp.number;
}
function gp(e) {
  return e.type === wp.date;
}
function _p(e) {
  return e.type === wp.time;
}
function vp(e) {
  return e.type === wp.select;
}
function yp(e) {
  return e.type === wp.plural;
}
function bp(e) {
  return e.type === wp.pound;
}
function xp(e) {
  return e.type === wp.tag;
}
function Sp(e) {
  return !!(e && typeof e == `object` && e.type === Tp.number);
}
function Cp(e) {
  return !!(e && typeof e == `object` && e.type === Tp.dateTime);
}
var wp,
  Tp,
  Ep = o(() => {
    ((function (e) {
      ((e[(e.literal = 0)] = `literal`),
        (e[(e.argument = 1)] = `argument`),
        (e[(e.number = 2)] = `number`),
        (e[(e.date = 3)] = `date`),
        (e[(e.time = 4)] = `time`),
        (e[(e.select = 5)] = `select`),
        (e[(e.plural = 6)] = `plural`),
        (e[(e.pound = 7)] = `pound`),
        (e[(e.tag = 8)] = `tag`));
    })((wp ||= {})),
      (function (e) {
        ((e[(e.number = 0)] = `number`), (e[(e.dateTime = 1)] = `dateTime`));
      })((Tp ||= {})));
  }),
  Dp,
  Op = o(() => {
    Dp = /[ \xA0\u1680\u2000-\u200A\u202F\u205F\u3000]/;
  });
function kp(e) {
  var t = {};
  return (
    e.replace(Ap, function (e) {
      var n = e.length;
      switch (e[0]) {
        case `G`:
          t.era = n === 4 ? `long` : n === 5 ? `narrow` : `short`;
          break;
        case `y`:
          t.year = n === 2 ? `2-digit` : `numeric`;
          break;
        case `Y`:
        case `u`:
        case `U`:
        case `r`:
          throw RangeError("`Y/u/U/r` (year) patterns are not supported, use `y` instead");
        case `q`:
        case `Q`:
          throw RangeError("`q/Q` (quarter) patterns are not supported");
        case `M`:
        case `L`:
          t.month = [`numeric`, `2-digit`, `short`, `long`, `narrow`][n - 1];
          break;
        case `w`:
        case `W`:
          throw RangeError("`w/W` (week) patterns are not supported");
        case `d`:
          t.day = [`numeric`, `2-digit`][n - 1];
          break;
        case `D`:
        case `F`:
        case `g`:
          throw RangeError("`D/F/g` (day) patterns are not supported, use `d` instead");
        case `E`:
          t.weekday = n === 4 ? `long` : n === 5 ? `narrow` : `short`;
          break;
        case `e`:
          if (n < 4) throw RangeError("`e..eee` (weekday) patterns are not supported");
          t.weekday = [`short`, `long`, `narrow`, `short`][n - 4];
          break;
        case `c`:
          if (n < 4) throw RangeError("`c..ccc` (weekday) patterns are not supported");
          t.weekday = [`short`, `long`, `narrow`, `short`][n - 4];
          break;
        case `a`:
          t.hour12 = !0;
          break;
        case `b`:
        case `B`:
          throw RangeError("`b/B` (period) patterns are not supported, use `a` instead");
        case `h`:
          ((t.hourCycle = `h12`), (t.hour = [`numeric`, `2-digit`][n - 1]));
          break;
        case `H`:
          ((t.hourCycle = `h23`), (t.hour = [`numeric`, `2-digit`][n - 1]));
          break;
        case `K`:
          ((t.hourCycle = `h11`), (t.hour = [`numeric`, `2-digit`][n - 1]));
          break;
        case `k`:
          ((t.hourCycle = `h24`), (t.hour = [`numeric`, `2-digit`][n - 1]));
          break;
        case `j`:
        case `J`:
        case `C`:
          throw RangeError("`j/J/C` (hour) patterns are not supported, use `h/H/K/k` instead");
        case `m`:
          t.minute = [`numeric`, `2-digit`][n - 1];
          break;
        case `s`:
          t.second = [`numeric`, `2-digit`][n - 1];
          break;
        case `S`:
        case `A`:
          throw RangeError("`S/A` (second) patterns are not supported, use `s` instead");
        case `z`:
          t.timeZoneName = n < 4 ? `short` : `long`;
          break;
        case `Z`:
        case `O`:
        case `v`:
        case `V`:
        case `X`:
        case `x`:
          throw RangeError("`Z/O/v/V/X/x` (timeZone) patterns are not supported, use `z` instead");
      }
      return ``;
    }),
    t
  );
}
var Ap,
  jp = o(() => {
    Ap =
      /(?:[Eec]{1,6}|G{1,5}|[Qq]{1,5}|(?:[yYur]+|U{1,5})|[ML]{1,5}|d{1,2}|D{1,3}|F{1}|[abB]{1,5}|[hkHK]{1,2}|w{1,2}|W{1}|m{1,2}|s{1,2}|[zZOvVxX]{1,4})(?=([^']*'[^']*')*[^']*$)/g;
  }),
  Mp,
  Np = o(() => {
    Mp = /[\t-\r \x85\u200E\u200F\u2028\u2029]/i;
  });
function Pp(e) {
  if (e.length === 0) throw Error(`Number skeleton cannot be empty`);
  for (
    var t = e.split(Mp).filter(function (e) {
        return e.length > 0;
      }),
      n = [],
      r = 0,
      i = t;
    r < i.length;
    r++
  ) {
    var a = i[r].split(`/`);
    if (a.length === 0) throw Error(`Invalid number skeleton`);
    for (var o = a[0], s = a.slice(1), c = 0, l = s; c < l.length; c++)
      if (l[c].length === 0) throw Error(`Invalid number skeleton`);
    n.push({ stem: o, options: s });
  }
  return n;
}
function Fp(e) {
  return e.replace(/^(.*?)-/, ``);
}
function Ip(e) {
  var t = {};
  return (
    e[e.length - 1] === `r`
      ? (t.roundingPriority = `morePrecision`)
      : e[e.length - 1] === `s` && (t.roundingPriority = `lessPrecision`),
    e.replace(Hp, function (e, n, r) {
      return (
        typeof r == `string`
          ? r === `+`
            ? (t.minimumSignificantDigits = n.length)
            : n[0] === `#`
              ? (t.maximumSignificantDigits = n.length)
              : ((t.minimumSignificantDigits = n.length),
                (t.maximumSignificantDigits = n.length + (typeof r == `string` ? r.length : 0)))
          : ((t.minimumSignificantDigits = n.length), (t.maximumSignificantDigits = n.length)),
        ``
      );
    }),
    t
  );
}
function Lp(e) {
  switch (e) {
    case `sign-auto`:
      return { signDisplay: `auto` };
    case `sign-accounting`:
    case `()`:
      return { currencySign: `accounting` };
    case `sign-always`:
    case `+!`:
      return { signDisplay: `always` };
    case `sign-accounting-always`:
    case `()!`:
      return { signDisplay: `always`, currencySign: `accounting` };
    case `sign-except-zero`:
    case `+?`:
      return { signDisplay: `exceptZero` };
    case `sign-accounting-except-zero`:
    case `()?`:
      return { signDisplay: `exceptZero`, currencySign: `accounting` };
    case `sign-never`:
    case `+_`:
      return { signDisplay: `never` };
  }
}
function Rp(e) {
  var t;
  if (
    (e[0] === `E` && e[1] === `E`
      ? ((t = { notation: `engineering` }), (e = e.slice(2)))
      : e[0] === `E` && ((t = { notation: `scientific` }), (e = e.slice(1))),
    t)
  ) {
    var n = e.slice(0, 2);
    if (
      (n === `+!`
        ? ((t.signDisplay = `always`), (e = e.slice(2)))
        : n === `+?` && ((t.signDisplay = `exceptZero`), (e = e.slice(2))),
      !Wp.test(e))
    )
      throw Error(`Malformed concise eng/scientific notation`);
    t.minimumIntegerDigits = e.length;
  }
  return t;
}
function zp(e) {
  return Lp(e) || {};
}
function Bp(e) {
  for (var t = {}, n = 0, r = e; n < r.length; n++) {
    var i = r[n];
    switch (i.stem) {
      case `percent`:
      case `%`:
        t.style = `percent`;
        continue;
      case `%x100`:
        ((t.style = `percent`), (t.scale = 100));
        continue;
      case `currency`:
        ((t.style = `currency`), (t.currency = i.options[0]));
        continue;
      case `group-off`:
      case `,_`:
        t.useGrouping = !1;
        continue;
      case `precision-integer`:
      case `.`:
        t.maximumFractionDigits = 0;
        continue;
      case `measure-unit`:
      case `unit`:
        ((t.style = `unit`), (t.unit = Fp(i.options[0])));
        continue;
      case `compact-short`:
      case `K`:
        ((t.notation = `compact`), (t.compactDisplay = `short`));
        continue;
      case `compact-long`:
      case `KK`:
        ((t.notation = `compact`), (t.compactDisplay = `long`));
        continue;
      case `scientific`:
        t = V(
          V(V({}, t), { notation: `scientific` }),
          i.options.reduce(function (e, t) {
            return V(V({}, e), zp(t));
          }, {}),
        );
        continue;
      case `engineering`:
        t = V(
          V(V({}, t), { notation: `engineering` }),
          i.options.reduce(function (e, t) {
            return V(V({}, e), zp(t));
          }, {}),
        );
        continue;
      case `notation-simple`:
        t.notation = `standard`;
        continue;
      case `unit-width-narrow`:
        ((t.currencyDisplay = `narrowSymbol`), (t.unitDisplay = `narrow`));
        continue;
      case `unit-width-short`:
        ((t.currencyDisplay = `code`), (t.unitDisplay = `short`));
        continue;
      case `unit-width-full-name`:
        ((t.currencyDisplay = `name`), (t.unitDisplay = `long`));
        continue;
      case `unit-width-iso-code`:
        t.currencyDisplay = `symbol`;
        continue;
      case `scale`:
        t.scale = parseFloat(i.options[0]);
        continue;
      case `rounding-mode-floor`:
        t.roundingMode = `floor`;
        continue;
      case `rounding-mode-ceiling`:
        t.roundingMode = `ceil`;
        continue;
      case `rounding-mode-down`:
        t.roundingMode = `trunc`;
        continue;
      case `rounding-mode-up`:
        t.roundingMode = `expand`;
        continue;
      case `rounding-mode-half-even`:
        t.roundingMode = `halfEven`;
        continue;
      case `rounding-mode-half-down`:
        t.roundingMode = `halfTrunc`;
        continue;
      case `rounding-mode-half-up`:
        t.roundingMode = `halfExpand`;
        continue;
      case `integer-width`:
        if (i.options.length > 1)
          throw RangeError(`integer-width stems only accept a single optional option`);
        i.options[0].replace(Up, function (e, n, r, i, a, o) {
          if (n) t.minimumIntegerDigits = r.length;
          else if (i && a) throw Error(`We currently do not support maximum integer digits`);
          else if (o) throw Error(`We currently do not support exact integer digits`);
          return ``;
        });
        continue;
    }
    if (Wp.test(i.stem)) {
      t.minimumIntegerDigits = i.stem.length;
      continue;
    }
    if (Vp.test(i.stem)) {
      if (i.options.length > 1)
        throw RangeError(`Fraction-precision stems only accept a single optional option`);
      i.stem.replace(Vp, function (e, n, r, i, a, o) {
        return (
          r === `*`
            ? (t.minimumFractionDigits = n.length)
            : i && i[0] === `#`
              ? (t.maximumFractionDigits = i.length)
              : a && o
                ? ((t.minimumFractionDigits = a.length),
                  (t.maximumFractionDigits = a.length + o.length))
                : ((t.minimumFractionDigits = n.length), (t.maximumFractionDigits = n.length)),
          ``
        );
      });
      var a = i.options[0];
      a === `w`
        ? (t = V(V({}, t), { trailingZeroDisplay: `stripIfInteger` }))
        : a && (t = V(V({}, t), Ip(a)));
      continue;
    }
    if (Hp.test(i.stem)) {
      t = V(V({}, t), Ip(i.stem));
      continue;
    }
    var o = Lp(i.stem);
    o && (t = V(V({}, t), o));
    var s = Rp(i.stem);
    s && (t = V(V({}, t), s));
  }
  return t;
}
var Vp,
  Hp,
  Up,
  Wp,
  Gp = o(() => {
    (Zf(),
      Np(),
      (Vp = /^\.(?:(0+)(\*)?|(#+)|(0+)(#+))$/g),
      (Hp = /^(@+)?(\+|#+)?[rs]?$/g),
      (Up = /(\*)(0+)|(#+)(0+)|(0+)/g),
      (Wp = /^(0+)$/));
  }),
  Kp = o(() => {
    (jp(), Gp());
  }),
  qp,
  Jp = o(() => {
    qp = {
      "001": [`H`, `h`],
      419: [`h`, `H`, `hB`, `hb`],
      AC: [`H`, `h`, `hb`, `hB`],
      AD: [`H`, `hB`],
      AE: [`h`, `hB`, `hb`, `H`],
      AF: [`H`, `hb`, `hB`, `h`],
      AG: [`h`, `hb`, `H`, `hB`],
      AI: [`H`, `h`, `hb`, `hB`],
      AL: [`h`, `H`, `hB`],
      AM: [`H`, `hB`],
      AO: [`H`, `hB`],
      AR: [`h`, `H`, `hB`, `hb`],
      AS: [`h`, `H`],
      AT: [`H`, `hB`],
      AU: [`h`, `hb`, `H`, `hB`],
      AW: [`H`, `hB`],
      AX: [`H`],
      AZ: [`H`, `hB`, `h`],
      BA: [`H`, `hB`, `h`],
      BB: [`h`, `hb`, `H`, `hB`],
      BD: [`h`, `hB`, `H`],
      BE: [`H`, `hB`],
      BF: [`H`, `hB`],
      BG: [`H`, `hB`, `h`],
      BH: [`h`, `hB`, `hb`, `H`],
      BI: [`H`, `h`],
      BJ: [`H`, `hB`],
      BL: [`H`, `hB`],
      BM: [`h`, `hb`, `H`, `hB`],
      BN: [`hb`, `hB`, `h`, `H`],
      BO: [`h`, `H`, `hB`, `hb`],
      BQ: [`H`],
      BR: [`H`, `hB`],
      BS: [`h`, `hb`, `H`, `hB`],
      BT: [`h`, `H`],
      BW: [`H`, `h`, `hb`, `hB`],
      BY: [`H`, `h`],
      BZ: [`H`, `h`, `hb`, `hB`],
      CA: [`h`, `hb`, `H`, `hB`],
      CC: [`H`, `h`, `hb`, `hB`],
      CD: [`hB`, `H`],
      CF: [`H`, `h`, `hB`],
      CG: [`H`, `hB`],
      CH: [`H`, `hB`, `h`],
      CI: [`H`, `hB`],
      CK: [`H`, `h`, `hb`, `hB`],
      CL: [`h`, `H`, `hB`, `hb`],
      CM: [`H`, `h`, `hB`],
      CN: [`H`, `hB`, `hb`, `h`],
      CO: [`h`, `H`, `hB`, `hb`],
      CP: [`H`],
      CR: [`h`, `H`, `hB`, `hb`],
      CU: [`h`, `H`, `hB`, `hb`],
      CV: [`H`, `hB`],
      CW: [`H`, `hB`],
      CX: [`H`, `h`, `hb`, `hB`],
      CY: [`h`, `H`, `hb`, `hB`],
      CZ: [`H`],
      DE: [`H`, `hB`],
      DG: [`H`, `h`, `hb`, `hB`],
      DJ: [`h`, `H`],
      DK: [`H`],
      DM: [`h`, `hb`, `H`, `hB`],
      DO: [`h`, `H`, `hB`, `hb`],
      DZ: [`h`, `hB`, `hb`, `H`],
      EA: [`H`, `h`, `hB`, `hb`],
      EC: [`h`, `H`, `hB`, `hb`],
      EE: [`H`, `hB`],
      EG: [`h`, `hB`, `hb`, `H`],
      EH: [`h`, `hB`, `hb`, `H`],
      ER: [`h`, `H`],
      ES: [`H`, `hB`, `h`, `hb`],
      ET: [`hB`, `hb`, `h`, `H`],
      FI: [`H`],
      FJ: [`h`, `hb`, `H`, `hB`],
      FK: [`H`, `h`, `hb`, `hB`],
      FM: [`h`, `hb`, `H`, `hB`],
      FO: [`H`, `h`],
      FR: [`H`, `hB`],
      GA: [`H`, `hB`],
      GB: [`H`, `h`, `hb`, `hB`],
      GD: [`h`, `hb`, `H`, `hB`],
      GE: [`H`, `hB`, `h`],
      GF: [`H`, `hB`],
      GG: [`H`, `h`, `hb`, `hB`],
      GH: [`h`, `H`],
      GI: [`H`, `h`, `hb`, `hB`],
      GL: [`H`, `h`],
      GM: [`h`, `hb`, `H`, `hB`],
      GN: [`H`, `hB`],
      GP: [`H`, `hB`],
      GQ: [`H`, `hB`, `h`, `hb`],
      GR: [`h`, `H`, `hb`, `hB`],
      GT: [`h`, `H`, `hB`, `hb`],
      GU: [`h`, `hb`, `H`, `hB`],
      GW: [`H`, `hB`],
      GY: [`h`, `hb`, `H`, `hB`],
      HK: [`h`, `hB`, `hb`, `H`],
      HN: [`h`, `H`, `hB`, `hb`],
      HR: [`H`, `hB`],
      HU: [`H`, `h`],
      IC: [`H`, `h`, `hB`, `hb`],
      ID: [`H`],
      IE: [`H`, `h`, `hb`, `hB`],
      IL: [`H`, `hB`],
      IM: [`H`, `h`, `hb`, `hB`],
      IN: [`h`, `H`],
      IO: [`H`, `h`, `hb`, `hB`],
      IQ: [`h`, `hB`, `hb`, `H`],
      IR: [`hB`, `H`],
      IS: [`H`],
      IT: [`H`, `hB`],
      JE: [`H`, `h`, `hb`, `hB`],
      JM: [`h`, `hb`, `H`, `hB`],
      JO: [`h`, `hB`, `hb`, `H`],
      JP: [`H`, `K`, `h`],
      KE: [`hB`, `hb`, `H`, `h`],
      KG: [`H`, `h`, `hB`, `hb`],
      KH: [`hB`, `h`, `H`, `hb`],
      KI: [`h`, `hb`, `H`, `hB`],
      KM: [`H`, `h`, `hB`, `hb`],
      KN: [`h`, `hb`, `H`, `hB`],
      KP: [`h`, `H`, `hB`, `hb`],
      KR: [`h`, `H`, `hB`, `hb`],
      KW: [`h`, `hB`, `hb`, `H`],
      KY: [`h`, `hb`, `H`, `hB`],
      KZ: [`H`, `hB`],
      LA: [`H`, `hb`, `hB`, `h`],
      LB: [`h`, `hB`, `hb`, `H`],
      LC: [`h`, `hb`, `H`, `hB`],
      LI: [`H`, `hB`, `h`],
      LK: [`H`, `h`, `hB`, `hb`],
      LR: [`h`, `hb`, `H`, `hB`],
      LS: [`h`, `H`],
      LT: [`H`, `h`, `hb`, `hB`],
      LU: [`H`, `h`, `hB`],
      LV: [`H`, `hB`, `hb`, `h`],
      LY: [`h`, `hB`, `hb`, `H`],
      MA: [`H`, `h`, `hB`, `hb`],
      MC: [`H`, `hB`],
      MD: [`H`, `hB`],
      ME: [`H`, `hB`, `h`],
      MF: [`H`, `hB`],
      MG: [`H`, `h`],
      MH: [`h`, `hb`, `H`, `hB`],
      MK: [`H`, `h`, `hb`, `hB`],
      ML: [`H`],
      MM: [`hB`, `hb`, `H`, `h`],
      MN: [`H`, `h`, `hb`, `hB`],
      MO: [`h`, `hB`, `hb`, `H`],
      MP: [`h`, `hb`, `H`, `hB`],
      MQ: [`H`, `hB`],
      MR: [`h`, `hB`, `hb`, `H`],
      MS: [`H`, `h`, `hb`, `hB`],
      MT: [`H`, `h`],
      MU: [`H`, `h`],
      MV: [`H`, `h`],
      MW: [`h`, `hb`, `H`, `hB`],
      MX: [`h`, `H`, `hB`, `hb`],
      MY: [`hb`, `hB`, `h`, `H`],
      MZ: [`H`, `hB`],
      NA: [`h`, `H`, `hB`, `hb`],
      NC: [`H`, `hB`],
      NE: [`H`],
      NF: [`H`, `h`, `hb`, `hB`],
      NG: [`H`, `h`, `hb`, `hB`],
      NI: [`h`, `H`, `hB`, `hb`],
      NL: [`H`, `hB`],
      NO: [`H`, `h`],
      NP: [`H`, `h`, `hB`],
      NR: [`H`, `h`, `hb`, `hB`],
      NU: [`H`, `h`, `hb`, `hB`],
      NZ: [`h`, `hb`, `H`, `hB`],
      OM: [`h`, `hB`, `hb`, `H`],
      PA: [`h`, `H`, `hB`, `hb`],
      PE: [`h`, `H`, `hB`, `hb`],
      PF: [`H`, `h`, `hB`],
      PG: [`h`, `H`],
      PH: [`h`, `hB`, `hb`, `H`],
      PK: [`h`, `hB`, `H`],
      PL: [`H`, `h`],
      PM: [`H`, `hB`],
      PN: [`H`, `h`, `hb`, `hB`],
      PR: [`h`, `H`, `hB`, `hb`],
      PS: [`h`, `hB`, `hb`, `H`],
      PT: [`H`, `hB`],
      PW: [`h`, `H`],
      PY: [`h`, `H`, `hB`, `hb`],
      QA: [`h`, `hB`, `hb`, `H`],
      RE: [`H`, `hB`],
      RO: [`H`, `hB`],
      RS: [`H`, `hB`, `h`],
      RU: [`H`],
      RW: [`H`, `h`],
      SA: [`h`, `hB`, `hb`, `H`],
      SB: [`h`, `hb`, `H`, `hB`],
      SC: [`H`, `h`, `hB`],
      SD: [`h`, `hB`, `hb`, `H`],
      SE: [`H`],
      SG: [`h`, `hb`, `H`, `hB`],
      SH: [`H`, `h`, `hb`, `hB`],
      SI: [`H`, `hB`],
      SJ: [`H`],
      SK: [`H`],
      SL: [`h`, `hb`, `H`, `hB`],
      SM: [`H`, `h`, `hB`],
      SN: [`H`, `h`, `hB`],
      SO: [`h`, `H`],
      SR: [`H`, `hB`],
      SS: [`h`, `hb`, `H`, `hB`],
      ST: [`H`, `hB`],
      SV: [`h`, `H`, `hB`, `hb`],
      SX: [`H`, `h`, `hb`, `hB`],
      SY: [`h`, `hB`, `hb`, `H`],
      SZ: [`h`, `hb`, `H`, `hB`],
      TA: [`H`, `h`, `hb`, `hB`],
      TC: [`h`, `hb`, `H`, `hB`],
      TD: [`h`, `H`, `hB`],
      TF: [`H`, `h`, `hB`],
      TG: [`H`, `hB`],
      TH: [`H`, `h`],
      TJ: [`H`, `h`],
      TL: [`H`, `hB`, `hb`, `h`],
      TM: [`H`, `h`],
      TN: [`h`, `hB`, `hb`, `H`],
      TO: [`h`, `H`],
      TR: [`H`, `hB`],
      TT: [`h`, `hb`, `H`, `hB`],
      TW: [`hB`, `hb`, `h`, `H`],
      TZ: [`hB`, `hb`, `H`, `h`],
      UA: [`H`, `hB`, `h`],
      UG: [`hB`, `hb`, `H`, `h`],
      UM: [`h`, `hb`, `H`, `hB`],
      US: [`h`, `hb`, `H`, `hB`],
      UY: [`h`, `H`, `hB`, `hb`],
      UZ: [`H`, `hB`, `h`],
      VA: [`H`, `h`, `hB`],
      VC: [`h`, `hb`, `H`, `hB`],
      VE: [`h`, `H`, `hB`, `hb`],
      VG: [`h`, `hb`, `H`, `hB`],
      VI: [`h`, `hb`, `H`, `hB`],
      VN: [`H`, `h`],
      VU: [`h`, `H`],
      WF: [`H`, `hB`],
      WS: [`h`, `H`],
      XK: [`H`, `hB`, `h`],
      YE: [`h`, `hB`, `hb`, `H`],
      YT: [`H`, `hB`],
      ZA: [`H`, `h`, `hb`, `hB`],
      ZM: [`h`, `hb`, `H`, `hB`],
      ZW: [`H`, `h`],
      "af-ZA": [`H`, `h`, `hB`, `hb`],
      "ar-001": [`h`, `hB`, `hb`, `H`],
      "ca-ES": [`H`, `h`, `hB`],
      "en-001": [`h`, `hb`, `H`, `hB`],
      "en-HK": [`h`, `hb`, `H`, `hB`],
      "en-IL": [`H`, `h`, `hb`, `hB`],
      "en-MY": [`h`, `hb`, `H`, `hB`],
      "es-BR": [`H`, `h`, `hB`, `hb`],
      "es-ES": [`H`, `h`, `hB`, `hb`],
      "es-GQ": [`H`, `h`, `hB`, `hb`],
      "fr-CA": [`H`, `h`, `hB`],
      "gl-ES": [`H`, `h`, `hB`],
      "gu-IN": [`hB`, `hb`, `h`, `H`],
      "hi-IN": [`hB`, `h`, `H`],
      "it-CH": [`H`, `h`, `hB`],
      "it-IT": [`H`, `h`, `hB`],
      "kn-IN": [`hB`, `h`, `H`],
      "ml-IN": [`hB`, `h`, `H`],
      "mr-IN": [`hB`, `hb`, `h`, `H`],
      "pa-IN": [`hB`, `hb`, `h`, `H`],
      "ta-IN": [`hB`, `h`, `hb`, `H`],
      "te-IN": [`hB`, `h`, `H`],
      "zu-ZA": [`H`, `hB`, `hb`, `h`],
    };
  });
function Yp(e, t) {
  for (var n = ``, r = 0; r < e.length; r++) {
    var i = e.charAt(r);
    if (i === `j`) {
      for (var a = 0; r + 1 < e.length && e.charAt(r + 1) === i;) (a++, r++);
      var o = 1 + (a & 1),
        s = a < 2 ? 1 : 3 + (a >> 1),
        c = `a`,
        l = Xp(t);
      for ((l == `H` || l == `k`) && (s = 0); s-- > 0;) n += c;
      for (; o-- > 0;) n = l + n;
    } else n += i === `J` ? `H` : i;
  }
  return n;
}
function Xp(e) {
  var t = e.hourCycle;
  if ((t === void 0 && e.hourCycles && e.hourCycles.length && (t = e.hourCycles[0]), t))
    switch (t) {
      case `h24`:
        return `k`;
      case `h23`:
        return `H`;
      case `h12`:
        return `h`;
      case `h11`:
        return `K`;
      default:
        throw Error(`Invalid hourCycle`);
    }
  var n = e.language,
    r;
  return (
    n !== `root` && (r = e.maximize().region),
    (qp[r || ``] || qp[n || ``] || qp[`${n}-001`] || qp[`001`])[0]
  );
}
var Zp = o(() => {
  Jp();
});
function U(e, t) {
  return { start: e, end: t };
}
function Qp(e, t) {
  return new RegExp(e, t);
}
function $p(e) {
  return (e >= 97 && e <= 122) || (e >= 65 && e <= 90);
}
function em(e) {
  return $p(e) || e === 47;
}
function tm(e) {
  return (
    e === 45 ||
    e === 46 ||
    (e >= 48 && e <= 57) ||
    e === 95 ||
    (e >= 97 && e <= 122) ||
    (e >= 65 && e <= 90) ||
    e == 183 ||
    (e >= 192 && e <= 214) ||
    (e >= 216 && e <= 246) ||
    (e >= 248 && e <= 893) ||
    (e >= 895 && e <= 8191) ||
    (e >= 8204 && e <= 8205) ||
    (e >= 8255 && e <= 8256) ||
    (e >= 8304 && e <= 8591) ||
    (e >= 11264 && e <= 12271) ||
    (e >= 12289 && e <= 55295) ||
    (e >= 63744 && e <= 64975) ||
    (e >= 65008 && e <= 65533) ||
    (e >= 65536 && e <= 983039)
  );
}
function nm(e) {
  return (
    (e >= 9 && e <= 13) ||
    e === 32 ||
    e === 133 ||
    (e >= 8206 && e <= 8207) ||
    e === 8232 ||
    e === 8233
  );
}
function rm(e) {
  return (
    (e >= 33 && e <= 35) ||
    e === 36 ||
    (e >= 37 && e <= 39) ||
    e === 40 ||
    e === 41 ||
    e === 42 ||
    e === 43 ||
    e === 44 ||
    e === 45 ||
    (e >= 46 && e <= 47) ||
    (e >= 58 && e <= 59) ||
    (e >= 60 && e <= 62) ||
    (e >= 63 && e <= 64) ||
    e === 91 ||
    e === 92 ||
    e === 93 ||
    e === 94 ||
    e === 96 ||
    e === 123 ||
    e === 124 ||
    e === 125 ||
    e === 126 ||
    e === 161 ||
    (e >= 162 && e <= 165) ||
    e === 166 ||
    e === 167 ||
    e === 169 ||
    e === 171 ||
    e === 172 ||
    e === 174 ||
    e === 176 ||
    e === 177 ||
    e === 182 ||
    e === 187 ||
    e === 191 ||
    e === 215 ||
    e === 247 ||
    (e >= 8208 && e <= 8213) ||
    (e >= 8214 && e <= 8215) ||
    e === 8216 ||
    e === 8217 ||
    e === 8218 ||
    (e >= 8219 && e <= 8220) ||
    e === 8221 ||
    e === 8222 ||
    e === 8223 ||
    (e >= 8224 && e <= 8231) ||
    (e >= 8240 && e <= 8248) ||
    e === 8249 ||
    e === 8250 ||
    (e >= 8251 && e <= 8254) ||
    (e >= 8257 && e <= 8259) ||
    e === 8260 ||
    e === 8261 ||
    e === 8262 ||
    (e >= 8263 && e <= 8273) ||
    e === 8274 ||
    e === 8275 ||
    (e >= 8277 && e <= 8286) ||
    (e >= 8592 && e <= 8596) ||
    (e >= 8597 && e <= 8601) ||
    (e >= 8602 && e <= 8603) ||
    (e >= 8604 && e <= 8607) ||
    e === 8608 ||
    (e >= 8609 && e <= 8610) ||
    e === 8611 ||
    (e >= 8612 && e <= 8613) ||
    e === 8614 ||
    (e >= 8615 && e <= 8621) ||
    e === 8622 ||
    (e >= 8623 && e <= 8653) ||
    (e >= 8654 && e <= 8655) ||
    (e >= 8656 && e <= 8657) ||
    e === 8658 ||
    e === 8659 ||
    e === 8660 ||
    (e >= 8661 && e <= 8691) ||
    (e >= 8692 && e <= 8959) ||
    (e >= 8960 && e <= 8967) ||
    e === 8968 ||
    e === 8969 ||
    e === 8970 ||
    e === 8971 ||
    (e >= 8972 && e <= 8991) ||
    (e >= 8992 && e <= 8993) ||
    (e >= 8994 && e <= 9e3) ||
    e === 9001 ||
    e === 9002 ||
    (e >= 9003 && e <= 9083) ||
    e === 9084 ||
    (e >= 9085 && e <= 9114) ||
    (e >= 9115 && e <= 9139) ||
    (e >= 9140 && e <= 9179) ||
    (e >= 9180 && e <= 9185) ||
    (e >= 9186 && e <= 9254) ||
    (e >= 9255 && e <= 9279) ||
    (e >= 9280 && e <= 9290) ||
    (e >= 9291 && e <= 9311) ||
    (e >= 9472 && e <= 9654) ||
    e === 9655 ||
    (e >= 9656 && e <= 9664) ||
    e === 9665 ||
    (e >= 9666 && e <= 9719) ||
    (e >= 9720 && e <= 9727) ||
    (e >= 9728 && e <= 9838) ||
    e === 9839 ||
    (e >= 9840 && e <= 10087) ||
    e === 10088 ||
    e === 10089 ||
    e === 10090 ||
    e === 10091 ||
    e === 10092 ||
    e === 10093 ||
    e === 10094 ||
    e === 10095 ||
    e === 10096 ||
    e === 10097 ||
    e === 10098 ||
    e === 10099 ||
    e === 10100 ||
    e === 10101 ||
    (e >= 10132 && e <= 10175) ||
    (e >= 10176 && e <= 10180) ||
    e === 10181 ||
    e === 10182 ||
    (e >= 10183 && e <= 10213) ||
    e === 10214 ||
    e === 10215 ||
    e === 10216 ||
    e === 10217 ||
    e === 10218 ||
    e === 10219 ||
    e === 10220 ||
    e === 10221 ||
    e === 10222 ||
    e === 10223 ||
    (e >= 10224 && e <= 10239) ||
    (e >= 10240 && e <= 10495) ||
    (e >= 10496 && e <= 10626) ||
    e === 10627 ||
    e === 10628 ||
    e === 10629 ||
    e === 10630 ||
    e === 10631 ||
    e === 10632 ||
    e === 10633 ||
    e === 10634 ||
    e === 10635 ||
    e === 10636 ||
    e === 10637 ||
    e === 10638 ||
    e === 10639 ||
    e === 10640 ||
    e === 10641 ||
    e === 10642 ||
    e === 10643 ||
    e === 10644 ||
    e === 10645 ||
    e === 10646 ||
    e === 10647 ||
    e === 10648 ||
    (e >= 10649 && e <= 10711) ||
    e === 10712 ||
    e === 10713 ||
    e === 10714 ||
    e === 10715 ||
    (e >= 10716 && e <= 10747) ||
    e === 10748 ||
    e === 10749 ||
    (e >= 10750 && e <= 11007) ||
    (e >= 11008 && e <= 11055) ||
    (e >= 11056 && e <= 11076) ||
    (e >= 11077 && e <= 11078) ||
    (e >= 11079 && e <= 11084) ||
    (e >= 11085 && e <= 11123) ||
    (e >= 11124 && e <= 11125) ||
    (e >= 11126 && e <= 11157) ||
    e === 11158 ||
    (e >= 11159 && e <= 11263) ||
    (e >= 11776 && e <= 11777) ||
    e === 11778 ||
    e === 11779 ||
    e === 11780 ||
    e === 11781 ||
    (e >= 11782 && e <= 11784) ||
    e === 11785 ||
    e === 11786 ||
    e === 11787 ||
    e === 11788 ||
    e === 11789 ||
    (e >= 11790 && e <= 11798) ||
    e === 11799 ||
    (e >= 11800 && e <= 11801) ||
    e === 11802 ||
    e === 11803 ||
    e === 11804 ||
    e === 11805 ||
    (e >= 11806 && e <= 11807) ||
    e === 11808 ||
    e === 11809 ||
    e === 11810 ||
    e === 11811 ||
    e === 11812 ||
    e === 11813 ||
    e === 11814 ||
    e === 11815 ||
    e === 11816 ||
    e === 11817 ||
    (e >= 11818 && e <= 11822) ||
    e === 11823 ||
    (e >= 11824 && e <= 11833) ||
    (e >= 11834 && e <= 11835) ||
    (e >= 11836 && e <= 11839) ||
    e === 11840 ||
    e === 11841 ||
    e === 11842 ||
    (e >= 11843 && e <= 11855) ||
    (e >= 11856 && e <= 11857) ||
    e === 11858 ||
    (e >= 11859 && e <= 11903) ||
    (e >= 12289 && e <= 12291) ||
    e === 12296 ||
    e === 12297 ||
    e === 12298 ||
    e === 12299 ||
    e === 12300 ||
    e === 12301 ||
    e === 12302 ||
    e === 12303 ||
    e === 12304 ||
    e === 12305 ||
    (e >= 12306 && e <= 12307) ||
    e === 12308 ||
    e === 12309 ||
    e === 12310 ||
    e === 12311 ||
    e === 12312 ||
    e === 12313 ||
    e === 12314 ||
    e === 12315 ||
    e === 12316 ||
    e === 12317 ||
    (e >= 12318 && e <= 12319) ||
    e === 12320 ||
    e === 12336 ||
    e === 64830 ||
    e === 64831 ||
    (e >= 65093 && e <= 65094)
  );
}
var im,
  am,
  om,
  sm,
  cm,
  lm,
  um,
  dm,
  fm,
  pm,
  mm,
  hm,
  gm,
  _m,
  vm,
  ym,
  bm,
  xm,
  Sm,
  Cm = o(() => {
    (Zf(),
      fp(),
      Ep(),
      Op(),
      Kp(),
      Zp(),
      (im = RegExp(`^${Dp.source}*`)),
      (am = RegExp(`${Dp.source}*\$`)),
      (om = !!String.prototype.startsWith && `_a`.startsWith(`a`, 1)),
      (sm = !!String.fromCodePoint),
      (cm = !!Object.fromEntries),
      (lm = !!String.prototype.codePointAt),
      (um = !!String.prototype.trimStart),
      (dm = !!String.prototype.trimEnd),
      (fm = Number.isSafeInteger
        ? Number.isSafeInteger
        : function (e) {
            return (
              typeof e == `number` &&
              isFinite(e) &&
              Math.floor(e) === e &&
              Math.abs(e) <= 9007199254740991
            );
          }),
      (pm = !0));
    try {
      pm = Qp(`([^\\p{White_Space}\\p{Pattern_Syntax}]*)`, `yu`).exec(`a`)?.[0] === `a`;
    } catch {
      pm = !1;
    }
    ((mm = om
      ? function (e, t, n) {
          return e.startsWith(t, n);
        }
      : function (e, t, n) {
          return e.slice(n, n + t.length) === t;
        }),
      (hm = sm
        ? String.fromCodePoint
        : function () {
            for (var e = [], t = 0; t < arguments.length; t++) e[t] = arguments[t];
            for (var n = ``, r = e.length, i = 0, a; r > i;) {
              if (((a = e[i++]), a > 1114111)) throw RangeError(a + ` is not a valid code point`);
              n +=
                a < 65536
                  ? String.fromCharCode(a)
                  : String.fromCharCode(((a -= 65536) >> 10) + 55296, (a % 1024) + 56320);
            }
            return n;
          }),
      (gm = cm
        ? Object.fromEntries
        : function (e) {
            for (var t = {}, n = 0, r = e; n < r.length; n++) {
              var i = r[n],
                a = i[0];
              t[a] = i[1];
            }
            return t;
          }),
      (_m = lm
        ? function (e, t) {
            return e.codePointAt(t);
          }
        : function (e, t) {
            var n = e.length;
            if (!(t < 0 || t >= n)) {
              var r = e.charCodeAt(t),
                i;
              return r < 55296 ||
                r > 56319 ||
                t + 1 === n ||
                (i = e.charCodeAt(t + 1)) < 56320 ||
                i > 57343
                ? r
                : ((r - 55296) << 10) + (i - 56320) + 65536;
            }
          }),
      (vm = um
        ? function (e) {
            return e.trimStart();
          }
        : function (e) {
            return e.replace(im, ``);
          }),
      (ym = dm
        ? function (e) {
            return e.trimEnd();
          }
        : function (e) {
            return e.replace(am, ``);
          }),
      pm
        ? ((xm = Qp(`([^\\p{White_Space}\\p{Pattern_Syntax}]*)`, `yu`)),
          (bm = function (e, t) {
            return ((xm.lastIndex = t), xm.exec(e)[1] ?? ``);
          }))
        : (bm = function (e, t) {
            for (var n = []; ;) {
              var r = _m(e, t);
              if (r === void 0 || nm(r) || rm(r)) break;
              (n.push(r), (t += r >= 65536 ? 2 : 1));
            }
            return hm.apply(void 0, n);
          }),
      (Sm = (function () {
        function e(e, t) {
          (t === void 0 && (t = {}),
            (this.message = e),
            (this.position = { offset: 0, line: 1, column: 1 }),
            (this.ignoreTag = !!t.ignoreTag),
            (this.locale = t.locale),
            (this.requiresOtherClause = !!t.requiresOtherClause),
            (this.shouldParseSkeletons = !!t.shouldParseSkeletons));
        }
        return (
          (e.prototype.parse = function () {
            if (this.offset() !== 0) throw Error(`parser can only be used once`);
            return this.parseMessage(0, ``, !1);
          }),
          (e.prototype.parseMessage = function (e, t, n) {
            for (var r = []; !this.isEOF();) {
              var i = this.char();
              if (i === 123) {
                var a = this.parseArgument(e, n);
                if (a.err) return a;
                r.push(a.val);
              } else if (i === 125 && e > 0) break;
              else if (i === 35 && (t === `plural` || t === `selectordinal`)) {
                var o = this.clonePosition();
                (this.bump(), r.push({ type: wp.pound, location: U(o, this.clonePosition()) }));
              } else if (i === 60 && !this.ignoreTag && this.peek() === 47) {
                if (n) break;
                return this.error(
                  H.UNMATCHED_CLOSING_TAG,
                  U(this.clonePosition(), this.clonePosition()),
                );
              } else if (i === 60 && !this.ignoreTag && $p(this.peek() || 0)) {
                var a = this.parseTag(e, t);
                if (a.err) return a;
                r.push(a.val);
              } else {
                var a = this.parseLiteral(e, t);
                if (a.err) return a;
                r.push(a.val);
              }
            }
            return { val: r, err: null };
          }),
          (e.prototype.parseTag = function (e, t) {
            var n = this.clonePosition();
            this.bump();
            var r = this.parseTagName();
            if ((this.bumpSpace(), this.bumpIf(`/>`)))
              return {
                val: { type: wp.literal, value: `<${r}/>`, location: U(n, this.clonePosition()) },
                err: null,
              };
            if (this.bumpIf(`>`)) {
              var i = this.parseMessage(e + 1, t, !0);
              if (i.err) return i;
              var a = i.val,
                o = this.clonePosition();
              if (this.bumpIf(`</`)) {
                if (this.isEOF() || !$p(this.char()))
                  return this.error(H.INVALID_TAG, U(o, this.clonePosition()));
                var s = this.clonePosition();
                return r === this.parseTagName()
                  ? (this.bumpSpace(),
                    this.bumpIf(`>`)
                      ? {
                          val: {
                            type: wp.tag,
                            value: r,
                            children: a,
                            location: U(n, this.clonePosition()),
                          },
                          err: null,
                        }
                      : this.error(H.INVALID_TAG, U(o, this.clonePosition())))
                  : this.error(H.UNMATCHED_CLOSING_TAG, U(s, this.clonePosition()));
              }
              return this.error(H.UNCLOSED_TAG, U(n, this.clonePosition()));
            }
            return this.error(H.INVALID_TAG, U(n, this.clonePosition()));
          }),
          (e.prototype.parseTagName = function () {
            var e = this.offset();
            for (this.bump(); !this.isEOF() && tm(this.char());) this.bump();
            return this.message.slice(e, this.offset());
          }),
          (e.prototype.parseLiteral = function (e, t) {
            for (var n = this.clonePosition(), r = ``; ;) {
              var i = this.tryParseQuote(t);
              if (i) {
                r += i;
                continue;
              }
              var a = this.tryParseUnquoted(e, t);
              if (a) {
                r += a;
                continue;
              }
              var o = this.tryParseLeftAngleBracket();
              if (o) {
                r += o;
                continue;
              }
              break;
            }
            var s = U(n, this.clonePosition());
            return { val: { type: wp.literal, value: r, location: s }, err: null };
          }),
          (e.prototype.tryParseLeftAngleBracket = function () {
            return !this.isEOF() && this.char() === 60 && (this.ignoreTag || !em(this.peek() || 0))
              ? (this.bump(), `<`)
              : null;
          }),
          (e.prototype.tryParseQuote = function (e) {
            if (this.isEOF() || this.char() !== 39) return null;
            switch (this.peek()) {
              case 39:
                return (this.bump(), this.bump(), `'`);
              case 123:
              case 60:
              case 62:
              case 125:
                break;
              case 35:
                if (e === `plural` || e === `selectordinal`) break;
                return null;
              default:
                return null;
            }
            this.bump();
            var t = [this.char()];
            for (this.bump(); !this.isEOF();) {
              var n = this.char();
              if (n === 39) {
                if (this.peek() === 39) (t.push(39), this.bump());
                else {
                  this.bump();
                  break;
                }
              } else t.push(n);
              this.bump();
            }
            return hm.apply(void 0, t);
          }),
          (e.prototype.tryParseUnquoted = function (e, t) {
            if (this.isEOF()) return null;
            var n = this.char();
            return n === 60 ||
              n === 123 ||
              (n === 35 && (t === `plural` || t === `selectordinal`)) ||
              (n === 125 && e > 0)
              ? null
              : (this.bump(), hm(n));
          }),
          (e.prototype.parseArgument = function (e, t) {
            var n = this.clonePosition();
            if ((this.bump(), this.bumpSpace(), this.isEOF()))
              return this.error(H.EXPECT_ARGUMENT_CLOSING_BRACE, U(n, this.clonePosition()));
            if (this.char() === 125)
              return (this.bump(), this.error(H.EMPTY_ARGUMENT, U(n, this.clonePosition())));
            var r = this.parseIdentifierIfPossible().value;
            if (!r) return this.error(H.MALFORMED_ARGUMENT, U(n, this.clonePosition()));
            if ((this.bumpSpace(), this.isEOF()))
              return this.error(H.EXPECT_ARGUMENT_CLOSING_BRACE, U(n, this.clonePosition()));
            switch (this.char()) {
              case 125:
                return (
                  this.bump(),
                  {
                    val: { type: wp.argument, value: r, location: U(n, this.clonePosition()) },
                    err: null,
                  }
                );
              case 44:
                return (
                  this.bump(),
                  this.bumpSpace(),
                  this.isEOF()
                    ? this.error(H.EXPECT_ARGUMENT_CLOSING_BRACE, U(n, this.clonePosition()))
                    : this.parseArgumentOptions(e, t, r, n)
                );
              default:
                return this.error(H.MALFORMED_ARGUMENT, U(n, this.clonePosition()));
            }
          }),
          (e.prototype.parseIdentifierIfPossible = function () {
            var e = this.clonePosition(),
              t = this.offset(),
              n = bm(this.message, t),
              r = t + n.length;
            return (this.bumpTo(r), { value: n, location: U(e, this.clonePosition()) });
          }),
          (e.prototype.parseArgumentOptions = function (e, t, n, r) {
            var i = this.clonePosition(),
              a = this.parseIdentifierIfPossible().value,
              o = this.clonePosition();
            switch (a) {
              case ``:
                return this.error(H.EXPECT_ARGUMENT_TYPE, U(i, o));
              case `number`:
              case `date`:
              case `time`:
                this.bumpSpace();
                var s = null;
                if (this.bumpIf(`,`)) {
                  this.bumpSpace();
                  var c = this.clonePosition(),
                    l = this.parseSimpleArgStyleIfPossible();
                  if (l.err) return l;
                  var u = ym(l.val);
                  if (u.length === 0)
                    return this.error(
                      H.EXPECT_ARGUMENT_STYLE,
                      U(this.clonePosition(), this.clonePosition()),
                    );
                  s = { style: u, styleLocation: U(c, this.clonePosition()) };
                }
                var d = this.tryParseArgumentClose(r);
                if (d.err) return d;
                var f = U(r, this.clonePosition());
                if (s && mm(s?.style, `::`, 0)) {
                  var p = vm(s.style.slice(2));
                  if (a === `number`) {
                    var l = this.parseNumberSkeletonFromString(p, s.styleLocation);
                    return l.err
                      ? l
                      : {
                          val: { type: wp.number, value: n, location: f, style: l.val },
                          err: null,
                        };
                  }
                  if (p.length === 0) return this.error(H.EXPECT_DATE_TIME_SKELETON, f);
                  var m = p;
                  this.locale && (m = Yp(p, this.locale));
                  var u = {
                    type: Tp.dateTime,
                    pattern: m,
                    location: s.styleLocation,
                    parsedOptions: this.shouldParseSkeletons ? kp(m) : {},
                  };
                  return {
                    val: {
                      type: a === `date` ? wp.date : wp.time,
                      value: n,
                      location: f,
                      style: u,
                    },
                    err: null,
                  };
                }
                return {
                  val: {
                    type: a === `number` ? wp.number : a === `date` ? wp.date : wp.time,
                    value: n,
                    location: f,
                    style: s?.style ?? null,
                  },
                  err: null,
                };
              case `plural`:
              case `selectordinal`:
              case `select`:
                var h = this.clonePosition();
                if ((this.bumpSpace(), !this.bumpIf(`,`)))
                  return this.error(H.EXPECT_SELECT_ARGUMENT_OPTIONS, U(h, V({}, h)));
                this.bumpSpace();
                var g = this.parseIdentifierIfPossible(),
                  _ = 0;
                if (a !== `select` && g.value === `offset`) {
                  if (!this.bumpIf(`:`))
                    return this.error(
                      H.EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE,
                      U(this.clonePosition(), this.clonePosition()),
                    );
                  this.bumpSpace();
                  var l = this.tryParseDecimalInteger(
                    H.EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE,
                    H.INVALID_PLURAL_ARGUMENT_OFFSET_VALUE,
                  );
                  if (l.err) return l;
                  (this.bumpSpace(), (g = this.parseIdentifierIfPossible()), (_ = l.val));
                }
                var v = this.tryParsePluralOrSelectOptions(e, a, t, g);
                if (v.err) return v;
                var d = this.tryParseArgumentClose(r);
                if (d.err) return d;
                var y = U(r, this.clonePosition());
                return a === `select`
                  ? {
                      val: { type: wp.select, value: n, options: gm(v.val), location: y },
                      err: null,
                    }
                  : {
                      val: {
                        type: wp.plural,
                        value: n,
                        options: gm(v.val),
                        offset: _,
                        pluralType: a === `plural` ? `cardinal` : `ordinal`,
                        location: y,
                      },
                      err: null,
                    };
              default:
                return this.error(H.INVALID_ARGUMENT_TYPE, U(i, o));
            }
          }),
          (e.prototype.tryParseArgumentClose = function (e) {
            return this.isEOF() || this.char() !== 125
              ? this.error(H.EXPECT_ARGUMENT_CLOSING_BRACE, U(e, this.clonePosition()))
              : (this.bump(), { val: !0, err: null });
          }),
          (e.prototype.parseSimpleArgStyleIfPossible = function () {
            for (var e = 0, t = this.clonePosition(); !this.isEOF();)
              switch (this.char()) {
                case 39:
                  this.bump();
                  var n = this.clonePosition();
                  if (!this.bumpUntil(`'`))
                    return this.error(
                      H.UNCLOSED_QUOTE_IN_ARGUMENT_STYLE,
                      U(n, this.clonePosition()),
                    );
                  this.bump();
                  break;
                case 123:
                  ((e += 1), this.bump());
                  break;
                case 125:
                  if (e > 0) --e;
                  else return { val: this.message.slice(t.offset, this.offset()), err: null };
                  break;
                default:
                  this.bump();
              }
            return { val: this.message.slice(t.offset, this.offset()), err: null };
          }),
          (e.prototype.parseNumberSkeletonFromString = function (e, t) {
            var n = [];
            try {
              n = Pp(e);
            } catch {
              return this.error(H.INVALID_NUMBER_SKELETON, t);
            }
            return {
              val: {
                type: Tp.number,
                tokens: n,
                location: t,
                parsedOptions: this.shouldParseSkeletons ? Bp(n) : {},
              },
              err: null,
            };
          }),
          (e.prototype.tryParsePluralOrSelectOptions = function (e, t, n, r) {
            for (var i, a = !1, o = [], s = new Set(), c = r.value, l = r.location; ;) {
              if (c.length === 0) {
                var u = this.clonePosition();
                if (t !== `select` && this.bumpIf(`=`)) {
                  var d = this.tryParseDecimalInteger(
                    H.EXPECT_PLURAL_ARGUMENT_SELECTOR,
                    H.INVALID_PLURAL_ARGUMENT_SELECTOR,
                  );
                  if (d.err) return d;
                  ((l = U(u, this.clonePosition())),
                    (c = this.message.slice(u.offset, this.offset())));
                } else break;
              }
              if (s.has(c))
                return this.error(
                  t === `select`
                    ? H.DUPLICATE_SELECT_ARGUMENT_SELECTOR
                    : H.DUPLICATE_PLURAL_ARGUMENT_SELECTOR,
                  l,
                );
              (c === `other` && (a = !0), this.bumpSpace());
              var f = this.clonePosition();
              if (!this.bumpIf(`{`))
                return this.error(
                  t === `select`
                    ? H.EXPECT_SELECT_ARGUMENT_SELECTOR_FRAGMENT
                    : H.EXPECT_PLURAL_ARGUMENT_SELECTOR_FRAGMENT,
                  U(this.clonePosition(), this.clonePosition()),
                );
              var p = this.parseMessage(e + 1, t, n);
              if (p.err) return p;
              var m = this.tryParseArgumentClose(f);
              if (m.err) return m;
              (o.push([c, { value: p.val, location: U(f, this.clonePosition()) }]),
                s.add(c),
                this.bumpSpace(),
                (i = this.parseIdentifierIfPossible()),
                (c = i.value),
                (l = i.location));
            }
            return o.length === 0
              ? this.error(
                  t === `select`
                    ? H.EXPECT_SELECT_ARGUMENT_SELECTOR
                    : H.EXPECT_PLURAL_ARGUMENT_SELECTOR,
                  U(this.clonePosition(), this.clonePosition()),
                )
              : this.requiresOtherClause && !a
                ? this.error(H.MISSING_OTHER_CLAUSE, U(this.clonePosition(), this.clonePosition()))
                : { val: o, err: null };
          }),
          (e.prototype.tryParseDecimalInteger = function (e, t) {
            var n = 1,
              r = this.clonePosition();
            this.bumpIf(`+`) || (this.bumpIf(`-`) && (n = -1));
            for (var i = !1, a = 0; !this.isEOF();) {
              var o = this.char();
              if (o >= 48 && o <= 57) ((i = !0), (a = a * 10 + (o - 48)), this.bump());
              else break;
            }
            var s = U(r, this.clonePosition());
            return i
              ? ((a *= n), fm(a) ? { val: a, err: null } : this.error(t, s))
              : this.error(e, s);
          }),
          (e.prototype.offset = function () {
            return this.position.offset;
          }),
          (e.prototype.isEOF = function () {
            return this.offset() === this.message.length;
          }),
          (e.prototype.clonePosition = function () {
            return {
              offset: this.position.offset,
              line: this.position.line,
              column: this.position.column,
            };
          }),
          (e.prototype.char = function () {
            var e = this.position.offset;
            if (e >= this.message.length) throw Error(`out of bound`);
            var t = _m(this.message, e);
            if (t === void 0) throw Error(`Offset ${e} is at invalid UTF-16 code unit boundary`);
            return t;
          }),
          (e.prototype.error = function (e, t) {
            return { val: null, err: { kind: e, message: this.message, location: t } };
          }),
          (e.prototype.bump = function () {
            if (!this.isEOF()) {
              var e = this.char();
              e === 10
                ? ((this.position.line += 1),
                  (this.position.column = 1),
                  (this.position.offset += 1))
                : ((this.position.column += 1), (this.position.offset += e < 65536 ? 1 : 2));
            }
          }),
          (e.prototype.bumpIf = function (e) {
            if (mm(this.message, e, this.offset())) {
              for (var t = 0; t < e.length; t++) this.bump();
              return !0;
            }
            return !1;
          }),
          (e.prototype.bumpUntil = function (e) {
            var t = this.offset(),
              n = this.message.indexOf(e, t);
            return n >= 0 ? (this.bumpTo(n), !0) : (this.bumpTo(this.message.length), !1);
          }),
          (e.prototype.bumpTo = function (e) {
            if (this.offset() > e)
              throw Error(
                `targetOffset ${e} must be greater than or equal to the current offset ${this.offset()}`,
              );
            for (e = Math.min(e, this.message.length); ;) {
              var t = this.offset();
              if (t === e) break;
              if (t > e) throw Error(`targetOffset ${e} is at invalid UTF-16 code unit boundary`);
              if ((this.bump(), this.isEOF())) break;
            }
          }),
          (e.prototype.bumpSpace = function () {
            for (; !this.isEOF() && nm(this.char());) this.bump();
          }),
          (e.prototype.peek = function () {
            if (this.isEOF()) return null;
            var e = this.char(),
              t = this.offset();
            return this.message.charCodeAt(t + (e >= 65536 ? 2 : 1)) ?? null;
          }),
          e
        );
      })()));
  }),
  wm = o(() => {
    Ep();
  });
function Tm(e) {
  e.forEach(function (e) {
    if ((delete e.location, vp(e) || yp(e)))
      for (var t in e.options) (delete e.options[t].location, Tm(e.options[t].value));
    else
      (hp(e) && Sp(e.style)) || ((gp(e) || _p(e)) && Cp(e.style))
        ? delete e.style.location
        : xp(e) && Tm(e.children);
  });
}
function Em(e, t) {
  (t === void 0 && (t = {}), (t = V({ shouldParseSkeletons: !0, requiresOtherClause: !0 }, t)));
  var n = new Sm(e, t).parse();
  if (n.err) {
    var r = SyntaxError(H[n.err.kind]);
    throw ((r.location = n.err.location), (r.originalMessage = n.err.message), r);
  }
  return (t?.captureLocation || Tm(n.val), n.val);
}
var Dm = o(() => {
    (Zf(), fp(), Cm(), Ep(), Ep(), wm());
  }),
  Om,
  km,
  Am,
  jm,
  Mm,
  Nm = o(() => {
    (Zf(),
      (function (e) {
        ((e.MISSING_VALUE = `MISSING_VALUE`),
          (e.INVALID_VALUE = `INVALID_VALUE`),
          (e.MISSING_INTL_API = `MISSING_INTL_API`));
      })((Om ||= {})),
      (km = (function (e) {
        qf(t, e);
        function t(t, n, r) {
          var i = e.call(this, t) || this;
          return ((i.code = n), (i.originalMessage = r), i);
        }
        return (
          (t.prototype.toString = function () {
            return `[formatjs Error: ${this.code}] ${this.message}`;
          }),
          t
        );
      })(Error)),
      (Am = (function (e) {
        qf(t, e);
        function t(t, n, r, i) {
          return (
            e.call(
              this,
              `Invalid values for "${t}": "${n}". Options are "${Object.keys(r).join(`", "`)}"`,
              Om.INVALID_VALUE,
              i,
            ) || this
          );
        }
        return t;
      })(km)),
      (jm = (function (e) {
        qf(t, e);
        function t(t, n, r) {
          return e.call(this, `Value for "${t}" must be of type ${n}`, Om.INVALID_VALUE, r) || this;
        }
        return t;
      })(km)),
      (Mm = (function (e) {
        qf(t, e);
        function t(t, n) {
          return (
            e.call(
              this,
              `The intl string context variable "${t}" was not provided to the string "${n}"`,
              Om.MISSING_VALUE,
              n,
            ) || this
          );
        }
        return t;
      })(km)));
  });
function Pm(e) {
  return e.length < 2
    ? e
    : e.reduce(function (e, t) {
        var n = e[e.length - 1];
        return (
          !n || n.type !== Lm.literal || t.type !== Lm.literal ? e.push(t) : (n.value += t.value),
          e
        );
      }, []);
}
function Fm(e) {
  return typeof e == `function`;
}
function Im(e, t, n, r, i, a, o) {
  if (e.length === 1 && pp(e[0])) return [{ type: Lm.literal, value: e[0].value }];
  for (var s = [], c = 0, l = e; c < l.length; c++) {
    var u = l[c];
    if (pp(u)) {
      s.push({ type: Lm.literal, value: u.value });
      continue;
    }
    if (bp(u)) {
      typeof a == `number` && s.push({ type: Lm.literal, value: n.getNumberFormat(t).format(a) });
      continue;
    }
    var d = u.value;
    if (!(i && d in i)) throw new Mm(d, o);
    var f = i[d];
    if (mp(u)) {
      ((!f || typeof f == `string` || typeof f == `number`) &&
        (f = typeof f == `string` || typeof f == `number` ? String(f) : ``),
        s.push({ type: typeof f == `string` ? Lm.literal : Lm.object, value: f }));
      continue;
    }
    if (gp(u)) {
      var p =
        typeof u.style == `string` ? r.date[u.style] : Cp(u.style) ? u.style.parsedOptions : void 0;
      s.push({ type: Lm.literal, value: n.getDateTimeFormat(t, p).format(f) });
      continue;
    }
    if (_p(u)) {
      var p =
        typeof u.style == `string`
          ? r.time[u.style]
          : Cp(u.style)
            ? u.style.parsedOptions
            : r.time.medium;
      s.push({ type: Lm.literal, value: n.getDateTimeFormat(t, p).format(f) });
      continue;
    }
    if (hp(u)) {
      var p =
        typeof u.style == `string`
          ? r.number[u.style]
          : Sp(u.style)
            ? u.style.parsedOptions
            : void 0;
      (p && p.scale && (f *= p.scale || 1),
        s.push({ type: Lm.literal, value: n.getNumberFormat(t, p).format(f) }));
      continue;
    }
    if (xp(u)) {
      var m = u.children,
        h = u.value,
        g = i[h];
      if (!Fm(g)) throw new jm(h, `function`, o);
      var _ = g(
        Im(m, t, n, r, i, a).map(function (e) {
          return e.value;
        }),
      );
      (Array.isArray(_) || (_ = [_]),
        s.push.apply(
          s,
          _.map(function (e) {
            return { type: typeof e == `string` ? Lm.literal : Lm.object, value: e };
          }),
        ));
    }
    if (vp(u)) {
      var v = u.options[f] || u.options.other;
      if (!v) throw new Am(u.value, f, Object.keys(u.options), o);
      s.push.apply(s, Im(v.value, t, n, r, i));
      continue;
    }
    if (yp(u)) {
      var v = u.options[`=${f}`];
      if (!v) {
        if (!Intl.PluralRules)
          throw new km(
            `Intl.PluralRules is not available in this environment.
Try polyfilling it using "@formatjs/intl-pluralrules"
`,
            Om.MISSING_INTL_API,
            o,
          );
        var y = n.getPluralRules(t, { type: u.pluralType }).select(f - (u.offset || 0));
        v = u.options[y] || u.options.other;
      }
      if (!v) throw new Am(u.value, f, Object.keys(u.options), o);
      s.push.apply(s, Im(v.value, t, n, r, i, f - (u.offset || 0)));
      continue;
    }
  }
  return Pm(s);
}
var Lm,
  Rm = o(() => {
    (Dm(),
      Nm(),
      (function (e) {
        ((e[(e.literal = 0)] = `literal`), (e[(e.object = 1)] = `object`));
      })((Lm ||= {})));
  });
function zm(e, t) {
  return t
    ? V(
        V(V({}, e || {}), t || {}),
        Object.keys(e).reduce(function (n, r) {
          return ((n[r] = V(V({}, e[r]), t[r] || {})), n);
        }, {}),
      )
    : e;
}
function Bm(e, t) {
  return t
    ? Object.keys(e).reduce(
        function (n, r) {
          return ((n[r] = zm(e[r], t[r])), n);
        },
        V({}, e),
      )
    : e;
}
function Vm(e) {
  return {
    create: function () {
      return {
        get: function (t) {
          return e[t];
        },
        set: function (t, n) {
          e[t] = n;
        },
      };
    },
  };
}
function Hm(e) {
  return (
    e === void 0 && (e = { number: {}, dateTime: {}, pluralRules: {} }),
    {
      getNumberFormat: $f(
        function () {
          for (var e, t = [], n = 0; n < arguments.length; n++) t[n] = arguments[n];
          return new ((e = Intl.NumberFormat).bind.apply(e, Yf([void 0], t, !1)))();
        },
        { cache: Vm(e.number), strategy: up.variadic },
      ),
      getDateTimeFormat: $f(
        function () {
          for (var e, t = [], n = 0; n < arguments.length; n++) t[n] = arguments[n];
          return new ((e = Intl.DateTimeFormat).bind.apply(e, Yf([void 0], t, !1)))();
        },
        { cache: Vm(e.dateTime), strategy: up.variadic },
      ),
      getPluralRules: $f(
        function () {
          for (var e, t = [], n = 0; n < arguments.length; n++) t[n] = arguments[n];
          return new ((e = Intl.PluralRules).bind.apply(e, Yf([void 0], t, !1)))();
        },
        { cache: Vm(e.pluralRules), strategy: up.variadic },
      ),
    }
  );
}
var Um,
  Wm = o(() => {
    (Zf(),
      dp(),
      Dm(),
      Rm(),
      (Um = (function () {
        function e(t, n, r, i) {
          n === void 0 && (n = e.defaultLocale);
          var a = this;
          if (
            ((this.formatterCache = { number: {}, dateTime: {}, pluralRules: {} }),
            (this.format = function (e) {
              var t = a.formatToParts(e);
              if (t.length === 1) return t[0].value;
              var n = t.reduce(function (e, t) {
                return (
                  !e.length || t.type !== Lm.literal || typeof e[e.length - 1] != `string`
                    ? e.push(t.value)
                    : (e[e.length - 1] += t.value),
                  e
                );
              }, []);
              return n.length <= 1 ? n[0] || `` : n;
            }),
            (this.formatToParts = function (e) {
              return Im(a.ast, a.locales, a.formatters, a.formats, e, void 0, a.message);
            }),
            (this.resolvedOptions = function () {
              return {
                locale:
                  a.resolvedLocale?.toString() ||
                  Intl.NumberFormat.supportedLocalesOf(a.locales)[0],
              };
            }),
            (this.getAst = function () {
              return a.ast;
            }),
            (this.locales = n),
            (this.resolvedLocale = e.resolveLocale(n)),
            typeof t == `string`)
          ) {
            if (((this.message = t), !e.__parse))
              throw TypeError(
                "IntlMessageFormat.__parse must be set to process `message` of type `string`",
              );
            var o = i || {};
            o.formatters;
            var s = Jf(o, [`formatters`]);
            this.ast = e.__parse(t, V(V({}, s), { locale: this.resolvedLocale }));
          } else this.ast = t;
          if (!Array.isArray(this.ast))
            throw TypeError(`A message must be provided as a String or AST.`);
          ((this.formats = Bm(e.formats, r)),
            (this.formatters = (i && i.formatters) || Hm(this.formatterCache)));
        }
        return (
          Object.defineProperty(e, "defaultLocale", {
            get: function () {
              return (
                (e.memoizedDefaultLocale ||= new Intl.NumberFormat().resolvedOptions().locale),
                e.memoizedDefaultLocale
              );
            },
            enumerable: !1,
            configurable: !0,
          }),
          (e.memoizedDefaultLocale = null),
          (e.resolveLocale = function (e) {
            if (Intl.Locale !== void 0) {
              var t = Intl.NumberFormat.supportedLocalesOf(e);
              return t.length > 0
                ? new Intl.Locale(t[0])
                : new Intl.Locale(typeof e == `string` ? e : e[0]);
            }
          }),
          (e.__parse = Em),
          (e.formats = {
            number: {
              integer: { maximumFractionDigits: 0 },
              currency: { style: `currency` },
              percent: { style: `percent` },
            },
            date: {
              short: { month: `numeric`, day: `numeric`, year: `2-digit` },
              medium: { month: `short`, day: `numeric`, year: `numeric` },
              long: { month: `long`, day: `numeric`, year: `numeric` },
              full: { weekday: `long`, month: `long`, day: `numeric`, year: `numeric` },
            },
            time: {
              short: { hour: `numeric`, minute: `numeric` },
              medium: { hour: `numeric`, minute: `numeric`, second: `numeric` },
              long: {
                hour: `numeric`,
                minute: `numeric`,
                second: `numeric`,
                timeZoneName: `short`,
              },
              full: {
                hour: `numeric`,
                minute: `numeric`,
                second: `numeric`,
                timeZoneName: `short`,
              },
            },
          }),
          e
        );
      })()));
  }),
  Gm = o(() => {
    (Wm(), Wm(), Nm(), Rm());
  }),
  Km,
  qm,
  Jm,
  Ym,
  Xm,
  Zm,
  Qm,
  $m,
  eh = o(() => {
    (Zf(),
      (function (e) {
        ((e.FORMAT_ERROR = `FORMAT_ERROR`),
          (e.UNSUPPORTED_FORMATTER = `UNSUPPORTED_FORMATTER`),
          (e.INVALID_CONFIG = `INVALID_CONFIG`),
          (e.MISSING_DATA = `MISSING_DATA`),
          (e.MISSING_TRANSLATION = `MISSING_TRANSLATION`));
      })((Km ||= {})),
      (qm = (function (e) {
        qf(t, e);
        function t(n, r, i) {
          var a = this,
            o = i ? (i instanceof Error ? i : Error(String(i))) : void 0;
          return (
            (a =
              e.call(
                this,
                `[@formatjs/intl Error ${n}] ${r}
${
  o
    ? `
${o.message}
${o.stack}`
    : ``
}`,
              ) || this),
            (a.code = n),
            typeof Error.captureStackTrace == `function` && Error.captureStackTrace(a, t),
            a
          );
        }
        return t;
      })(Error)),
      (Jm = (function (e) {
        qf(t, e);
        function t(t, n) {
          return e.call(this, Km.UNSUPPORTED_FORMATTER, t, n) || this;
        }
        return t;
      })(qm)),
      (Ym = (function (e) {
        qf(t, e);
        function t(t, n) {
          return e.call(this, Km.INVALID_CONFIG, t, n) || this;
        }
        return t;
      })(qm)),
      (Xm = (function (e) {
        qf(t, e);
        function t(t, n) {
          return e.call(this, Km.MISSING_DATA, t, n) || this;
        }
        return t;
      })(qm)),
      (Zm = (function (e) {
        qf(t, e);
        function t(t, n, r) {
          var i =
            e.call(
              this,
              Km.FORMAT_ERROR,
              `${t}
Locale: ${n}
`,
              r,
            ) || this;
          return ((i.locale = n), i);
        }
        return t;
      })(qm)),
      (Qm = (function (e) {
        qf(t, e);
        function t(t, n, r, i) {
          var a =
            e.call(
              this,
              `${t}
MessageID: ${r?.id}
Default Message: ${r?.defaultMessage}
Description: ${r?.description}
`,
              n,
              i,
            ) || this;
          return ((a.descriptor = r), (a.locale = n), a);
        }
        return t;
      })(Zm)),
      ($m = (function (e) {
        qf(t, e);
        function t(t, n) {
          var r =
            e.call(
              this,
              Km.MISSING_TRANSLATION,
              `Missing message: "${t.id}" for locale "${n}", using ${
                t.defaultMessage
                  ? `default message (${
                      typeof t.defaultMessage == `string`
                        ? t.defaultMessage
                        : t.defaultMessage
                            .map(function (e) {
                              return e.value ?? JSON.stringify(e);
                            })
                            .join()
                    })`
                  : `id`
              } as fallback.`,
            ) || this;
          return ((r.descriptor = t), r);
        }
        return t;
      })(qm)));
  });
function th(e, t, n) {
  if ((n === void 0 && (n = Error), !e)) throw new n(t);
}
function nh(e, t, n) {
  return (
    n === void 0 && (n = {}),
    t.reduce(function (t, r) {
      return (r in e ? (t[r] = e[r]) : r in n && (t[r] = n[r]), t);
    }, {})
  );
}
function rh() {
  return {
    dateTime: {},
    number: {},
    message: {},
    relativeTime: {},
    pluralRules: {},
    list: {},
    displayNames: {},
  };
}
function ih(e) {
  return {
    create: function () {
      return {
        get: function (t) {
          return e[t];
        },
        set: function (t, n) {
          e[t] = n;
        },
      };
    },
  };
}
function ah(e) {
  e === void 0 && (e = rh());
  var t = Intl.RelativeTimeFormat,
    n = Intl.ListFormat,
    r = Intl.DisplayNames,
    i = $f(
      function () {
        for (var e, t = [], n = 0; n < arguments.length; n++) t[n] = arguments[n];
        return new ((e = Intl.DateTimeFormat).bind.apply(e, Yf([void 0], t, !1)))();
      },
      { cache: ih(e.dateTime), strategy: up.variadic },
    ),
    a = $f(
      function () {
        for (var e, t = [], n = 0; n < arguments.length; n++) t[n] = arguments[n];
        return new ((e = Intl.NumberFormat).bind.apply(e, Yf([void 0], t, !1)))();
      },
      { cache: ih(e.number), strategy: up.variadic },
    ),
    o = $f(
      function () {
        for (var e, t = [], n = 0; n < arguments.length; n++) t[n] = arguments[n];
        return new ((e = Intl.PluralRules).bind.apply(e, Yf([void 0], t, !1)))();
      },
      { cache: ih(e.pluralRules), strategy: up.variadic },
    );
  return {
    getDateTimeFormat: i,
    getNumberFormat: a,
    getMessageFormat: $f(
      function (e, t, n, r) {
        return new Um(
          e,
          t,
          n,
          V(
            { formatters: { getNumberFormat: a, getDateTimeFormat: i, getPluralRules: o } },
            r || {},
          ),
        );
      },
      { cache: ih(e.message), strategy: up.variadic },
    ),
    getRelativeTimeFormat: $f(
      function () {
        for (var e = [], n = 0; n < arguments.length; n++) e[n] = arguments[n];
        return new (t.bind.apply(t, Yf([void 0], e, !1)))();
      },
      { cache: ih(e.relativeTime), strategy: up.variadic },
    ),
    getPluralRules: o,
    getListFormat: $f(
      function () {
        for (var e = [], t = 0; t < arguments.length; t++) e[t] = arguments[t];
        return new (n.bind.apply(n, Yf([void 0], e, !1)))();
      },
      { cache: ih(e.list), strategy: up.variadic },
    ),
    getDisplayNames: $f(
      function () {
        for (var e = [], t = 0; t < arguments.length; t++) e[t] = arguments[t];
        return new (r.bind.apply(r, Yf([void 0], e, !1)))();
      },
      { cache: ih(e.displayNames), strategy: up.variadic },
    ),
  };
}
function oh(e, t, n, r) {
  var i = e && e[t],
    a;
  if ((i && (a = i[n]), a)) return a;
  r(new Jm(`No ${t} format named: ${n}`));
}
var sh,
  ch,
  lh,
  uh = o(() => {
    (Zf(),
      dp(),
      Gm(),
      eh(),
      (sh = function (e) {}),
      (ch = function (e) {}),
      (lh = {
        formats: {},
        messages: {},
        timeZone: void 0,
        defaultLocale: `en`,
        defaultFormats: {},
        fallbackOnEmptyString: !0,
        onError: sh,
        onWarn: ch,
      }));
  });
function dh(e, t) {
  return Object.keys(e).reduce(function (n, r) {
    return ((n[r] = V({ timeZone: t }, e[r])), n);
  }, {});
}
function fh(e, t) {
  return Object.keys(V(V({}, e), t)).reduce(function (n, r) {
    return ((n[r] = V(V({}, e[r] || {}), t[r] || {})), n);
  }, {});
}
function ph(e, t) {
  if (!t) return e;
  var n = Um.formats;
  return V(V(V({}, n), e), {
    date: fh(dh(n.date, t), dh(e.date || {}, t)),
    time: fh(dh(n.time, t), dh(e.time || {}, t)),
  });
}
var mh,
  hh = o(() => {
    (Zf(),
      Dm(),
      Gm(),
      eh(),
      uh(),
      (mh = function (e, t, n, r, i) {
        var a = e.locale,
          o = e.formats,
          s = e.messages,
          c = e.defaultLocale,
          l = e.defaultFormats,
          u = e.fallbackOnEmptyString,
          d = e.onError,
          f = e.timeZone,
          p = e.defaultRichTextElements;
        n === void 0 && (n = { id: `` });
        var m = n.id,
          h = n.defaultMessage;
        th(
          !!m,
          `[@formatjs/intl] An \`id\` must be provided to format a message. You can either:
1. Configure your build toolchain with [babel-plugin-formatjs](https://formatjs.github.io/docs/tooling/babel-plugin)
or [@formatjs/ts-transformer](https://formatjs.github.io/docs/tooling/ts-transformer) OR
2. Configure your \`eslint\` config to include [eslint-plugin-formatjs](https://formatjs.github.io/docs/tooling/linter#enforce-id)
to autofix this issue`,
        );
        var g = String(m),
          _ = s && Object.prototype.hasOwnProperty.call(s, g) && s[g];
        if (Array.isArray(_) && _.length === 1 && _[0].type === wp.literal) return _[0].value;
        if (!r && _ && typeof _ == `string` && !p) return _.replace(/'\{(.*?)\}'/gi, `{$1}`);
        if (((r = V(V({}, p), r || {})), (o = ph(o, f)), (l = ph(l, f)), !_)) {
          if (u === !1 && _ === ``) return _;
          if (((!h || (a && a.toLowerCase() !== c.toLowerCase())) && d(new $m(n, a)), h))
            try {
              var v = t.getMessageFormat(h, c, l, i);
              return v.format(r);
            } catch (e) {
              return (
                d(
                  new Qm(
                    `Error formatting default message for: "${g}", rendering default message verbatim`,
                    a,
                    n,
                    e,
                  ),
                ),
                typeof h == `string` ? h : g
              );
            }
          return g;
        }
        try {
          var v = t.getMessageFormat(_, a, o, V({ formatters: t }, i || {}));
          return v.format(r);
        } catch (e) {
          d(
            new Qm(
              `Error formatting message: "${g}", using ${h ? `default message` : `id`} as fallback.`,
              a,
              n,
              e,
            ),
          );
        }
        if (h)
          try {
            var v = t.getMessageFormat(h, c, l, i);
            return v.format(r);
          } catch (e) {
            d(
              new Qm(
                `Error formatting the default message for: "${g}", rendering message verbatim`,
                a,
                n,
                e,
              ),
            );
          }
        return typeof _ == `string` ? _ : typeof h == `string` ? h : g;
      }));
  });
function gh(e, t, n, r) {
  var i = e.locale,
    a = e.formats,
    o = e.onError,
    s = e.timeZone;
  r === void 0 && (r = {});
  var c = r.format,
    l = V(V({}, s && { timeZone: s }), c && oh(a, t, c, o)),
    u = nh(r, Sh, l);
  return (
    t === `time` &&
      !u.hour &&
      !u.minute &&
      !u.second &&
      !u.timeStyle &&
      !u.dateStyle &&
      (u = V(V({}, u), { hour: `numeric`, minute: `numeric` })),
    n(i, u)
  );
}
function _h(e, t) {
  for (var n = [], r = 2; r < arguments.length; r++) n[r - 2] = arguments[r];
  var i = n[0],
    a = n[1],
    o = a === void 0 ? {} : a,
    s = typeof i == `string` ? new Date(i || 0) : i;
  try {
    return gh(e, `date`, t, o).format(s);
  } catch (t) {
    e.onError(new Zm(`Error formatting date.`, e.locale, t));
  }
  return String(s);
}
function vh(e, t) {
  for (var n = [], r = 2; r < arguments.length; r++) n[r - 2] = arguments[r];
  var i = n[0],
    a = n[1],
    o = a === void 0 ? {} : a,
    s = typeof i == `string` ? new Date(i || 0) : i;
  try {
    return gh(e, `time`, t, o).format(s);
  } catch (t) {
    e.onError(new Zm(`Error formatting time.`, e.locale, t));
  }
  return String(s);
}
function yh(e, t) {
  for (var n = [], r = 2; r < arguments.length; r++) n[r - 2] = arguments[r];
  var i = n[0],
    a = n[1],
    o = n[2],
    s = o === void 0 ? {} : o,
    c = typeof i == `string` ? new Date(i || 0) : i,
    l = typeof a == `string` ? new Date(a || 0) : a;
  try {
    return gh(e, `dateTimeRange`, t, s).formatRange(c, l);
  } catch (t) {
    e.onError(new Zm(`Error formatting date time range.`, e.locale, t));
  }
  return String(c);
}
function bh(e, t) {
  for (var n = [], r = 2; r < arguments.length; r++) n[r - 2] = arguments[r];
  var i = n[0],
    a = n[1],
    o = a === void 0 ? {} : a,
    s = typeof i == `string` ? new Date(i || 0) : i;
  try {
    return gh(e, `date`, t, o).formatToParts(s);
  } catch (t) {
    e.onError(new Zm(`Error formatting date.`, e.locale, t));
  }
  return [];
}
function xh(e, t) {
  for (var n = [], r = 2; r < arguments.length; r++) n[r - 2] = arguments[r];
  var i = n[0],
    a = n[1],
    o = a === void 0 ? {} : a,
    s = typeof i == `string` ? new Date(i || 0) : i;
  try {
    return gh(e, `time`, t, o).formatToParts(s);
  } catch (t) {
    e.onError(new Zm(`Error formatting time.`, e.locale, t));
  }
  return [];
}
var Sh,
  Ch = o(() => {
    (Zf(),
      eh(),
      uh(),
      (Sh = [
        `formatMatcher`,
        `timeZone`,
        `hour12`,
        `weekday`,
        `era`,
        `year`,
        `month`,
        `day`,
        `hour`,
        `minute`,
        `second`,
        `timeZoneName`,
        `hourCycle`,
        `dateStyle`,
        `timeStyle`,
        `calendar`,
        `numberingSystem`,
        `fractionalSecondDigits`,
      ]));
  });
function wh(e, t, n, r) {
  var i = e.locale,
    a = e.onError;
  Intl.DisplayNames ||
    a(
      new km(
        `Intl.DisplayNames is not available in this environment.
Try polyfilling it using "@formatjs/intl-displaynames"
`,
        Om.MISSING_INTL_API,
      ),
    );
  var o = nh(r, Th);
  try {
    return t(i, o).of(n);
  } catch (e) {
    a(new Zm(`Error formatting display name.`, i, e));
  }
}
var Th,
  Eh = o(() => {
    (uh(), Gm(), eh(), (Th = [`style`, `type`, `fallback`, `languageDisplay`]));
  });
function Dh(e) {
  return `${jh}_${e}_${jh}`;
}
function Oh(e, t, n, r) {
  r === void 0 && (r = {});
  var i = kh(e, t, n, r).reduce(function (e, t) {
    var n = t.value;
    return (
      typeof n == `string` && typeof e[e.length - 1] == `string`
        ? (e[e.length - 1] += n)
        : e.push(n),
      e
    );
  }, []);
  return i.length === 1 ? i[0] : i.length === 0 ? `` : i;
}
function kh(e, t, n, r) {
  var i = e.locale,
    a = e.onError;
  (r === void 0 && (r = {}),
    Intl.ListFormat ||
      a(
        new km(
          `Intl.ListFormat is not available in this environment.
Try polyfilling it using "@formatjs/intl-listformat"
`,
          Om.MISSING_INTL_API,
        ),
      ));
  var o = nh(r, Ah);
  try {
    var s = {},
      c = Array.from(n).map(function (e, t) {
        if (typeof e == `object` && e) {
          var n = Dh(t);
          return ((s[n] = e), n);
        }
        return String(e);
      });
    return t(i, o)
      .formatToParts(c)
      .map(function (e) {
        return e.type === `literal` ? e : V(V({}, e), { value: s[e.value] || e.value });
      });
  } catch (e) {
    a(new Zm(`Error formatting list.`, i, e));
  }
  return n;
}
var Ah,
  jh,
  Mh = o(() => {
    (Zf(), Gm(), eh(), uh(), (Ah = [`type`, `style`]), (jh = Date.now()));
  });
function Nh(e, t, n, r) {
  var i = e.locale,
    a = e.onError;
  (r === void 0 && (r = {}),
    Intl.PluralRules ||
      a(
        new km(
          `Intl.PluralRules is not available in this environment.
Try polyfilling it using "@formatjs/intl-pluralrules"
`,
          Om.MISSING_INTL_API,
        ),
      ));
  var o = nh(r, Ph);
  try {
    return t(i, o).select(n);
  } catch (e) {
    a(new Zm(`Error formatting plural.`, i, e));
  }
  return `other`;
}
var Ph,
  Fh = o(() => {
    (Gm(), eh(), uh(), (Ph = [`type`]));
  });
function Ih(e, t, n) {
  var r = e.locale,
    i = e.formats,
    a = e.onError;
  n === void 0 && (n = {});
  var o = n.format,
    s = (!!o && oh(i, `relative`, o, a)) || {};
  return t(r, nh(n, Rh, s));
}
function Lh(e, t, n, r, i) {
  (i === void 0 && (i = {}),
    (r ||= `second`),
    Intl.RelativeTimeFormat ||
      e.onError(
        new km(
          `Intl.RelativeTimeFormat is not available in this environment.
Try polyfilling it using "@formatjs/intl-relativetimeformat"
`,
          Om.MISSING_INTL_API,
        ),
      ));
  try {
    return Ih(e, t, i).format(n, r);
  } catch (t) {
    e.onError(new Zm(`Error formatting relative time.`, e.locale, t));
  }
  return String(n);
}
var Rh,
  zh = o(() => {
    (uh(), Gm(), eh(), (Rh = [`numeric`, `style`]));
  });
function Bh(e, t, n) {
  var r = e.locale,
    i = e.formats,
    a = e.onError;
  n === void 0 && (n = {});
  var o = n.format,
    s = (o && oh(i, `number`, o, a)) || {};
  return t(r, nh(n, Uh, s));
}
function Vh(e, t, n, r) {
  r === void 0 && (r = {});
  try {
    return Bh(e, t, r).format(n);
  } catch (t) {
    e.onError(new Zm(`Error formatting number.`, e.locale, t));
  }
  return String(n);
}
function Hh(e, t, n, r) {
  r === void 0 && (r = {});
  try {
    return Bh(e, t, r).formatToParts(n);
  } catch (t) {
    e.onError(new Zm(`Error formatting number.`, e.locale, t));
  }
  return [];
}
var Uh,
  Wh = o(() => {
    (eh(),
      uh(),
      (Uh = [
        `style`,
        `currency`,
        `unit`,
        `unitDisplay`,
        `useGrouping`,
        `minimumIntegerDigits`,
        `minimumFractionDigits`,
        `maximumFractionDigits`,
        `minimumSignificantDigits`,
        `maximumSignificantDigits`,
        `compactDisplay`,
        `currencyDisplay`,
        `currencySign`,
        `notation`,
        `signDisplay`,
        `unit`,
        `unitDisplay`,
        `numberingSystem`,
        `trailingZeroDisplay`,
        `roundingPriority`,
        `roundingIncrement`,
        `roundingMode`,
      ]));
  });
function Gh(e) {
  return typeof (e ? e[Object.keys(e)[0]] : void 0) == `string`;
}
function Kh(e) {
  e.onWarn &&
    e.defaultRichTextElements &&
    Gh(e.messages || {}) &&
    e.onWarn(`[@formatjs/intl] "defaultRichTextElements" was specified but "message" was not pre-compiled. 
Please consider using "@formatjs/cli" to pre-compile your messages for performance.
For more details see https://formatjs.github.io/docs/getting-started/message-distribution`);
}
function qh(e, t) {
  var n = ah(t),
    r = V(V({}, lh), e),
    i = r.locale,
    a = r.defaultLocale,
    o = r.onError;
  return (
    i
      ? !Intl.NumberFormat.supportedLocalesOf(i).length && o
        ? o(
            new Xm(
              `Missing locale data for locale: "${i}" in Intl.NumberFormat. Using default locale: "${a}" as fallback. See https://formatjs.github.io/docs/react-intl#runtime-requirements for more details`,
            ),
          )
        : !Intl.DateTimeFormat.supportedLocalesOf(i).length &&
          o &&
          o(
            new Xm(
              `Missing locale data for locale: "${i}" in Intl.DateTimeFormat. Using default locale: "${a}" as fallback. See https://formatjs.github.io/docs/react-intl#runtime-requirements for more details`,
            ),
          )
      : (o &&
          o(
            new Ym(
              `"locale" was not configured, using "${a}" as fallback. See https://formatjs.github.io/docs/react-intl/api#intlshape for more details`,
            ),
          ),
        (r.locale = r.defaultLocale || `en`)),
    Kh(r),
    V(V({}, r), {
      formatters: n,
      formatNumber: Vh.bind(null, r, n.getNumberFormat),
      formatNumberToParts: Hh.bind(null, r, n.getNumberFormat),
      formatRelativeTime: Lh.bind(null, r, n.getRelativeTimeFormat),
      formatDate: _h.bind(null, r, n.getDateTimeFormat),
      formatDateToParts: bh.bind(null, r, n.getDateTimeFormat),
      formatTime: vh.bind(null, r, n.getDateTimeFormat),
      formatDateTimeRange: yh.bind(null, r, n.getDateTimeFormat),
      formatTimeToParts: xh.bind(null, r, n.getDateTimeFormat),
      formatPlural: Nh.bind(null, r, n.getPluralRules),
      formatMessage: mh.bind(null, r, n),
      $t: mh.bind(null, r, n),
      formatList: Oh.bind(null, r, n.getListFormat),
      formatListToParts: kh.bind(null, r, n.getListFormat),
      formatDisplayName: wh.bind(null, r, n.getDisplayNames),
    })
  );
}
var Jh = o(() => {
    (Zf(), Ch(), Eh(), eh(), Mh(), hh(), Wh(), Fh(), zh(), uh());
  }),
  Yh = o(() => {
    (Qf(), uh(), eh(), hh(), Ch(), Eh(), Mh(), Fh(), zh(), Wh(), Jh());
  });
function Xh(e, t, n) {
  if ((n === void 0 && (n = Error), !e)) throw new n(t);
}
function Zh(e) {
  Xh(
    e,
    "[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.",
  );
}
function Qh(e) {
  return function (t) {
    return e(rg(t));
  };
}
function $h(e, t) {
  if (e === t) return !0;
  if (!e || !t) return !1;
  var n = Object.keys(e),
    r = Object.keys(t),
    i = n.length;
  if (r.length !== i) return !1;
  for (var a = 0; a < i; a++) {
    var o = n[a];
    if (e[o] !== t[o] || !Object.prototype.hasOwnProperty.call(t, o)) return !1;
  }
  return !0;
}
var eg,
  tg,
  ng,
  rg,
  ig = o(() => {
    (Zf(),
      (eg = u(Bf())),
      Yh(),
      (tg = V(V({}, lh), { textComponent: eg.Fragment })),
      (ng = function (e, t) {
        return eg.isValidElement(e) ? eg.cloneElement(e, { key: t }) : e;
      }),
      (rg = function (e) {
        return eg.Children.map(e, ng) ?? [];
      }));
  }),
  ag = s((e) => {
    var t = typeof Symbol == `function` && Symbol.for,
      n = t ? Symbol.for(`react.element`) : 60103,
      r = t ? Symbol.for(`react.portal`) : 60106,
      i = t ? Symbol.for(`react.fragment`) : 60107,
      a = t ? Symbol.for(`react.strict_mode`) : 60108,
      o = t ? Symbol.for(`react.profiler`) : 60114,
      s = t ? Symbol.for(`react.provider`) : 60109,
      c = t ? Symbol.for(`react.context`) : 60110,
      l = t ? Symbol.for(`react.async_mode`) : 60111,
      u = t ? Symbol.for(`react.concurrent_mode`) : 60111,
      d = t ? Symbol.for(`react.forward_ref`) : 60112,
      f = t ? Symbol.for(`react.suspense`) : 60113,
      p = t ? Symbol.for(`react.suspense_list`) : 60120,
      m = t ? Symbol.for(`react.memo`) : 60115,
      h = t ? Symbol.for(`react.lazy`) : 60116,
      g = t ? Symbol.for(`react.block`) : 60121,
      _ = t ? Symbol.for(`react.fundamental`) : 60117,
      v = t ? Symbol.for(`react.responder`) : 60118,
      y = t ? Symbol.for(`react.scope`) : 60119;
    function b(e) {
      if (typeof e == `object` && e) {
        var t = e.$$typeof;
        switch (t) {
          case n:
            switch (((e = e.type), e)) {
              case l:
              case u:
              case i:
              case o:
              case a:
              case f:
                return e;
              default:
                switch (((e &&= e.$$typeof), e)) {
                  case c:
                  case d:
                  case h:
                  case m:
                  case s:
                    return e;
                  default:
                    return t;
                }
            }
          case r:
            return t;
        }
      }
    }
    function x(e) {
      return b(e) === u;
    }
    ((e.AsyncMode = l),
      (e.ConcurrentMode = u),
      (e.ContextConsumer = c),
      (e.ContextProvider = s),
      (e.Element = n),
      (e.ForwardRef = d),
      (e.Fragment = i),
      (e.Lazy = h),
      (e.Memo = m),
      (e.Portal = r),
      (e.Profiler = o),
      (e.StrictMode = a),
      (e.Suspense = f),
      (e.isAsyncMode = function (e) {
        return x(e) || b(e) === l;
      }),
      (e.isConcurrentMode = x),
      (e.isContextConsumer = function (e) {
        return b(e) === c;
      }),
      (e.isContextProvider = function (e) {
        return b(e) === s;
      }),
      (e.isElement = function (e) {
        return typeof e == `object` && !!e && e.$$typeof === n;
      }),
      (e.isForwardRef = function (e) {
        return b(e) === d;
      }),
      (e.isFragment = function (e) {
        return b(e) === i;
      }),
      (e.isLazy = function (e) {
        return b(e) === h;
      }),
      (e.isMemo = function (e) {
        return b(e) === m;
      }),
      (e.isPortal = function (e) {
        return b(e) === r;
      }),
      (e.isProfiler = function (e) {
        return b(e) === o;
      }),
      (e.isStrictMode = function (e) {
        return b(e) === a;
      }),
      (e.isSuspense = function (e) {
        return b(e) === f;
      }),
      (e.isValidElementType = function (e) {
        return (
          typeof e == `string` ||
          typeof e == `function` ||
          e === i ||
          e === u ||
          e === o ||
          e === a ||
          e === f ||
          e === p ||
          (typeof e == `object` &&
            !!e &&
            (e.$$typeof === h ||
              e.$$typeof === m ||
              e.$$typeof === s ||
              e.$$typeof === c ||
              e.$$typeof === d ||
              e.$$typeof === _ ||
              e.$$typeof === v ||
              e.$$typeof === y ||
              e.$$typeof === g))
        );
      }),
      (e.typeOf = b));
  }),
  og = s((e, t) => {
    t.exports = ag();
  }),
  sg = s((e, t) => {
    var n = og(),
      r = {
        childContextTypes: !0,
        contextType: !0,
        contextTypes: !0,
        defaultProps: !0,
        displayName: !0,
        getDefaultProps: !0,
        getDerivedStateFromError: !0,
        getDerivedStateFromProps: !0,
        mixins: !0,
        propTypes: !0,
        type: !0,
      },
      i = { name: !0, length: !0, prototype: !0, caller: !0, callee: !0, arguments: !0, arity: !0 },
      a = { $$typeof: !0, render: !0, defaultProps: !0, displayName: !0, propTypes: !0 },
      o = { $$typeof: !0, compare: !0, defaultProps: !0, displayName: !0, propTypes: !0, type: !0 },
      s = {};
    ((s[n.ForwardRef] = a), (s[n.Memo] = o));
    function c(e) {
      return n.isMemo(e) ? o : s[e.$$typeof] || r;
    }
    var l = Object.defineProperty,
      u = Object.getOwnPropertyNames,
      d = Object.getOwnPropertySymbols,
      f = Object.getOwnPropertyDescriptor,
      p = Object.getPrototypeOf,
      m = Object.prototype;
    function h(e, t, n) {
      if (typeof t != `string`) {
        if (m) {
          var r = p(t);
          r && r !== m && h(e, r, n);
        }
        var a = u(t);
        d && (a = a.concat(d(t)));
        for (var o = c(e), s = c(t), g = 0; g < a.length; ++g) {
          var _ = a[g];
          if (!i[_] && !(n && n[_]) && !(s && s[_]) && !(o && o[_])) {
            var v = f(t, _);
            try {
              l(e, _, v);
            } catch {}
          }
        }
      }
      return e;
    }
    t.exports = h;
  }),
  cg,
  lg,
  ug,
  dg,
  fg,
  pg = o(() => {
    (sg(),
      (cg = u(Bf())),
      (lg =
        typeof window < `u` && !window.__REACT_INTL_BYPASS_GLOBAL_CONTEXT__
          ? window.__REACT_INTL_CONTEXT__ ||
            (window.__REACT_INTL_CONTEXT__ = cg.createContext(null))
          : cg.createContext(null)),
      lg.Consumer,
      (ug = lg.Provider),
      (dg = ug),
      (fg = lg));
  });
function mg() {
  var e = hg.useContext(fg);
  return (Zh(e), e);
}
var hg,
  gg = o(() => {
    ((hg = u(Bf())), ig(), pg());
  });
function _g(e) {
  return (
    e &&
    Object.keys(e).reduce(function (t, n) {
      var r = e[n];
      return ((t[n] = Fm(r) ? Qh(r) : r), t);
    }, {})
  );
}
var vg,
  yg,
  bg = o(() => {
    (Zf(),
      Yh(),
      Gm(),
      ig(),
      (vg = function (e, t, n, r) {
        for (var i = [], a = 4; a < arguments.length; a++) i[a - 4] = arguments[a];
        var o = _g(r),
          s = mh.apply(void 0, Yf([e, t, n, o], i, !1));
        return Array.isArray(s) ? rg(s) : s;
      }),
      (yg = function (e, t) {
        var n = e.defaultRichTextElements,
          r = Jf(e, [`defaultRichTextElements`]),
          i = _g(n),
          a = qh(V(V(V({}, tg), r), { defaultRichTextElements: i }), t),
          o = {
            locale: a.locale,
            timeZone: a.timeZone,
            fallbackOnEmptyString: a.fallbackOnEmptyString,
            formats: a.formats,
            defaultLocale: a.defaultLocale,
            defaultFormats: a.defaultFormats,
            messages: a.messages,
            onError: a.onError,
            defaultRichTextElements: i,
          };
        return V(V({}, a), {
          formatMessage: vg.bind(null, o, a.formatters),
          $t: vg.bind(null, o, a.formatters),
        });
      }));
  });
function xg(e, t) {
  var n = e.values,
    r = Jf(e, [`values`]),
    i = t.values,
    a = Jf(t, [`values`]);
  return $h(i, n) && $h(r, a);
}
function Sg(e) {
  var t = mg(),
    n = t.formatMessage,
    r = t.textComponent,
    i = r === void 0 ? Cg.Fragment : r,
    a = e.id,
    o = e.description,
    s = e.defaultMessage,
    c = e.values,
    l = e.children,
    u = e.tagName,
    d = u === void 0 ? i : u,
    f = e.ignoreTag,
    p = n({ id: a, description: o, defaultMessage: s }, c, { ignoreTag: f });
  return typeof l == `function`
    ? l(Array.isArray(p) ? p : [p])
    : d
      ? Cg.createElement(d, null, p)
      : Cg.createElement(Cg.Fragment, null, p);
}
var Cg,
  wg,
  Tg = o(() => {
    (Zf(),
      (Cg = u(Bf())),
      ig(),
      gg(),
      (Sg.displayName = `FormattedMessage`),
      (wg = Cg.memo(Sg, xg)),
      (wg.displayName = `MemoizedFormattedMessage`));
  });
function Eg(e) {
  return {
    locale: e.locale,
    timeZone: e.timeZone,
    fallbackOnEmptyString: e.fallbackOnEmptyString,
    formats: e.formats,
    textComponent: e.textComponent,
    messages: e.messages,
    defaultLocale: e.defaultLocale,
    defaultFormats: e.defaultFormats,
    onError: e.onError,
    onWarn: e.onWarn,
    wrapRichTextChunksInFragment: e.wrapRichTextChunksInFragment,
    defaultRichTextElements: e.defaultRichTextElements,
  };
}
var Dg,
  Og,
  kg = o(() => {
    (Zf(),
      Yh(),
      (Dg = u(Bf())),
      ig(),
      bg(),
      pg(),
      (Og = (function (e) {
        qf(t, e);
        function t() {
          var t = (e !== null && e.apply(this, arguments)) || this;
          return (
            (t.cache = rh()),
            (t.state = { cache: t.cache, intl: yg(Eg(t.props), t.cache), prevConfig: Eg(t.props) }),
            t
          );
        }
        return (
          (t.getDerivedStateFromProps = function (e, t) {
            var n = t.prevConfig,
              r = t.cache,
              i = Eg(e);
            return $h(n, i) ? null : { intl: yg(i, r), prevConfig: i };
          }),
          (t.prototype.render = function () {
            return (
              Zh(this.state.intl),
              Dg.createElement(dg, { value: this.state.intl }, this.props.children)
            );
          }),
          (t.displayName = `IntlProvider`),
          (t.defaultProps = tg),
          t
        );
      })(Dg.PureComponent)));
  }),
  Ag = o(() => {
    (Tg(), kg(), gg(), Yh(), Zf());
  }),
  jg,
  Mg = o(() => {
    jg = 2147483647;
  });
function Ng(e, t) {
  return observeAnnotationShadowRoots(e, t, {
    mutationObserverConstructor: MutationObserver,
    observerOptions: Fg,
    selector: Pg,
    isElement: F,
    isIgnored: gl,
    shadowEvent: Ig,
  });
}
var Pg,
  Fg,
  Ig,
  Lg = o(() => {
    (Dl(),
      tl(),
      (Pg = `[oai-annotation-container], [oai-annotation-container-text]`),
      (Fg = {
        attributes: !0,
        attributeFilter: [`oai-annotation-container`, `oai-annotation-container-text`],
        childList: !0,
        subtree: !0,
      }),
      (Ig = `codex:annotation-shadow-root-attached`));
  });
function Rg() {
  return createAnnotationDesignControlSync({
    currentPageUrl: fd,
    isSamePageUrl: md,
    resolveFrameDocument: Dc,
    currentDocument: document,
    getDocumentUrl: (e) => e?.location?.href ?? ``,
    isConnected: (e) => e.isConnected,
    getDefaultValue: tf,
    dispatchChange: (e, t) => e.dispatchEvent(new CustomEvent(`oaiannotationcontrolchange`, { bubbles: !0, detail: t })),
  });
}
var Bg = o(() => {
  (pf(), wd(), tl());
});
function Vg() {
  return installAnnotationFramePointerGuard({
    installAcrossFrames: dc,
    mutationObserverConstructor: MutationObserver,
    isElement: F,
    isFrame: ac,
    getFrameWindow: sc,
    isOverlayElement: gl,
  });
}
var Hg = o(() => {
  (Dl(), tl());
});
function Ug(e) {
  let t = e.toLowerCase();
  return t.endsWith(`.localhost`) || Gg.has(t);
}
function Wg(e) {
  let t;
  try {
    t = new URL(e);
  } catch {
    return !1;
  }
  return t.protocol !== `http:` && t.protocol !== `https:` ? !1 : Ug(t.hostname);
}
var Gg,
  Kg = o(() => {
    Gg = new Set([`localhost`, `127.0.0.1`, `0.0.0.0`, `[::1]`, `::1`]);
  });
function qg(e) {
  return isLocalHttpUrl(e);
  /* istanbul ignore next -- retained generated implementation for source parity reference */
  return Wg(e);
}
var Jg = o(() => {
  Kg();
});
function Yg({ getElementAtPoint: e, onInvalidated: t, onRenderingFailed: n }) {
  return createAnnotationSurfaceRegistry({
    documentRef: document,
    windowRef: window,
    mutationObserverConstructor: MutationObserver,
    responseEvent: $g.responseEvent,
    requestEvent: $g.requestEvent,
    maxPayloadLength: $g.maxPayloadLength,
    deadlineMs: $g.deadlineMs,
    isValidSurface: Zg,
    getElementAtPoint: e,
    parseResponse: (detail) => {
      try {
        const parsed = Xd.safeParse(JSON.parse(detail));
        return parsed.success ? parsed.data : undefined;
      } catch { return undefined; }
    },
    createRequestId: () => Rl(),
    clipRect: Qg,
    normalizeName: Xo,
    normalizeRole: Kd,
    sanitizeMetadata: Zo,
    dispatchRequest: (target, payload) => Xg(target, payload),
    isResponseEvent: (event) => isAnnotationSurfaceResponseEvent(event, CustomEvent),
    onInvalidated: t,
    onRenderingFailed: n,
  });
  /* istanbul ignore next -- retained generated implementation for source parity reference */
  let r = new Map(),
    i = new WeakSet(),
    a = Rl(),
    o = 0,
    s = null,
    c = !1,
    l = !1;
  document.addEventListener($g.responseEvent, v);
  let u = new MutationObserver(() => {
    for (let e of r.keys())
      Zg(e) || (r.delete(e), r.size === 0 && u.disconnect(), s?.element === e && h(), t(e));
  });
  function d(e) {
    if (c || !Zg(e)) return !1;
    if (!r.has(e) && !i.has(e)) {
      (i.add(e), (l = !0));
      try {
        Xg(e, { type: `probe` });
      } finally {
        l = !1;
      }
    }
    return r.has(e);
  }
  function f(e, t) {
    if ((h(), !d(e) || !p(e, t))) return Promise.resolve(void 0);
    let n = r.get(e);
    if (n == null) return Promise.resolve(void 0);
    let i = `${a}-${++o}`;
    return new Promise((r) => {
      ((s = {
        element: e,
        registrationId: n.id,
        requestId: i,
        point: { ...t },
        surfaceRect: e.getBoundingClientRect(),
        timer: setTimeout(h, $g.deadlineMs),
        finish: r,
      }),
        Xg(e, { type: `hit-test`, registrationId: n.id, requestId: i, x: t.x, y: t.y }));
    });
  }
  function p(t, n) {
    let r = Qg(t, t.getBoundingClientRect());
    return (
      r != null &&
      Number.isFinite(n.x) &&
      Number.isFinite(n.y) &&
      n.x >= r.x &&
      n.y >= r.y &&
      n.x <= r.x + r.width &&
      n.y <= r.y + r.height &&
      e(n) === t
    );
  }
  function m(e, t, n) {
    let i = r.get(e);
    return c || !Zg(e) || i?.id !== t || !i.customRendering
      ? !1
      : (Xg(e, { type: `render`, registrationId: t, ...n }), i.customRendering);
  }
  function h() {
    if (s == null) return;
    let e = s;
    ((s = null), clearTimeout(e.timer), e.finish(void 0), Xg(document, { type: `cancel` }));
  }
  function g() {
    (h(), c || Xg(document, { type: `clear` }));
  }
  function _() {
    (g(), (c = !0), u.disconnect(), r.clear(), document.removeEventListener($g.responseEvent, v));
  }
  function v(e) {
    if (
      c ||
      !(e instanceof CustomEvent) ||
      typeof e.detail != `string` ||
      e.detail.length > $g.maxPayloadLength ||
      !(e.target instanceof Element) ||
      !Zg(e.target)
    )
      return;
    let i;
    try {
      i = Xd.safeParse(JSON.parse(e.detail));
    } catch {
      return;
    }
    if (!i.success) return;
    let a = e.target,
      o = i.data;
    if (o.type === `registered`) {
      let e = r.get(a);
      (r.size === 0 && u.observe(document, { childList: !0, subtree: !0 }),
        r.set(a, { id: o.registrationId, customRendering: o.customRendering === !0 }),
        !l && e?.id !== o.registrationId && (s?.element === a && h(), t(a)));
      return;
    }
    let d = r.get(a);
    if (d?.id !== o.registrationId) return;
    if (o.type === `rendering-failed`) {
      ((d.customRendering = !1), n?.(a));
      return;
    }
    if (o.type === `invalidated` || o.type === `disposed`) {
      (o.type === `disposed` && (r.delete(a), r.size === 0 && u.disconnect()),
        s?.element === a && h(),
        t(a));
      return;
    }
    if (
      s == null ||
      s.element !== a ||
      s.registrationId !== o.registrationId ||
      s.requestId !== o.requestId
    )
      return;
    let f = s;
    ((s = null), clearTimeout(f.timer));
    let m = a.getBoundingClientRect();
    if (
      m.x !== f.surfaceRect.x ||
      m.y !== f.surfaceRect.y ||
      m.width !== f.surfaceRect.width ||
      m.height !== f.surfaceRect.height ||
      !p(a, f.point)
    ) {
      f.finish(void 0);
      return;
    }
    if (o.hit == null) {
      f.finish(o.hit);
      return;
    }
    let g = o.hit.rect == null ? void 0 : Qg(a, o.hit.rect);
    if (o.hit.rect != null && g == null) {
      f.finish(void 0);
      return;
    }
    f.finish({
      registrationId: d.id,
      id: o.hit.id,
      name: Xo(o.hit.name),
      role: Kd(o.hit.role),
      metadata: Zo(o.hit.metadata),
      rect: g ?? void 0,
      customRendering: d.customRendering,
    });
  }
  return { hasSurface: d, hitTest: f, renderSelection: m, cancel: h, clear: g, dispose: _ };
}
function Xg(e, t) {
  return dispatchAnnotationSurfaceRequest(e, $g.requestEvent, t, CustomEvent);
}
function Zg(e) {
  return (
    window === window.top &&
    globalThis.isSecureContext &&
    e instanceof HTMLElement &&
    !(e instanceof HTMLIFrameElement) &&
    e.isConnected &&
    e.ownerDocument === document &&
    e.getRootNode() === document
  );
}
function Qg(e, t) {
  let n = e.getBoundingClientRect();
  return clipAnnotationSurfaceRect(n, t, { width: window.innerWidth, height: window.innerHeight });
}
var $g,
  e_ = o(() => {
    (Zd(), $s(), Bl(), ($g = qd));
  });
function t_({ rootHost: e, onClearDomHover: t, onFeedback: n, onSelected: r, onFallback: i }) {
  let a = !1,
    o = 0,
    s = null,
    c = null,
    l = null,
    u = null,
    d = null,
    f = !1,
    p = null,
    m = null,
    h = null,
    g = null,
    _ = () => {
      let e = m?.getBoundingClientRect();
      e != null && h != null && (e.width !== h.width || e.height !== h.height) && ((h = e), C());
    },
    v = Yg({
      getElementAtPoint: x,
      onInvalidated: (e) => {
        (d == null || d.element === e) && w();
      },
      onRenderingFailed: (e) => {
        (d ?? u)?.element === e && n(p);
      },
    }),
    y = () => {
      document.visibilityState === `hidden` && ie();
    };
  return (
    window.addEventListener(`resize`, C),
    document.addEventListener(`scroll`, C, !0),
    document.addEventListener(`visibilitychange`, y),
    window.addEventListener(`pagehide`, ie),
    window.visualViewport?.addEventListener(`resize`, C),
    window.visualViewport?.addEventListener(`scroll`, C),
    {
      setEnabled(e) {
        a !== e && ((a = e), e || ie());
      },
      hasSurfaceAtPoint(e) {
        return b(e) != null;
      },
      hover(e) {
        return f || d != null
          ? !0
          : ((l = e), b(e) == null ? (re(), !1) : ((o += 1), v.cancel(), S(), !0));
      },
      select(e) {
        let n = b(e);
        if (n == null) return (ie(), !1);
        (ie(), te(n), (f = !0));
        let s = o;
        return (
          v.hitTest(n, e).then((u) => {
            if (!a || s !== o) return;
            if (((f = !1), u === void 0 || b(e) !== n)) {
              i(e, !0);
              return;
            }
            if ((t(), u == null)) {
              l = e;
              return;
            }
            d = { element: n, hit: u, point: e };
            let p = d;
            (ee(d, !0),
              (c = window.requestAnimationFrame(() => {
                if (!a || d !== p) {
                  c = null;
                  return;
                }
                c = window.requestAnimationFrame(() => {
                  ((c = null), a && d === p && r(createVirtualAnnotationTarget({ hit: p.hit, point: p.point, pageUrl: fd(), title: document.title, viewportWidth: window.innerWidth }), p.element));
                });
              })));
          }),
          !0
        );
      },
      clearHover: re,
      clear: ie,
      invalidate: C,
      dispose() {
        (ie(),
          v.dispose(),
          g?.disconnect(),
          window.removeEventListener(`resize`, C),
          document.removeEventListener(`scroll`, C, !0),
          document.removeEventListener(`visibilitychange`, y),
          window.removeEventListener(`pagehide`, ie),
          window.visualViewport?.removeEventListener(`resize`, C),
          window.visualViewport?.removeEventListener(`scroll`, C));
      },
    }
  );
  function b(e) {
    if (!a || document.visibilityState === `hidden`) return null;
    let t = x(e);
    return t != null && v.hasSurface(t) ? t : null;
  }
  function x(t) {
    return hl(t.x, t.y, e, `design`, !1);
  }
  function S() {
    s != null ||
      f ||
      d != null ||
      l == null ||
      (s = window.requestAnimationFrame(() => {
        s = null;
        let e = l,
          r = e == null ? null : b(e);
        if (e == null || r == null) return;
        let c = o;
        (te(r),
          v.hitTest(r, e).then((s) => {
            if (a && c === o && !f && d == null) {
              if ((ne(), (p = null), n(null), s === void 0 || b(e) !== r)) {
                i(e, !1);
                return;
              }
              (t(), s != null && ((u = { element: r, hit: s, point: e }), ee(u, !1)));
            }
          }));
      }));
  }
  function ee(e, t) {
    ((p = { point: e.point, rect: e.hit.rect ?? null, selected: t }),
      n(
        v.renderSelection(e.element, e.hit.registrationId, {
          hoveredId: t ? null : e.hit.id,
          selectedId: t ? e.hit.id : null,
        })
          ? null
          : p,
      ));
  }
  function C() {
    if (c != null) {
      ie();
      return;
    }
    (ne(), w());
  }
  function w() {
    if (
      ((o += 1), v.cancel(), (f = !1), (p = null), n(null), d != null && !v.hasSurface(d.element))
    ) {
      ie();
      return;
    }
    (u != null &&
      !v.renderSelection(u.element, u.hit.registrationId, {
        hoveredId: u.hit.id,
        selectedId: null,
      }) &&
      ne(),
      S());
  }
  function te(e) {
    m !== e &&
      ((g ??= new ResizeObserver(_)),
      g.disconnect(),
      (m = e),
      (h = e.getBoundingClientRect()),
      g.observe(e));
  }
  function ne() {
    u != null &&
      (v.renderSelection(u.element, u.hit.registrationId, { hoveredId: null, selectedId: null }),
      (u = null));
  }
  function re() {
    ((l = null),
      !(d != null || f) &&
        ((o += 1),
        v.cancel(),
        s != null && (window.cancelAnimationFrame(s), (s = null)),
        ne(),
        (p = null),
        n(null)));
  }
  function ie() {
    ((f = !1),
      (d = null),
      c != null && (window.cancelAnimationFrame(c), (c = null)),
      re(),
      v.clear(),
      g?.disconnect(),
      (m = null),
      (h = null));
  }
}
function n_({ hit: e, point: t }) {
  return {
    kind: `virtual`,
    surfaceId: e.registrationId,
    targetId: e.id,
    elementName: e.name,
    elementMetadata: e.metadata,
    pageUrl: fd(),
    frameUrl: null,
    framePath: [],
    title: e.name ?? document.title,
    elementPath: `virtual object`,
    selector: null,
    role: e.role ?? null,
    name: null,
    nearbyText: null,
    isFixed: !0,
    point: { xPercent: (t.x / window.innerWidth) * 100, y: t.y },
    rect: e.rect ?? { x: t.x, y: t.y, width: 1, height: 1 },
  };
}
var r_ = o(() => {
  (Dl(), wd(), e_());
});
function i_(e, t, { preserveTyping: n }) {
  return interceptAnnotationSpaceKey(e, t, n, (value) => F(value));
  /* istanbul ignore next -- retained generated implementation for source parity reference */
  if (
    e.isTrusted &&
    e.code === `Space` &&
    !(
      !t &&
      (e.isComposing ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        (n &&
          e
            .composedPath()
            .some(
              (e) =>
                F(e) &&
                (e.isContentEditable ||
                  e.closest(
                    `input,textarea,select,[role='textbox'],[data-codex-composer],[data-codex-terminal]`,
                  ) != null),
            )))
    )
  )
    return (e.preventDefault(), e.stopImmediatePropagation(), e.type === `keydown`);
}
var a_ = o(() => {
  tl();
});
function o_(
  e,
  {
    viewport: t = { width: window.innerWidth, height: window.innerHeight },
    viewportScale: n,
    zoomFactor: r = 1,
  } = {},
) {
  return Ss(e, { viewport: t, viewportScale: n, zoomFactor: r });
}
function s_(e) {
  return unionAnnotationRects(e);
}
function c_(e, t = dd(e), n = null) {
  return annotationAnchorGeometry.resolveAnchorClipRect(e, t, n);
  /* istanbul ignore next -- retained generated implementation for source parity reference */
  if (t == null) return null;
  let r = k_(t, { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight });
  if (r == null) return null;
  let i = document,
    a = window;
  for (let t of e.framePath) {
    let e = Tc(i, t);
    if (e == null || ((r = T_(r, e)), r == null)) return null;
    let n = e.getBoundingClientRect(),
      o = Ic(a);
    if (
      ((r = k_(r, { x: o.x + n.left, y: o.y + n.top, width: n.width, height: n.height })),
      r == null)
    )
      return null;
    let s = sc(e);
    if (s == null) return null;
    ((a = s), (i = s.document));
  }
  let o = Ic(a),
    s =
      n?.isConnected === !0 && n.ownerDocument === i
        ? n
        : e.kind === `element` && e.selector != null
          ? Ec(i, e.selector)
          : null,
    c = s == null ? null : E_(s, a);
  for (let t of e.scrollContainers ?? []) {
    let e = Ec(i, t.selector);
    if (e == null || (c != null && !c.has(e))) continue;
    let n = a.getComputedStyle(e);
    if (
      ((r = A_(r, O_(e, o), {
        x: isClippingAnnotationOverflow(n.overflowX || n.overflow),
        y: isClippingAnnotationOverflow(n.overflowY || n.overflow),
      })),
      r == null)
    )
      return null;
  }
  return r;
}
function l_(e) {
  return annotationAnchorGeometry.resolveElementFrameGeometry(e);
  /* istanbul ignore next -- retained generated implementation for source parity reference */
  let t = e.ownerDocument.defaultView;
  if (t == null) return null;
  let n = e.getBoundingClientRect(),
    r = { x: n.x, y: n.y, width: n.width, height: n.height },
    i = { x: 0, y: 0, width: t.innerWidth, height: t.innerHeight },
    a = {
      x: e.offsetWidth > 0 ? n.width / e.offsetWidth : 1,
      y: e.offsetHeight > 0 ? n.height / e.offsetHeight : 1,
    },
    o = e;
  for (; i != null && t != null;) {
    if (((i = T_(i, o, { x: 0, y: 0 }, !0)), i == null)) return null;
    if (t === window) return { rect: r, clipRect: i, radiusScale: a };
    let e = t.frameElement;
    if (!ac(e) || !e.isConnected) return null;
    let n = e.getBoundingClientRect(),
      s = {
        x: e.offsetWidth > 0 ? n.width / e.offsetWidth : 1,
        y: e.offsetHeight > 0 ? n.height / e.offsetHeight : 1,
      },
      c = (t) => ({
        x: n.x + (e.clientLeft + t.x) * s.x,
        y: n.y + (e.clientTop + t.y) * s.y,
        width: t.width * s.x,
        height: t.height * s.y,
      });
    ((r = c(r)),
      (i = k_(c(i), {
        x: n.x + e.clientLeft * s.x,
        y: n.y + e.clientTop * s.y,
        width: e.clientWidth * s.x,
        height: e.clientHeight * s.y,
      })),
      (a.x *= s.x),
      (a.y *= s.y),
      (o = e));
    let l = e.ownerDocument.defaultView;
    if (l == null) return null;
    t = l;
  }
  return null;
}
function u_(e, t, { framePath: n = [], frameUrl: r = null } = {}) {
  return annotationAnchorGeometry.buildRegionAnchor(e, t, { framePath: n, frameUrl: r });
  /* istanbul ignore next -- retained generated implementation for source parity reference */
  let i = wc(n) ?? window,
    a = Ic(i),
    o = { x: t.x - a.x, y: t.y - a.y },
    s = { x: e.x - a.x, y: e.y - a.y, width: e.width, height: e.height },
    c = jc(i, o),
    l = fd(),
    u = new Xl(l).getRegionDocumentContext({
      documentTitle: document.title,
      fallbackWindow: window,
      frameWindow: i,
      viewportRect: s,
    });
  return {
    kind: `region`,
    pageUrl: l,
    frameUrl: r,
    title: `Selected browser region`,
    elementPath: `browser region`,
    point: { xPercent: (o.x / i.innerWidth) * 100, y: o.y + i.scrollY },
    rect: { x: s.x, y: s.y + i.scrollY, width: s.width, height: s.height },
    isFixed: !1,
    role: null,
    name: null,
    selector: null,
    framePath: n,
    nearbyText: null,
    documentContext: u,
    ...(c.length === 0 ? {} : { scrollContainers: c }),
  };
}
function d_(e) {
  let t = j_(e.anchor, e.markerViewportPoint);
  return resolveAnnotationCanvasSize(e.viewportSize, t);
}
function f_() {
  return resolveAnnotationThemeVariant(window);
}
function p_() {
  return readAnnotationViewportSize(window);
}
function m_(e, t, n, r) {
  return getAnnotationElementOverlayClassName(e, t, n, r, {
    isAnchorOnCurrentPage: (anchor) => N_(anchor),
    isRectLargeEnough: (rect, width, height) => P_(rect, width, height),
  });
}
function h_(e, t = C_(), { includeElementFrameScroll: n = !1, markerPointInset: r = I_ } = {}) {
  return annotationAnchorGeometry.resolveMarkerPoint(e, t, { includeElementFrameScroll: n, markerPointInset: r });
  /* istanbul ignore next -- retained generated implementation for source parity reference */
  let i = wc(e.framePath),
    a = Nc(e, i ?? window),
    o = a.x + _u(e, i ?? window);
  if (e.kind !== `element` && i != null && i !== window) {
    let n = Ic(i);
    return {
      x: F_(n.x + (e.point.xPercent / 100) * i.innerWidth - o, r, t.width - r),
      y: n.y + e.point.y - (e.isFixed ? 0 : i.scrollY) - a.y,
    };
  }
  let s = n && e.kind === `element` && i != null && i !== window ? i.scrollY : 0;
  return {
    x: F_((e.point.xPercent / 100) * t.width - o, r, t.width - r),
    y: (e.isFixed ? e.point.y : e.point.y - t.scrollY - s) - a.y,
  };
}
function g_(e, t) {
  return overrideAnnotationViewportSize(e, t);
}
function __(e, t, { includeElementFrameScroll: n = !1, viewportSize: r, zoomFactor: i }) {
  return annotationAnchorGeometry.resolveViewportPoint(e, r, { includeElementFrameScroll: n, zoomFactor: i });
  /* istanbul ignore next -- retained generated implementation for source parity reference */
  let a = h_(e, g_(t, r), { includeElementFrameScroll: n, markerPointInset: I_ / i });
  return { x: a.x * i, y: a.y * i };
}
function v_(e, t, n) {
  let r = dd(e),
    i =
      r == null
        ? null
        : k_(r, { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight }),
    a = c_(e, r, n.liveElement);
  if (a == null || i == null) return null;
  let o = __(e, t, n),
    s = a.x !== i.x || a.width !== i.width,
    c = a.y !== i.y || a.height !== i.height,
    l = w_(a, n.zoomFactor);
  return (!s || (o.x >= l.x && o.x <= l.x + l.width)) &&
    (!c || (o.y >= l.y && o.y <= l.y + l.height))
    ? o
    : null;
}
function y_(e, t, n) {
  let r = g_(C_(), n),
    i = I_ / t,
    a = h_(e, r, { markerPointInset: i });
  return { x: a.x, y: F_(a.y, i, r.height - i) };
}
function b_(e, t, n, r) {
  return M_(e, t, n, r)
    ? `posted-region-highlight google-docs-annotation-box google-docs-region-box`
    : `posted-region-highlight`;
}
function x_(e, t, n) {
  return annotationAnchorGeometry.buildBoxStyle(e, t, n);
  /* istanbul ignore next -- retained generated implementation for source parity reference */
  let r = w_(e, t);
  return { borderRadius: n, left: r.x, top: r.y, width: r.width, height: r.height };
}
function S_(e, t, n, r) {
  return M_(e, t, n, r)
    ? `hover-box region-box google-docs-annotation-box google-docs-region-box`
    : `hover-box region-box`;
}
function C_() {
  return readAnnotationViewportState(window);
}
function w_(e, t) {
  return scaleAnnotationRect(e, t);
}
function T_(e, t, n = Ic(t.ownerDocument.defaultView ?? window), r = !1) {
  let i = t.ownerDocument.defaultView ?? window,
    a = e,
    o = E_(t, i),
    s = ic(t);
  for (; s != null && s !== i.document.body && s !== i.document.documentElement;) {
    if (!o.has(s)) {
      s = ic(s);
      continue;
    }
    let e = i.getComputedStyle(s),
      t = isClippingAnnotationOverflow(e.overflowX || e.overflow),
      c = isClippingAnnotationOverflow(e.overflowY || e.overflow);
    if ((t || c) && ((a = A_(a, O_(s, n, r), { x: t, y: c })), a == null)) return null;
    s = ic(s);
  }
  return a;
}
function E_(e, t) {
  let n = new Set(),
    r = e;
  for (; r != null;) {
    let e = t.getComputedStyle(r).position,
      i = ic(r);
    if (e === `absolute` || e === `fixed`)
      for (
        ;
        i != null &&
        i !== t.document.body &&
        i !== t.document.documentElement &&
        !D_(t.getComputedStyle(i), e);
      )
        i = ic(i);
    if (i == null || i === t.document.body || i === t.document.documentElement) break;
    (n.add(i), (r = i));
  }
  return n;
}
function D_(e, t) {
  return (t === `absolute` && e.position != null && e.position !== `` && e.position !== `static`) ||
    [e.transform, e.translate, e.rotate, e.scale, e.perspective, e.filter, e.backdropFilter].some(
      (e) => e != null && e !== `` && e !== `none`,
    ) ||
    e.contentVisibility === `auto` ||
    (e.containerType != null && e.containerType !== `` && e.containerType !== `normal`) ||
    e.contain.split(/\s+/).some((e) => [`content`, `layout`, `paint`, `strict`].includes(e))
    ? !0
    : e.willChange
        .split(/\s*,\s*/)
        .some((e) =>
          [
            `backdrop-filter`,
            `contain`,
            `filter`,
            `perspective`,
            `rotate`,
            `scale`,
            `transform`,
            `translate`,
          ].includes(e),
        );
}
function O_(e, t, n = !1) {
  let r = e.getBoundingClientRect(),
    i = n && e.offsetWidth > 0 ? r.width / e.offsetWidth : 1,
    a = n && e.offsetHeight > 0 ? r.height / e.offsetHeight : 1;
  return {
    x: t.x + r.left + e.clientLeft * i,
    y: t.y + r.top + e.clientTop * a,
    width: e.clientWidth * i,
    height: e.clientHeight * a,
  };
}
function k_(e, t) {
  return A_(e, t, { x: !0, y: !0 });
}
function A_(e, t, n) {
  return intersectAnnotationRect(e, t, n);
}
function j_(e, t) {
  return inferAnnotationMarkerViewportSize(
    e,
    t,
    { width: window.innerWidth, height: window.innerHeight },
    I_,
  );
}
function M_(e, t, n, r) {
  return N_(e) && P_(t, n, r);
}
function N_(e) {
  return isAnnotationAnchorOnCurrentPage(e, fd(), { isGoogleDocsAnchor: (anchor) => Xl.isGoogleDocsAnchor(anchor), samePageUrl: gs });
}
function P_(e, t, n) {
  return isAnnotationRectLargeEnough(e, t, n, L_, R_, isLargeAnnotationRect);
}
function F_(e, t, n) {
  return clampAnnotationCoordinate(e, t, n);
}
var I_,
  L_,
  R_,
  z_ = o(() => {
    ($s(), wd(), tl(), Zl(), td(), (I_ = 16 + Zs / 2), (L_ = 0.45), (R_ = 0.3));
  });
var {
  buildAnnotationAnchorPayload: buildAnnotationAnchorPayload,
  createAnnotationAnchorSelection: createAnnotationAnchorSelection,
  createAnnotationAnchorState: createAnnotationAnchorState,
  mergeAnnotationAnchorState: mergeAnnotationAnchorState,
  replaceAnnotationSelection: replaceAnnotationSelection,
  resolveAnnotationAnchorValue: resolveAnnotationAnchorValue,
  resolveAnnotationLiveElement: resolveAnnotationLiveElement,
  resolveAnnotationSelection: resolveAnnotationSelection,
  splitAnnotationAnchorState: splitAnnotationAnchorState,
} = require("./browser-page-preload/annotation-anchor-state");
var { projectAnnotationDisplaySelections } = require("./browser-page-preload/annotation-display-selections");
var { createAnnotationEditorAnchorState, normalizeAnnotationEditorPlacement } = require("./browser-page-preload/annotation-editor-view-state");
var { projectAnnotationMarkerViewState, projectAnnotationDraftViewState, projectAnnotationCommentViewState } = require("./browser-page-preload/annotation-marker-view-state");
function markerViewStateDeps() {
  return {
    readViewportSize: p_,
    readViewportRect: dd,
    resolveTextAnchor: lu,
    resolveMarkerPoint: (anchor, zoomFactor) => y_(anchor, zoomFactor),
    isElementConnected: (element) => element?.isConnected === true,
    readElementRect: cd,
    refreshElementAnchor: ad,
    readThemeVariant: f_,
    resolveLiveElement: (anchor, id) => sd(anchor, void 0, id),
    readCardViewportRect: o_,
    readCommentTheme: (comment) => comment?.themeVariant,
    projectAdditionalAnchor: (selection, viewportSize) => q_(selection, viewportSize),
  };
}
function B_(e, t, n) {
  return createAnnotationAnchorState(e, t, {
    resolveThemeVariant: f_,
    readViewportSize: p_,
    resolveLiveElement: (anchor, id) => sd(anchor, void 0, id === undefined ? n : id),
  });
}
function V_(e, t) {
  return createAnnotationAnchorSelection(e, { resolveLiveElement: (anchor, id) => sd(anchor, void 0, id === undefined ? t : id) });
}
function H_(e, t) {
  return buildAnnotationAnchorPayload(e, { resolveLiveElement: (anchor) => sd(anchor, void 0, t) });
}
function U_(e) {
  return resolveAnnotationAnchorValue(e, { refreshElement: (element, anchor, viewportSize) => Y_(element, anchor, viewportSize) });
}
function W_(e, t) {
  return resolveAnnotationLiveElement(e, {
    isConnected: (element) => element?.isConnected === true,
    ownerDocumentMatches: (element, framePath) => element.ownerDocument === Dc(framePath),
    resolveElement: (anchor) => sd(anchor, void 0, t),
  });
}
function G_(e) {
  return splitAnnotationAnchorState(e);
}
function K_(e, t, n) {
  return mergeAnnotationAnchorState(e, t, n);
}
function q_(e, t) {
  return resolveAnnotationSelection(e, { refreshElement: (element, anchor, viewportSize) => Y_(element, anchor, viewportSize) }, t);
}
function J_(
  e,
  t,
  { clipToVisibleArea: n = !1, selectionIndexOffset: r = 0, viewportSize: i } = {},
) {
  return projectAnnotationDisplaySelections(e, t, { clipToVisibleArea: n, selectionIndexOffset: r, viewportSize: i }, {
    resolveSelection: (selection, viewportSize) => q_(selection, viewportSize),
    resolveLiveElementRect: (element) => nd(element),
    getRect: (anchor) => dd(anchor),
    clipRect: (anchor, rect, element) => c_(anchor, rect, element),
    getClassName: (anchor, rect, width, height) => anchor.kind === `region` ? S_(anchor, rect, width, height) : m_(anchor, rect, width, height),
    isPageAnnotation: (anchor) => rd(anchor),
  });
}
function Y_(e, t, n) {
  return e == null || !e.isConnected ? t : ad(e, t, n);
}
var X_ = o(() => {
  (wd(), z_(), tl());
});
function Z_(e, t) {
  return e.anchor.kind === `element` ? sd(e.anchor, e.id, t) : null;
}
function Q_(e, t, n = !1, r = null) {
  return resolveAnnotationDisplayAnchors(e, t, n, r, {
    getViewportSize: d_,
    resolveElement: sd,
    isCurrentPage: (pageUrl) => md(pageUrl, fd()),
    refreshElementAnchor: ad,
  });
}
function $_(e, t, n) {
  if (e.anchor.kind === `text` || t.kind === `text`) return e;
  return replaceAnnotationSelection(e, t, n);
}
var ev = o(() => {
  (wd(), z_());
});
function tv(e, t, n) {
  return createAnnotationEditorAnchorState(e, { x: t, y: n }, {
    readViewportSize: p_,
    readElementRect: cd,
    buildAnchor: id,
    isFixed: Ac,
    readThemeVariant: f_,
  });
}
function nv(e, t) {
  return normalizeAnnotationEditorPlacement(e, t, {
    isCurrentPage: (pageUrl) => md(pageUrl, fd()),
    isTextAnchorResolved: (anchor) => lu(anchor) != null,
    clipAnchor: c_,
  });
}
function rv(e, t, n) {
  return projectAnnotationMarkerViewState(e, n, markerViewStateDeps(), t);
  /* istanbul ignore next -- retained generated implementation for source parity reference */
  if (e.anchor.kind === `text`) return lu(e.anchor) ?? iv(e.anchor, n, e.themeVariant);
  if (e.anchor.kind === `region` || e.anchor.kind === `virtual`)
    return {
      ...iv(e.anchor, n, e.themeVariant),
      additionalAnchors: e.additionalAnchors?.length ? e.additionalAnchors : void 0,
    };
  let r = p_(),
    i = t == null ? e.anchor : ad(t, e.anchor, r, e.markerViewportPoint),
    a = y_(i, n);
  return {
    anchor: i,
    additionalAnchors: e.additionalAnchors?.length ? e.additionalAnchors : void 0,
    themeVariant: e.themeVariant ?? f_(),
    viewportRect: t == null ? dd(e.anchor) : cd(t),
    viewportPoint: a,
    viewportSize: r,
  };
}
function iv(e, t, n) {
  return projectAnnotationMarkerViewState({ anchor: e, themeVariant: n }, t, markerViewStateDeps());
  /* istanbul ignore next -- retained generated implementation for source parity reference */
  let r = C_();
  return {
    anchor: e,
    themeVariant: n ?? f_(),
    viewportRect: dd(e),
    viewportPoint: y_(e, t),
    viewportSize: { width: r.width, height: r.height },
  };
}
function av(e, t, n) {
  return projectAnnotationDraftViewState(e, t, n, markerViewStateDeps());
  /* istanbul ignore next -- retained generated implementation for source parity reference */
  if (e.anchor.type === `text`)
    return lu(e.anchor.value) ?? iv(e.anchor.value, t, e.anchor.themeVariant);
  if (e.anchor.type === `region` || e.anchor.type === `virtual`) {
    let n = p_();
    return {
      ...iv(e.anchor.value, t, e.anchor.themeVariant),
      additionalAnchors: e.anchor.additionalSelections.map((e) => q_(e, n)),
    };
  }
  let r = e.anchor.element?.isConnected ? e.anchor.element : null,
    i = r == null ? null : cd(r),
    a = p_(),
    o = r == null ? e.anchor.value : ad(r, e.anchor.value, a);
  return {
    anchor: o,
    additionalAnchors: e.anchor.additionalSelections.map((e) => q_(e, a)),
    cardViewportRect:
      e.target.mode === `design`
        ? (e.anchor.cardViewportRect ??
          (i == null ? void 0 : o_(i, { viewportScale: n, zoomFactor: t })))
        : void 0,
    themeVariant: e.anchor.themeVariant ?? f_(),
    viewportRect: i,
    viewportPoint: y_(o, t),
    viewportSize: a,
  };
}
function ov(e, t, n, r) {
  if (e.target.mode !== `edit`) return null;
  return projectAnnotationCommentViewState(e, t, n, r, markerViewStateDeps(), W_(e.anchor, n));
  /* istanbul ignore next -- retained generated implementation for source parity reference */
  let i = e.target;
  if (i.mode !== `edit`) return null;
  let a = t.find((e) => e.id === i.commentId) ?? null;
  if (a == null) return null;
  if (e.anchor.type === `text`)
    return lu(e.anchor.value) ?? iv(e.anchor.value, r, a.themeVariant ?? e.anchor.themeVariant);
  if (e.anchor.type === `region` || e.anchor.type === `virtual`) {
    let t = p_();
    return {
      ...iv(e.anchor.value, r, a.themeVariant ?? e.anchor.themeVariant),
      additionalAnchors: e.anchor.additionalSelections.map((e) => q_(e, t)),
    };
  }
  let o = W_(e.anchor, n),
    s = p_(),
    c = o == null ? e.anchor.value : ad(o, e.anchor.value, s, e.anchor.markerViewportPoint);
  return {
    anchor: c,
    additionalAnchors: e.anchor.additionalSelections.map((e) => q_(e, s)),
    themeVariant: a.themeVariant,
    viewportRect: o == null ? dd(c) : cd(o),
    viewportPoint: y_(c, r),
    viewportSize: s,
  };
}
var sv = o(() => {
  (X_(), wd(), tl(), td(), z_());
});
var { annotationClassNames: lv } = require("./browser-page-preload/annotation-class-names");
var uv = o(() => {}),
  dv,
  fv,
  pv,
  mv = o(() => {
    ((dv = [0.4, 0, 0.2, 1]),
      (fv = { rotate: 0, y: 0, scale: 1 }),
      (pv = { duration: 0.52, ease: dv, times: [0, 0.22, 0.72, 1] }),
      { ...pv },
      { ...pv },
      { ...fv });
  }),
  hv,
  gv = o(() => {
    (mv(), (hv = [0.23, 1, 0.32, 1]));
  });
function _v(
  e,
  {
    viewport: t = { width: window.innerWidth, height: window.innerHeight },
    viewportScale: n,
    zoomFactor: r = 1,
  } = {},
) {
  let i = Ss(e, { viewport: t, viewportScale: n, zoomFactor: r });
  return xs(n) === 1
    ? { left: i.x, top: i.y, width: i.width }
    : { height: i.height, left: i.x, top: i.y, width: i.width };
}
var vv,
  yv,
  W,
  bv,
  xv,
  Sv,
  Cv,
  wv,
  Tv = o(() => {
    ($s(),
      gv(),
      (vv = `#000000`),
      (yv = `#0069FB`),
      (W = {
        ...Xs,
        fill: `#0285FF`,
        hotspotByMode: {
          add: { x: Xs.width / 2, y: Xs.height / 2 },
          comment: Xs.hotspot,
          text: { x: 7, y: 13.5 },
        },
        path: `M12.6504 0.824799C6.21496 0.824799 0.825466 5.77554 0.825195 12.0885C0.825245 14.2375 1.46183 16.2421 2.55176 17.943L2.02148 20.235L1.99316 20.3756C1.77603 21.655 2.78945 22.7791 4.02832 22.7691L4.0791 22.8209L4.53418 22.7047L7.12305 22.0426C8.77593 22.8778 10.6577 23.3531 12.6504 23.3531C19.086 23.3531 24.4754 18.4014 24.4756 12.0885C24.4753 5.77554 19.0858 0.824799 12.6504 0.824799Z`,
        stroke: `white`,
        strokeWidth: 1.65,
      }),
      (bv = (W.hotspotByMode.comment.x / W.width) * 100),
      (xv = ((W.hotspotByMode.comment.y + (W.width - W.height) / 2) / W.width) * 100),
      (Sv = `translate(-${bv}%,-${xv}%)`),
      (Cv = {
        position: `fixed`,
        inset: 0,
        pointerEvents: `none`,
        fontSize: `13px`,
        fontFamily: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
      }),
      (wv = `
.hover-box{position:fixed;box-sizing:border-box;border-radius:0;border:2px solid ${yv};background:color-mix(in srgb,${yv} 3%,transparent);box-shadow:inset 0 0 0 1px rgba(255,255,255,.28);pointer-events:none}
.text-selection-highlight{position:fixed;box-sizing:border-box;background:#128dff66;pointer-events:none}
.flex-item-overlay{position:fixed;box-sizing:border-box;border-radius:0;border:1px solid rgba(2,133,255,.52);background:rgba(18,141,255,.18);box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);pointer-events:none}
.interaction-layer{position:fixed;inset:0;z-index:0;width:100vw;height:100vh;max-width:none;max-height:none;margin:0;border:0;padding:0;background:transparent;pointer-events:none}
.interaction-layer::backdrop{background:transparent}
.interaction-blocker{position:absolute;inset:0;z-index:0;pointer-events:auto;touch-action:pan-x pan-y}
.annotation-selection-cursor{position:fixed;z-index:1;display:block}
.annotation-selection-modifier-cursor{z-index:2;color:${vv};paint-order:stroke fill;stroke:${W.stroke};stroke-linejoin:round;stroke-width:2px}
.annotation-selection-comment-cursor{overflow:visible}
.annotation-selection-comment-cursor[data-browser-comment-annotation-selection-cursor-mode="text"]{z-index:2}
.annotation-selection-cursor-bubble{transform:translate(0,0) scale(1);transform-box:view-box;transform-origin:0 0;transition:transform 150ms cubic-bezier(${hv.join(`,`)})}
.annotation-selection-cursor-beam{opacity:0;transition:opacity 150ms cubic-bezier(${hv.join(`,`)})}
[data-browser-comment-annotation-selection-cursor-mode="text"] .annotation-selection-cursor-bubble{transform:translate(${12 + W.hotspotByMode.comment.x - W.hotspotByMode.text.x}px,${-2 + W.hotspotByMode.comment.y - W.hotspotByMode.text.y}px) scale(.55)}
[data-browser-comment-annotation-selection-cursor-mode="text"] .annotation-selection-cursor-beam{opacity:1}
@media(prefers-reduced-motion:reduce){.annotation-selection-cursor-bubble,.annotation-selection-cursor-beam{transition:none}}
[data-browser-comment-annotation-selection-modifier-active] .marker{cursor:none}
.annotation-selection-target-hover{border-color:color-mix(in srgb,${yv} 80%,black)}
.annotation-selection-remove-hover{background:color-mix(in srgb,${yv} 20%,transparent)}
.region-box{border-width:2px;border-style:dashed}
.posted-region-highlight{position:fixed;box-sizing:border-box;border-radius:0;background:color-mix(in srgb,${yv} 3%,transparent);pointer-events:none}
.google-docs-annotation-box{background:transparent;box-shadow:none}
.google-docs-element-box{border-color:transparent}
.markers-layer{position:fixed;inset:0;z-index:1;pointer-events:none}
.marker{position:fixed;border:0;background:transparent;transform:${Sv};transform-origin:${bv}% ${xv}%;pointer-events:auto;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}
.marker-icon{position:absolute;inset:0;display:block;width:100%;height:100%;pointer-events:none}
.saved-marker{width:var(--browser-sidebar-saved-marker-size);height:var(--browser-sidebar-saved-marker-size)}
.draft-marker{width:var(--browser-sidebar-draft-marker-size);height:var(--browser-sidebar-draft-marker-size)}
.marker-label{position:relative;color:${W.stroke};font-size:var(--browser-sidebar-marker-label-font-size);font-weight:700;line-height:1;pointer-events:none;transform:translate(var(--browser-sidebar-marker-label-offset),var(--browser-sidebar-marker-label-offset))}
.marker[data-selected="true"]{transform:${Sv} scale(1.08)}
${Ys}
`));
  }),
  Ev = s((e) => {
    var t = Symbol.for(`react.transitional.element`),
      n = Symbol.for(`react.fragment`);
    function r(e, n, r) {
      var i = null;
      if ((r !== void 0 && (i = `` + r), n.key !== void 0 && (i = `` + n.key), `key` in n))
        for (var a in ((r = {}), n)) a !== `key` && (r[a] = n[a]);
      else r = n;
      return (
        (n = r.ref),
        { $$typeof: t, type: e, key: i, ref: n === void 0 ? null : n, props: r }
      );
    }
    ((e.Fragment = n), (e.jsx = r), (e.jsxs = r));
  }),
  Dv = s((e, t) => {
    t.exports = Ev();
  });
function Ov({ className: e, fillColor: t = W.fill, ...n }) {
  return (0, Pv.jsx)(`svg`, {
    ...n,
    "aria-hidden": `true`,
    className: e,
    height: W.height,
    viewBox: `0 0 ${W.width} ${W.height}`,
    width: W.width,
    children: (0, Pv.jsx)(`path`, {
      d: W.path,
      fill: t,
      stroke: W.stroke,
      strokeWidth: W.strokeWidth,
    }),
  });
}
function kv({ className: e, mode: t, ...n }) {
  return t === `add`
    ? (0, Pv.jsx)(`svg`, {
        ...n,
        "aria-hidden": `true`,
        className: lv(e, `annotation-selection-modifier-cursor`),
        "data-browser-comment-annotation-selection-cursor-mode": t,
        height: W.height,
        viewBox: `0 0 20 20`,
        width: W.width,
        children: (0, Pv.jsx)(`path`, {
          d: `M9.33496 16.5V10.665H3.5C3.13273 10.665 2.83496 10.3673 2.83496 10C2.83496 9.63273 3.13273 9.33496 3.5 9.33496H9.33496V3.5C9.33496 3.13273 9.63273 2.83496 10 2.83496C10.3673 2.83496 10.665 3.13273 10.665 3.5V9.33496H16.5L16.6338 9.34863C16.9369 9.41057 17.165 9.67857 17.165 10C17.165 10.3214 16.9369 10.5894 16.6338 10.6514L16.5 10.665H10.665V16.5C10.665 16.8673 10.3673 17.165 10 17.165C9.63273 17.165 9.33496 16.8673 9.33496 16.5Z`,
          fill: `currentColor`,
        }),
      })
    : (0, Pv.jsxs)(`svg`, {
        ...n,
        "aria-hidden": `true`,
        className: lv(e, `annotation-selection-comment-cursor`),
        "data-browser-comment-annotation-selection-cursor-mode": t,
        height: W.height,
        viewBox: `0 0 ${W.width} ${W.height}`,
        width: W.width,
        children: [
          (0, Pv.jsx)(`g`, {
            className: `annotation-selection-cursor-beam annotation-selection-modifier-cursor`,
            transform: `translate(${W.hotspotByMode.comment.x - W.hotspotByMode.text.x} ${W.hotspotByMode.comment.y - W.hotspotByMode.text.y})`,
            children: (0, Pv.jsx)(`path`, {
              d: `M3 5H5C5.81 5 6.54 5.35 7 5.91C7.46 5.35 8.19 5 9 5H11V6.5H9C8.31 6.5 7.75 7.06 7.75 7.75V19.25C7.75 19.94 8.31 20.5 9 20.5H11V22H9C8.19 22 7.46 21.65 7 21.09C6.54 21.65 5.81 22 5 22H3V20.5H5C5.69 20.5 6.25 19.94 6.25 19.25V7.75C6.25 7.06 5.69 6.5 5 6.5H3Z`,
              fill: `currentColor`,
            }),
          }),
          (0, Pv.jsx)(`path`, {
            className: `annotation-selection-cursor-bubble`,
            d: W.path,
            fill: W.fill,
            stroke: W.stroke,
            strokeWidth: W.strokeWidth,
          }),
        ],
      });
}
function Av({
  additionalHighlights: e,
  highlightBorderRadius: t,
  highlightClassName: n,
  highlightRect: r,
  hoverSnapshot: i,
  isRemoveHover: a,
  linkedSelectionIndex: o,
  viewportHeight: s,
  viewportWidth: c,
  zoomFactor: l,
}) {
  return (0, Pv.jsxs)(Pv.Fragment, {
    children: [
      e.map((e) =>
        (0, Pv.jsx)(
          `div`,
          {
            className: `${e.className}${o === e.selectionIndex ? ` annotation-selection-target-hover` : ``}`,
            "data-browser-comment-annotation-selection-linked-hover":
              o === e.selectionIndex ? e.selectionIndex : void 0,
            style: x_(e.rect, l, e.borderRadius),
          },
          e.key,
        ),
      ),
      r == null
        ? null
        : (0, Pv.jsx)(`div`, {
            className: `${n}${o === 0 ? ` annotation-selection-target-hover` : ``}`,
            "data-browser-comment-annotation-selection-linked-hover": o === 0 ? 0 : void 0,
            style: x_(r, l, t),
          }),
      i == null
        ? null
        : (0, Pv.jsx)(`div`, {
            className: `${m_(null, i.rect, c, s)}${a ? ` annotation-selection-target-hover annotation-selection-remove-hover` : ``}`,
            "data-browser-comment-annotation-selection-hover": !0,
            "data-browser-comment-annotation-selection-remove-hover": a || void 0,
            style: x_(i.rect, l, i.borderRadius),
          }),
    ],
  });
}
function jv({
  commentNumber: e,
  isSelected: t,
  markerPoint: n,
  onClick: r,
  onMouseEnter: i,
  onMouseLeave: a,
}) {
  let o = mg().formatMessage(
    {
      id: `browserSidebarCommentRuntime.commentMarkerLabel`,
      defaultMessage: `Browser comment {commentNumber}`,
      description: `Accessible label for a placed browser comment marker`,
    },
    { commentNumber: e },
  );
  return (0, Pv.jsxs)(`button`, {
    type: `button`,
    "aria-label": o,
    "data-browser-comment-marker": !0,
    className: `marker saved-marker`,
    "data-selected": String(t),
    style: { left: n.x, top: n.y },
    onMouseEnter: i,
    onMouseLeave: a,
    onClick: r,
    children: [
      (0, Pv.jsx)(Ov, { className: `marker-icon`, fillColor: yv }),
      (0, Pv.jsx)(`span`, { className: `marker-label`, children: e }),
    ],
  });
}
function Mv({ commentNumber: e, markerPoint: t, onFocusEditor: n }) {
  let r = mg().formatMessage({
    id: `browserSidebarCommentRuntime.draftCommentMarkerLabel`,
    defaultMessage: `Focus unsaved browser comment`,
    description: `Accessible label for the temporary marker shown while creating a browser comment`,
  });
  return (0, Pv.jsxs)(`button`, {
    type: `button`,
    "aria-label": r,
    "data-browser-comment-draft-marker": !0,
    "data-browser-comment-marker": !0,
    className: `marker draft-marker`,
    "data-selected": `false`,
    style: { left: t.x, top: t.y },
    onClick: (e) => {
      (e.preventDefault(), e.stopPropagation(), n());
    },
    children: [
      (0, Pv.jsx)(Ov, { className: `marker-icon`, fillColor: yv }),
      e == null ? null : (0, Pv.jsx)(`span`, { className: `marker-label`, children: e }),
    ],
  });
}
function Nv({ snapshot: e, viewportScale: t, zoomFactor: n }) {
  let r = projectAnnotationMetadataTooltipRows(e),
    i = r.find((e) => e.kind === `tag`)?.value,
    a = r.find((e) => e.kind === `size`)?.value,
    o = r.find((e) => e.kind === `color`)?.value,
    s = r.find((e) => e.kind === `font`)?.value;
  return (0, Pv.jsxs)(`div`, {
    className: `element-metadata-tooltip`,
    style: _v(e.rect, { viewportScale: t, zoomFactor: n }),
    children: [
      (0, Pv.jsx)(`div`, {
        className: `element-metadata-cell element-metadata-tag`,
        children: i,
      }),
      (0, Pv.jsx)(`div`, {
        className: `element-metadata-cell element-metadata-value`,
        children: a,
      }),
      (0, Pv.jsx)(`div`, {
        className: `element-metadata-cell element-metadata-label`,
        children: (0, Pv.jsx)(wg, {
          id: `browserSidebarCommentRuntime.elementMetadata.color`,
          defaultMessage: `color`,
          description: `Label for the computed text color row in the browser comment hover metadata tooltip`,
        }),
      }),
      (0, Pv.jsx)(`div`, {
        className: `element-metadata-cell element-metadata-value`,
        children: o,
      }),
      (0, Pv.jsx)(`div`, {
        className: `element-metadata-cell element-metadata-label`,
        children: (0, Pv.jsx)(wg, {
          id: `browserSidebarCommentRuntime.elementMetadata.font`,
          defaultMessage: `font`,
          description: `Label for the computed font row in the browser comment hover metadata tooltip`,
        }),
      }),
      (0, Pv.jsx)(`div`, {
        className: `element-metadata-cell element-metadata-value`,
        children: s,
      }),
    ],
  });
}
var Pv,
  Fv = o(() => {
    (uv(), Ag(), z_(), Tv(), (Pv = Dv()));
  });
function Iv(e, t) {
  if (e == null) return !1;
  if (Rv(e, t)) return !0;
  let n = Fc(e),
    r = zv(e, t, n);
  return r == null
    ? n !== window && (n.scrollBy(t.x, t.y), !0)
    : ((r.scrollLeft += t.x), (r.scrollTop += t.y), !0);
}
function Lv(e, t) {
  return normalizeAnnotationWheelDelta(e, t, { lineMode: Hv, pageMode: Uv, lineScale: Wv });
}
function Rv(e, t) {
  let n = e.closest(`#waffle-grid-container`);
  if (!F(n)) return !1;
  let r = n.querySelector(`.native-scrollbar-x`),
    i = n.querySelector(`.native-scrollbar-y`),
    a = !1;
  return (
    F(r) && t.x !== 0 && ((r.scrollLeft += t.x), (a = !0)),
    F(i) && t.y !== 0 && ((i.scrollTop += t.y), (a = !0)),
    a
  );
}
function zv(e, t, n) {
  return findScrollableAnnotationAncestor(e, t, n.document, ic, (element) => n.getComputedStyle(element), isScrollableAnnotationOverflow, canScrollAnnotationAxis);
}
function Bv(e, t, n) {
  let r = n.getComputedStyle(e);
  return (
    (isScrollableAnnotationOverflow(r.overflowY) && Vv(t.y, e.scrollTop, e.clientHeight, e.scrollHeight)) ||
    (isScrollableAnnotationOverflow(r.overflowX) && Vv(t.x, e.scrollLeft, e.clientWidth, e.scrollWidth))
  );
}
function Vv(e, t, n, r) {
  return canScrollAnnotationAxis(e, t, n, r);
}
var Hv,
  Uv,
  Wv,
  Gv = o(() => {
    (tl(), (Hv = 1), (Uv = 2), (Wv = 16));
  });
function Kv(e, t) {
  return dc((n) => {
    let r = () => {
      (Jv(n, e, t), Xv(n, e), Yv(n, e));
    };
    r();
    let i = new MutationObserver(r);
    return (
      i.observe(n.documentElement, Yc),
      () => {
        (i.disconnect(), Qv(n), n.getElementById(ay)?.remove());
        for (let e of n.querySelectorAll(`[${ry}]`)) e.removeAttribute(ry);
      }
    );
  });
}
function qv(e, t) {
  let n = new Set(ny(e));
  (n.add(t), e.setAttribute(ry, Array.from(n).join(` `)));
}
function Jv(e, t, n) {
  let r = collectAnnotationDraftAttributes(t, n, {
    currentPageUrl: window.location.href,
    resolveFrameDocument: Dc,
    isSamePageUrl: md,
    resolveTarget: (t, n) => ud(t, n.anchor),
    isConnected: (e) => e?.isConnected === !0,
    getOwnerDocument: (e) => e?.ownerDocument,
    documentRef: e,
  });
  for (let t of e.querySelectorAll(`[${ry}]`)) F(t) && (ty(t, r.get(t)), r.delete(t));
  for (let [e, t] of r) ty(e, t);
}
function Yv(e, t) {
  let n = Cs(
      t.filter(
        (t) =>
          md(t.anchor.pageUrl, window.location.href) &&
          Dc(t.anchor.framePath) === e &&
          (t.anchor.frameUrl == null || md(t.anchor.frameUrl, e.location.href)),
      ),
      ry,
    ),
    r = e.getElementById(ay);
  if (n.length === 0) {
    r?.remove();
    return;
  }
  let i = r instanceof HTMLStyleElement ? r : e.createElement(`style`);
  ((i.id = ay),
    i.textContent !== n && (i.textContent = n),
    i.parentElement ?? (e.head ?? e.documentElement).append(i));
}
function Xv(e, t) {
  let n = new Map(t.map((e) => [e.draftAttribute, e]));
  for (let t of e.querySelectorAll(`[${ry}], [${iy}]`)) {
    if (!F(t)) continue;
    let e = Zv(
      ny(t)
        .map((e) => n.get(e))
        .filter((e) => e != null),
    );
    if (e == null) {
      $v(t);
      continue;
    }
    (t.hasAttribute(iy) || t.setAttribute(iy, e.previousValue), ey(t, e.value));
  }
}
function Zv(e) {
  return findLatestDraftTextChange(e);
}
function Qv(e) {
  for (let t of e.querySelectorAll(`[${iy}]`)) F(t) && $v(t);
}
function $v(e) {
  let t = e.getAttribute(iy);
  t != null && (ey(e, t), e.removeAttribute(iy));
}
function ey(e, t) {
  e.textContent !== t && (e.textContent = t);
}
function ty(e, t) {
  let n = t == null ? `` : Array.from(t).join(` `);
  if (n.length === 0) {
    e.removeAttribute(ry);
    return;
  }
  e.getAttribute(ry) !== n && e.setAttribute(ry, n);
}
function ny(e) {
  return parseAnnotationAttributeTokens(e.getAttribute(ry));
}
var ry,
  iy,
  ay,
  oy = o(() => {
    ($s(),
      wd(),
      tl(),
      (ry = `data-codex-browser-design-group`),
      (iy = `data-codex-browser-design-original-text`),
      (ay = `codex-browser-design-draft-style`));
  });
function sy(e, t, n, r, i) {
  let a = t.anchor.kind === `virtual`,
    o = a ? null : (i ?? nd(e)),
    s = r?.id ?? globalThis.crypto?.randomUUID?.() ?? `design-${Date.now()}`,
    c = a ? null : fs(e),
    l = r?.annotationControls ?? n,
    u = us(o?.styles ?? [], r?.declarations ?? []),
    d =
      r == null
        ? l?.controls.map((e) => ({
            callback: e.callback,
            previousValue: e.currentValue,
            value: tf(e),
          }))
        : r.annotationControlChanges,
    f =
      c == null
        ? r?.text
        : r?.text == null
          ? c
          : { previousValue: c.previousValue, value: r.text.value };
  return {
    id: s,
    anchor: t.anchor,
    annotationControls: l,
    annotationControlChanges: d,
    declarations: u,
    draftAttribute: r?.draftAttribute ?? s,
    markerViewportPoint: t.viewportPoint,
    provenance: ps(o?.styles ?? []),
    selector: t.anchor.selector,
    targetLabel: t.anchor.kind === `virtual` ? (t.anchor.elementName ?? t.anchor.targetId) : ly(e),
    elementTagName: e.tagName.toLowerCase(),
    text: f,
    ...(r?.themeVariant == null
      ? t.themeVariant == null
        ? {}
        : { themeVariant: t.themeVariant }
      : { themeVariant: r.themeVariant }),
    viewportSize: t.viewportSize,
  };
}
function cy(e) {
  return snapshotAnnotationDesign(e);
}
function ly(e) {
  return getAnnotationTargetLabel(e, { readAccessibleLabel: ld });
}
var uy = o(() => {
  (pf(), $s(), wd());
});
var gy = o(() => {});
function _y({ layer: e, color: t }) {
  return createAnnotationPreviewLayer({ layer: e, color: t }, {
    cssText: vy,
    buildRoundedRectPath: buildAnnotationRoundedRectPath,
    resolveCornerRadii: resolveAnnotationCornerRadii,
  });
}
var vy,
  yy = o(() => {
    (gv(),
      gy(),
      (vy = `
[data-site-annotation-preview]{position:fixed;inset:0;width:auto;height:auto;max-width:none;max-height:none;margin:0;border:0;padding:0;background:transparent;overflow:visible;pointer-events:none;contain:layout style}
[data-site-annotation-preview]::backdrop{background:transparent;pointer-events:none}
.annotation-feature-backdrop{position:absolute;inset:0;pointer-events:none;backdrop-filter:grayscale(1);background:color-mix(in srgb,Canvas 50%,transparent);mask-repeat:no-repeat}
.annotation-feature-clip{position:fixed;overflow:clip;pointer-events:none}
.annotation-feature-glow{position:absolute;pointer-events:none;animation:annotation-preview-appear 150ms ease-out both}
.annotation-feature-glow::before {
  content:"";
  position:absolute;
  inset:0;
  border-radius:inherit;
  box-shadow:0 0 12px color-mix(in srgb,currentColor 32%,transparent),
    inset 0 0 16px color-mix(in srgb,currentColor 20%,transparent);
  filter:blur(3px);
}
@keyframes annotation-preview-appear{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){.annotation-feature-glow{animation:none}}
`));
  });
function by(e) {
  return createAnnotationPreviewVisibilityPredicate(e, {
    getParent: ic,
    isElement: F,
    getFrameElement: (e) => e?.frameElement ?? null,
    getOwnerWindow: (e) => e.ownerDocument?.defaultView,
  });
}
var Cy = o(() => {
  tl();
});
function wy(e) {
  return createAnnotationPreviewController({ mountPreview: (preview) => Ty(e, preview) });
}
function Ty({ shadowRoot: e, getControlTargets: t }, n) {
  let r = document.createElement(`div`);
  ((r.dataset.siteAnnotationPreview = n.feature),
    r.setAttribute(`aria-hidden`, `true`),
    (r.popover = `manual`));
  let i = _y({ layer: r, color: n.color });
  (e.append(r), _c(r, !1));
  let a = !0,
    s = null,
    u = new Map(),
    d = new Set(),
    f = new Map(),
    scheduler = createAnnotationPreviewScheduler({ windowLike: window, isElement: F, onInvalidate: () => { s = null; }, onFrame: y });
  function h() {
    scheduler.invalidate();
  }
  function g() {
    scheduler.schedule();
  }
  function _(e, t) {
    scheduler.setCandidate(e, t);
  }
  function v() {
    let e = new Set(t());
    for (let t of scheduler.getCandidates()) _(t, e.has(t));
    for (let t of e) _(t, t.isConnected && t.ownerDocument === document && !gl(t));
  }
  function y() {
    if (!a) return;
    if (s == null) {
        (n.feature === `controls` && v(),
        (s = { candidates: scheduler.getVisibleCandidates().values(), targets: [], hasMotion: !1, isVisible: by(d) }));
      for (let [e, t] of f) (!t.isConnected || e.playState !== `running`) && f.delete(e);
    }
    let { targets: e } = s,
      t = !1;
    for (let r = 0; r < ky; r++) {
      let r = s.candidates.next();
      if (r.done) {
        t = !0;
        break;
      }
      let i = r.value;
      if (
        ((s.hasMotion = s.hasMotion || Dy(i)),
        !i.isConnected ||
          !s.isVisible(i) ||
          (n.feature === `controls` && u.has(i)) ||
          (n.feature === `containers` && !Ey(i)) ||
          cd(i) == null)
      )
        continue;
      let a = l_(i);
      if (a == null) continue;
      let { rect: o, clipRect: c, radiusScale: l } = a;
      if (
        !(
          o.x + o.width <= c.x ||
          o.y + o.height <= c.y ||
          o.x >= c.x + c.width ||
          o.y >= c.y + c.height
        ) &&
        (e.push({
          element: i,
          rect: o,
          clipRect: c,
          radiusScale: l,
          style: (i.ownerDocument.defaultView ?? window).getComputedStyle(i),
        }),
        e.length === ky)
      ) {
        t = !0;
        break;
      }
    }
    (_c(r, !1),
      i.update(e),
      t
        ? s.hasMotion || e.some(({ element: e }) => Array.from(f.values()).some((t) => Oy(t, e)))
          ? h()
          : (s = null)
        : g());
  }
  function b(e, t, i) {
    let a = new Set(),
      o = new Set(),
      s = !1,
      l = new MutationObserver((t) => {
        s = !1;
        let r = !1;
        for (let e of t)
          if (e.type === `attributes` && F(e.target)) u(e.target);
          else if (e.type === `childList`) {
            r = !0;
            for (let t of e.addedNodes) F(t) && (u(t), f(t));
          }
        if (r) {
          for (let e of scheduler.getCandidates()) e.isConnected || _(e, !1);
          l.disconnect();
          for (let t of a)
            if (t !== e && !t.isConnected) {
              t.removeEventListener(`toggle`, y, !0);
              for (let e of Ny) t.removeEventListener(e, g, !0);
              (a.delete(t), d.delete(t));
            } else l.observe(t, Py);
          for (let e of o) e.isConnected || (o.delete(e), (s = !0));
          (s && i(), n.feature === `controls` && ee());
        }
        h();
      });
    function u(t) {
      if (!gl(t)) {
        if ((ac(t) && !o.has(t) && (o.add(t), (s = !0)), n.feature !== `controls`)) {
          let r = n.feature === `metadata` ? Qo(t.getAttribute(`oai-annotation-metadata`)) : null;
          _(
            t,
            t.hasAttribute(`oai-annotatable`) &&
              t !== e.body &&
              t !== e.documentElement &&
              (n.feature !== `metadata` || (r != null && Object.keys(r).length > 0)),
          );
        }
        t.shadowRoot != null && !a.has(t.shadowRoot) && m(t.shadowRoot);
      }
    }
    function f(e) {
      for (let t of e.querySelectorAll(`*`)) F(t) && u(t);
    }
    function m(e) {
      (a.add(e), d.add(e), l.observe(e, Py), e.addEventListener(`toggle`, y, !0));
      for (let t of Ny) e.addEventListener(t, g, !0);
      f(e);
    }
    function g(e) {
      let n = e.composedPath()[0];
      if (!(F(n) && gl(n))) {
        if (F(n) && (e.type === `animationstart` || e.type === `transitionrun`))
          for (let e of n.getAnimations?.() ?? []) x(e, t);
        (e.type === `load` && ac(e.target) && i(), h());
      }
    }
    function v(e) {
      let t = e.composedPath()[0];
      F(t) && (u(t), i(), h());
    }
    function y(e) {
      let t = e.composedPath()[0];
      (F(t) && gl(t)) || (_c(r, !0), h());
    }
    m(e);
    for (let n of e.getAnimations?.() ?? []) x(n, t);
    let b = e.documentElement;
    return (
      b != null && scheduler.observeDocumentElement(b),
      e.addEventListener(jy, v),
      e.addEventListener(`fullscreenchange`, y),
      t.addEventListener(`resize`, h),
      t.visualViewport?.addEventListener(`resize`, h),
      t.visualViewport?.addEventListener(`scroll`, h),
      () => {
        l.disconnect();
        b != null && scheduler.unobserveDocumentElement(b);
        for (let e of a) {
          (d.delete(e), e.removeEventListener(`toggle`, y, !0));
          for (let t of Ny) e.removeEventListener(t, g, !0);
        }
        (e.removeEventListener(jy, v),
          e.removeEventListener(`fullscreenchange`, y),
          t.removeEventListener(`resize`, h),
          t.visualViewport?.removeEventListener(`resize`, h),
          t.visualViewport?.removeEventListener(`scroll`, h),
          h());
      }
    );
  }
  function x(e, t) {
    let n = e.effect,
      r = t.document.defaultView?.KeyframeEffect;
    if (r == null || !(n instanceof r)) return;
    let i = n.target;
    F(i) &&
      !gl(i) &&
      n.getKeyframes().some((e) => Object.keys(e).some((e) => Ay.test(e))) &&
      f.set(e, i);
  }
  function S(e) {
    if (!(
      !(e instanceof CustomEvent) ||
      typeof e.detail != `string` ||
      e.detail.length > qd.maxPayloadLength ||
      !(e.target instanceof HTMLElement) ||
      !e.target.isConnected ||
      e.target.ownerDocument !== document ||
      e.target.getRootNode() !== document
    ))
      try {
        let t = Xd.safeParse(JSON.parse(e.detail));
        if (!t.success) return;
        (t.data.type === `registered`
          ? u.set(e.target, t.data.registrationId)
          : t.data.type === `disposed` &&
            u.get(e.target) === t.data.registrationId &&
            u.delete(e.target),
          h());
      } catch {}
  }
  function ee() {
    (u.clear(),
      document.dispatchEvent(
        new CustomEvent(qd.requestEvent, { detail: JSON.stringify({ type: `list` }) }),
      ));
  }
  let C = n.feature === `containers` ? dc(b) : b(document, window, () => {});
  if (n.feature === `controls`) {
    for (let e of My) window.addEventListener(e, h);
    (document.addEventListener(qd.responseEvent, S), v(), ee());
  }
  return (
    h(),
    () => {
      ((a = !1), C(), scheduler.dispose());
      for (let e of My) window.removeEventListener(e, h);
      (document.removeEventListener(qd.responseEvent, S), vc(r), i.dispose(), r.remove());
    }
  );
}
function Ey(e) {
  return isStableAnnotationFrame(e, {
    rootWindow: window,
    resolveAnnotationElement: il,
    isFrameElement: ac,
    getFrameElement: (e) => e?.frameElement ?? null,
    getOwnerWindow: (e) => e.ownerDocument?.defaultView,
  });
}
function Dy(e) {
  return hasRunningAnnotationAnimation(e, {
    getParent: ic,
    getFrameElement: (e) => e?.frameElement ?? null,
    isElement: F,
  });
}
function Oy(e, t) {
  return isAnnotationContainedBy(e, t, {
    getOwnerWindow: (e) => e.ownerDocument?.defaultView,
    getComputedStyle: (e, t) => e.getComputedStyle(t),
    getParent: ic,
    getFrameElement: (e) => e?.frameElement ?? null,
    isElement: F,
  });
}
var ky,
  Ay,
  jy,
  My,
  Ny,
  Py,
  Fy = o(() => {
    (Zd(),
      $s(),
      Dl(),
      dl(),
      wd(),
      z_(),
      tl(),
      yy(),
      Cy(),
      (ky = 128),
      (Ay =
        /^(width|height|minWidth|maxWidth|minHeight|maxHeight|margin.*|padding.*|border.*Width|fontSize|fontWeight|lineHeight|letterSpacing|wordSpacing|flex.*|grid.*|gap|rowGap|columnGap|display|position|float|clear|order|align.*|justify.*)$/),
      (jy = `codex:annotation-shadow-root-attached`),
      (My = [
        `codex:register-annotation-controls`,
        `codex:update-annotation-controls`,
        `codex:dispose-annotation-controls`,
      ]),
      (Ny = [
        `scroll`,
        `load`,
        `animationstart`,
        `animationend`,
        `animationcancel`,
        `transitionrun`,
        `transitionend`,
        `transitioncancel`,
      ]),
      (Py = {
        childList: !0,
        subtree: !0,
        characterData: !0,
        attributes: !0,
        attributeFilter: [
          `oai-annotatable`,
          `oai-annotation-container`,
          `oai-annotation-container-text`,
          `oai-annotation-metadata`,
          `class`,
          `style`,
          `hidden`,
          `open`,
        ],
      }));
  });
function Iy(e, t) {
  return readAnnotationEditorDefaultMode(e, t);
}
var Ly = o(() => {});
function Ry({ rootHost: e, onPointerModeChange: t, onPointerChange: n, onClearHover: r }) {
  return createAnnotationPointerSelection(e, { onPointerModeChange: t, onPointerChange: n, onClearHover: r }, {
    resolvePoint: (x, y, rootHost, mode) => hl(x, y, rootHost, mode),
    canStartSelection: (x, y, rootHost) => fl(x, y, rootHost) != null,
    isSelectionBlocked: (element) => By(element),
    clearSelection: () => gu(),
    createHighlight: (windowLike) => mu(windowLike),
    applySelection: (documentLike, nativeSelection, range) => fc(documentLike, wl, nativeSelection, range),
    hideHover: (point, rootHost) => _l(point, rootHost),
    stopEvent: (event, options) => Jc(event, options),
    readSelection: (windowLike) => {
      try {
        return ou(windowLike);
      } catch (error) {
        if (error instanceof DOMException && error.name === `SecurityError`) return null;
        throw error;
      }
    },
    toViewportPoint: (windowLike, point) => Lc(windowLike, point),
  });
}
function zy(e, t, n) {
  let r = n && t != null ? hl(t.x, t.y, e, `text`) : null;
  return dc(
    (e) => (
      fc(e, wl, n, r?.ownerDocument === e ? r : void 0),
      () => {
        pc(e);
      }
    ),
  );
}
function By(e) {
  return isAnnotationSelectionBlocked(e, { getParent: ic, isTextInput: Ju });
}
var Vy = o(() => {
    (Dl(), dl(), tl(), td());
  }),
  Hy = c({
    buildRegionAnchor: () => u_,
    getBrowserCommentElementSnapshot: () => nd,
    getMarkerPoint: () => h_,
    mountBrowserCommentRuntime: () => Uy,
  });
function Uy(e) {
  let t = Jy(),
    n = hc(t, wl, El),
    r = t.shadowRoot ?? t.attachShadow({ mode: `open` });
  r.replaceChildren();
  let i = document.createElement(`div`);
  r.appendChild(i);
  let a = wy({ shadowRoot: r, getControlTargets: () => e.getAnnotationControlTargets?.() ?? [] }),
    o = {
      ...e,
      sendMessageToHost(t) {
        let n = C_().visualViewport;
        if (n == null || !(`anchorState` in t) || t.anchorState == null) {
          e.sendMessageToHost(t);
          return;
        }
        e.sendMessageToHost({ ...t, anchorState: { ...t.anchorState, visualViewport: n } });
      },
    },
    s = (0, ub.createRoot)(i);
  return (
    s.render((0, db.jsx)(Wy, { rootHost: t, bridge: o })),
    {
      setSiteAnnotationPreview: a.setPreview,
      dispose() {
        (a.dispose(), n(), s.unmount(), mc(), t.remove());
      },
    }
  );
}
function Wy({ rootHost: e, bridge: t }) {
  let [n, r] = (0, G.useState)(t.initialState),
    [i] = (0, G.useState)(Rg),
    [a, o] = (0, G.useState)(null),
    [s, c] = (0, G.useState)(null),
    [l, u] = (0, G.useState)(null),
    [d, f] = (0, G.useState)(null),
    [p, m] = (0, G.useState)(!1),
    [h, g] = (0, G.useState)(t.initialState.isDesignModifierPressed === !0),
    [_, v] = (0, G.useState)(null),
    [y, b] = (0, G.useState)(null),
    [x, S] = (0, G.useState)(null),
    [ee, C] = (0, G.useState)(null),
    w = (0, G.useRef)(null),
    [te, ne] = (0, G.useState)(null),
    [re, ie] = (0, G.useState)(null),
    [ae, oe] = (0, G.useState)(null),
    [se, T] = (0, G.useState)(C_),
    E = (0, G.useRef)(null),
    D = (0, G.useRef)(null),
    ce = (0, G.useRef)(null),
    le = (0, G.useRef)(null),
    [ue, de] = (0, G.useState)(() => uu([])),
    O = (0, G.useRef)(null),
    [fe, pe] = (0, G.useState)(!1),
    me = (0, G.useRef)(0),
    he = (0, G.useRef)(null),
    ge = (0, G.useRef)(null),
    _e = (0, G.useRef)(!1),
    ve = (0, G.useRef)(!1),
    ye = (0, G.useRef)(!1),
    be = (0, G.useRef)(!1),
    xe = (0, G.useRef)(!1),
    Se = (0, G.useRef)(!1),
    Ce = (0, G.useRef)(!1),
    we = (0, G.useRef)(null),
    [Te] = (0, G.useState)(() =>
      Ry({
        rootHost: e,
        onPointerModeChange: pe,
        onPointerChange: f,
        onClearHover: () => {
          (o(null), c(null));
        },
      }),
    ),
    { comments: Ee, interactionMode: k } = n,
    { isSuspended: De, canUseSiteAnnotationApi: A, canUseTweaks: Ne } = annotationUiModePolicy(n),
    Oe = n.canUseAnnotationMultiSelect === !0 && x?.anchor.type !== `virtual`,
    ke = A && k === `comment` && !De && x == null && fe,
    j = Pd(n.zoomPercent),
    Ae = xs(n.viewportScale),
    je = fd(),
    Me = qg(je),
    Pe = new Map(Ee.map((e, t) => [e.id, t + 1])),
    Fe = Ee.filter(Qy),
    Ie = eb(e),
    Le = Fe.flatMap((e) => {
      let t = ue.get(e.id),
        n = Q_(e, Ie, e.id === te, t?.sourceAnchor === e.anchor ? t.value : null);
      return n == null ? [] : [n];
    }),
    Re = n.activeDesignChange,
    ze = Ee.flatMap((e) => (e.designChange == null ? [] : [e.designChange])),
    Be = Ne ? (Re == null ? ze : [...ze.filter((e) => e.id !== Re.id), Re]) : xb,
    Ve = n.isOriginalViewEnabled === !0 ? xb : Be,
    He = ss(Ee),
    Ue = Ne && He && n.annotationEditorMode === `design`,
    We = Ve.flatMap((e) => {
      let t = Zy(e, Ie);
      return t == null ? [] : [t];
    }),
    Ge = Le.some((e) => [e.anchor, ...(e.additionalAnchors ?? [])].some((e) => !e.isFixed)),
    Ke = Fe.some((e) =>
      [e.anchor, ...(e.additionalAnchors ?? [])].some(
        (e) => e.kind === `element` && e.selector != null,
      ),
    ),
    qe = (0, G.useCallback)(
      (n, r, a, s) => {
        w.current?.clear();
        let l = { ...r, anchor: od(n, r.anchor, A, s) };
        _ != null &&
          (t.sendMessageToHost({
            type: `browser-sidebar-runtime-close-comment-preview`,
            commentId: _,
          }),
          v(null));
        let u = sy(n, l, A ? t.getAnnotationControls?.(n) : void 0);
        return (
          A && i.rememberTarget(u.id, n),
          eb(e).set(u.id, n),
          t.sendMessageToHost({
            type: `browser-sidebar-runtime-open-editor`,
            target: { mode: `create` },
            anchorState: l,
            annotationEditorDefault: Iy(document, fb),
            designEditorState: u,
            ...a,
          }),
          (be.current = !1),
          m(!1),
          f(null),
          T(C_()),
          S({
            target: { mode: `create` },
            anchor: {
              type: `element`,
              additionalSelections: [],
              element: n,
              themeVariant: l.themeVariant,
              value: l.anchor,
              viewportSize: l.viewportSize,
            },
          }),
          o(null),
          c(null),
          gu(),
          !0
        );
      },
      [i, t, A, _, e],
    ),
    Je = (0, G.useCallback)(
      (e, n) =>
        e.anchor.kind === `text` &&
        (w.current?.clear(),
        _ != null &&
          (t.sendMessageToHost({
            type: `browser-sidebar-runtime-close-comment-preview`,
            commentId: _,
          }),
          v(null)),
        t.sendMessageToHost({
          type: `browser-sidebar-runtime-open-editor`,
          target: { mode: `create` },
          anchorState: e,
          wantsScreenshot: !0,
          ...n,
        }),
        T(C_()),
        S({
          target: { mode: `create` },
          anchor: {
            type: `text`,
            ...(e.themeVariant == null ? {} : { themeVariant: e.themeVariant }),
            value: e.anchor,
          },
        }),
        o(null),
        c(null),
        gu(),
        !0),
      [t, _],
    ),
    Ye = (0, G.useCallback)(
      (n, r, a = 0) => {
        let o = r ?? n.anchor,
          s = eb(e),
          c = Ee.find((e) => e.id === n.id) ?? n,
          l = $_(c, o, a),
          u = a === 0,
          d = sd(o, u ? c.id : void 0, s) ?? null;
        (d != null && (u && s.set(c.id, d), l.designChange != null && qv(d, l.designChange.id)),
          _ != null &&
            t.sendMessageToHost({
              type: `browser-sidebar-runtime-close-comment-preview`,
              commentId: _,
            }));
        let f = nv(rv(l, d, j), d),
          p =
            l.designChange != null && d == null
              ? cy(l.designChange)
              : d == null || f.anchor.kind !== `element`
                ? void 0
                : sy(d, f, A ? t.getAnnotationControls?.(d) : void 0, l.designChange);
        (p != null &&
          d != null &&
          (A &&
            (l.designChange == null ||
              (l.designChange.anchor.kind === `element` &&
                f.anchor.kind === `element` &&
                l.designChange.anchor.runtimeElementId != null &&
                l.designChange.anchor.runtimeElementId === f.anchor.runtimeElementId)) &&
            i.rememberTarget(p.id, d),
          s.set(p.id, d)),
          t.sendMessageToHost({
            type: `browser-sidebar-runtime-open-editor`,
            target: { mode: `edit`, commentId: c.id },
            anchorState: f,
            designEditorState: p,
          }),
          T(C_()),
          S({
            target: { mode: `edit`, commentId: c.id },
            anchor: B_({ ...l, anchor: f.anchor }, d, s),
          }),
          v(null));
      },
      [i, t, A, Ee, _, e, j],
    ),
    Xe = (0, G.useCallback)(
      (n, r, i) => {
        let a = eb(e),
          o = Ee.find((e) => e.id === n.id) ?? n,
          s = i === 0,
          c = sd(r, s ? o.id : void 0, a) ?? null;
        (c != null && s && a.set(o.id, c), v(o.id), T(C_()));
        let l = rv($_(o, r, i), c, j);
        t.sendMessageToHost({
          type: `browser-sidebar-runtime-open-comment-preview`,
          commentId: o.id,
          anchorState: l,
        });
      },
      [t, Ee, e, j],
    ),
    Ze = (0, G.useCallback)(
      (r, a) => {
        let s = nd(r);
        if (s == null) return !1;
        let c = {
            ...a,
            anchor: od(r, a.anchor, A),
            cardViewportRect: rb(e, s.rect, { viewportScale: n.viewportScale, zoomFactor: j }),
          },
          l = sy(r, c, A ? t.getAnnotationControls?.(r) : void 0, void 0, s);
        return (
          A && i.rememberTarget(l.id, r),
          eb(e).set(l.id, r),
          qv(r, l.id),
          t.sendMessageToHost({
            type: `browser-sidebar-runtime-open-design-editor`,
            anchorState: c,
            designEditorState: l,
          }),
          T(C_()),
          S({
            target: { mode: `design`, groupId: l.id },
            anchor: {
              type: `element`,
              additionalSelections: [],
              cardViewportRect: c.cardViewportRect,
              element: r,
              themeVariant: c.themeVariant,
              value: c.anchor,
              viewportSize: c.viewportSize,
            },
          }),
          o(s),
          g(!1),
          !0
        );
      },
      [i, t, A, e, n.viewportScale, j],
    ),
    Qe = (0, G.useEffectEvent)((e, t, n, r) => {
      if (x != null) return !1;
      if (e instanceof Range) {
        let t = su(e);
        return t != null && Je(t, n);
      }
      return qe(e, tv(e, t.x, t.y), n, r);
    });
  (0, G.useEffect)(
    () => t.subscribeToSiteAnnotationRequests?.((e, t, n, r) => Qe(e, t, n, r)),
    [t],
  );
  let $e = (0, G.useCallback)(
      (e) => {
        (v((t) => (t === e ? null : t)),
          t.sendMessageToHost({
            type: `browser-sidebar-runtime-close-comment-preview`,
            commentId: e,
          }));
      },
      [t],
    ),
    et = (0, G.useEffectEvent)((e, n) => {
      if (x != null) {
        w.current?.clear();
        return;
      }
      _ != null && $e(_);
      let r = iv(e, j),
        a = Ne ? t.getAnnotationControls?.(n) : void 0,
        s = a?.controls.length ? sy(n, r, a) : void 0;
      (s != null && i.rememberTarget(s.id, n),
        (be.current = !1),
        m(!1),
        f(null),
        o(null),
        c(null),
        gu(),
        S({
          target: { mode: `create` },
          anchor: {
            type: `virtual`,
            additionalSelections: [],
            value: e,
            themeVariant: r.themeVariant,
            viewportSize: r.viewportSize,
          },
        }),
        t.sendMessageToHost({
          type: `browser-sidebar-runtime-open-editor`,
          target: { mode: `create` },
          anchorState: r,
          designEditorState: s,
          wantsScreenshot: !0,
        }));
    }),
    tt = (0, G.useEffectEvent)((t, n) => {
      if (x != null || k !== `comment`) return;
      let r = pl(t.x, t.y, A, e);
      r != null && (n ? qe(r, tv(r, t.x, t.y)) : o(Yy(r)));
    });
  ((0, G.useEffect)(() => {
    let t = t_({
      rootHost: e,
      onClearDomHover: () => {
        (o(null), c(null));
      },
      onFeedback: C,
      onSelected: et,
      onFallback: tt,
    });
    return (
      (w.current = t),
      () => {
        (t.dispose(), (w.current = null));
      }
    );
  }, [e]),
    (0, G.useEffect)(() => {
      w.current?.setEnabled(A && k === `comment` && !De && !n.isAgentControllingBrowser);
    }, [A, k, De, n.isAgentControllingBrowser]),
    (0, G.useEffect)(() => {
      x?.anchor.type !== `virtual` && w.current?.clear();
    }, [x]));
  let nt = (0, G.useEffectEvent)((e) => {
      (w.current?.setEnabled(
        e.canUseSiteAnnotationApi === !0 &&
          e.interactionMode === `comment` &&
          e.isAnnotationSuspended !== !0 &&
          !e.isAgentControllingBrowser,
      ),
        n.zoomPercent !== e.zoomPercent && w.current?.invalidate());
    }),
    rt = (0, G.useCallback)(
      (n) => {
        if (x != null)
          return (t.sendMessageToHost({ type: `browser-sidebar-runtime-focus-editor` }), !0);
        let r = ce.current;
        if (((ce.current = null), r != null && Date.now() - r.capturedAt <= yb))
          return w.current?.select(r.viewportPoint) ? !0 : qe(r.element, r.anchorState);
        if (w.current?.select(n)) return !0;
        let i = pl(n.x, n.y, A, e);
        if (i == null) return !1;
        let a = tv(i, n.x, n.y);
        return qe(i, a);
      },
      [x, t, A, qe, e],
    ),
    it = (0, G.useCallback)(
      (e) => {
        let t = 2,
          n = () => {
            rt(e) || t === 0 || (--t, window.requestAnimationFrame(n));
          };
        window.requestAnimationFrame(n);
      },
      [rt],
    ),
    at = (0, G.useCallback)(
      (e) => {
        if (x != null)
          return (t.sendMessageToHost({ type: `browser-sidebar-runtime-focus-editor` }), !0);
        ce.current = null;
        let n = le.current;
        le.current = null;
        let r = (n?.anchor.kind === `text` ? n : null) ?? ou();
        return r == null
          ? (gu(), e.fallbackViewportPoint != null && rt(e.fallbackViewportPoint))
          : Je(r);
      },
      [x, t, Je, rt],
    ),
    ot = (0, G.useCallback)((e) => {
      le.current = ou(e);
    }, []),
    st = (0, G.useCallback)(
      (n, r = `design`) => {
        if (x != null)
          return (t.sendMessageToHost({ type: `browser-sidebar-runtime-focus-editor` }), !0);
        let i = ce.current;
        if (
          ((ce.current = null),
          i != null && Date.now() - i.capturedAt <= yb && i.designElement != null)
        ) {
          let e = i.designElement;
          return Ze(e, e === i.element ? i.anchorState : tv(e, n.x, n.y));
        }
        let a = pl(n.x, n.y, A, e, r);
        if (a == null) return !1;
        let o = tv(a, n.x, n.y);
        return Ze(a, o);
      },
      [x, t, A, Ze, e],
    ),
    ct = (0, G.useCallback)(
      (e) => {
        let t = 2,
          n = () => {
            st(e) || t === 0 || (--t, window.requestAnimationFrame(n));
          };
        window.requestAnimationFrame(n);
      },
      [st],
    ),
    lt = (0, G.useCallback)(() => {
      (ge.current != null && window.cancelAnimationFrame(ge.current),
        (ge.current = window.requestAnimationFrame(() => {
          ((ge.current = null), T(C_()));
        })));
    }, []),
    ut = (0, G.useCallback)(
      (e, r, i) => {
        if (e.target.mode !== `create` || e.anchor.type === `text`) return;
        if (r == null) {
          (t.sendMessageToHost({ type: `browser-sidebar-runtime-cancel-editor`, target: e.target }),
            (be.current = !1),
            m(!1),
            f(null),
            mc(),
            o(null),
            c(null),
            u(null));
          return;
        }
        if (!Oe && r.additional.length > 0) return;
        let a = { ...e, anchor: K_(e.anchor, r, i) };
        (t.sendMessageToHost({
          type: `browser-sidebar-runtime-update-anchor`,
          target: a.target,
          anchorState: av(a, j, n.viewportScale),
        }),
          T(C_()),
          u(null),
          S(a));
      },
      [t, Oe, n.viewportScale, j],
    ),
    dt = (0, G.useEffectEvent)((e) => {
      if (!Oe || x?.target.mode !== `create` || x.anchor.type === `text`) return;
      let t = G_(x.anchor),
        n = [t.primary, ...t.additional][e];
      n != null && ut(x, al(t, n, !0));
    }),
    ft = (0, G.useEffectEvent)((e = _) => {
      e != null &&
        (t.sendMessageToHost({
          type: `browser-sidebar-runtime-close-comment-preview`,
          commentId: e,
        }),
        v(null));
    }),
    pt = (0, G.useEffectEvent)((e) => {
      S((t) => {
        if (t == null) return t;
        let n = t.target;
        return n.mode === `design` || !(`commentId` in n) || e.some((e) => e.id === n.commentId)
          ? t
          : null;
      });
    }),
    mt = (0, G.useEffectEvent)((e) => {
      (e != null &&
        t.sendMessageToHost({
          type: `browser-sidebar-runtime-close-comment-preview`,
          commentId: e,
        }),
        (be.current = !1),
        m(!1),
        f(null),
        mc(),
        (le.current = null),
        o(null),
        c(null),
        u(null),
        v(null),
        (Ce.current = !1),
        b(null),
        S(null),
        (me.current += 1),
        (xe.current = !1),
        (Se.current = !1),
        (O.current = null),
        oe(null));
    }),
    ht = (0, G.useEffectEvent)((e) => {
      (Ye(e), b(null));
    }),
    gt = (0, G.useEffectEvent)((e, t) => {
      let n = Te.updatePointer(e, t);
      return (n && w.current?.clearHover(), n);
    }),
    _t = (0, G.useEffectEvent)((t) => {
      if (
        t.interactionMode === `comment` &&
        t.isAnnotationSuspended !== !0 &&
        (k !== `comment` || De) &&
        x == null
      ) {
        let n = E.current;
        if (gt(n, t.canUseSiteAnnotationApi === !0)) return;
        if (n != null && t.isDesignModifierPressed !== !0 && w.current?.hover(n)) {
          (f(n), o(null), c(null));
          return;
        }
        let r =
            t.canUseTweaks !== !1 &&
            (t.isDesignModifierPressed === !0 ||
              (ss(t.comments) && t.annotationEditorMode === `design`)),
          i = n == null ? null : pl(n.x, n.y, t.canUseSiteAnnotationApi === !0, e);
        (f(n), o(Yy(i, r)));
      }
    }),
    vt = (0, G.useEffectEvent)((t) => {
      S(H_(t, eb(e)));
    }),
    yt = (0, G.useEffectEvent)((t) => {
      let n = Oe && t;
      if (((be.current = n), m(n), !n)) {
        (f(null), o(null), c(null), mc());
        return;
      }
      if (x?.target.mode !== `create` || x.anchor.type === `text`) return;
      let r = E.current;
      if (r == null || Ce.current) return;
      _l(r, e);
      let i = yl(r, e, A);
      if (i == null) {
        (f(null), o(null), c(null), mc());
        return;
      }
      (fc(i.ownerDocument, wl),
        f(r),
        c({ anchor: tv(i, r.x, r.y).anchor, liveElement: i }),
        o(Yy(i)));
    });
  ((0, G.useEffect)(() => {
    let e = t.subscribeToHostMessages((e) => {
      switch (e.type) {
        case `browser-sidebar-runtime-sync`:
          (i.sync(e),
            nt(e),
            _t(e),
            e.canUseSiteAnnotationApi !== !0 && (Te.cancel() && (xe.current = !0), pe(!1)),
            e.interactionMode !== `comment` && (ve.current = !1),
            (e.isAnnotationSuspended === !0 || e.areAnnotationMarkersVisible === !1) && ft(),
            (e.interactionMode !== `comment` || e.isAnnotationSuspended === !0) &&
              (Te.dispose(),
              pe(!1),
              (be.current = !1),
              m(!1),
              f(null),
              o(null),
              c(null),
              u(null),
              mc(),
              (xe.current = !1),
              (Se.current = !1),
              (me.current += 1),
              (O.current = null),
              oe(null)),
            e.canUseAnnotationMultiSelect !== !0 && u(null),
            r(
              (t) => (
                t.zoomPercent !== e.zoomPercent && lt(),
                {
                  activeDesignChange: e.activeDesignChange,
                  comments: e.comments,
                  intlConfig: e.intlConfig,
                  interactionMode: e.interactionMode,
                  annotationEditorMode: e.annotationEditorMode ?? `comment`,
                  isAgentControllingBrowser: e.isAgentControllingBrowser,
                  canUseAnnotationMultiSelect: e.canUseAnnotationMultiSelect === !0,
                  canUseSiteAnnotationApi: e.canUseSiteAnnotationApi === !0,
                  canUseTweaks: e.canUseTweaks !== !1,
                  isDesignModifierPressed: e.isDesignModifierPressed === !0,
                  isOriginalViewEnabled: e.isOriginalViewEnabled === !0,
                  areAnnotationMarkersVisible: e.areAnnotationMarkersVisible !== !1,
                  isAnnotationSuspended: e.isAnnotationSuspended === !0,
                  isTweaksEditorOpen: e.isTweaksEditorOpen === !0,
                  viewportScale: e.viewportScale ?? 1,
                  zoomPercent: e.zoomPercent,
                }
              ),
            ),
            T(C_()),
            g(e.interactionMode === `comment` && e.isDesignModifierPressed === !0),
            (e.interactionMode !== `comment` ||
              e.canUseTweaks === !1 ||
              e.isTweaksEditorOpen !== !0) &&
              ie(null),
            ne((t) => (t != null && !e.comments.some((e) => e.id === t) ? null : t)));
          return;
        case `browser-sidebar-runtime-prepare-comment-screenshot`:
          ne(e.commentId);
          return;
        case `browser-sidebar-runtime-clear-comment-screenshot`:
          ne(null);
          return;
        case `browser-sidebar-runtime-capture-text-selection`:
          ot();
          return;
        case `browser-sidebar-runtime-select-comment`:
          b(e.commentId);
          return;
        case `browser-sidebar-runtime-close-editor`:
          (w.current?.clear(),
            mc(),
            (0, lb.flushSync)(() => {
              ((be.current = !1),
                m(!1),
                f(null),
                (me.current += 1),
                (xe.current = !1),
                (Se.current = !1),
                ie(null),
                ne(null),
                o(null),
                c(null),
                u(null),
                (O.current = null),
                oe(null),
                S((t) => (t == null || e.target == null || ms(t.target, e.target) ? null : t)));
            }));
          return;
        case `browser-sidebar-runtime-design-scrub-changed`:
          ie(e.property);
          return;
        case `browser-sidebar-runtime-create-comment-at-point`:
          (u(null), rt(e.viewportPoint) || it(e.viewportPoint));
          return;
        case `browser-sidebar-runtime-create-comment-from-selection`:
          (u(null), at(e));
          return;
        case `browser-sidebar-runtime-open-design-editor-at-point`:
          if ((u(null), !Ne)) return;
          st(e.viewportPoint) || ct(e.viewportPoint);
          return;
        case `browser-sidebar-runtime-annotation-selection-modifier-state`:
          yt(e.pressed);
          return;
        case `browser-sidebar-runtime-annotation-selection-hover-state`:
          u(Oe ? e.selectionIndex : null);
          return;
        case `browser-sidebar-runtime-remove-annotation-selection`:
          if (!Oe) return;
          dt(e.selectionIndex);
          return;
        case `browser-sidebar-runtime-restore-editor`:
          (w.current?.clear(),
            (be.current = !1),
            m(!1),
            (E.current = null),
            f(null),
            mc(),
            o(null),
            c(null),
            u(null),
            vt(e));
          return;
      }
    });
    return () => {
      (ge.current != null && (window.cancelAnimationFrame(ge.current), (ge.current = null)), e());
    };
  }, [i, t, Oe, Ne, ot, st, lt, it, ct, Te, e, rt, at]),
    (0, G.useEffect)(() => {
      let t = eb(e);
      (t.forEach((e, n) => {
        ((!Ee.some((e) => e.id === n) &&
          n !== Re?.id &&
          (x?.anchor.type !== `element` || x.anchor.element !== e)) ||
          !e.isConnected) &&
          t.delete(n);
      }),
        _ != null && !Fe.some((e) => e.id === _) && ft(_),
        pt(Fe));
    }, [Re, x, Ee, _, e, Fe]),
    (0, G.useEffect)(() => {
      k === `browse` && mt(_);
    }, [_, k]),
    (0, G.useLayoutEffect)(() => {
      if (!(k !== `comment` || De || x != null)) return zy(e, E.current, ke);
    }, [x, k, De, e, ke]),
    (0, G.useEffect)(() => {
      if (y == null) return;
      let e = Ee.find((e) => e.id === y) ?? null;
      e != null && ht(e);
    }, [Ee, y]));
  let bt = (0, G.useEffectEvent)((e) => {
      k !== `comment` ||
        (De === e && ve.current === e) ||
        ((ve.current = e),
        t.sendMessageToHost({
          type: `browser-sidebar-runtime-annotation-suspension`,
          suspended: e,
        }));
    }),
    xt = (0, G.useEffectEvent)((e) => {
      e.isTrusted && e.code === `Space` && e.type === `keydown` && !e.repeat && (ye.current = !1);
      let t = ye.current && e.code === `Space`;
      if (k !== `comment` && !t) return;
      let n = i_(e, t || De || ve.current, {
        preserveTyping: e.composedPath().some((e) => F(e) && gl(e)),
      });
      n != null && ((ye.current = n), bt(n));
    });
  ((0, G.useEffect)(
    () =>
      dc((e, t) => {
        let n = (e) => {
            e.isTrusted && (E.current = Lc(t, { x: e.clientX, y: e.clientY }));
          },
          r = () => {
            ((E.current = null), document.hasFocus() || ((ve.current = !1), (ye.current = !1)));
          };
        return (
          t.addEventListener(`keydown`, xt, !0),
          t.addEventListener(`keyup`, xt, !0),
          t.addEventListener(`mousemove`, n, !0),
          t.addEventListener(`blur`, r),
          () => {
            (t.removeEventListener(`keydown`, xt, !0),
              t.removeEventListener(`keyup`, xt, !0),
              t.removeEventListener(`mousemove`, n, !0),
              t.removeEventListener(`blur`, r));
          }
        );
      }),
    [],
  ),
    (0, G.useEffect)(() => {
      if (De) return;
      let n = () => {
          (gt(null, !1), w.current?.clearHover(), (E.current = null), f(null), o(null), c(null));
        },
        r = (e, t) => Ne && (t || (Ue && !w.current?.hasSurfaceAtPoint(e))),
        i = (e) => {
          let n = Oe && e;
          (yt(n),
            x?.target.mode === `create` &&
              x.anchor.type !== `text` &&
              t.sendMessageToHost({
                type: `browser-sidebar-runtime-annotation-selection-modifier-state`,
                pressed: n,
              }));
        },
        a = (t, a) => {
          g(a.altKey);
          let s = x?.target.mode === `create` && x.anchor.type !== `text` && xl(a),
            l = s && (a.shiftKey || be.current);
          if (!a.isTrusted || (bl(a, e) && !s)) {
            n();
            return;
          }
          let u = Lc(t, { x: a.clientX, y: a.clientY });
          if (((E.current = u), k !== `comment`)) return;
          let d = D.current;
          if (((D.current = u), s && !l)) {
            (f(null), o(null), c(null), mc());
            return;
          }
          Jc(a, { preventDefault: !1 });
          let p = d == null || d.x !== u.x || d.y !== u.y;
          Oe && a.shiftKey && !be.current && p && i(!0);
          let m = Oe && x?.target.mode === `create` && x.anchor.type !== `text` && be.current;
          if (x != null && !m) {
            (f(null), o(null), c(null), mc());
            return;
          }
          if (O.current != null) {
            (f(u), o(null), c(null));
            return;
          }
          if (gt(u, A && x == null)) return;
          if ((fc(t.document, wl), _l(u, e), f(u), Ce.current)) {
            (o(null), c(null));
            return;
          }
          let h = r(u, a.altKey);
          if (!h && x == null && w.current?.hover(u)) {
            (o(null), c(null));
            return;
          }
          w.current?.clearHover();
          let _ = h ? pl(u.x, u.y, A, e) : vl(u, e, a, A);
          if (!_) {
            (o(null), c(null));
            return;
          }
          (c({ anchor: tv(_, u.x, u.y).anchor, liveElement: _ }), o(Yy(_, h)));
        },
        s = (t, r, i) => {
          i.isTrusted && k === `comment` && x == null && !bl(i, e) && Jc(i, { preventDefault: !1 });
          let a = i.relatedTarget;
          if (a instanceof (t.defaultView?.Node ?? Node) && t.documentElement?.contains(a)) {
            ac(a) && (Te.cancel() && (xe.current = !0), n());
            return;
          }
          let o = Lc(r, { x: i.clientX, y: i.clientY });
          (a != null &&
            isAnnotationPointInViewport(o, { width: window.innerWidth, height: window.innerHeight })) ||
            n();
        },
        l = () => {
          (Te.isDragging && document.hasFocus()) ||
            (Te.cancel() && (xe.current = !0), g(!1), n(), i(!1));
        },
        u = ({ currentDragSelection: e, suppressFollowUpClick: r }) => {
          if (!e.isDraggingRegion || e.rect == null) return !1;
          me.current += 1;
          let i = me.current;
          (w.current?.clear(), (xe.current = r), (Se.current = r));
          let a = u_(e.rect, e.current, { framePath: e.framePath, frameUrl: e.frameUrl });
          if (
            ((O.current = null),
            oe(e),
            Oe && x?.target.mode === `create` && x.anchor.type !== `text`)
          )
            return (
              ut(x, al(G_(x.anchor), { anchor: a, liveElement: null }, !0)),
              oe(null),
              n(),
              !0
            );
          let o = iv(a, j);
          return (
            window.requestAnimationFrame(() => {
              me.current === i &&
                (t.sendMessageToHost({
                  type: `browser-sidebar-runtime-open-editor`,
                  target: { mode: `create` },
                  anchorState: o,
                  wantsScreenshot: !0,
                }),
                be.current &&
                  t.sendMessageToHost({
                    type: `browser-sidebar-runtime-annotation-selection-modifier-state`,
                    pressed: !0,
                  }),
                T(C_()),
                S({
                  target: { mode: `create` },
                  anchor: {
                    type: `region`,
                    additionalSelections: [],
                    themeVariant: o.themeVariant,
                    value: a,
                    viewportSize: o.viewportSize,
                  },
                }),
                oe(null),
                n());
            }),
            !0
          );
        },
        d = (t, n) => {
          ((ce.current = null), (le.current = null));
          let a =
            Oe &&
            x?.target.mode === `create` &&
            x.anchor.type !== `text` &&
            (n.shiftKey || be.current);
          if (
            !n.isTrusted ||
            !n.isPrimary ||
            n.button !== 0 ||
            bl(n, e) ||
            k !== `comment` ||
            ((xe.current = !1), (Se.current = !1), x != null && !a)
          )
            return;
          (x ?? w.current?.clear(),
            Oe &&
              n.shiftKey &&
              !be.current &&
              (x?.target.mode === `create` && x.anchor.type !== `text`
                ? i(!0)
                : ((be.current = !0), m(!0))));
          let o = Lc(t, { x: n.clientX, y: n.clientY });
          if (A && Te.handlePointerDown(t, n, o, x == null)) {
            x ?? (E.current = o);
            return;
          }
          if ((pe(!1), r(o, n.altKey))) {
            Jc(n);
            return;
          }
          if (
            O.current != null &&
            u({ currentDragSelection: updateAnnotationRegionDrag(O.current, o, pb), suppressFollowUpClick: !0 })
          ) {
            Jc(n);
            return;
          }
          ((me.current += 1), gu(), Jc(n));
          let s = ec(t) ?? [],
            c = {
              pointerId: n.pointerId,
              start: o,
              current: o,
              rect: null,
              isDraggingRegion: !1,
              framePath: s,
              frameUrl: pd(t, s),
            };
          ((O.current = c), oe(c));
        },
        p = (t, n) => {
          if (!n.isTrusted || bl(n, e)) {
            ((ce.current = null), (le.current = null));
            return;
          }
          let r = Lc(t, { x: n.clientX, y: n.clientY });
          ot(t);
          let i = ml(n, A) ?? pl(r.x, r.y, A, e);
          if (i == null) {
            ce.current = null;
            return;
          }
          (k === `comment` && Jc(n),
            (ce.current = {
              anchorState: tv(i, r.x, r.y),
              capturedAt: Date.now(),
              designElement: ml(n, !1, `design`),
              element: i,
              viewportPoint: r,
            }));
        },
        h = (e, t) => {
          if (!t.isTrusted || Te.handlePointerMove(e, t)) return;
          let n = O.current;
          if (n == null || t.pointerId !== n.pointerId) return;
          Jc(t);
          let r = Lc(e, { x: t.clientX, y: t.clientY }),
            i = updateAnnotationRegionDrag(n, r, pb);
          ((O.current = i), oe(i), (E.current = r), f(r), o(null), c(null));
        },
        _ = (e, n) => {
          if (
            Te.handlePointerUp(n, (e) => {
              ((xe.current = !0), e != null && Je(e));
            })
          )
            return;
          let i = O.current;
          if (i == null || n.pointerId !== i.pointerId) return;
          let a = updateAnnotationRegionDrag(i, Lc(e, { x: n.clientX, y: n.clientY }), pb);
          if (
            ((O.current = null),
            oe(null),
            n.isTrusted &&
              (Jc(n), !u({ currentDragSelection: a, suppressFollowUpClick: !0 }) && x == null))
          ) {
            if (((xe.current = !0), (Se.current = !1), r(a.current, n.altKey))) {
              st(a.current, `annotation`);
              return;
            }
            rt(a.current) &&
              Oe &&
              n.shiftKey &&
              ((be.current = !0),
              m(!0),
              t.sendMessageToHost({
                type: `browser-sidebar-runtime-annotation-selection-modifier-state`,
                pressed: !0,
              }));
          }
        },
        v = (e) => {
          (Te.handlePointerCancel(e) && (xe.current = !0),
            e.pointerId === O.current?.pointerId && ((O.current = null), oe(null), n()));
        },
        y = (e) => {
          (w.current?.clear(),
            t.sendMessageToHost({
              type: `browser-sidebar-runtime-cancel-editor`,
              target: e.target,
            }),
            (be.current = !1),
            m(!1),
            f(null),
            mc(),
            o(null),
            c(null));
        },
        b = (e) => {
          if (e.key === `Escape` && e.isTrusted) {
            if ((w.current?.clear(), Te.cancel())) {
              ((xe.current = !0), Jc(e));
              return;
            }
            if (O.current != null) {
              (Jc(e), (xe.current = !0), (Se.current = !1), (O.current = null), oe(null), n());
              return;
            }
            if (x?.target.mode === `create` && x.anchor.type !== `text`) {
              (Jc(e), y(x));
              return;
            }
            x == null &&
              k === `comment` &&
              (Jc(e), t.sendMessageToHost({ type: `browser-sidebar-runtime-exit-comment-mode` }));
          }
        },
        ee = (t) => {
          let n = x?.target.mode === `create`;
          !t.isTrusted ||
            k !== `comment` ||
            (x != null && !n) ||
            bl(t, e) ||
            Jc(t, { preventDefault: !Te.isDragging });
        },
        C = (n, a) => {
          if (xe.current && ((xe.current = !1), (Se.current = !1), k === `comment`)) {
            Jc(a);
            return;
          }
          let s = Oe && (a.shiftKey || be.current),
            l = x?.target.mode === `create` && x.anchor.type !== `text` && s && xl(a);
          if (!a.isTrusted || (bl(a, e) && !l) || k !== `comment`) return;
          if (x != null) {
            if ((Jc(a), x.target.mode === `create` && !s)) {
              y(x);
              return;
            }
            if (x.target.mode === `create` && x.anchor.type !== `text`) {
              i(s);
              let t = Lc(n, { x: a.clientX, y: a.clientY });
              if (w.current?.hasSurfaceAtPoint(t)) return;
              let r = vl(t, e, a, A);
              if (r == null) return;
              let l = tv(r, t.x, t.y),
                u = al(G_(x.anchor), { anchor: od(r, l.anchor, A), liveElement: r }, s);
              (ut(x, u, s ? void 0 : l),
                u != null &&
                  ((E.current = t), f(t), o(Yy(r)), c({ anchor: l.anchor, liveElement: r })));
            }
            return;
          }
          let d = Lc(n, { x: a.clientX, y: a.clientY }),
            p = O.current;
          if (p != null) {
            let e = updateAnnotationRegionDrag(p, d, pb);
            if (
              ((O.current = null),
              oe(null),
              u({ currentDragSelection: e, suppressFollowUpClick: !1 }))
            ) {
              Jc(a);
              return;
            }
          }
          if ((Jc(a), r(d, a.altKey))) {
            let t = pl(d.x, d.y, A, e);
            t != null && Ze(t, tv(t, d.x, d.y));
            return;
          }
          rt(d) &&
            Oe &&
            a.shiftKey &&
            ((be.current = !0),
            m(!0),
            t.sendMessageToHost({
              type: `browser-sidebar-runtime-annotation-selection-modifier-state`,
              pressed: !0,
            }));
        },
        te = (t, n) => {
          if (
            !n.isTrusted ||
            n.ctrlKey ||
            k !== `comment` ||
            (x != null && (x.target.mode !== `create` || x.anchor.type === `text`)) ||
            bl(n, e)
          )
            return;
          let r = Lc(t, { x: n.clientX, y: n.clientY });
          Iv(hl(r.x, r.y, e), Lv(n, t)) && Jc(n);
        };
      return dc((e, t) => {
        let n = (e) => {
            d(t, e);
          },
          r = (e) => {
            h(t, e);
          },
          o = (e) => {
            _(t, e);
          },
          c = (e) => {
            a(t, e);
          },
          u = (n) => {
            s(e, t, n);
          },
          f = (e) => {
            C(t, e);
          },
          m = (e) => {
            p(t, e);
          },
          y = (e) => {
            te(t, e);
          };
        (e.addEventListener(`pointerdown`, n, !0),
          e.addEventListener(`pointermove`, r, !0),
          e.addEventListener(`pointerup`, o, !0));
        for (let t of _b) e.addEventListener(t, ee, !0);
        (e.addEventListener(`pointercancel`, v, !0),
          e.addEventListener(`mousemove`, c, !0),
          e.addEventListener(`mouseout`, u, !0));
        let x = (e) => {
            (e.key === `Alt` && g(!1), !e.shiftKey && be.current && i(!1));
          },
          S = (e) => {
            (e.key === `Alt` && g(!0), b(e));
          };
        return (
          e.addEventListener(`keydown`, S, !0),
          e.addEventListener(`keyup`, x, !0),
          e.addEventListener(`click`, f, !0),
          e.addEventListener(`contextmenu`, m, !0),
          e.addEventListener(`wheel`, y, !0),
          t.addEventListener(`blur`, l),
          () => {
            (Te.disposeFrame(t),
              e.removeEventListener(`pointerdown`, n, !0),
              e.removeEventListener(`pointermove`, r, !0),
              e.removeEventListener(`pointerup`, o, !0));
            for (let t of _b) e.removeEventListener(t, ee, !0);
            (e.removeEventListener(`pointercancel`, v, !0),
              e.removeEventListener(`mousemove`, c, !0),
              e.removeEventListener(`mouseout`, u, !0),
              e.removeEventListener(`keydown`, S, !0),
              e.removeEventListener(`keyup`, x, !0),
              e.removeEventListener(`click`, f, !0),
              e.removeEventListener(`contextmenu`, m, !0),
              e.removeEventListener(`wheel`, y, !0),
              t.removeEventListener(`blur`, l));
          }
        );
      });
    }, [x, t, Oe, A, Ne, ut, ot, k, De, Ue, Te, e, st, Ze, Je, n.viewportScale, Me, rt, j]),
    (0, G.useEffect)(() => {
      if (k !== `comment` || De || x != null) return;
      let t = () => {
          if (gt(E.current, A)) return;
          if (E.current != null && w.current?.hover(E.current)) {
            (o(null), c(null));
            return;
          }
          let t = Xy(E.current, e, A);
          (o(Yy(t)), c(null), t != null && T(C_()));
        },
        n = () => {
          (we.current != null && window.clearTimeout(we.current),
            (Ce.current = !0),
            o(null),
            c(null),
            T(C_()),
            (we.current = window.setTimeout(() => {
              ((we.current = null), (Ce.current = !1), t());
            }, vb)));
        },
        r = dc((e, r) => {
          (r.addEventListener(`resize`, t), e.addEventListener(`scroll`, n, !0));
          let i = A ? Ng(e, () => (0, lb.flushSync)(t)) : void 0;
          return () => {
            (i?.(), r.removeEventListener(`resize`, t), e.removeEventListener(`scroll`, n, !0));
          };
        });
      return () => {
        (r(),
          (Ce.current = !1),
          we.current != null && (window.clearTimeout(we.current), (we.current = null)));
      };
    }, [x, A, k, De, e, Me]),
    (0, G.useEffect)(() => {
      if ((x == null && _ == null) || x?.anchor.type === `virtual`) return;
      let r = () => {
          let r = _ == null ? null : { mode: `edit`, commentId: _ },
            i = x?.target ?? r;
          if (i == null) return;
          let a,
            o = eb(e);
          if (x == null) {
            let e = Ee.find((e) => e.id === _) ?? null;
            if (e == null) return;
            let t = Z_(e, o) ?? null;
            (t != null && o.set(e.id, t), (a = rv(e, t, j)));
          } else
            x.target.mode === `create` || x.target.mode === `design`
              ? (a = av(x, j, n.viewportScale))
              : ((a = ov(x, Ee, o, j)), a != null && (a = nv(a, sd(a.anchor, void 0, o))));
          if (a == null && x == null) return;
          if (
            (t.sendMessageToHost({
              type: `browser-sidebar-runtime-update-anchor`,
              target: i,
              anchorState: a,
            }),
            T(C_()),
            x?.anchor.type === `text` && a?.anchor.kind === `text`)
          ) {
            let e = a.anchor;
            S((t) =>
              t?.anchor.type !== `text` || Fs(t.anchor.value, e)
                ? t
                : { ...t, anchor: { ...t.anchor, value: e } },
            );
          }
          if (a == null || x == null) {
            if (x == null) return;
            S((e) =>
              e == null ||
              !ms(e.target, x.target) ||
              e.anchor.type !== `element` ||
              e.anchor.element == null
                ? e
                : { ...e, anchor: { ...e.anchor, element: null } },
            );
            return;
          }
          let s = x.target;
          if (s.mode !== `edit`) return;
          let c = W_(x.anchor, o);
          S((e) =>
            e == null || !ms(e.target, s) || e.anchor.type !== `element` || e.anchor.element === c
              ? e
              : { ...e, anchor: { ...e.anchor, element: c } },
          );
        },
        i = () => {
          r();
        },
        a = () => {
          (x?.target.mode === `create` &&
            x.anchor.type !== `text` &&
            ((E.current = null), o(null), c(null)),
            r());
        },
        s =
          x == null
            ? []
            : x.anchor.type === `text`
              ? [x.anchor.value]
              : [x.anchor.value, ...x.anchor.additionalSelections.map((e) => e.anchor)],
        l = window.visualViewport;
      (l?.addEventListener(`resize`, i), l?.addEventListener(`scroll`, a));
      let u = dc((e, t) => {
          (t.addEventListener(`resize`, i),
            t.addEventListener(`scroll`, a),
            e.addEventListener(`scroll`, a, !0));
          let n = Pc(t, s, a);
          return () => {
            (t.removeEventListener(`resize`, i),
              t.removeEventListener(`scroll`, a),
              e.removeEventListener(`scroll`, a, !0),
              n());
          };
        }),
        d = x?.anchor.type === `text` ? du([x.anchor.value], r) : null;
      return (
        r(),
        () => {
          (l?.removeEventListener(`resize`, i), l?.removeEventListener(`scroll`, a), u(), d?.());
        }
      );
    }, [x, t, Ee, _, e, n.viewportScale, j]),
    (0, G.useEffect)(() => {
      let e = k === `comment` && x == null && Ne && h;
      _e.current !== e &&
        ((_e.current = e),
        t.sendMessageToHost({ type: `browser-sidebar-runtime-design-modifier-state`, pressed: e }));
    }, [x, t, Ne, k, h]),
    (0, G.useEffect)(() => () => i.clear(), [i]),
    (0, G.useEffect)(() => Kv(k === `comment` ? Ve : xb, Ie), [k, Ie, Ve]),
    (0, G.useLayoutEffect)(() => {
      if (x != null || Fe.length === 0 || (k !== `comment` && te == null)) return;
      let t = Ee.filter((e) => e.anchor.kind === `text` && Qy(e)),
        n = () => {
          de((e) => uu(t, e));
        },
        r = null,
        i = () => {
          r ??= window.requestAnimationFrame(() => {
            ((r = null), n());
          });
        },
        a = () => {
          (n(),
            (0, lb.flushSync)(() => {
              T(C_());
            }));
        },
        o = () => {
          (i(), T(C_()));
        },
        s = () => o(),
        c = Ee.flatMap((e) => (Qy(e) ? [e.anchor, ...(e.additionalAnchors ?? [])] : []));
      (window.addEventListener(`resize`, a), Ge && document.addEventListener(`scroll`, s, !0));
      let l = Ke ? tb(document, e, lt) : null,
        u = Pc(window, c, s),
        d = dc((t, n) => {
          if (n === window) return () => {};
          let r = () => o();
          (n.addEventListener(`resize`, a),
            n.addEventListener(`scroll`, r),
            Ge && t.addEventListener(`scroll`, r, !0));
          let i = Pc(n, c, r),
            s = Ke ? tb(t, e, lt) : null;
          return () => {
            (n.removeEventListener(`resize`, a),
              n.removeEventListener(`scroll`, r),
              Ge && t.removeEventListener(`scroll`, r, !0),
              i(),
              s?.());
          };
        });
      i();
      let f = du(
        t.flatMap((e) => (e.anchor.kind === `text` ? [e.anchor] : [])),
        n,
      );
      return () => {
        (window.removeEventListener(`resize`, a),
          Ge && document.removeEventListener(`scroll`, s, !0),
          l?.(),
          u(),
          d(),
          r != null && window.cancelAnimationFrame(r),
          f());
      };
    }, [x, te, Ee, Ge, Ke, k, lt, e, Fe.length]));
  let St = k === `comment` && !De && n.isOriginalViewEnabled !== !0,
    Ct = k === `comment` && !De && !ke && (x == null || x.target.mode === `create`);
  ((0, G.useLayoutEffect)(() => {
    if (ke) return Vg();
  }, [ke]),
    (0, G.useLayoutEffect)(() => {
      let e = document.getElementById(wl);
      if (e instanceof HTMLDivElement)
        return (
          (e.style.pointerEvents = Ct ? `auto` : `none`),
          () => {
            e.style.pointerEvents = `none`;
          }
        );
    }, [e, Ct]));
  let wt = te == null ? null : (Le.find((e) => e.id === te) ?? null),
    Tt = te == null ? null : (We.find((e) => e.id === te) ?? null),
    M =
      wt == null
        ? Tt == null
          ? null
          : { kind: `design`, annotation: Tt }
        : { kind: `comment`, annotation: wt },
    Et = M?.annotation.id ?? null,
    Dt = M?.kind === `comment` ? [M.annotation] : Le,
    Ot = M != null && te != null,
    kt = x?.target.mode === `create` ? U_(x.anchor) : null,
    At = x?.target.mode === `create` && x.anchor.type === `text` ? x.anchor.value : null,
    jt =
      x?.target.mode === `create` && x.anchor.type !== `text`
        ? [G_(x.anchor).primary, ...x.anchor.additionalSelections]
        : [],
    Mt = x?.target.mode === `create` && x.anchor.type !== `text` ? x.anchor.viewportSize : void 0,
    Nt =
      Oe &&
      !Ot &&
      ae == null &&
      x?.target.mode === `create` &&
      x.anchor.type !== `text` &&
      l != null &&
      l >= 0 &&
      l < jt.length
        ? l
        : null,
    Pt = (e) =>
      [e.anchor, ...(e.additionalAnchors ?? [])].some((e) =>
        At == null ? e.kind !== `text` && jt.some((t) => ol(V_(e, Ie), t)) : Fs(e, At),
      ),
    Ft = At == null && jt.length === 0 ? null : (Le.find(Pt) ?? Fe.find(Pt) ?? null),
    It = gs(je),
    Lt = Le;
  M?.kind === `comment`
    ? (Lt = It ? [M.annotation] : Le)
    : It || Ot
      ? (Lt = [])
      : Ft != null && (Lt = Le.filter((e) => e.id !== Ft.id));
  let Rt = Lt.flatMap((e) => {
      let t = Pe.get(e.id);
      return t == null
        ? []
        : (e.anchor.kind === `text`
            ? [e.anchor]
            : [e.anchor, ...(e.additionalAnchors ?? [])]
          ).flatMap((n, r) => {
            if (n.kind === `virtual`) return [];
            let i = e.selectionSourceIndexes[r] ?? r,
              a = n.kind === `element` ? sd(n, i === 0 ? e.id : void 0, Ie) : null,
              o = v_(n, se, { liveElement: a, viewportSize: e.markerViewportSize, zoomFactor: j });
            return o == null
              ? []
              : [
                  {
                    anchor: n,
                    comment: e,
                    commentNumber: t,
                    key: `${e.id}:${n.framePath.join(`>`)}:${n.selector ?? n.elementPath}:${r}`,
                    markerPoint: o,
                    savedSelectionIndex: i,
                  },
                ];
          });
    }),
    zt = Ts(
      Rt.map(({ markerPoint: e }) => e),
      se.width * j,
    ),
    Bt = M?.kind === `comment` ? Rt.findIndex(({ comment: e }) => e.id === M.annotation.id) : -1,
    Vt = Bt === -1 ? void 0 : zt[Bt],
    Ht = Vt == null ? void 0 : { x: Vt.x / j, y: Vt.y / j },
    Ut =
      M?.annotation.anchor.kind === `element`
        ? M.kind === `comment`
          ? (Z_(M.annotation, Ie) ?? null)
          : (sd(M.annotation.anchor, M.annotation.id, Ie) ?? null)
        : null,
    Wt =
      M?.kind === `comment` && M.annotation.anchor.kind !== `text`
        ? (M.annotation.additionalAnchors ?? []).map((e) => V_(e, Ie))
        : [],
    Gt =
      M?.kind === `comment` &&
      M.annotation.anchor.kind === `element` &&
      Ut == null &&
      Wt.every((e) => e.anchor.kind === `element` && e.liveElement == null) &&
      !gs(M.annotation.anchor.pageUrl),
    Kt = _ == null ? null : (Le.find((e) => e.id === _) ?? null),
    qt =
      (St && n.areAnnotationMarkersVisible !== !1) || (Ot && M?.kind === `comment`)
        ? Dt.flatMap((e) =>
            ib(e, x, M?.kind === `comment` ? M.annotation : null)
              ? []
              : [e.anchor, ...(e.additionalAnchors ?? [])].flatMap((t, n) =>
                  t.kind === `region`
                    ? [
                        {
                          anchor: t,
                          key: `${e.id}:region:${t.framePath.join(`>`)}:${t.rect.x}:${t.rect.y}:${n}`,
                        },
                      ]
                    : [],
                ),
          )
        : [],
    Jt = null;
  Ot && M?.annotation.anchor.kind === `text`
    ? (Jt = M.annotation.anchor)
    : !Ot && !De && x?.anchor.type === `text`
      ? (Jt = x.anchor.value)
      : !Ot &&
        !De &&
        n.areAnnotationMarkersVisible !== !1 &&
        Kt?.anchor.kind === `text` &&
        (Jt = Kt.anchor);
  let Yt = Jt == null ? null : fu(Jt);
  (0, G.useLayoutEffect)(() => (Yt == null ? void 0 : pu(Yt)), [Yt]);
  let Xt = Jt == null ? [] : nb(Jt),
    Zt = Yt == null ? Xt : [],
    Qt = null,
    $t = !1,
    en = `hover-box`,
    tn,
    nn = [];
  if (Ot && M?.annotation.anchor.kind === `element`) {
    let e = Ut == null ? null : nd(Ut),
      t = e?.rect ?? dd(M.annotation.anchor);
    ((tn = e?.borderRadius),
      (en = m_(M.annotation.anchor, t, se.width, se.height)),
      (Qt = c_(M.annotation.anchor, t, Ut)),
      ($t = M.kind === `comment` && rd(M.annotation.anchor)),
      (nn = J_(Wt, se, {
        clipToVisibleArea: !0,
        selectionIndexOffset: 1,
        viewportSize: M.annotation.viewportSize,
      })));
  } else if (Ot && M?.kind === `comment` && M.annotation.anchor.kind === `region`) {
    let e = dd(M.annotation.anchor);
    ((en = S_(M.annotation.anchor, e, se.width, se.height)),
      (Qt = c_(M.annotation.anchor, e)),
      (nn = J_(Wt, se, {
        clipToVisibleArea: !0,
        selectionIndexOffset: 1,
        viewportSize: M.annotation.viewportSize,
      })));
  } else if (!Ot) {
    if (((Qt = ae?.rect ?? null), Qt != null)) {
      if (
        ((en = S_(null, Qt, se.width, se.height)),
        x?.target.mode === `create` && x.anchor.type !== `text`)
      ) {
        let e = G_(x.anchor);
        nn = J_([e.primary, ...e.additional], se, {
          clipToVisibleArea: !0,
          viewportSize: x.anchor.viewportSize,
        });
      }
    } else if (x?.anchor.type === `element`) {
      let e = U_(x.anchor),
        t = x.anchor.element == null ? null : nd(x.anchor.element),
        n = t?.rect ?? dd(e);
      ((tn = t?.borderRadius),
        (en = x.target.mode === `design` ? `hover-box` : m_(e, n, se.width, se.height)),
        (Qt = x.target.mode === `design` ? n : c_(e, n, x.anchor.element)),
        ($t = x.target.mode !== `design` && rd(e)),
        (nn = J_(x.anchor.additionalSelections, se, {
          clipToVisibleArea: x.target.mode !== `design`,
          selectionIndexOffset: 1,
          viewportSize: x.anchor.viewportSize,
        })));
    } else if (x?.anchor.type === `region` && x.target.mode !== `design`) {
      let e = dd(x.anchor.value);
      ((en = S_(x.anchor.value, e, se.width, se.height)),
        (Qt = c_(x.anchor.value, e)),
        (nn = J_(x.anchor.additionalSelections, se, {
          clipToVisibleArea: !0,
          selectionIndexOffset: 1,
          viewportSize: x.anchor.viewportSize,
        })));
    } else
      x?.anchor.type === `virtual` || ee != null
        ? (Qt = ee?.rect ?? null)
        : a != null &&
          ((Qt = a.rect), (tn = a.borderRadius), (en = m_(null, Qt, se.width, se.height)));
  }
  let rn =
      M == null ? null : s_([...Xt, ...(Qt == null ? [] : [Qt]), ...nn.map(({ rect: e }) => e)]),
    an = Ot ? [] : $y(re, x, Re, Ie),
    on = Me && !Ot && x == null && ae == null && Kt == null ? a : null,
    sn = !Ot && x?.target.mode === `create` && x.anchor.type !== `text` ? a : null,
    cn = p && sn != null && s != null && jt.some((e) => ol(e, s)),
    ln = p ? `add` : `comment`;
  ke && (ln = `text`);
  let un = W.hotspotByMode[ln === `add` ? `add` : `comment`],
    dn =
      !Ot && kt != null && kt.kind !== `virtual` && (!It || Ft == null)
        ? v_(kt, se, {
            includeElementFrameScroll: !0,
            liveElement: jt[0]?.liveElement ?? null,
            viewportSize: Mt,
            zoomFactor: j,
          })
        : null,
    fn = cs(Ee),
    pn = dn == null ? null : Ft == null ? (fn === 0 ? null : fn + 1) : (Pe.get(Ft.id) ?? null),
    mn =
      j === 1
        ? {}
        : {
            height: `${j * 100}vh`,
            transform: `scale(${1 / j})`,
            transformOrigin: `top left`,
            width: `${j * 100}vw`,
          },
    hn = {
      ...Cv,
      ...mn,
      [gb]: String(Ae),
      "--browser-sidebar-draft-marker-size": `${Zs * Ae}px`,
      "--browser-sidebar-marker-label-font-size": `${10 * Ae}px`,
      "--browser-sidebar-marker-label-offset": `${-0.5 * Ae}px`,
      "--browser-sidebar-metadata-column-gap": `${12 * Ae}px`,
      "--browser-sidebar-metadata-height": `${mb * Ae}px`,
      "--browser-sidebar-metadata-padding-x": `${10 * Ae}px`,
      "--browser-sidebar-metadata-padding-y": `${8 * Ae}px`,
      "--browser-sidebar-metadata-radius": `${12 * Ae}px`,
      "--browser-sidebar-metadata-row-gap": `${3 * Ae}px`,
      "--browser-sidebar-overlay-font-size": `${13 * Ae}px`,
      "--browser-sidebar-saved-marker-size": `${Zs * Ae}px`,
    };
  k === `comment` && !De && x == null && ((hn.cursor = `none`), ke || (hn.pointerEvents = `auto`));
  let gn = (0, G.useEffectEvent)((e) => {
    t.sendMessageToHost({
      type: `browser-sidebar-runtime-comment-screenshot-ready`,
      commentId: e,
      annotationViewportRect: rn,
      markerViewportPoint: Ht,
      ...(Gt ? { skipScreenshotCapture: !0 } : {}),
    });
  });
  (0, G.useEffect)(() => {
    if (Et == null || te == null) {
      he.current = null;
      return;
    }
    if (he.current === Et) return;
    he.current = Et;
    let e = window.requestAnimationFrame(() => {
      gn(Et);
    });
    return () => {
      window.cancelAnimationFrame(e);
    };
  }, [te, Et]);
  let _n = (0, db.jsxs)(db.Fragment, {
    children: [
      Ct ? (0, db.jsx)(qy, {}) : null,
      qt.map(({ anchor: e, key: t }) => {
        let n = dd(e);
        if (n == null) return null;
        let r = c_(e, n);
        return r == null
          ? null
          : (0, db.jsx)(`div`, { className: b_(e, n, se.width, se.height), style: x_(r, j) }, t);
      }),
      (0, db.jsx)(Av, {
        additionalHighlights: nn.filter((e) => !e.isPageAnnotation),
        highlightBorderRadius: tn,
        highlightClassName: en,
        highlightRect: $t ? null : Qt,
        hoverSnapshot: sn,
        isRemoveHover: cn,
        linkedSelectionIndex: Nt,
        viewportHeight: se.height,
        viewportWidth: se.width,
        zoomFactor: j,
      }),
      !Ot && d != null && (x == null || (x.target.mode === `create` && x.anchor.type !== `text`))
        ? (0, db.jsx)(kv, {
            className: `annotation-selection-cursor`,
            "data-browser-comment-annotation-selection-cursor": !0,
            "data-browser-comment-native-text-selection": ke || void 0,
            mode: ln,
            pointerEvents: `none`,
            style: {
              height: W.height * Ae,
              left: d.x * j - un.x * Ae,
              top: d.y * j - un.y * Ae,
              width: W.width * Ae,
            },
          })
        : null,
      Zt.map((e, t) =>
        (0, db.jsx)(
          `div`,
          { className: `text-selection-highlight`, style: x_(e, j) },
          `${e.x}:${e.y}:${e.width}:${e.height}:${t}`,
        ),
      ),
      an.map((e) =>
        (0, db.jsx)(
          `div`,
          {
            className: `flex-item-overlay`,
            "data-browser-comment-flex-item-overlay": !0,
            style: x_(e.rect, j, e.borderRadius),
          },
          e.key,
        ),
      ),
      on == null
        ? null
        : (0, db.jsx)(Nv, { snapshot: on, viewportScale: n.viewportScale, zoomFactor: j }),
      St || Ot
        ? (0, db.jsxs)(`div`, {
            className: `markers-layer`,
            children: [
              ee?.selected === !0
                ? (0, db.jsx)(Mv, {
                    commentNumber: null,
                    markerPoint: { x: ee.point.x * j, y: ee.point.y * j },
                    onFocusEditor: () => {
                      t.sendMessageToHost({ type: `browser-sidebar-runtime-focus-editor` });
                    },
                  })
                : null,
              dn == null
                ? null
                : (0, db.jsx)(Mv, {
                    commentNumber: pn,
                    markerPoint: dn,
                    onFocusEditor: () => {
                      t.sendMessageToHost({ type: `browser-sidebar-runtime-focus-editor` });
                    },
                  }),
              (n.areAnnotationMarkersVisible !== !1 || Ot ? Rt : []).map(
                ({ anchor: e, comment: n, commentNumber: r, key: i, savedSelectionIndex: a }, o) =>
                  (0, db.jsx)(
                    jv,
                    {
                      commentNumber: r,
                      isSelected: x?.target.mode === `edit` && x.target.commentId === n.id,
                      markerPoint: zt[o],
                      onMouseEnter: () => {
                        Ot || x != null || Xe(n, e, a);
                      },
                      onMouseLeave: () => {
                        $e(n.id);
                      },
                      onClick: (r) => {
                        if (r.isTrusted) {
                          if ((r.preventDefault(), r.stopPropagation(), x != null)) {
                            t.sendMessageToHost({ type: `browser-sidebar-runtime-focus-editor` });
                            return;
                          }
                          Ye(n, e, a);
                        }
                      },
                    },
                    i,
                  ),
              ),
            ],
          })
        : null,
    ],
  });
  return (0, db.jsx)(Gy, {
    config: n.intlConfig,
    children: (0, db.jsxs)(`div`, {
      "data-browser-comment-annotation-selection-modifier-active": (p && d != null) || void 0,
      "data-browser-comment-root": !0,
      style: hn,
      children: [
        (0, db.jsx)(`style`, { children: wv }),
        (!De || Ot) && (Ct || ke ? (0, db.jsx)(Ky, { style: mn, children: _n }) : _n),
      ],
    }),
  });
}
function Gy({ children: e, config: t }) {
  return (0, db.jsx)(Og, {
    defaultLocale: t.defaultLocale,
    locale: t.locale,
    messages: t.messages,
    onError: bb,
    children: e,
  });
}
function Ky({ children: e, style: t }) {
  let n = (0, G.useRef)(null),
    [r, i] = (0, G.useState)(!1);
  return (
    (0, G.useLayoutEffect)(() => {
      let e = n.current;
      if (e == null) return;
      let t = null,
        r = () => {
          let t = _c(e, !1);
          return (i(t), t);
        };
      return (
        r() || (t = window.requestAnimationFrame(r)),
        () => {
          (t != null && window.cancelAnimationFrame(t), vc(e));
        }
      );
    }, []),
    (0, db.jsx)(`div`, {
      ref: n,
      popover: `manual`,
      className: `interaction-layer`,
      style: r ? t : void 0,
      "data-browser-comment-interaction-layer": !0,
      children: e,
    })
  );
}
function qy() {
  return (0, db.jsx)(`div`, {
    className: `interaction-blocker`,
    "data-browser-comment-interaction-blocker": !0,
  });
}
function Jy() {
  return annotationOverlayRuntime.ensureOverlayRoot();
}
function Yy(e, t = !1) {
  return annotationOverlayRuntime.snapshotHoverElement(e, t);
}
function Xy(e, t, n) {
  return annotationOverlayRuntime.resolveHoverElementAtPoint(e, t, n);
}
function Zy(e, t) {
  return annotationOverlayRuntime.refreshDesignAnnotation(e, t);
}
function Qy(e) {
  return annotationOverlayRuntime.isAnnotationForCurrentPage(e);
}
function $y(e, t, n, r) {
  return annotationOverlayRuntime.collectFlexGapOverlays(e, t, n, r);
}
function eb(e) {
  return annotationOverlayRuntime.getElementCache(e);
}
function tb(e, t, n) {
  return annotationOverlayRuntime.observeMutationsOutsideOverlay(e, t, n);
}
function nb(e) {
  return annotationOverlayRuntime.resolveTextSelectionRects(e);
}
function rb(e, t, { viewportScale: n, zoomFactor: r }) {
  return annotationOverlayRuntime.resolveMetadataTooltipRect(e, t, { viewportScale: n, zoomFactor: r });
}
function ib(e, t, n) {
  return annotationOverlayRuntime.shouldSuppressRegionOverlay(e, t, n);
}
var G,
  lb,
  ub,
  db,
  fb,
  pb,
  mb,
  annotationOverlayRuntime,
  gb,
  _b,
  vb,
  yb,
  bb,
  xb,
  annotationAnchorGeometry,
  Sb = o(() => {
    ($s(),
      (G = u(Bf(), 1)),
      (lb = Hf()),
      (ub = Kf()),
      Ag(),
      Mg(),
      Lg(),
      Bg(),
      Hg(),
      Jg(),
      Dl(),
      dl(),
      r_(),
      a_(),
      X_(),
      ev(),
      wd(),
      sv(),
      z_(),
      Fv(),
      Tv(),
      tl(),
      Gv(),
      oy(),
      uy(),
      Fy(),
      Ly(),
      Vy(),
      td(),
      (db = Dv()),
      (fb = { name: `oai-annotation-editor-default-mode`, values: [`advanced`] }),
      (pb = 4),
      (mb = 72),
      (annotationAnchorGeometry = createAnnotationAnchorGeometry({
        getDefaultWindow: () => window,
        getDefaultDocument: () => document,
        resolveFrameWindow: wc,
        resolveFrameElement: Tc,
        getScrollOffset: Ic,
        getFrameWindow: sc,
        getParentElement: ic,
        getComputedStyle: (windowLike, element) => windowLike.getComputedStyle(element),
        isClippingOverflow: isClippingAnnotationOverflow,
        isElement: F,
        getElementRect: (element) => element.getBoundingClientRect(),
        getElementOffsetWidth: (element) => element.offsetWidth,
        getElementOffsetHeight: (element) => element.offsetHeight,
        getElementClientLeft: (element) => element.clientLeft,
        getElementClientTop: (element) => element.clientTop,
        getElementClientWidth: (element) => element.clientWidth,
        getElementClientHeight: (element) => element.clientHeight,
        getFrameElement: (windowLike) => windowLike.frameElement,
        getInnerWidth: (windowLike) => windowLike.innerWidth,
        getInnerHeight: (windowLike) => windowLike.innerHeight,
        getDocumentBody: (documentLike) => documentLike.body,
        getDocumentElement: (documentLike) => documentLike.documentElement,
        getAnchorRect: dd,
        getAnchorMarkerSize: j_,
        getViewportState: C_,
        getViewportOffset: (anchor, windowLike) => {
          const scroll = Nc(anchor, windowLike);
          return { x: scroll.x + _u(anchor, windowLike), y: scroll.y };
        },
        getFrameOffset: Ic,
        getWindowScrollY: (windowLike) => windowLike.scrollY,
        clamp: F_,
        getMarkerInset: () => I_,
        getViewportOverride: g_,
        getScaleRect: w_,
        getFramePath: (anchor) => anchor.framePath ?? [],
        getDocumentContext: (pageUrl, options) => new Xl(pageUrl).getRegionDocumentContext(options),
        getPageUrl: fd,
        getCurrentDocumentTitle: () => document.title,
        getScrollContainers: jc,
      })),
      (annotationOverlayRuntime = createAnnotationOverlayRuntime({
        documentLike: document,
        windowLike: window,
        htmlDivElementConstructor: HTMLDivElement,
        htmlElementConstructor: HTMLElement,
        nodeConstructor: Node,
        mutationObserverConstructor: MutationObserver,
        mutationObserverOptions: Yc,
        rootId: wl,
        maximumZIndex: jg,
        isRootElement: rc,
        snapshotElement: nd,
        resolveElementAtPoint: pl,
        samePageUrl: md,
        resolveAnchorElement: sd,
        refreshElementAnchor: ad,
        getOwnerWindow: Fc,
        isElement: F,
        getVisibleRect: cd,
        anchorToViewportRect: dd,
        scaleViewportPoint: o_,
        getEditorSelections: G_,
        anchorsEqual: Fs,
      })),
      (gb = `--browser-sidebar-overlay-size-scale`),
      (_b = [
        `auxclick`,
        `dblclick`,
        `mousedown`,
        `mouseenter`,
        `mouseleave`,
        `mouseover`,
        `mouseup`,
        `pointerdown`,
        `pointerenter`,
        `pointerleave`,
        `pointermove`,
        `pointerover`,
        `pointerout`,
        `pointerup`,
      ]),
      (vb = 100),
      (yb = 5e3),
      (bb = () => {}),
      (xb = []));
  });
($s(), Rd());
var {
  createInitialAnnotationContextState,
  isAnnotationCommentModeActive,
  resolveAnnotationSyncState,
} = require("./browser-page-preload/annotation-context-state");
var {
  getMountedAnnotationMessageAction,
  getPreMountAnnotationMessageAction,
} = require("./browser-page-preload/annotation-host-message-routing");
var { deriveAnnotationUiModePolicy } = require("./browser-page-preload/annotation-ui-mode-policy"),
  annotationUiModePolicy = deriveAnnotationUiModePolicy;
var { createAnnotationPermissionController } = require("./browser-page-preload/annotation-permission-controller"),
  { createAnnotationPreloadRuntime } = require("./browser-page-preload/annotation-preload-runtime"),
  annotationPreloadRuntime = createAnnotationPreloadRuntime({
    ipcRenderer: d.ipcRenderer,
    windowLike: window,
    documentLike: document,
    navigatorLike: navigator,
    globalLike: globalThis,
    channels: { hostMessage: zd, policy: Hd, pageEvent: Vd, runtime: Bd },
    featureEvent: Ud,
    intlConfig: Qs,
    createRequestId: () => crypto.randomUUID(),
    createPermissionController: createAnnotationPermissionController,
    createInitialState: createInitialAnnotationContextState,
    resolveSyncState: resolveAnnotationSyncState,
    isCommentModeActive: isAnnotationCommentModeActive,
    getMountedMessageAction: getMountedAnnotationMessageAction,
    getPreMountMessageAction: getPreMountAnnotationMessageAction,
    reducePendingEditorMessage,
    createControlsRegistry: Cf,
    createSiteAnnotationRequests: Ed,
    createFeatureObserver: Ff,
    createModeController: $d,
    loadCommentRuntime: () =>
      Rf(
        async () => {
          let { mountBrowserCommentRuntime: e } = await Promise.resolve().then(() => (Sb(), Hy));
          return { mountBrowserCommentRuntime: e };
        },
        void 0,
      ),
    createCustomEvent: (e, t) => new CustomEvent(e, t),
  });
var { installBrowserInputBridge } = require("./browser-page-preload/browser-input-bridge");
Object.freeze([`http:`, `https:`]);
var { extensionDistribution: cx } = require("./browser-page-preload/extension-distribution");
(cx.chrome.dev, cx.chrome.internal, cx.chrome.prod, cx.edge.dev, cx.edge.internal, cx.edge.prod);
var lx = { type: `webmcp_changed`, version: 1 };
var { createWebMcpRegistry: dx } = require("./browser-page-preload/webmcp-registry");
var { deploymentChannel: gx, deploymentChannelApi: yx, webmcpPolicyChannel: bx } = require("./browser-page-preload/deployment-channel"),
  xx;
(function (e) {
  e.assertEqual = (e) => {};
  function t(e) {}
  e.assertIs = t;
  function n(e) {
    throw Error();
  }
  ((e.assertNever = n),
    (e.arrayToEnum = (e) => {
      let t = {};
      for (let n of e) t[n] = n;
      return t;
    }),
    (e.getValidEnumValues = (t) => {
      let n = e.objectKeys(t).filter((e) => typeof t[t[e]] != `number`),
        r = {};
      for (let e of n) r[e] = t[e];
      return e.objectValues(r);
    }),
    (e.objectValues = (t) =>
      e.objectKeys(t).map(function (e) {
        return t[e];
      })),
    (e.objectKeys =
      typeof Object.keys == `function`
        ? (e) => Object.keys(e)
        : (e) => {
            let t = [];
            for (let n in e) Object.prototype.hasOwnProperty.call(e, n) && t.push(n);
            return t;
          }),
    (e.find = (e, t) => {
      for (let n of e) if (t(n)) return n;
    }),
    (e.isInteger =
      typeof Number.isInteger == `function`
        ? (e) => Number.isInteger(e)
        : (e) => typeof e == `number` && Number.isFinite(e) && Math.floor(e) === e));
  function r(e, t = ` | `) {
    return e.map((e) => (typeof e == `string` ? `'${e}'` : e)).join(t);
  }
  ((e.joinValues = r),
    (e.jsonStringifyReplacer = (e, t) => (typeof t == `bigint` ? t.toString() : t)));
})((xx ||= {}));
var Sx;
(function (e) {
  e.mergeShapes = (e, t) => ({ ...e, ...t });
})((Sx ||= {}));
var K = xx.arrayToEnum([
    `string`,
    `nan`,
    `number`,
    `integer`,
    `float`,
    `boolean`,
    `date`,
    `bigint`,
    `symbol`,
    `function`,
    `undefined`,
    `null`,
    `array`,
    `object`,
    `unknown`,
    `promise`,
    `void`,
    `never`,
    `map`,
    `set`,
  ]),
  Cx = (e) => {
    switch (typeof e) {
      case `undefined`:
        return K.undefined;
      case `string`:
        return K.string;
      case `number`:
        return Number.isNaN(e) ? K.nan : K.number;
      case `boolean`:
        return K.boolean;
      case `function`:
        return K.function;
      case `bigint`:
        return K.bigint;
      case `symbol`:
        return K.symbol;
      case `object`:
        return Array.isArray(e)
          ? K.array
          : e === null
            ? K.null
            : e.then && typeof e.then == `function` && e.catch && typeof e.catch == `function`
              ? K.promise
              : typeof Map < `u` && e instanceof Map
                ? K.map
                : typeof Set < `u` && e instanceof Set
                  ? K.set
                  : typeof Date < `u` && e instanceof Date
                    ? K.date
                    : K.object;
      default:
        return K.unknown;
    }
  },
  q = xx.arrayToEnum([
    `invalid_type`,
    `invalid_literal`,
    `custom`,
    `invalid_union`,
    `invalid_union_discriminator`,
    `invalid_enum_value`,
    `unrecognized_keys`,
    `invalid_arguments`,
    `invalid_return_type`,
    `invalid_date`,
    `invalid_string`,
    `too_small`,
    `too_big`,
    `invalid_intersection_types`,
    `not_multiple_of`,
    `not_finite`,
  ]),
  wx = class e extends Error {
    get errors() {
      return this.issues;
    }
    constructor(e) {
      (super(),
        (this.issues = []),
        (this.addIssue = (e) => {
          this.issues = [...this.issues, e];
        }),
        (this.addIssues = (e = []) => {
          this.issues = [...this.issues, ...e];
        }));
      let t = new.target.prototype;
      (Object.setPrototypeOf ? Object.setPrototypeOf(this, t) : (this.__proto__ = t),
        (this.name = `ZodError`),
        (this.issues = e));
    }
    format(e) {
      let t =
          e ||
          function (e) {
            return e.message;
          },
        n = { _errors: [] },
        r = (e) => {
          for (let i of e.issues)
            if (i.code === `invalid_union`) i.unionErrors.map(r);
            else if (i.code === `invalid_return_type`) r(i.returnTypeError);
            else if (i.code === `invalid_arguments`) r(i.argumentsError);
            else if (i.path.length === 0) n._errors.push(t(i));
            else {
              let e = n,
                r = 0;
              for (; r < i.path.length;) {
                let n = i.path[r];
                (r === i.path.length - 1
                  ? ((e[n] = e[n] || { _errors: [] }), e[n]._errors.push(t(i)))
                  : (e[n] = e[n] || { _errors: [] }),
                  (e = e[n]),
                  r++);
              }
            }
        };
      return (r(this), n);
    }
    static assert(t) {
      if (!(t instanceof e)) throw Error(`Not a ZodError: ${t}`);
    }
    toString() {
      return this.message;
    }
    get message() {
      return JSON.stringify(this.issues, xx.jsonStringifyReplacer, 2);
    }
    get isEmpty() {
      return this.issues.length === 0;
    }
    flatten(e = (e) => e.message) {
      let t = {},
        n = [];
      for (let r of this.issues)
        if (r.path.length > 0) {
          let n = r.path[0];
          ((t[n] = t[n] || []), t[n].push(e(r)));
        } else n.push(e(r));
      return { formErrors: n, fieldErrors: t };
    }
    get formErrors() {
      return this.flatten();
    }
  };
wx.create = (e) => new wx(e);
var Tx = (e, t) => {
    let n;
    switch (e.code) {
      case q.invalid_type:
        n =
          e.received === K.undefined
            ? `Required`
            : `Expected ${e.expected}, received ${e.received}`;
        break;
      case q.invalid_literal:
        n = `Invalid literal value, expected ${JSON.stringify(e.expected, xx.jsonStringifyReplacer)}`;
        break;
      case q.unrecognized_keys:
        n = `Unrecognized key(s) in object: ${xx.joinValues(e.keys, `, `)}`;
        break;
      case q.invalid_union:
        n = `Invalid input`;
        break;
      case q.invalid_union_discriminator:
        n = `Invalid discriminator value. Expected ${xx.joinValues(e.options)}`;
        break;
      case q.invalid_enum_value:
        n = `Invalid enum value. Expected ${xx.joinValues(e.options)}, received '${e.received}'`;
        break;
      case q.invalid_arguments:
        n = `Invalid function arguments`;
        break;
      case q.invalid_return_type:
        n = `Invalid function return type`;
        break;
      case q.invalid_date:
        n = `Invalid date`;
        break;
      case q.invalid_string:
        typeof e.validation == `object`
          ? `includes` in e.validation
            ? ((n = `Invalid input: must include "${e.validation.includes}"`),
              typeof e.validation.position == `number` &&
                (n = `${n} at one or more positions greater than or equal to ${e.validation.position}`))
            : `startsWith` in e.validation
              ? (n = `Invalid input: must start with "${e.validation.startsWith}"`)
              : `endsWith` in e.validation
                ? (n = `Invalid input: must end with "${e.validation.endsWith}"`)
                : xx.assertNever(e.validation)
          : (n = e.validation === `regex` ? `Invalid` : `Invalid ${e.validation}`);
        break;
      case q.too_small:
        n =
          e.type === `array`
            ? `Array must contain ${e.exact ? `exactly` : e.inclusive ? `at least` : `more than`} ${e.minimum} element(s)`
            : e.type === `string`
              ? `String must contain ${e.exact ? `exactly` : e.inclusive ? `at least` : `over`} ${e.minimum} character(s)`
              : e.type === `number` || e.type === `bigint`
                ? `Number must be ${e.exact ? `exactly equal to ` : e.inclusive ? `greater than or equal to ` : `greater than `}${e.minimum}`
                : e.type === `date`
                  ? `Date must be ${e.exact ? `exactly equal to ` : e.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(e.minimum))}`
                  : `Invalid input`;
        break;
      case q.too_big:
        n =
          e.type === `array`
            ? `Array must contain ${e.exact ? `exactly` : e.inclusive ? `at most` : `less than`} ${e.maximum} element(s)`
            : e.type === `string`
              ? `String must contain ${e.exact ? `exactly` : e.inclusive ? `at most` : `under`} ${e.maximum} character(s)`
              : e.type === `number`
                ? `Number must be ${e.exact ? `exactly` : e.inclusive ? `less than or equal to` : `less than`} ${e.maximum}`
                : e.type === `bigint`
                  ? `BigInt must be ${e.exact ? `exactly` : e.inclusive ? `less than or equal to` : `less than`} ${e.maximum}`
                  : e.type === `date`
                    ? `Date must be ${e.exact ? `exactly` : e.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(e.maximum))}`
                    : `Invalid input`;
        break;
      case q.custom:
        n = `Invalid input`;
        break;
      case q.invalid_intersection_types:
        n = `Intersection results could not be merged`;
        break;
      case q.not_multiple_of:
        n = `Number must be a multiple of ${e.multipleOf}`;
        break;
      case q.not_finite:
        n = `Number must be finite`;
        break;
      default:
        ((n = t.defaultError), xx.assertNever(e));
    }
    return { message: n };
  },
  Ex = Tx;
function Dx() {
  return Ex;
}
var Ox = (e) => {
  let { data: t, path: n, errorMaps: r, issueData: i } = e,
    a = [...n, ...(i.path || [])],
    o = { ...i, path: a };
  if (i.message !== void 0) return { ...i, path: a, message: i.message };
  let s = ``,
    c = r
      .filter((e) => !!e)
      .slice()
      .reverse();
  for (let e of c) s = e(o, { data: t, defaultError: s }).message;
  return { ...i, path: a, message: s };
};
function J(e, t) {
  let n = Dx(),
    r = Ox({
      issueData: t,
      data: e.data,
      path: e.path,
      errorMaps: [e.common.contextualErrorMap, e.schemaErrorMap, n, n === Tx ? void 0 : Tx].filter(
        (e) => !!e,
      ),
    });
  e.common.issues.push(r);
}
var kx = class e {
    constructor() {
      this.value = `valid`;
    }
    dirty() {
      this.value === `valid` && (this.value = `dirty`);
    }
    abort() {
      this.value !== `aborted` && (this.value = `aborted`);
    }
    static mergeArray(e, t) {
      let n = [];
      for (let r of t) {
        if (r.status === `aborted`) return Y;
        (r.status === `dirty` && e.dirty(), n.push(r.value));
      }
      return { status: e.value, value: n };
    }
    static async mergeObjectAsync(t, n) {
      let r = [];
      for (let e of n) {
        let t = await e.key,
          n = await e.value;
        r.push({ key: t, value: n });
      }
      return e.mergeObjectSync(t, r);
    }
    static mergeObjectSync(e, t) {
      let n = {};
      for (let r of t) {
        let { key: t, value: i } = r;
        if (t.status === `aborted` || i.status === `aborted`) return Y;
        (t.status === `dirty` && e.dirty(),
          i.status === `dirty` && e.dirty(),
          t.value !== `__proto__` && (i.value !== void 0 || r.alwaysSet) && (n[t.value] = i.value));
      }
      return { status: e.value, value: n };
    }
  },
  Y = Object.freeze({ status: `aborted` }),
  Ax = (e) => ({ status: `dirty`, value: e }),
  jx = (e) => ({ status: `valid`, value: e }),
  Mx = (e) => e.status === `aborted`,
  Nx = (e) => e.status === `dirty`,
  Px = (e) => e.status === `valid`,
  Fx = (e) => typeof Promise < `u` && e instanceof Promise,
  X;
(function (e) {
  ((e.errToObj = (e) => (typeof e == `string` ? { message: e } : e || {})),
    (e.toString = (e) => (typeof e == `string` ? e : e?.message)));
})((X ||= {}));
var Ix = class {
    constructor(e, t, n, r) {
      ((this._cachedPath = []),
        (this.parent = e),
        (this.data = t),
        (this._path = n),
        (this._key = r));
    }
    get path() {
      return (
        this._cachedPath.length ||
          (Array.isArray(this._key)
            ? this._cachedPath.push(...this._path, ...this._key)
            : this._cachedPath.push(...this._path, this._key)),
        this._cachedPath
      );
    }
  },
  Lx = (e, t) => {
    if (Px(t)) return { success: !0, data: t.value };
    if (!e.common.issues.length) throw Error(`Validation failed but no issues detected.`);
    return {
      success: !1,
      get error() {
        if (this._error) return this._error;
        let t = new wx(e.common.issues);
        return ((this._error = t), this._error);
      },
    };
  };
function Z(e) {
  if (!e) return {};
  let { errorMap: t, invalid_type_error: n, required_error: r, description: i } = e;
  if (t && (n || r))
    throw Error(
      `Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`,
    );
  return t
    ? { errorMap: t, description: i }
    : {
        errorMap: (t, i) => {
          let { message: a } = e;
          return t.code === `invalid_enum_value`
            ? { message: a ?? i.defaultError }
            : i.data === void 0
              ? { message: a ?? r ?? i.defaultError }
              : t.code === `invalid_type`
                ? { message: a ?? n ?? i.defaultError }
                : { message: i.defaultError };
        },
        description: i,
      };
}
var Q = class {
    get description() {
      return this._def.description;
    }
    _getType(e) {
      return Cx(e.data);
    }
    _getOrReturnCtx(e, t) {
      return (
        t || {
          common: e.parent.common,
          data: e.data,
          parsedType: Cx(e.data),
          schemaErrorMap: this._def.errorMap,
          path: e.path,
          parent: e.parent,
        }
      );
    }
    _processInputParams(e) {
      return {
        status: new kx(),
        ctx: {
          common: e.parent.common,
          data: e.data,
          parsedType: Cx(e.data),
          schemaErrorMap: this._def.errorMap,
          path: e.path,
          parent: e.parent,
        },
      };
    }
    _parseSync(e) {
      let t = this._parse(e);
      if (Fx(t)) throw Error(`Synchronous parse encountered promise.`);
      return t;
    }
    _parseAsync(e) {
      let t = this._parse(e);
      return Promise.resolve(t);
    }
    parse(e, t) {
      let n = this.safeParse(e, t);
      if (n.success) return n.data;
      throw n.error;
    }
    safeParse(e, t) {
      let n = {
        common: { issues: [], async: t?.async ?? !1, contextualErrorMap: t?.errorMap },
        path: t?.path || [],
        schemaErrorMap: this._def.errorMap,
        parent: null,
        data: e,
        parsedType: Cx(e),
      };
      return Lx(n, this._parseSync({ data: e, path: n.path, parent: n }));
    }
    "~validate"(e) {
      let t = {
        common: { issues: [], async: !!this[`~standard`].async },
        path: [],
        schemaErrorMap: this._def.errorMap,
        parent: null,
        data: e,
        parsedType: Cx(e),
      };
      if (!this[`~standard`].async)
        try {
          let n = this._parseSync({ data: e, path: [], parent: t });
          return Px(n) ? { value: n.value } : { issues: t.common.issues };
        } catch (e) {
          (e?.message?.toLowerCase()?.includes(`encountered`) && (this[`~standard`].async = !0),
            (t.common = { issues: [], async: !0 }));
        }
      return this._parseAsync({ data: e, path: [], parent: t }).then((e) =>
        Px(e) ? { value: e.value } : { issues: t.common.issues },
      );
    }
    async parseAsync(e, t) {
      let n = await this.safeParseAsync(e, t);
      if (n.success) return n.data;
      throw n.error;
    }
    async safeParseAsync(e, t) {
      let n = {
          common: { issues: [], contextualErrorMap: t?.errorMap, async: !0 },
          path: t?.path || [],
          schemaErrorMap: this._def.errorMap,
          parent: null,
          data: e,
          parsedType: Cx(e),
        },
        r = this._parse({ data: e, path: n.path, parent: n });
      return Lx(n, await (Fx(r) ? r : Promise.resolve(r)));
    }
    refine(e, t) {
      let n = (e) =>
        typeof t == `string` || t === void 0 ? { message: t } : typeof t == `function` ? t(e) : t;
      return this._refinement((t, r) => {
        let i = e(t),
          a = () => r.addIssue({ code: q.custom, ...n(t) });
        return typeof Promise < `u` && i instanceof Promise
          ? i.then((e) => (e ? !0 : (a(), !1)))
          : i
            ? !0
            : (a(), !1);
      });
    }
    refinement(e, t) {
      return this._refinement((n, r) =>
        e(n) ? !0 : (r.addIssue(typeof t == `function` ? t(n, r) : t), !1),
      );
    }
    _refinement(e) {
      return new BS({
        schema: this,
        typeName: $.ZodEffects,
        effect: { type: `refinement`, refinement: e },
      });
    }
    superRefine(e) {
      return this._refinement(e);
    }
    constructor(e) {
      ((this.spa = this.safeParseAsync),
        (this._def = e),
        (this.parse = this.parse.bind(this)),
        (this.safeParse = this.safeParse.bind(this)),
        (this.parseAsync = this.parseAsync.bind(this)),
        (this.safeParseAsync = this.safeParseAsync.bind(this)),
        (this.spa = this.spa.bind(this)),
        (this.refine = this.refine.bind(this)),
        (this.refinement = this.refinement.bind(this)),
        (this.superRefine = this.superRefine.bind(this)),
        (this.optional = this.optional.bind(this)),
        (this.nullable = this.nullable.bind(this)),
        (this.nullish = this.nullish.bind(this)),
        (this.array = this.array.bind(this)),
        (this.promise = this.promise.bind(this)),
        (this.or = this.or.bind(this)),
        (this.and = this.and.bind(this)),
        (this.transform = this.transform.bind(this)),
        (this.brand = this.brand.bind(this)),
        (this.default = this.default.bind(this)),
        (this.catch = this.catch.bind(this)),
        (this.describe = this.describe.bind(this)),
        (this.pipe = this.pipe.bind(this)),
        (this.readonly = this.readonly.bind(this)),
        (this.isNullable = this.isNullable.bind(this)),
        (this.isOptional = this.isOptional.bind(this)),
        (this[`~standard`] = { version: 1, vendor: `zod`, validate: (e) => this[`~validate`](e) }));
    }
    optional() {
      return VS.create(this, this._def);
    }
    nullable() {
      return HS.create(this, this._def);
    }
    nullish() {
      return this.nullable().optional();
    }
    array() {
      return xS.create(this);
    }
    promise() {
      return zS.create(this, this._def);
    }
    or(e) {
      return wS.create([this, e], this._def);
    }
    and(e) {
      return OS.create(this, e, this._def);
    }
    transform(e) {
      return new BS({
        ...Z(this._def),
        schema: this,
        typeName: $.ZodEffects,
        effect: { type: `transform`, transform: e },
      });
    }
    default(e) {
      let t = typeof e == `function` ? e : () => e;
      return new US({ ...Z(this._def), innerType: this, defaultValue: t, typeName: $.ZodDefault });
    }
    brand() {
      return new KS({ typeName: $.ZodBranded, type: this, ...Z(this._def) });
    }
    catch(e) {
      let t = typeof e == `function` ? e : () => e;
      return new WS({ ...Z(this._def), innerType: this, catchValue: t, typeName: $.ZodCatch });
    }
    describe(e) {
      let t = this.constructor;
      return new t({ ...this._def, description: e });
    }
    pipe(e) {
      return qS.create(this, e);
    }
    readonly() {
      return JS.create(this);
    }
    isOptional() {
      return this.safeParse(void 0).success;
    }
    isNullable() {
      return this.safeParse(null).success;
    }
  },
  Rx = /^c[^\s-]{8,}$/i,
  zx = /^[0-9a-z]+$/,
  Bx = /^[0-9A-HJKMNP-TV-Z]{26}$/i,
  Vx = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i,
  Hx = /^[a-z0-9_-]{21}$/i,
  Ux = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/,
  Wx =
    /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/,
  Gx = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i,
  Kx = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`,
  qx,
  Jx =
    /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,
  Yx =
    /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/,
  Xx =
    /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/,
  Zx =
    /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
  Qx = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/,
  $x = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/,
  eS = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`,
  tS = RegExp(`^${eS}$`);
function nS(e) {
  let t = `[0-5]\\d`;
  e.precision ? (t = `${t}\\.\\d{${e.precision}}`) : (e.precision ?? (t = `${t}(\\.\\d+)?`));
  let n = e.precision ? `+` : `?`;
  return `([01]\\d|2[0-3]):[0-5]\\d(:${t})${n}`;
}
function rS(e) {
  return RegExp(`^${nS(e)}$`);
}
function iS(e) {
  let t = `${eS}T${nS(e)}`,
    n = [];
  return (
    n.push(e.local ? `Z?` : `Z`),
    e.offset && n.push(`([+-]\\d{2}:?\\d{2})`),
    (t = `${t}(${n.join(`|`)})`),
    RegExp(`^${t}$`)
  );
}
function aS(e, t) {
  return !(((t !== `v4` && t) || !Jx.test(e)) && ((t !== `v6` && t) || !Xx.test(e)));
}
function oS(e, t) {
  if (!Ux.test(e)) return !1;
  try {
    let [n] = e.split(`.`);
    if (!n) return !1;
    let r = n
        .replace(/-/g, `+`)
        .replace(/_/g, `/`)
        .padEnd(n.length + ((4 - (n.length % 4)) % 4), `=`),
      i = JSON.parse(atob(r));
    return !(
      typeof i != `object` ||
      !i ||
      (`typ` in i && i?.typ !== `JWT`) ||
      !i.alg ||
      (t && i.alg !== t)
    );
  } catch {
    return !1;
  }
}
function sS(e, t) {
  return !(((t !== `v4` && t) || !Yx.test(e)) && ((t !== `v6` && t) || !Zx.test(e)));
}
var cS = class e extends Q {
  _parse(e) {
    if ((this._def.coerce && (e.data = String(e.data)), this._getType(e) !== K.string)) {
      let t = this._getOrReturnCtx(e);
      return (J(t, { code: q.invalid_type, expected: K.string, received: t.parsedType }), Y);
    }
    let t = new kx(),
      n;
    for (let r of this._def.checks)
      if (r.kind === `min`)
        e.data.length < r.value &&
          ((n = this._getOrReturnCtx(e, n)),
          J(n, {
            code: q.too_small,
            minimum: r.value,
            type: `string`,
            inclusive: !0,
            exact: !1,
            message: r.message,
          }),
          t.dirty());
      else if (r.kind === `max`)
        e.data.length > r.value &&
          ((n = this._getOrReturnCtx(e, n)),
          J(n, {
            code: q.too_big,
            maximum: r.value,
            type: `string`,
            inclusive: !0,
            exact: !1,
            message: r.message,
          }),
          t.dirty());
      else if (r.kind === `length`) {
        let i = e.data.length > r.value,
          a = e.data.length < r.value;
        (i || a) &&
          ((n = this._getOrReturnCtx(e, n)),
          i
            ? J(n, {
                code: q.too_big,
                maximum: r.value,
                type: `string`,
                inclusive: !0,
                exact: !0,
                message: r.message,
              })
            : a &&
              J(n, {
                code: q.too_small,
                minimum: r.value,
                type: `string`,
                inclusive: !0,
                exact: !0,
                message: r.message,
              }),
          t.dirty());
      } else if (r.kind === `email`)
        Gx.test(e.data) ||
          ((n = this._getOrReturnCtx(e, n)),
          J(n, { validation: `email`, code: q.invalid_string, message: r.message }),
          t.dirty());
      else if (r.kind === `emoji`)
        ((qx ||= new RegExp(Kx, `u`)),
          qx.test(e.data) ||
            ((n = this._getOrReturnCtx(e, n)),
            J(n, { validation: `emoji`, code: q.invalid_string, message: r.message }),
            t.dirty()));
      else if (r.kind === `uuid`)
        Vx.test(e.data) ||
          ((n = this._getOrReturnCtx(e, n)),
          J(n, { validation: `uuid`, code: q.invalid_string, message: r.message }),
          t.dirty());
      else if (r.kind === `nanoid`)
        Hx.test(e.data) ||
          ((n = this._getOrReturnCtx(e, n)),
          J(n, { validation: `nanoid`, code: q.invalid_string, message: r.message }),
          t.dirty());
      else if (r.kind === `cuid`)
        Rx.test(e.data) ||
          ((n = this._getOrReturnCtx(e, n)),
          J(n, { validation: `cuid`, code: q.invalid_string, message: r.message }),
          t.dirty());
      else if (r.kind === `cuid2`)
        zx.test(e.data) ||
          ((n = this._getOrReturnCtx(e, n)),
          J(n, { validation: `cuid2`, code: q.invalid_string, message: r.message }),
          t.dirty());
      else if (r.kind === `ulid`)
        Bx.test(e.data) ||
          ((n = this._getOrReturnCtx(e, n)),
          J(n, { validation: `ulid`, code: q.invalid_string, message: r.message }),
          t.dirty());
      else if (r.kind === `url`)
        try {
          new URL(e.data);
        } catch {
          ((n = this._getOrReturnCtx(e, n)),
            J(n, { validation: `url`, code: q.invalid_string, message: r.message }),
            t.dirty());
        }
      else
        r.kind === `regex`
          ? ((r.regex.lastIndex = 0),
            r.regex.test(e.data) ||
              ((n = this._getOrReturnCtx(e, n)),
              J(n, { validation: `regex`, code: q.invalid_string, message: r.message }),
              t.dirty()))
          : r.kind === `trim`
            ? (e.data = e.data.trim())
            : r.kind === `includes`
              ? e.data.includes(r.value, r.position) ||
                ((n = this._getOrReturnCtx(e, n)),
                J(n, {
                  code: q.invalid_string,
                  validation: { includes: r.value, position: r.position },
                  message: r.message,
                }),
                t.dirty())
              : r.kind === `toLowerCase`
                ? (e.data = e.data.toLowerCase())
                : r.kind === `toUpperCase`
                  ? (e.data = e.data.toUpperCase())
                  : r.kind === `startsWith`
                    ? e.data.startsWith(r.value) ||
                      ((n = this._getOrReturnCtx(e, n)),
                      J(n, {
                        code: q.invalid_string,
                        validation: { startsWith: r.value },
                        message: r.message,
                      }),
                      t.dirty())
                    : r.kind === `endsWith`
                      ? e.data.endsWith(r.value) ||
                        ((n = this._getOrReturnCtx(e, n)),
                        J(n, {
                          code: q.invalid_string,
                          validation: { endsWith: r.value },
                          message: r.message,
                        }),
                        t.dirty())
                      : r.kind === `datetime`
                        ? iS(r).test(e.data) ||
                          ((n = this._getOrReturnCtx(e, n)),
                          J(n, {
                            code: q.invalid_string,
                            validation: `datetime`,
                            message: r.message,
                          }),
                          t.dirty())
                        : r.kind === `date`
                          ? tS.test(e.data) ||
                            ((n = this._getOrReturnCtx(e, n)),
                            J(n, {
                              code: q.invalid_string,
                              validation: `date`,
                              message: r.message,
                            }),
                            t.dirty())
                          : r.kind === `time`
                            ? rS(r).test(e.data) ||
                              ((n = this._getOrReturnCtx(e, n)),
                              J(n, {
                                code: q.invalid_string,
                                validation: `time`,
                                message: r.message,
                              }),
                              t.dirty())
                            : r.kind === `duration`
                              ? Wx.test(e.data) ||
                                ((n = this._getOrReturnCtx(e, n)),
                                J(n, {
                                  validation: `duration`,
                                  code: q.invalid_string,
                                  message: r.message,
                                }),
                                t.dirty())
                              : r.kind === `ip`
                                ? aS(e.data, r.version) ||
                                  ((n = this._getOrReturnCtx(e, n)),
                                  J(n, {
                                    validation: `ip`,
                                    code: q.invalid_string,
                                    message: r.message,
                                  }),
                                  t.dirty())
                                : r.kind === `jwt`
                                  ? oS(e.data, r.alg) ||
                                    ((n = this._getOrReturnCtx(e, n)),
                                    J(n, {
                                      validation: `jwt`,
                                      code: q.invalid_string,
                                      message: r.message,
                                    }),
                                    t.dirty())
                                  : r.kind === `cidr`
                                    ? sS(e.data, r.version) ||
                                      ((n = this._getOrReturnCtx(e, n)),
                                      J(n, {
                                        validation: `cidr`,
                                        code: q.invalid_string,
                                        message: r.message,
                                      }),
                                      t.dirty())
                                    : r.kind === `base64`
                                      ? Qx.test(e.data) ||
                                        ((n = this._getOrReturnCtx(e, n)),
                                        J(n, {
                                          validation: `base64`,
                                          code: q.invalid_string,
                                          message: r.message,
                                        }),
                                        t.dirty())
                                      : r.kind === `base64url`
                                        ? $x.test(e.data) ||
                                          ((n = this._getOrReturnCtx(e, n)),
                                          J(n, {
                                            validation: `base64url`,
                                            code: q.invalid_string,
                                            message: r.message,
                                          }),
                                          t.dirty())
                                        : xx.assertNever(r);
    return { status: t.value, value: e.data };
  }
  _regex(e, t, n) {
    return this.refinement((t) => e.test(t), {
      validation: t,
      code: q.invalid_string,
      ...X.errToObj(n),
    });
  }
  _addCheck(t) {
    return new e({ ...this._def, checks: [...this._def.checks, t] });
  }
  email(e) {
    return this._addCheck({ kind: `email`, ...X.errToObj(e) });
  }
  url(e) {
    return this._addCheck({ kind: `url`, ...X.errToObj(e) });
  }
  emoji(e) {
    return this._addCheck({ kind: `emoji`, ...X.errToObj(e) });
  }
  uuid(e) {
    return this._addCheck({ kind: `uuid`, ...X.errToObj(e) });
  }
  nanoid(e) {
    return this._addCheck({ kind: `nanoid`, ...X.errToObj(e) });
  }
  cuid(e) {
    return this._addCheck({ kind: `cuid`, ...X.errToObj(e) });
  }
  cuid2(e) {
    return this._addCheck({ kind: `cuid2`, ...X.errToObj(e) });
  }
  ulid(e) {
    return this._addCheck({ kind: `ulid`, ...X.errToObj(e) });
  }
  base64(e) {
    return this._addCheck({ kind: `base64`, ...X.errToObj(e) });
  }
  base64url(e) {
    return this._addCheck({ kind: `base64url`, ...X.errToObj(e) });
  }
  jwt(e) {
    return this._addCheck({ kind: `jwt`, ...X.errToObj(e) });
  }
  ip(e) {
    return this._addCheck({ kind: `ip`, ...X.errToObj(e) });
  }
  cidr(e) {
    return this._addCheck({ kind: `cidr`, ...X.errToObj(e) });
  }
  datetime(e) {
    return typeof e == `string`
      ? this._addCheck({ kind: `datetime`, precision: null, offset: !1, local: !1, message: e })
      : this._addCheck({
          kind: `datetime`,
          precision: e?.precision === void 0 ? null : e?.precision,
          offset: e?.offset ?? !1,
          local: e?.local ?? !1,
          ...X.errToObj(e?.message),
        });
  }
  date(e) {
    return this._addCheck({ kind: `date`, message: e });
  }
  time(e) {
    return typeof e == `string`
      ? this._addCheck({ kind: `time`, precision: null, message: e })
      : this._addCheck({
          kind: `time`,
          precision: e?.precision === void 0 ? null : e?.precision,
          ...X.errToObj(e?.message),
        });
  }
  duration(e) {
    return this._addCheck({ kind: `duration`, ...X.errToObj(e) });
  }
  regex(e, t) {
    return this._addCheck({ kind: `regex`, regex: e, ...X.errToObj(t) });
  }
  includes(e, t) {
    return this._addCheck({
      kind: `includes`,
      value: e,
      position: t?.position,
      ...X.errToObj(t?.message),
    });
  }
  startsWith(e, t) {
    return this._addCheck({ kind: `startsWith`, value: e, ...X.errToObj(t) });
  }
  endsWith(e, t) {
    return this._addCheck({ kind: `endsWith`, value: e, ...X.errToObj(t) });
  }
  min(e, t) {
    return this._addCheck({ kind: `min`, value: e, ...X.errToObj(t) });
  }
  max(e, t) {
    return this._addCheck({ kind: `max`, value: e, ...X.errToObj(t) });
  }
  length(e, t) {
    return this._addCheck({ kind: `length`, value: e, ...X.errToObj(t) });
  }
  nonempty(e) {
    return this.min(1, X.errToObj(e));
  }
  trim() {
    return new e({ ...this._def, checks: [...this._def.checks, { kind: `trim` }] });
  }
  toLowerCase() {
    return new e({ ...this._def, checks: [...this._def.checks, { kind: `toLowerCase` }] });
  }
  toUpperCase() {
    return new e({ ...this._def, checks: [...this._def.checks, { kind: `toUpperCase` }] });
  }
  get isDatetime() {
    return !!this._def.checks.find((e) => e.kind === `datetime`);
  }
  get isDate() {
    return !!this._def.checks.find((e) => e.kind === `date`);
  }
  get isTime() {
    return !!this._def.checks.find((e) => e.kind === `time`);
  }
  get isDuration() {
    return !!this._def.checks.find((e) => e.kind === `duration`);
  }
  get isEmail() {
    return !!this._def.checks.find((e) => e.kind === `email`);
  }
  get isURL() {
    return !!this._def.checks.find((e) => e.kind === `url`);
  }
  get isEmoji() {
    return !!this._def.checks.find((e) => e.kind === `emoji`);
  }
  get isUUID() {
    return !!this._def.checks.find((e) => e.kind === `uuid`);
  }
  get isNANOID() {
    return !!this._def.checks.find((e) => e.kind === `nanoid`);
  }
  get isCUID() {
    return !!this._def.checks.find((e) => e.kind === `cuid`);
  }
  get isCUID2() {
    return !!this._def.checks.find((e) => e.kind === `cuid2`);
  }
  get isULID() {
    return !!this._def.checks.find((e) => e.kind === `ulid`);
  }
  get isIP() {
    return !!this._def.checks.find((e) => e.kind === `ip`);
  }
  get isCIDR() {
    return !!this._def.checks.find((e) => e.kind === `cidr`);
  }
  get isBase64() {
    return !!this._def.checks.find((e) => e.kind === `base64`);
  }
  get isBase64url() {
    return !!this._def.checks.find((e) => e.kind === `base64url`);
  }
  get minLength() {
    let e = null;
    for (let t of this._def.checks)
      t.kind === `min` && (e === null || t.value > e) && (e = t.value);
    return e;
  }
  get maxLength() {
    let e = null;
    for (let t of this._def.checks)
      t.kind === `max` && (e === null || t.value < e) && (e = t.value);
    return e;
  }
};
cS.create = (e) => new cS({ checks: [], typeName: $.ZodString, coerce: e?.coerce ?? !1, ...Z(e) });
function lS(e, t) {
  let n = (e.toString().split(`.`)[1] || ``).length,
    r = (t.toString().split(`.`)[1] || ``).length,
    i = n > r ? n : r;
  return (
    (Number.parseInt(e.toFixed(i).replace(`.`, ``)) %
      Number.parseInt(t.toFixed(i).replace(`.`, ``))) /
    10 ** i
  );
}
var uS = class e extends Q {
  constructor() {
    (super(...arguments),
      (this.min = this.gte),
      (this.max = this.lte),
      (this.step = this.multipleOf));
  }
  _parse(e) {
    if ((this._def.coerce && (e.data = Number(e.data)), this._getType(e) !== K.number)) {
      let t = this._getOrReturnCtx(e);
      return (J(t, { code: q.invalid_type, expected: K.number, received: t.parsedType }), Y);
    }
    let t,
      n = new kx();
    for (let r of this._def.checks)
      r.kind === `int`
        ? xx.isInteger(e.data) ||
          ((t = this._getOrReturnCtx(e, t)),
          J(t, {
            code: q.invalid_type,
            expected: `integer`,
            received: `float`,
            message: r.message,
          }),
          n.dirty())
        : r.kind === `min`
          ? (r.inclusive ? e.data < r.value : e.data <= r.value) &&
            ((t = this._getOrReturnCtx(e, t)),
            J(t, {
              code: q.too_small,
              minimum: r.value,
              type: `number`,
              inclusive: r.inclusive,
              exact: !1,
              message: r.message,
            }),
            n.dirty())
          : r.kind === `max`
            ? (r.inclusive ? e.data > r.value : e.data >= r.value) &&
              ((t = this._getOrReturnCtx(e, t)),
              J(t, {
                code: q.too_big,
                maximum: r.value,
                type: `number`,
                inclusive: r.inclusive,
                exact: !1,
                message: r.message,
              }),
              n.dirty())
            : r.kind === `multipleOf`
              ? lS(e.data, r.value) !== 0 &&
                ((t = this._getOrReturnCtx(e, t)),
                J(t, { code: q.not_multiple_of, multipleOf: r.value, message: r.message }),
                n.dirty())
              : r.kind === `finite`
                ? Number.isFinite(e.data) ||
                  ((t = this._getOrReturnCtx(e, t)),
                  J(t, { code: q.not_finite, message: r.message }),
                  n.dirty())
                : xx.assertNever(r);
    return { status: n.value, value: e.data };
  }
  gte(e, t) {
    return this.setLimit(`min`, e, !0, X.toString(t));
  }
  gt(e, t) {
    return this.setLimit(`min`, e, !1, X.toString(t));
  }
  lte(e, t) {
    return this.setLimit(`max`, e, !0, X.toString(t));
  }
  lt(e, t) {
    return this.setLimit(`max`, e, !1, X.toString(t));
  }
  setLimit(t, n, r, i) {
    return new e({
      ...this._def,
      checks: [...this._def.checks, { kind: t, value: n, inclusive: r, message: X.toString(i) }],
    });
  }
  _addCheck(t) {
    return new e({ ...this._def, checks: [...this._def.checks, t] });
  }
  int(e) {
    return this._addCheck({ kind: `int`, message: X.toString(e) });
  }
  positive(e) {
    return this._addCheck({ kind: `min`, value: 0, inclusive: !1, message: X.toString(e) });
  }
  negative(e) {
    return this._addCheck({ kind: `max`, value: 0, inclusive: !1, message: X.toString(e) });
  }
  nonpositive(e) {
    return this._addCheck({ kind: `max`, value: 0, inclusive: !0, message: X.toString(e) });
  }
  nonnegative(e) {
    return this._addCheck({ kind: `min`, value: 0, inclusive: !0, message: X.toString(e) });
  }
  multipleOf(e, t) {
    return this._addCheck({ kind: `multipleOf`, value: e, message: X.toString(t) });
  }
  finite(e) {
    return this._addCheck({ kind: `finite`, message: X.toString(e) });
  }
  safe(e) {
    return this._addCheck({
      kind: `min`,
      inclusive: !0,
      value: -(2 ** 53 - 1),
      message: X.toString(e),
    })._addCheck({ kind: `max`, inclusive: !0, value: 2 ** 53 - 1, message: X.toString(e) });
  }
  get minValue() {
    let e = null;
    for (let t of this._def.checks)
      t.kind === `min` && (e === null || t.value > e) && (e = t.value);
    return e;
  }
  get maxValue() {
    let e = null;
    for (let t of this._def.checks)
      t.kind === `max` && (e === null || t.value < e) && (e = t.value);
    return e;
  }
  get isInt() {
    return !!this._def.checks.find(
      (e) => e.kind === `int` || (e.kind === `multipleOf` && xx.isInteger(e.value)),
    );
  }
  get isFinite() {
    let e = null,
      t = null;
    for (let n of this._def.checks)
      if (n.kind === `finite` || n.kind === `int` || n.kind === `multipleOf`) return !0;
      else
        n.kind === `min`
          ? (t === null || n.value > t) && (t = n.value)
          : n.kind === `max` && (e === null || n.value < e) && (e = n.value);
    return Number.isFinite(t) && Number.isFinite(e);
  }
};
uS.create = (e) => new uS({ checks: [], typeName: $.ZodNumber, coerce: e?.coerce || !1, ...Z(e) });
var dS = class e extends Q {
  constructor() {
    (super(...arguments), (this.min = this.gte), (this.max = this.lte));
  }
  _parse(e) {
    if (this._def.coerce)
      try {
        e.data = BigInt(e.data);
      } catch {
        return this._getInvalidInput(e);
      }
    if (this._getType(e) !== K.bigint) return this._getInvalidInput(e);
    let t,
      n = new kx();
    for (let r of this._def.checks)
      r.kind === `min`
        ? (r.inclusive ? e.data < r.value : e.data <= r.value) &&
          ((t = this._getOrReturnCtx(e, t)),
          J(t, {
            code: q.too_small,
            type: `bigint`,
            minimum: r.value,
            inclusive: r.inclusive,
            message: r.message,
          }),
          n.dirty())
        : r.kind === `max`
          ? (r.inclusive ? e.data > r.value : e.data >= r.value) &&
            ((t = this._getOrReturnCtx(e, t)),
            J(t, {
              code: q.too_big,
              type: `bigint`,
              maximum: r.value,
              inclusive: r.inclusive,
              message: r.message,
            }),
            n.dirty())
          : r.kind === `multipleOf`
            ? e.data % r.value !== BigInt(0) &&
              ((t = this._getOrReturnCtx(e, t)),
              J(t, { code: q.not_multiple_of, multipleOf: r.value, message: r.message }),
              n.dirty())
            : xx.assertNever(r);
    return { status: n.value, value: e.data };
  }
  _getInvalidInput(e) {
    let t = this._getOrReturnCtx(e);
    return (J(t, { code: q.invalid_type, expected: K.bigint, received: t.parsedType }), Y);
  }
  gte(e, t) {
    return this.setLimit(`min`, e, !0, X.toString(t));
  }
  gt(e, t) {
    return this.setLimit(`min`, e, !1, X.toString(t));
  }
  lte(e, t) {
    return this.setLimit(`max`, e, !0, X.toString(t));
  }
  lt(e, t) {
    return this.setLimit(`max`, e, !1, X.toString(t));
  }
  setLimit(t, n, r, i) {
    return new e({
      ...this._def,
      checks: [...this._def.checks, { kind: t, value: n, inclusive: r, message: X.toString(i) }],
    });
  }
  _addCheck(t) {
    return new e({ ...this._def, checks: [...this._def.checks, t] });
  }
  positive(e) {
    return this._addCheck({ kind: `min`, value: BigInt(0), inclusive: !1, message: X.toString(e) });
  }
  negative(e) {
    return this._addCheck({ kind: `max`, value: BigInt(0), inclusive: !1, message: X.toString(e) });
  }
  nonpositive(e) {
    return this._addCheck({ kind: `max`, value: BigInt(0), inclusive: !0, message: X.toString(e) });
  }
  nonnegative(e) {
    return this._addCheck({ kind: `min`, value: BigInt(0), inclusive: !0, message: X.toString(e) });
  }
  multipleOf(e, t) {
    return this._addCheck({ kind: `multipleOf`, value: e, message: X.toString(t) });
  }
  get minValue() {
    let e = null;
    for (let t of this._def.checks)
      t.kind === `min` && (e === null || t.value > e) && (e = t.value);
    return e;
  }
  get maxValue() {
    let e = null;
    for (let t of this._def.checks)
      t.kind === `max` && (e === null || t.value < e) && (e = t.value);
    return e;
  }
};
dS.create = (e) => new dS({ checks: [], typeName: $.ZodBigInt, coerce: e?.coerce ?? !1, ...Z(e) });
var fS = class extends Q {
  _parse(e) {
    if ((this._def.coerce && (e.data = !!e.data), this._getType(e) !== K.boolean)) {
      let t = this._getOrReturnCtx(e);
      return (J(t, { code: q.invalid_type, expected: K.boolean, received: t.parsedType }), Y);
    }
    return jx(e.data);
  }
};
fS.create = (e) => new fS({ typeName: $.ZodBoolean, coerce: e?.coerce || !1, ...Z(e) });
var pS = class e extends Q {
  _parse(e) {
    if ((this._def.coerce && (e.data = new Date(e.data)), this._getType(e) !== K.date)) {
      let t = this._getOrReturnCtx(e);
      return (J(t, { code: q.invalid_type, expected: K.date, received: t.parsedType }), Y);
    }
    if (Number.isNaN(e.data.getTime()))
      return (J(this._getOrReturnCtx(e), { code: q.invalid_date }), Y);
    let t = new kx(),
      n;
    for (let r of this._def.checks)
      r.kind === `min`
        ? e.data.getTime() < r.value &&
          ((n = this._getOrReturnCtx(e, n)),
          J(n, {
            code: q.too_small,
            message: r.message,
            inclusive: !0,
            exact: !1,
            minimum: r.value,
            type: `date`,
          }),
          t.dirty())
        : r.kind === `max`
          ? e.data.getTime() > r.value &&
            ((n = this._getOrReturnCtx(e, n)),
            J(n, {
              code: q.too_big,
              message: r.message,
              inclusive: !0,
              exact: !1,
              maximum: r.value,
              type: `date`,
            }),
            t.dirty())
          : xx.assertNever(r);
    return { status: t.value, value: new Date(e.data.getTime()) };
  }
  _addCheck(t) {
    return new e({ ...this._def, checks: [...this._def.checks, t] });
  }
  min(e, t) {
    return this._addCheck({ kind: `min`, value: e.getTime(), message: X.toString(t) });
  }
  max(e, t) {
    return this._addCheck({ kind: `max`, value: e.getTime(), message: X.toString(t) });
  }
  get minDate() {
    let e = null;
    for (let t of this._def.checks)
      t.kind === `min` && (e === null || t.value > e) && (e = t.value);
    return e == null ? null : new Date(e);
  }
  get maxDate() {
    let e = null;
    for (let t of this._def.checks)
      t.kind === `max` && (e === null || t.value < e) && (e = t.value);
    return e == null ? null : new Date(e);
  }
};
pS.create = (e) => new pS({ checks: [], coerce: e?.coerce || !1, typeName: $.ZodDate, ...Z(e) });
var mS = class extends Q {
  _parse(e) {
    if (this._getType(e) !== K.symbol) {
      let t = this._getOrReturnCtx(e);
      return (J(t, { code: q.invalid_type, expected: K.symbol, received: t.parsedType }), Y);
    }
    return jx(e.data);
  }
};
mS.create = (e) => new mS({ typeName: $.ZodSymbol, ...Z(e) });
var hS = class extends Q {
  _parse(e) {
    if (this._getType(e) !== K.undefined) {
      let t = this._getOrReturnCtx(e);
      return (J(t, { code: q.invalid_type, expected: K.undefined, received: t.parsedType }), Y);
    }
    return jx(e.data);
  }
};
hS.create = (e) => new hS({ typeName: $.ZodUndefined, ...Z(e) });
var gS = class extends Q {
  _parse(e) {
    if (this._getType(e) !== K.null) {
      let t = this._getOrReturnCtx(e);
      return (J(t, { code: q.invalid_type, expected: K.null, received: t.parsedType }), Y);
    }
    return jx(e.data);
  }
};
gS.create = (e) => new gS({ typeName: $.ZodNull, ...Z(e) });
var _S = class extends Q {
  constructor() {
    (super(...arguments), (this._any = !0));
  }
  _parse(e) {
    return jx(e.data);
  }
};
_S.create = (e) => new _S({ typeName: $.ZodAny, ...Z(e) });
var vS = class extends Q {
  constructor() {
    (super(...arguments), (this._unknown = !0));
  }
  _parse(e) {
    return jx(e.data);
  }
};
vS.create = (e) => new vS({ typeName: $.ZodUnknown, ...Z(e) });
var yS = class extends Q {
  _parse(e) {
    let t = this._getOrReturnCtx(e);
    return (J(t, { code: q.invalid_type, expected: K.never, received: t.parsedType }), Y);
  }
};
yS.create = (e) => new yS({ typeName: $.ZodNever, ...Z(e) });
var bS = class extends Q {
  _parse(e) {
    if (this._getType(e) !== K.undefined) {
      let t = this._getOrReturnCtx(e);
      return (J(t, { code: q.invalid_type, expected: K.void, received: t.parsedType }), Y);
    }
    return jx(e.data);
  }
};
bS.create = (e) => new bS({ typeName: $.ZodVoid, ...Z(e) });
var xS = class e extends Q {
  _parse(e) {
    let { ctx: t, status: n } = this._processInputParams(e),
      r = this._def;
    if (t.parsedType !== K.array)
      return (J(t, { code: q.invalid_type, expected: K.array, received: t.parsedType }), Y);
    if (r.exactLength !== null) {
      let e = t.data.length > r.exactLength.value,
        i = t.data.length < r.exactLength.value;
      (e || i) &&
        (J(t, {
          code: e ? q.too_big : q.too_small,
          minimum: i ? r.exactLength.value : void 0,
          maximum: e ? r.exactLength.value : void 0,
          type: `array`,
          inclusive: !0,
          exact: !0,
          message: r.exactLength.message,
        }),
        n.dirty());
    }
    if (
      (r.minLength !== null &&
        t.data.length < r.minLength.value &&
        (J(t, {
          code: q.too_small,
          minimum: r.minLength.value,
          type: `array`,
          inclusive: !0,
          exact: !1,
          message: r.minLength.message,
        }),
        n.dirty()),
      r.maxLength !== null &&
        t.data.length > r.maxLength.value &&
        (J(t, {
          code: q.too_big,
          maximum: r.maxLength.value,
          type: `array`,
          inclusive: !0,
          exact: !1,
          message: r.maxLength.message,
        }),
        n.dirty()),
      t.common.async)
    )
      return Promise.all(
        [...t.data].map((e, n) => r.type._parseAsync(new Ix(t, e, t.path, n))),
      ).then((e) => kx.mergeArray(n, e));
    let i = [...t.data].map((e, n) => r.type._parseSync(new Ix(t, e, t.path, n)));
    return kx.mergeArray(n, i);
  }
  get element() {
    return this._def.type;
  }
  min(t, n) {
    return new e({ ...this._def, minLength: { value: t, message: X.toString(n) } });
  }
  max(t, n) {
    return new e({ ...this._def, maxLength: { value: t, message: X.toString(n) } });
  }
  length(t, n) {
    return new e({ ...this._def, exactLength: { value: t, message: X.toString(n) } });
  }
  nonempty(e) {
    return this.min(1, e);
  }
};
xS.create = (e, t) =>
  new xS({
    type: e,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: $.ZodArray,
    ...Z(t),
  });
function SS(e) {
  if (e instanceof CS) {
    let t = {};
    for (let n in e.shape) {
      let r = e.shape[n];
      t[n] = VS.create(SS(r));
    }
    return new CS({ ...e._def, shape: () => t });
  }
  return e instanceof xS
    ? new xS({ ...e._def, type: SS(e.element) })
    : e instanceof VS
      ? VS.create(SS(e.unwrap()))
      : e instanceof HS
        ? HS.create(SS(e.unwrap()))
        : e instanceof kS
          ? kS.create(e.items.map((e) => SS(e)))
          : e;
}
var CS = class e extends Q {
  constructor() {
    (super(...arguments),
      (this._cached = null),
      (this.nonstrict = this.passthrough),
      (this.augment = this.extend));
  }
  _getCached() {
    if (this._cached !== null) return this._cached;
    let e = this._def.shape(),
      t = xx.objectKeys(e);
    return ((this._cached = { shape: e, keys: t }), this._cached);
  }
  _parse(e) {
    if (this._getType(e) !== K.object) {
      let t = this._getOrReturnCtx(e);
      return (J(t, { code: q.invalid_type, expected: K.object, received: t.parsedType }), Y);
    }
    let { status: t, ctx: n } = this._processInputParams(e),
      { shape: r, keys: i } = this._getCached(),
      a = [];
    if (!(this._def.catchall instanceof yS && this._def.unknownKeys === `strip`))
      for (let e in n.data) i.includes(e) || a.push(e);
    let o = [];
    for (let e of i) {
      let t = r[e],
        i = n.data[e];
      o.push({
        key: { status: `valid`, value: e },
        value: t._parse(new Ix(n, i, n.path, e)),
        alwaysSet: e in n.data,
      });
    }
    if (this._def.catchall instanceof yS) {
      let e = this._def.unknownKeys;
      if (e === `passthrough`)
        for (let e of a)
          o.push({
            key: { status: `valid`, value: e },
            value: { status: `valid`, value: n.data[e] },
          });
      else if (e === `strict`)
        a.length > 0 && (J(n, { code: q.unrecognized_keys, keys: a }), t.dirty());
      else if (e !== `strip`) throw Error(`Internal ZodObject error: invalid unknownKeys value.`);
    } else {
      let e = this._def.catchall;
      for (let t of a) {
        let r = n.data[t];
        o.push({
          key: { status: `valid`, value: t },
          value: e._parse(new Ix(n, r, n.path, t)),
          alwaysSet: t in n.data,
        });
      }
    }
    return n.common.async
      ? Promise.resolve()
          .then(async () => {
            let e = [];
            for (let t of o) {
              let n = await t.key,
                r = await t.value;
              e.push({ key: n, value: r, alwaysSet: t.alwaysSet });
            }
            return e;
          })
          .then((e) => kx.mergeObjectSync(t, e))
      : kx.mergeObjectSync(t, o);
  }
  get shape() {
    return this._def.shape();
  }
  strict(t) {
    return (
      X.errToObj,
      new e({
        ...this._def,
        unknownKeys: `strict`,
        ...(t === void 0
          ? {}
          : {
              errorMap: (e, n) => {
                let r = this._def.errorMap?.(e, n).message ?? n.defaultError;
                return e.code === `unrecognized_keys`
                  ? { message: X.errToObj(t).message ?? r }
                  : { message: r };
              },
            }),
      })
    );
  }
  strip() {
    return new e({ ...this._def, unknownKeys: `strip` });
  }
  passthrough() {
    return new e({ ...this._def, unknownKeys: `passthrough` });
  }
  extend(t) {
    return new e({ ...this._def, shape: () => ({ ...this._def.shape(), ...t }) });
  }
  merge(t) {
    return new e({
      unknownKeys: t._def.unknownKeys,
      catchall: t._def.catchall,
      shape: () => ({ ...this._def.shape(), ...t._def.shape() }),
      typeName: $.ZodObject,
    });
  }
  setKey(e, t) {
    return this.augment({ [e]: t });
  }
  catchall(t) {
    return new e({ ...this._def, catchall: t });
  }
  pick(t) {
    let n = {};
    for (let e of xx.objectKeys(t)) t[e] && this.shape[e] && (n[e] = this.shape[e]);
    return new e({ ...this._def, shape: () => n });
  }
  omit(t) {
    let n = {};
    for (let e of xx.objectKeys(this.shape)) t[e] || (n[e] = this.shape[e]);
    return new e({ ...this._def, shape: () => n });
  }
  deepPartial() {
    return SS(this);
  }
  partial(t) {
    let n = {};
    for (let e of xx.objectKeys(this.shape)) {
      let r = this.shape[e];
      n[e] = t && !t[e] ? r : r.optional();
    }
    return new e({ ...this._def, shape: () => n });
  }
  required(t) {
    let n = {};
    for (let e of xx.objectKeys(this.shape))
      if (t && !t[e]) n[e] = this.shape[e];
      else {
        let t = this.shape[e];
        for (; t instanceof VS;) t = t._def.innerType;
        n[e] = t;
      }
    return new e({ ...this._def, shape: () => n });
  }
  keyof() {
    return IS(xx.objectKeys(this.shape));
  }
};
((CS.create = (e, t) =>
  new CS({
    shape: () => e,
    unknownKeys: `strip`,
    catchall: yS.create(),
    typeName: $.ZodObject,
    ...Z(t),
  })),
  (CS.strictCreate = (e, t) =>
    new CS({
      shape: () => e,
      unknownKeys: `strict`,
      catchall: yS.create(),
      typeName: $.ZodObject,
      ...Z(t),
    })),
  (CS.lazycreate = (e, t) =>
    new CS({
      shape: e,
      unknownKeys: `strip`,
      catchall: yS.create(),
      typeName: $.ZodObject,
      ...Z(t),
    })));
var wS = class extends Q {
  _parse(e) {
    let { ctx: t } = this._processInputParams(e),
      n = this._def.options;
    function r(e) {
      for (let t of e) if (t.result.status === `valid`) return t.result;
      for (let n of e)
        if (n.result.status === `dirty`)
          return (t.common.issues.push(...n.ctx.common.issues), n.result);
      let n = e.map((e) => new wx(e.ctx.common.issues));
      return (J(t, { code: q.invalid_union, unionErrors: n }), Y);
    }
    if (t.common.async)
      return Promise.all(
        n.map(async (e) => {
          let n = { ...t, common: { ...t.common, issues: [] }, parent: null };
          return { result: await e._parseAsync({ data: t.data, path: t.path, parent: n }), ctx: n };
        }),
      ).then(r);
    {
      let e,
        r = [];
      for (let i of n) {
        let n = { ...t, common: { ...t.common, issues: [] }, parent: null },
          a = i._parseSync({ data: t.data, path: t.path, parent: n });
        if (a.status === `valid`) return a;
        (a.status === `dirty` && !e && (e = { result: a, ctx: n }),
          n.common.issues.length && r.push(n.common.issues));
      }
      if (e) return (t.common.issues.push(...e.ctx.common.issues), e.result);
      let i = r.map((e) => new wx(e));
      return (J(t, { code: q.invalid_union, unionErrors: i }), Y);
    }
  }
  get options() {
    return this._def.options;
  }
};
wS.create = (e, t) => new wS({ options: e, typeName: $.ZodUnion, ...Z(t) });
var TS = (e) =>
    e instanceof PS
      ? TS(e.schema)
      : e instanceof BS
        ? TS(e.innerType())
        : e instanceof FS
          ? [e.value]
          : e instanceof LS
            ? e.options
            : e instanceof RS
              ? xx.objectValues(e.enum)
              : e instanceof US
                ? TS(e._def.innerType)
                : e instanceof hS
                  ? [void 0]
                  : e instanceof gS
                    ? [null]
                    : e instanceof VS
                      ? [void 0, ...TS(e.unwrap())]
                      : e instanceof HS
                        ? [null, ...TS(e.unwrap())]
                        : e instanceof KS || e instanceof JS
                          ? TS(e.unwrap())
                          : e instanceof WS
                            ? TS(e._def.innerType)
                            : [],
  ES = class e extends Q {
    _parse(e) {
      let { ctx: t } = this._processInputParams(e);
      if (t.parsedType !== K.object)
        return (J(t, { code: q.invalid_type, expected: K.object, received: t.parsedType }), Y);
      let n = this.discriminator,
        r = t.data[n],
        i = this.optionsMap.get(r);
      return i
        ? t.common.async
          ? i._parseAsync({ data: t.data, path: t.path, parent: t })
          : i._parseSync({ data: t.data, path: t.path, parent: t })
        : (J(t, {
            code: q.invalid_union_discriminator,
            options: Array.from(this.optionsMap.keys()),
            path: [n],
          }),
          Y);
    }
    get discriminator() {
      return this._def.discriminator;
    }
    get options() {
      return this._def.options;
    }
    get optionsMap() {
      return this._def.optionsMap;
    }
    static create(t, n, r) {
      let i = new Map();
      for (let e of n) {
        let n = TS(e.shape[t]);
        if (!n.length)
          throw Error(
            `A discriminator value for key \`${t}\` could not be extracted from all schema options`,
          );
        for (let r of n) {
          if (i.has(r))
            throw Error(`Discriminator property ${String(t)} has duplicate value ${String(r)}`);
          i.set(r, e);
        }
      }
      return new e({
        typeName: $.ZodDiscriminatedUnion,
        discriminator: t,
        options: n,
        optionsMap: i,
        ...Z(r),
      });
    }
  };
function DS(e, t) {
  let n = Cx(e),
    r = Cx(t);
  if (e === t) return { valid: !0, data: e };
  if (n === K.object && r === K.object) {
    let n = xx.objectKeys(t),
      r = xx.objectKeys(e).filter((e) => n.indexOf(e) !== -1),
      i = { ...e, ...t };
    for (let n of r) {
      let r = DS(e[n], t[n]);
      if (!r.valid) return { valid: !1 };
      i[n] = r.data;
    }
    return { valid: !0, data: i };
  }
  if (n === K.array && r === K.array) {
    if (e.length !== t.length) return { valid: !1 };
    let n = [];
    for (let r = 0; r < e.length; r++) {
      let i = e[r],
        a = t[r],
        o = DS(i, a);
      if (!o.valid) return { valid: !1 };
      n.push(o.data);
    }
    return { valid: !0, data: n };
  }
  return n === K.date && r === K.date && +e == +t ? { valid: !0, data: e } : { valid: !1 };
}
var OS = class extends Q {
  _parse(e) {
    let { status: t, ctx: n } = this._processInputParams(e),
      r = (e, r) => {
        if (Mx(e) || Mx(r)) return Y;
        let i = DS(e.value, r.value);
        return i.valid
          ? ((Nx(e) || Nx(r)) && t.dirty(), { status: t.value, value: i.data })
          : (J(n, { code: q.invalid_intersection_types }), Y);
      };
    return n.common.async
      ? Promise.all([
          this._def.left._parseAsync({ data: n.data, path: n.path, parent: n }),
          this._def.right._parseAsync({ data: n.data, path: n.path, parent: n }),
        ]).then(([e, t]) => r(e, t))
      : r(
          this._def.left._parseSync({ data: n.data, path: n.path, parent: n }),
          this._def.right._parseSync({ data: n.data, path: n.path, parent: n }),
        );
  }
};
OS.create = (e, t, n) => new OS({ left: e, right: t, typeName: $.ZodIntersection, ...Z(n) });
var kS = class e extends Q {
  _parse(e) {
    let { status: t, ctx: n } = this._processInputParams(e);
    if (n.parsedType !== K.array)
      return (J(n, { code: q.invalid_type, expected: K.array, received: n.parsedType }), Y);
    if (n.data.length < this._def.items.length)
      return (
        J(n, {
          code: q.too_small,
          minimum: this._def.items.length,
          inclusive: !0,
          exact: !1,
          type: `array`,
        }),
        Y
      );
    !this._def.rest &&
      n.data.length > this._def.items.length &&
      (J(n, {
        code: q.too_big,
        maximum: this._def.items.length,
        inclusive: !0,
        exact: !1,
        type: `array`,
      }),
      t.dirty());
    let r = [...n.data]
      .map((e, t) => {
        let r = this._def.items[t] || this._def.rest;
        return r ? r._parse(new Ix(n, e, n.path, t)) : null;
      })
      .filter((e) => !!e);
    return n.common.async ? Promise.all(r).then((e) => kx.mergeArray(t, e)) : kx.mergeArray(t, r);
  }
  get items() {
    return this._def.items;
  }
  rest(t) {
    return new e({ ...this._def, rest: t });
  }
};
kS.create = (e, t) => {
  if (!Array.isArray(e)) throw Error(`You must pass an array of schemas to z.tuple([ ... ])`);
  return new kS({ items: e, typeName: $.ZodTuple, rest: null, ...Z(t) });
};
var AS = class e extends Q {
    get keySchema() {
      return this._def.keyType;
    }
    get valueSchema() {
      return this._def.valueType;
    }
    _parse(e) {
      let { status: t, ctx: n } = this._processInputParams(e);
      if (n.parsedType !== K.object)
        return (J(n, { code: q.invalid_type, expected: K.object, received: n.parsedType }), Y);
      let r = [],
        i = this._def.keyType,
        a = this._def.valueType;
      for (let e in n.data)
        r.push({
          key: i._parse(new Ix(n, e, n.path, e)),
          value: a._parse(new Ix(n, n.data[e], n.path, e)),
          alwaysSet: e in n.data,
        });
      return n.common.async ? kx.mergeObjectAsync(t, r) : kx.mergeObjectSync(t, r);
    }
    get element() {
      return this._def.valueType;
    }
    static create(t, n, r) {
      return n instanceof Q
        ? new e({ keyType: t, valueType: n, typeName: $.ZodRecord, ...Z(r) })
        : new e({ keyType: cS.create(), valueType: t, typeName: $.ZodRecord, ...Z(n) });
    }
  },
  jS = class extends Q {
    get keySchema() {
      return this._def.keyType;
    }
    get valueSchema() {
      return this._def.valueType;
    }
    _parse(e) {
      let { status: t, ctx: n } = this._processInputParams(e);
      if (n.parsedType !== K.map)
        return (J(n, { code: q.invalid_type, expected: K.map, received: n.parsedType }), Y);
      let r = this._def.keyType,
        i = this._def.valueType,
        a = [...n.data.entries()].map(([e, t], a) => ({
          key: r._parse(new Ix(n, e, n.path, [a, `key`])),
          value: i._parse(new Ix(n, t, n.path, [a, `value`])),
        }));
      if (n.common.async) {
        let e = new Map();
        return Promise.resolve().then(async () => {
          for (let n of a) {
            let r = await n.key,
              i = await n.value;
            if (r.status === `aborted` || i.status === `aborted`) return Y;
            ((r.status === `dirty` || i.status === `dirty`) && t.dirty(), e.set(r.value, i.value));
          }
          return { status: t.value, value: e };
        });
      }
      {
        let e = new Map();
        for (let n of a) {
          let r = n.key,
            i = n.value;
          if (r.status === `aborted` || i.status === `aborted`) return Y;
          ((r.status === `dirty` || i.status === `dirty`) && t.dirty(), e.set(r.value, i.value));
        }
        return { status: t.value, value: e };
      }
    }
  };
jS.create = (e, t, n) => new jS({ valueType: t, keyType: e, typeName: $.ZodMap, ...Z(n) });
var MS = class e extends Q {
  _parse(e) {
    let { status: t, ctx: n } = this._processInputParams(e);
    if (n.parsedType !== K.set)
      return (J(n, { code: q.invalid_type, expected: K.set, received: n.parsedType }), Y);
    let r = this._def;
    (r.minSize !== null &&
      n.data.size < r.minSize.value &&
      (J(n, {
        code: q.too_small,
        minimum: r.minSize.value,
        type: `set`,
        inclusive: !0,
        exact: !1,
        message: r.minSize.message,
      }),
      t.dirty()),
      r.maxSize !== null &&
        n.data.size > r.maxSize.value &&
        (J(n, {
          code: q.too_big,
          maximum: r.maxSize.value,
          type: `set`,
          inclusive: !0,
          exact: !1,
          message: r.maxSize.message,
        }),
        t.dirty()));
    let i = this._def.valueType;
    function a(e) {
      let n = new Set();
      for (let r of e) {
        if (r.status === `aborted`) return Y;
        (r.status === `dirty` && t.dirty(), n.add(r.value));
      }
      return { status: t.value, value: n };
    }
    let o = [...n.data.values()].map((e, t) => i._parse(new Ix(n, e, n.path, t)));
    return n.common.async ? Promise.all(o).then((e) => a(e)) : a(o);
  }
  min(t, n) {
    return new e({ ...this._def, minSize: { value: t, message: X.toString(n) } });
  }
  max(t, n) {
    return new e({ ...this._def, maxSize: { value: t, message: X.toString(n) } });
  }
  size(e, t) {
    return this.min(e, t).max(e, t);
  }
  nonempty(e) {
    return this.min(1, e);
  }
};
MS.create = (e, t) =>
  new MS({ valueType: e, minSize: null, maxSize: null, typeName: $.ZodSet, ...Z(t) });
var NS = class e extends Q {
    constructor() {
      (super(...arguments), (this.validate = this.implement));
    }
    _parse(e) {
      let { ctx: t } = this._processInputParams(e);
      if (t.parsedType !== K.function)
        return (J(t, { code: q.invalid_type, expected: K.function, received: t.parsedType }), Y);
      function n(e, n) {
        return Ox({
          data: e,
          path: t.path,
          errorMaps: [t.common.contextualErrorMap, t.schemaErrorMap, Dx(), Tx].filter((e) => !!e),
          issueData: { code: q.invalid_arguments, argumentsError: n },
        });
      }
      function r(e, n) {
        return Ox({
          data: e,
          path: t.path,
          errorMaps: [t.common.contextualErrorMap, t.schemaErrorMap, Dx(), Tx].filter((e) => !!e),
          issueData: { code: q.invalid_return_type, returnTypeError: n },
        });
      }
      let i = { errorMap: t.common.contextualErrorMap },
        a = t.data;
      if (this._def.returns instanceof zS) {
        let e = this;
        return jx(async function (...t) {
          let o = new wx([]),
            s = await e._def.args.parseAsync(t, i).catch((e) => {
              throw (o.addIssue(n(t, e)), o);
            }),
            c = await Reflect.apply(a, this, s);
          return await e._def.returns._def.type.parseAsync(c, i).catch((e) => {
            throw (o.addIssue(r(c, e)), o);
          });
        });
      }
      {
        let e = this;
        return jx(function (...t) {
          let o = e._def.args.safeParse(t, i);
          if (!o.success) throw new wx([n(t, o.error)]);
          let s = Reflect.apply(a, this, o.data),
            c = e._def.returns.safeParse(s, i);
          if (!c.success) throw new wx([r(s, c.error)]);
          return c.data;
        });
      }
    }
    parameters() {
      return this._def.args;
    }
    returnType() {
      return this._def.returns;
    }
    args(...t) {
      return new e({ ...this._def, args: kS.create(t).rest(vS.create()) });
    }
    returns(t) {
      return new e({ ...this._def, returns: t });
    }
    implement(e) {
      return this.parse(e);
    }
    strictImplement(e) {
      return this.parse(e);
    }
    static create(t, n, r) {
      return new e({
        args: t || kS.create([]).rest(vS.create()),
        returns: n || vS.create(),
        typeName: $.ZodFunction,
        ...Z(r),
      });
    }
  },
  PS = class extends Q {
    get schema() {
      return this._def.getter();
    }
    _parse(e) {
      let { ctx: t } = this._processInputParams(e);
      return this._def.getter()._parse({ data: t.data, path: t.path, parent: t });
    }
  };
PS.create = (e, t) => new PS({ getter: e, typeName: $.ZodLazy, ...Z(t) });
var FS = class extends Q {
  _parse(e) {
    if (e.data !== this._def.value) {
      let t = this._getOrReturnCtx(e);
      return (J(t, { received: t.data, code: q.invalid_literal, expected: this._def.value }), Y);
    }
    return { status: `valid`, value: e.data };
  }
  get value() {
    return this._def.value;
  }
};
FS.create = (e, t) => new FS({ value: e, typeName: $.ZodLiteral, ...Z(t) });
function IS(e, t) {
  return new LS({ values: e, typeName: $.ZodEnum, ...Z(t) });
}
var LS = class e extends Q {
  _parse(e) {
    if (typeof e.data != `string`) {
      let t = this._getOrReturnCtx(e),
        n = this._def.values;
      return (
        J(t, { expected: xx.joinValues(n), received: t.parsedType, code: q.invalid_type }),
        Y
      );
    }
    if (((this._cache ||= new Set(this._def.values)), !this._cache.has(e.data))) {
      let t = this._getOrReturnCtx(e),
        n = this._def.values;
      return (J(t, { received: t.data, code: q.invalid_enum_value, options: n }), Y);
    }
    return jx(e.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    let e = {};
    for (let t of this._def.values) e[t] = t;
    return e;
  }
  get Values() {
    let e = {};
    for (let t of this._def.values) e[t] = t;
    return e;
  }
  get Enum() {
    let e = {};
    for (let t of this._def.values) e[t] = t;
    return e;
  }
  extract(t, n = this._def) {
    return e.create(t, { ...this._def, ...n });
  }
  exclude(t, n = this._def) {
    return e.create(
      this.options.filter((e) => !t.includes(e)),
      { ...this._def, ...n },
    );
  }
};
LS.create = IS;
var RS = class extends Q {
  _parse(e) {
    let t = xx.getValidEnumValues(this._def.values),
      n = this._getOrReturnCtx(e);
    if (n.parsedType !== K.string && n.parsedType !== K.number) {
      let e = xx.objectValues(t);
      return (
        J(n, { expected: xx.joinValues(e), received: n.parsedType, code: q.invalid_type }),
        Y
      );
    }
    if (
      ((this._cache ||= new Set(xx.getValidEnumValues(this._def.values))), !this._cache.has(e.data))
    ) {
      let e = xx.objectValues(t);
      return (J(n, { received: n.data, code: q.invalid_enum_value, options: e }), Y);
    }
    return jx(e.data);
  }
  get enum() {
    return this._def.values;
  }
};
RS.create = (e, t) => new RS({ values: e, typeName: $.ZodNativeEnum, ...Z(t) });
var zS = class extends Q {
  unwrap() {
    return this._def.type;
  }
  _parse(e) {
    let { ctx: t } = this._processInputParams(e);
    return t.parsedType !== K.promise && t.common.async === !1
      ? (J(t, { code: q.invalid_type, expected: K.promise, received: t.parsedType }), Y)
      : jx(
          (t.parsedType === K.promise ? t.data : Promise.resolve(t.data)).then((e) =>
            this._def.type.parseAsync(e, { path: t.path, errorMap: t.common.contextualErrorMap }),
          ),
        );
  }
};
zS.create = (e, t) => new zS({ type: e, typeName: $.ZodPromise, ...Z(t) });
var BS = class extends Q {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === $.ZodEffects
      ? this._def.schema.sourceType()
      : this._def.schema;
  }
  _parse(e) {
    let { status: t, ctx: n } = this._processInputParams(e),
      r = this._def.effect || null,
      i = {
        addIssue: (e) => {
          (J(n, e), e.fatal ? t.abort() : t.dirty());
        },
        get path() {
          return n.path;
        },
      };
    if (((i.addIssue = i.addIssue.bind(i)), r.type === `preprocess`)) {
      let e = r.transform(n.data, i);
      if (n.common.async)
        return Promise.resolve(e).then(async (e) => {
          if (t.value === `aborted`) return Y;
          let r = await this._def.schema._parseAsync({ data: e, path: n.path, parent: n });
          return r.status === `aborted`
            ? Y
            : r.status === `dirty` || t.value === `dirty`
              ? Ax(r.value)
              : r;
        });
      {
        if (t.value === `aborted`) return Y;
        let r = this._def.schema._parseSync({ data: e, path: n.path, parent: n });
        return r.status === `aborted`
          ? Y
          : r.status === `dirty` || t.value === `dirty`
            ? Ax(r.value)
            : r;
      }
    }
    if (r.type === `refinement`) {
      let e = (e) => {
        let t = r.refinement(e, i);
        if (n.common.async) return Promise.resolve(t);
        if (t instanceof Promise)
          throw Error(
            `Async refinement encountered during synchronous parse operation. Use .parseAsync instead.`,
          );
        return e;
      };
      if (n.common.async === !1) {
        let r = this._def.schema._parseSync({ data: n.data, path: n.path, parent: n });
        return r.status === `aborted`
          ? Y
          : (r.status === `dirty` && t.dirty(), e(r.value), { status: t.value, value: r.value });
      }
      return this._def.schema
        ._parseAsync({ data: n.data, path: n.path, parent: n })
        .then((n) =>
          n.status === `aborted`
            ? Y
            : (n.status === `dirty` && t.dirty(),
              e(n.value).then(() => ({ status: t.value, value: n.value }))),
        );
    }
    if (r.type === `transform`) {
      if (n.common.async === !1) {
        let e = this._def.schema._parseSync({ data: n.data, path: n.path, parent: n });
        if (!Px(e)) return Y;
        let a = r.transform(e.value, i);
        if (a instanceof Promise)
          throw Error(
            `Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`,
          );
        return { status: t.value, value: a };
      }
      return this._def.schema
        ._parseAsync({ data: n.data, path: n.path, parent: n })
        .then((e) =>
          Px(e)
            ? Promise.resolve(r.transform(e.value, i)).then((e) => ({ status: t.value, value: e }))
            : Y,
        );
    }
    xx.assertNever(r);
  }
};
((BS.create = (e, t, n) => new BS({ schema: e, typeName: $.ZodEffects, effect: t, ...Z(n) })),
  (BS.createWithPreprocess = (e, t, n) =>
    new BS({
      schema: t,
      effect: { type: `preprocess`, transform: e },
      typeName: $.ZodEffects,
      ...Z(n),
    })));
var VS = class extends Q {
  _parse(e) {
    return this._getType(e) === K.undefined ? jx(void 0) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
};
VS.create = (e, t) => new VS({ innerType: e, typeName: $.ZodOptional, ...Z(t) });
var HS = class extends Q {
  _parse(e) {
    return this._getType(e) === K.null ? jx(null) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
};
HS.create = (e, t) => new HS({ innerType: e, typeName: $.ZodNullable, ...Z(t) });
var US = class extends Q {
  _parse(e) {
    let { ctx: t } = this._processInputParams(e),
      n = t.data;
    return (
      t.parsedType === K.undefined && (n = this._def.defaultValue()),
      this._def.innerType._parse({ data: n, path: t.path, parent: t })
    );
  }
  removeDefault() {
    return this._def.innerType;
  }
};
US.create = (e, t) =>
  new US({
    innerType: e,
    typeName: $.ZodDefault,
    defaultValue: typeof t.default == `function` ? t.default : () => t.default,
    ...Z(t),
  });
var WS = class extends Q {
  _parse(e) {
    let { ctx: t } = this._processInputParams(e),
      n = { ...t, common: { ...t.common, issues: [] } },
      r = this._def.innerType._parse({ data: n.data, path: n.path, parent: { ...n } });
    return Fx(r)
      ? r.then((e) => ({
          status: `valid`,
          value:
            e.status === `valid`
              ? e.value
              : this._def.catchValue({
                  get error() {
                    return new wx(n.common.issues);
                  },
                  input: n.data,
                }),
        }))
      : {
          status: `valid`,
          value:
            r.status === `valid`
              ? r.value
              : this._def.catchValue({
                  get error() {
                    return new wx(n.common.issues);
                  },
                  input: n.data,
                }),
        };
  }
  removeCatch() {
    return this._def.innerType;
  }
};
WS.create = (e, t) =>
  new WS({
    innerType: e,
    typeName: $.ZodCatch,
    catchValue: typeof t.catch == `function` ? t.catch : () => t.catch,
    ...Z(t),
  });
var GS = class extends Q {
  _parse(e) {
    if (this._getType(e) !== K.nan) {
      let t = this._getOrReturnCtx(e);
      return (J(t, { code: q.invalid_type, expected: K.nan, received: t.parsedType }), Y);
    }
    return { status: `valid`, value: e.data };
  }
};
GS.create = (e) => new GS({ typeName: $.ZodNaN, ...Z(e) });
var KS = class extends Q {
    _parse(e) {
      let { ctx: t } = this._processInputParams(e),
        n = t.data;
      return this._def.type._parse({ data: n, path: t.path, parent: t });
    }
    unwrap() {
      return this._def.type;
    }
  },
  qS = class e extends Q {
    _parse(e) {
      let { status: t, ctx: n } = this._processInputParams(e);
      if (n.common.async)
        return (async () => {
          let e = await this._def.in._parseAsync({ data: n.data, path: n.path, parent: n });
          return e.status === `aborted`
            ? Y
            : e.status === `dirty`
              ? (t.dirty(), Ax(e.value))
              : this._def.out._parseAsync({ data: e.value, path: n.path, parent: n });
        })();
      {
        let e = this._def.in._parseSync({ data: n.data, path: n.path, parent: n });
        return e.status === `aborted`
          ? Y
          : e.status === `dirty`
            ? (t.dirty(), { status: `dirty`, value: e.value })
            : this._def.out._parseSync({ data: e.value, path: n.path, parent: n });
      }
    }
    static create(t, n) {
      return new e({ in: t, out: n, typeName: $.ZodPipeline });
    }
  },
  JS = class extends Q {
    _parse(e) {
      let t = this._def.innerType._parse(e),
        n = (e) => (Px(e) && (e.value = Object.freeze(e.value)), e);
      return Fx(t) ? t.then((e) => n(e)) : n(t);
    }
    unwrap() {
      return this._def.innerType;
    }
  };
((JS.create = (e, t) => new JS({ innerType: e, typeName: $.ZodReadonly, ...Z(t) })), CS.lazycreate);
var $;
(function (e) {
  ((e.ZodString = `ZodString`),
    (e.ZodNumber = `ZodNumber`),
    (e.ZodNaN = `ZodNaN`),
    (e.ZodBigInt = `ZodBigInt`),
    (e.ZodBoolean = `ZodBoolean`),
    (e.ZodDate = `ZodDate`),
    (e.ZodSymbol = `ZodSymbol`),
    (e.ZodUndefined = `ZodUndefined`),
    (e.ZodNull = `ZodNull`),
    (e.ZodAny = `ZodAny`),
    (e.ZodUnknown = `ZodUnknown`),
    (e.ZodNever = `ZodNever`),
    (e.ZodVoid = `ZodVoid`),
    (e.ZodArray = `ZodArray`),
    (e.ZodObject = `ZodObject`),
    (e.ZodUnion = `ZodUnion`),
    (e.ZodDiscriminatedUnion = `ZodDiscriminatedUnion`),
    (e.ZodIntersection = `ZodIntersection`),
    (e.ZodTuple = `ZodTuple`),
    (e.ZodRecord = `ZodRecord`),
    (e.ZodMap = `ZodMap`),
    (e.ZodSet = `ZodSet`),
    (e.ZodFunction = `ZodFunction`),
    (e.ZodLazy = `ZodLazy`),
    (e.ZodLiteral = `ZodLiteral`),
    (e.ZodEnum = `ZodEnum`),
    (e.ZodEffects = `ZodEffects`),
    (e.ZodNativeEnum = `ZodNativeEnum`),
    (e.ZodOptional = `ZodOptional`),
    (e.ZodNullable = `ZodNullable`),
    (e.ZodDefault = `ZodDefault`),
    (e.ZodCatch = `ZodCatch`),
    (e.ZodPromise = `ZodPromise`),
    (e.ZodBranded = `ZodBranded`),
    (e.ZodPipeline = `ZodPipeline`),
    (e.ZodReadonly = `ZodReadonly`));
})(($ ||= {}));
var YS = cS.create;
(uS.create, GS.create, dS.create);
var XS = fS.create;
(pS.create, mS.create, hS.create, gS.create, _S.create);
var ZS = vS.create;
(yS.create, bS.create, xS.create);
var QS = CS.create;
(CS.strictCreate,
  wS.create,
  ES.create,
  OS.create,
  kS.create,
  AS.create,
  jS.create,
  MS.create,
  NS.create,
  PS.create,
  FS.create,
  LS.create,
  RS.create,
  zS.create,
  BS.create,
  VS.create,
  HS.create,
  BS.createWithPreprocess,
  qS.create);
var { installWebMcpProtocol: installWebMcpProtocol } = require("./browser-page-preload/webmcp-protocol");
installWebMcpProtocol({
  electron: d,
  createRegistry: dx,
  zod: { object: QS, string: YS, boolean: XS, unknown: ZS },
  pageEventChannel: Vd,
  policyChannel: bx,
  webmcpChangedEvent: lx,
  modelContextProperty: `__codexWebMcpModelContext`,
});
(d.webFrame.setVisualZoomLevelLimits?.(1, 3),
  annotationPreloadRuntime.initialize(),
  installBrowserInputBridge({
    windowLike: window,
    imageElementConstructor: HTMLImageElement,
    invokeHost: (e) => d.ipcRenderer.invoke(Bd, e),
  }));
