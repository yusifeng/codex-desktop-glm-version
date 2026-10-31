type MediaState = {
  isAudible: boolean;
  isCapturingUserMedia: boolean;
  isCapturingCamera?: boolean;
  isCapturingMicrophone?: boolean;
};

type TimerHandle = ReturnType<typeof setTimeout>;

type Runtime = {
  now: () => number;
  setTimer: (callback: () => void, delay: number) => TimerHandle;
  clearTimer: (timer: TimerHandle) => void;
  audibleOffDelay: number;
  minimumCaptureLifetime: number;
  minimumCaptureOffDelay: number;
};

const defaultRuntime: Runtime = {
  now: Date.now,
  setTimer: setTimeout,
  clearTimer: clearTimeout,
  audibleOffDelay: 2_000,
  minimumCaptureLifetime: 5_000,
  minimumCaptureOffDelay: 1_000,
};

/** Tracks stable media indicators while smoothing short audible/capture transitions. */
export function createBrowserMediaStateTracker(
  {
    initialState = { isAudible: false, isCapturingUserMedia: false },
    onStateChanged = () => undefined,
  }: {
    initialState?: MediaState;
    onStateChanged?: () => void;
  } = {},
  runtimeOverrides: Partial<Runtime> = {},
) {
  const runtime = { ...defaultRuntime, ...runtimeOverrides };
  const state = { ...initialState };
  let audibleOffTimer: TimerHandle | null = null;
  let captureOffTimer: TimerHandle | null = null;
  let captureStartedAt = state.isCapturingUserMedia ? runtime.now() : null;
  let disposed = false;
  let notifyStateChanged = onStateChanged;

  const cancelAudibleOff = () => {
    if (audibleOffTimer != null) {
      runtime.clearTimer(audibleOffTimer);
      audibleOffTimer = null;
    }
  };

  const cancelCaptureOff = () => {
    if (captureOffTimer != null) {
      runtime.clearTimer(captureOffTimer);
      captureOffTimer = null;
    }
  };

  const reset = () => {
    cancelAudibleOff();
    cancelCaptureOff();
    captureStartedAt = null;
    state.isAudible = false;
    state.isCapturingUserMedia = false;
    state.isCapturingCamera = undefined;
    state.isCapturingMicrophone = undefined;
  };

  return {
    state,
    dispose() {
      if (disposed) return;
      reset();
      disposed = true;
      notifyStateChanged = () => undefined;
    },
    reset,
    updateAudible(isAudible: boolean) {
      if (disposed) return;
      if (isAudible) {
        cancelAudibleOff();
        if (!state.isAudible) {
          state.isAudible = true;
          notifyStateChanged();
        }
        return;
      }
      if (state.isAudible && audibleOffTimer == null) {
        audibleOffTimer = runtime.setTimer(() => {
          audibleOffTimer = null;
          if (!disposed && state.isAudible) {
            state.isAudible = false;
            notifyStateChanged();
          }
        }, runtime.audibleOffDelay);
        audibleOffTimer.unref();
      }
    },
    updateUserMediaCapture({
      isCapturingCamera,
      isCapturingMicrophone,
      isCapturingUserMedia,
    }: MediaState) {
      if (disposed) return;
      if (isCapturingUserMedia) {
        cancelCaptureOff();
        captureStartedAt ??= runtime.now();
        if (
          !state.isCapturingUserMedia ||
          state.isCapturingCamera !== isCapturingCamera ||
          state.isCapturingMicrophone !== isCapturingMicrophone
        ) {
          state.isCapturingUserMedia = true;
          state.isCapturingCamera = isCapturingCamera;
          state.isCapturingMicrophone = isCapturingMicrophone;
          notifyStateChanged();
        }
        return;
      }
      if (!state.isCapturingUserMedia || captureOffTimer != null) return;
      const delay = Math.max(
        runtime.minimumCaptureOffDelay,
        runtime.minimumCaptureLifetime - (runtime.now() - (captureStartedAt ?? runtime.now())),
      );
      captureStartedAt = null;
      captureOffTimer = runtime.setTimer(() => {
        captureOffTimer = null;
        if (!disposed && state.isCapturingUserMedia) {
          state.isCapturingUserMedia = false;
          state.isCapturingCamera = undefined;
          state.isCapturingMicrophone = undefined;
          notifyStateChanged();
        }
      }, delay);
      captureOffTimer.unref();
    },
  };
}
