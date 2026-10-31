export type ContentTraceState =
  | `idle`
  | `awaiting-start-confirmation`
  | `recording`
  | `saving`
  | `awaiting-upload-details`
  | `uploading`;

export type TraceUploadDetails = {
  conversationId: string;
  note: string;
};

export type ContentTracingRuntimeDependencies = {
  electron: any;
  getIntl(): { formatMessage(descriptor: Record<string, any>): string };
  join(...parts: string[]): string;
  temporaryDirectory(): string;
  localHostId: string;
  loadUploadTraceRecording(): Promise<{
    uploadTraceRecording(options: Record<string, any>): Promise<string>;
  }>;
  createLogger(name: string): () => {
    info(message: string, context?: Record<string, any>): void;
    warning(message: string, context?: Record<string, any>): void;
  };
  now(): number;
  setTimer(callback: () => void, delayMs: number): any;
  clearTimer(timer: any): void;
  traceShortcutEnabled: boolean;
};

export const PERFORMANCE_HEARTBEAT_INTERVAL_MS = 30_000;
export const PERFORMANCE_TRIGGER_MIN_INTERVAL_MS = 5_000;
export const PERFORMANCE_REQUEST_TTL_MS = 60_000;

const TRACE_MENU_ITEM_ID = `toggle-trace-recording`;
const INCLUDED_TRACE_CATEGORIES = [
  `*`,
  `disabled-by-default-v8.cpu_profiler`,
  `disabled-by-default-v8.cpu_profiler.hires`,
];
const EXCLUDED_TRACE_CATEGORIES = [`IndexedDB`, `toplevel.flow`];
const TRACE_STATE_MESSAGES: Record<ContentTraceState, Record<string, any>> = {
  idle: { messageId: `electron.appMenu.trace.start`, defaultMessage: `Start Performance Trace` },
  recording: {
    messageId: `electron.appMenu.trace.stop`,
    defaultMessage: `Stop Performance Trace`,
  },
  "awaiting-start-confirmation": {
    messageId: `electron.appMenu.trace.awaitingStart`,
    defaultMessage: `Waiting to Start Trace…`,
  },
  saving: { messageId: `electron.appMenu.trace.saving`, defaultMessage: `Saving Trace…` },
  "awaiting-upload-details": {
    messageId: `electron.appMenu.trace.awaitingDetails`,
    defaultMessage: `Waiting for Trace Details…`,
  },
  uploading: {
    messageId: `electron.appMenu.trace.uploading`,
    defaultMessage: `Uploading Trace…`,
  },
};

function averageCpuPercent(
  initial: Record<string, any>,
  final: Record<string, any>,
  selectCumulativeSeconds: (snapshot: Record<string, any>) => number | null | undefined,
  matchesProcess: (initial: Record<string, any>, final: Record<string, any>) => boolean = () => true,
) {
  const initialSeconds = selectCumulativeSeconds(initial);
  const finalSeconds = selectCumulativeSeconds(final);
  const durationSeconds = (final.capturedAtMonotonicMs - initial.capturedAtMonotonicMs) / 1_000;
  if (
    initialSeconds == null ||
    finalSeconds == null ||
    !matchesProcess(initial, final) ||
    finalSeconds < initialSeconds ||
    durationSeconds <= 0
  ) {
    return undefined;
  }
  return ((finalSeconds - initialSeconds) / durationSeconds) * 100;
}

