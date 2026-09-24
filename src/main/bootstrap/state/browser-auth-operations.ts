// 浏览器表单填充遥测与 conversational-onboarding schema。
//
// 原版位于 bootstrap-C4dRql4x.ts 21863-21992 区段（本文件不含 21863-21869 的
// Sparkle 辅助 qT/JT，它们属于 updater 区段）。内容分两部分：
//   - BrowserAuthOperationsStore（eE）：以 RPC target 形式暴露的浏览器认证
//     表单填充操作账本（read/claim/settle），持久化经 `electron-browser-auth-
//     operations` 键（TE，见 state/global-state）由 GlobalState 承载；
//   - conversational-onboarding（nE/rE/iE）：onboarding 完成结果的 zod schema
//     及 completions 列表 schema，rE/iE 被 state/global-state 的 schema 表引用。
//
// 注意：21980 行原版有一条「丢弃结果」的顶层 zod 校验（把 onboarding 结果
// schema 转 JSON Schema 再用 record(string, json) 解析一遍），本文件保持该
// 模块加载即执行的副作用。

import {
  // @chunk/shared 的 zod 工厂字母导出。其中 Of/Cf/vf 在声明里类型过窄
  // （只有 safeParse，无链式方法），下方统一断言为 any 使用（运行时为 zod schema）。
  Of as stringSchemaFactory,
  Cf as numberSchemaFactory,
  vf as discriminatedUnionFactory,
  Df as looseObject,
  wf as object,
  Pf as uuid,
  df as enumSchema,
  gf as booleanSchema,
  hf as array,
  bf as literal,
  Nf as url,
  Ef as record,
  yf as json,
  Rf as toJSONSchema,
  Uf as RpcTarget,
} from "@chunk/shared";

const string = stringSchemaFactory as unknown as () => any;
const number = numberSchemaFactory as unknown as () => any;
const discriminatedUnion = discriminatedUnionFactory as unknown as any;

/** 浏览器表单填充上下文里各 ID 的约束（1..256 字符）。 */
const id = string().min(1).max(256);
/** 浏览器表单填充上下文：用户/账户/主机/会话/挑战 ID。 */
export const browserAuthContextSchema = looseObject({
  userId: id,
  accountId: id,
  hostId: id,
  conversationId: id,
  challengeId: id,
});
/** 表单填充状态枚举（unknown 表示未知/未终态）。 */
export const FILL_STATUSES = [
  `unknown`,
  `submitted`,
  `declined`,
  `cancelled`,
  `unavailable`,
  `expired`,
  `origin_changed`,
  `page_changed`,
  `locator_invalid`,
  `submission_failed`,
] as const;
/** 保存凭据状态枚举。 */
export const SAVE_STATUSES = [`not_requested`, `saved`, `failed`, `unknown`] as const;
/** 单条表单填充操作。 */
export const browserAuthOperationSchema = looseObject({
  operationId: uuid(),
  fillStatus: enumSchema(FILL_STATUSES),
  saveStatus: enumSchema(SAVE_STATUSES),
  statusAvailable: booleanSchema(),
  selectionId: uuid().optional(),
});
/** 账本条目：上下文 + 操作 + 终态时间戳。 */
export const browserAuthEntrySchema = looseObject({
  context: browserAuthContextSchema,
  operation: browserAuthOperationSchema,
  finishedAtMs: number().nonnegative().optional(),
});
/** 账本整体（entries 列表），持久化在 `electron-browser-auth-operations` 键下。 */
export const browserAuthOperationsSchema = looseObject({
  entries: array(browserAuthEntrySchema),
});

/**
 * 浏览器表单填充操作账本（RPC target）。
 *
 * 构造时注入 `update`：以原子读改写的方式对持久化值应用一次变换（由
 * GlobalState.updateAndPersist 提供）。读取/认领/结算共用 24h 窗口淘汰
 * 已完成超过一天的条目（86400000ms）。
 */
export class BrowserAuthOperationsStore extends RpcTarget {
  #update: <T>(updater: (current: unknown) => { value: unknown; result: T }) => Promise<T>;

  constructor(update: <T>(updater: (current: unknown) => { value: unknown; result: T }) => Promise<T>) {
    super();
    this.#update = update;
  }

