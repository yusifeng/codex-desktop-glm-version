// Desktop OTEL tracing 装配（bootstrap 23028-23200 行重写）。
//
// setupDesktopTracing（原始 xO）装配 NodeTracerProvider（W3C propagator + 父采样
// 优先的比率采样 + BatchSpanProcessor + 自定义 OTLP-JSON exporter），并把一套
// tracing 桥注入 shared chunk（n.na），让 app-server 侧代码能在当前 span 上记录
// 属性/结局、发起子 span。exportTracePayload（原始 EO）是 exporter 的出口：
// electron-main 进程仅在采样率 > 0 时导出，其余进程（utility/renderer 等）始终
// 经由注册的回调导出。bindWebsiteReporting（原始 kO）把 analytics 开关绑定到每个
// session 的网站数据上报。
import { app, session } from "electron";
import { na as installSharedTracingBridge, ta as errorToSpanAttributes } from "@chunk/shared";
import {
  Ay as AsyncLocalStorageContextManager,
  Bi as W3CPropagator,
  J as otelApi,
  X as SamplingDecision,
  fg as BatchSpanProcessor,
  gi as ExportResultCode,
  ng as ParentBasedSampler,
  pO as otlpJsonSerializer,
  qh as resourceFromAttributes,
  rg as TraceIdRatioBasedSampler,
  xg as NodeTracerProvider,
} from "../vendor";

// ---- 模块级可变状态（原始 mO/hO/gO/_O/vO/yO）----
/** 全局 W3C propagator 实例（traceparent 注入/提取）。 */
const globalPropagator = new W3CPropagator();
/** trace 导出回调（由外部通过 setTraceExporter 注入）。 */
let traceExporterCallback: ((payload: Uint8Array) => Promise<void>) | null = null;
/** 已装配的 NodeTracerProvider（setupDesktopTracing 之前为 null）。 */
let tracerProvider: InstanceType<typeof NodeTracerProvider> | null = null;
/** 当前生效的比率采样器。 */
let currentSampler = new TraceIdRatioBasedSampler(0);
/** 当前 trace 采样率（0~1）。 */
let traceSampleRate = 0;
/** 本进程是否是 electron-main（决定 exportTracePayload 的门控行为）。 */
let isElectronMainProcess = false;

/**
 * 父采样优先的组合采样器（原始 bO）：任一 link 的父 context 已采样则直接采样，
 * 否则委托给当前比率采样器。
 */
const parentRespectingSampler = {
  // shouldSample(context, traceId, spanName, spanKind, attributes, links)——links 是第 6 参。
  shouldSample: (context: unknown, traceId: string, ...rest: unknown[]) =>
    (rest[3] as { context: { traceFlags: number } }[] | undefined)?.some(
      ({ context }) => (context.traceFlags & otelApi.TraceFlags.SAMPLED) !== 0,
    )
      ? { decision: SamplingDecision.RECORD_AND_SAMPLED }
      : currentSampler.shouldSample(context, traceId),
  toString: () => currentSampler.toString(),
};

/** 注入 shared chunk 的 tracing 桥规格（startSpan 的请求与回调）。 */
interface TracingBridgeSpec {
  name: string;
  op: string;
  root?: boolean;
  trace?: { traceparent?: string; tracestate?: string } | null;
  attributes?: Record<string, unknown>;
  links?: string[];
  startTimeMs?: number;
  endTimeMs?: number;
}

/** setupDesktopTracing 的启动配置（即 desktop-sentry 的 SENTRY_STARTUP_CONFIG）。 */
export interface TracingStartupConfig {
  buildFlavor: string;
  buildNumber: string | undefined;
  appVersion: string;
  desktopTraceSampleRate: number;
}

/**
 * 装配 desktop tracing（原始 xO）。
 *
 * 顺序：设置全局 context manager → 记录采样率/进程角色/导出回调 → 构造
 * NodeTracerProvider（resource 带 codex.* 属性）→ 取 tracer → 注入 shared
 * tracing 桥。exportTracePayloadCallback 可选（原始第三参 r）。
 */