/** Combines the two cumulative snapshots collected around a renderer performance span. */
export function combinePerformanceSpanSnapshots(
  initial: Record<string, any>,
  final: Record<string, any>,
) {
  const mainProcessCpuPercentAvg = averageCpuPercent(
    initial,
    final,
    (snapshot) => snapshot.mainProcessCumulativeCpuSeconds,
  );
  const rendererProcessCpuPercentAvg = averageCpuPercent(
    initial,
    final,
    (snapshot) => snapshot.rendererProcessCumulativeCpuSeconds,
    (left, right) =>
      left.rendererProcessId != null &&
      left.rendererProcessId === right.rendererProcessId &&
      left.rendererProcessCreationTimeMs != null &&
      left.rendererProcessCreationTimeMs === right.rendererProcessCreationTimeMs,
  );
  return {
    samplingWindowDurationMs: Math.max(
      0,
      final.capturedAtMonotonicMs - initial.capturedAtMonotonicMs,
    ),
    electronProcessWorkingSetKbTotal: final.electronProcessWorkingSetKbTotal,
    mainProcessCpuPercentAvg,
    mainProcessHandleCount: final.mainProcessHandleCount,
    mainProcessRssBytes: final.mainProcessRssBytes,
    rendererProcessCount: final.rendererProcessCount,
    rendererProcessCpuPercentAvg,
    rendererProcessWorkingSetKb: final.rendererProcessWorkingSetKb,
    rendererProcessWorkingSetKbTotal: final.rendererProcessWorkingSetKbTotal,
    systemTotalMemoryBytes: final.systemTotalMemoryBytes,
    systemFreeMemoryBytes: final.systemFreeMemoryBytes,
    systemCommitTotalBytes: final.systemCommitTotalBytes,
    systemCommitLimitBytes: final.systemCommitLimitBytes,
    systemKernelPagedPoolBytes: final.systemKernelPagedPoolBytes,
    systemKernelNonpagedPoolBytes: final.systemKernelNonpagedPoolBytes,
    systemHandleCount: final.systemHandleCount,
    systemProcessCount: final.systemProcessCount,
    systemThreadCount: final.systemThreadCount,
    systemUptimeMs: final.systemUptimeMs,
  };
}

/** Projects the browser-main process attention state used by performance telemetry. */
export function summarizeWindowAttention(windows: any[]) {
  if (windows.length === 0) return { processRole: `browser_main`, windowAttention: `no_window` };
  if (windows.some((window) => window.isFocused()))
    return { processRole: `browser_main`, windowAttention: `focused` };
  return {
    processRole: `browser_main`,
    windowAttention: windows.some((window) => window.isVisible())
      ? `visible_unfocused`
      : `background`,
  };
}

