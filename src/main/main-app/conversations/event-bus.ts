// @ts-nocheck

type Dispose = () => void;
type Listener = (...args: any[]) => void;
type ListenerField = keyof Ah;

interface Logger {
  warning(
    message: string,
    details: { safe: Record<string, unknown>; sensitive: Record<string, unknown> },
  ): void;
}

interface TurnStartRequest {
  isCurrent(): boolean;
}

interface TurnStartObservation {
  isCurrent(): boolean;
  onAccepted(value: unknown): void;
  onCompleted(value: unknown): void;
  dispose(): void;
}

interface TurnStartListenerState {
  listener: (request: any) => any;
  active: boolean;
  pending: Set<Dispose>;
}

function addListener(owner: Ah, field: ListenerField, listener: Listener): Dispose {
  owner[field].push(listener);
  return () => {
    owner[field] = owner[field].filter((candidate: Listener) => candidate !== listener);
  };
}

function emitListeners(owner: Ah, field: ListenerField, ...args: unknown[]): void {
  for (const listener of owner[field]) listener(...args);
}

export class Ah {
  turnStartRequestedListeners: TurnStartListenerState[] = [];
  addTurnStartRequestedListener(listener: TurnStartListenerState["listener"]): Dispose {
    const state = { listener, active: true, pending: new Set<Dispose>() };
    this.turnStartRequestedListeners.push(state);
    return () => {
      state.active = false;
      this.turnStartRequestedListeners = this.turnStartRequestedListeners.filter(
        (candidate) => candidate !== state,
      );
      for (const dispose of state.pending) dispose();
    };
  }
  captureTurnStart(
    request: any,
    capture: (observation: TurnStartObservation) => Dispose,
    logger: Logger,
  ): void {
    for (const state of this.turnStartRequestedListeners) {
      if (!request.isCurrent()) break;
      if (!state.active) continue;
      try {
        const observation = state.listener(request);
        if (observation == null) continue;
        let disposedDuringCapture = false;
        let disposeCapture: Dispose | null = null;
        disposeCapture = capture({
          isCurrent: () => state.active && observation.isCurrent(),
          onAccepted: (value) => observation.onAccepted(value),
          onCompleted: (value) => observation.onCompleted(value),
          dispose: () => {
            disposedDuringCapture = true;
            if (disposeCapture != null) state.pending.delete(disposeCapture);
            observation.dispose();
          },
        });
        if (!disposedDuringCapture) {
          state.pending.add(disposeCapture);
          if (!state.active) disposeCapture();
        }
      } catch (error) {
        logger.warning("Turn start observer capture failed", {
          safe: {},
          sensitive: { error },
        });
      }
    }
  }

  queuedMessageExecutionListeners: Listener[] = [];
  addQueuedMessageExecutionListener(listener: Listener): Dispose {
    return addListener(this, "queuedMessageExecutionListeners", listener);
  }
  emitQueuedMessageExecution(value: unknown): void {
    emitListeners(this, "queuedMessageExecutionListeners", value);
  }
  initialTitleListeners: Listener[] = [];
  addInitialTitleRequestedListener(listener: Listener): Dispose {
    return addListener(this, "initialTitleListeners", listener);
  }
  emitInitialTitleRequested(value: unknown): void {
    emitListeners(this, "initialTitleListeners", value);
  }
  acceptedHistoryListeners: Listener[] = [];
  addAcceptedHistoryListener(listener: Listener): Dispose {
    return addListener(this, "acceptedHistoryListeners", listener);
  }
  emitAcceptedHistory(conversationId: unknown, history: unknown): void {
    emitListeners(this, "acceptedHistoryListeners", conversationId, history);
  }