export function setupDesktopTracing(
  startupConfig: TracingStartupConfig,
  processRole: string,
  exportTracePayloadCallback?: (payload: Uint8Array) => Promise<void>,
): void {
  otelApi.context.setGlobalContextManager(new AsyncLocalStorageContextManager());
  traceSampleRate = startupConfig.desktopTraceSampleRate;
  isElectronMainProcess = processRole === `electron-main`;
  // vendored 构造器的第二参在原始调用中即为 undefined（原 `new rg(vO)`）
  currentSampler = new TraceIdRatioBasedSampler(traceSampleRate);
  exportTracePayloadCallback != null && (traceExporterCallback = exportTracePayloadCallback);
  const provider = new NodeTracerProvider({
    // vendored qh 的第二参在原始调用中即为 undefined
    resource: resourceFromAttributes({
      "codex.build_flavor": startupConfig.buildFlavor,
      "codex.build_number": startupConfig.buildNumber ?? `unknown`,
      "codex.process": processRole,
      "os.type": process.platform,
      "service.name": `codex-desktop`,
      "service.version": startupConfig.appVersion,
    }, undefined as never),
    sampler: new ParentBasedSampler({ root: parentRespectingSampler }),
    spanProcessors: [
      new BatchSpanProcessor(createDesktopTraceExporter(), {
        exportTimeoutMillis: 1e4,
        maxExportBatchSize: 256,
        maxQueueSize: 1024,
        scheduledDelayMillis: 5e3,
      }),
    ],
  });
  tracerProvider = provider;
  const tracer = provider.getTracer(`codex-desktop`, undefined as never, undefined as never); // 原始单参调用
  installSharedTracingBridge({
    getActiveSpanContext: () => {
      const span = otelApi.trace.getActiveSpan();
      if (span == null) return null;
      const { spanId, traceFlags, traceId } = span.spanContext();
      return (traceFlags & otelApi.TraceFlags.SAMPLED) === 0 ? null : { spanId, traceId };
    },
    getActiveTraceContext: () => {
      const carrier: { traceparent?: string; tracestate?: string } = {};
      globalPropagator.inject(otelApi.context.active(), carrier, otelApi.defaultTextMapSetter);
      return carrier.traceparent == null
        ? null
        : {
            traceparent: carrier.traceparent,
            ...(carrier.tracestate == null ? {} : { tracestate: carrier.tracestate }),
          };
    },
    runWithTraceContext: (traceContext, callback) =>
      traceContext == null
        ? callback()
        : otelApi.context.with(
            globalPropagator.extract(otelApi.context.active(), traceContext, otelApi.defaultTextMapGetter),
            callback,
          ),
    setActiveSpanAttributes: (attributes) => {
      otelApi.trace.getActiveSpan()?.setAttributes(attributes);
    },
    setActiveSpanOutcome: (outcome, errorCategory) => {
      const span = otelApi.trace.getActiveSpan();
      if (span == null) return;
      span.setAttribute(`codex.outcome`, outcome);
      if (outcome === `failure`) {
        span.setAttribute(`error.category`, errorCategory ?? `operation`);
        span.setAttribute(`error.type`, `operation_failed`);
        span.setStatus({ code: otelApi.SpanStatusCode.ERROR });
      }
    },
    startSpan: (spec: TracingBridgeSpec, callback: () => unknown) => {
      const context =
        spec.root === true
          ? otelApi.ROOT_CONTEXT
          : spec.trace == null
            ? otelApi.context.active()
            : globalPropagator.extract(otelApi.context.active(), spec.trace, otelApi.defaultTextMapGetter);
      return tracer.startActiveSpan(
        spec.name,
        {
          attributes: { "codex.operation": spec.op, ...spec.attributes },
          links: spec.links?.flatMap((link) => {
            const spanContext = otelApi.trace.getSpanContext(
              globalPropagator.extract(otelApi.ROOT_CONTEXT, link, otelApi.defaultTextMapGetter),
            );
            return spanContext == null ? [] : [{ context: spanContext }];
          }),
          startTime: spec.startTimeMs,
        },
        context,
        (span) => {
          const end = (endValue?: unknown) => {
            if (endValue != null) {
              const attributes = errorToSpanAttributes(endValue);
              span.setAttributes(attributes);
              attributes[`codex.outcome`] === `failure` &&
                span.setStatus({ code: otelApi.SpanStatusCode.ERROR });
            }
            span.end(spec.endTimeMs);
          };
          try {
            const result = callback();
            if (result instanceof Promise) {
              result.then(
                () => end(),
                (error) => end(error),
              );
            } else end();
            return result;
          } catch (error) {
            end(error);
            throw error;
          }
        },
      );
    },
  });
}

