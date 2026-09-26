// shared chunk：线程标识/广播版本/注解上下文/状态颜色
//（browser-context 分区，settings-threads 子区）。
//
// 对应 src-DldfpmrL.ts 的 L15,225（Cte）、L17,386-17,427（Sy/Oy/ky）、
// L17,430-17,437（My/Ny）、L17,590-17,636 区段：
//   - Pv（$u）：恒等（消费名 threadIdOf/normalizeThreadId/identity）
//   - sb + cb（hu）：`client-new-thread:` 前缀的本地线程 id 判定
//   - rb + ib（mu）：线程广播消息版本表（23 项：stream-state 11、
//     follower-interrupt 4、read-state 3、archived/queued 2…）——
//     broadcastVersionOf
//   - xy + Sy（Lu）：浏览器上下文种类（diff/browser/pdf/
//     artifact_annotation）+ origin 校验
//   - My（gu）：注解流（batch/quick）+ Ny 流配置（saved+persistent /
//     direct+非持久）
//   - Dy + Oy（Fu）：注解名提取（≤128 字符、无控制字符、trim 非空）
//   - Cy + Ty + Ey + ky（Pu）：注解元数据受限提取——纯对象原型、
//     ≤6 键、key 格式校验（非 __proto__/constructor/prototype）、
//     值 string(≤256)/number/boolean/null、序列化 ≤2048 字节
//   - Cte（tf）：线程状态 → dock 徽章颜色（working 蓝 0x3052FE、
//     unread 绿 0x00FF4C、idle 白、awaiting 橙 0xFFC060、error 红
//     0xFF0033、off 黑）
//
// 兼容导出：$u=Pv、hu=cb、mu=ib、gu=My、Lu=Sy、Fu=Oy、Pu=ky、tf=Cte。

import { z } from "zod";

// ---------------------------------------------------------------------------
// 线程 id（原 `Pv`/`sb`/`cb`）
// ---------------------------------------------------------------------------

/** thread id 恒等（原 `Pv`，导出 `$u`——消费名 threadIdOf）。 */
export function threadIdOf<T>(value: T): T {
  return value;
}

/** 本地线程 id 前缀（原 `sb`）。 */
const CLIENT_NEW_THREAD_PREFIX = "client-new-thread:";

/** 本地线程 id 判定（原 `cb`，导出 `hu`）。 */
export function isValidThreadId(threadId: string): boolean {
  return threadId.startsWith(CLIENT_NEW_THREAD_PREFIX);
}

// ---------------------------------------------------------------------------
// 广播版本表（原 `rb`/`ib`）
// ---------------------------------------------------------------------------

/** 线程广播消息版本表（原 `rb`）。 */
const BROADCAST_VERSIONS: Record<string, number> = {
  "thread-stream-state-changed": 11,
  "thread-stream-following-changed": 1,
  "thread-stream-following-status-requested": 1,
  "ipc-connection-reset": 1,
  "thread-read-state-changed": 3,
  "thread-archived": 2,
  "thread-unarchived": 1,
  "thread-owner-discovery": 1,
  "thread-follower-start-turn": 2,
  "thread-follower-load-complete-history": 1,
  "thread-follower-compact-thread": 1,
  "thread-follower-steer-turn": 1,
  "thread-follower-interrupt-turn": 4,
  "thread-follower-update-thread-settings": 2,
  "thread-follower-update-daybreak": 1,
  "thread-follower-edit-last-user-turn": 2,
  "thread-follower-command-approval-decision": 1,
  "thread-follower-file-approval-decision": 1,
  "thread-follower-permissions-request-approval-response": 1,
  "thread-follower-submit-user-input": 1,
  "thread-follower-submit-mcp-server-elicitation-response": 1,
  "thread-follower-set-queued-follow-ups-state": 1,
  "thread-queued-followups-changed": 2,
};

/** 广播消息版本（原 `ib`，导出 `mu`；未知消息 0）。 */
export function broadcastVersionOf(messageType: string): number {
  const version = BROADCAST_VERSIONS[messageType];
  return version === undefined ? 0 : version;
}

// ---------------------------------------------------------------------------
// 浏览器上下文种类（原 `xy`/`Sy`）
// ---------------------------------------------------------------------------

/** 浏览器上下文种类（原 `xy`）。 */
export const BROWSER_CONTEXT_KINDS = {
  DIFF: "diff",
  BROWSER: "browser",
  PDF: "pdf",
  ARTIFACT_ANNOTATION: "artifact_annotation",
} as const;

/** 上下文 origin 校验（原 `Sy`，导出 `Lu`）。 */
export function parseBrowserContextKind(context: { origin: string }): (typeof BROWSER_CONTEXT_KINDS)[keyof typeof BROWSER_CONTEXT_KINDS] | null {
  const origin = context.origin;
  return origin === BROWSER_CONTEXT_KINDS.DIFF ||
    origin === BROWSER_CONTEXT_KINDS.BROWSER ||
    origin === BROWSER_CONTEXT_KINDS.PDF ||
    origin === BROWSER_CONTEXT_KINDS.ARTIFACT_ANNOTATION
    ? origin
    : null;
}

// ---------------------------------------------------------------------------
// 注解流（原 `My`/`Ny`/`Py`）
// ---------------------------------------------------------------------------

