const AGENT_KEY_DOUBLE_TAP_MS = 350;
const SESSION_LOCK_POLL_MS = 250;
const INITIAL_DEVICE_STATE = {
  status: "not-detected",
  transport: null,
  model: null,
  error: null,
  battery: null,
};

type CodexMicroManagerDependencies = {
  logger: { error(message: string, fields: unknown): void };
  loadServiceClass(): Promise<new (options: any) => any>;
  getSystemIdleState(thresholdSeconds: number): string;
  setInterval(callback: () => void, milliseconds: number): any;
  clearInterval(handle: any): void;
  now(): number;
};

export function createCodexMicroServiceManagerClass(dependencies: CodexMicroManagerDependencies) {
  return class CodexMicroServiceManager {
    private connectionFailureLogged = false;
    private deviceState: any = INITIAL_DEVICE_STATE;
    private reconnectPending = false;
    private service: any = null;
    private servicePromise: Promise<any> | null = null;
    private ownerWindow: any = null;
    private agentThreadKeys: Array<string | null> = [];
    private agentKeyKinds: string[] = [];
    private singleTapAgentKeys = false;
    private lastAgentTap: { owner: any; slot: number; threadKey: string | null; pressedAt: number } | null = null;
    private transportHandoffSource: { transport: unknown } | null = null;
    private readonly unsubscribePrimaryWindowChanges: () => void;
    private sessionLockMonitor: any = null;

    constructor(private readonly options: any) {
      this.unsubscribePrimaryWindowChanges = options.windowManager.subscribePrimaryWindowChanges((window: any) => {
        this.setOwnerWindow(this.isSessionLocked() ? null : window);
      });
    }

    async getState() {
      const service = await this.getService();
      service.start();
      const state = service.getState();
      this.syncSessionLockMonitor(state);
      return state;
    }

    async stop() {
      this.resetLifecycleTracking();
      await (this.service ?? (await this.servicePromise))?.stop();
    }

    updateAgentThreadKeys(threadKeys: Array<string | null>, keyKinds: string[], singleTap = false) {
      this.agentThreadKeys = threadKeys;
      this.agentKeyKinds = keyKinds;
      if (this.singleTapAgentKeys !== singleTap) this.lastAgentTap = null;
      this.singleTapAgentKeys = singleTap;
    }

    async updateLighting(input: unknown) {
      return (await this.getService()).updateLighting(input);
    }

    dispose() {
      if (this.sessionLockMonitor != null) {
        dependencies.clearInterval(this.sessionLockMonitor);
        this.sessionLockMonitor = null;
      }
      this.unsubscribePrimaryWindowChanges();
      if (this.service != null) {
        this.service.dispose();
        return;
      }
      this.servicePromise?.then((service) => service.dispose());
    }

    private getService() {
      if (this.service != null) return Promise.resolve(this.service);
      this.servicePromise ??= Promise.resolve()
        .then(() => dependencies.loadServiceClass())
        .then((Service) => {
          const service = new Service({
            onDeviceStateChanged: (state: any, cause: string) => {
              const previous = this.deviceState;
              this.deviceState = state;
              this.syncSessionLockMonitor(state);
              this.options.windowManager.sendMessageToAllWindows({
                type: "codex-micro-device-state-changed",
                state,
                cause,
              });
              const lifecycle = this.getLifecycleEvent(previous, state, cause);
              const transition = lifecycle?.transition ?? null;
              const becameAvailable =
                previous.status !== "detected" &&
                previous.status !== "connected" &&
                (state.status === "detected" || state.status === "connected");
              if (cause !== "device-lifecycle" || (!becameAvailable && transition == null)) return;
              const primaryWindow = this.options.windowManager.getPrimaryWindow();
              if (primaryWindow != null)
                this.options.windowManager.sendMessageToWindow(primaryWindow, {
                  type: "codex-micro-device-lifecycle",
                  state,
                  transition,
                  transport: lifecycle?.transport ?? state.transport,
                });
            },
            onHidEvent: (event: any) => this.handleHidEvent(event),
            onJoystickEvent: (event: any) => {
              if (this.isSessionLocked()) return;
              const primaryWindow = this.options.windowManager.getPrimaryWindow();
              if (primaryWindow != null) {
                this.setOwnerWindow(primaryWindow);
                this.options.windowManager.sendMessageToWindow(primaryWindow, {
                  type: "codex-micro-joystick-event",
                  event,
                });
              }
            },
          });
          this.service = service;
          return service;
        })
        .finally(() => {
          this.servicePromise = null;
        });
      return this.servicePromise;
    }

    private syncSessionLockMonitor(state: any) {
      if (state.status !== "connected") {
        if (this.sessionLockMonitor != null) {
          dependencies.clearInterval(this.sessionLockMonitor);
          this.sessionLockMonitor = null;
        }
        return;
      }
      if (this.sessionLockMonitor == null) {
        this.sessionLockMonitor = dependencies.setInterval(() => {
          this.setOwnerWindow(
            this.isSessionLocked() ? null : this.options.windowManager.getPrimaryWindow(),
          );
        }, SESSION_LOCK_POLL_MS);
        this.sessionLockMonitor.unref();
      }
    }

    private setOwnerWindow(window: any) {
      const previous = this.ownerWindow;
      if (window === previous) return;
      this.ownerWindow = window;
      this.lastAgentTap = null;
      if (previous != null && !previous.isDestroyed())
        this.options.windowManager.sendMessageToWindow(previous, {
          type: "codex-micro-window-ownership-changed",
          isOwner: false,
        });
      if (window != null)
        this.options.windowManager.sendMessageToWindow(window, {
          type: "codex-micro-window-ownership-changed",
          isOwner: true,
        });
    }

    private isSessionLocked() {
      return dependencies.getSystemIdleState(1) === "locked";
    }

    private handleHidEvent(event: any) {
      if (this.isSessionLocked()) {
        this.lastAgentTap = null;
        return;
      }
      const primaryWindow = this.options.windowManager.getPrimaryWindow();
      this.setOwnerWindow(primaryWindow);
      if (event.act !== 1 || event.slot == null) {
        if (primaryWindow != null) this.sendHidEvent(primaryWindow, event);
        return;
      }
      const keyKind = this.agentKeyKinds[event.slot];
      const threadKey = keyKind === "recent-thread"
        ? event.threadKey
        : (this.agentThreadKeys[event.slot] ?? null);
      const isAction = keyKind === "action";
      const pressedAt = dependencies.now();
      const previousTap = this.lastAgentTap;
      const elapsed = previousTap == null ? null : pressedAt - previousTap.pressedAt;
      const confirmed =
        (!isAction &&
          previousTap?.owner === primaryWindow &&
          previousTap.slot === event.slot &&
          previousTap.threadKey === threadKey &&
          elapsed != null &&
          elapsed >= 0 &&
          elapsed <= AGENT_KEY_DOUBLE_TAP_MS) ||
        (this.singleTapAgentKeys && !isAction);
      this.lastAgentTap = confirmed || isAction
        ? null
        : { owner: primaryWindow, slot: event.slot, threadKey, pressedAt };
      if (primaryWindow == null) {
        if (confirmed || isAction)
          this.openWindowForAgentTap(event, isAction ? event.threadKey : threadKey, isAction).catch((error) => {
            dependencies.logger.error("Open window for Codex Micro agent key failed", {
              safe: {},
              sensitive: { error },
            });
          });
        return;
      }
      this.sendHidEvent(primaryWindow, event);
      if (confirmed) this.options.windowManager.showWindow(primaryWindow, { stealFocus: true });
    }

    private sendHidEvent(window: any, event: unknown) {
      this.options.windowManager.sendMessageToWindow(window, {
        type: "codex-micro-hid-event",
        event,
      });
    }

    private async openWindowForAgentTap(event: any, threadKey: string | null, isAction = false) {
      const window = await this.options.ensureWindow();
      if (window == null || this.isSessionLocked()) return;
      if (threadKey != null || isAction) this.sendHidEvent(window, { ...event, threadKey });
      this.options.windowManager.showWindow(window, { stealFocus: true });
    }

    private getLifecycleEvent(previous: any, state: any, cause: string) {
      if (cause === "service-stop") {
        this.resetLifecycleTracking();
        return null;
      }
      if (cause === "transport-handoff") {
        if (previous.status === "connected" && state.status === "not-detected")
          this.transportHandoffSource = { transport: previous.transport };
        else if (state.status === "connected") this.transportHandoffSource = null;
        return null;
      }
      if (cause !== "device-lifecycle") return null;
      if (
        this.transportHandoffSource != null &&
        (state.status === "error" || state.status === "not-detected")
      ) {
        const { transport } = this.transportHandoffSource;
        this.connectionFailureLogged = false;
        this.reconnectPending = true;
        this.transportHandoffSource = null;
        return { transition: "connection-lost", transport };
      }
      if (previous.status === "connected" && (state.status === "error" || state.status === "not-detected")) {
        this.connectionFailureLogged = false;
        this.reconnectPending = true;
        return { transition: "connection-lost", transport: previous.transport };
      }
      if (previous.status === "detected" && state.status === "error" && !this.connectionFailureLogged) {
        this.connectionFailureLogged = true;
        return { transition: "connection-failed", transport: state.transport };
      }
      if (previous.status === "error" && state.status === "not-detected" && this.connectionFailureLogged) {
        this.connectionFailureLogged = false;
        return null;
      }
      if (previous.status !== "connected" && state.status === "connected") {
        const transition = this.reconnectPending ? "reconnected" : "connected";
        this.connectionFailureLogged = false;
        this.reconnectPending = false;
        return { transition, transport: state.transport };
      }
      return null;
    }

    private resetLifecycleTracking() {
      this.connectionFailureLogged = false;
      this.reconnectPending = false;
      this.transportHandoffSource = null;
    }
  };
}
