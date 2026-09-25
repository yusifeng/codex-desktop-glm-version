// 已保存自定义分区：状态变换（纯函数）+ app-server 分区 RPC 门面。
//
// 对应 main-C-Mhak1n.ts 93,659-94,533 + 94,704-94,961：
//   - $ze ThreadSectionServer：threadSection/list/create/update/delete/move
//     的 app-server RPC 门面 + pinned 段发现（分页扫描 + section_position
//     能力探测）+ legacy 迁移记账（PINNED_THREAD_IDS /
//     APP_SERVER_MIGRATED_PINNED_THREAD_IDS_BY_HOST 两 globalState 键）+
//     per-host 变更串行队列 + thread 读取缓存（RetryLookupCache）
//   - _H/eBe applySectionCommand/reduceSectionState：9 种命令的 reducer
//     （create/rename/delete/collapse/reorder/move/remove/reorderItems/
//     replaceItem/resolvePendingDeletion）+ threadHostIds 联动裁剪
//   - bH diffAffected / xH snapshotFor / SH snapshotMatches / CH clampToScope
//     / wH applyAffected：undo/redo 的差分基础
//   - TH reconcileHostSections / EH reconcileSectionMembers / DH rebindThreadHostIds
//     / OH threadIdOfItemKey / kH itemKeyOfThreadId / AH retainPendingDeletions：
//     host 对账的合并工具
//   - vH applyReplicaState：replica 保存的状态写入
//   - gH isJsonRpcCode / nBe HOST_SYNCED_COLLECTIONS
import { randomUUID } from "node:crypto";
import {
  wf as objectSchema,
  Of as stringSchema,
  Cf as numberSchema,
  gf as booleanSchema,
  hf as arraySchema,
  Mf as jsonSchema,
  Ef as recordSchema,
  Qu as isSupportedAppServerVersion,
  hu as isValidThreadId,
  $u as threadIdOf,
  iu as STATE_KEYS,
  Uf as EventEmitterBase,
} from "@chunk/shared";
import { deepEqual } from "../util/lodash-interop";
import { RetryLookupCache } from "../threads/hydration";
import { isThreadNotFound } from "../threads/thread-store";

// ---------------------------------------------------------------------------
// 常量与工具（原 `ve`/`Qze`/`gH`/`nBe`）
// ---------------------------------------------------------------------------

/** pinned 段的固定 UUID（原 `ve`，188 行字面量复用）。 */
export const PINNED_SECTION_UUID = "01984de2-8f74-7c91-a3b2-5c5e937cf318";

const threadIdSchema = objectSchema({ thread: objectSchema({ id: stringSchema() }) });

/** JSON-RPC 错误码提取（原 `gH`）。 */
function isJsonRpcCode(error: unknown, code: number): boolean {
  return (
    ("jsonRpcCode" in (error as object) && (error as { jsonRpcCode?: number }).jsonRpcCode === code) ||
    ("code" in (error as object) && (error as { code?: number }).code === code)
  );
}

/** host 同步的顶层集合键（原 `nBe`）。 */
const HOST_SYNCED_COLLECTIONS = [
  "threadHostIds",
  "collapsedSectionIds",
  "sectionOrder",
  "appServerLegacySectionIds",
  "appServerMigratedHostIds",
] as const;

// ---------------------------------------------------------------------------
// 状态模型与 reducer（原 `_H`/`eBe`）
// ---------------------------------------------------------------------------

export interface SavedSection {
  id: string;
  name: string;
  itemKeys: string[];
  hostSectionIds?: Record<string, string>;
  pendingDeletionHostIdsByItemKey?: Record<string, string[]>;
}

export interface SavedSectionsState {
  sections: SavedSection[];
  threadHostIds?: Record<string, string>;
  collapsedSectionIds: string[];
  sectionOrder: string[];
  appServerLegacySectionIds?: string[];
  appServerMigratedHostIds?: string[];
}

export type SectionCommand =
  | { type: "create"; sectionId: string; name: string; itemKeys: string[]; threadHostIds?: Record<string, string>; legacy?: boolean }
  | { type: "rename"; sectionId: string; name: string }
  | { type: "delete"; sectionId: string }
  | { type: "collapse"; sectionId: string; collapsed: boolean }
  | { type: "reorder"; sectionKeys: string[]; visibleSectionKeys: string[] }
  | { type: "move"; sectionId: string; itemKey: string; beforeItemKey: string | null; onlyIfUnassigned?: boolean; threadHostId?: string }
  | { type: "remove"; itemKey: string }
  | { type: "reorderItems"; sectionId: string; itemKeys: string[] }
  | { type: "replaceItem"; previousItemKey: string; nextItemKey: string; threadHostId?: string }
  | { type: "resolvePendingDeletion"; itemKey: string; hostId: string };

const THREAD_ITEM_PREFIX = "codex:thread:local:";

function threadIdOfItemKey(itemKey: string): string | null {
  if (!itemKey.startsWith(THREAD_ITEM_PREFIX)) return null;
  const threadId = itemKey.slice(THREAD_ITEM_PREFIX.length);
  return (isValidThreadId as (value: string) => boolean)(threadId) ? null : threadId;
}

function itemKeyOfThreadId(threadId: string): string {
  return `${THREAD_ITEM_PREFIX}${threadId}`;
}

/** 9 种命令的 reducer（原 `eBe`）。 */
export function reduceSectionState(state: SavedSectionsState, command: SectionCommand): SavedSectionsState {
  switch (command.type) {
    case "create": {
      const next = insertSection(state, { id: command.sectionId, name: command.name, itemKeys: command.itemKeys });
      if (next === state) return state;
      return command.legacy
        ? {
            ...next,
            appServerLegacySectionIds:
              state.appServerLegacySectionIds == null ? undefined : [...state.appServerLegacySectionIds, command.sectionId],
            appServerMigratedHostIds: undefined,
          }
        : {
            ...next,
            appServerLegacySectionIds: state.appServerLegacySectionIds ?? state.sections.map(({ id }) => id),
          };
    }
    case "rename":
      return renameSection(state, command.sectionId, command.name);
    case "delete":
      return deleteSection(state, command.sectionId);
    case "collapse":
      return !state.sections.some(({ id }) => id === command.sectionId) ||
        state.collapsedSectionIds.includes(command.sectionId) === command.collapsed
        ? state
        : {
            ...state,
            collapsedSectionIds: command.collapsed
              ? [...state.collapsedSectionIds, command.sectionId]
              : state.collapsedSectionIds.filter((id) => id !== command.sectionId),
          };
    case "reorder": {
      const customIds = new Set(state.sections.map(({ id }) => `custom:${id}`));
      const visible = new Set(command.visibleSectionKeys.filter((key) => !key.startsWith("custom:") || customIds.has(key)));
      const ordered = command.sectionKeys.filter((key) => visible.has(key));
      let cursor = 0;
      return reorderSectionOrder(
        state,
        [
          ...state.sectionOrder.flatMap((key) => {
            if (!visible.has(key)) return [key];
            const replacement = ordered[cursor++];
            return replacement == null ? [] : [replacement];
          }),
          ...ordered.slice(cursor),
        ],
      );
    }
    case "move":
      return command.onlyIfUnassigned && state.sections.some(({ itemKeys }) => itemKeys.includes(command.itemKey))
        ? state
        : moveItemToSection(state, command.sectionId, command.itemKey, command.beforeItemKey);
    case "remove":
      return removeItem(state, command.itemKey);
    case "reorderItems":
      return reorderSectionItems(state, command.sectionId, command.itemKeys);
    case "replaceItem":
      return replaceItemKey(state, command.previousItemKey, command.nextItemKey);
    case "resolvePendingDeletion": {
      let next = state;
      for (const section of state.sections) {
        const pendingHosts = section.pendingDeletionHostIdsByItemKey?.[command.itemKey];
        if (pendingHosts == null) continue;
        const pending = { ...section.pendingDeletionHostIdsByItemKey };
        delete pending[command.itemKey];
        const itemKeys = pendingHosts.includes(command.hostId)
          ? section.itemKeys.filter((key) => key !== command.itemKey)
          : section.itemKeys;
        next =
          itemKeys.length === 0 && Object.keys(section.hostSectionIds ?? {}).length === 0
            ? deleteSection(next, section.id)
            : {
                ...next,
                sections: next.sections.map((entry) =>
                  entry.id === section.id
                    ? {
                        ...section,
                        itemKeys,
                        pendingDeletionHostIdsByItemKey: Object.keys(pending).length === 0 ? undefined : pending,
                      }
                    : entry,
                ),
              };
      }
      return next;
    }
    default:
      return state;
  }
}

