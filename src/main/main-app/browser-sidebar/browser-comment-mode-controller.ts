// @ts-nocheck

/** Owns comment-mode entry and interaction-mode transitions for browser pages. */
export function createBrowserCommentModeControllerClass(dependencies: Record<string, any>) {
  const { EU, cW, yVe, tq, n } = dependencies;

  return class BrowserCommentModeController {
    constructor(host: any) {
      this.host = host;
    }

    host: any;

    setInteractionMode(e: any, t: any, r: any, i: any, a: any) {
      const o = this.host.ensureThreadCommandContext(e, t, i);
      if (o == null) return;
      const { threadState: s, windowState: c } = o;
      if (s.pendingWindowTransfer === true || (r === `comment` && !s.isAnnotationModeEnabled)) return;
      if (r !== `comment`) {
        if (s.snapshot.interactionMode === r && s.pendingCommentModeActivation == null) return;
        s.pendingCommentModeActivation = null;
        s.snapshot = EU(s.snapshot, r);
        this.host.comments.dismiss(e, t, s.browserTabId, s);
        this.host.syncThreadState(c, t, s);
        if (s.page != null) this.host.syncRuntimeStateToPage(s.page, s);
        this.host.comments.prepare(e, t, s.browserTabId, s);
        return;
      }
      this.requestCommentMode(
        c,
        t,
        s,
        n.gu.BATCH,
        a ?? null,
        a === `keyboard-shortcut` ? { kind: `text` } : void 0,
      );
    }

    startCommentAtPoint(e: any, t: any, r: any, i: any, a: any, o: any) {
      const s = this.host.getThreadState(e, t.conversationId, t.browserTabId);
      if (s == null) return;
      const c = this.host.ensureCurrentWindowState(e);
      if (c == null) return;
      const l =
        n.Du(i).persistent &&
        this.host.isTweaksFeatureEnabled &&
        s.snapshot.annotationEditorMode === `design` &&
        n.Au(s.snapshot.comments);
      this.requestCommentMode(
        c,
        t.conversationId,
        s,
        i,
        a,
        o
          ? { kind: `text`, fallbackViewportPoint: r }
          : { kind: l ? `design` : `comment`, viewportPoint: r },
      );
    }

    startDesignEditAtPoint(e: any, t: any, r: any) {
      if (!this.host.isTweaksFeatureEnabled) return;
      const i = this.host.getThreadState(e, t.conversationId, t.browserTabId);
      if (i == null) return;
      const a = this.host.ensureCurrentWindowState(e);
      if (a != null) {
        this.requestCommentMode(a, t.conversationId, i, n.gu.BATCH, null, {
          kind: `design`,
          viewportPoint: r,
        });
      }
    }

    requestCommentMode(e: any, t: any, r: any, i: any, a: any, o: any) {
      if (!r.isAnnotationModeEnabled || r.pendingWindowTransfer === true) return;
      const s = cW(r);
      if (s.length === 0) return;
      const c = n.Du(i);
      const l = this.host.commentModeBlocklistLookup.cachedCommentModeBlocked(s);
      if (l === true) {
        this.host.refreshCommentModeBlockStatus(e, r);
        return;
      }
      if (l === false) {
        r.pendingCommentModeActivation = null;
        if (r.snapshot.interactionMode !== `comment` || r.snapshot.annotationFlow !== i) {
          r.snapshot = {
            ...EU(r.snapshot, `comment`),
            annotationFlow: i,
            annotationModeEntrySource: a ?? null,
            isTweaksEditorOpen: c.persistent && yVe(r.snapshot, this.host.isTweaksFeatureEnabled),
          };
          this.host.syncThreadState(e, t, r);
          if (r.page != null) this.host.syncRuntimeStateToPage(r.page, r);
          this.host.comments.prepare(e.owner, t, r.browserTabId, r);
        }
        if (o != null && r.page != null) tq(r.page, o);
        return;
      }
      r.pendingCommentModeActivation = {
        annotationFlow: i,
        annotationModeEntrySource: a ?? null,
        url: s,
        navigationVersion: r.page?.navigationVersion ?? null,
        request: o ?? null,
      };
      this.host.refreshCommentModeBlockStatus(e, r);
    }

    refreshCommentModeBlockStatus(windowState: any, threadState: any) {
      const applyResult = (result: any) => {
        if (!result.changed && result.request == null) return;
        if (result.changed) {
          this.host.syncThreadState(windowState, threadState.conversationId, threadState);
          if (result.shouldSyncRuntime && threadState.page != null) {
            this.host.syncRuntimeStateToPage(threadState.page, threadState);
          }
        }
        if (result.shouldPrepareComments) {
          this.host.comments.prepare(
            windowState.owner,
            threadState.conversationId,
            threadState.browserTabId,
            threadState,
          );
        }
        if (result.request != null && threadState.page != null) tq(threadState.page, result.request);
      };
      const reconcile = (blocked: boolean) => {
        let changed = false;
        let request = null;
        let shouldPrepareComments = false;
        let shouldSyncRuntime = false;
        const disabledReason = blocked ? `site-blocked` : null;
        if (threadState.snapshot.commentModeDisabledReason !== disabledReason) {
          threadState.snapshot = {
            ...threadState.snapshot,
            commentModeDisabledReason: disabledReason,
          };
          changed = true;
        }
        if (blocked) {
          if (threadState.pendingCommentModeActivation != null) {
            threadState.pendingCommentModeActivation = null;
          }
          if (threadState.snapshot.interactionMode === `comment`) {
            threadState.snapshot = EU(threadState.snapshot, `browse`);
            this.host.comments.dismiss(
              windowState.owner,
              threadState.conversationId,
              threadState.browserTabId,
              threadState,
            );
            changed = true;
            shouldSyncRuntime = true;
          }
          return { changed, request, shouldPrepareComments, shouldSyncRuntime };
        }
        if (threadState.pendingCommentModeActivation != null) {
          const pending = threadState.pendingCommentModeActivation;
          request = pending.request;
          threadState.pendingCommentModeActivation = null;
          if (
            threadState.snapshot.interactionMode !== `comment` ||
            threadState.snapshot.annotationFlow !== pending.annotationFlow
          ) {
            threadState.snapshot = {
              ...EU(threadState.snapshot, `comment`),
              annotationFlow: pending.annotationFlow,
              annotationModeEntrySource: pending.annotationModeEntrySource,
            };
            changed = true;
            shouldPrepareComments = true;
            shouldSyncRuntime = true;
          }
        }
        return { changed, request, shouldPrepareComments, shouldSyncRuntime };
      };
      const finishRequest = (requestId: number, url: string, blocked: boolean) => {
        if (threadState.commentModeBlockCheckRequestId !== requestId) return;
        threadState.commentModeBlockCheckUrl = null;
        if (cW(threadState) === url) applyResult(reconcile(blocked));
      };

      const url = cW(threadState);
      if (
        threadState.pendingCommentModeActivation != null &&
        (threadState.pendingCommentModeActivation.url !== url ||
          threadState.pendingCommentModeActivation.navigationVersion !==
            (threadState.page?.navigationVersion ?? null))
      ) {
        threadState.pendingCommentModeActivation = {
          ...threadState.pendingCommentModeActivation,
          request: null,
          url,
          navigationVersion: threadState.page?.navigationVersion ?? null,
        };
      }
      const cached = this.host.commentModeBlocklistLookup.cachedCommentModeBlocked(url);
      if (cached != null) {
        applyResult(reconcile(cached));
        return;
      }
      if (threadState.commentModeBlockCheckUrl === url) return;
      if (
        threadState.snapshot.commentModeDisabledReason != null &&
        threadState.snapshot.url !== url
      ) {
        threadState.snapshot = { ...threadState.snapshot, commentModeDisabledReason: null };
      }
      threadState.commentModeBlockCheckUrl = url;
      const requestId = ++threadState.commentModeBlockCheckRequestId;
      this.host.commentModeBlocklistLookup
        .isCommentModeBlocked(url)
        .then((blocked: boolean) => finishRequest(requestId, url, blocked));
    }
  };
}
