// @ts-nocheck

/** Owns realtime presentation surface selection, handoff motion, focus grace, and subscriptions. */
export function createRealtimePresentationCoordinatorClass(dependencies: Record<string, any>) {
  const {
    runtime: n,
    createUsingScope,
    setTimer,
    clearTimer,
    surfaceWaitMs = 180,
    nativeFallbackDelayMs = 50,
    focusGraceMs = 250,
  } = dependencies;

var L2 = { active: null },
  H8e = surfaceWaitMs,
  U8e = nativeFallbackDelayMs,
  W8e = focusGraceMs,
  G8e = class RealtimePresentationCoordinator extends n.Uf {
    options;
    #e;
    #t;
    #n;
    #r = new Set();
    #i = new Set();
    #a = null;
    #o = null;
    #s = 0;
    #c = !1;
    #l = null;
    #u = null;
    #d = null;
    #f = !1;
    #p = null;
    #m = null;
    #h = null;
    #g = [];
    static create(t, n = {}) {
      let r = new RealtimePresentationCoordinator(t, n);
      return { rpc: r, dispose: () => r.#z() };
    }
    constructor(e, t) {
      (super(),
        (this.options = t),
        (this.#t = new n.Hf((e) => {
          this.#_(e);
        })),
        (this.#e = e.subscribe(this.#t)),
        (this.#n =
          t.overlayFocus?.subscribe((e) => {
            if (this.#c !== e) {
              if (((this.#c = e), e)) {
                this.#L();
                for (let e of this.#g)
                  e.isEligible && e.surface === `main-thread` && this.#i.add(e);
              } else (this.#L(), this.#i.clear());
              this.#P();
            }
          }) ?? null));
    }
    getSnapshot() {
      return this.#a == null ? L2 : { active: { ...this.#a, handoff: null } };
    }
    registerSurface(e, t, n, r, i) {
      let a = i.dup(),
        o = {
          anchor: null,
          isEligible: n,
          locator: e,
          showToast: a,
          surface: t,
          usesNativeOverlayTransition: r,
        };
      return (
        (this.#g = [...this.#g, o]),
        a.onRpcBroken(() => {
          this.#v(o);
        }),
        this.#b(o),
        new K8e(
          (n) => {
            if (!this.#g.includes(o)) return;
            let r = this.#p?.readySurface === o;
            ((o.anchor = n),
              this.#O(t, e) && this.#h?.surface === t && R2(this.#h.locator, e)
                ? this.#C(this.#h)
                : r &&
                  t === `main-thread` &&
                  this.#a?.surface === `global-overlay` &&
                  R2(this.#a.locator, e) &&
                  this.#C({ locator: e, surface: t }),
              this.#P());
          },
          (e) => {
            this.#y(o, e);
          },
          (n) => {
            this.#g.includes(o) &&
              t === `global-overlay` &&
              this.#a != null &&
              R2(this.#a.locator, e) &&
              this.#A(`global-overlay`, e) === o &&
              this.options.overlayMotion?.updatePresentationOffset(n);
          },
          () => {
            this.#v(o);
          },
        )
      );
    }
    async reportToast(e, t) {
      if (this.#a == null || !R2(this.#a.locator, e)) return !1;
      let n = this.#A(this.#a.surface, e);
      if (n == null) return !1;
      try {
        return (await n.showToast(t), !0);
      } catch {
        return !1;
      }
    }
    requestSurface(e, t, n) {
      if (
        this.#a != null &&
        R2(this.#a.locator, e) &&
        (this.#a.surface !== `in-window` || t === `in-window`)
      ) {
        if (
          (this.#S(),
          t === `global-overlay` && this.#a.surface === `global-overlay` && (this.#E(), this.#P()),
          !this.#O(t, e))
        ) {
          (this.#T(), (this.#h = { locator: e, motion: n, surface: t }));
          return;
        }
        this.#C({ locator: e, motion: n, surface: t });
      }
    }
    subscribe(e) {
      let t = e.dup();
      if (
        (this.#r.add(t),
        t.onRpcBroken(() => {
          this.#R(t);
        }),
        this.#r.has(t))
      )
        try {
          var n = createUsingScope();
          n.u(t(this.getSnapshot()));
        } catch (e) {
          n.e = e;
        } finally {
          n.d();
        }
      return new q8e(() => {
        this.#R(t);
      });
    }
    #_(e) {
      if (e.phase === `inactive`) {
        let e = this.#a == null && this.#h != null;
        (this.#T(), this.#S(), (this.#s = 0), this.#E(), this.#i.clear());
        for (let e of this.#g) e.showToast[Symbol.dispose]();
        ((this.#g = []),
          (this.#h = null),
          this.#N(null),
          e && this.options.overlayVisibility?.setVisibility(null));
        return;
      }
      if (!(this.#a != null && R2(this.#a.locator, e.locator))) {
        if (
          (this.#E(),
          e.preferredPresentationSurface === `main-thread` && !this.#O(`main-thread`, e.locator))
        ) {
          ((this.#h = { locator: e.locator, surface: `main-thread` }),
            this.#N(null),
            this.options.overlayVisibility?.setVisibility(!1));
          return;
        }
        ((this.#h = null),
          this.#N({ locator: e.locator, surface: e.preferredPresentationSurface }));
      }
    }
    #v(e) {
      if (!this.#g.includes(e)) return;
      let t = this.#p?.readySurface === e;
      (this.#u === e && this.#S(),
        (this.#g = this.#g.filter((t) => t !== e)),
        e.showToast[Symbol.dispose](),
        this.#i.delete(e),
        this.#P(),
        t &&
          this.#a?.surface === `global-overlay` &&
          this.#A(`main-thread`, e.locator) != null &&
          this.#C({ locator: e.locator, surface: `main-thread` }),
        this.#a != null &&
          this.#a.surface === e.surface &&
          R2(this.#a.locator, e.locator) &&
          !this.#O(e.surface, e.locator) &&
          ((this.#h = null),
          this.#N(
            { locator: e.locator, surface: this.#D(e.locator) },
            e.anchor == null ? void 0 : { origin: e.anchor, velocity: null },
            e.usesNativeOverlayTransition,
          )));
    }
    #y(e, t) {
      if (!this.#g.includes(e) || e.isEligible === t) return;
      t && this.#u === e && this.#S();
      let n = !t && this.#p?.readySurface === e,
        r =
          !t &&
          !this.#c &&
          this.options.overlayFocus != null &&
          e.surface === `main-thread` &&
          ((this.#a?.surface === `main-thread` && R2(this.#a.locator, e.locator)) ||
            this.#m?.readySurface === e);
      ((e.isEligible = t),
        r &&
          (this.#i.add(e),
          this.#L(),
          (this.#d = setTimer(() => {
            ((this.#d = null), !this.#c && (this.#i.clear(), this.#P()));
          }, W8e))),
        this.#b(e),
        n &&
          this.#a?.surface === `global-overlay` &&
          this.#A(`main-thread`, e.locator) != null &&
          this.#C({ locator: e.locator, surface: `main-thread` }));
    }
    #b(e) {
      if (
        e.isEligible &&
        this.#h != null &&
        this.#h.surface === e.surface &&
        R2(this.#h.locator, e.locator)
      )
        this.#C(this.#h);
      else if (
        e.isEligible &&
        e.surface === `main-thread` &&
        this.#a != null &&
        this.#a.surface !== `in-window` &&
        R2(this.#a.locator, e.locator)
      )
        this.#C({ locator: e.locator, surface: e.surface });
      else if (
        !e.isEligible &&
        this.#a?.surface === e.surface &&
        R2(this.#a.locator, e.locator) &&
        !this.#O(e.surface, e.locator)
      ) {
        if (e.surface === `main-thread` && e.usesNativeOverlayTransition) {
          this.#x(e);
          return;
        }
        ((this.#h = null),
          this.#N(
            { locator: e.locator, surface: this.#D(e.locator) },
            e.anchor == null ? void 0 : { origin: e.anchor, velocity: null },
          ));
      } else this.#P();
    }
    #x(e) {
      (this.#S(),
        (this.#u = e),
        (this.#l = setTimer(() => {
          ((this.#l = null),
            (this.#u = null),
            !(
              e.isEligible ||
              this.#a?.surface !== `main-thread` ||
              !R2(this.#a.locator, e.locator) ||
              this.#O(`main-thread`, e.locator)
            ) &&
              ((this.#h = null),
              this.#N(
                { locator: e.locator, surface: this.#D(e.locator) },
                e.anchor == null ? void 0 : { origin: e.anchor, velocity: null },
              )));
        }, U8e)));
    }
    #S() {
      (this.#l != null && (clearTimer(this.#l), (this.#l = null)), (this.#u = null));
    }
    #C(e) {
      let t = this.options.overlayMotion;
      if (e.surface === `main-thread` && this.#a?.surface === `global-overlay` && t != null) {
        let n = this.#A(`main-thread`, e.locator);
        if (n?.anchor == null) {
          (this.#E(), (this.#h = e), this.#w(e));
          return;
        }
        let r = n.anchor;
        (this.#F(n.usesNativeOverlayTransition ? null : n), this.#T(), (this.#h = null));
        let i = { anchor: r, readySurface: n };
        this.#p = i;
        let a = () =>
            this.#p === i &&
            this.#a?.surface === `global-overlay` &&
            R2(this.#a.locator, e.locator) &&
            this.#A(`main-thread`, e.locator) === n &&
            n.anchor === r,
          o = (t) => {
            a() && ((this.#p = null), this.#N({ locator: e.locator, surface: `main-thread` }, t));
          };
        if (!n.usesNativeOverlayTransition) {
          t.dockTo(r, () => {
            o({ origin: r, velocity: null });
          });
          return;
        }
        ((this.#f = !0),
          t.fadeOutPresentation(() => {
            a() && o(void 0);
          }));
        return;
      }
      (this.#T(), (this.#h = null), this.#N({ locator: e.locator, surface: e.surface }, e.motion));
    }
    #w(e) {
      (this.#T(),
        (this.#o = setTimer(() => {
          ((this.#o = null),
            this.#h === e &&
              ((this.#h = null),
              this.#a != null &&
                R2(this.#a.locator, e.locator) &&
                this.#O(e.surface, e.locator) &&
                this.#N({ locator: e.locator, surface: e.surface })));
        }, H8e)));
    }
    #T() {
      this.#o != null && (clearTimer(this.#o), (this.#o = null));
    }
    #E() {
      ((this.#p = null),
        (this.#m = null),
        this.options.overlayMotion?.cancelDock(),
        this.options.overlayMotion?.setDockTarget(null),
        this.#f && ((this.#f = !1), this.options.overlayMotion?.restoreAccessories()));
    }
    #D(e) {
      return this.#a?.surface === `in-window`
        ? `in-window`
        : this.#O(`main-thread`, e)
          ? `main-thread`
          : `global-overlay`;
    }
    #O(e, t) {
      return this.#A(e, t) != null;
    }
    #k(e, t) {
      return this.#A(e, t)?.anchor ?? null;
    }
    #A(e, t) {
      return this.#g.findLast((n) => n.isEligible && n.surface === e && R2(n.locator, t)) ?? null;
    }
    #j(e, t) {
      return this.#g.findLast((n) => n.surface === e && R2(n.locator, t)) ?? null;
    }
    #M(e) {
      return (
        this.#g.findLast(
          (t) =>
            (t.isEligible || this.#i.has(t)) && t.surface === `main-thread` && R2(t.locator, e),
        ) ?? null
      );
    }
    #N(e, t, n) {
      if (J8e(this.#a, e)) return;
      let r = null,
        i = !1;
      if (
        e != null &&
        this.#a != null &&
        R2(this.#a.locator, e.locator) &&
        this.#a.surface !== e.surface
      ) {
        let a = this.#a.surface;
        ((i = n ?? this.#j(`main-thread`, e.locator)?.usesNativeOverlayTransition ?? !1),
          (r = {
            from: a,
            origin: t?.origin ?? this.#k(a, e.locator) ?? null,
            sequence: ++this.#s,
            velocity: t?.velocity ?? null,
          }),
          a === `main-thread` &&
            e.surface === `global-overlay` &&
            (i
              ? this.options.overlayMotion?.preparePresentationForFadeIn()
              : r.origin != null && this.options.overlayMotion?.presentFrom(r.origin, r.velocity)));
      }
      ((this.#a = e),
        e?.surface === `global-overlay` &&
          r?.from === `main-thread` &&
          ((this.#f = !1), i && this.options.overlayMotion?.restoreAccessories()),
        e?.surface === `global-overlay` &&
          r?.from !== `main-thread` &&
          this.#A(`global-overlay`, e.locator)?.usesNativeOverlayTransition &&
          ((this.#f = !1), this.options.overlayMotion?.restoreAccessories()),
        this.#P(),
        this.#I(e == null ? L2 : { active: { ...e, handoff: r } }),
        this.options.overlayVisibility?.setVisibility(
          e == null ? null : e.surface === `global-overlay`,
        ));
    }
    #P() {
      if (this.options.overlayMotion == null) return;
      if (this.#a?.surface !== `global-overlay`) {
        this.#F(null);
        return;
      }
      let e = this.#a.locator,
        t = this.#M(e);
      if (t?.anchor == null || t.usesNativeOverlayTransition) {
        this.#F(null);
        return;
      }
      this.#F(t);
    }
    #F(e) {
      let t = this.options.overlayMotion;
      if (t == null) return;
      let n = e?.anchor ?? null;
      if (
        (this.#m == null && e == null) ||
        (this.#m?.readySurface === e && this.#m.anchor === n) ||
        (this.#m != null && this.#a?.surface === `global-overlay` && (this.#E(), e == null))
      )
        return;
      if (e == null || n == null) {
        ((this.#m = null), t.setDockTarget(null));
        return;
      }
      let r = { anchor: n, readySurface: e };
      this.#m = r;
      let i = e.locator;
      t.setDockTarget(n, () => {
        this.#m === r &&
          this.#a?.surface === `global-overlay` &&
          R2(this.#a.locator, i) &&
          this.#M(i) === e &&
          e.anchor === n &&
          ((this.#p = null),
          this.#N({ locator: i, surface: `main-thread` }, { origin: n, velocity: null }));
      });
    }
    #I(e = this.getSnapshot()) {
      for (let n of this.#r)
        try {
          var t = createUsingScope();
          t.u(n(e));
        } catch (e) {
          t.e = e;
        } finally {
          t.d();
        }
    }
    #L() {
      this.#d != null && (clearTimer(this.#d), (this.#d = null));
    }
    #R(e) {
      this.#r.delete(e) && e[Symbol.dispose]();
    }
    #z() {
      (this.#T(),
        this.#S(),
        this.#L(),
        this.#E(),
        this.options.overlayVisibility?.setVisibility(null),
        this.#n?.(),
        this.#e.unsubscribe(),
        this.#t[Symbol.dispose]());
      for (let e of this.#r) e[Symbol.dispose]();
      this.#r.clear();
      for (let e of this.#g) e.showToast[Symbol.dispose]();
      this.#g = [];
    }
  },
  K8e = class extends n.Uf {
    #e;
    #t;
    #n;
    #r;
    constructor(e, t, n, r) {
      (super(), (this.#e = e), (this.#t = t), (this.#n = n), (this.#r = r));
    }
    updateAnchor(e) {
      this.#e?.(e);
    }
    updateEligibility(e) {
      this.#t?.(e);
    }
    updatePresentationOffset(e) {
      this.#n?.(e);
    }
    unregister() {
      (this.#r?.(), (this.#e = null), (this.#t = null), (this.#n = null), (this.#r = null));
    }
    [Symbol.dispose]() {
      this.unregister();
    }
  },
  q8e = class extends n.Uf {
    #e;
    constructor(e) {
      (super(), (this.#e = e));
    }
    unsubscribe() {
      (this.#e?.(), (this.#e = null));
    }
    [Symbol.dispose]() {
      this.unsubscribe();
    }
  };
function J8e(e, t) {
  return e == null || t == null
    ? e == null && t == null
    : e.surface === t.surface && R2(e.locator, t.locator);
}
function R2(e, t) {
  return e.hostId === t.hostId && e.conversationId === t.conversationId;
}

  return G8e;
}

if (typeof module !== "undefined")
  module.exports = { createRealtimePresentationCoordinatorClass };