/** 命令 + threadHostIds 联动裁剪（原 `_H`）。 */
export function applySectionCommand(state: SavedSectionsState, command: SectionCommand): SavedSectionsState {
  const reduced = reduceSectionState(state, command);
  if (command.type === "create" && reduced === state) return state;
  let affectedItemKey: string | undefined;
  if (command.type === "move" || command.type === "resolvePendingDeletion") affectedItemKey = command.itemKey;
  else if (command.type === "replaceItem") affectedItemKey = command.nextItemKey;
  let affectedHost: string | undefined;
  if (command.type === "resolvePendingDeletion") affectedHost = command.hostId;
  else if (command.type === "move" || command.type === "replaceItem") affectedHost = command.threadHostId;
  const presentItemKeys = new Set(reduced.sections.flatMap(({ itemKeys }) => itemKeys));
  const threadHostIds = Object.fromEntries(
    Object.entries({
      ...state.threadHostIds,
      ...(command.type === "create" ? command.threadHostIds : undefined),
      ...(affectedItemKey?.startsWith(THREAD_ITEM_PREFIX) && affectedHost != null
        ? { [affectedItemKey.slice(THREAD_ITEM_PREFIX.length)]: affectedHost }
        : {}),
    }).filter(([threadId]) => presentItemKeys.has(itemKeyOfThreadId(threadId))),
  );
  return Object.keys(threadHostIds).length === Object.keys(state.threadHostIds ?? {}).length &&
    Object.entries(threadHostIds).every(([threadId, host]) => state.threadHostIds?.[threadId] === host)
    ? reduced
    : { ...reduced, threadHostIds: Object.keys(threadHostIds).length === 0 ? undefined : threadHostIds };
}

// ---- 段内条目操作（原 `qb`/`Jb`/`Yb`/`Gb`/`Xb`/`Zb`/`sye`/`oye` 的内联等价）----

function insertSection(state: SavedSectionsState, section: SavedSection): SavedSectionsState {
  if (state.sections.some(({ id }) => id === section.id)) return state;
  return { ...state, sections: [...state.sections, section] };
}

function renameSection(state: SavedSectionsState, sectionId: string, name: string): SavedSectionsState {
  return state.sections.some(({ id, name: current }) => id === sectionId && current !== name)
    ? { ...state, sections: state.sections.map((section) => (section.id === sectionId ? { ...section, name } : section)) }
    : state;
}

function deleteSection(state: SavedSectionsState, sectionId: string): SavedSectionsState {
  return state.sections.some(({ id }) => id === sectionId)
    ? {
        ...state,
        sections: state.sections.filter((section) => section.id !== sectionId),
        collapsedSectionIds: state.collapsedSectionIds.filter((id) => id !== sectionId),
      }
    : state;
}

function moveItemToSection(state: SavedSectionsState, sectionId: string, itemKey: string, beforeItemKey: string | null): SavedSectionsState {
  let next = removeItem(state, itemKey);
  const target = next.sections.find(({ id }) => id === sectionId);
  if (target == null) return state;
  const insertAt = beforeItemKey == null ? target.itemKeys.length : Math.max(0, target.itemKeys.indexOf(beforeItemKey));
  const itemKeys = [...target.itemKeys];
  itemKeys.splice(insertAt, 0, itemKey);
  return { ...next, sections: next.sections.map((section) => (section.id === sectionId ? { ...section, itemKeys } : section)) };
}

function removeItem(state: SavedSectionsState, itemKey: string): SavedSectionsState {
  return state.sections.some(({ itemKeys }) => itemKeys.includes(itemKey))
    ? {
        ...state,
        sections: state.sections.map((section) =>
          section.itemKeys.includes(itemKey)
            ? { ...section, itemKeys: section.itemKeys.filter((key) => key !== itemKey) }
            : section,
        ),
      }
    : state;
}

function reorderSectionItems(state: SavedSectionsState, sectionId: string, itemKeys: string[]): SavedSectionsState {
  const section = state.sections.find(({ id }) => id === sectionId);
  if (section == null || deepEqual(section.itemKeys, itemKeys)) return state;
  return {
    ...state,
    sections: state.sections.map((entry) => (entry.id === sectionId ? { ...entry, itemKeys: [...itemKeys] } : entry)),
  };
}

function replaceItemKey(state: SavedSectionsState, previousItemKey: string, nextItemKey: string): SavedSectionsState {
  return {
    ...state,
    sections: state.sections.map((section) =>
      section.itemKeys.includes(previousItemKey)
        ? {
            ...section,
            itemKeys: section.itemKeys.map((key) => (key === previousItemKey ? nextItemKey : key)),
          }
        : section,
    ),
  };
}

function reorderSectionOrder(state: SavedSectionsState, sectionOrder: string[]): SavedSectionsState {
  return deepEqual(state.sectionOrder, sectionOrder)
    ? state
    : {
        ...state,
        sectionOrder,
        collapsedSectionIds: sectionOrder.filter((id) => state.collapsedSectionIds.includes(id)),
      };
}

// ---------------------------------------------------------------------------
// 差分基础（原 `bH`/`xH`/`SH`/`CH`/`wH`）
// ---------------------------------------------------------------------------

export interface SectionScope {
  sections: Array<{ id: string; before: SavedSection | undefined; after: SavedSection | undefined }>;
  collections: string[];
  structure: boolean;
}

