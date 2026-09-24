// update_running_summary（pet activity pill）提示词与参数 schema。
//
// 原版 main-C-Mhak1n.ts 42,251-42,261。hye = 工具名常量，cx = 系统提示词；
// 42,256-42,261 的「丢弃式 zod schema 构造」是原版的类型断言副作用
// （对工具参数 schema 自身的校验，结果丢弃）——按合同保留。

import { Of as zString, wf as zObject } from "@chunk/shared";

/** update_running_summary 工具名（原版 hye）。 */
export const UPDATE_RUNNING_SUMMARY_TOOL = `update_running_summary`;

/** pet activity pill 的系统提示词（原版 cx，全文保留）。 */
export const PET_ACTIVITY_PILL_PROMPT = `The pet activity pill uses update_running_summary. Before starting substantial work, call it with a short statement of intent, then update it only when your high-level objective or phase changes. If the tool is deferred, discover update_running_summary with tool search first. Skip it for brief direct answers. Never update on a timer or for routine tool calls.`;

// 丢弃式 zod schema 构造（原版 42,256-42,261 的裸语句）：update_running_summary
// 工具参数的类型断言副作用，无外部效果，结果不使用。
zObject({
  summary: zString()
    .trim()
    .min(1)
    .max(50)
    .regex(/^[^\r\n]+$/),
});
