// @ts-nocheck

/** Owns post-session realtime voice title generation and connection/policy retirement guards. */
export function createRealtimeVoiceThreadTitleCoordinatorClass(dependencies: Record<string, any>) {
  const {
    runtime: n,
    createLogger,
    loadModelAssignments,
    AbortControllerClass = AbortController,
    DOMExceptionClass = DOMException,
  } = dependencies;

  function locatorKey(locator) {
    return JSON.stringify([locator.hostId, locator.conversationId]);
  }

  return class RealtimeVoiceThreadTitleCoordinator {
    appServerConnectionRegistry;
    localConnection;
    evaluations;
    #sessions = new Map();
    #pendingTitles = new Map();
    #unsubscribe;
    logger = createLogger(`RealtimeVoiceThreadTitleCoordinator`);

    constructor(events, appServerConnectionRegistry, localConnection, evaluations) {
      ((this.appServerConnectionRegistry = appServerConnectionRegistry),
        (this.localConnection = localConnection),
        (this.evaluations = evaluations),
        (this.#unsubscribe = events.subscribe((event) => {
          this.#handleEvent(event);
        })));
    }

    dispose() {
      (this.#unsubscribe?.(), (this.#unsubscribe = null), this.#sessions.clear());
      for (let controller of this.#pendingTitles.values()) controller.abort();
      this.#pendingTitles.clear();
    }

    #handleEvent(event) {
      switch (event.type) {
        case `session-started`:
        case `transcript-delta`:
        case `transcript-done`:
        case `handoff-added`:
        case `session-failed`: {
          let key = locatorKey(event.thread);
          (this.#pendingTitles.get(key)?.abort(), this.#sessions.set(key, event.sessionId));
          return;
        }
        case `bem-turn-started`:
        case `bem-turn-completed`:
        case `bem-item-started`:
        case `bem-item-completed`:
        case `bem-item-presented`:
        case `bem-presentation-added`:
        case `real-delegation`:
        case `multi-agent-activity`:
        case `transport-lost`:
        case `host-disconnected`:
          return;
        case `session-ended`: {
          if (event.sessionId == null) return;
          let key = locatorKey(event.thread);
          if (this.#sessions.get(key) !== event.sessionId) return;
          (this.#sessions.delete(key), this.#pendingTitles.get(key)?.abort());
          let controller = new AbortControllerClass();
          (this.#pendingTitles.set(key, controller),
            this.#generateTitle(event.thread, controller).finally(() => {
              this.#pendingTitles.get(key) === controller && this.#pendingTitles.delete(key);
            }));
          return;
        }
      }
    }

    async #generateTitle(thread, controller) {
      let targetConnection = this.appServerConnectionRegistry.getMaybeConnection(thread.hostId);
      if (targetConnection == null) return;
      let { signal } = controller,
        disposables = new n.Wr(),
        releaseSourceLifetime = this.localConnection.captureRequestLifetime(),
        releaseTargetLifetime = targetConnection.captureRequestLifetime(),
        retired = !1,
        retire = () => {
          ((retired = !0), controller.abort());
        },
        assertTargetActive = () => {
          if (
            (releaseTargetLifetime(),
            this.appServerConnectionRegistry.getMaybeConnection(thread.hostId) !== targetConnection)
          )
            throw new DOMExceptionClass(`Voice title target retired`, `AbortError`);
        },
        assertSourceAndTargetActive = () => {
          if (
            (releaseSourceLifetime(),
            assertTargetActive(),
            retired ||
              this.appServerConnectionRegistry.getMaybeConnection(this.localConnection.hostId) !==
                this.localConnection)
          )
            throw new DOMExceptionClass(`Voice title source retired`, `AbortError`);
        },
        assertGenerationAllowed = () => {
          try {
            if (
              (assertSourceAndTargetActive(),
              signal.throwIfAborted(),
              this.evaluations.readReadyExecutionAssignments() == null)
            )
              throw new DOMExceptionClass(`Voice title policy unavailable`, `AbortError`);
          } catch (error) {
            throw (controller.abort(), error);
          }
        };

      disposables.add(
        this.appServerConnectionRegistry.subscribe((event) => {
          ((event.hostId === thread.hostId &&
            (event.type === `removed` || event.connection !== targetConnection)) ||
            (event.hostId === this.localConnection.hostId &&
              (event.type === `removed` || event.connection !== this.localConnection))) &&
            retire();
        }),
      );
      for (let connection of new Set([this.localConnection, targetConnection]))
        (disposables.add(connection.registerInternalAuthenticatedPrincipalChangeHandler(retire)),
          disposables.add(
            connection.registerInternalNotificationHandler((notification) => {
              notification.method === `account/updated` && retire();
            }),
          ));

      let guardedClient = {
        async startThread(request) {
          return (assertGenerationAllowed(), targetConnection.startThread(request, assertGenerationAllowed));
        },
        async forkThread(request) {
          return (assertGenerationAllowed(), targetConnection.forkThread(request, assertGenerationAllowed));
        },
        async startTurn(request) {
          return (
            assertGenerationAllowed(),
            targetConnection.startTurn(request, void 0, assertGenerationAllowed)
          );
        },
        async unsubscribeThread(request) {
          (assertTargetActive(),
            await targetConnection.sendAppServerRequest(
              `thread/unsubscribe`,
              { threadId: request },
              assertTargetActive,
            ));
        },
        async interruptTurn(request) {
          return (
            assertTargetActive(),
            targetConnection.sendAppServerRequest(`turn/interrupt`, request, assertTargetActive)
          );
        },
        registerInternalNotificationHandler:
          targetConnection.registerInternalNotificationHandler.bind(targetConnection),
      };

      try {
        if ((await this.evaluations.readExecutionAssignments()) == null) {
          controller.abort();
          return;
        }
        (assertGenerationAllowed(),
          disposables.add(
            this.evaluations.onDidChange(() => {
              this.evaluations.readReadyExecutionAssignments() ?? controller.abort();
            }),
          ));
        let generated = await n.a({
          model: (await loadModelAssignments(this.evaluations)).ephemeralGenerationModel,
          prompt: this.#prompt(`the most recent voice chat`),
          cwd: null,
          serviceTier: null,
          sourceThreadId: thread.conversationId,
          fallbackToFreshThread: !1,
          signal,
          appServerClient: guardedClient,
        });
        if (generated == null || signal.aborted) return;
        assertGenerationAllowed();
        let currentThread =
          (
            await targetConnection.sendAppServerRequest(
              `thread/read`,
              { threadId: thread.conversationId, includeTurns: !1 },
              assertGenerationAllowed,
            )
          ).thread ?? null;
        assertGenerationAllowed();
        let currentName = currentThread?.name?.trim() ?? ``;
        if (
          currentThread == null ||
          (currentName.length > 0 &&
            currentName !== `New voice chat` &&
            currentName !== `New Realtime Voice Chat`)
        )
          return;
        await targetConnection.updateThreadTitle(
          thread.conversationId,
          generated.title,
          generated.description,
          assertGenerationAllowed,
        );
      } catch (error) {
        try {
          assertGenerationAllowed();
        } catch {
          return;
        }
        this.logger.warning(`Failed to update realtime voice thread title`, {
          safe: {},
          sensitive: { error },
        });
      } finally {
        disposables.dispose();
      }
    }

    #prompt(subject) {
      return [
        `You are in a fork of a voice chat.`,
        `Generate a concise UI title (up to 36 characters) for ${subject} in the thread context above.`,
        `Focus only on the most recent conversation. Ignore older unrelated context and delegated work.`,
        `Use under 5 words where possible and write in the user's locale.`,
        `Fill the structured title field with plain text.`,
        `Fill the structured description field with a compact, search-oriented summary (up to 100 characters) of the recent topic.`,
        `Do not use a generic title such as Voice chat.`,
        `Do not include quotes, markdown, formatting characters, or trailing punctuation.`,
        `Do not respond to the user or do any other work; only fill the title and description fields.`,
      ].join(`\n`);
    }
  };
}

if (typeof module !== "undefined") {
  module.exports = { createRealtimeVoiceThreadTitleCoordinatorClass };
}