/** before/after 差分（原 `bH`）。 */
export function diffSectionScope(before: SavedSectionsState, after: SavedSectionsState): SectionScope {
  return {
    sections: [...new Set([...before.sections, ...after.sections].map(({ id }) => id))].flatMap((id) => {
      const beforeSection = before.sections.find((section) => section.id === id);
      const afterSection = after.sections.find((section) => section.id === id);
      return deepEqual(beforeSection, afterSection) ? [] : [{ id, before: beforeSection, after: afterSection }];
    }),
    collections: HOST_SYNCED_COLLECTIONS.filter((key) => !deepEqual((before as never as Record<string, unknown>)[key], (after as never as Record<string, unknown>)[key])),
    structure: !deepEqual(
      before.sections.map(({ id }) => id),
      after.sections.map(({ id }) => id),
    ),
  };
}

interface SectionSnapshot {
  memberships: Map<string, string[]>;
  sections: Map<string, SavedSection | undefined>;
  collections: Map<string, unknown>;
  structure?: WeakRef<SavedSection[]>;
}

/** 状态快照（原 `xH`）：WeakRef 锁段表身份。 */
function snapshotFor(state: SavedSectionsState, scope: SectionScope): SectionSnapshot {
  return {
    memberships: new Map(
      scope.sections.flatMap(({ before, after }) =>
        [...(before?.itemKeys ?? []), ...(after?.itemKeys ?? [])].map((itemKey) => [
          itemKey,
          state.sections.filter(({ itemKeys }) => itemKeys.includes(itemKey)).map(({ id }) => id),
        ]),
      ),
    ),
    sections: new Map(scope.sections.map(({ id }) => [id, state.sections.find((section) => section.id === id)])),
    collections: new Map(scope.collections.map((key) => [key, (state as never as Record<string, unknown>)[key]])),
    structure: scope.structure ? new WeakRef(state.sections) : undefined,
  };
}

/** 快照匹配（原 `SH`）：memberships/段身份/集合值/结构身份全等。 */
function snapshotMatches(state: SavedSectionsState, snapshot: SectionSnapshot): boolean {
  return (
    [...snapshot.memberships].every(([itemKey, sectionIds]) =>
      deepEqual(
        sectionIds,
        state.sections.filter(({ itemKeys }) => itemKeys.includes(itemKey)).map(({ id }) => id),
      ),
    ) &&
    (snapshot.structure == null || state.sections === snapshot.structure.deref()) &&
    [...snapshot.collections].every(([key, value]) => (state as never as Record<string, unknown>)[key] === value) &&
    [...snapshot.sections].every(([id, section]) => state.sections.find((entry) => entry.id === id) === section)
  );
}

/** 状态裁剪到 scope（原 `CH`）。 */
function clampToScope(state: SavedSectionsState, scope: SectionScope): SavedSectionsState {
  const scopeIds = new Set(scope.sections.map(({ id }) => id));
  return {
    sections: state.sections.filter(({ id }) => scopeIds.has(id)),
    threadHostIds: scope.collections.includes("threadHostIds") ? state.threadHostIds : undefined,
    collapsedSectionIds: scope.collections.includes("collapsedSectionIds") ? state.collapsedSectionIds : [],
    sectionOrder: scope.collections.includes("sectionOrder") ? state.sectionOrder : [],
    appServerLegacySectionIds: scope.collections.includes("appServerLegacySectionIds") ? state.appServerLegacySectionIds : undefined,
    appServerMigratedHostIds: scope.collections.includes("appServerMigratedHostIds") ? state.appServerMigratedHostIds : undefined,
  };
}

/** 把 scope 的差分写回当前状态（原 `wH`）：structure 时按目标段序重建。 */
function applyScopeToState(
  current: SavedSectionsState,
  target: SavedSectionsState,
  scope: SectionScope,
  targetOrder: string[] = target.sections.map(({ id }) => id),
): SavedSectionsState {
  const scopeIds = new Set(scope.sections.map(({ id }) => id));
  const sections = scope.structure
    ? targetOrder.map((id) => {
        const replacement = scopeIds.has(id)
          ? target.sections.find(({ id: sectionId }) => sectionId === id)
          : current.sections.find(({ id: sectionId }) => sectionId === id);
        if (replacement == null) throw new Error("Saved section structure changed");
        return scopeIds.has(id) ? { ...replacement, itemKeys: [...replacement.itemKeys] } : replacement;
      })
    : current.sections.map((section) => {
        if (!scopeIds.has(section.id)) return section;
        const replacement = target.sections.find(({ id }) => id === section.id);
        return replacement == null ? section : { ...replacement, itemKeys: [...replacement.itemKeys] };
      });
  const collapsed = scope.collections.includes("collapsedSectionIds")
    ? [...target.collapsedSectionIds]
    : current.collapsedSectionIds;
  return {
    ...current,
    sections,
    threadHostIds: scope.collections.includes("threadHostIds") ? target.threadHostIds : current.threadHostIds,
    collapsedSectionIds: scope.structure ? collapsed.filter((id) => sections.some((section) => section.id === id)) : collapsed,
    sectionOrder: scope.collections.includes("sectionOrder") ? [...target.sectionOrder] : current.sectionOrder,
    appServerLegacySectionIds: scope.collections.includes("appServerLegacySectionIds")
      ? target.appServerLegacySectionIds?.slice()
      : current.appServerLegacySectionIds,
    appServerMigratedHostIds: scope.collections.includes("appServerMigratedHostIds")
      ? target.appServerMigratedHostIds?.slice()
      : current.appServerMigratedHostIds,
  };
}

/** replica 状态写入（原 `vH`）：conflict/unchanged/applied 三态。 */
export function applyReplicaState(
  source: SectionStateSource,
  before: SavedSectionsState,
  after: SavedSectionsState,
  operationId: string,
  hostId: string,
): "applied" | "unchanged" | "conflict" | "unavailable" {
  if (!source.isSourceCurrent()) return "unavailable";
  const scope = diffSectionScope(before, after);
  const current = source.read();
  const changedThreadIds = Object.keys({ ...before.threadHostIds, ...after.threadHostIds }).filter(
    (threadId) => before.threadHostIds?.[threadId] !== after.threadHostIds?.[threadId],
  );
  scope.collections = scope.collections.filter((collection) => collection !== "threadHostIds");
  if (
    !snapshotMatches(current, snapshotFor(before, scope)) ||
    changedThreadIds.some((threadId) => current.threadHostIds?.[threadId] !== before.threadHostIds?.[threadId])
  )
    return "conflict";
  source.getConnection(hostId);
  if (deepEqual(before, after)) return "unchanged";
  let next = applyScopeToState(current, after, scope);
  if (changedThreadIds.length !== 0) {
    const threadHostIds = { ...current.threadHostIds };
    for (const threadId of changedThreadIds) {
      const host = after.threadHostIds?.[threadId];
      if (host == null) delete threadHostIds[threadId];
      else threadHostIds[threadId] = host;
    }
    next.threadHostIds = Object.keys(threadHostIds).length === 0 ? undefined : threadHostIds;
  }
  source.write(next, operationId);
  return "applied";
}

// ---------------------------------------------------------------------------
// host 对账合并（原 `TH`/`EH`/`DH`/`AH`）
// ---------------------------------------------------------------------------