  /** 读取指定上下文当前挂起的操作（无则 null）。 */
  async read(context: unknown) {
    const key = JSON.stringify(browserAuthContextSchema.parse(context));
    return this.#update((current) => {
      const value = parseBrowserAuthOperations(current);
      return {
        value,
        result: value.entries.find((e: any) => JSON.stringify(e.context) === key)?.operation ?? null,
      };
    });
  }

  /** 认领（登记）一次填充操作；同一上下文重复认领返回已存在的操作。 */
  async claim(context: unknown, operation: unknown) {
    const parsedContext = browserAuthContextSchema.parse(context);
    const parsedOperation = browserAuthOperationSchema.parse(operation);
    const key = JSON.stringify(parsedContext);
    return this.#update((current) => {
      const value = parseBrowserAuthOperations(current);
      const existing = value.entries.find((e: any) => JSON.stringify(e.context) === key);
      if (existing != null) return { value, result: { created: false, operation: existing.operation } };
      const cutoff = Date.now() - 86400000;
      return {
        value: {
          entries: [
            ...value.entries.filter((e: any) => e.finishedAtMs == null || e.finishedAtMs > cutoff),
            { context: parsedContext, operation: parsedOperation },
          ],
        },
        result: { created: true, operation: parsedOperation },
      };
    });
  }

  /**
   * 结算一次填充操作：按 operationId 定位，合并 fillStatus/saveStatus
   * （unknown 不覆盖旧值）；两者都非 unknown 时补记 finishedAtMs，否则清除。
   */
  async settle(context: unknown, operation: unknown) {
    const key = JSON.stringify(browserAuthContextSchema.parse(context));
    const parsedOperation = browserAuthOperationSchema.parse(operation);
    return this.#update((current) => ({
      value: {
        entries: parseBrowserAuthOperations(current).entries.map((e: any) => {
          if (JSON.stringify(e.context) !== key || e.operation.operationId !== parsedOperation.operationId)
            return e;
          const merged = {
            ...e.operation,
            fillStatus: parsedOperation.fillStatus === `unknown` ? e.operation.fillStatus : parsedOperation.fillStatus,
            saveStatus: parsedOperation.saveStatus === `unknown` ? e.operation.saveStatus : parsedOperation.saveStatus,
          };
          return {
            ...e,
            operation: merged,
            finishedAtMs:
              merged.fillStatus !== `unknown` && merged.saveStatus !== `unknown`
                ? (e.finishedAtMs ?? Date.now())
                : void 0,
          };
        }),
      },
      result: void 0,
    }));
  }
}

/** 解析持久化账本值（null/undefined 视为空账本）。 */
function parseBrowserAuthOperations(value: unknown) {
  return value == null ? { entries: [] } : browserAuthOperationsSchema.parse(value);
}

/** conversational-onboarding 完成结果：completed 带 url，not_completed 仅带说明。 */
export const conversationalOnboardingResultSchema = discriminatedUnion(`outcome`, [
  looseObject({
    outcome: literal(`completed`),
    output: string()
      .trim()
      .min(1)
      .describe(
        `A concise, user-facing summary of the completed result. Follow any task-specific output instructions.`,
      ),
    url: url().describe(`The URL of the created or affected resource.`),
  }),
  looseObject({
    outcome: literal(`not_completed`),
    output: string()
      .trim()
      .min(1)
      .describe(
        `A friendly, first-person, user-facing sentence explaining that the goal could not be completed. Omit technical details, tool names, raw constraints, time zones, and error text.`,
      ),
  }),
]);

// 原版 21980 行：丢弃结果的顶层校验——把 onboarding 结果 schema 转 JSON
// Schema，再用 record(string, json) 解析一遍。保留模块加载即执行的副作用
// （原版把解析结果包在一层对象展开后丢弃，此处等价仅保留校验本身）。
record(string(), json()).parse(toJSONSchema(conversationalOnboardingResultSchema));

/** conversational-onboarding 完成记录的持久化键。 */
export const CONVERSATIONAL_ONBOARDING_COMPLETIONS_KEY = `electron-conversational-onboarding-completions-v1`;
/** conversational-onboarding 完成记录列表 schema（被 global-state 的 schema 表引用）。 */
export const conversationalOnboardingCompletionsSchema = array(
  object({
    accountId: string().min(1),
    userId: string().min(1),
    hostId: literal(`local`),
    conversationId: string().min(1),
    selectedTask: string().min(1),
    isRevert: booleanSchema().optional(),
    completion: conversationalOnboardingResultSchema.nullable(),
  }),
);
