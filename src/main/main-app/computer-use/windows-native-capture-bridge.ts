// @ts-nocheck

/** Owns the Windows native Appshot helper transport, hotkey flight, capture, and cleanup lifecycle. */
export function createWindowsNativeCaptureBridgeModule(dependencies: Record<string, any>) {
  const { n, r, c, h, p, b, _, l, o, oH, fi } = dependencies;
function w7(e) {
  if (e.length !== 4) throw TypeError(`fourCharCode requires a four-character string`);
  return (
    e.charCodeAt(0) * 16777216 + e.charCodeAt(1) * 65536 + e.charCodeAt(2) * 256 + e.charCodeAt(3)
  );
}
var Iit = `com.openai.sky.CUAService`;
(w7(`SkCu`),
  w7(`SndR`),
  w7(`RspT`),
  w7(`ReqD`),
  w7(`ClVn`),
  w7(`----`),
  w7(`errn`),
  w7(`errs`),
  w7(`tdta`),
  w7(`utf8`),
  w7(`kpid`),
  w7(`long`));
var Lit = 26214400;
(r.i(`computer-use-capture-native-bridge`),
  n.vf(`type`, [
    n.wf({ type: n.bf(`metadata`), app: n.wf({ bundleIdentifier: n.Of() }) }),
    n.wf({ type: n.bf(`axText`), text: n.Of() }),
    n.wf({
      type: n.bf(`screenshot`),
      transitionSnapshotURL: n.Of().nullable().optional(),
      screenshotURL: n.Of().nullable().optional(),
      screenshot: n.wf({ url: n.Of(), mimeType: n.Of() }).nullable().optional(),
    }),
    n.wf({ type: n.bf(`completed`), transitionSnapshotURL: n.Of().nullable().optional() }),
    n.wf({ type: n.bf(`failed`), failureReason: n.Of().nullable().optional() }),
  ]),
  n.wf({
    result: n.df([`started`, `appshot_permissions_abandoned`]),
    animationDuration: n.Cf().nullable().optional(),
    transitionSnapshotHeight: n.Cf().nullable().optional(),
    transitionSpringDampingFraction: n.Cf().nullable().optional(),
    transitionSpringResponse: n.Cf().nullable().optional(),
    permissionGrantState: n
      .df([`none_granted`, `accessibility_granted`, `screen_recording_granted`, `both_granted`])
      .nullable()
      .optional()
      .catch(null),
  }));
async function Rit(e) {
  let t = await zit(e);
  return t == null ? null : { dataURL: await Bit(t), path: t };
}
async function zit(e) {
  if (e == null || e.trim().length === 0) return null;
  let t;
  try {
    let n = new URL(e);
    if (n.protocol !== `file:`) return null;
    t = (0, c.fileURLToPath)(n);
  } catch {
    if (!h.default.isAbsolute(e)) return null;
    t = e;
  }
  if (T7(t) == null) return null;
  try {
    let e = await (0, b.realpath)(t),
      n = await (0, b.realpath)(h.default.join(p.default.tmpdir(), Iit)),
      r = h.default.relative(n, e);
    if (r.startsWith(`..`) || h.default.isAbsolute(r)) return null;
    let i = await (0, b.stat)(e);
    return !i.isFile() || i.size > Lit ? null : e;
  } catch {
    return null;
  }
}
function T7(e) {
  switch (h.default.extname(e).toLowerCase()) {
    case `.png`:
      return `image/png`;
    case `.jpg`:
    case `.jpeg`:
      return `image/jpeg`;
    default:
      return null;
  }
}
async function Bit(e) {
  let t = T7(e);
  if (t == null) throw Error(`Unsupported capture image type for ${e}`);
  return `data:${t};base64,${(await (0, b.readFile)(e)).toString(`base64`)}`;
}
async function Vit(e, t) {
  let {
    codexCliPath: r,
    codexHome: i = n.Oi(),
    windowsHelperPath: a,
    windowsHelperTransportModulePath: o,
  } = e;
  if ((t?.throwIfAborted(), a == null || o == null))
    throw Error(`Windows Computer Use helper paths are unavailable`);
  let s = await import((0, c.pathToFileURL)(o).href);
  return (
    t?.throwIfAborted(),
    new s.WindowsHelperTransport({
      helperArgs: [`--parent-pid`, String(process.pid)],
      helperCommand: a,
      helperEnv: { CODEX_HOME: i, ...(r == null ? {} : { [n.Gl]: r }) },
      preserveHelperOnTimeout: !0,
    })
  );
}
var E7 = n.wf({
    app: n.Of().trim().min(1),
    displayName: n.Of().optional(),
    frame: n.wf({ height: n.Cf().positive(), width: n.Cf().positive(), x: n.Cf(), y: n.Cf() }),
    id: n.jf([n.Cf().int().nonnegative(), n.Of().regex(/^\d+$/)]),
    title: n.Of().optional(),
  }),
  D7 = n.wf({
    accessibility: n.wf({ tree: n.Of() }).nullable().optional(),
    screenshots: n.hf(n.wf({ url: n.Of().min(1) })),
    transitionSnapshotURL: n.Of().min(1).nullish(),
  }),
  O7 = n.wf({
    animationDuration: n.Cf().positive(),
    transitionId: n.Of().trim().min(1),
    transitionSnapshotHeight: n.Cf().positive(),
    transitionSpringDampingFraction: n.Cf().positive(),
    transitionSpringResponse: n.Cf().positive(),
  }),
  Hit = n.wf({ event: n.bf(`appshotHotkey`), phase: n.df([`ready`, `down`, `up`]) }),
  Uit = n.wf({
    capabilities: n.hf(n.Of()).refine((e) => e.includes(`windows_appshots_v2`)),
    protocolVersion: n.bf(1),
  }),
  k7 = r.i(`windows-capture-native-bridge`),
  A7 = { cleanup: 500, completion: 5e3, hotkey: 1e3, registration: 3e3, source: 2e3, start: 1500 },
  j7 = (e) => ({ skipTurnTransition: !0, timeoutMs: e });
function Wit({ decorateApp: e = async () => null, loadHelperTransport: t }) {
  let r = !1,
    i = null,
    a = null,
    o = null,
    s = null,
    c = new AbortController(),
    l = new WeakMap(),
    u = new Set(),
    d = () => {
      if (r) return Promise.reject(Error(`Windows capture bridge is disposed`));
      if (i != null) return Promise.resolve(i);
      if (a != null) return a;
      let e = c,
        n = t(e.signal).then(
          async (t) => {
            if (r || e.signal.aborted)
              throw (await t.close(), Error(`Windows capture helper acquisition was abandoned`));
            return (
              (i = t),
              (a = null),
              t.onExit?.(() => {
                !r && i === t && o != null && m(o, Promise.resolve(t));
              }),
              t
            );
          },
          (e) => {
            throw (a === n && (a = null), e);
          },
        );
      return ((a = n), n);
    },
    f = () => {
      let e = s;
      ((s = null), e?.cancellation.abort());
    },
    p = async (e) => {
      try {
        let t = await d(),
          r = E7.nullable().parse(
            await t.request(`get_appshot_target`, { preferLatched: e }, j7(A7.cleanup)),
          ),
          i = r?.displayName?.trim();
        if (r == null || (i && i.toLowerCase() !== M7(r.app).toLowerCase())) return r;
        try {
          let e = n
            .hf(
              n.wf({
                displayName: n.Of().optional(),
                id: n.Of(),
                windows: n.hf(n.wf({ id: E7.shape.id })),
              }),
            )
            .parse(await t.request(`list_apps`, {}, j7(A7.cleanup)))
            .find(
              (e) =>
                e.id.toLowerCase() === r.app.toLowerCase() ||
                e.windows.some(({ id: e }) => String(e) === String(r.id)),
            );
          return e?.displayName?.trim() ? { ...r, displayName: e.displayName.trim() } : r;
        } catch {
          return r;
        }
      } catch (e) {
        return (
          k7().warning(`Windows Appshot target lookup failed`, {
            safe: {},
            sensitive: { error: e },
          }),
          null
        );
      }
    },
    m = async (e, t = d()) => {
      try {
        let n = await t;
        if (o !== e) return;
        ((e.stop ??=
          n.onEvent?.((t) => {
            let n = Hit.safeParse(t);
            if (o === e && n.success) {
              if (n.data.phase === `ready`) ((e.pressed = !1), f());
              else if (n.data.phase === `down` && !e.pressed) {
                ((e.pressed = !0), f());
                let t = Promise.withResolvers();
                ((s = {
                  cancellation: new AbortController(),
                  claimedBy: null,
                  consumed: !1,
                  release: () => t.resolve(void 0),
                  released: t.promise,
                  target: p(!0),
                }),
                  e.handlers.onPressed?.());
              } else
                n.data.phase === `up` &&
                  e.pressed &&
                  ((e.pressed = !1), s?.release(), e.handlers.onReleased?.());
            }
          }) ?? null),
          await n.request(`set_appshot_hotkey`, { hotkey: e.name }, j7(A7.registration)));
      } catch (t) {
        if (o !== e) return;
        (e.stop?.(),
          (o = null),
          f(),
          e.handlers.onRegistrationFailed?.(),
          k7().warning(`Windows Appshot hotkey registration failed`, {
            safe: { hotkey: e.name },
            sensitive: { error: t },
          }));
      }
    },
    h = (e, t) => e.request(`finish_appshot_capture`, { transitionId: t }, j7(A7.cleanup)),
    g = async (e) => {
      let { emitUpdate: t, signal: n, transport: r, window: i } = e,
        a = { transitionId: e.transitionId, window: i };
      try {
        let e = r.request(`load_appshot_capture_source`, a, j7(A7.source)),
          o = r.request(`complete_appshot_capture`, a, j7(A7.completion));
        o.catch(() => void 0);
        let s = D7.parse(await P7(e, n));
        (n.throwIfAborted(), t({ app: { bundleIdentifier: i.app }, type: `metadata` }));
        let c = (e) => P7(N7(Rit(e), A7.source), n),
          l = await c(s.screenshots[0]?.url ?? null);
        if (l == null) throw Error(`Windows Appshot returned no source image`);
        t({ screenshotDataURL: l.dataURL, screenshotPath: l.path, type: `screenshot` });
        let u = D7.parse(await P7(o, n));
        (n.throwIfAborted(),
          u.accessibility != null && t({ text: u.accessibility.tree, type: `axText` }));
        let d = u.transitionSnapshotURL == null ? null : await c(u.transitionSnapshotURL);
        t({
          transitionSnapshotDataURL: d?.dataURL ?? null,
          transitionSnapshotPath: d?.path ?? null,
          type: `completed`,
        });
      } catch (e) {
        let r = n.aborted ? `capture_cancelled` : `native_completion_failed`;
        (n.aborted ||
          k7().warning(`Windows Appshot completion failed`, { safe: {}, sensitive: { error: e } }),
          t({ failureReason: r, type: `failed` }));
      } finally {
        await h(r, e.transitionId).catch(() => void 0);
      }
    },
    v = async (e, t, n, r) => {
      let i = t.flight == null ? null : (0, _.randomUUID)(),
        a = {
          animationTarget: n,
          window: t.window,
          ...(i == null ? {} : { preparedTransitionToken: i }),
        };
      if (t.flight != null) {
        let n = () =>
            e.request(
              `cancel_prepared_appshot_capture`,
              { preparedTransitionToken: i },
              j7(A7.cleanup),
            ),
          o = e.request(`prepare_appshot_capture`, a, j7(A7.hotkey));
        try {
          (await P7(o, r),
            await P7(P7(t.flight.released, t.flight.cancellation.signal), r),
            s === t.flight && (s = null));
        } catch {
          return (o.then(n).catch(() => void 0), null);
        }
      }
      if (r?.aborted) return null;
      let o = e.request(
        i == null ? `begin_appshot_capture` : `begin_prepared_appshot_capture`,
        a,
        j7(A7.start),
      );
      try {
        let e = O7.parse(await P7(o, r));
        return (r?.throwIfAborted(), e);
      } catch (t) {
        if (!r?.aborted) throw t;
        return (
          o
            .then((e) => O7.parse(e))
            .then((t) => h(e, t.transitionId))
            .catch(() => void 0),
          null
        );
      }
    },
    y = async () => {
      let e = i;
      ((i = null),
        o?.stop?.(),
        (o = null),
        (a = null),
        f(),
        (l = new WeakMap()),
        c.abort(),
        await Promise.allSettled(u),
        (c = new AbortController()),
        e != null &&
          (await e
            .request(`set_appshot_hotkey`, { hotkey: null }, j7(A7.hotkey))
            .catch(() => void 0),
          await N7(e.close(), A7.cleanup).catch(() => void 0)));
    };
  return {
    claimHotkeyFlight(e) {
      s != null && !s.consumed && s.claimedBy == null && (s.claimedBy = e.id);
    },
    async dispose() {
      r || ((r = !0), await y());
    },
    async getFrontmostWindow(t, n) {
      let i = c,
        a = s != null && !s.consumed && s.claimedBy === t.id ? s : null;
      a != null && (a.consumed = !0);
      try {
        let o = await P7(a?.target ?? p(!1), n);
        if (o == null) return null;
        let s = await P7(
          N7(e(o.app), A7.cleanup).catch(() => null),
          n,
        );
        return r || n?.aborted || i.signal.aborted
          ? null
          : (l.set(t, { decoration: s, flight: a, window: o }),
            {
              bundleIdentifier: o.app,
              iconSmallDataURL: s?.iconSmallDataURL ?? null,
              name: o.displayName?.trim() || M7(o.app),
              windowTitle: o.title ?? null,
            });
      } catch (e) {
        if (n?.aborted) return null;
        throw e;
      }
    },
    registerHotkey(e, t) {
      let n = qit(e);
      if (r || n == null) return null;
      o?.stop?.();
      let a = { handlers: t, name: n, pressed: !1, stop: null };
      return (
        (o = a),
        m(a),
        {
          handlesRelease: !0,
          unregister() {
            o === a &&
              (a.stop?.(),
              (o = null),
              f(),
              i
                ?.request(`set_appshot_hotkey`, { hotkey: null }, j7(A7.hotkey))
                .catch(() => void 0));
          },
        }
      );
    },
    release: y,
    async startCapture({
      animationTarget: e,
      bundleIdentifier: t,
      emitUpdate: n,
      origin: i,
      requestId: a,
      signal: o,
      soundEnabled: s,
    }) {
      let f = l.get(i);
      if ((l.delete(i), r || o?.aborted || f == null || f.window.app !== t)) return null;
      try {
        let t = await P7(d(), o),
          r = Jit(e, f.window, f.decoration, i, s),
          a = await v(t, f, r, o);
        if (a == null) return null;
        let { transitionId: l, ...p } = a,
          m = {
            emitUpdate: n,
            signal: o == null ? c.signal : AbortSignal.any([o, c.signal]),
            transitionId: l,
            transport: t,
            window: f.window,
          },
          h = g(m);
        return (u.add(h), h.finally(() => u.delete(h)), { result: `started`, ...p });
      } catch (e) {
        return (
          o?.aborted ||
            k7().warning(`Windows Appshot start failed`, {
              safe: { requestId: a },
              sensitive: { error: e },
            }),
          null
        );
      }
    },
  };
}
function Git(e) {
  if (process.platform !== `win32`) return null;
  let t = o.t({ env: process.env, resourcesPath: process.resourcesPath }),
    r = { windowsHelperPath: n.Fn(t), windowsHelperTransportModulePath: n.Pn(t) };
  if (r.windowsHelperPath == null || r.windowsHelperTransportModulePath == null) return null;
  let { codexCliPath: i } = fi({ isPackaged: l.app.isPackaged, repoRoot: e, resourcesPath: t });
  return Wit({
    decorateApp: async (e) => ({ iconSmallDataURL: await oH(e.replace(/^process:/i, ``)) }),
    loadHelperTransport: async (e) => {
      let t = await Vit({ codexCliPath: i, ...r }, e);
      try {
        return (await P7(Kit(t), e), t);
      } catch (e) {
        throw (await t.close(), e);
      }
    },
  });
}
async function Kit(e) {
  let t = async (n = 0) => {
    try {
      Uit.parse(await e.request(`service_info`, {}, j7(A7.cleanup)));
      return;
    } catch (e) {
      if (
        n === 5 ||
        !(e instanceof Error) ||
        !e.message.startsWith(`computer-use request timed out: service_info`)
      )
        throw e;
      return t(n + 1);
    }
  };
  await t();
}
function qit(e) {
  let t = e.replace(/[\s_-]/g, ``).toLowerCase();
  return t === `doublealt` || t === `leftalt+rightalt`
    ? `DoubleAlt`
    : t === `doubleshift` || t === `leftshift+rightshift`
      ? `DoubleShift`
      : null;
}
function Jit(e, t, n, r, i) {
  let a = l.BrowserWindow.fromWebContents(r);
  if (a == null || a.isDestroyed()) throw Error(`Appshot destination window is unavailable`);
  let o = a.getNativeWindowHandle();
  if (o.byteLength !== 8) throw Error(`Appshot destination window handle is unavailable`);
  let s = o.readBigUInt64LE().toString(),
    c = a.getContentBounds(),
    u = { ...e.destinationFrame, x: e.destinationFrame.x - c.x, y: e.destinationFrame.y - c.y };
  return {
    appIconDataURL: n?.iconSmallDataURL ?? null,
    destinationBackgroundColor: e.destinationBackgroundColor,
    destinationContentFrame: u,
    destinationCornerRadius: e.destinationCornerRadius,
    destinationFrame: e.destinationFrame,
    destinationPrimaryTextColor: e.destinationPrimaryTextColor,
    destinationProcessId: process.pid,
    destinationWindowHandle: s,
    displayScaleFactor: e.codexDisplay.scaleFactor,
    soundEnabled: i,
    sourceCornerRadius: 8,
    titleText: t.title?.trim() || t.displayName?.trim() || M7(t.app),
    transitionSnapshotFrame: u,
  };
}
function M7(e) {
  return h.default.win32.basename(e.replace(/^process:/i, ``)).replace(/\.exe$/i, ``) || e;
}
async function N7(e, t) {
  return P7(e, AbortSignal.timeout(t));
}
async function P7(e, t) {
  if (t == null) return e;
  if (t.aborted) throw (e.catch(() => {}), F7(t));
  let n = () => {},
    r = new Promise((e, r) => {
      ((n = () => r(F7(t))), t.addEventListener(`abort`, n, { once: !0 }));
    });
  try {
    return await Promise.race([e, r]);
  } finally {
    t.removeEventListener(`abort`, n);
  }
}
function F7(e) {
  if (e.reason instanceof Error) return e.reason;
  let t = Error(e.reason == null ? `The operation was aborted` : String(e.reason));
  return ((t.name = `AbortError`), t);
}
  return { Git, Wit };
}

if (typeof module !== "undefined") {
  module.exports = { createWindowsNativeCaptureBridgeModule };
}