/** host 段与本地段的合并（原 `TH`）：名称匹配 + pendingDeletion 裁剪 + 新段补建。 */
export function reconcileHostSections(
  state: SavedSectionsState,
  hostId: string,
  hostSections: { hostId: string; id: string; name: string },
  threadHostIds: Record<string, string>,
  boundThreadIds: Record<string, string>,
  createId: () => string,
  hostThreadIdsBySectionId: Map<string, string[]>,
): SavedSectionsState {
  if (!hostSections || !(hostSections as unknown as { hostIds?: string[] }).hostIds?.includes(hostId)) {
    // hostSections 参数实际是 listSections 的结果（含 hostIds/sections）。
    return state;
  }
  const listing = hostSections as unknown as { hostIds: string[]; sections: Array<{ hostId: string; id: string; name: string }> };
  if (!listing.hostIds.includes(hostId)) return state;
  const sections = listing.sections.filter((section) => section.hostId === hostId);
  const matchedLocalIds = new Map<string, string>();
  let next: SavedSectionsState =
    state.appServerLegacySectionIds == null
      ? { ...state, appServerLegacySectionIds: state.sections.map(({ id }) => id) }
      : state;
  for (const localSection of state.sections) {
    const replicaId = localSection.hostSectionIds?.[hostId];
    const replicaRemoved = replicaId != null && !sections.some(({ id }) => id === replicaId);
    if (!replicaRemoved && localSection.pendingDeletionHostIdsByItemKey == null) continue;
    const replacement =
      replicaRemoved
        ? sections.find(
            (hostSection) =>
              hostSection.name === localSection.name &&
              !matchedLocalIds.has(hostSection.id) &&
              !state.sections.some((section) => section.hostSectionIds?.[hostId] === hostSection.id),
          )
        : undefined;
    if (replacement != null && (matchedLocalIds.set(replacement.id, localSection.id), !hostThreadIdsBySectionId.has(replacement.id))) continue;
    const hostSectionIds = { ...localSection.hostSectionIds };
    if (replicaRemoved) delete hostSectionIds[hostId];
    const pendingDeletions: Record<string, string[]> = {};
    const itemKeys = localSection.itemKeys.filter((itemKey) => {
      const threadId = threadHostIds[itemKey] ?? threadIdOfItemKey(itemKey);
      if (threadId == null && !itemKey.startsWith(THREAD_ITEM_PREFIX)) return true;
      const pendingHosts = new Set([...(localSection.pendingDeletionHostIdsByItemKey?.[itemKey] ?? []), ...(replicaRemoved ? [hostId] : [])]);
      if (pendingHosts.size === 0) return true;
      const itemHost = threadId == null ? undefined : (boundThreadIds[threadId] ?? state.threadHostIds?.[threadId]);
      if (itemHost == null) pendingDeletions[itemKey] = [...pendingHosts];
      return itemHost == null || !pendingHosts.has(itemHost);
    });
    next =
      replacement == null && Object.keys(hostSectionIds).length === 0 && itemKeys.length === 0
        ? deleteSection(next, localSection.id)
        : {
            ...next,
            sections: next.sections.map((section) =>
              section.id === localSection.id
                ? {
                    ...section,
                    hostSectionIds,
                    itemKeys,
                    pendingDeletionHostIdsByItemKey: Object.keys(pendingDeletions).length === 0 ? undefined : pendingDeletions,
                  }
                : section,
            ),
          };
  }
  for (const hostSection of sections) {
    const matchedLocalId = matchedLocalIds.get(hostSection.id);
    const existing =
      next.sections.find((section) => section.hostSectionIds?.[hostId] === hostSection.id) ??
      next.sections.find(
        (section) =>
          (matchedLocalId == null ? section.name === hostSection.name : section.id === matchedLocalId) &&
          section.hostSectionIds?.[hostId] == null &&
          hostThreadIdsBySectionId.has(hostSection.id),
      );
    if (existing == null) {
      const hostThreadIds = hostThreadIdsBySectionId.get(hostSection.id);
      if (hostThreadIds != null) {
        next = insertSection(next, {
          id: createId(),
          name: hostSection.name,
          itemKeys: hostThreadIds
            .filter((threadId) => {
              const host = boundThreadIds[threadId] ?? state.threadHostIds?.[threadId];
              return host == null || host === hostId;
            })
            .map(itemKeyOfThreadId),
          hostSectionIds: { [hostId]: hostSection.id },
        });
      }
      continue;
    }
    next = {
      ...next,
      sections: next.sections.map((section) =>
        section === existing
          ? { ...section, name: hostSection.name, hostSectionIds: { ...section.hostSectionIds, [hostId]: hostSection.id } }
          : section,
      ),
    };
  }
  return rebindThreadHostIds(next, boundThreadIds, threadHostIds);
}

/** 单段成员对账（原 `EH`）：迁移态下的条目重排。 */
export function reconcileSectionMembers(
  state: SavedSectionsState,
  hostId: string,
  sectionId: string,
  memberThreadIds: string[],
  threadHostIds: Record<string, string>,
  boundThreadIds: Record<string, string>,
): SavedSectionsState {
  const section = state.sections.find((entry) => entry.hostSectionIds?.[hostId] === sectionId);
  if (section == null) return state;
  const memberSet = new Set(
    memberThreadIds.filter((threadId) => {
      const host = threadHostIds[threadId] ?? state.threadHostIds?.[threadId];
      return host == null || host === hostId;
    }),
  );
  const boundSet = new Set(Object.values(boundThreadIds));
  const orderedKeys = [...memberSet].map(itemKeyOfThreadId);
  const migrated = state.appServerMigratedHostIds?.includes(hostId) === true;
  let cursor = 0;
  const mergedKeys = section.itemKeys.flatMap((itemKey) => {
    const threadId = boundThreadIds[itemKey] ?? threadIdOfItemKey(itemKey);
    if (threadId == null) return [itemKey];
    const itemHost = threadHostIds[threadId] ?? state.threadHostIds?.[threadId];
    const belongs = itemHost === hostId || (itemHost == null && memberSet.has(threadId));
    if (!migrated) return [memberSet.has(threadId) ? itemKeyOfThreadId(threadId) : itemKey];
    if (!belongs || (boundSet.has(threadId) && !memberSet.has(threadId))) return [itemKey];
    const replacement = orderedKeys[cursor++];
    return replacement == null ? [] : [replacement];
  });
  const finalKeys = migrated ? [...mergedKeys, ...orderedKeys.slice(cursor)] : [...new Set([...mergedKeys, ...orderedKeys])];
  return rebindThreadHostIds(
    {
      ...state,
      sections: state.sections.map((entry) => {
        if (entry === section) return retainPendingDeletions(entry, finalKeys, memberSet, boundThreadIds);
        if (!migrated) return entry;
        const remaining = entry.itemKeys.filter((itemKey) => {
          const threadId = boundThreadIds[itemKey] ?? threadIdOfItemKey(itemKey);
          return threadId == null || !memberSet.has(threadId);
        });
        return remaining.length === entry.itemKeys.length ? entry : retainPendingDeletions(entry, remaining, memberSet, boundThreadIds);
      }),
    },
    { ...Object.fromEntries([...memberSet].map((threadId) => [threadId, hostId])), ...threadHostIds },
    boundThreadIds,
  );
}

