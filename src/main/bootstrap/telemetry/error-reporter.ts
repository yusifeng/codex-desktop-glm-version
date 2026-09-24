// 错误上报门面：统一的 report / reportNonFatal / reportFatal 接口，
// 包装底层 capture 回调并吞掉回调自身抛出的异常。
// 对应 bootstrap-C4dRql4x.ts 255-268 行（De/Oe）。

export type ErrorSeverity = "non-fatal" | "fatal";

/** 上报附加上下文（jO 装配处的 sink 读取 groupingFingerprint / tags / extra）。 */
export interface ErrorReportContext {
  /** 上报类别标记（如 `file-based-logger`、`datadog-log-sink-failure`）。 */
  kind?: string;
  groupingFingerprint?: string;
  tags?: Record<string, unknown>;
  extra?: Record<string, unknown>;
}

export interface ErrorReporter {
  /** 原样透传（error, severity, context）；字符串错误会先包成 Error。 */
  report(error: unknown, severity?: ErrorSeverity, context?: ErrorReportContext): void;
  reportNonFatal(error: unknown, context?: ErrorReportContext): void;
  reportFatal(error: unknown, context?: ErrorReportContext): void;
}

/** 底层 capture 回调（例如 Sentry captureException 的包装）。 */
export type ErrorReportSink = (
  error: Error,
  severity: ErrorSeverity | undefined,
  context: ErrorReportContext | undefined,
) => void;

/** 空实现（原 De）。 */
export const noopErrorReporter: ErrorReporter = {
  report: () => {},
  reportNonFatal: () => {},
  reportFatal: () => {},
};

/** 构造错误上报门面（原 Oe）：字符串错误包成 Error，sink 抛错被吞掉。 */
export function createErrorReporter(sink: ErrorReportSink): ErrorReporter {
  const report = (error: unknown, severity?: ErrorSeverity, context?: ErrorReportContext) => {
    const normalized = typeof error === "string" ? Error(error) : error;
    try {
      sink(normalized as Error, severity, context);
    } catch {}
  };
  return {
    report,
    reportNonFatal: (error, context) => report(error, "non-fatal", context),
    reportFatal: (error, context) => report(error, "fatal", context),
  };
}
