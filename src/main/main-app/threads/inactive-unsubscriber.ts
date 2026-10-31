// @ts-nocheck
// Full inactive-owner lifecycle extracted from the original Dve owner.

import { $u as normalizeThreadId } from "@chunk/shared";
import {
  applyConversationTurns,
  completeHistoryTurns,
  conversationTurns,
  lastTurn,
} from "../turns/canonical-history";
import { pendingInteractionKind } from "./hydration";
import { isUnboundSteeringMessage } from "../turns/steering-merge";

const INACTIVE_OWNER_TTL_MS = 10_800_000;
const INACTIVE_RETRY_DELAY_MS = 15_000;
const MAX_INACTIVE_OWNER_THREADS = 10;

function isEphemeralSideConversation(conversation) {
  return conversation.ephemeral === true && conversation.sideConversation === true;
}

export class InactiveThreadUnsubscriber {
    params;
    inactiveOwnerConversationSinceById = new Map();
    inactiveOwnerConversationRetryAtById = new Map();
    keptLoadedConversationIds = new Set();
    unsubscribingConversationIds = new Set();
    pendingPassiveHydrations = new Set();
    cancelInactiveThreadUnsubscribe = null;
    inactiveThreadUnsubscribeNextCheckAtMs = null;
    cleanup = [];
    disposed = !1;
    constructor(e) {
      this.params = e;
      let { events: t } = this.params,
        r = t.addConversationStateCallback((e, t) => {
          if (t == null) {
            this.removeConversation(e);
            return;
          }
          this.handleConversationStateChanged(t);
        }),
        i = t.addStreamRoleStateCallback((e) => {
          this.handleStreamRoleChanged(e);
        }),
        a = t.addStreamFollowersChangedCallback((e) => {
          this.updateConversationInactivityTracking(e);
        }),
        o = t.addNotificationCallback(
          [`thread/started`, `thread/status/changed`, `turn/completed`, `serverRequest/resolved`],
          (e) => {
            let t = normalizeThreadId(e.method === `thread/started` ? e.params.thread.id : e.params.threadId);
            this.params.scheduleMicrotask(() => {
              this.releaseInactivePassiveConversation(t);
            });
          },
        );
      this.cleanup.push(r, i, a, o);
    }
    dispose() {
      ((this.disposed = !0), this.pendingPassiveHydrations.clear());
      for (let e of this.cleanup.splice(0)) e();
      this.clearInactiveThreadUnsubscribeTimeout();
    }
    handleConversationActivityChanged(e, t) {
      (this.params.logger.info(`thread_stream_view_activity_changed`, {
        safe: {
          conversationId: e,
          active: t,
          resumeState: this.params.threadStore.getConversation(e)?.resumeState ?? null,
          streamRole: this.params.streamState.getStreamRole(e)?.role ?? null,
        },
        sensitive: {},
      }),
        this.updateConversationInactivityTracking(e),
        t ||
          this.params.scheduleMicrotask(() => {
            this.releaseInactivePassiveConversation(e);
          }));
    }
    handleConversationStateChanged(e) {
      (this.updateConversationInactivityTracking(e.id, e),
        this.pendingPassiveHydrations.has(e.id) &&
          e.turnsPagination?.isLoadingOlder !== !0 &&
          (this.pendingPassiveHydrations.delete(e.id),
          this.params.scheduleMicrotask(() => {
            this.releaseInactivePassiveConversation(e.id);
          })));
    }
    handleStreamRoleChanged(e) {
      this.updateConversationInactivityTracking(e);
    }
    updateConversationInactivityTracking(e, t = this.params.threadStore.getConversation(e)) {
      let n = this.params.streamState.getStreamRole(e),
        r = this.hasActiveConversationView(e);
      if (
        t != null &&
        this.params.streamState.ownsConversationHistoryStream(e) &&
        t.resumeState === `resumed` &&
        !r &&
        !this.hasOwnedStreamFollowers(e)
      ) {
        let n = this.inactiveOwnerConversationSinceById.get(e) ?? null,
          r = this.shouldKeepConversationLoaded(t),
          i = this.keptLoadedConversationIds.has(e);
        r ? this.keptLoadedConversationIds.add(e) : this.keptLoadedConversationIds.delete(e);
        let a = n == null || (i && !r) ? this.params.now() : n;
        (this.inactiveOwnerConversationSinceById.set(e, a),
          n ??
            this.params.logger.debug(`inactive_thread_inactivity_tracking_enabled`, {
              safe: {
                conversationId: e,
                inactiveSinceMs: a,
                lastTurnStatus: lastTurn(t)?.status ?? null,
              },
              sensitive: {},
            }));
      } else {
        let i = this.inactiveOwnerConversationSinceById.delete(e);
        if (
          (this.inactiveOwnerConversationRetryAtById.delete(e),
          this.keptLoadedConversationIds.delete(e),
          !i)
        )
          return;
        this.params.logger.debug(`inactive_thread_inactivity_tracking_cleared`, {
          safe: {
            conversationId: e,
            hasActiveView: r,
            resumeState: t?.resumeState ?? null,
            streamRole: n?.role ?? null,
          },
          sensitive: {},
        });
      }
      this.scheduleInactiveThreadUnsubscribeCheck();
    }
    clearConversationStreamOwnership(e) {
      (this.params.streamState.removeConversation(e), this.updateConversationInactivityTracking(e));
    }
    releaseInactivePassiveConversation(e) {
      if (this.disposed) return;
      let t = this.params.threadStore.getConversation(e),
        n = t?.turnsPagination;
      if (!(
        t == null ||
        t.resumeState === `resuming` ||
        (t.resumeState === `needs_resume` &&
          (n?.hasLoadedOldest !== !1 || n.olderCursor != null || n.oldestLoadedTurnId != null)) ||
        this.params.streamState.getStreamRole(e) != null ||
        this.hasActiveConversationView(e) ||
        isEphemeralSideConversation(t) ||
        t.requests.length > 0 ||
        this.shouldKeepConversationLoaded(t) ||
        !conversationTurns(t).some((e) => e.items.some((e) => e.type !== `forkedFromConversation`))
      )) {
        if (t.turnsPagination?.isLoadingOlder === !0) {
          this.pendingPassiveHydrations.add(e);
          return;
        }
        this.params.threadStore.updateConversationState(e, (e) => {
          (applyConversationTurns(e, [], !1),
            (e.turnsPagination = {
              olderCursor: null,
              oldestLoadedTurnId: null,
              isLoadingOlder: !1,
              hasLoadedOldest: !1,
            }),
            (e.resumeState = `needs_resume`));
        });
      }
    }
    removeConversation(e) {
      (this.pendingPassiveHydrations.delete(e),
        this.params.threadStore.removeConversationInterests(e),
        this.inactiveOwnerConversationSinceById.delete(e),
        this.inactiveOwnerConversationRetryAtById.delete(e),
        this.keptLoadedConversationIds.delete(e),
        this.unsubscribingConversationIds.delete(e),
        this.params.streamState.removeConversation(e),
        this.scheduleInactiveThreadUnsubscribeCheck());
    }
    scheduleInactiveThreadUnsubscribeCheck() {
      if (this.disposed) return;
      let e = this.params.now(),
        t = this.getInactiveOwnerConversationIdsToUnsubscribe(e);
      if (t.length > 0) {
        (this.clearInactiveThreadUnsubscribeTimeout(),
          this.params.logger.debug(`inactive_thread_unsubscribe_check_ready`, {
            safe: {
              conversationIdsToUnsubscribe: t,
              trackedConversationCount: this.inactiveOwnerConversationSinceById.size,
            },
            sensitive: {},
          }),
          (this.cancelInactiveThreadUnsubscribe = this.params.schedule(() => {
            ((this.cancelInactiveThreadUnsubscribe = null),
              Promise.all(
                t.map((e) => this.unsubscribeInactiveConversation(e).catch(() => void 0)),
              ).finally(() => {
                this.scheduleInactiveThreadUnsubscribeCheck();
              }));
          }, 0)));
        return;
      }
      let n = this.getNextCheckAtMs(e);
      if (n == null) {
        this.clearInactiveThreadUnsubscribeTimeout();
        return;
      }
      if (
        this.cancelInactiveThreadUnsubscribe != null &&
        this.inactiveThreadUnsubscribeNextCheckAtMs === n
      )
        return;
      this.clearInactiveThreadUnsubscribeTimeout();
      let r = Math.max(n - e, 0);
      ((this.inactiveThreadUnsubscribeNextCheckAtMs = n),
        (this.cancelInactiveThreadUnsubscribe = this.params.schedule(() => {
          ((this.cancelInactiveThreadUnsubscribe = null),
            (this.inactiveThreadUnsubscribeNextCheckAtMs = null),
            this.scheduleInactiveThreadUnsubscribeCheck());
        }, r)),
        this.params.logger.debug(`inactive_thread_unsubscribe_check_scheduled`, {
          safe: {
            delayMs: r,
            nextCheckAtMs: n,
            trackedConversationCount: this.inactiveOwnerConversationSinceById.size,
          },
          sensitive: {},
        }));
    }
    clearInactiveThreadUnsubscribeTimeout() {
      (this.cancelInactiveThreadUnsubscribe != null && this.cancelInactiveThreadUnsubscribe(),
        (this.cancelInactiveThreadUnsubscribe = null),
        (this.inactiveThreadUnsubscribeNextCheckAtMs = null));
    }
    getNextCheckAtMs(e) {
      let t = null;
      for (let [n, r] of this.inactiveOwnerConversationSinceById.entries()) {
        let i = this.params.threadStore.getConversation(n);
        if (
          i?.resumeState !== `resumed` ||
          !this.params.streamState.ownsConversationHistoryStream(n) ||
          this.hasActiveConversationView(n) ||
          this.hasOwnedStreamFollowers(n) ||
          this.unsubscribingConversationIds.has(n) ||
          this.shouldKeepConversationLoaded(i)
        )
          continue;
        let a = this.inactiveOwnerConversationRetryAtById.get(n) ?? null;
        if (a != null && a > e) {
          (t == null || a < t) && (t = a);
          continue;
        }
        let o = r + INACTIVE_OWNER_TTL_MS;
        (t == null || o < t) && (t = o);
      }
      return t;
    }
    getInactiveOwnerConversationIdsToUnsubscribe(e) {
      let t = [];
      for (let [n, r] of this.inactiveOwnerConversationSinceById.entries()) {
        if (this.unsubscribingConversationIds.has(n)) continue;
        let i = this.params.threadStore.getConversation(n);
        if (
          i?.resumeState !== `resumed` ||
          !this.params.streamState.ownsConversationHistoryStream(n) ||
          this.hasActiveConversationView(n) ||
          this.hasOwnedStreamFollowers(n) ||
          this.shouldKeepConversationLoaded(i)
        )
          continue;
        let a = this.inactiveOwnerConversationRetryAtById.get(n) ?? null;
        (a != null && a > e) ||
          t.push({
            conversationId: n,
            inactiveSinceMs: r,
            isEphemeralSideConversation: isEphemeralSideConversation(i),
            ttlExpired: e - r >= INACTIVE_OWNER_TTL_MS,
          });
      }
      t.sort((e, t) => e.inactiveSinceMs - t.inactiveSinceMs);
      let n = t.filter((e) => !e.isEphemeralSideConversation),
        r = Math.max(0, n.length - MAX_INACTIVE_OWNER_THREADS),
        i = new Set(n.slice(0, r)),
        a = t.filter((e) => e.ttlExpired || i.has(e)).map((e) => e.conversationId);
      return (
        a.length > 0 &&
          this.params.logger.debug(`inactive_thread_unsubscribe_candidates_evaluated`, {
            safe: {
              candidateCount: t.length,
              conversationIdsToUnsubscribe: a,
              maxInactiveOwnerThreads: MAX_INACTIVE_OWNER_THREADS,
              overage: r,
              ttlMs: INACTIVE_OWNER_TTL_MS,
            },
            sensitive: {},
          }),
        a
      );
    }
    shouldKeepConversationLoaded(e) {
      return this.params.streamState.getStreamRole(e.id)?.role === `follower`
        ? !1
        : (e.rolloutPath.length === 0 && completeHistoryTurns(e)?.length === 0) ||
            e.threadRuntimeStatus?.type === `active` ||
            (lastTurn(e)?.status === `inProgress` && (pendingInteractionKind(e, this.params.parseUrl) == null || isEphemeralSideConversation(e))) ||
            conversationTurns(e).some((e) => e.items.some(isUnboundSteeringMessage));
    }
    async unsubscribeInactiveConversation(e) {
      if (this.unsubscribingConversationIds.has(e)) return;
      let t = this.params.threadStore.getConversation(e),
        n = this.params.streamState.getStreamRole(e)?.role ?? null;
      if (
        t?.resumeState !== `resumed` ||
        !this.params.streamState.ownsConversationHistoryStream(e)
      ) {
        this.params.logger.debug(`inactive_thread_unsubscribe_skipped`, {
          safe: { conversationId: e, resumeState: t?.resumeState ?? null, streamRole: n },
          sensitive: {},
        });
        return;
      }
      (this.unsubscribingConversationIds.add(e),
        this.params.logger.debug(`inactive_thread_unsubscribe_started`, {
          safe: {
            conversationId: e,
            inactiveSinceMs: this.inactiveOwnerConversationSinceById.get(e) ?? null,
          },
          sensitive: {},
        }));
      try {
        let t = await this.params.requestClient.sendRequest(`thread/unsubscribe`, { threadId: e }),
          n = this.params.threadStore.getConversation(e);
        (this.params.logger.info(`inactive_thread_unsubscribed`, {
          safe: { conversationId: e, status: t.status },
          sensitive: {},
        }),
          this.inactiveOwnerConversationRetryAtById.delete(e));
        let r = n != null && isEphemeralSideConversation(n);
        if (n != null && (r || n.resumeState !== `needs_resume`)) {
          let t = r ? { type: `notLoaded` } : this.getThreadRuntimeStatusAfterUnsubscribe(n),
            i =
              !r &&
              !this.hasActiveConversationView(e) &&
              !this.hasOwnedStreamFollowers(e) &&
              !this.shouldKeepConversationLoaded(n);
          this.params.threadStore.updateConversationState(e, (e) => {
            (i &&
              (applyConversationTurns(e, [], !1),
              (e.turnsPagination = {
                olderCursor: null,
                oldestLoadedTurnId: null,
                isLoadingOlder: !1,
                hasLoadedOldest: !1,
              })),
              (e.resumeState = `needs_resume`),
              (e.threadRuntimeStatus = t));
          });
        }
        (this.params.beforePassiveRelease?.(e), this.clearConversationStreamOwnership(e));
      } catch (t) {
        let n = this.params.now() + INACTIVE_RETRY_DELAY_MS;
        (this.inactiveOwnerConversationRetryAtById.set(e, n),
          this.params.logger.warning(`inactive_thread_unsubscribe_failed`, {
            safe: { conversationId: e, retryAtMs: n },
            sensitive: { error: t },
          }));
      } finally {
        (this.unsubscribingConversationIds.delete(e), this.updateConversationInactivityTracking(e));
      }
    }
    getThreadRuntimeStatusAfterUnsubscribe(e) {
      switch (pendingInteractionKind(e, this.params.parseUrl)) {
        case `approval`:
        case `mcpServerElicitation`:
        case `permissionRequest`:
          return { type: `active`, activeFlags: [`waitingOnApproval`] };
        case `userInput`:
        case `optionPicker`:
        case `setupCodexStep`:
          return { type: `active`, activeFlags: [`waitingOnUserInput`] };
        case `implementPlan`:
        case void 0:
        case null:
          return { type: `idle` };
      }
    }
    hasActiveConversationView(e) {
      return this.params.threadStore.isConversationActive(e);
    }
    hasOwnedStreamFollowers(e) {
      return (
        this.params.streamState.getStreamRole(e)?.role === `owner` &&
        this.params.streamState.hasFollowersOrPendingFollowerReconnect(e)
      );
    }
  }

export { InactiveThreadUnsubscriber as Dve };