/** threadHostIds 重建（原 `DH`）。 */
function rebindThreadHostIds(state: SavedSectionsState, threadHostIds: Record<string, string>, boundThreadIds: Record<string, string>): SavedSectionsState {
  const rebound = Object.fromEntries(
    state.sections.flatMap(({ itemKeys }) =>
      itemKeys.flatMap((itemKey) => {
        const threadId = boundThreadIds[itemKey] ?? threadIdOfItemKey(itemKey);
        const host = threadId == null ? undefined : (threadHostIds[threadId] ?? state.threadHostIds?.[threadId]);
        return threadId == null || host == null ? [] : [[threadId, host]];
      }),
    ),
  );
  return { ...state, threadHostIds: Object.keys(rebound).length === 0 ? undefined : rebound };
}

/** pendingDeletion 保留（原 `AH`）。 */
function retainPendingDeletions(
  section: SavedSection,
  itemKeys: string[],
  memberSet: Set<string>,
  boundThreadIds: Record<string, string>,
): SavedSection {
  const pending = section.pendingDeletionHostIdsByItemKey;
  const retained =
    pending == null
      ? undefined
      : Object.fromEntries(
          itemKeys.flatMap((itemKey) => {
            const hosts = pending[itemKey];
            const threadId = boundThreadIds[itemKey] ?? threadIdOfItemKey(itemKey);
            return hosts == null || (threadId != null && memberSet.has(threadId)) ? [] : [[itemKey, hosts]];
          }),
        );
  return {
    ...section,
    itemKeys,
    pendingDeletionHostIdsByItemKey: retained != null && Object.keys(retained).length !== 0 ? retained : undefined,
  };
}

export { threadIdOfItemKey, itemKeyOfThreadId, snapshotFor, snapshotMatches, clampToScope, applyScopeToState, HOST_SYNCED_COLLECTIONS };

// ---------------------------------------------------------------------------
// SectionStateSource（manager 侧提供的状态源接口）
// ---------------------------------------------------------------------------

export interface SectionStateSource {
  enqueueWrite<T>(operation: () => Promise<T>): Promise<T>;
  accountId: string;
  read(): SavedSectionsState;
  write(state: SavedSectionsState, operationId: string): SavedSectionsState;
  isSourceCurrent(): boolean;
  getConnection(hostId: string): unknown;
  reserveCreation(hostId: string, logicalSectionId: string): (() => void) | null;
  server: ThreadSectionServer;
  onServerChanged(hostId: string, refresh: () => void, context?: { hostId: string; threadId: string; sectionId: string; previousSectionId?: string; beforeThreadId?: string }): Promise<void>;
}

// ---------------------------------------------------------------------------
// ThreadSectionServer（原 `$ze`）
// ---------------------------------------------------------------------------

interface SectionHost {
  hostId: string;
  migrationIdentity?: string;
  connection: HostConnection;
  pinnedSectionId: string | null;
}

interface HostConnection {
  appServerVersion: string;
  isLocal: boolean;
  getConnectionState(): string;
  captureRequestLifetime(): () => void;
  registerInternalAuthenticatedPrincipalChangeHandler(cb: () => void): void;
  registerInternalNotificationHandler(cb: (notification: { method: string; params: unknown }) => void): void;
  registerInternalConnectionStateHandler(cb: (state: string) => void): void;
  codexHome(): Promise<string>;
  readThread(threadId: string, opts: unknown, _?: undefined, beforeSendRequest?: () => void): Promise<{ id: string } | null>;
  listThreads(opts: unknown, _: undefined, beforeSendRequest?: () => void): Promise<unknown>;
  sendAppServerRequest(method: string, params: unknown, beforeSendRequest?: () => void): Promise<any>;
  addMarketplace(request: unknown): Promise<unknown>;
}

export interface SectionOperationContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getConnection(hostId: string): any;
  assertCurrent(): void;
  assertSourceCurrent(): void;
  canDeleteCreatedReplica(hostId: string, replicaId: string): boolean;
}

interface GlobalStateLike {
  get(key: unknown): unknown;
  set(key: unknown, value: unknown): void;
  flushOrThrow(): Promise<void>;
  flush(): Promise<void>;
}

interface AppServerConnectionRegistryLike {
  getAllHostIds(): string[];
  getMaybeConnection(hostId: string): HostConnection | null;
}

interface ThreadSectionOwner {
  sectionId: string;
  hostId: string;
  migrationIdentity: string;
  isPinned: boolean;
}

interface ThreadSectionEngine {
  listHostSectionThreadIds(host: SectionHost, sectionId: string): Promise<string[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findThreadOwner(threadId: string, hosts: any[], opts?: { throwOnMissingThread?: boolean; throwOnAmbiguousOwner?: boolean; forDiscovery?: boolean }): Promise<ThreadSectionOwner | null>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setThreadSection(owner: any, move: { threadId: string; sectionId: string | null; beforeThreadId: string | null; previousSectionId?: string }): Promise<boolean>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setThreadPinned(owner: any, update: { threadId: string; pinned: boolean; beforeThreadId: string | null }): Promise<boolean>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  movePinnedThread(owner: any, move: { threadId: string; beforeThreadId: string | null }): Promise<boolean>;
  createSection(host: SectionHost, name: string, logicalSectionId: string): Promise<{ id: string }>;
  updateSection(host: SectionHost, sectionId: string, name: string): Promise<void>;
  deleteSection(host: SectionHost, sectionId: string): Promise<void>;
  listSections(hosts: SectionHost[] | SectionHost, opts?: unknown): Promise<unknown>;
  listSectionThreadIds(host: SectionHost, sectionId: string): Promise<string[]>;
}

/** app-server 分区 RPC 门面（原 `$ze`）。 */
export class ThreadSectionServer {
  globalState: GlobalStateLike;
  appServerConnectionRegistry: AppServerConnectionRegistryLike;
  observedConnections = new WeakSet<object>();
  threadLookupsByConnection = new WeakMap<object, RetryLookupCache<{ id: string }>>();
  pinnedSectionIdsByConnection = new WeakMap<object, string | null>();
  pendingHostMutations = new Map<string, Promise<void>>();
  pendingMigrationMarkers = new Set<string>();
  threadSectionEngine: ThreadSectionEngine;

  constructor(globalState: GlobalStateLike, appServerConnectionRegistry: AppServerConnectionRegistryLike, threadSectionEngine: ThreadSectionEngine) {
    this.globalState = globalState;
    this.appServerConnectionRegistry = appServerConnectionRegistry;
    this.threadSectionEngine = threadSectionEngine;
  }