  conversationCallbacks = new Map<string, Listener[]>();
  conversationRemovedListeners: Listener[] = [];
  conversationStateCallbacks: Listener[] = [];
  conversationPatchListeners: Listener[] = [];
  streamRoleCallbacks = new Map<string, Listener[]>();
  streamRoleStateCallbacks: Listener[] = [];
  streamFollowersChangedCallbacks: Listener[] = [];
  anyConversationCallbacks: Listener[] = [];
  anyConversationMetaCallbacks: Listener[] = [];
  threadSummariesCallbacks: Listener[] = [];
  threadListInvalidatedListeners: Listener[] = [];
  openFileChangeListeners: Listener[] = [];
  turnCompletedListeners: Listener[] = [];
  turnInterruptStartedListeners: Listener[] = [];
  turnSteeredListeners: Listener[] = [];
  approvalRequestListeners: Listener[] = [];
  realtimeThreadCreatedListeners: Listener[] = [];
  realtimeHandoffAttributedListeners: Listener[] = [];
  approvalResolvedListeners: Listener[] = [];
  userInputRequestListeners: Listener[] = [];
  threadArchivedListeners: Listener[] = [];
  threadUnarchivedListeners: Listener[] = [];
  threadDeletedListeners: Listener[] = [];
  notificationCallbacks = new Map<string, { notify: Listener }[]>();

  addStreamRoleCallback(streamId: string, listener: Listener): Dispose {
    const listeners = this.streamRoleCallbacks.get(streamId) ?? [];
    this.streamRoleCallbacks.set(streamId, [...listeners, listener]);
    return () => {
      const current = this.streamRoleCallbacks.get(streamId);
      if (current != null)
        this.streamRoleCallbacks.set(
          streamId,
          current.filter((candidate) => candidate !== listener),
        );
    };
  }
  addAnyConversationCallback(listener: Listener): Dispose {
    return addListener(this, "anyConversationCallbacks", listener);
  }
  addAnyConversationMetaCallback(listener: Listener): Dispose {
    return addListener(this, "anyConversationMetaCallbacks", listener);
  }
  addThreadSummariesCallback(listener: Listener): Dispose {
    return addListener(this, "threadSummariesCallbacks", listener);
  }
  addThreadListInvalidatedListener(listener: Listener): Dispose {
    return addListener(this, "threadListInvalidatedListeners", listener);
  }
  addOpenFileChangeListener(listener: Listener): Dispose {
    return addListener(this, "openFileChangeListeners", listener);
  }
  addTurnCompletedListener(listener: Listener): Dispose {
    return addListener(this, "turnCompletedListeners", listener);
  }
  addTurnInterruptStartedListener(listener: Listener): Dispose {
    return addListener(this, "turnInterruptStartedListeners", listener);
  }
  addTurnSteeredListener(listener: Listener): Dispose {
    return addListener(this, "turnSteeredListeners", listener);
  }
  addApprovalRequestListener(listener: Listener): Dispose {
    return addListener(this, "approvalRequestListeners", listener);
  }
  addRealtimeThreadCreatedListener(listener: Listener): Dispose {
    return addListener(this, "realtimeThreadCreatedListeners", listener);
  }
  addRealtimeHandoffAttributedListener(listener: Listener): Dispose {
    return addListener(this, "realtimeHandoffAttributedListeners", listener);
  }
  addApprovalResolvedListener(listener: Listener): Dispose {
    return addListener(this, "approvalResolvedListeners", listener);
  }
  addUserInputRequestListener(listener: Listener): Dispose {
    return addListener(this, "userInputRequestListeners", listener);
  }
  addThreadArchivedListener(listener: Listener): Dispose {
    return addListener(this, "threadArchivedListeners", listener);
  }
  addThreadUnarchivedListener(listener: Listener): Dispose {
    return addListener(this, "threadUnarchivedListeners", listener);
  }
  addThreadDeletedListener(listener: Listener): Dispose {
    return addListener(this, "threadDeletedListeners", listener);
  }
  addConversationCallback(conversationId: string, listener: Listener): Dispose {
    const listeners = this.conversationCallbacks.get(conversationId) ?? [];
    this.conversationCallbacks.set(conversationId, [...listeners, listener]);
    return () => {
      const current = this.conversationCallbacks.get(conversationId);
      if (current != null)
        this.conversationCallbacks.set(
          conversationId,
          current.filter((candidate) => candidate !== listener),
        );
    };
  }
  addConversationRemovedListener(listener: Listener): Dispose {
    return addListener(this, "conversationRemovedListeners", listener);
  }
  addConversationStateCallback(listener: Listener): Dispose {
    return addListener(this, "conversationStateCallbacks", listener);
  }
  addConversationPatchesListener(listener: Listener): Dispose {
    return addListener(this, "conversationPatchListeners", listener);
  }
  addStreamRoleStateCallback(listener: Listener): Dispose {
    return addListener(this, "streamRoleStateCallbacks", listener);
  }
  addStreamFollowersChangedCallback(listener: Listener): Dispose {
    return addListener(this, "streamFollowersChangedCallbacks", listener);
  }
  addNotificationCallback(methods: string | string[], notify: Listener): Dispose {
    const methodList = Array.isArray(methods) ? methods : [methods];
    const callback = { notify };
    for (const method of methodList) {
      const callbacks = this.notificationCallbacks.get(method) ?? [];
      this.notificationCallbacks.set(method, [...callbacks, callback]);
    }
    return () => {
      for (const method of methodList) {
        const callbacks = this.notificationCallbacks.get(method);
        if (callbacks != null)
          this.notificationCallbacks.set(
            method,
            callbacks.filter((candidate) => candidate !== callback),
          );
      }
    };
  }

