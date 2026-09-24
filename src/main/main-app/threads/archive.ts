// 归档/取消归档流程（部分）。
//
// 原版 main-C-Mhak1n.ts 41,278-41,285。本文件先落地错误类型与 schema；
// 归档执行流（ub/db/fb/pb/mb/hb，41,286-41,455）与 side conversation
// 提示词（gb）、token_budget history notes 配置（_b/vb/yb/bb）尚未重写。

import { Of as zString, wf as zObject } from "@chunk/shared";

/**
 * 取消归档后无法装载会话的错误（原版 sb）。unarchive 流程读到该错误时
 * 保留归档状态并提示。
 */
export class UnarchivedConversationLoadError extends Error {
  constructor(conversationId: string) {
    super(`Unarchived conversation ${conversationId} could not be loaded`);
    this.name = `UnarchivedConversationLoadError`;
  }
}

/** 错误响应体 schema（原版 cb，宽松对象）。 */
export const errorBodySchema = zObject({ message: zString() }).loose();

/** 错误响应 schema（原版 lb，宽松对象）。 */
export const errorResponseSchema = zObject({ error: errorBodySchema }).loose();