  /** 全部 pinned 线程（原 `listPinnedThreads`）：段内 + legacy globalState 合并。 */
  async listPinnedThreads({ hostId, cloudThreadIds }: { hostId?: string; cloudThreadIds?: string[] } = {}): Promise<{ threadIds: string[]; serverOrderedThreadIds: string[] }> {
    const allHostIds = this.appServerConnectionRegistry.getAllHostIds();
    const durableHostIds = allHostIds.filter((id) => id !== "durable");
    const anyDurableDisconnected =
      hostId == null &&
      (durableHostIds.length === 0 ||
        durableHostIds.some((id) => this.appServerConnectionRegistry.getMaybeConnection(id)?.getConnectionState() !== "connected"));
    const hosts = (await this.getHosts(hostId)).filter((host) => hostId != null || host.hostId !== "durable");
    const sectionedHosts = hosts.filter((host) => host.pinnedSectionId != null);
    const legacyHosts = hosts.filter((host) => host.pinnedSectionId == null);
    const cloudIds = new Set(cloudThreadIds);
    if (hostId == null) await this.migrateLegacyPinnedThreads(sectionedHosts, legacyHosts, cloudIds);
    const migratedIds = this.getMigratedThreadIds(sectionedHosts);
    const legacyPinnedIds = readPinnedThreadIds(this.globalState).filter((id) => !migratedIds.has(id) && !cloudIds.has(id));
    const serverOrderedThreadIds = Array.from(
      new Set(
        (
          await Promise.all(sectionedHosts.map((host) => this.threadSectionEngine.listHostSectionThreadIds(host, host.pinnedSectionId as string)))
        ).flat(),
      ),
    );
    const legacyVisible = await Promise.all(
      legacyPinnedIds.map(async (threadId) => {
        const inSectionHost =
          (await this.findLegacyThreadOwnerInHosts(threadId, sectionedHosts, { hostId, forDiscovery: true })) == null;
        const ownedByDurable = !anyDurableDisconnected && !(hostId == null && allHostIds.some((id) => id === "durable"));
        const inLegacyHost =
          hostId == null && (await this.threadSectionEngine.findThreadOwner(threadId, sectionedHosts, { forDiscovery: true })) != null;
        return inSectionHost && ownedByDurable && !inLegacyHost ? null : threadId;
      }),
    );
    return {
      threadIds: Array.from(new Set([...serverOrderedThreadIds, ...legacyVisible.filter((id): id is string => id != null)])),
      serverOrderedThreadIds,
    };
  }

  async listPinnedThreadIds({ hostId }: { hostId?: string } = {}): Promise<string[]> {
    return (await this.listPinnedThreads({ hostId })).threadIds;
  }

  async listSections({ hostId }: { hostId?: string } = {}, context?: SectionOperationContext): Promise<{ hostIds: string[]; sections: Array<{ hostId: string; id: string; name: string }> }> {
    const hosts = await this.getSupportedHosts(hostId, context);
    // listSections 由 engine 提供（多 host 聚合）。
    return (await this.threadSectionEngine.listSections(hosts.length === 1 ? hosts : hosts, context)) as never;
  }

  async listSectionThreadIds({ hostId, sectionId }: { hostId: string; sectionId: string }, context?: SectionOperationContext): Promise<string[]> {
    const host = await this.getCustomSectionHost(hostId, context);
    return this.threadSectionEngine.listSectionThreadIds(host, sectionId);
  }

  /** 建段（原 `createSection`）：建段 + 线程迁移 + 失败回滚。 */
  async createSection(
    { hostId, threadIdToMove, logicalSectionId, name, previousSectionId }: { hostId: string; threadIdToMove: string | null; logicalSectionId: string; name: string; previousSectionId: string | null },
    context?: SectionOperationContext,
    onThreadSectionChange?: (change: { threadId: string; previousSectionId: string | null }) => void,
  ): Promise<{ id: string }> {
    const host = await this.getCustomSectionHost(hostId, context);
    const lifetime = host.connection.captureRequestLifetime();
    const section =
      context == null
        ? await this.threadSectionEngine.createSection(host, name, logicalSectionId)
        : ((await host.connection.sendAppServerRequest("threadSection/create", { name }, (context as never as { beforeSendRequest?: () => void }).beforeSendRequest)) as { section: { id: string } }).section;
    let threadChange: { threadId: string; previousSectionId: string | null } | undefined;
    try {
      context?.assertCurrent();
      if (threadIdToMove == null) return section;
      if (
        !(await this.setThreadSection(
          { beforeThreadId: null, hostId, previousSectionId, sectionId: section.id, threadId: threadIdToMove },
          context,
          (previousSectionIdOfThread) => {
            threadChange = { threadId: threadIdToMove, previousSectionId: previousSectionIdOfThread };
            onThreadSectionChange?.(threadChange);
          },
        ))
      )
        throw new Error("App-server section thread changed sections");
      return section;
    } catch (error) {
      throw (
        await this.discardCreatedSection(
          hostId,
          section.id,
          context ?? {
            getConnection: () => host.connection,
            assertCurrent: lifetime,
            assertSourceCurrent: lifetime,
            canDeleteCreatedReplica: () => true,
          },
          threadChange,
        ),
        error
      );
    }
  }

  /** 丢弃误建的段（原 `discardCreatedSection`）：回移线程 + 空段删除。 */
  async discardCreatedSection(hostId: string, sectionId: string, context: SectionOperationContext | null, threadChange?: { threadId: string; previousSectionId: string | null }): Promise<void> {
    const guarded =
      context == null
        ? undefined
        : {
            ...context,
            assertCurrent: () => {
              if ((context.assertSourceCurrent(), !context.canDeleteCreatedReplica(hostId, sectionId)))
                throw new DOMException("Created section was adopted", "AbortError");
            },
          };
    const host = await this.getCustomSectionHost(hostId, guarded);
    await this.runHostMutation(host.migrationIdentity as string, async () => {
      if (threadChange != null) {
        const owner = await this.threadSectionEngine.findThreadOwner(threadChange.threadId, [host]);
        if (owner?.sectionId === sectionId)
          await this.threadSectionEngine.setThreadSection(owner, {
            threadId: threadChange.threadId,
            sectionId: threadChange.previousSectionId,
            beforeThreadId: null,
            previousSectionId: sectionId,
          });
      }
      if ((await this.threadSectionEngine.listHostSectionThreadIds(host, sectionId)).length === 0)
        await this.threadSectionEngine.deleteSection(host, sectionId);
    });
  }

  async updateSection({ hostId, sectionId, name }: { hostId: string; sectionId: string; name: string }, context?: SectionOperationContext): Promise<void> {
    const host = await this.getCustomSectionHost(hostId, context);
    await this.threadSectionEngine.updateSection(host, sectionId, name);
  }

  async deleteSection({ hostId, sectionId }: { hostId: string; sectionId: string }, context?: SectionOperationContext): Promise<void> {
    const host = await this.getCustomSectionHost(hostId, context);
    await this.threadSectionEngine.deleteSection(host, sectionId);
  }

  async setThreadSection(
    { hostId, threadId, sectionId, beforeThreadId, previousSectionId }: { hostId: string; threadId: string; sectionId: string | null; beforeThreadId: string | null; previousSectionId?: string },
    context?: SectionOperationContext,
    onSectionChange?: (previousSectionId: string | null) => void,
  ): Promise<boolean> {
    const host = await this.getCustomSectionHost(hostId, context);
    return this.runHostMutation(host.migrationIdentity as string, async () => {
      context?.assertCurrent();
      const owner = await this.threadSectionEngine.findThreadOwner(threadId, [host], { throwOnMissingThread: true });
      return (
        owner != null &&
        (onSectionChange?.(owner.sectionId),
        this.threadSectionEngine.setThreadSection(owner, {
          threadId,
          sectionId,
          beforeThreadId,
          previousSectionId,
        }))
      );
    });
  }

