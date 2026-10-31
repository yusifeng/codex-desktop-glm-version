type SandboxState = {
  allowLocalDevelopment: boolean;
  initId: string;
  origin: string;
  ownerWebContents: any;
  sandboxId: string;
  skybridgeCacheState?: string;
  sourceUrl: string;
};

type LifecycleDependencies = {
  canUseSandboxProtocol: boolean;
  configureSession(
    session: any,
    getSandboxState: (guestId: number) => SandboxState | null,
    applicationNetwork: any,
  ): void;
  forwardInitChannel: string;
  getLocale(): string;
  getSkybridgeCacheState(url: string): string;
  initChannel: string;
  ipcMain: { on(channel: string, listener: (...args: any[]) => void): void } | null;
  isPortNameList(value: unknown): boolean;
  isSandboxId(value: string): boolean;
  logEvent(event: string, state: SandboxState, tags?: any): void;
  logger: () => { error(message: string, tags: any): void; warning(message: string, tags: any): void };
  matchesAccelerator(event: any, accelerator: string): boolean;
  parseInitId(url: string): string | null;
  parseOrigin(url: string, options?: { requireSkybridge?: boolean }): string | null;
  parsePartitionSandbox(partition: string): string | null;
  parsePersistentSandbox(url: string): string | null;
  persistentPartition: string;
  prewarmSandbox(locale: string): Promise<unknown>;
  sanitizeUrl(url: string): string;
  sandboxPreloadPath: string;
  sessionFromPartition(partition: string): any;
  showDevtoolsContextMenu(guest: any, owner: any): void;
  webContentsFromId(id: number): any | null;
};

const USER_GESTURE_TTL_MS = 5_000;
const ATTACHMENT_TTL_MS = 30_000;

export function createMcpSandboxEventLogger(
  logger: () => { info(message: string, tags: unknown): void },
  namespace = "mcp_app_sandbox",
) {
  return function logEvent(event: string, state: SandboxState, tags: any = {}) {
    logger().info(`${namespace}.${event}`, {
      safe: tags.safe ?? {},
      sensitive: {
        initId: state.initId,
        origin: state.origin,
        ownerWebContentsId: state.ownerWebContents.id,
        sandboxId: state.sandboxId,
        ...tags.sensitive,
      },
    });
  };
}

export function initializeMcpSandbox(
  network: { initializeDefaultSessionHeaders(): void },
  lifecycle: { initialize(): void },
): void {
  network.initializeDefaultSessionHeaders();
  lifecycle.initialize();
}

