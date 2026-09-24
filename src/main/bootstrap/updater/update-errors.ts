// 更新失败分类：把任意异常归一为遥测用的失败原因结构。
//
// 对应 bootstrap-C4dRql4x.ts 24900-24950 行：
//   - `ej`（hresult/code 宽松提取 schema，.catch(void 0) 容错）
//   - `$` class UpdateError（reason + httpStatus 的业务更新错误）
//   - `tj()`（classifyUpdateFailure：cancelled/timeout/windows-error/filesystem-error/
//     network-error/invalid-manifest/invalid-json/unknown 分类链）
//
// 消费方：SparkleManager 的后端 appcast 上报（25279/25477 行）与
// main-C-Mhak1n.js（exports.c）。注意分类优先级与原文件逐字对齐：
//   aborted/AbortError → cancelled；UpdateError → 自带 reason；
//   TimeoutError → timeout；ZodError → invalid-manifest；SyntaxError →
//   invalid-json；再按 hresult / net::ERR_* / errno 依次判 windows/network/filesystem。

import {
  Cf as ofNumberSchema,
  df as enumSchema,
  wf as objectSchema,
  Ff as zodError,
} from "@chunk/shared";

// @chunk/shared 尚未重写，zod 构造器的链式方法（int/min/catch 等）类型不
// 完整——数字与枚举构造器按 any 使用。
const numberSchema = ofNumberSchema as any;
const enumSchemaFactory = enumSchema as any;

/** hresult/errno 宽松提取 schema（原 `ej`；解析失败字段归 void 0）。 */
const updateErrorDetailsSchema: any = objectSchema({
  hresult: numberSchema()
    .int()
    .min(0)
    .max(4294967295)
    .optional()
    .catch(void 0),
  code: enumSchemaFactory([
    "EACCES",
    "EBUSY",
    "EPERM",
    "ENOSPC",
    "ENOENT",
    "EIO",
    "EMFILE",
    "ENFILE",
    "EROFS",
  ]).optional()
    .catch(void 0),
});

/**
 * 业务更新错误（原 `$`）。
 * reason 语义由构造方决定（如 "http-error"）；httpStatus 为可空的 HTTP 状态码。
 */
export class UpdateError extends Error {
  reason: string;
  httpStatus: number | undefined;

  constructor(message: string, reason: string, httpStatus?: number) {
    super(message);
    this.reason = reason;
    this.httpStatus = httpStatus;
  }
}

/** 更新失败分类结果（原 `tj` 的返回形状）。 */
export interface UpdateFailureClassification {
  failureReason: string;
  hresult: number | undefined;
  httpStatus: number | undefined;
  networkErrorCode: string | undefined;
  systemErrorCode: string | undefined;
}

/**
 * 分类更新失败（原 `tj`）。
 * @param error 抛出的异常
 * @param signal 关联的 AbortSignal（aborted → cancelled）
 */
export function classifyUpdateFailure(
  error: unknown,
  signal?: AbortSignal,
): UpdateFailureClassification {
  const details = updateErrorDetailsSchema.safeParse(error);
  const hresult = details.success ? details.data.hresult : undefined;
  const systemErrorCode = details.success ? details.data.code : undefined;
  const networkErrorCode =
    error instanceof Error ? /^net::(ERR_[A-Z0-9_]{1,64})$/.exec(error.message)?.[1] : undefined;
  let failureReason = "unknown";
  if (
    signal?.aborted ||
    (error instanceof Error && error.name === "AbortError")
  ) {
    failureReason = "cancelled";
  } else if (error instanceof UpdateError) {
    failureReason = error.reason;
  } else if (error instanceof Error && error.name === "TimeoutError") {
    failureReason = "timeout";
  } else if (error instanceof zodError) {
    failureReason = "invalid-manifest";
  } else if (error instanceof SyntaxError) {
    failureReason = "invalid-json";
  } else if (hresult == null) {
    if (networkErrorCode == null) {
      if (systemErrorCode != null) failureReason = "filesystem-error";
    } else {
      failureReason = "network-error";
    }
  } else {
    failureReason = "windows-error";
  }
  return {
    failureReason,
    hresult,
    httpStatus: error instanceof UpdateError ? error.httpStatus : undefined,
    networkErrorCode,
    systemErrorCode,
  };
}
