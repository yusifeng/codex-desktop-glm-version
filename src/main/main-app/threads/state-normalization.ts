// conversation 状态规范化（IPC/快照入口共用）。
//
// 原版 main-C-Mhak1n.ts 32,391-32,446。app-server/IPC 侧传来的 conversation
// 状态可能带 Date 对象或字符串时间戳、缺省 hostId/turnsPagination/
// workspaceKind——进入存储前统一规范化：
//   - B_：时间戳强制为有限 number（Date→getTime、数字串→Number、日期串→
//     Date.parse，其余 null）；
//   - z_：turn 上的 4 个时间字段规范化 + durationMs 默认 null；
//   - Jge：conversation 整体规范化（canonical history 的 entitiesByKey
//     逐实体过 z_；legacy turns 同样）；
//   - R_：补默认（hostId、turnsPagination、workspaceKind='project'）。

import { defaultTurnsPagination } from "../turns/history-requests";
import type { AnyTurn, ConversationLike } from "../turns/canonical-history";

/** 时间戳强制（原版 B_）。 */
export function coerceTimestamp(value: unknown): number | null {
  if (value instanceof Date) {
    let time = value.getTime();
    return Number.isFinite(time) ? time : null;
  }
  if (typeof value == `number`) return Number.isFinite(value) ? value : null;
  if (typeof value == `string`) {
    let asNumber = Number(value);
    if (Number.isFinite(asNumber)) return asNumber;
    let asDate = Date.parse(value);
    return Number.isFinite(asDate) ? asDate : null;
  }
  return null;
}

/** turn 规范化（原版 z_）。 */
export function normalizeTurn<T extends AnyTurn>(turn: T): T {
  return {
    ...turn,
    turnStartedAtMs: coerceTimestamp((turn as any).turnStartedAtMs),
    durationMs: (turn as any).durationMs ?? null,
    firstTurnWorkItemStartedAtMs: coerceTimestamp((turn as any).firstTurnWorkItemStartedAtMs),
    finalAssistantStartedAtMs: coerceTimestamp((turn as any).finalAssistantStartedAtMs),
    commandExecutionStartedAtMsById: (turn as any).commandExecutionStartedAtMsById ?? void 0,
  } as T;
}

/** conversation 状态规范化（原版 Jge）：时间戳强制 + 标题默认 null。 */
export function normalizeConversationState<T extends Record<string, any>>(
  state: T,
  hostId: string,
): T & ConversationLike {
  let normalized = {
    ...state,
    createdAt: coerceTimestamp(state.createdAt) ?? Date.now(),
    updatedAt: coerceTimestamp(state.updatedAt) ?? coerceTimestamp(state.createdAt) ?? Date.now(),
    recencyAt:
      coerceTimestamp(state.recencyAt) ?? coerceTimestamp(state.updatedAt) ?? coerceTimestamp(state.createdAt) ?? Date.now(),
    title: state.title ?? null,
    turns: (state.turns ?? []).map(normalizeTurn),
  };
  if (state.turnHistory?.kind === `canonical`)
    (normalized as any).turnHistory = {
      ...state.turnHistory,
      history: {
        ...state.turnHistory.history,
        entitiesByKey: Object.fromEntries(
          Object.entries(state.turnHistory.history.entitiesByKey).map(([key, turn]) => [
            key,
            normalizeTurn(turn as AnyTurn),
          ]),
        ),
      },
    };
  return withConversationDefaults(normalized as any, hostId);
}

/** 补默认字段（原版 R_）。 */
export function withConversationDefaults<T extends Record<string, any>>(
  state: T,
  hostId: string,
): T {
  return {
    ...state,
    hostId: state.hostId ?? hostId,
    turnsPagination: state.turnsPagination ?? defaultTurnsPagination(),
    workspaceKind: state.workspaceKind ?? `project`,
  };
}