  emitConversation(conversationId: string, conversation: unknown, context: unknown): void {
    emitListeners(this, "conversationStateCallbacks", conversationId, conversation, context);
    for (const callback of this.conversationCallbacks.get(conversationId) ?? []) {
      callback(conversation);
    }
  }
  emitConversationRemoved(conversationId: string): void {
    this.conversationCallbacks.delete(conversationId);
    emitListeners(this, "conversationRemovedListeners", conversationId);
    emitListeners(this, "conversationStateCallbacks", conversationId, null, { type: "fullReset" });
  }
  emitConversationPatches(conversationId: unknown, patches: unknown, context: unknown): void {
    emitListeners(this, "conversationPatchListeners", conversationId, patches, context);
  }
  emitStreamRole(streamId: string, role: unknown): void {
    for (const callback of this.streamRoleCallbacks.get(streamId) ?? []) callback(role);
    emitListeners(this, "streamRoleStateCallbacks", streamId, role);
  }
  emitStreamFollowersChanged(value: unknown): void {
    emitListeners(this, "streamFollowersChangedCallbacks", value);
  }
  deleteStreamRoleCallbacks(streamId: string): void {
    this.streamRoleCallbacks.delete(streamId);
  }
  emitAnyConversations(value: unknown): void {
    emitListeners(this, "anyConversationCallbacks", value);
  }
  emitAnyConversationMeta(value: unknown): void {
    emitListeners(this, "anyConversationMetaCallbacks", value);
  }
  emitThreadSummaries(value: unknown): void {
    emitListeners(this, "threadSummariesCallbacks", value);
  }
  emitThreadListInvalidated(): void {
    emitListeners(this, "threadListInvalidatedListeners");
  }
  emitOpenFileChange(value: unknown): void {
    emitListeners(this, "openFileChangeListeners", value);
  }
  emitTurnCompleted(value: unknown): void {
    emitListeners(this, "turnCompletedListeners", value);
  }
  emitTurnInterruptStarted(value: unknown): void {
    emitListeners(this, "turnInterruptStartedListeners", value);
  }
  emitTurnSteered(value: unknown): void {
    emitListeners(this, "turnSteeredListeners", value);
  }
  emitApprovalRequest(value: unknown): void {
    emitListeners(this, "approvalRequestListeners", value);
  }
  emitRealtimeThreadCreated(value: unknown): void {
    emitListeners(this, "realtimeThreadCreatedListeners", value);
  }
  emitRealtimeHandoffAttributed(value: unknown): void {
    emitListeners(this, "realtimeHandoffAttributedListeners", value);
  }
  emitApprovalResolved(value: unknown): void {
    emitListeners(this, "approvalResolvedListeners", value);
  }
  emitUserInputRequest(value: unknown): void {
    emitListeners(this, "userInputRequestListeners", value);
  }
  emitThreadArchived(value: unknown): void {
    emitListeners(this, "threadArchivedListeners", value);
  }
  emitThreadUnarchived(value: unknown): void {
    emitListeners(this, "threadUnarchivedListeners", value);
  }
  emitThreadDeleted(value: unknown): void {
    emitListeners(this, "threadDeletedListeners", value);
  }
  emitNotification(notification: { method: string }): void {
    for (const callback of this.notificationCallbacks.get(notification.method) ?? []) {
      callback.notify(notification);
    }
  }
}

export const ConversationEventBus = Ah;
