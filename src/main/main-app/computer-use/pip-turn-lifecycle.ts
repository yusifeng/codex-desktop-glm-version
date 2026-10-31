export function isCompletedTurnNotification(notification: any): boolean {
  return (
    notification?.method === `turn/completed` &&
    typeof notification.params?.threadId === `string` &&
    typeof notification.params.turn === `object` &&
    notification.params.turn != null &&
    typeof notification.params.turn.id === `string`
  );
}

export function subscribeComputerUsePipTurnLifecycle({
  appServerConnection,
  closeActiveTurn,
  completePipThread = completeRemoteHostedPIPContentThread,
  invalidatePipTurn = invalidateRemoteHostedPIPContentTurn,
}: {
  appServerConnection: { registerInternalNotificationHandler(handler: (notification: any) => void): any };
  closeActiveTurn(turn: { sessionId: string; turnId: string }): unknown;
  completePipThread?(threadId: string): unknown;
  invalidatePipTurn?(threadId: string, turnId: string): unknown;
}) {
  return appServerConnection.registerInternalNotificationHandler((notification) => {
    if (!isCompletedTurnNotification(notification)) return;
    let { threadId, turn } = notification.params;
    turn.status === `completed`
      ? completePipThread(threadId)
      : invalidatePipTurn(threadId, turn.id);
    closeActiveTurn({ sessionId: threadId, turnId: turn.id });
  });
}
import {
  completeRemoteHostedPIPContentThread,
  invalidateRemoteHostedPIPContentTurn,
} from "../windows/native-app-icons";

