// remote-control 顶层可变状态（原版 14,755-14,791 区段 + 783 nee 常量）。
//
// 职责（深析 §4 顶层可变状态 Ou/ku/Au 的全部读写方）：
//   - enabled scope 集合（原 Ou）：setRemoteControlEnabled（ju）写、
//     isRemoteControlEnabled（Lce）读；scope 默认 `default`；
//   - 会话活跃 scope 集合（原 ku）：setRemoteControlSessionActive（Mu）写、
//     isRemoteControlSessionActive（Rce）读；
//   - scope→会话明细 Map（原 Au）：accountId/userId/threadIds；聚合读取
//     （zce）在多个会话同属一个身份时合成一个带 TTL 的合并会话；
//   - 安装前快照（Bce）：saveForInstall / clearAfterAbort。
//
// 消费方（区间外）：67,301（窗口失焦时检测会话活跃）、123,719/160,409
// （会话活跃登记）、162,221、176,167（启动装配）。
//
// 语义不确定点：
//   - `Mu(e, t, n)` 的第三参（会话明细）在 123,720 一带以
//     `{ accountId, userId, threadIds }` 形态出现，据此定义类型；原版无显式
//     类型标注。
//   - zce 聚合后的 `expiresAtMs` 仅由消费方比对时钟，本模块不维护过期。

import { RESUME_STATE_TTL_MS } from "./delegation";

/** remote-control 会话明细（Au 的值形态）。 */
export interface RemoteControlSession {
  accountId: string;
  userId: string;
  threadIds: string[];
}

/** enabled scope 集合（原 Ou，14,755）。 */
const remoteControlEnabledScopes = new Set<string>();

/** 会话活跃 scope 集合（原 ku，14,756）。 */
const remoteControlActiveScopes = new Set<string>();

/** scope→会话明细（原 Au，14,757）。 */
const remoteControlSessions = new Map<string, RemoteControlSession>();

/** 是否任一 scope 启用了 remote control（原 Lce，14,758-14,760）。 */
export function isRemoteControlEnabled(): boolean {
  return remoteControlEnabledScopes.size > 0;
}

/** 登记某 scope 的 remote control 开关（原 ju，14,761-14,763）。 */
export function setRemoteControlEnabled(enabled: boolean, scope = `default`): void {
  if (enabled) remoteControlEnabledScopes.add(scope);
  else remoteControlEnabledScopes.delete(scope);
}

/** 是否有活跃 remote-control 会话（原 Rce，14,764-14,766）。 */
export function isRemoteControlSessionActive(): boolean {
  return remoteControlActiveScopes.size > 0;
}

/**
 * 登记某 scope 的会话活跃状态（原 Mu，14,767-14,770）：
 * active 且带明细（threadIds 非空）时登记会话，否则移除。
 */
export function setRemoteControlSessionActive(
  active: boolean,
  scope = `default`,
  session: RemoteControlSession | null = null,
): void {
  if (active) remoteControlActiveScopes.add(scope);
  else remoteControlActiveScopes.delete(scope);
  if (active && session != null && session.threadIds.length > 0)
    remoteControlSessions.set(scope, session);
  else remoteControlSessions.delete(scope);
}

/**
 * 聚合当前活跃会话（原 zce，14,771-14,781）：所有会话必须是同一
 * accountId/userId，否则返回 null；threadIds 去重合并，expiresAtMs 以
 * 当前时间 + RESUME_STATE_TTL_MS（原 nee = 9e5）计算。
 */
export function getAggregatedRemoteControlSession():
  | (RemoteControlSession & { expiresAtMs: number })
  | null {
  let sessions = [...remoteControlSessions.values()];
  let first = sessions[0];
  return first == null ||
    sessions.some(
      ({ accountId, userId }) => accountId !== first.accountId || userId !== first.userId,
    )
    ? null
    : {
        ...first,
        expiresAtMs: Date.now() + RESUME_STATE_TTL_MS,
        threadIds: [...new Set(sessions.flatMap(({ threadIds }) => threadIds))],
      };
}

/**
 * 「安装前会话快照」句柄（原 Bce，14,782-14,791）：
 * - saveForInstall：取聚合会话、回调保存；记下「保留会话」（quitImmediately
 *   === false）标记；
 * - clearAfterAbort：仅当曾 saveForInstall 一个「不立即退出」的会话时清空，
 *   返回是否真的执行了清空。
 */
export function createRemoteControlInstallSnapshot(
  save: (session: (RemoteControlSession & { expiresAtMs: number }) | null) => void,
): { saveForInstall: (opts?: { quitImmediately?: boolean } | null) => ReturnType<typeof getAggregatedRemoteControlSession>; clearAfterAbort: () => boolean } {
  let savedKeepAlive = false;
  return {
    saveForInstall: (opts) => {
      let session = getAggregatedRemoteControlSession();
      save(session);
      savedKeepAlive = session != null && opts?.quitImmediately === false;
      return session;
    },
    clearAfterAbort: () =>
      savedKeepAlive ? ((savedKeepAlive = false), save(null), true) : false,
  };
}