/** 注解流（原 `My`，导出 `gu`）。 */
export const ANNOTATION_FLOWS = {
  BATCH: "batch",
  QUICK: "quick",
} as const;

/** 流配置（原 `Ny`）。 */
const ANNOTATION_FLOW_CONFIGS: Record<string, { defaultSubmitMode: string; persistent: boolean }> = {
  [ANNOTATION_FLOWS.BATCH]: { defaultSubmitMode: "saved", persistent: true },
  [ANNOTATION_FLOWS.QUICK]: { defaultSubmitMode: "direct", persistent: false },
};

/** 流配置读取（原 `Py`；缺省 batch）。 */
export function annotationFlowConfig(flow?: string | null): { defaultSubmitMode: string; persistent: boolean } {
  return ANNOTATION_FLOW_CONFIGS[flow ?? ANNOTATION_FLOWS.BATCH];
}

// ---------------------------------------------------------------------------
// 注解名与元数据（原 `Cy`..`ky`）
// ---------------------------------------------------------------------------

/** 元数据限制（原 `Cy`）。 */
const METADATA_LIMITS = { maxSerializedBytes: 2048, maxKeys: 6, maxKeyLength: 64, maxStringValueLength: 256 } as const;

/** 无控制字符字符串（原 `wy`）。 */
const controlFreeString = z.string().regex(/^[^\p{Cc}\p{Cf}\p{Cs}\u2028\u2029]*$/u);

/** 合法 key（原 `Ty`：标识符风格 + 保留名拒绝）。 */
const metadataKey = z
  .string()
  .max(METADATA_LIMITS.maxKeyLength)
  .regex(/^[A-Za-z][A-Za-z0-9_-]*(?: [A-Za-z0-9_-]+)*$/)
  .refine((key) => key !== "__proto__" && key !== "constructor" && key !== "prototype");

/** 值联合（原 `Ey`）。 */
const metadataValue = z.union([
  controlFreeString.max(METADATA_LIMITS.maxStringValueLength),
  z.number(),
  z.boolean(),
  z.null(),
]);

/** 注解名（原 `Dy`：≤128、无控制字符、trim 非空）。 */
const annotationNameSchema = controlFreeString.max(128).refine((name) => name.trim().length > 0);

/** 注解名提取（原 `Oy`，导出 `Fu`）。 */
export function parseElementName(name: unknown): string | undefined {
  const parsed = annotationNameSchema.safeParse(name);
  return parsed.success ? parsed.data : undefined;
}

/** 序列化预算（原 `Ay`）。 */
function withinSerializedBudget(text: string): boolean {
  return (
    text.length <= METADATA_LIMITS.maxSerializedBytes &&
    new TextEncoder().encode(text).byteLength <= METADATA_LIMITS.maxSerializedBytes
  );
}

/**
 * 注解元数据受限提取（原 `ky`，导出 `Pu`）。
 * 仅接受纯对象原型、≤6 键、全 enumerable 自有值；键值经 zod 校验；
 * 序列化超 2048 字节拒绝。任何不满足返回 undefined。
 */
export function parseElementMetadata(input: unknown): Record<string, string | number | boolean | null> | undefined {
  if (typeof input != "object" || !input) return undefined;
  try {
    const prototype = Object.getPrototypeOf(input);
    if (prototype !== Object.prototype && prototype != null) return undefined;
    const descriptors = Object.getOwnPropertyDescriptors(input);
    const keys = Reflect.ownKeys(descriptors);
    if (
      keys.length > METADATA_LIMITS.maxKeys ||
      keys.some((key) => !metadataKey.safeParse(key).success) ||
      Object.values(descriptors).some((descriptor) => !descriptor.enumerable || !Object.hasOwn(descriptor, "value"))
    )
      return undefined;
    const entries = Object.entries(descriptors).map(([key, descriptor]) => [key, descriptor.value] as const);
    const parsed = z.record(metadataKey, metadataValue).safeParse(Object.fromEntries(entries));
    return !parsed.success || !withinSerializedBudget(JSON.stringify(parsed.data)) ? undefined : (parsed.data as Record<string, string | number | boolean | null>);
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// 线程状态颜色（原 `Cte`，导出 `tf`）
// ---------------------------------------------------------------------------

/**
 * 线程状态 → dock 徽章颜色（原 `Cte`，导出 `tf`；0xRRGGBB）。
 * working 蓝 0x304FFE、unread 绿 0x00FF4C、idle 白、awaiting 橙
 * 0xFF6D00、error 红 0xFF0033、off 黑。
 */
export function colorForThreadStatus(status: string): number {
  switch (status) {
    case "working":
      return 0x304ffe;
    case "unread":
      return 0x00ff4c;
    case "idle":
      return 0xffffff;
    case "awaiting-approval":
    case "awaiting-response":
      return 0xff6d00;
    case "error":
      return 0xff0033;
    case "off":
      return 0;
  }
}

// ---------------------------------------------------------------------------
// 兼容导出（browser-context 分区 8 个压缩名）
// ---------------------------------------------------------------------------

export {
  threadIdOf as $u,
  isValidThreadId as hu,
  broadcastVersionOf as mu,
  ANNOTATION_FLOWS as gu,
  parseBrowserContextKind as Lu,
  parseElementName as Fu,
  parseElementMetadata as Pu,
  colorForThreadStatus as tf,
};