/** Owns the process-wide Electron content-tracing state machine and renderer handshake. */
export function createContentTracingRuntime(dependencies: ContentTracingRuntimeDependencies) {
  const { electron } = dependencies;
  const logger = dependencies.createLogger(`content-tracing`);
  let state: ContentTraceState = `idle`;
  let recordingStartedAtMs: number | null = null;
  let traceFormatMarker: unknown = null;
  let bufferPollTimer: any = null;
  let toggleHandler: ((menuItem: any, bufferFull?: boolean) => Promise<void>) | null = null;
  let startConfirmationResolver: ((confirmed: boolean) => void) | null = null;
  let uploadDetailsResolver: ((details: TraceUploadDetails | null) => void) | null = null;

  const formatStateLabel = (nextState: ContentTraceState) =>
    dependencies.getIntl().formatMessage(TRACE_STATE_MESSAGES[nextState]);
  const getState = (): ContentTraceState => state;

  const publishTraceState = (windowManager: any) => {
    windowManager.sendMessageToAllRegisteredWindows({
      type: `trace-recording-state-changed`,
      state,
    });
  };

  const setState = (windowManager: any, menuItem: any, nextState: ContentTraceState) => {
    if (nextState !== `recording` && bufferPollTimer != null) {
      dependencies.clearTimer(bufferPollTimer);
      bufferPollTimer = null;
    }
    state = nextState;
    menuItem.label = formatStateLabel(nextState);
    publishTraceState(windowManager);
  };

  const waitForStartConfirmation = () => {
    if (startConfirmationResolver != null)
      throw Error(`Trace recording start confirmation is already pending`);
    return new Promise<boolean>((resolve) => {
      startConfirmationResolver = resolve;
    });
  };

  const confirmTraceRecordingStart = () => {
    if (startConfirmationResolver == null) return false;
    const resolve = startConfirmationResolver;
    startConfirmationResolver = null;
    resolve(true);
    return true;
  };

  const cancelTraceRecordingStart = () => {
    if (startConfirmationResolver == null) return false;
    const resolve = startConfirmationResolver;
    startConfirmationResolver = null;
    resolve(false);
    return true;
  };

  const waitForUploadDetails = () => {
    if (uploadDetailsResolver != null)
      throw Error(`Trace recording upload details are already pending`);
    return new Promise<TraceUploadDetails | null>((resolve) => {
      uploadDetailsResolver = resolve;
    });
  };

  const submitTraceRecording = (details: TraceUploadDetails) => {
    if (uploadDetailsResolver == null) return false;
    const resolve = uploadDetailsResolver;
    uploadDetailsResolver = null;
    resolve(details);
    return true;
  };

  const keepTraceRecordingLocal = () => {
    if (uploadDetailsResolver == null) return false;
    const resolve = uploadDetailsResolver;
    uploadDetailsResolver = null;
    resolve(null);
    return true;
  };

  const collectTraceRuntimeHealth = async (focusedWindow: any) => {
    const appMetrics = electron.app.getAppMetrics().map((metric: any) => ({
      pid: metric.pid,
      type: metric.type,
      memory:
        metric.memory == null
          ? null
          : {
              workingSetSize: metric.memory.workingSetSize,
              peakWorkingSetSize: metric.memory.peakWorkingSetSize,
              privateBytes: metric.memory.privateBytes ?? 0,
              sharedBytes: 0,
            },
    }));
    const rendererMemory =
      focusedWindow == null || focusedWindow.isDestroyed()
        ? null
        : await (async () => {
            const webContents = focusedWindow.webContents;
            if (typeof webContents.getProcessMemoryInfo === `function`)
              return webContents
                .getProcessMemoryInfo()
                .then((memory: any) => ({
                  private: memory.private,
                  shared: memory.shared,
                  residentSet: memory.residentSet,
                }))
                .catch(() => null);
            const processId = webContents.getOSProcessId();
            if (processId <= 0) return null;
            const metric = appMetrics.find((candidate: any) => candidate.pid === processId);
            return metric?.memory == null
              ? null
              : {
                  private: metric.memory.privateBytes,
                  shared: metric.memory.sharedBytes,
                  residentSet: metric.memory.workingSetSize,
                };
          })();
    const gpuFeatureStatus = Object.fromEntries(
      Object.entries(electron.app.getGPUFeatureStatus()),
    );
    let gpuVendor = null;
    let gpuRenderer = null;
    try {
      const gpuInfo = await electron.app.getGPUInfo(`basic`);
      const record = typeof gpuInfo === `object` && gpuInfo ? gpuInfo : null;
      const devices = record?.gpuDevice ?? [];
      const device = devices.find((candidate: any) => candidate.active) ?? devices[0];
      gpuVendor = device?.vendorString ?? (device?.vendorId == null ? null : String(device.vendorId));
      const attributes = record?.auxAttributes ?? {};
      const renderer = attributes.glRenderer ?? attributes.gl_renderer;
      gpuRenderer = typeof renderer === `string` ? renderer : null;
    } catch (error) {
      logger().warning(`Failed to collect GPU info for trace upload.`, {
        safe: {},
        sensitive: { error },
      });
    }
    return {
      appMetrics,
      rendererMemory,
      gpuFeatureStatus,
      gpuVendor,
      gpuRenderer,
      hardwareAccelerationEnabled: !electron.app.commandLine.hasSwitch(`disable-gpu`),
    };
  };

  const uploadWithRetry = async (options: Record<string, any>) => {
    const { uploadTraceRecording } = await dependencies.loadUploadTraceRecording();
    for (;;) {
      try {
        return await uploadTraceRecording(options);
      } catch (error) {
        logger().warning(`Performance trace submission failed.`, {
          safe: {},
          sensitive: { error, tracePath: options.tracePath },
        });
        const intl = dependencies.getIntl();
        const { response } = await electron.dialog.showMessageBox({
          type: `warning`,
          message: intl.formatMessage({
            messageId: `electron.traceRecording.uploadFailed.title`,
            defaultMessage: `Performance trace submission did not finish`,
          }),
          detail: intl.formatMessage({
            messageId: `electron.traceRecording.uploadFailed.detail`,
            defaultMessage:
              `Your complete trace is still available at {tracePath}. You can try again; some files may already have reached the server.`,
            values: { tracePath: options.tracePath },
          }),
          buttons: [
            intl.formatMessage({
              messageId: `electron.traceRecording.uploadFailed.retry`,
              defaultMessage: `Try Again`,
            }),
            intl.formatMessage({
              messageId: `electron.traceRecording.showLocalTrace`,
              defaultMessage: `Show Local Trace`,
            }),
            intl.formatMessage({
              messageId: `electron.traceRecording.uploadFailed.close`,
              defaultMessage: `Close`,
            }),
          ],
          defaultId: 0,
          cancelId: 2,
        });
        if (response === 1) electron.shell.showItemInFolder(options.tracePath);
        if (response !== 0) return null;
      }
    }
  };

  const pollTraceBuffer = (onFull: () => Promise<void>) => {
    const timer = dependencies.setTimer(() => {
      electron.contentTracing
        .getTraceBufferUsage()
        .then(async ({ percentage }: { percentage: number }) => {
          if (bufferPollTimer !== timer) return;
          if (percentage >= 0.99) await onFull();
          else pollTraceBuffer(onFull);
        })
        .catch((error: unknown) => {
          logger().warning(`Failed to read trace recording capacity.`, {
            safe: {},
            sensitive: { error },
          });
        });
    }, 1_000);
    bufferPollTimer = timer;
    timer.unref();
  };

  const createTraceMenuItem = ({
    allowDevtools,
    accelerator,
    windowManager,
    traceRecordingUploadOptions,
  }: {
    allowDevtools: boolean;
    accelerator?: string;
    windowManager: any;
    traceRecordingUploadOptions?: Record<string, any> | null;
  }) => {
    const toggle = async (menuItem: any, bufferFull = false) => {
      if (
        state === `awaiting-start-confirmation` ||
        state === `saving` ||
        state === `awaiting-upload-details` ||
        state === `uploading`
      ) {
        return;
      }
      try {
        let reportId: string | null = null;
        if (state === `idle`) {
          setState(windowManager, menuItem, `awaiting-start-confirmation`);
          if (!(await waitForStartConfirmation())) {
            setState(windowManager, menuItem, `idle`);
            return;
          }
          await electron.contentTracing.startRecording({
            excluded_categories: EXCLUDED_TRACE_CATEGORIES,
            included_categories: INCLUDED_TRACE_CATEGORIES,
            recording_mode: `record-until-full`,
          });
          recordingStartedAtMs = dependencies.now();
          setState(windowManager, menuItem, `recording`);
          pollTraceBuffer(() => toggle(menuItem, true));
          logger().info(`Started content trace recording.`);
          return;
        }

        setState(windowManager, menuItem, `saving`);
        const stoppedAtMs = dependencies.now();
        const usePerfettoExtension = traceFormatMarker != null;
        let additionalTraceFiles: unknown;
        const tracePath = await electron.contentTracing.stopRecording(
          dependencies.join(
            dependencies.temporaryDirectory(),
            `codex-trace-${stoppedAtMs}.${usePerfettoExtension ? `pftrace` : `json`}`,
          ),
        );
        traceFormatMarker = null;
        const recordingDurationMs =
          recordingStartedAtMs == null ? null : dependencies.now() - recordingStartedAtMs;
        logger().info(`Stopped content trace recording.`, {
          safe: { recordingDurationMs, bufferFull },
          sensitive: { tracePath },
        });
        if (bufferFull) {
          const intl = dependencies.getIntl();
          await electron.dialog.showMessageBox({
            type: `info`,
            message: intl.formatMessage({
              messageId: `electron.traceRecording.bufferFull.title`,
              defaultMessage: `Performance trace recording stopped`,
            }),
            detail: intl.formatMessage({
              messageId: `electron.traceRecording.bufferFull.detail`,
              defaultMessage: `The recording reached its capacity.`,
            }),
          });
        }
        if (traceRecordingUploadOptions != null) {
          const candidate = electron.BrowserWindow.getFocusedWindow();
          const focusedWindow = candidate != null && !candidate.isDestroyed() ? candidate : null;
          const windowId = focusedWindow?.id ?? null;
          const hostId =
            focusedWindow == null ||
            !windowManager.hasRegisteredWebContents(focusedWindow.webContents)
              ? null
              : dependencies.localHostId;
          const runtimeHealthPromise = collectTraceRuntimeHealth(focusedWindow);
          setState(windowManager, menuItem, `awaiting-upload-details`);
          const [details, runtimeHealth] = await Promise.all([
            waitForUploadDetails(),
            runtimeHealthPromise,
          ]);
          if (details == null) electron.shell.showItemInFolder(tracePath);
          else {
            setState(windowManager, menuItem, `uploading`);
            reportId = await uploadWithRetry({
              ...traceRecordingUploadOptions,
              tracePath,
              additionalTraceFiles,
              recordingDurationMs,
              correlation: { conversationId: details.conversationId, hostId, windowId },
              runtimeHealth,
              traceRecordingNote: details.note.length > 0 ? details.note : null,
            });
          }
        }
        recordingStartedAtMs = null;
        setState(windowManager, menuItem, `idle`);
        if (reportId != null)
          windowManager.sendMessageToAllRegisteredWindows({
            type: `trace-recording-uploaded`,
            reportId,
            tracePath,
          });
      } catch (error) {
        const failedState = getState();
        if (failedState === `saving`) setState(windowManager, menuItem, `recording`);
        else if (
          failedState === `awaiting-start-confirmation` ||
          failedState === `awaiting-upload-details` ||
          failedState === `uploading`
        ) {
          recordingStartedAtMs = null;
          traceFormatMarker = null;
          setState(windowManager, menuItem, `idle`);
        }
        logger().warning(`Failed to toggle content trace recording.`, {
          safe: {},
          sensitive: { error },
        });
      }
    };
    toggleHandler = toggle;
    return {
      id: TRACE_MENU_ITEM_ID,
      label: formatStateLabel(state),
      accelerator:
        allowDevtools && dependencies.traceShortcutEnabled ? accelerator : undefined,
      click: async (menuItem: any) => {
        await toggle(menuItem);
      },
    };
  };

  const toggleTraceRecording = async () => {
    const menuItem = electron.Menu.getApplicationMenu()?.getMenuItemById(TRACE_MENU_ITEM_ID);
    if (menuItem != null && toggleHandler != null) await toggleHandler(menuItem);
  };

  return {
    cancelTraceRecordingStart,
    combinePerformanceSpanSnapshots,
    confirmTraceRecordingStart,
    createTraceMenuItem,
    keepTraceRecordingLocal,
    performanceHeartbeatIntervalMs: PERFORMANCE_HEARTBEAT_INTERVAL_MS,
    performanceRequestTtlMs: PERFORMANCE_REQUEST_TTL_MS,
    performanceTriggerMinIntervalMs: PERFORMANCE_TRIGGER_MIN_INTERVAL_MS,
    publishTraceState,
    submitTraceRecording,
    summarizeWindowAttention,
    toggleTraceRecording,
  };
}

if (typeof module !== `undefined`) {
  module.exports = {
    PERFORMANCE_HEARTBEAT_INTERVAL_MS,
    PERFORMANCE_REQUEST_TTL_MS,
    PERFORMANCE_TRIGGER_MIN_INTERVAL_MS,
    combinePerformanceSpanSnapshots,
    createContentTracingRuntime,
    summarizeWindowAttention,
  };
}
