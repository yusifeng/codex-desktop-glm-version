// @ts-nocheck

/** Owns realtime voice history projection, persistence, ephemeral state, and RPC subscriptions. */
export function createRealtimeVoiceHistoryRuntime(dependencies: Record<string, any>) {
  const {
    runtime: n,
    validateTimelineRecord: yw,
    createUsingScope,
    now,
  } = dependencies;

  const b8e = class RealtimeVoiceHistoryLedger {
    ledger;
    onUpdate;
    #e = new Map();
    #t = new n.Eo();
    #n = new Map();
    constructor(e, t = () => {}) {
      ((this.ledger = e), (this.onUpdate = t));
    }
    getSnapshot(e) {
      let t = this.#r(e);
      return t == null ? { entries: [], isLoaded: !0, records: [] } : this.#p(t);
    }
    markEphemeral(e) {
      let t = this.#r(e);
      t != null && (t.ephemeral = !0);
    }
    forgetEphemeral(e) {
      let t = w2(e);
      this.#n.get(t)?.ephemeral === !0 &&
        (this.#n.set(t, null),
        this.#e.delete(t),
        this.#t.forget(e),
        this.onUpdate(e, this.getSnapshot(e)));
    }
    observe(e) {
      if (e.type === `host-disconnected` || e.type === `multi-agent-activity`) return;
      let t = w2(e.thread);
      if (this.#n.get(t) === null) return;
      e.type === `bem-turn-started` && this.#e.set(t, e);
      let n = this.#n.get(t) ?? (x8e(e) ? this.#r(e.thread) : null);
      if (n == null) {
        e.type === `bem-turn-completed` && this.#e.delete(t);
        return;
      }
      switch (e.type) {
        case `bem-turn-started`: {
          n.activeBemTurn = e;
          let t = n.pendingHandoffs.shift(),
            r = t?.sessionId ?? n.activeSessionId;
          r != null &&
            (n.activeSessionId != null && this.#c(n, n.activeSessionId, e.occurredAtMs),
            this.#s(n, r, e.turnId, e.occurredAtMs, t?.handoffId));
          break;
        }
        case `bem-turn-completed`: {
          let r = n.voiceOwnedTurns.get(e.turnId);
          (r != null &&
            (this.#c(n, r, e.occurredAtMs),
            this.#f(
              n,
              {
                schemaVersion: 1,
                recordId: `work:${e.turnId}:terminal`,
                occurredAtMs: e.occurredAtMs,
                type: `voice-work-terminal`,
                sessionId: r,
                turnId: e.turnId,
                status: e.status === `inProgress` ? null : e.status,
              },
              (t) => ({
                ...x2(t),
                type: `bem-turn-completed`,
                sessionId: r,
                status: e.status,
                turnId: e.turnId,
              }),
            ),
            n.voiceOwnedTurns.delete(e.turnId)),
            n.activeBemTurn?.turnId === e.turnId && (n.activeBemTurn = null),
            this.#e.delete(t));
          break;
        }
        case `bem-item-started`:
        case `bem-item-completed`: {
          let t = n.voiceOwnedTurns.get(e.turnId);
          t != null &&
            (this.#d(n, t, e),
            e.type === `bem-item-completed` &&
              n.projectionRecords.push({
                eventId: `live-item-completed:${e.turnId}:${e.itemId}`,
                occurredAtMs: e.occurredAtMs,
                sequence: n.projectionRecords.at(-1)?.sequence ?? 0,
                type: `bem-item-completed`,
                sessionId: t,
                itemId: e.itemId,
                itemType: e.itemType,
                turnId: e.turnId,
              }));
          break;
        }
        case `bem-item-presented`: {
          let t = n.voiceOwnedTurns.get(e.turnId);
          if (t == null) break;
          (this.#c(n, t, e.occurredAtMs),
            this.#u(
              n,
              t,
              e.turnId,
              e.presentationId,
              e.occurredAtMs,
              { type: `item`, itemId: e.itemId, kind: e.kind },
              (n) => ({
                ...x2(n),
                type: `bem-item-started`,
                sessionId: t,
                itemId: e.itemId,
                itemType: C2(e.kind),
                turnId: e.turnId,
              }),
            ));
          break;
        }
        case `bem-presentation-added`: {
          let t = n.voiceOwnedTurns.get(e.turnId),
            r = t ?? e.sessionId;
          if (r == null) break;
          (t ?? this.#a(n, r, e.occurredAtMs), this.#c(n, n.activeSessionId ?? r, e.occurredAtMs));
          let i =
            e.presentation.type === `created-thread`
              ? { type: `item`, itemId: e.itemId, kind: `created-thread` }
              : {
                  type: `agent-message`,
                  itemId: e.itemId,
                  index: e.presentation.index,
                  kind: e.presentation.type,
                };
          this.#u(n, r, e.turnId, e.presentationId, e.occurredAtMs, i, (t) => ({
            ...x2(t),
            type: `bem-presentation-added`,
            sessionId: r,
            turnId: e.turnId,
            itemId: e.itemId,
            presentationId: e.presentationId,
            presentation: e.presentation,
          }));
          break;
        }
        case `session-started`: {
          let r = now();
          (this.#a(n, e.sessionId, r, e.version === `v3` ? `server` : `boundary`),
            (n.activeBemTurn = this.#e.get(t) ?? null),
            n.activeBemTurn != null &&
              this.#s(
                n,
                e.sessionId,
                n.activeBemTurn.turnId,
                n.activeBemTurn.occurredAtMs,
                void 0,
              ));
          break;
        }
        case `transcript-delta`: {
          let t = now();
          (this.#a(n, e.sessionId, t),
            this.#l(
              n,
              e.sessionId,
              t,
              () => this.#t.addDelta(e.thread, e.sessionId, e.role, e.delta, t),
              !1,
            ));
          break;
        }
        case `transcript-done`: {
          let t = now();
          (this.#a(n, e.sessionId, t),
            this.#l(
              n,
              e.sessionId,
              t,
              () => this.#t.complete(e.thread, e.sessionId, e.role, e.text, t),
              !0,
            ));
          break;
        }
        case `handoff-added`: {
          let t = now();
          (this.#a(n, e.sessionId, t),
            this.#l(
              n,
              e.sessionId,
              t,
              () => this.#t.finishHandoffSegment(n.locator, e.sessionId),
              !1,
            ),
            n.activeBemTurn ??
              n.pendingHandoffs.push({ handoffId: e.handoffId, sessionId: e.sessionId }));
          break;
        }
        case `session-ended`:
          e.sessionId != null && this.#o(n, e.sessionId, `ended`, now());
          break;
        case `session-failed`:
          this.#o(n, e.sessionId, `failed`, now());
      }
      this.#m(n);
    }
    #r(e) {
      let t = w2(e),
        n = this.#n.get(t);
      if (n !== void 0) return n;
      let r = this.ledger.list(e),
        i = {
          activeBemTurn: null,
          activeSessionId: null,
          ephemeral: !1,
          locator: e,
          pendingHandoffs: [],
          projectionRecords: r.map(S2),
          sealedTranscriptIds: new Set(),
          transcriptSessionById: new Map(),
          transcriptTextById: new Map(),
          voiceOwnedTurns: new Map(),
        };
      for (let e of r)
        switch (e.type) {
          case `session-started`:
            i.activeSessionId = e.sessionId;
            break;
          case `session-ended`:
            i.activeSessionId === e.sessionId && (i.activeSessionId = null);
            break;
          case `transcript-segment`:
            (i.sealedTranscriptIds.add(e.segmentId),
              i.transcriptSessionById.set(e.segmentId, e.sessionId),
              i.transcriptTextById.set(e.segmentId, e.text));
            break;
          case `voice-work-claimed`:
            i.voiceOwnedTurns.set(e.turnId, e.sessionId);
            break;
          case `voice-work-terminal`:
            i.voiceOwnedTurns.delete(e.turnId);
        }
      return (this.#t.restoreSnapshot(e, S8e(r)), this.#n.set(t, i), this.#i(i), i);
    }
    #i(e) {
      let t = now();
      for (let [n, r] of e.voiceOwnedTurns)
        this.#f(
          e,
          {
            schemaVersion: 1,
            recordId: `work:${n}:terminal`,
            occurredAtMs: t,
            type: `voice-work-terminal`,
            sessionId: r,
            turnId: n,
            status: `interrupted`,
          },
          S2,
        );
      if ((e.voiceOwnedTurns.clear(), e.activeSessionId == null)) return;
      let n = e.activeSessionId;
      (this.#f(
        e,
        {
          schemaVersion: 1,
          recordId: `session:${n}:ended`,
          occurredAtMs: t,
          type: `session-ended`,
          sessionId: n,
          outcome: `failed`,
        },
        S2,
      ),
        (e.activeSessionId = null));
    }
    #a(e, t, n, r) {
      if (e.activeSessionId === t) {
        r != null && this.#t.startSession(e.locator, t, r);
        return;
      }
      (e.activeSessionId != null && this.#c(e, e.activeSessionId, n),
        this.#t.startSession(e.locator, t, r),
        (e.activeSessionId = t),
        this.#f(
          e,
          {
            schemaVersion: 1,
            recordId: `session:${t}:started`,
            occurredAtMs: n,
            type: `session-started`,
            sessionId: t,
          },
          S2,
        ));
    }
    #o(e, t, n, r) {
      (this.#l(e, t, r, () => this.#t.close(e.locator, t), !1),
        this.#f(
          e,
          {
            schemaVersion: 1,
            recordId: `session:${t}:ended`,
            occurredAtMs: r,
            type: `session-ended`,
            sessionId: t,
            outcome: n,
          },
          S2,
        ),
        e.activeSessionId === t && (e.activeSessionId = null));
    }
    #s(e, t, n, r, i) {
      e.voiceOwnedTurns.has(n) ||
        (this.#f(
          e,
          {
            schemaVersion: 1,
            recordId: `work:${n}:claimed`,
            occurredAtMs: now(),
            type: `voice-work-claimed`,
            sessionId: t,
            turnId: n,
            startedAtMs: r,
            handoffId: i,
          },
          S2,
        ),
        e.voiceOwnedTurns.set(n, t));
    }
    #c(e, t, n) {
      this.#l(e, t, n, () => this.#t.finishSegment(e.locator, t), !1);
    }
    #l(e, t, n, r, i) {
      let a = r();
      for (let r of a.entries) {
        if (
          r.type !== `item` ||
          (e.transcriptSessionById.has(r.id) || e.transcriptSessionById.set(r.id, t), !r.completed)
        )
          continue;
        let a = e.transcriptSessionById.get(r.id) ?? t,
          o = e.sealedTranscriptIds.has(r.id);
        (!o || (i && e.transcriptTextById.get(r.id) !== r.text)) &&
          (this.#f(
            e,
            {
              schemaVersion: 1,
              recordId: `transcript:${a}:${r.id}${o ? `:final` : ``}`,
              occurredAtMs: n,
              type: `transcript-segment`,
              sessionId: a,
              segmentId: r.id,
              role: r.role,
              text: r.text,
            },
            S2,
          ),
          e.sealedTranscriptIds.add(r.id),
          e.transcriptTextById.set(r.id, r.text));
      }
    }
    #u(e, t, n, r, i, a, o) {
      this.#f(
        e,
        {
          schemaVersion: 1,
          recordId: `presentation:${n}:${r}`,
          occurredAtMs: i,
          type: `presentation-committed`,
          sessionId: t,
          turnId: n,
          presentationId: r,
          source: a,
        },
        o,
      );
    }
    #d(e, t, n) {
      if (n.itemType !== `userMessage`) return;
      let r = `bem-user:${n.turnId}:${n.itemId}`;
      e.projectionRecords.some((e) => e.eventId === r) ||
        (this.#c(e, e.activeSessionId ?? t, n.occurredAtMs),
        this.#f(
          e,
          {
            schemaVersion: 1,
            recordId: r,
            occurredAtMs: n.occurredAtMs,
            type: `bem-user-item-observed`,
            sessionId: t,
            turnId: n.turnId,
            itemId: n.itemId,
          },
          S2,
        ));
    }
    #f(e, t, n) {
      let r = e.ephemeral
        ? yw({ ...t, sequence: (e.projectionRecords.at(-1)?.sequence ?? 0) + 1 })
        : this.ledger.append(e.locator, t);
      if (r == null) throw Error(`Voice timeline record is invalid`);
      e.projectionRecords.some((e) => e.eventId === r.recordId) || e.projectionRecords.push(n(r));
    }
    #p(e) {
      let t = this.#t.getSnapshot(e.locator),
        n = t.entries.flatMap((t, n) =>
          t.type === `item` &&
          (!e.sealedTranscriptIds.has(t.id) || e.transcriptTextById.get(t.id) !== t.text)
            ? [
                {
                  eventId: `live-transcript:${t.id}`,
                  occurredAtMs: now(),
                  sequence: 2 ** 53 - 1 - 1e3 + n,
                  type: `transcript-item`,
                  sessionId: e.transcriptSessionById.get(t.id) ?? e.activeSessionId ?? `live`,
                  item: t,
                },
              ]
            : [],
        );
      return { ...t, isLoaded: !0, records: [...e.projectionRecords, ...n] };
    }
    #m(e) {
      this.onUpdate(e.locator, this.#p(e));
    }
  };
