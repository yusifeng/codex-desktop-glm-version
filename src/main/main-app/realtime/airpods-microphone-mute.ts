// @ts-nocheck

/** Creates the optional AirPods microphone-mute companion and platform capability check. */
export function createAirpodsMicrophoneMuteRuntime(
  dependencies: Record<string, any>,
) {
  const {
    createRequire,
    filename,
    app,
    path,
    processRef,
    osRelease,
    powerMonitor,
    createLogger,
    setImmediate: scheduleImmediate,
    clearImmediate: cancelImmediate,
    loadAddon,
  } = dependencies;
  const requireNative = loadAddon ?? createRequire(filename);

  function loadAirpodsMuteAddon() {
    return requireNative(
      app.isPackaged
        ? path.join(
            processRef.resourcesPath,
            "native",
            "airpods-mute.node",
          )
        : path.join(
            app.getAppPath(),
            "native",
            "airpods-mute-addon",
            "build",
            `Release-${processRef.arch}`,
            "airpods_mute.node",
          ),
    );
  }

  function isAirpodsMicrophoneMuteSupported() {
    return (
      processRef.platform === "darwin" &&
      Number.parseInt(osRelease(), 10) >= 23
    );
  }

  class AirpodsMicrophoneMute {
    onMuteRequested;
    logger = createLogger("airpods-microphone-mute");
    addon = loadAirpodsMuteAddon();
    stopped = false;
    recovery;

    constructor(onMuteRequested: (muted: boolean) => void) {
      this.onMuteRequested = onMuteRequested;
      this.addon.start((event: any) => this.handleEvent(event));
      powerMonitor.on("resume", this.scheduleCaptureRecovery);
    }

    acknowledgeMuted(muted: boolean) {
      if (!this.stopped) this.addon.setMuted(muted);
    }

    stop() {
      if (this.stopped) return;
      this.stopped = true;
      powerMonitor.removeListener("resume", this.scheduleCaptureRecovery);
      if (this.recovery != null) cancelImmediate(this.recovery);
      this.recovery = undefined;
      this.addon.stop();
    }

    handleEvent(event: any) {
      if (this.stopped) return;
      if (event.kind === "capture-changed") {
        this.scheduleCaptureRecovery();
        return;
      }
      try {
        this.onMuteRequested(event.muted);
      } catch (error) {
        this.stop();
        this.logger.warning("Could not forward AirPods mute request", {
          safe: {},
          sensitive: { error },
        });
      }
    }

    scheduleCaptureRecovery = () => {
      if (this.stopped || this.recovery != null) return;
      this.recovery = scheduleImmediate(() => {
        this.recovery = undefined;
        if (this.stopped) return;
        try {
          this.addon.restartCapture();
        } catch (error) {
          this.logger.warning("Could not recover AirPods companion capture", {
            safe: {},
            sensitive: { error },
          });
        }
      });
    };
  }

  return {
    AirpodsMicrophoneMute,
    isAirpodsMicrophoneMuteSupported,
    loadAirpodsMuteAddon,
  };
}

if (typeof module !== "undefined")
  module.exports = { createAirpodsMicrophoneMuteRuntime };