  /** 置顶/取消置顶（原 `setThreadPinned`）：legacy 线程迁移标记。 */
  async setThreadPinned({
    threadId,
    pinned,
    hostId,
    beforeThreadId,
    onThreadSectionChange,
  }: {
    threadId: string;
    pinned: boolean;
    hostId?: string;
    beforeThreadId: string | null;
    onThreadSectionChange?: (sectionId: string | null, hostId: string) => void;
  }): Promise<boolean | null> {
    const supportedHosts = await this.getSupportedHosts(hostId);
    const host =
      hostId == null
        ? await this.threadSectionEngine.findThreadOwner(threadId, supportedHosts as never, { throwOnAmbiguousOwner: true })
        : supportedHosts[0];
    if (host == null) return null;
    return this.runHostMutation((host as { migrationIdentity: string }).migrationIdentity, async () => {
      const owner = await this.threadSectionEngine.findThreadOwner(threadId, [host as never], { throwOnMissingThread: true });
      if (owner == null) return null;
      const changed = await this.threadSectionEngine.setThreadPinned(owner as never, { threadId, pinned, beforeThreadId });
      if (changed) onThreadSectionChange?.((owner as { sectionId: string }).sectionId, (owner as { hostId: string }).hostId);
      if (readPinnedThreadIds(this.globalState).includes(threadId))
        await this.markThreadMigrated((owner as { migrationIdentity: string }).migrationIdentity, threadId);
      return changed;
    });
  }

  async isLegacyThread({ threadId, hostId }: { threadId: string; hostId?: string }): Promise<boolean> {
    const hosts = (await this.getHosts(hostId)).filter((host) => host.pinnedSectionId == null);
    return (await this.findLegacyThreadOwnerInHosts(threadId, hosts, { hostId })) != null;
  }

  async movePinnedThread({ threadId, beforeThreadId, hostId }: { threadId: string; beforeThreadId: string | null; hostId?: string }): Promise<boolean | null> {
    const supportedHosts = await this.getSupportedHosts(hostId);
    const host =
      hostId == null
        ? await this.threadSectionEngine.findThreadOwner(threadId, supportedHosts as never, { throwOnAmbiguousOwner: true })
        : supportedHosts[0];
    if (host == null) return null;
    return this.runHostMutation((host as { migrationIdentity: string }).migrationIdentity, async () => {
      const owner = await this.threadSectionEngine.findThreadOwner(threadId, [host as never], { throwOnMissingThread: true });
      return owner == null ? null : this.threadSectionEngine.movePinnedThread(owner, { threadId, beforeThreadId });
    });
  }

  async getSupportedHosts(hostId?: string, context?: SectionOperationContext): Promise<SectionHost[]> {
    return (await this.getHosts(hostId, context)).filter((host) => host.pinnedSectionId != null);
  }

  /** 自定义段 host（原 `getCustomSectionHost`）：版本校验 + 连接绑定。 */
  async getCustomSectionHost(hostId: string, context?: SectionOperationContext): Promise<SectionHost> {
    context?.getConnection(hostId);
    context?.assertCurrent();
    const host = (await this.getSupportedHosts(hostId, context))[0];
    if (host == null || !(isSupportedAppServerVersion as (version: string) => boolean)(host.connection.appServerVersion))
      throw new Error("App server does not support custom thread sections");
    return this.bindSectionOperation(host, context);
  }

  private bindSectionOperation(host: SectionHost, context?: SectionOperationContext): SectionHost {
    if (context == null) return host;
    const connection = context.getConnection(host.hostId);
    const assertBound = () => {
      if (
        context.assertCurrent(),
        host.connection !== connection ||
        context.getConnection(host.hostId) !== connection ||
        this.appServerConnectionRegistry.getMaybeConnection(host.hostId) !== connection
      )
        throw new DOMException("Section operation connection retired", "AbortError");
    };
    assertBound();
    return { ...host, migrationIdentity: host.migrationIdentity } as SectionHost;
  }

  /** host 探测（原 `getHosts`）：pinned 段发现 + section_position 能力探测。 */
  async getHosts(hostId?: string, context?: SectionOperationContext): Promise<SectionHost[]> {
    const hostIds = hostId == null ? this.appServerConnectionRegistry.getAllHostIds() : [hostId];
    return (
      (await Promise.all(
        hostIds.map(async (id): Promise<SectionHost | null> => {
          const connection =
            context == null ? this.appServerConnectionRegistry.getMaybeConnection(id) : context.getConnection(id);
          const assertSource =
            context == null
              ? undefined
              : () => {
                  if ((context.assertCurrent(), context.getConnection(id) !== connection))
                    throw new DOMException("Section source retired", "AbortError");
                };
          assertSource?.();
          if (connection?.getConnectionState() !== "connected") return null;
          if (!this.observedConnections.has(connection)) {
            this.observedConnections.add(connection);
            connection.registerInternalAuthenticatedPrincipalChangeHandler(() => {
              this.threadLookupsByConnection.delete(connection);
            });
            connection.registerInternalNotificationHandler((notification) => {
              if (notification.method === "thread/started") {
                const parsed = (threadIdSchema as unknown as { safeParse(input: unknown): { success: boolean; data?: { thread: { id: string } } } }).safeParse(notification.params);
                if (parsed.success) this.threadLookupsByConnection.get(connection)?.delete(parsed.data!.thread.id);
              }
            });
            connection.registerInternalConnectionStateHandler((state) => {
              if (state !== "connected") {
                this.pinnedSectionIdsByConnection.delete(connection);
                this.threadLookupsByConnection.delete(connection);
              }
            });
          }
          const version = connection.appServerVersion;
          const supportedVersion = version != null && version !== "0.0.0" && (isSupportedAppServerVersion as (version: string) => boolean)(version) ? version : null;
          if ((version == null && !connection.isLocal) || (supportedVersion != null && !isVersionAtLeast(supportedVersion)))
            return { hostId: id, connection, pinnedSectionId: null };
          let pinnedSectionId = this.pinnedSectionIdsByConnection.get(connection);
          if (!this.pinnedSectionIdsByConnection.has(connection)) {
            if (supportedVersion != null) {
              pinnedSectionId = PINNED_SECTION_UUID;
            } else {
              pinnedSectionId = await this.findPinnedSectionId(connection, assertSource);
              if (pinnedSectionId != null) {
                try {
                  await connection.listThreads({ cursor: null, limit: 1, sectionId: pinnedSectionId, sortKey: "section_position" }, undefined, assertSource);
                } catch (error) {
                  if (
                    !(error instanceof Error) ||
                    !(
                      (isJsonRpcCode(error, -32602) && /^invalid params$/i.test(error.message)) ||
                      /(?:unknown variant|unsupported|invalid).*(?:section_position|sort)/i.test(error.message)
                    )
                  )
                    throw error;
                  pinnedSectionId = null;
                }
              }
            }
            assertSource?.();
            this.pinnedSectionIdsByConnection.set(connection, pinnedSectionId);
          }
          if (pinnedSectionId == null) return { hostId: id, connection, pinnedSectionId: null };
          const codexHome = await connection.codexHome();
          assertSource?.();
          return { hostId: id, migrationIdentity: `${id}:${codexHome}`, connection, pinnedSectionId };
        }),
      )).filter((host): host is SectionHost => host != null)
    );
  }

