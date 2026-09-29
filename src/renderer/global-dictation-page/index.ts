import "@rchunk/rolldown-runtime";
import {
  $3 as initializeJsxRuntime,
  Df as ContextMenu,
  FX as initializeScopedRuntime,
  G3 as hostBridge,
  I3 as getJsxRuntime,
  K2 as initializeReactRuntime,
  K3 as useHostMessage,
  Of as initializeContextMenu,
  Q3 as logger,
  QI as initializeScopeRuntime,
  Qh as LoadingSpinner,
  W3 as initializeHostBridge,
  Y2 as FormattedMessage,
  Yh as Button,
  Zh as initializeButton,
  e6 as getReactRuntime,
  h4 as initializeClassNames,
  lw as initializeAssets,
  m4 as classNames,
  n4 as useIntl,
  wL as initializeCapabilities,
} from "@rchunk/app-shared";
import {
  ifn as initializeRouterRuntime,
  mnt as initializeServiceRuntime,
  pnt as appServices,
  ypn as initializeAnalyticsRuntime,
} from "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/use-floating-window-pointer-interactivity";

initializeJsxRuntime();
initializeScopedRuntime();
initializeReactRuntime();
initializeScopeRuntime();
initializeContextMenu();
initializeHostBridge();
initializeButton();
initializeClassNames();
initializeAssets();
initializeCapabilities();
initializeRouterRuntime();
initializeServiceRuntime();
initializeAnalyticsRuntime();

const React = getReactRuntime();
const jsx = getJsxRuntime();

const MINIMUM_RECORDING_MS = 250;
const RECORDER_TIMESLICE_MS = 100;

type DictationStatus =
  "initializing" | "idle" | "listening" | "transcribing" | "error";
type FailureStage = "recording" | "transcription";

interface GlobalDictationPageProps {
  initialStatus?: DictationStatus;
}

interface IdleMessage extends Record<string, unknown> {
  type: "global-dictation-idle";
  configuredHotkey?: string | null;
  configuredToggleHotkey?: string | null;
}

interface StartMessage extends Record<string, unknown> {
  type: "global-dictation-start";
  sessionId: string;
  startGesture?: string;
}

interface StopMessage extends Record<string, unknown> {
  type: "global-dictation-stop";
  cancel?: boolean;
  sessionId: string;
}

interface PasteFailureMessage extends Record<string, unknown> {
  type: "global-dictation-paste-failed";
  failure: PasteFailure;
}

interface PasteFailure {
  copied: boolean;
  reason?: "accessibility" | string;
  text: string;
}

interface DictationAudioService {
  cleanupTranscript?(input: {
    signal?: AbortSignal;
    transcript: string;
  }): Promise<string>;
  transcribe?(audio: Blob, options?: { signal?: AbortSignal }): Promise<string>;
  transcribeAudio?(
    audio: Blob,
    options?: { signal?: AbortSignal },
  ): Promise<string>;
}

interface SystemPermissionService {
  openAccessibilitySettings?(): Promise<void> | void;
  requestMicrophoneAccess?(): Promise<unknown>;
}

interface DictationServices {
  clipboard?: { writeText(text: string): Promise<void> };
  dictationAudio?: DictationAudioService;
  systemPermissions?: SystemPermissionService;
}

interface RecordingSession {
  abortController: AbortController;
  cancelled: boolean;
  chunks: Blob[];
  isStopping: boolean;
  recorder: MediaRecorder | null;
  sessionId: string;
  startedAtMs: number;
  stopPromise: Promise<void>;
  resolveStopped(): void;
  stream: MediaStream | null;
}

interface RetryAudio {
  audio: Blob;
  sessionId: string;
}

interface ErrorState {
  canRetry: boolean;
  message: string;
  stage: FailureStage;
}

interface Deferred {
  promise: Promise<void>;
  resolve(): void;
}

const services = appServices as unknown as DictationServices;

function createDeferred(): Deferred {
  let resolvePromise: (() => void) | null = null;
  const promise = new Promise<void>((resolve) => {
    resolvePromise = resolve;
  });
  return {
    promise,
    resolve: () => resolvePromise?.(),
  };
}

function errorMessage(error: unknown, stage: FailureStage): string {
  if (error instanceof DOMException && error.name === "NotAllowedError")
    return "Microphone access is required for dictation";
  if (error instanceof Error && error.message.trim() !== "")
    return error.message;
  return stage === "recording"
    ? "Could not start dictation"
    : "Could not transcribe audio";
}

