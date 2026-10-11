export interface ThreadReadStateOwner {
  open(
    onEvent: (event: { type: string; hostId?: string; threadId?: string; hasUnreadTurn?: boolean; reason?: string }) => void,
  ): Promise<{
    status: string;
    identity: { kind: string; accountId?: string; userId?: string; authMode?: string };
    executionHostKeysByHostId: Record<string, string>;
    unreadThreadIdsByHostId: Record<string, string[]>;
    session: { set(opts: unknown): Promise<{ status: string } | undefined>; [Symbol.dispose](): void };
  }>;
}

export interface HostThreadReadStateContext {
  identity: { kind: string; accountId?: string; userId?: string; authMode?: string };
  executionHostKey: string;
}

/** Owns one host's unread-thread subscription, reconnect generation, and disposal. */
export async function createHostThreadReadState({
  owner,
  hostId,
  context,
  assertCurrent,
  assertLifetimeCurrent,
  subscribeIdentityChanges,
  createLogger,
  isSameAuthIdentity,
}: {
  owner: ThreadReadStateOwner;
  hostId: string;
  context: HostThreadReadStateContext;
  assertCurrent: () => void;
  assertLifetimeCurrent: () => void;
  subscribeIdentityChanges: (cb: () => void) => () => void;
  createLogger?: () => { warning(message: string, details: unknown): void };
  isSameAuthIdentity: (left: unknown, right: unknown) => boolean;
}) {
  const logger = createLogger?.() ?? { warning() {} };
  const unreadThreads = new Set<string>();
  const listeners = new Set<(change: { threadId: string; hasUnreadTurn: boolean }) => void>();
  type ReadStateSession = Awaited<ReturnType<ThreadReadStateOwner["open"]>>["session"];
  let session: ReadStateSession | null = null;
  let disposed = false;
  let retry: Promise<void> | null = null;
  let openGeneration = 0;

  const setUnread = (threadId: string, hasUnreadTurn: boolean) => {
    if (hasUnreadTurn !== unreadThreads.has(threadId)) {
      if (hasUnreadTurn) unreadThreads.add(threadId);
      else unreadThreads.delete(threadId);
      for (const listener of listeners) listener({ threadId, hasUnreadTurn });
    }
  };

  const connect = async () => {
    assertLifetimeCurrent();
    if (disposed) throw new Error("Thread read state disposed");
    const generation = ++openGeneration;
    const pendingEvents = new Map<string, boolean>();
    let eventsFlowed = false;
    let retiredDuringOpen = false;
    const opened = await owner.open((event) => {
      if (disposed || generation !== openGeneration) return;
      if (event.type === "retired") {
        retiredDuringOpen = true;
        session = null;
        if (event.reason === "disposed") disposed = true;
        else retry ?? connect().catch(onConnectError);
      } else if (event.hostId === hostId) {
        if (eventsFlowed) setUnread(event.threadId ?? "", event.hasUnreadTurn ?? false);
        else pendingEvents.set(event.threadId ?? "", event.hasUnreadTurn ?? false);
      }
    });
    if (opened.status !== "ready") throw new Error("Thread read state unavailable");
    try {
      assertLifetimeCurrent();
      if (!isSameAuthIdentity(opened.identity, context.identity) || opened.executionHostKeysByHostId[hostId] !== context.executionHostKey)
        throw new Error("Thread read state identity changed");
      if (disposed) throw new Error("Thread read state disposed");
    } catch (error) {
      throw (opened.session[Symbol.dispose](), error);
    }
    if (retiredDuringOpen) return (opened.session[Symbol.dispose](), connect());
    session = opened.session;
    const unread = new Set(opened.unreadThreadIdsByHostId[hostId] ?? []);
    for (const [threadId, hasUnreadTurn] of pendingEvents) {
      if (hasUnreadTurn) unread.add(threadId);
      else unread.delete(threadId);
    }
    eventsFlowed = true;
    for (const threadId of unreadThreads) if (!unread.has(threadId)) setUnread(threadId, false);
    for (const threadId of unread) setUnread(threadId, true);
  };

  const ensureConnected = () => (
    (retry ??= connect().finally(() => { retry = null; })),
    retry
  );

  function onConnectError(error: unknown) {
    try { assertCurrent(); } catch { return; }
    if (!disposed) logger.warning("Failed to bind hosted thread read state", { safe: {}, sensitive: { error } });
  }

  await ensureConnected();

  const isReady = () => {
    if (disposed) return false;
    try { return (assertCurrent(), true); } catch { return false; }
  };
  const unsubscribeIdentity = subscribeIdentityChanges(() => {
    if (!disposed && session == null) ensureConnected().catch(onConnectError);
  });

  return {
    state: {
      isReady,
      has(threadId: string): boolean | undefined { return isReady() ? unreadThreads.has(threadId) : undefined; },
      set(threadId: string, hasUnreadTurn: boolean) {
        assertCurrent();
        (async () => {
          session ?? (await ensureConnected());
          assertCurrent();
          if ((await session?.set({ hostId, threadId, hasUnreadTurn }))?.status !== "ok") throw new Error("Thread read state retired");
        })().catch(onConnectError);
      },
      subscribe(listener: (change: { threadId: string; hasUnreadTurn: boolean }) => void) {
        listeners.add(listener);
        return () => { listeners.delete(listener); };
      },
    },
    dispose() {
      disposed = true;
      unsubscribeIdentity();
      session?.[Symbol.dispose]();
      session = null;
      listeners.clear();
    },
  };
}

if (typeof module !== "undefined") module.exports = { createHostThreadReadState };
