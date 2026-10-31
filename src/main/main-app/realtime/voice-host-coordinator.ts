// @ts-nocheck

/** Owns renderer claims, controls, transfer, mute intents, native mute, and cleanup for realtime voice. */
export function createRealtimeVoiceHostCoordinatorClass(dependencies: Record<string, any>) {
  const { runtime: n, createLogger, randomUUID, createUsingScope, now } = dependencies;

var I8e = {
    activity: `idle`,
    locator: null,
    microphoneMuted: !1,
    outputMuted: !1,
    phase: `inactive`,
    preferredPresentationSurface: null,
    sessionId: null,
  },
  L8e = class RealtimeVoiceHostCoordinator extends n.Uf {
    nativeMicrophoneMute;
    #e = createLogger(`realtime-voice-host-coordinator`);
    #t;
    #n;
    #r = null;
    #i = !1;
    #a = null;
    #o = null;
    #s = null;
    #c = new Set();
    static create(t, n, r) {
      let i = new RealtimeVoiceHostCoordinator(t, n, r);
      return { rpc: i, dispose: () => i.#f() };
    }
    constructor(e, t, n) {
      (super(),
        (this.nativeMicrophoneMute = n),
        (this.#t = t),
        (this.#n = e.subscribe((e) => {
          this.#p(e);
        })));
    }
    isNativeMicrophoneMuteEnabled() {
      return this.#r == null
        ? (this.nativeMicrophoneMute?.isEnabled() ?? !1)
        : this.#r.startMicrophoneMute != null;
    }
    claim(e, t, n, r) {
      if (
        this.#r != null ||
        (this.#s?.transferDestination != null && !F2(this.#s.transferDestination, e))
      )
        return null;
      let i = randomUUID(),
        o = t.dup();
      if (
        ((this.#r = {
          claimId: i,
          cleanup: `none`,
          controller: o,
          pendingMicrophoneMuteIntents: [],
          pendingOutputMuteIntents: [],
          published: !1,
          microphoneMute: null,
          microphoneMuteStarted: !1,
          startMicrophoneMute:
            (r ?? this.nativeMicrophoneMute?.isEnabled())
              ? this.nativeMicrophoneMute?.start
              : void 0,
          snapshot: {
            activity: `idle`,
            locator: e,
            microphoneMuted: !1,
            outputMuted: !1,
            phase: `starting`,
            preferredPresentationSurface: n,
            sessionId: null,
          },
        }),
        this.#o != null)
      ) {
        let e = this.#o;
        ((this.#o = this.#r), e.controller[Symbol.dispose]());
      }
      if (
        (o.onRpcBroken(() => {
          this.#m(i);
        }),
        this.#i)
      )
        try {
          var s = createUsingScope();
          s.u(o.control({ type: `set-dictation-active`, active: !0 }));
        } catch (e) {
          s.e = e;
        } finally {
          s.d();
        }
      return i;
    }
    publish(e, t) {
      let n = this.#r;
      n?.claimId === e &&
        n.cleanup === `none` &&
        ((n.snapshot = {
          ...t,
          connectedAtMs: n.snapshot.connectedAtMs ?? (t.phase === `active` ? now() : void 0),
          locator: n.snapshot.locator,
          preferredPresentationSurface: n.snapshot.preferredPresentationSurface,
          sessionId: n.snapshot.sessionId,
        }),
        n.pendingMicrophoneMuteIntents[0]?.muted === t.microphoneMuted &&
          n.pendingMicrophoneMuteIntents.shift(),
        n.pendingOutputMuteIntents[0]?.muted === t.outputMuted &&
          n.pendingOutputMuteIntents.shift(),
        (n.published = !0),
        this.#y(n),
        t.phase === `active` &&
          this.#s?.transferDestination != null &&
          F2(this.#s.transferDestination, n.snapshot.locator) &&
          this.#d(),
        this.#v());
    }
    release(e) {
      this.#r?.claimId === e && this.#r.cleanup !== `orphaned` && this.#_();
    }
    control(e, t) {
      let n = this.#r;
      if (n?.cleanup !== `none` || n.snapshot.phase === `stopping` || !F2(n.snapshot.locator, e))
        return !1;
      switch (t.type) {
        case `stop`:
          try {
            var r = createUsingScope();
            return (
              (n.snapshot = { ...n.snapshot, phase: `stopping` }),
              this.#v(),
              r.u(n.controller.control(t)),
              !0
            );
          } catch (e) {
            r.e = e;
          } finally {
            r.d();
          }
        case `simulate-usage-limit-approaching-for-debug`:
          try {
            var i = createUsingScope();
            return (i.u(n.controller.control(t)), !0);
          } catch (e) {
            i.e = e;
          } finally {
            i.d();
          }
        case `set-microphone-muted`:
        case `set-output-muted`:
          return (this.#l(n, t), !0);
      }
    }
    controlActive(e) {
      let t = this.#r;
      if (t == null) return !1;
      if (t.cleanup !== `none` || t.snapshot.phase === `stopping`) return !0;
      switch (e.type) {
        case `stop`:
          return this.control(t.snapshot.locator, e);
        case `toggle-microphone-mute`:
          return this.control(t.snapshot.locator, {
            type: `set-microphone-muted`,
            muted: !(t.pendingMicrophoneMuteIntents.at(-1)?.muted ?? t.snapshot.microphoneMuted),
          });
        case `toggle-output-mute`:
          return this.control(t.snapshot.locator, {
            type: `set-output-muted`,
            muted: !(t.pendingOutputMuteIntents.at(-1)?.muted ?? t.snapshot.outputMuted),
          });
      }
    }
    setDictationActive(e) {
      try {
        var t = createUsingScope();
        this.#i = e;
        let n = this.#r;
        if (n?.cleanup !== `none` || n.snapshot.phase === `stopping`) return;
        t.u(n.controller.control({ type: `set-dictation-active`, active: e }));
      } catch (e) {
        t.e = e;
      } finally {
        t.d();
      }
    }
    #l(e, t) {
      let n =
        t.type === `set-microphone-muted`
          ? e.pendingMicrophoneMuteIntents
          : e.pendingOutputMuteIntents;
      if (
        (n.at(-1)?.muted ??
          (t.type === `set-microphone-muted`
            ? e.snapshot.microphoneMuted
            : e.snapshot.outputMuted)) === t.muted
      )
        return;
      let r = { ...t };
      (n.push(r), this.#u(e, n, r));
    }
    async #u(e, t, n) {
      try {
        await e.controller.control(n);
      } catch (r) {
        if (
          (this.#e().warning(`Failed to control realtime voice session`, {
            safe: {},
            sensitive: { error: r },
          }),
          this.#r !== e || e.cleanup !== `none`)
        )
          return;
        let i = t.indexOf(n);
        i !== -1 && t.splice(i, 1);
      }
    }
    recordRealDelegation(e, t) {
      try {
        var n = createUsingScope();
        let r = this.#r;
        if (r == null || !F2(r.snapshot.locator, e) || r.cleanup !== `none`) return;
        n.u(r.controller.control({ type: `record-real-delegation`, delegation: t }));
      } catch (e) {
        n.e = e;
      } finally {
        n.d();
      }
    }
    transfer(e, t, n) {
      try {
        var r = createUsingScope();
        let i = this.#r;
        if (i?.cleanup !== `none` || i.snapshot.phase !== `active` || !F2(i.snapshot.locator, e))
          return !1;
        let o = t ?? this.#a;
        return o == null || F2(o, e)
          ? !1
          : (t == null ? (this.#a = null) : (this.#a ??= e),
            (this.#s = {
              ...i.snapshot,
              activity: `idle`,
              phase: `starting`,
              transferDestination: o,
            }),
            (this.#o = i),
            this.#v(),
            r.u(i.controller.control({ type: `transfer`, locator: o, context: n })),
            !0);
      } catch (e) {
        r.e = e;
      } finally {
        r.d();
      }
    }
    cancelTransfer() {
      this.#s != null && (this.#d(), this.#v());
    }
    #d() {
      let e = this.#o;
      ((this.#o = null),
        (this.#s = null),
        e != null && e !== this.#r && e.controller[Symbol.dispose]());
    }
    async captureScreenContext(e, t) {
      let n = this.#r;
      if (
        n?.cleanup !== `none` ||
        this.#s != null ||
        n.snapshot.phase !== `active` ||
        !F2(n.snapshot.locator, e)
      )
        return null;
      let r;
      try {
        r = await n.controller.captureScreenContext(t);
      } catch (e) {
        if (this.#r !== n || n.cleanup !== `none` || this.#s != null) return null;
        throw e;
      }
      return this.#r !== n ||
        n.cleanup !== `none` ||
        this.#s != null ||
        n.snapshot.phase !== `active`
        ? null
        : r;
    }
    getSnapshot() {
      if (this.#s != null) {
        let e = this.#r;
        return e?.published === !0 &&
          this.#s.transferDestination != null &&
          F2(e.snapshot.locator, this.#s.transferDestination)
          ? { ...e.snapshot, transferDestination: this.#s.transferDestination }
          : this.#s;
      }
      return this.#r?.published === !0 ? this.#r.snapshot : I8e;
    }
    getRestartBlockers() {
      return [
        ...(this.#r != null && this.#r.cleanup !== `orphaned` ? [`voice.session`] : []),
        ...(this.#s == null ? [] : [`voice.transfer`]),
      ];
    }
    subscribe(e) {
      let t = e.dup();
      if (
        (this.#c.add(t),
        t.onRpcBroken(() => {
          this.#b(t);
        }),
        this.#c.has(t))
      )
        try {
          var n = createUsingScope();
          n.u(t(this.getSnapshot()));
        } catch (e) {
          n.e = e;
        } finally {
          n.d();
        }
      return new R8e(() => {
        this.#b(t);
      });
    }
    #f() {
      (this.#n?.(),
        (this.#n = null),
        this.#d(),
        this.#r?.microphoneMute?.stop(),
        this.#r?.controller[Symbol.dispose](),
        (this.#r = null));
      for (let e of this.#c) e[Symbol.dispose]();
      this.#c.clear();
    }
    #p(e) {
      switch (e.type) {
        case `session-started`: {
          let t = this.#r;
          if (t == null || !F2(t.snapshot.locator, e.thread)) return;
          ((t.snapshot = { ...t.snapshot, sessionId: e.sessionId }), this.#v());
          return;
        }
        case `real-delegation`:
          this.recordRealDelegation(e.thread, e.delegation);
          return;
        case `bem-item-started`:
        case `bem-item-completed`:
        case `bem-turn-started`:
        case `bem-turn-completed`:
        case `bem-item-presented`:
        case `bem-presentation-added`:
        case `multi-agent-activity`:
        case `transcript-delta`:
        case `transcript-done`:
        case `handoff-added`:
        case `transport-lost`:
        case `session-ended`:
        case `session-failed`:
          return;
        case `host-disconnected`: {
          let t = this.#r;
          if (t == null || t.snapshot.locator.hostId !== e.hostId) return;
          this.#h();
          return;
        }
      }
    }
    #m(e) {
      this.#o?.claimId === e && this.cancelTransfer();
      let t = this.#r;
      if (t?.claimId !== e) return;
      if (t.cleanup === `terminating`) {
        this.#_();
        return;
      }
      if (t.cleanup === `orphaned`) return;
      let n = t.snapshot.locator;
      ((t.cleanup = `orphaned`),
        (t.snapshot = { ...t.snapshot, activity: `idle`, phase: `stopping` }),
        this.#v(),
        Promise.resolve()
          .then(() => {
            if (this.#r?.claimId === e && this.#r.cleanup === `orphaned`) return this.#t(n);
          })
          .catch((e) => {
            this.#e().warning(`Failed to stop orphaned realtime voice session`, {
              safe: {},
              sensitive: { error: e, locator: n },
            });
          })
          .finally(() => {
            this.#r?.claimId === e && this.#_();
          }));
    }
    #h() {
      let e = this.#r;
      if (e != null && e.cleanup !== `terminating`) {
        if (e.cleanup === `orphaned`) {
          this.#_();
          return;
        }
        ((e.cleanup = `terminating`),
          (e.snapshot = { ...e.snapshot, activity: `idle`, phase: `stopping` }),
          this.#v(),
          this.#g(e.claimId, e.controller));
      }
    }
    async #g(e, t) {
      try {
        try {
          var n = createUsingScope();
          await n.u(t.control({ type: `terminate` }));
        } catch (e) {
          n.e = e;
        } finally {
          n.d();
        }
      } catch (e) {
        this.#e().warning(`Failed to terminate renderer realtime voice session`, {
          safe: {},
          sensitive: { error: e },
        });
      }
      this.#r?.claimId === e && this.#r.cleanup === `terminating` && this.#_();
    }
    #_() {
      let e = this.#r;
      e != null &&
        ((this.#r = null),
        e.microphoneMute?.stop(),
        this.#o !== e && e.controller[Symbol.dispose](),
        this.#v());
    }
    #v() {
      this.#r?.snapshot.phase === `stopping` &&
        (this.#r.microphoneMute?.stop(), (this.#r.microphoneMute = null));
      let e = this.getSnapshot();
      for (let n of this.#c)
        try {
          var t = createUsingScope();
          t.u(n(e));
        } catch (e) {
          t.e = e;
        } finally {
          t.d();
        }
    }
    #y(e) {
      if (e.snapshot.phase === `active` && e.startMicrophoneMute != null)
        try {
          (e.microphoneMuteStarted ||
            ((e.microphoneMuteStarted = !0),
            (e.microphoneMute = e.startMicrophoneMute((t) => {
              this.#r === e &&
                e.cleanup === `none` &&
                this.control(e.snapshot.locator, { type: `set-microphone-muted`, muted: t });
            }))),
            e.microphoneMute?.acknowledgeMuted(e.snapshot.microphoneMuted));
        } catch (t) {
          (e.microphoneMute?.stop(),
            (e.microphoneMute = null),
            this.#e().warning(`Could not enable native microphone mute`, {
              safe: {},
              sensitive: { error: t },
            }));
        }
    }
    #b(e) {
      this.#c.delete(e) && e[Symbol.dispose]();
    }
  },
  R8e = class extends n.Uf {
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
function F2(e, t) {
  return e.hostId === t.hostId && e.conversationId === t.conversationId;
}

  return L8e;
}

if (typeof module !== "undefined")
  module.exports = { createRealtimeVoiceHostCoordinatorClass };
