// 边界句柄匹配工具（原版 qge/F_/I_/L_，main-C-Mhak1n.ts 32,353-32,390）。
//
// Kge 的装载循环用它们判定「边界页恢复」与「tail 全量装载」的取舍：
//   - I_/L_：找 history 中第一个 available 边界（tail 模式只看 older）；
//   - F_：边界句柄是否与尾岛的 older 边界完全一致（重合时可走 tail 快路径）；
//   - qge：尾岛是否包含 turnsPagination.oldestLoadedTurnId（tail 页锚点）。

import {
  exhaustedTailIsland,
  type BoundaryHandle,
  type CanonicalHistory,
  type HistoryBoundary,
  type HistoryIsland,
} from "./canonical-history";

/** 取岛某一侧的 available 边界句柄（原版 L_）。 */
function islandBoundaryHandle(
  history: CanonicalHistory,
  island: HistoryIsland,
  edge: 'older' | 'newer',
): BoundaryHandle | null {
  let boundary = edge === `older` ? island.olderBoundary : island.newerBoundary;
  return boundary.status === `available`
    ? ({ ...boundary, edge, generation: history.generation, islandId: island.id } as BoundaryHandle)
    : null;
}

/**
 * 找第一个 available 边界（原版 I_）：tail 模式只看首岛 older；否则逐岛
 * 先 older 后 newer。
 */
export function findAvailableBoundaryHandle(
  history: CanonicalHistory,
  tailOnly: boolean,
): BoundaryHandle | null {
  let firstIsland = history.islands[0];
  if (!tailOnly) return firstIsland == null ? null : islandBoundaryHandle(history, firstIsland, `older`);
  for (let island of history.islands)
    for (let edge of [`older`, `newer`] as const) {
      let handle = islandBoundaryHandle(history, island, edge);
      if (handle != null) return handle;
    }
  return null;
}

/**
 * 边界句柄是否就是尾岛的 older 边界（原版 F_）：单岛 + 尾界 exhausted +
 * 边界 id/progressKey/cursor/source 全一致。
 */
export function matchesTailBoundary(history: CanonicalHistory, boundary: BoundaryHandle): boolean {
  let island = history.islands[0];
  let olderBoundary = island?.olderBoundary;
  return (
    boundary.edge === `older` &&
    history.generation === boundary.generation &&
    history.islands.length === 1 &&
    island?.id === boundary.islandId &&
    island.newerBoundary.status === `exhausted` &&
    olderBoundary?.status === `available` &&
    olderBoundary.boundaryId === boundary.boundaryId &&
    olderBoundary.progressKey === boundary.progressKey &&
    olderBoundary.handle.cursor === boundary.handle.cursor &&
    olderBoundary.handle.source === boundary.handle.source
  );
}

/** 尾岛是否包含指定 turnId（或无实体可用时视为不包含，原版 qge）。 */
export function tailContainsTurnId(
  history: CanonicalHistory,
  oldestLoadedTurnId: string | null,
): boolean {
  let entries = history.islands[0]?.entries ?? [];
  return oldestLoadedTurnId == null
    ? (history.entitiesByKey[entries[0]?.value ?? ``]?.turnId ?? null) == null
    : entries.some(({ value }) => history.entitiesByKey[value]?.turnId === oldestLoadedTurnId);
}
