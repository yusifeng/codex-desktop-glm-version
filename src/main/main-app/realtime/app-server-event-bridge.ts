// @ts-nocheck

/** Bridges app-server notifications into normalized realtime voice and multi-agent events. */
export function createAppServerRealtimeEventBridgeClass(dependencies: Record<string, any>) {
  const { runtime: n, randomUUID, now, schemaOverrides = {} } = dependencies;

var E8e = n.df([
    `pendingInit`,
    `running`,
    `interrupted`,
    `completed`,
    `errored`,
    `shutdown`,
    `notFound`,
  ]),
  D8e = n.vf(`type`, [
    n.wf({
      agentsStates: n.Ef(n.Of(), n.wf({ message: n.Of().nullable(), status: E8e })),
      id: n.Of(),
      prompt: n.Of().nullable(),
      receiverThreadIds: n.hf(n.Of()),
      senderThreadId: n.Of(),
      status: n.df([`inProgress`, `completed`, `failed`]),
      tool: n.df([`spawnAgent`, `sendInput`, `resumeAgent`, `wait`, `closeAgent`]),
      type: n.bf(`collabAgentToolCall`),
    }),
    n.wf({
      agentThreadId: n.Of(),
      id: n.Of(),
      kind: n.df([`started`, `interacted`, `interrupted`, `completed`]),
      type: n.bf(`subAgentActivity`),
    }),
  ]);
function O8e(e, t) {
  return t.type === `subAgentActivity` ? [e] : [e, t.senderThreadId, ...t.receiverThreadIds];
}
function k8e({ hostId: e, item: t, occurredAtMs: r, realtimeThread: i }) {
  if (i == null) return [];
  if (t.type === `subAgentActivity`) {
    let a = { hostId: e, threadId: n.$u(t.agentThreadId) };
    if (t.kind === `started`)
      return [
        {
          id: `thread-created:${e}:${t.agentThreadId}`,
          kind: `thread-created`,
          occurredAtMs: r,
          prompt: null,
          realtimeThread: i,
          task: a,
          taskTitle: null,
        },
      ];
    let o = `interrupted`;
    return (
      t.kind === `interacted` ? (o = `running`) : t.kind === `completed` && (o = `completed`),
      [
        {
          direction: `from-task`,
          id: `thread-message:${e}:${t.agentThreadId}:${t.id}`,
          kind: `thread-message`,
          message: null,
          occurredAtMs: r,
          realtimeThread: i,
          task: a,
          taskStatus: o,
          taskTitle: null,
        },
      ]
    );
  }
  let a = i.conversationId;
  return t.tool === `spawnAgent` && t.status === `completed` && t.senderThreadId === a
    ? t.receiverThreadIds.map((a) => ({
        id: `thread-created:${e}:${a}`,
        kind: `thread-created`,
        occurredAtMs: r,
        prompt: t.prompt,
        realtimeThread: i,
        task: { hostId: e, threadId: n.$u(a) },
        taskTitle: null,
      }))
    : t.tool === `wait` && t.senderThreadId === a
      ? t.receiverThreadIds.map((a) => ({
          direction: `from-task`,
          id: `thread-message:${e}:${a}:${t.id}`,
          kind: `thread-message`,
          message: t.agentsStates[a]?.message ?? null,
          occurredAtMs: r,
          realtimeThread: i,
          task: { hostId: e, threadId: n.$u(a) },
          taskStatus: T2(t.agentsStates[a]?.status) ?? (t.status === `failed` ? `failed` : null),
          taskTitle: null,
        }))
      : t.status !== `completed` || t.tool !== `sendInput`
        ? []
        : t.senderThreadId === a
          ? t.receiverThreadIds.map((a) => ({
              direction: `to-task`,
              id: `thread-message:${e}:${a}:${t.id}`,
              kind: `thread-message`,
              message: t.prompt,
              occurredAtMs: r,
              realtimeThread: i,
              task: { hostId: e, threadId: n.$u(a) },
              taskStatus: T2(t.agentsStates[a]?.status),
              taskTitle: null,
            }))
          : t.receiverThreadIds.includes(a)
            ? [
                {
                  direction: `from-task`,
                  id: `thread-message:${e}:${t.senderThreadId}:${t.id}`,
                  kind: `thread-message`,
                  message: t.prompt,
                  occurredAtMs: r,
                  realtimeThread: i,
                  task: { hostId: e, threadId: n.$u(t.senderThreadId) },
                  taskStatus: null,
                  taskTitle: null,
                },
              ]
            : [];
}
function T2(e) {
  switch (e) {
    case `pendingInit`:
      return `pending`;
    case `running`:
      return `running`;
    case `completed`:
      return `completed`;
    case `interrupted`:
      return `interrupted`;
    case `errored`:
      return `failed`;
    case `shutdown`:
      return `stopped`;
    case `notFound`:
      return `not-found`;
    case void 0:
      return null;
  }
}
var E2 = n.wf({ threadId: n.Of() }),
  A8e = n.df([`resumeAgent`, `sendInput`, `spawnAgent`]),
  D2 = n.df([`user`, `assistant`, `model`]),
  j8e = n.df([`v1`, `v2`, `v3`]),
  M8e = n.df([`completed`, `failed`, `interrupted`, `inProgress`]),
  O2 = n.jf([
    E2.extend({
      turn: n.wf({
        id: n.Of(),
        status: M8e.nullish(),
        startedAt: n.Cf().nullish(),
        completedAt: n.Cf().nullish(),
      }),
    }),
    E2.extend({ turnId: n.Of() }),
  ]),
  k2 = E2.extend({
    turnId: n.Of(),
    item: n.wf({ id: n.Of(), type: n.Of() }).loose(),
    startedAtMs: n.Cf().optional(),
    completedAtMs: n.Cf().optional(),
  }),
  A2 = n.wf({ id: n.Of(), type: n.bf(`agentMessage`), text: n.Of() }).loose(),
  N8e = n
    .wf({
      type: n.bf(`dynamicToolCall`),
      id: n.Of(),
      namespace: n.bf(`codex_app`).nullable(),
      tool: n.bf(`create_thread`),
      status: n.bf(`completed`),
      contentItems: n
        .hf(
          n.vf(`type`, [
            n.wf({ type: n.bf(`inputText`), text: n.Of() }),
            n.wf({ type: n.bf(`inputImage`), imageUrl: n.Of() }),
            n.wf({ type: n.bf(`inputAudio`), audioUrl: n.Of() }),
          ]),
        )
        .nullable(),
      success: n.bf(!0),
    })
    .loose(),
  P8e = n.vf(`method`, [
    n.wf({ method: n.bf(`turn/started`), params: O2 }),
    n.wf({ method: n.bf(`turn/completed`), params: O2 }),
    n.wf({ method: n.bf(`item/started`), params: k2 }),
    n.wf({ method: n.bf(`item/completed`), params: k2 }),
    n.wf({
      method: n.bf(`item/agentMessage/delta`),
      params: E2.extend({ turnId: n.Of(), itemId: n.Of(), delta: n.Of() }),
    }),
    n.wf({
      method: n.bf(`thread/realtime/started`),
      params: E2.extend({
        realtimeSessionId: n.Of().nullish(),
        sessionId: n.Of().nullish(),
        version: j8e,
      }),
    }),
    n.wf({
      method: n.bf(`thread/realtime/transcript/delta`),
      params: E2.extend({ role: D2, delta: n.Of() }),
    }),
    n.wf({
      method: n.bf(`thread/realtime/transcript/done`),
      params: E2.extend({ role: D2, text: n.Of() }),
    }),
    n.wf({
      method: n.bf(`thread/realtime/itemAdded`),
      params: E2.extend({ item: n.wf({ type: n.bf(`handoff_request`), handoff_id: n.Of() }) }),
    }),
    n.wf({ method: n.bf(`thread/realtime/error`), params: E2.extend({ message: n.Of() }) }),
    n.wf({
      method: n.bf(`thread/realtime/closed`),
      params: E2.extend({ reason: n.Of().nullable() }),
    }),
  ]),
  F8e = class AppServerRealtimeEventBridge {
    activeBemTurns = new Map();
    agentMessages = new Map();
    connections = new Map();
    sessionsAwaitingClose = new Map();
    listeners = new Set();
    sessions = new Map();
    unsubscribeRegistry;
    voiceOwnedBemTurns = new Map();
    constructor(e) {
      this.unsubscribeRegistry = e.subscribe((e) => {
        this.handleRegistryEvent(e);
      });
    }
    subscribe(e) {
      return (
        this.listeners.add(e),
        () => {
          this.listeners.delete(e);
        }
      );
    }
    dispose() {
      this.unsubscribeRegistry();
      for (let { unsubscribe: e } of this.connections.values()) e();
      (this.connections.clear(),
        this.activeBemTurns.clear(),
        this.agentMessages.clear(),
        this.sessionsAwaitingClose.clear(),
        this.sessions.clear(),
        this.voiceOwnedBemTurns.clear(),
        this.listeners.clear());
    }
    handleRegistryEvent(e) {
      if (e.type === `added`) {
        this.connections.set(e.hostId, {
          connection: e.connection,
          unsubscribe: e.connection.registerInternalNotificationHandler((t) => {
            this.handleNotification(e.hostId, t);
          }),
        });
        return;
      }
      let t = this.connections.get(e.hostId);
      if (t?.connection === e.connection) {
        (t.unsubscribe(), this.connections.delete(e.hostId));
        for (let [t, n] of this.agentMessages)
          n.hostId === e.hostId && this.agentMessages.delete(t);
        for (let [t, n] of this.activeBemTurns)
          n.hostId === e.hostId && this.activeBemTurns.delete(t);
        for (let [t, n] of this.voiceOwnedBemTurns)
          n.hostId === e.hostId && this.voiceOwnedBemTurns.delete(t);
        this.publish({ type: `host-disconnected`, hostId: e.hostId });
        for (let [t, n] of this.sessions)
          n.thread.hostId === e.hostId &&
            (this.sessions.delete(t),
            this.publish({ type: `session-ended`, thread: n.thread, sessionId: n.id }));
        for (let [t, n] of this.sessionsAwaitingClose)
          if (n[0]?.thread.hostId === e.hostId) {
            this.sessionsAwaitingClose.delete(t);
            for (let e of n)
              this.publish({ type: `session-ended`, thread: e.thread, sessionId: e.id });
          }
      }
    }
    handleNotification(e, t) {
      let r = (schemaOverrides.notification ?? P8e).safeParse(t);
      if (!r.success) return;
      let i = { hostId: e, conversationId: n.$u(r.data.params.threadId) },
        a = N2(e, r.data.params.threadId);
      switch (r.data.method) {
        case `turn/started`: {
          let { params: t } = r.data,
            n = `turn` in t ? t.turn.id : t.turnId;
          this.activeBemTurns.set(a, { hostId: e, turnId: n });
          let o = this.sessions.get(a);
          (o != null &&
            this.voiceOwnedBemTurns.set(P2(e, t.threadId, n), { hostId: e, sessionId: o.id }),
            this.publish({
              type: `bem-turn-started`,
              thread: i,
              turnId: n,
              occurredAtMs:
                `turn` in t && t.turn.startedAt != null ? t.turn.startedAt * 1e3 : now(),
            }));
          break;
        }
        case `turn/completed`: {
          let { params: t } = r.data,
            n = `turn` in t ? t.turn.id : t.turnId;
          (this.publish({
            type: `bem-turn-completed`,
            thread: i,
            turnId: n,
            status: `turn` in t ? (t.turn.status ?? null) : null,
            occurredAtMs:
              `turn` in t && t.turn.completedAt != null ? t.turn.completedAt * 1e3 : now(),
          }),
            this.activeBemTurns.delete(a),
            this.voiceOwnedBemTurns.delete(P2(e, t.threadId, n)));
          break;
        }
        case `item/started`: {
          let { params: t } = r.data,
            n = t.startedAtMs ?? now();
          if (
            (this.publish({
              type: `bem-item-started`,
              thread: i,
              turnId: t.turnId,
              itemId: t.item.id,
              itemType: t.item.type,
              occurredAtMs: n,
            }),
            t.item.type === `imageGeneration` || t.item.type === `remoteTaskCreated`)
          ) {
            let e = t.item.type === `imageGeneration` ? `image` : `remote-task`;
            this.publish({
              type: `bem-item-presented`,
              thread: i,
              turnId: t.turnId,
              itemId: t.item.id,
              presentationId: `${t.item.id}:${e}`,
              kind: e,
              occurredAtMs: n,
            });
          }
          let a = (schemaOverrides.agentMessage ?? A2).safeParse(t.item);
          a.success &&
            this.observeAgentMessage({
              hostId: e,
              thread: i,
              turnId: t.turnId,
              itemId: a.data.id,
              text: a.data.text,
              occurredAtMs: n,
            });
          break;
        }
        case `item/completed`: {
          let { params: t } = r.data,
            o = t.completedAtMs ?? now(),
            s = (schemaOverrides.agentMessage ?? A2).safeParse(t.item);
          (s.success &&
            (this.observeAgentMessage({
              hostId: e,
              thread: i,
              turnId: t.turnId,
              itemId: s.data.id,
              text: s.data.text,
              occurredAtMs: o,
            }),
            this.agentMessages.delete(M2(e, r.data.params.threadId, t.turnId, s.data.id))),
            this.publish({
              type: `bem-item-completed`,
              thread: i,
              turnId: t.turnId,
              itemId: t.item.id,
              itemType: t.item.type,
              occurredAtMs: o,
            }));
          let c = (schemaOverrides.createdThreadTool ?? N8e).safeParse(t.item);
          if (c.success) {
            let e = c.data.contentItems?.find((e) => e.type === `inputText`)?.text,
              r = e == null ? null : n.To(e);
            r != null &&
              this.publish({
                type: `bem-presentation-added`,
                thread: i,
                sessionId: this.sessions.get(a)?.id ?? null,
                turnId: t.turnId,
                itemId: c.data.id,
                presentationId: `${c.data.id}:created-thread:0`,
                presentation: { type: `created-thread`, index: 0, result: r },
                occurredAtMs: o,
              });
          }
          let l = (schemaOverrides.multiAgentItem ?? D8e).safeParse(t.item);
          if (!l.success) break;
          let u = l.data,
            d = r.data.params.threadId,
            f = this.getActiveRealtimeThread(e, O8e(d, u));
          for (let t of k8e({ hostId: e, item: u, occurredAtMs: now(), realtimeThread: f }))
            this.publish({ type: `multi-agent-activity`, activity: t });
          if (u.type === `subAgentActivity`) {
            u.kind === `started` &&
              (this.publish({
                type: `bem-item-presented`,
                thread: i,
                turnId: t.turnId,
                itemId: u.id,
                presentationId: `${u.id}:subagent`,
                kind: `subagent`,
                occurredAtMs: o,
              }),
              this.publish({
                type: `real-delegation`,
                thread: i,
                delegation: { delegationId: u.id, tool: `spawnAgent` },
              }));
            break;
          }
          let p = (schemaOverrides.delegationTool ?? A8e).safeParse(u.tool);
          if (!(p.success && u.status === `completed` && u.receiverThreadIds.length > 0)) break;
          this.publish({
            type: `real-delegation`,
            thread: i,
            delegation: { delegationId: u.id, tool: p.data },
          });
          break;
        }
        case `item/agentMessage/delta`: {
          let { params: t } = r.data,
            n = this.getVoiceOwnedSessionId(e, t.threadId, t.turnId);
          if (n == null) break;
          let a = M2(e, t.threadId, t.turnId, t.itemId),
            o = this.agentMessages.get(a) ?? {
              hostId: e,
              seenPresentationIds: new Set(),
              sessionId: n,
              text: ``,
            };
          (this.agentMessages.set(a, o),
            (o.text += t.delta),
            this.publishAgentMessagePresentations({
              message: o,
              thread: i,
              turnId: t.turnId,
              itemId: t.itemId,
              occurredAtMs: now(),
            }));
          break;
        }
        case `thread/realtime/started`: {
          let t = r.data.params.realtimeSessionId ?? r.data.params.sessionId ?? null,
            n = this.sessions.get(a),
            o = n?.awaitingStarted === !0,
            s = t != null && t === n?.id;
          n == null || (!o && !s)
            ? (n != null && this.addSessionAwaitingClose(a, n),
              (n = this.createSession(a, i, !1, t)))
            : (n.awaitingStarted = !1);
          let c = this.activeBemTurns.get(a);
          (c != null &&
            this.voiceOwnedBemTurns.set(P2(e, r.data.params.threadId, c.turnId), {
              hostId: e,
              sessionId: n.id,
            }),
            this.publish({
              type: `session-started`,
              thread: i,
              sessionId: n.id,
              version: r.data.params.version,
            }));
          break;
        }
        case `thread/realtime/transcript/delta`: {
          let e = this.sessions.get(a) ?? this.createSession(a, i, !0);
          this.publish({
            type: `transcript-delta`,
            thread: i,
            sessionId: e.id,
            role: j2(r.data.params.role),
            delta: r.data.params.delta,
          });
          break;
        }
        case `thread/realtime/transcript/done`: {
          let e = this.sessions.get(a) ?? this.createSession(a, i, !0);
          this.publish({
            type: `transcript-done`,
            thread: i,
            sessionId: e.id,
            role: j2(r.data.params.role),
            text: r.data.params.text,
          });
          break;
        }
        case `thread/realtime/itemAdded`: {
          let e = this.sessions.get(a) ?? this.createSession(a, i, !0),
            t = r.data.params.item.handoff_id;
          if (e.seenHandoffIds.has(t)) break;
          (e.seenHandoffIds.add(t),
            this.publish({ type: `handoff-added`, thread: i, sessionId: e.id, handoffId: t }));
          break;
        }
        case `thread/realtime/error`: {
          let e = this.sessions.get(a),
            t = this.sessionsAwaitingClose.get(a),
            n = e ?? t?.at(-1) ?? this.createSession(a, i, !0);
          (this.sessions.delete(a),
            (e != null || t == null) && this.addSessionAwaitingClose(a, n),
            this.publish({ type: `session-failed`, thread: i, sessionId: n.id }));
          break;
        }
        case `thread/realtime/closed`: {
          let e = this.sessionsAwaitingClose.get(a),
            t = e?.shift();
          if (t != null) {
            (e?.length === 0 && this.sessionsAwaitingClose.delete(a),
              this.publish({ type: `session-ended`, thread: i, sessionId: t.id }));
            break;
          }
          let n = this.sessions.get(a);
          if (r.data.params.reason === `transport_closed`) {
            (n != null && (n.awaitingStarted = !0),
              this.publish({ type: `transport-lost`, thread: i, sessionId: n?.id ?? null }));
            break;
          }
          (this.sessions.delete(a),
            this.publish({ type: `session-ended`, thread: i, sessionId: n?.id ?? null }));
          break;
        }
      }
    }
    getActiveRealtimeThread(e, t) {
      for (let n of t) {
        let t = this.sessions.get(N2(e, n));
        if (t != null) return t.thread;
      }
      return null;
    }
    observeAgentMessage({ hostId: e, thread: t, turnId: n, itemId: r, text: i, occurredAtMs: a }) {
      let o = M2(e, t.conversationId, n, r),
        s = this.agentMessages.get(o),
        c = this.getVoiceOwnedSessionId(e, t.conversationId, n);
      if (s == null && c == null) return;
      let l = s ?? { hostId: e, seenPresentationIds: new Set(), sessionId: c, text: `` };
      (this.agentMessages.set(o, l),
        (l.sessionId ??= c),
        l.sessionId != null &&
          ((l.text = i),
          this.publishAgentMessagePresentations({
            message: l,
            thread: t,
            turnId: n,
            itemId: r,
            occurredAtMs: a,
          })));
    }
    publishAgentMessagePresentations({
      message: e,
      thread: t,
      turnId: r,
      itemId: i,
      occurredAtMs: a,
    }) {
      let o = e.sessionId;
      if (o != null)
        for (let s of n.wo(e.text)) {
          let n = `${i}:${s.type}:${s.index}`;
          if (e.seenPresentationIds.has(n)) continue;
          e.seenPresentationIds.add(n);
          let c;
          switch (s.type) {
            case `inline-markdown`:
              c = { type: s.type, index: s.index };
              break;
            case `inline-visualization`:
              c = { type: s.type, index: s.index, file: s.file, sourceThreadId: s.sourceThreadId };
          }
          this.publish({
            type: `bem-presentation-added`,
            thread: t,
            sessionId: o,
            turnId: r,
            itemId: i,
            presentationId: n,
            presentation: c,
            occurredAtMs: a,
          });
        }
    }
    createSession(e, t, n = !1, r = null) {
      let i = {
        awaitingStarted: n,
        seenHandoffIds: new Set(),
        id: r ?? randomUUID(),
        thread: t,
      };
      return (this.sessions.set(e, i), i);
    }
    getVoiceOwnedSessionId(e, t, n) {
      return (
        this.sessions.get(N2(e, t))?.id ??
        this.voiceOwnedBemTurns.get(P2(e, t, n))?.sessionId ??
        null
      );
    }
    addSessionAwaitingClose(e, t) {
      let n = this.sessionsAwaitingClose.get(e);
      n == null ? this.sessionsAwaitingClose.set(e, [t]) : n.push(t);
    }
    publish(e) {
      for (let t of this.listeners) t(e);
    }
  };
function j2(e) {
  return e === `user` ? `user` : `assistant`;
}
function M2(e, t, n, r) {
  return JSON.stringify([e, t, n, r]);
}
function N2(e, t) {
  return JSON.stringify([e, t]);
}
function P2(e, t, n) {
  return JSON.stringify([e, t, n]);
}

  return F8e;
}

if (typeof module !== "undefined")
  module.exports = { createAppServerRealtimeEventBridgeClass };