  /** pinned 段分页扫描（原 `findPinnedSectionId`）：不支持时返回 null。 */
  private async findPinnedSectionId(connection: HostConnection, beforeSendRequest?: () => void): Promise<string | null> {
    let cursor: string | null = null;
    do {
      let response: { data: Array<{ id: string }>; nextCursor: string | null };
      try {
        response = await connection.sendAppServerRequest("threadSection/list", { cursor, limit: 100 }, beforeSendRequest);
      } catch (error) {
        if (
          !(error instanceof Error) ||
          !(
            isJsonRpcCode(error, -32601) ||
            /method not found|unknown method|unsupported app-server method|unknown variant `threadSection\/list`|-32601/i.test(error.message)
          )
        )
          throw error;
        return null;
      }
      const pinned = response.data.find(({ id }) => id === PINNED_SECTION_UUID);
      if (pinned != null) return pinned.id;
      cursor = response.nextCursor;
    } while (cursor != null);
    throw new Error("App server does not expose the pinned thread section");
  }

  /** legacy pinned 迁移（原 `migrateLegacyPinnedThreads`）。 */
  private async migrateLegacyPinnedThreads(sectionedHosts: SectionHost[], legacyHosts: SectionHost[], cloudThreadIds: Set<string>): Promise<void> {
    const migratedIds = this.getMigratedThreadIds(sectionedHosts);
    const toMigrate = await Promise.all(
      readPinnedThreadIds(this.globalState)
        .filter((threadId) => !migratedIds.has(threadId) && !cloudThreadIds.has(threadId))
        .map(async (threadId) => {
          const sectionOwner = await this.threadSectionEngine.findThreadOwner(threadId, sectionedHosts, { forDiscovery: true });
          return sectionOwner != null && (await this.findLegacyThreadOwnerInHosts(threadId, legacyHosts, { forDiscovery: true })) != null
            ? { threadId, owner: null }
            : { threadId, owner: sectionOwner };
        }),
    );
    await Promise.all(
      toMigrate.flatMap(({ threadId, owner }) =>
        owner == null
          ? []
          : [
              this.runHostMutation(owner.migrationIdentity, async () => {
                if (this.getMigratedThreadIds([owner]).has(threadId)) return;
                const current = await this.threadSectionEngine.findThreadOwner(threadId, [owner], { throwOnMissingThread: true });
                if (current != null) {
                  if (!current.isPinned)
                    await this.threadSectionEngine.setThreadPinned(current, { threadId, pinned: true, beforeThreadId: null });
                  await this.markThreadMigrated(current.migrationIdentity, threadId);
                }
              }),
            ],
      ),
    );
  }

  private async findLegacyThreadOwnerInHosts(threadId: string, hosts: SectionHost[], opts: { hostId?: string; forDiscovery?: boolean } = {}): Promise<SectionHost | null> {
    const owners = (
      await Promise.all(
        hosts.map(async (host) => {
          try {
            return (await this.readThread(host.connection, threadId, opts.forDiscovery === true))?.id === threadId ? host : null;
          } catch (error) {
            if (opts.hostId != null || !(error instanceof Error) || !isThreadNotFound(error)) throw error;
            return null;
          }
        }),
      )
    ).filter((host): host is SectionHost => host != null);
    return owners.length === 1 ? (owners[0] ?? null) : null;
  }

  /** thread 读取（原 `readThread`）：discovery 时带缓存。 */
  private readThread(connection: HostConnection, threadId: string, useCache: boolean, beforeSendRequest?: () => void): Promise<{ id: string } | null> {
    let cache = this.threadLookupsByConnection.get(connection);
    return !useCache || beforeSendRequest != null
      ? (cache?.delete(threadId), connection.readThread(threadId, { includeTurns: false }, undefined, beforeSendRequest))
      : (cache ?? (cache = new RetryLookupCache<{ id: string }>((error) => isThreadNotFound(error)), this.threadLookupsByConnection.set(connection, cache)),
        cache.read(threadId, () => connection.readThread(threadId, { includeTurns: false })));
  }

  /** 已迁移线程集合（原 `getMigratedThreadIds`）：排除 pending 标记。 */
  private getMigratedThreadIds(hosts: Array<{ migrationIdentity?: string }>): Set<string> {
    const migrated = (this.globalState.get(STATE_KEYS.APP_SERVER_MIGRATED_PINNED_THREAD_IDS_BY_HOST) ?? {}) as Record<string, string[]>;
    const identities = hosts.map(({ migrationIdentity }) => migrationIdentity as string);
    return new Set(
      identities.flatMap((identity) =>
        (migrated[identity] ?? []).filter((threadId) => !this.pendingMigrationMarkers.has(`${identity}\0${threadId}`)),
      ),
    );
  }

  /** host 变更串行队列（原 `runHostMutation`）。 */
  private async runHostMutation<T>(identity: string, operation: () => Promise<T>): Promise<T> {
    const chained = (this.pendingHostMutations.get(identity) ?? Promise.resolve()).then(operation);
    const tail = chained.then(
      () => undefined,
      () => undefined,
    );
    this.pendingHostMutations.set(identity, tail);
    try {
      return await chained;
    } finally {
      if (this.pendingHostMutations.get(identity) === tail) this.pendingHostMutations.delete(identity);
    }
  }

  /** 迁移标记写入（原 `markThreadMigrated`）：flush 后清 pending 标记。 */
  private async markThreadMigrated(identity: string, threadId: string): Promise<void> {
    const marker = `${identity}\0${threadId}`;
    const migrated = (this.globalState.get(STATE_KEYS.APP_SERVER_MIGRATED_PINNED_THREAD_IDS_BY_HOST) ?? {}) as Record<string, string[]>;
    if (!migrated[identity]?.includes(threadId) || this.pendingMigrationMarkers.has(marker)) {
      if (!migrated[identity]?.includes(threadId))
        this.globalState.set(STATE_KEYS.APP_SERVER_MIGRATED_PINNED_THREAD_IDS_BY_HOST, {
          ...migrated,
          [identity]: [...(migrated[identity] ?? []), threadId],
        });
      this.pendingMigrationMarkers.add(marker);
      await this.globalState.flushOrThrow();
      this.pendingMigrationMarkers.delete(marker);
    }
  }
}

/** globalState 的 pinned 线程列表（原 `hH`：数组 + 去重）。 */
export function readPinnedThreadIds(globalState: GlobalStateLike): string[] {
  const stored = globalState.get(STATE_KEYS.PINNED_THREAD_IDS);
  return Array.isArray(stored) ? [...new Set((stored as unknown[]).filter((id): id is string => typeof id == "string"))] : [];
}

/** 最低版本判定（原 `be`：段功能需 0.147+）。 */
function isVersionAtLeast(version: string): boolean {
  const [major, minor] = version.split(".").map(Number);
  return major > 0 || minor >= 147;
}