function x8e(e) {
  return (
    e.type === `session-started` ||
    e.type === `session-failed` ||
    e.type === `transcript-delta` ||
    e.type === `transcript-done` ||
    e.type === `handoff-added`
  );
}
function x2(e) {
  return { eventId: e.recordId, occurredAtMs: e.occurredAtMs, sequence: e.sequence };
}
function S2(e) {
  let t = x2(e);
  switch (e.type) {
    case `session-started`:
      return { ...t, type: `session-started`, sessionId: e.sessionId };
    case `session-ended`:
      return {
        ...t,
        type: e.outcome === `ended` ? `session-ended` : `session-failed`,
        sessionId: e.sessionId,
      };
    case `transcript-segment`:
      return {
        ...t,
        type: `transcript-item`,
        sessionId: e.sessionId,
        item: { type: `item`, completed: !0, id: e.segmentId, role: e.role, text: e.text },
      };
    case `voice-work-claimed`:
      return {
        ...t,
        occurredAtMs: e.startedAtMs,
        type: `bem-turn-started`,
        sessionId: e.sessionId,
        turnId: e.turnId,
        handoffId: e.handoffId,
      };
    case `voice-work-terminal`:
      return {
        ...t,
        type: `bem-turn-completed`,
        sessionId: e.sessionId,
        status: e.status,
        turnId: e.turnId,
      };
    case `bem-user-item-observed`:
      return {
        ...t,
        type: `bem-item-started`,
        sessionId: e.sessionId,
        itemId: e.itemId,
        itemType: `steeringUserMessage`,
        turnId: e.turnId,
      };
    case `presentation-committed`:
      return e.source.type === `item`
        ? {
            ...t,
            type: `bem-item-started`,
            sessionId: e.sessionId,
            itemId: e.source.itemId,
            itemType: C2(e.source.kind),
            turnId: e.turnId,
          }
        : {
            ...t,
            type: `bem-presentation-committed`,
            sessionId: e.sessionId,
            turnId: e.turnId,
            itemId: e.source.itemId,
            presentationId: e.presentationId,
            presentationType: e.source.kind,
            index: e.source.index,
          };
  }
}
function S8e(e) {
  let t = [],
    n = new Map(),
    r = 0;
  for (let i of e)
    if (i.type === `session-started`)
      (r > 0 && t.push({ type: `session-divider`, id: i.sessionId }), (r += 1));
    else if (i.type === `transcript-segment`) {
      let e = { type: `item`, completed: !0, id: i.segmentId, role: i.role, text: i.text },
        r = n.get(i.segmentId);
      r == null ? (n.set(i.segmentId, t.length), t.push(e)) : (t[r] = e);
    }
  return { entries: t };
}
function C2(e) {
  switch (e) {
    case `created-thread`:
      return `dynamicToolCall`;
    case `image`:
      return `imageGeneration`;
    case `remote-task`:
      return `remoteTaskCreated`;
    case `subagent`:
      return `subAgentActivity`;
  }
}
function w2({ hostId: e, conversationId: t }) {
  return JSON.stringify([e, t]);
}
const C8e = class RealtimeVoiceHistoryService extends n.Uf {
    #e;
    #t = new Set();
    #n;
    constructor(e, t) {
      (super(),
        (this.#e = new b8e(t, (e, t) => {
          this.#r(e, t);
        })),
        (this.#n = e.subscribe((e) => {
          this.#e.observe(e);
        })));
    }
    subscribe(e, t) {
      let n = { listener: t.dup(), locator: e };
      return (
        this.#t.add(n),
        n.listener.onRpcBroken(() => {
          this.#a(n);
        }),
        this.#i(n, this.#e.getSnapshot(e)),
        new w8e(() => {
          this.#a(n);
        })
      );
    }
    markEphemeral(e) {
      this.#e.markEphemeral(e);
    }
    forgetEphemeral(e) {
      this.#e.forgetEphemeral(e);
    }
    dispose = () => {
      (this.#n?.(), (this.#n = null));
      for (let e of this.#t) e.listener[Symbol.dispose]();
      this.#t.clear();
    };
    #r(e, t) {
      for (let n of this.#t) T8e(n.locator, e) && this.#i(n, t);
    }
    #i(e, t) {
      try {
        var n = createUsingScope();
        n.u(e.listener(t));
      } catch (e) {
        n.e = e;
      } finally {
        n.d();
      }
    }
    #a(e) {
      this.#t.delete(e) && e.listener[Symbol.dispose]();
    }
  },
  w8e = class RealtimeVoiceHistorySubscription extends n.Uf {
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
function T8e(e, t) {
  return e.hostId === t.hostId && e.conversationId === t.conversationId;
}

  return {
    RealtimeVoiceHistoryLedger: b8e,
    RealtimeVoiceHistoryService: C8e,
  };
}

if (typeof module !== "undefined")
  module.exports = { createRealtimeVoiceHistoryRuntime };