/** 注册 trace 导出回调（原始 SO，exports.D）。 */
export function setTraceExporter(callback: (payload: Uint8Array) => Promise<void>): void {
  traceExporterCallback = callback;
}

/**
 * 设置 trace 采样率（原始 CO，exports.E）。
 *
 * CODEX_OTEL_TRACES_ENDPOINT 已设置时是 no-op（原始用 `??` 短路保持）。
 * 非有限值归零，其余夹取到 [0, 1]。
 */
export function setTraceSampleRate(rate: number): void {
  process.env.CODEX_OTEL_TRACES_ENDPOINT ??
    ((traceSampleRate = Number.isFinite(rate) ? Math.min(1, Math.max(0, rate)) : 0),
    (currentSampler = new TraceIdRatioBasedSampler(traceSampleRate)));
}

/** trace 采样率是否大于 0（原始 wO，exports.T）。 */
export function isDesktopTracingEnabled(): boolean {
  return traceSampleRate > 0;
}

/** 当前 trace 采样率（原始 TO，exports.w）。 */
export function getDesktopTraceSampleRate(): number {
  return traceSampleRate;
}

/**
 * 导出一条 OTLP trace payload（原始 EO，exports.S）。
 *
 * electron-main 进程只在采样开启时导出；其他进程（utility/renderer 等
 * yO=false 的角色）始终导出。没有注册导出回调时抛错。
 */
export async function exportTracePayload(payload: Uint8Array): Promise<void> {
  if (!isElectronMainProcess || isDesktopTracingEnabled()) {
    if (traceExporterCallback == null) throw Error(`Desktop trace exporter is unavailable`);
    await traceExporterCallback(payload);
  }
}

/** 强制 flush 当前 provider（原始 DO，exports.C）。 */
export async function flushDesktopTraces(): Promise<void> {
  await tracerProvider?.forceFlush();
}

/** 构造走 exportTracePayload 的 span exporter（原始 OO）。 */
function createDesktopTraceExporter() {
  return {
    export: (spans: unknown, resultCallback: (result: { code: number; error?: unknown }) => void) => {
      const payload = otlpJsonSerializer.serializeRequest(spans);
      if (payload == null) {
        resultCallback({ code: ExportResultCode.FAILED });
        return;
      }
      exportTracePayload(payload).then(
        () => resultCallback({ code: ExportResultCode.SUCCESS }),
        (error) => resultCallback({ code: ExportResultCode.FAILED, error }),
      );
    },
    shutdown: async () => {},
  };
}

/** 支持网站数据上报开关的 session（Owl shell 补丁面，Electron 类型里没有）。 */
interface WebsiteReportingSession {
  setWebsiteReportingEnabled(enabled: boolean): unknown;
}

/**
 * 把 analytics 开关绑定到网站数据上报（原始 kO）。
 *
 * 每个 session 创建时先关掉 website reporting，等 analytics promise 出结果后再
 * 设置；默认 session 在 app ready 后处理。WeakSet 保证同一 session 只处理一次。
 */
export function bindWebsiteReporting(analyticsEnabled: Promise<boolean>): void {
  const handled = new WeakSet<object>();
  const apply = (target: WebsiteReportingSession) => {
    if (handled.has(target as object)) return;
    handled.add(target as object);
    target.setWebsiteReportingEnabled(false);
    analyticsEnabled.then(
      (enabled) => target.setWebsiteReportingEnabled(enabled),
      () => {},
    );
  };
  app.on(`session-created`, (session) => apply(session as unknown as WebsiteReportingSession));
  app.whenReady().then(() => apply(session.defaultSession as unknown as WebsiteReportingSession));
}
