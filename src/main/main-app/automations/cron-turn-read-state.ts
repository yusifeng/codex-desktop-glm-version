// @ts-nocheck

/** Tracks one cron turn and marks it unread when its notification policy allows it. */
export function createCronTurnReadStatePreparer(dependencies: Record<string, any>) {
  const { runtime, createLogger, decideNotification } = dependencies;
  const completedAgentMessageSchema = runtime.wf({
    threadId: runtime.Of(),
    turnId: runtime.Of(),
    item: runtime.wf({ type: runtime.bf(`agentMessage`), text: runtime.Of() }),
  });
  const completedTurnSchema = runtime.wf({
    turn: runtime.wf({
      items: runtime
        .hf(runtime.wf({ type: runtime.Of(), text: runtime.Of().optional() }))
        .optional(),
    }),
  });
  const logger = createLogger(`cron-turn-read-state`);

  return function prepareCronTurnReadState({
    owner,
    appServerConnection,
    threadId,
    notificationPolicy,
  }: Record<string, any>) {
    let startedTurnId = null;
    let completed = false;
    let removeNotificationHandler;
    let removeConnectionStateHandler;
    let lastAgentMessage = null;

    const removeHandlers = () => {
      removeNotificationHandler?.();
      removeConnectionStateHandler?.();
    };
    const dispose = () => {
      removeHandlers();
      writer.dispose();
    };

    if (appServerConnection.getConnectionState() !== `connected`) return null;
    const writer = owner.openWriter(appServerConnection.hostId, dispose);

    removeConnectionStateHandler = appServerConnection.registerInternalConnectionStateHandler(
      (state: string) => {
        if (state !== `connected`) dispose();
      },
    );
    removeNotificationHandler = appServerConnection.registerInternalNotificationHandler(
      (notification: Record<string, any>, context: Record<string, any> | null) => {
        if (notification.params?.threadId !== threadId) return;
        if (
          notification.method === `thread/archived` ||
          notification.method === `thread/deleted`
        ) {
          dispose();
          return;
        }
        if (notification.method === `turn/started`) {
          startedTurnId = startedTurnId ?? runtime.tr(notification.params)?.id ?? null;
          return;
        }
        if (notification.method === `item/completed`) {
          const parsed = completedAgentMessageSchema.safeParse(notification.params);
          if (parsed.success) {
            lastAgentMessage = {
              turnId: parsed.data.turnId,
              text: parsed.data.item.text,
            };
          }
          return;
        }
        if (notification.method !== `turn/completed`) return;

        const turn = runtime.tr(notification.params);
        if (
          turn == null ||
          (context == null
            ? turn.id !== startedTurnId
            : context.automationKind !== `cron` ||
              context.threadId !== threadId ||
              context.turnId !== turn.id)
        ) {
          return;
        }
        completed = true;
        const parsed = completedTurnSchema.safeParse(notification.params);
        const finalAgentMessage = parsed.success
          ? parsed.data.turn.items?.findLast((item: Record<string, any>) =>
              item.type === `agentMessage`,
            )
          : undefined;
        const { decision } = decideNotification({
          automationKind: `cron`,
          notificationPolicy:
            context == null ? notificationPolicy : context.notificationPolicy,
          lastAgentMessage:
            finalAgentMessage?.text ??
            (lastAgentMessage?.turnId === turn.id ? lastAgentMessage.text : null),
          didCompleteSuccessfully: turn.status === `completed`,
        });

        removeHandlers();
        if (decision === `DONT_NOTIFY`) {
          dispose();
          return;
        }
        writer
          .set({
            hostId: appServerConnection.hostId,
            threadId: runtime.$u(threadId),
            hasUnreadTurn: true,
          })
          .catch((error: unknown) => {
            logger.warning(`Failed to save automation task unread state`, {
              safe: {},
              sensitive: { error },
            });
          })
          .finally(dispose);
      },
    );

    return {
      handleStartFailure: () => {
        if (startedTurnId == null && !completed) dispose();
      },
    };
  };
}

if (typeof module !== "undefined") {
  module.exports = { createCronTurnReadStatePreparer };
}