function stopTracks(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

async function getMicrophoneStream(): Promise<MediaStream> {
  await services.systemPermissions?.requestMicrophoneAccess?.();
  if (
    typeof navigator === "undefined" ||
    navigator.mediaDevices?.getUserMedia == null
  )
    throw new Error("Microphone recording is unavailable");
  return navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1 } });
}

async function transcribeAudio(
  audio: Blob,
  signal: AbortSignal,
): Promise<string> {
  const audioService = services.dictationAudio;
  if (audioService == null)
    throw new Error("Dictation transcription is unavailable");
  const transcript =
    audioService.transcribeAudio != null
      ? await audioService.transcribeAudio(audio, { signal })
      : audioService.transcribe != null
        ? await audioService.transcribe(audio, { signal })
        : (() => {
            throw new Error("Dictation transcription is unavailable");
          })();
  signal.throwIfAborted();
  const cleaned =
    audioService.cleanupTranscript == null
      ? transcript
      : await audioService.cleanupTranscript({ signal, transcript });
  signal.throwIfAborted();
  return cleaned.trim();
}

function useWaveform(): {
  canvasRef: { current: HTMLCanvasElement | null };
  reset(): void;
  start(): void;
  stop(): void;
} {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const frameRef = React.useRef<number | null>(null);

  const reset = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas == null || context == null) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const stop = () => {
    if (frameRef.current != null && typeof cancelAnimationFrame === "function")
      cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    reset();
  };

  const start = () => {
    stop();
    if (typeof requestAnimationFrame !== "function") return;
    const draw = () => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (canvas != null && context != null) {
        const width = Math.max(canvas.clientWidth, 120);
        const height = Math.max(canvas.clientHeight, 16);
        canvas.width = width;
        canvas.height = height;
        context.clearRect(0, 0, width, height);
        context.fillStyle = "currentColor";
        for (let index = 0; index < 18; index += 1) {
          const barHeight =
            2 + Math.abs(Math.sin(Date.now() / 130 + index)) * (height - 4);
          context.fillRect(
            index * (width / 18),
            (height - barHeight) / 2,
            2,
            barHeight,
          );
        }
      }
      frameRef.current = requestAnimationFrame(draw);
    };
    frameRef.current = requestAnimationFrame(draw);
  };

  React.useEffect(() => stop, []);
  return { canvasRef, reset, start, stop };
}

function formatHotkeyLabel(
  holdHotkey: string | null,
  toggleHotkey: string | null,
): string {
  if (holdHotkey != null && toggleHotkey != null)
    return `Hold ${holdHotkey} or press ${toggleHotkey} to dictate`;
  if (holdHotkey != null) return `Hold ${holdHotkey} to dictate`;
  if (toggleHotkey != null) return `Press ${toggleHotkey} to dictate`;
  return "Dictation is not configured";
}

function PasteRecovery(props: {
  failure: PasteFailure;
  onCopy(): void;
  onDismiss(): void;
  onOpenSettings?(): void;
}): unknown {
  const intl = useIntl();
  const copiedMessage = props.failure.copied
    ? "Text copied — paste it with your system shortcut"
    : "Your clipboard changed";
  const detail = !props.failure.copied
    ? "Copy your transcript to paste it"
    : props.failure.reason === "accessibility"
      ? "Enable Accessibility to paste automatically"
      : "Couldn't paste automatically";

  return jsx.jsx("main", {
    className:
      "flex h-screen w-screen items-end justify-center overflow-hidden bg-transparent text-default",
    onMouseEnter: () => dispatchPointerInteractivity(true),
    onMouseLeave: () => dispatchPointerInteractivity(false),
    children: jsx.jsxs("section", {
      role: "status",
      "aria-live": "polite",
      className:
        "m-2 flex w-full max-w-xl items-center gap-3 rounded-2xl border bg-surface p-3 shadow-lg",
      children: [
        jsx.jsxs("div", {
          className: "min-w-0 flex-1",
          children: [
            jsx.jsx("div", {
              className: "font-medium",
              children: copiedMessage,
            }),
            jsx.jsx("div", {
              className: "text-xs text-codex-description",
              children: detail,
            }),
          ],
        }),
        props.failure.reason === "accessibility" && props.onOpenSettings != null
          ? jsx.jsx(Button, {
              color: "secondary",
              size: "composer",
              onClick: props.onOpenSettings,
              children: "Open Settings",
            })
          : null,
        props.failure.copied
          ? null
          : jsx.jsx(Button, {
              color: "secondary",
              size: "composer",
              onClick: props.onCopy,
              children: "Copy transcript",
            }),
        jsx.jsx(Button, {
          color: "ghost",
          size: "icon",
          "aria-label": String(
            intl.formatMessage({
              id: "globalDictation.pasteFailed.dismiss",
              defaultMessage: "Dismiss",
            }),
          ),
          onClick: props.onDismiss,
          children: "×",
        }),
      ],
    }),
  });
}

