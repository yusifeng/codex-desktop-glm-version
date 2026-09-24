// computer-use 线程活跃跟踪（原 main-C-Mhak1n.ts 14,980-15,032 行的
// `Qce/$ce/Lu/ele`）。
//
// 订阅 app-server 内部通知，把 computer-use 工具调用映射为线程活跃状态：
//   - item/started、item/completed：mcpToolCall 且 server 为 computer-use
//     （或 toolSurface 元数据标记 computerUse）→ 线程活跃。
//   - turn/completed → 线程不活跃。
//   - thread/archived/closed/deleted → 不活跃；deleted 额外回调 onTaskDeleted。
//
// 返回 dispose 函数：注销通知 + 对全部活跃线程发不活跃回调。
//
// 本模块无模块加载期副作用。

// @chunk/shared 的压缩名导出，按语义重命名导入：
//   wf/Of/Mf/bf → zod 构造器（object/string/unknown/literal）
//   tu → computer-use server 判定（server 名 → 是否 computer-use MCP）
import { bf as literalSchema_, Mf as unknownSchema_, Of as stringSchema_, tu as isComputerUseServerName, wf as objectSchema_ } from "@chunk/shared";

// 压缩名导入后重绑为 any：d.ts 的 Schema 接口未声明 zod 的链式方法
//（.optional()/.nullish()/.safeParse() 等）。
const objectSchema: any = objectSchema_;
const stringSchema: any = stringSchema_;
const unknownSchema: any = unknownSchema_;
const literalSchema: any = literalSchema_;

/** toolSurface 元数据 schema（原 `Qce`）。 */
const toolSurfaceSchema: any = objectSchema({
  "codex/toolSurface": objectSchema({ kind: literalSchema(`computerUse`) }),
});

/** item 通知 schema（原 `$ce`）。 */
const itemNotificationSchema: any = objectSchema({
  params: objectSchema({
    item: objectSchema({
      result: objectSchema({ _meta: unknownSchema().optional() }).nullish(),
      server: stringSchema(),
      type: literalSchema(`mcpToolCall`),
    }),
    threadId: stringSchema(),
  }),
});

/** thread 通知 schema（原 `Lu`）。 */
const threadNotificationSchema: any = objectSchema({ params: objectSchema({ threadId: stringSchema() }) });

/** app-server 连接的最小面（注册内部通知处理器）。 */
interface AppServerConnectionLike {
  registerInternalNotificationHandler(
    handler: (notification: { method: string; params?: any }) => void,
  ): () => void;
}

/**
 * 订阅 computer-use 线程活跃（原 `ele`）。
 *
 * onActivityChanged(threadId, active) 在状态翻转时触发；
 * onTaskDeleted(threadId) 在 thread/deleted 时触发。
 */
export function trackComputerUseActivity({
  appServerConnection,
  onActivityChanged,
  onTaskDeleted,
}: {
  appServerConnection: AppServerConnectionLike;
  onActivityChanged: (threadId: string, active: boolean) => void;
  onTaskDeleted: (threadId: string) => void;
}): () => void {
  const activeThreads = new Set<string>();
  const setActive = (threadId: string, active: boolean) => {
    if (active !== activeThreads.has(threadId)) {
      if (active) activeThreads.add(threadId);
      else activeThreads.delete(threadId);
      onActivityChanged(threadId, active);
    }
  };
  const unsubscribe = appServerConnection.registerInternalNotificationHandler((notification) => {
    switch (notification.method) {
      case `item/started`:
      case `item/completed`: {
        const parsed = itemNotificationSchema.safeParse(notification);
        if (!parsed.success) return;
        const { item, threadId } = parsed.data.params;
        if (
          item.server === `computer-use` ||
          (isComputerUseServerName(item.server) && toolSurfaceSchema.safeParse(item.result?._meta).success)
        )
          setActive(threadId, true);
        return;
      }
      case `turn/completed`: {
        const parsed = threadNotificationSchema.safeParse(notification);
        if (parsed.success) setActive(parsed.data.params.threadId, false);
        return;
      }
      case `thread/archived`:
      case `thread/closed`:
      case `thread/deleted`: {
        const parsed = threadNotificationSchema.safeParse(notification);
        if (!parsed.success) return;
        const { threadId } = parsed.data.params;
        setActive(threadId, false);
        if (notification.method === `thread/deleted`) onTaskDeleted(threadId);
        return;
      }
      default:
        return;
    }
  });
  return () => {
    unsubscribe();
    for (const threadId of activeThreads) onActivityChanged(threadId, false);
    activeThreads.clear();
  };
}