/** Owns MCP sandbox guest identity, attachment admission, IPC init, and guest listeners. */
export function createMcpSandboxLifecycleRuntime(dependencies: LifecycleDependencies) {
  const sandboxStateByGuestId = new Map<number, SandboxState>();
  const pendingBySession = new Map<any, Array<{
    state: SandboxState;
    timeout: any;
    viewInstanceId: number;
  }>>();
  const userGestures = new WeakMap<object, number>();
  let ipcInstalled = false;

  function getSandboxState(guestId: number) {
    return sandboxStateByGuestId.get(guestId) ?? null;
  }

  function recordUserGesture(guest: object) {
    userGestures.set(guest, performance.now());
  }

  function consumeUserGestureForGuest(guest: object) {
    const timestamp = userGestures.get(guest);
    userGestures.delete(guest);
    return timestamp != null && performance.now() - timestamp <= USER_GESTURE_TTL_MS;
  }

  function initialize() {
    if (ipcInstalled || dependencies.ipcMain?.on == null) return;
    ipcInstalled = true;
    dependencies.ipcMain.on(dependencies.initChannel, handleInitMessage);
  }

  function handleInitMessage(event: any, value: unknown) {
    const state = sandboxStateByGuestId.get(event.sender.id);
    if (state == null) {
      dependencies.logger().warning("mcp_app_sandbox.init_rejected", {
        safe: { reason: "unknown_guest" },
        sensitive: { guestWebContentsId: event.sender.id },
      });
      return;
    }
    const message = parseInitMessage(value);
    if (message == null) {
      dependencies.logEvent("init_rejected", state, { safe: { reason: "invalid_message" } });
      return;
    }
    if (state.origin !== message.origin) {
      dependencies.logEvent("init_rejected", state, {
        safe: { reason: "origin_mismatch" },
        sensitive: { guestWebContentsId: event.sender.id, receivedOrigin: message.origin },
      });
      return;
    }
    if (state.initId !== message.initId) {
      dependencies.logEvent("init_rejected", state, {
        safe: { reason: "init_id_mismatch" },
        sensitive: { guestWebContentsId: event.sender.id },
      });
      return;
    }
    if (!dependencies.isPortNameList(message.portNames)) {
      dependencies.logEvent("init_rejected", state, {
        safe: { receivedPortNameCount: message.portNames.length, reason: "invalid_port_names" },
        sensitive: { guestWebContentsId: event.sender.id },
      });
      return;
    }
    if (event.ports.length !== message.portNames.length + 1) {
      dependencies.logEvent("init_rejected", state, {
        safe: {
          expectedPortCount: message.portNames.length + 1,
          receivedPortCount: event.ports.length,
          reason: "port_count_mismatch",
        },
        sensitive: { guestWebContentsId: event.sender.id },
      });
      return;
    }
    if (state.ownerWebContents.isDestroyed()) {
      dependencies.logEvent("init_rejected", state, {
        safe: { reason: "owner_destroyed" },
        sensitive: { guestWebContentsId: event.sender.id },
      });
      return;
    }
    state.ownerWebContents.postMessage(
      dependencies.forwardInitChannel,
      {
        initId: message.initId,
        origin: message.origin,
        portNames: message.portNames,
        sandboxId: state.sandboxId,
        skybridgeCacheState: state.skybridgeCacheState,
        type: "init",
      },
      event.ports,
    );
  }

  function parseInitMessage(value: unknown) {
    if (typeof value !== "object" || value == null) return null;
    const { initId, origin, portNames, type } = value as Record<string, unknown>;
    return type !== "init" ||
      typeof initId !== "string" ||
      initId.length === 0 ||
      typeof origin !== "string" ||
      !Array.isArray(portNames)
      ? null
      : { initId, origin, portNames };
  }

  function findGuest(owner: any, sandboxId: string, initId?: string | null) {
    for (const [guestId, state] of sandboxStateByGuestId) {
      if (
        state.ownerWebContents.id !== owner.id ||
        state.sandboxId !== sandboxId ||
        (initId != null && state.initId !== initId)
      ) continue;
      const guest = dependencies.webContentsFromId(guestId);
      if (guest == null || guest.isDestroyed()) {
        sandboxStateByGuestId.delete(guestId);
        continue;
      }
      return guest;
    }
    return null;
  }

  function consumeUserGesture(owner: any, sandboxId: string, initId?: string | null) {
    const guest = findGuest(owner, sandboxId, initId);
    return guest != null && consumeUserGestureForGuest(guest);
  }

  function bindOwnerWebviews(
    owner: any,
    allowLocalDevelopment: boolean,
    options: {
      applicationNetwork: any;
      allowNonMcpAppSandboxWebviews?: boolean;
      navigation: { getAccelerators(command: string): string[]; run(command: string): void };
    },
  ) {
    const willAttach = (event: any, webPreferences: any, params: any) => {
      const reject = (safe: any, sensitive: any = {}) => {
        dependencies.logger().warning("mcp_app_sandbox.attach_rejected", {
          safe,
          sensitive: { ownerWebContentsId: owner.id, ...sensitive },
        });
        event.preventDefault();
      };
      const partitionSandbox = dependencies.parsePartitionSandbox(params.partition);
      if (partitionSandbox == null) {
        if (options.allowNonMcpAppSandboxWebviews !== true)
          reject({ reason: "non_mcp_app_sandbox_webview" });
        return;
      }
      const sourceUrl = params.src;
      const viewInstanceId = parseViewInstanceId(params.instanceId);
      const sandboxId = params.partition.startsWith("persist:")
        ? dependencies.parsePersistentSandbox(sourceUrl)
        : partitionSandbox;
      const origin = dependencies.parseOrigin(sourceUrl, { requireSkybridge: true });
      const initId = dependencies.parseInitId(sourceUrl);
      if (sandboxId == null || !dependencies.isSandboxId(sandboxId)) {
        reject({ reason: "invalid_sandbox_id" });
        return;
      }
      if (origin == null) {
        reject(
          { reason: "invalid_source_url", sourceProtocol: urlProtocol(sourceUrl) },
          { sourceUrl: dependencies.sanitizeUrl(sourceUrl) },
        );
        return;
      }
      if (initId == null) {
        reject({ reason: "invalid_init_id" });
        return;
      }
      if (viewInstanceId == null) {
        reject({ reason: "invalid_view_instance_id" });
        return;
      }
      if (
        params.partition.startsWith("persist:") &&
        params.partition !== dependencies.persistentPartition &&
        !(sourceUrl.startsWith("https://") && /^connection-[a-f0-9]{48}$/.test(partitionSandbox))
      ) {
        reject({ reason: "invalid_persistent_session" });
        return;
      }

      const usesSandboxProtocol =
        sourceUrl.startsWith("codex-sandbox://") && dependencies.canUseSandboxProtocol;
      const skybridgeCacheState = usesSandboxProtocol
        ? dependencies.getSkybridgeCacheState(sourceUrl)
        : undefined;
      if (usesSandboxProtocol) {
        dependencies.prewarmSandbox(
          new URL(sourceUrl).searchParams.get("locale") ?? dependencies.getLocale(),
        ).catch(() => {});
      }
      const session = dependencies.sessionFromPartition(params.partition);
      dependencies.configureSession(session, getSandboxState, options.applicationNetwork);
      addPendingAttachment(
        session,
        {
          allowLocalDevelopment,
          initId,
          origin,
          ownerWebContents: owner,
          sandboxId,
          skybridgeCacheState,
          sourceUrl,
        },
        viewInstanceId,
      );
      webPreferences.session = session;
      webPreferences.preload = dependencies.sandboxPreloadPath;
      webPreferences.nodeIntegration = false;
      webPreferences.nodeIntegrationInSubFrames = false;
      webPreferences.contextIsolation = true;
      webPreferences.disableDialogs = true;
      webPreferences.sandbox = true;
      webPreferences.webSecurity = true;
      webPreferences.plugins = false;
      webPreferences.allowRunningInsecureContent = false;
      webPreferences.devTools = true;
      webPreferences.webviewTag = false;
    };

    const didAttach = (_event: any, guest: any) => {
      const state = takePendingAttachment(
        guest.session,
        owner,
        parseViewInstanceId(guest.viewInstanceId),
        dependencies.parseInitId(guest.getURL()),
      );
      if (state == null) {
        dependencies.logger().warning("mcp_app_sandbox.attach_unmatched", {
          safe: { urlProtocol: urlProtocol(guest.getURL()) },
          sensitive: { guestWebContentsId: guest.id, url: dependencies.sanitizeUrl(guest.getURL()) },
        });
        return;
      }
      sandboxStateByGuestId.set(guest.id, state);
      bindGuestLifecycle(guest, state, () => sandboxStateByGuestId.delete(guest.id), options.navigation);
      dependencies.logEvent("guest_attached", state, {
        safe: { skybridgeCacheState: state.skybridgeCacheState },
        sensitive: { guestWebContentsId: guest.id },
      });
    };

    owner.on("will-attach-webview", willAttach);
    owner.on("did-attach-webview", didAttach);
    owner.once("destroyed", () => {
      owner.removeListener("will-attach-webview", willAttach);
      owner.removeListener("did-attach-webview", didAttach);
      removePendingForOwner(owner);
    });
  }

  function bindGuestLifecycle(
    guest: any,
    state: SandboxState,
    onDestroy: () => void,
    navigation: { getAccelerators(command: string): string[]; run(command: string): void },
  ) {
    const source = parseUrl(state.sourceUrl);
    const isSourceUrl = (value: string) => {
      const candidate = parseUrl(value);
      return candidate != null && source != null &&
        candidate.protocol === source.protocol &&
        candidate.host === source.host &&
        candidate.pathname === source.pathname &&
        candidate.search === source.search;
    };
    const shouldBlock = ({ isMainFrame, url }: any) =>
      isMainFrame === true ? !isSourceUrl(url) : hasPrivilegedSubframeProtocol(url);
    const logBlocked = (event: string, details: any) => {
      dependencies.logEvent(event, state, {
        safe: {
          isMainFrame: details.isMainFrame,
          reason: details.isMainFrame === true ? "main_frame_url_mismatch" : "privileged_subframe_url",
          urlProtocol: urlProtocol(details.url),
        },
        sensitive: {
          guestWebContentsId: details.guestWebContentsId,
          url: dependencies.sanitizeUrl(details.url),
        },
      });
    };
    const willNavigate = (event: any, fallbackUrl: string) => {
      const url = event.url ?? fallbackUrl;
      if (!isSourceUrl(url)) {
        logBlocked("navigation_blocked", { guestWebContentsId: guest.id, isMainFrame: true, url });
        event.preventDefault();
      }
    };
    const willFrameNavigate = (event: any) => {
      if (shouldBlock(event)) {
        logBlocked("navigation_blocked", { ...event, guestWebContentsId: guest.id });
        event.preventDefault();
      }
    };
    const willRedirect = (event: any, fallbackUrl: string) => {
      const url = event.url ?? fallbackUrl;
      if (shouldBlock({ isMainFrame: event.isMainFrame, url })) {
        logBlocked("redirect_blocked", { guestWebContentsId: guest.id, isMainFrame: event.isMainFrame, url });
        event.preventDefault();
      }
    };
    let sandboxCommitted = false;
    let widgetCommitted = false;
    const didFrameNavigate = (_event: any, url: string, _status: any, _statusText: any, isMainFrame: boolean) => {
      if (isMainFrame) {
        if (sandboxCommitted || !isSourceUrl(url)) return;
        sandboxCommitted = true;
      } else {
        if (widgetCommitted) return;
        widgetCommitted = true;
      }
      dependencies.logEvent(
        isMainFrame ? "sandbox_document_committed" : "widget_frame_committed",
        state,
        { sensitive: { guestWebContentsId: guest.id } },
      );
    };
    const didFailLoad = (
      _event: any,
      errorCode: number,
      errorDescription: string,
      validatedURL: string,
      isMainFrame: boolean,
      frameProcessId: number,
      frameRoutingId: number,
    ) => {
      if (errorCode === -3) return;
      dependencies.logEvent("guest_load_failed", state, {
        safe: { errorCode, isMainFrame, urlProtocol: urlProtocol(validatedURL) },
        sensitive: {
          errorDescription,
          frameProcessId,
          frameRoutingId,
          guestWebContentsId: guest.id,
          validatedURL: dependencies.sanitizeUrl(validatedURL),
        },
      });
    };
    const preloadError = (_event: any, preloadPath: string, error: unknown) => {
      dependencies.logger().error("mcp_app_sandbox.preload_failed", {
        safe: {},
        sensitive: { error, guestWebContentsId: guest.id, preloadPath, sandboxId: state.sandboxId },
      });
    };
    const renderProcessGone = (_event: any, details: any) => {
      if (details.reason !== "clean-exit") {
        dependencies.logEvent("render_process_gone", state, {
          safe: { reason: details.reason },
          sensitive: { exitCode: details.exitCode, guestWebContentsId: guest.id },
        });
      }
    };
    const contextMenu = () => dependencies.showDevtoolsContextMenu(guest, state.ownerWebContents);
    const beforeMouse = (event: any, input: any) => {
      if (input.type === "mouseDown") recordUserGesture(guest);
      const button = input.button;
      if (
        (input.type !== "mouseDown" && input.type !== "mouseUp") ||
        (button !== "back" && button !== "forward") ||
        (event.preventDefault(), input.type !== "mouseUp")
      ) return;
      const command = button === "back" ? "navigateBack" : "navigateForward";
      const accelerator = button === "back" ? "MouseBack" : "MouseForward";
      if (navigation.getAccelerators(command).includes(accelerator)) navigation.run(command);
    };
    const beforeInput = (event: any, input: any) => {
      if (input.type !== "keyDown") return;
      if (input.isAutoRepeat !== true && (input.key === "Enter" || input.key === " "))
        recordUserGesture(guest);
      const command = ["navigateBack", "navigateForward"].find((candidate) =>
        navigation.getAccelerators(candidate).some((accelerator) =>
          dependencies.matchesAccelerator(input, accelerator),
        ),
      );
      if (command != null) {
        event.preventDefault();
        if (!input.isAutoRepeat) navigation.run(command);
      }
    };
    const destroyed = () => {
      onDestroy();
      guest.removeListener("before-mouse-event", beforeMouse);
      guest.removeListener("before-input-event", beforeInput);
      guest.removeListener("will-navigate", willNavigate);
      guest.removeListener("will-frame-navigate", willFrameNavigate);
      guest.removeListener("will-redirect", willRedirect);
      guest.removeListener("did-frame-navigate", didFrameNavigate);
      guest.removeListener("did-fail-load", didFailLoad);
      guest.removeListener("preload-error", preloadError);
      guest.removeListener("render-process-gone", renderProcessGone);
      guest.removeListener("context-menu", contextMenu);
      guest.removeListener("destroyed", destroyed);
    };

    guest.on("before-mouse-event", beforeMouse);
    guest.setWindowOpenHandler(({ url }: any) => {
      dependencies.logEvent("popup_blocked", state, {
        safe: { urlProtocol: urlProtocol(url) },
        sensitive: { guestWebContentsId: guest.id, url: dependencies.sanitizeUrl(url) },
      });
      return { action: "deny" };
    });
    guest.on("before-input-event", beforeInput);
    guest.on("will-navigate", willNavigate);
    guest.on("will-frame-navigate", willFrameNavigate);
    guest.on("will-redirect", willRedirect);
    guest.on("did-frame-navigate", didFrameNavigate);
    guest.on("did-fail-load", didFailLoad);
    guest.on("preload-error", preloadError);
    guest.on("render-process-gone", renderProcessGone);
    guest.on("context-menu", contextMenu);
    guest.on("destroyed", destroyed);
  }

  function addPendingAttachment(session: any, state: SandboxState, viewInstanceId: number) {
    const timeout = setTimeout(() => {
      dependencies.logEvent("attach_expired", state);
      const pending = pendingBySession.get(session)?.find((entry) => entry.state === state);
      if (pending != null) removePendingAttachment(session, pending);
    }, ATTACHMENT_TTL_MS);
    const pending = pendingBySession.get(session) ?? [];
    pending.push({ state, timeout, viewInstanceId });
    pendingBySession.set(session, pending);
  }

  function takePendingAttachment(
    session: any,
    owner: any,
    viewInstanceId: number | null,
    initId: string | null,
  ) {
    const pending = pendingBySession.get(session);
    const index = viewInstanceId == null
      ? -1
      : (pending?.findIndex((entry) =>
          entry.state.ownerWebContents.id === owner.id &&
          entry.viewInstanceId === viewInstanceId &&
          (initId == null || entry.state.initId === initId),
        ) ?? -1);
    const match = pending != null && index >= 0 ? (pending.splice(index, 1)[0] ?? null) : null;
    if (match != null) clearTimeout(match.timeout);
    if (pending == null || pending.length === 0) pendingBySession.delete(session);
    return match?.state ?? null;
  }

  function removePendingAttachment(session: any, target: any) {
    const pending = pendingBySession.get(session);
    if (pending == null) return;
    const remaining = pending.filter((entry) => entry !== target);
    clearTimeout(target.timeout);
    if (remaining.length === 0) pendingBySession.delete(session);
    else if (remaining.length !== pending.length) pendingBySession.set(session, remaining);
  }

  function removePendingForOwner(owner: any) {
    for (const [session, pending] of pendingBySession) {
      for (const entry of pending) {
        if (entry.state.ownerWebContents.id === owner.id) removePendingAttachment(session, entry);
      }
    }
  }

  function parseViewInstanceId(value: unknown) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  function parseUrl(value: string | null | undefined) {
    if (value == null || value.length === 0) return null;
    try {
      return new URL(value);
    } catch {
      return null;
    }
  }

  function urlProtocol(value: string) {
    return parseUrl(value)?.protocol ?? "invalid";
  }

  function hasPrivilegedSubframeProtocol(value: string) {
    const protocol = parseUrl(value)?.protocol;
    return protocol == null || !["about:", "blob:", "data:", "http:", "https:"].includes(protocol);
  }

  return {
    bindGuestLifecycle,
    bindOwnerWebviews,
    consumeUserGesture,
    consumeUserGestureForGuest,
    findGuest,
    getSandboxState,
    initialize,
    parseInitMessage,
    parseViewInstanceId,
    recordUserGesture,
  };
}