function dispatchPointerInteractivity(isInteractive: boolean): void {
  hostBridge.dispatchMessage("global-dictation-pointer-interaction-changed", {
    isInteractive,
  });
}

export function GlobalDictationPage({
  initialStatus = "initializing",
}: GlobalDictationPageProps = {}): unknown {
  const intl = useIntl();
  const sessionRef = React.useRef<RecordingSession | null>(null);
  const retryAudioRef = React.useRef<RetryAudio | null>(null);
  const retryingRef = React.useRef(false);
  const [status, setStatus] = React.useState<DictationStatus>(initialStatus);
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<ErrorState | null>(null);
  const [pasteFailure, setPasteFailure] = React.useState<PasteFailure | null>(
    null,
  );
  const [holdHotkey, setHoldHotkey] = React.useState<string | null>(null);
  const [toggleHotkey, setToggleHotkey] = React.useState<string | null>(null);
  const waveform = useWaveform();

  const completeWithEmptyText = (completedSessionId: string) => {
    hostBridge.dispatchMessage("global-dictation-completed", {
      sessionId: completedSessionId,
      text: "",
    });
  };

  const fail = (
    failedSessionId: string,
    stage: FailureStage,
    failure: unknown,
    canRetry: boolean,
  ) => {
    setError({ canRetry, message: errorMessage(failure, stage), stage });
    setStatus("error");
    hostBridge.dispatchMessage("global-dictation-failed", {
      sessionId: failedSessionId,
      stage,
    });
  };

  const transcribe = async (
    target: RetryAudio,
    signal: AbortSignal,
    owner: RecordingSession | null = null,
  ) => {
    const ownsVisibleState = () =>
      owner == null || sessionRef.current === owner;
    try {
      const text = await transcribeAudio(target.audio, signal);
      if (signal.aborted) return;
      retryAudioRef.current = null;
      if (ownsVisibleState()) {
        setError(null);
        setStatus("idle");
        setSessionId(null);
      }
      hostBridge.dispatchMessage("global-dictation-completed", {
        sessionId: target.sessionId,
        text,
      });
    } catch (transcriptionError) {
      if (signal.aborted) {
        completeWithEmptyText(target.sessionId);
        if (ownsVisibleState()) {
          setStatus("idle");
          setSessionId(null);
        }
        return;
      }
      retryAudioRef.current = target;
      if (ownsVisibleState())
        fail(target.sessionId, "transcription", transcriptionError, true);
      else
        hostBridge.dispatchMessage("global-dictation-failed", {
          sessionId: target.sessionId,
          stage: "transcription",
        });
    }
  };

  const stopSession = async (stoppedSessionId: string, cancel: boolean) => {
    const session = sessionRef.current;
    if (session == null || session.sessionId !== stoppedSessionId) return;
    if (session.isStopping) {
      if (cancel) {
        session.cancelled = true;
        session.abortController.abort();
      }
      return;
    }
    session.isStopping = true;
    const durationMs = Date.now() - session.startedAtMs;
    session.cancelled = cancel || durationMs < MINIMUM_RECORDING_MS;
    hostBridge.dispatchMessage("global-dictation-recording-stopped", {
      sessionId: stoppedSessionId,
    });
    if (session.recorder != null && session.recorder.state !== "inactive")
      session.recorder.stop();
    else session.resolveStopped();
    await session.stopPromise;
    stopTracks(session.stream);
    waveform.stop();
    waveform.reset();
    if (session.cancelled || session.chunks.length === 0) {
      session.abortController.abort();
      if (sessionRef.current === session) sessionRef.current = null;
      completeWithEmptyText(stoppedSessionId);
      setStatus("idle");
      setSessionId(null);
      return;
    }

    const audio = new Blob(session.chunks, {
      type:
        session.recorder?.mimeType || session.chunks[0]?.type || "audio/webm",
    });
    const retryAudio = { audio, sessionId: stoppedSessionId };
    retryAudioRef.current = retryAudio;
    setStatus("transcribing");
    await transcribe(retryAudio, session.abortController.signal, session);
    if (sessionRef.current === session) sessionRef.current = null;
  };

  const startSession = async (message: StartMessage) => {
    const previous = sessionRef.current;
    if (previous != null) {
      previous.cancelled = true;
      previous.abortController.abort();
      if (previous.recorder != null && previous.recorder.state !== "inactive")
        previous.recorder.stop();
      else previous.resolveStopped();
      stopTracks(previous.stream);
      hostBridge.dispatchMessage("global-dictation-recording-stopped", {
        sessionId: previous.sessionId,
      });
      completeWithEmptyText(previous.sessionId);
    }
    const deferred = createDeferred();
    const session: RecordingSession = {
      abortController: new AbortController(),
      cancelled: false,
      chunks: [],
      isStopping: false,
      recorder: null,
      resolveStopped: deferred.resolve,
      sessionId: message.sessionId,
      startedAtMs: Date.now(),
      stopPromise: deferred.promise,
      stream: null,
    };
    sessionRef.current = session;
    retryAudioRef.current = null;
    setPasteFailure(null);
    setSessionId(message.sessionId);
    setError(null);
    setStatus("listening");

    try {
      const stream = await getMicrophoneStream();
      if (
        session.abortController.signal.aborted ||
        sessionRef.current !== session
      ) {
        stopTracks(stream);
        return;
      }
      session.stream = stream;
      const recorder = new MediaRecorder(stream);
      session.recorder = recorder;
      recorder.addEventListener("dataavailable", (event: BlobEvent) => {
        if (!session.cancelled && event.data.size > 0)
          session.chunks.push(event.data);
      });
      recorder.addEventListener(
        "stop",
        () => {
          session.resolveStopped();
          if (!session.isStopping) void stopSession(session.sessionId, false);
        },
        { once: true },
      );
      recorder.start(RECORDER_TIMESLICE_MS);
      waveform.start();
      hostBridge.dispatchMessage("global-dictation-recording-started", {
        sessionId: message.sessionId,
        startGesture: message.startGesture ?? null,
      });
    } catch (recordingError) {
      stopTracks(session.stream);
      waveform.stop();
      if (session.abortController.signal.aborted) return;
      if (sessionRef.current === session) sessionRef.current = null;
      fail(message.sessionId, "recording", recordingError, false);
    }
  };

  const retry = async () => {
    const retryAudio = retryAudioRef.current;
    if (retryAudio == null || retryingRef.current) return;
    retryingRef.current = true;
    const abortController = new AbortController();
    setError(null);
    setStatus("transcribing");
    try {
      await transcribe(retryAudio, abortController.signal);
    } finally {
      retryingRef.current = false;
    }
  };

  useHostMessage<IdleMessage>("global-dictation-idle", (message) => {
    sessionRef.current?.abortController.abort();
    stopTracks(sessionRef.current?.stream ?? null);
    sessionRef.current = null;
    retryAudioRef.current = null;
    waveform.stop();
    setSessionId(null);
    setError(null);
    setPasteFailure(null);
    setHoldHotkey(message.configuredHotkey ?? null);
    setToggleHotkey(message.configuredToggleHotkey ?? null);
    setStatus(
      message.configuredHotkey != null || message.configuredToggleHotkey != null
        ? "idle"
        : "initializing",
    );
  });
  useHostMessage<StartMessage>("global-dictation-start", (message) => {
    void startSession(message);
  });
  useHostMessage<StopMessage>("global-dictation-stop", (message) => {
    void stopSession(message.sessionId, message.cancel === true);
  });
  useHostMessage<PasteFailureMessage>(
    "global-dictation-paste-failed",
    (message) => {
      setPasteFailure(message.failure);
    },
  );

  React.useEffect(() => {
    let mounted = true;
    queueMicrotask(() => {
      if (mounted)
        hostBridge.dispatchMessage("global-dictation-renderer-ready", {});
    });
    return () => {
      mounted = false;
      const session = sessionRef.current;
      session?.abortController.abort();
      stopTracks(session?.stream ?? null);
      waveform.stop();
    };
  }, []);

  if (pasteFailure != null) {
    return jsx.jsx(PasteRecovery, {
      failure: pasteFailure,
      onCopy: () => {
        void services.clipboard?.writeText(pasteFailure.text).then(
          () =>
            setPasteFailure((current) =>
              current === pasteFailure ? { ...current, copied: true } : current,
            ),
          (copyError) =>
            logger.warning("Failed to copy recovered dictation", {
              safe: {},
              sensitive: { error: copyError },
            }),
        );
      },
      onOpenSettings:
        services.systemPermissions?.openAccessibilitySettings == null
          ? undefined
          : () => {
              void Promise.resolve(
                services.systemPermissions?.openAccessibilitySettings?.(),
              ).catch((settingsError) =>
                logger.warning(
                  "Failed to open dictation Accessibility settings",
                  {
                    safe: {},
                    sensitive: { error: settingsError },
                  },
                ),
              );
            },
      onDismiss: () => {
        setPasteFailure(null);
        hostBridge.dispatchMessage("global-dictation-close", {
          sessionId: null,
        });
      },
    });
  }

  const closeWindow = () => {
    if (sessionId != null || status === "idle")
      hostBridge.dispatchMessage("global-dictation-close", { sessionId });
  };
  const dismissError = () => {
    if (sessionId != null)
      hostBridge.dispatchMessage("global-dictation-dismiss", { sessionId });
    setError(null);
    setSessionId(null);
    setStatus("idle");
  };
  const statusLabel =
    status === "idle"
      ? "Dictation ready"
      : status === "listening"
        ? "Listening"
        : status === "transcribing"
          ? "Transcribing…"
          : status === "error"
            ? (error?.message ?? "Dictation failed")
            : "Initializing dictation";
  const ariaLabel =
    status === "idle"
      ? String(
          intl.formatMessage({
            id: "globalDictation.readyAriaLabel",
            defaultMessage: "Global dictation ready",
          }),
        )
      : String(
          intl.formatMessage({
            id: "globalDictation.waveformAriaLabel",
            defaultMessage: "Global dictation waveform",
          }),
        );
  const menuItems = [
    {
      id: "close-window",
      message: {
        id: "globalDictation.closeWindow",
        defaultMessage: "Close window",
      },
      onSelect: closeWindow,
    },
  ];

  return jsx.jsx("main", {
    "data-theme": "dark",
    className: classNames(
      "flex h-screen w-screen items-end justify-center overflow-hidden bg-transparent text-default",
      status === "error" && "p-1",
    ),
    children: jsx.jsx(ContextMenu, {
      items: menuItems,
      children: jsx.jsx("div", {
        "data-testid": "global-dictation-hitbox",
        className: classNames(
          "group flex items-end justify-center",
          status === "error" ? "w-fit" : "h-[30px] w-[120px]",
        ),
        onMouseEnter: () => dispatchPointerInteractivity(true),
        onMouseLeave: () => dispatchPointerInteractivity(false),
        title:
          status === "idle"
            ? formatHotkeyLabel(holdHotkey, toggleHotkey)
            : undefined,
        children: jsx.jsxs("section", {
          "aria-live": "polite",
          "aria-label": ariaLabel,
          className: classNames(
            "flex min-h-2 items-center justify-center overflow-hidden rounded-full border bg-surface px-2 shadow-lg",
            status === "error" && "h-8 max-w-[304px] gap-2",
            (status === "listening" || status === "transcribing") &&
              "h-[30px] w-[72px]",
          ),
          children: [
            status === "transcribing"
              ? jsx.jsx(LoadingSpinner, { className: "size-3" })
              : null,
            status === "listening"
              ? jsx.jsx("canvas", {
                  ref: waveform.canvasRef,
                  className: "h-4 min-w-0 flex-1",
                  "aria-hidden": true,
                })
              : null,
            status === "error"
              ? jsx.jsxs(jsx.Fragment, {
                  children: [
                    jsx.jsx("span", {
                      className:
                        "max-w-[252px] truncate text-xs font-medium text-danger",
                      children: error?.message,
                    }),
                    error?.canRetry
                      ? jsx.jsx("button", {
                          type: "button",
                          "aria-label": "Retry",
                          onClick: () => void retry(),
                          children: "↻",
                        })
                      : null,
                    jsx.jsx("button", {
                      type: "button",
                      "aria-label": "Dismiss",
                      onClick: dismissError,
                      children: "×",
                    }),
                  ],
                })
              : null,
            jsx.jsx("span", {
              className: "sr-only",
              children: jsx.jsx(FormattedMessage, {
                id: `globalDictation.${status}`,
                defaultMessage: statusLabel,
              }),
            }),
          ],
        }),
      }),
    }),
  });
}
