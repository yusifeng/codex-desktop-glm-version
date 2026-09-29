import "@rchunk/rolldown-runtime";
import { $3 as initializeJsxRuntimeLazy, $h as initializeCloudBrowserHooks, BX as useSignalFamilyValue, FX as initializeMaitaiRuntime, I3 as getJsxRuntime, K2 as initializeAppUtilities, Qh as LoadingSpinner, Y2 as FormattedMessage, e6 as getReactRuntime, h4 as initializeClassNames, m4 as classNames, n4 as useIntl, type JsxRuntime, type ReactRuntime } from "@rchunk/app-shared";
// @ts-expect-error The release app-initial surface is declared incrementally by the shared manifest owner.
import { BL as cloudBrowserScreenshots, HL as initializeCloudBrowserState, VL as selectActiveScreenshotIndex, _dn as desktopFetch, fdn as getAuthHeaders, pdn as initializeBrowserAuth, uHt as initializeIntl, wVt as browserOwnerConversationId, ydn as initializeNetworkState, zL as cloudBrowserMode } from "@rchunk/app-initial";
import { n as initializeCloudBrowserPreview, t as CloudBrowserPreview, type CloudBrowserScreenshot } from "@rchunk/cloud-browser-preview";

type ClientMode = "control" | "observe";
type ClientEvent = "connected" | "dataopened" | "dataclosed" | "disconnected" | "error" | "message" | "modechange" | "streaming";
type ClientListener = (...values: unknown[]) => void;
type ConnectionStatus = "connecting" | "error" | "streaming";

interface BrowserModeState {
  mode?: string;
}

interface BrowserControlMessage {
  event: string;
  text?: string;
}

interface CloudBrowserLiveViewProps {
  browserOwnerConversationId?: string | null;
  conversationId: string;
  isControlActivated: boolean;
  onControlActivation(): void;
  targetTabId?: string | null;
}

export interface ChatGptCloudBrowserSidePanelProps {
  browserOwnerConversationId?: string | null;
  conversationId: string;
  targetTabId?: string | null;
}

interface FetchResponse {
  text(): Promise<string>;
}

type PeerFetch = (
  input: string,
  init: { body?: BodyInit | null; headers?: HeadersInit; method?: string },
) => Promise<FetchResponse>;

const REALTIME_CONNECT_TIMEOUT_MS = 20_000;
const OUTCOME_ACK_TIMEOUT_MS = 1_000;
const KEY_REPEAT_DELAY_MS = 500;
const KEY_REPEAT_INTERVAL_MS = 50;
const WHEEL_LIMIT = 10;
const WHEEL_LINE_HEIGHT = 19;

const keysyms: Readonly<Record<string, number>> = {
  Alt: 65513,
  ArrowDown: 65364,
  ArrowLeft: 65361,
  ArrowRight: 65363,
  ArrowUp: 65362,
  Backspace: 65288,
  CapsLock: 65509,
  Control: 65507,
  Delete: 65535,
  End: 65367,
  Enter: 65293,
  Escape: 65307,
  F1: 65470,
  F2: 65471,
  F3: 65472,
  F4: 65473,
  F5: 65474,
  F6: 65475,
  F7: 65476,
  F8: 65477,
  F9: 65478,
  F10: 65479,
  F11: 65480,
  F12: 65481,
  Home: 65360,
  Insert: 65379,
  Meta: 65511,
  PageDown: 65366,
  PageUp: 65365,
  Shift: 65505,
  Tab: 65289,
};

let jsxRuntime: JsxRuntime;
let React: ReactRuntime;
let initialized = false;
const readSignalFamily = useSignalFamilyValue as unknown as <Value>(
  family: unknown,
  parameter: string,
) => Value;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value != null && !Array.isArray(value);
}

function isBrowserControlMessage(value: unknown): value is BrowserControlMessage {
  return isRecord(value) && typeof value.event === "string";
}

function toUnicodeKeysym(codePoint: number): number {
  if (codePoint <= 31 || (codePoint >= 127 && codePoint <= 159)) return 65280 | codePoint;
  if (codePoint <= 255) return codePoint;
  return 16777216 | codePoint;
}

function keyboardEventToKeysym(event: KeyboardEvent): number | null {
  const named = keysyms[event.key];
  if (named != null) return remapMacKeysym(named);
  if (event.key.length === 1) {
    const codePoint = event.key.codePointAt(0);
    return codePoint == null ? null : remapMacKeysym(toUnicodeKeysym(codePoint));
  }
  return event.keyCode === 0 ? null : remapMacKeysym(event.keyCode);
}

function remapMacKeysym(keysym: number): number {
  if (!/(Mac|iPhone|iPod|iPad)/i.test(globalThis.navigator?.platform ?? "")) return keysym;
  switch (keysym) {
    case 65511: return 65507;
    case 65515: return 65513;
    case 65516: return 65515;
    case 65513: return 65406;
    case 65514: return 65027;
    default: return keysym;
  }
}

class CloudBrowserClient {
  private readonly listeners: Record<ClientEvent, ClientListener[]> = {
    connected: [], dataopened: [], dataclosed: [], disconnected: [], error: [], message: [], modechange: [], streaming: [],
  };
  private readonly pressedKeys = new Set<number>();
  private readonly peerFetch: PeerFetch;
  private keyEventSource: HTMLElement | null = null;
  private mouseEventSource: HTMLElement | null = null;
  private repeatDelay: ReturnType<typeof setTimeout> | null = null;
  private repeatInterval: ReturnType<typeof setInterval> | null = null;
  private wheelThrottled = false;
  private peerTimeout: ReturnType<typeof setTimeout> | null = null;
  private stream: MediaStream | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private mode: ClientMode = "observe";

  constructor(private readonly peerUrl: string, peerFetch: PeerFetch) {
    this.peerFetch = peerFetch;
  }

  addEventListener(event: ClientEvent, listener: ClientListener): void {
    this.listeners[event].push(listener);
  }

  private emit(event: ClientEvent, ...values: unknown[]): void {
    for (const listener of this.listeners[event]) listener(...values);
  }

  async connect(timeoutMs = REALTIME_CONNECT_TIMEOUT_MS): Promise<void> {
    if (typeof RTCPeerConnection === "undefined") throw new Error("WebRTC is unavailable");
    this.peerTimeout = setTimeout(() => this.handleError(new Error("The connection timed out while waiting for the peer to respond.")), timeoutMs);
    const peer = new RTCPeerConnection();
    this.peerConnection = peer;
    peer.ontrack = (event) => {
      if (event.track.kind !== "video") return;
      const [stream] = event.streams;
      if (stream == null) return;
      this.stream = stream;
      this.emit("streaming", stream);
      if (this.dataChannel?.readyState === "open") this.markConnected();
    };
    peer.addTransceiver("audio");
    peer.addTransceiver("video");
    const channel = peer.createDataChannel("");
    this.dataChannel = channel;
    channel.onmessage = (event) => this.handleMessage(event);
    channel.onopen = () => {
      this.emit("dataopened", channel);
      if (this.stream != null) this.markConnected();
    };
    channel.onclose = () => this.emit("dataclosed");
    channel.onerror = (event) => this.handleError("error" in event && event.error instanceof Error ? event.error : new Error("Unknown data-channel error"));
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const response = await this.peerFetch(this.peerUrl, {
      body: offer.sdp ?? "",
      headers: { "Content-Type": "application/sdp" },
      method: "POST",
    });
    const answer = await response.text();
    await peer.setRemoteDescription({ type: "answer", sdp: answer });
  }

  disconnect(): void {
    this.clearRepeat();
    if (this.peerTimeout != null) clearTimeout(this.peerTimeout);
    this.peerTimeout = null;
    this.setKeyEventSource(null);
    this.setMouseEventSource(null);
    this.dataChannel?.close();
    this.peerConnection?.close();
    this.dataChannel = null;
    this.peerConnection = null;
    this.emit("disconnected", this);
  }

  setMode(mode: ClientMode): void {
    this.sendJson({ event: mode === "control" ? "control/request" : "control/release" });
  }

  setKeyEventSource(source: HTMLElement | null): void {
    if (this.keyEventSource != null) {
      this.keyEventSource.removeEventListener("keydown", this.handleKeyDown, true);
      this.keyEventSource.removeEventListener("keyup", this.handleKeyUp, true);
    }
    this.keyEventSource = source;
    source?.addEventListener("keydown", this.handleKeyDown, true);
    source?.addEventListener("keyup", this.handleKeyUp, true);
  }

  setMouseEventSource(source: HTMLElement | null): void {
    if (this.mouseEventSource != null) {
      this.mouseEventSource.removeEventListener("mousemove", this.handleMouseEvent);
      this.mouseEventSource.removeEventListener("mousedown", this.handleMouseEvent);
      this.mouseEventSource.removeEventListener("mouseup", this.handleMouseEvent);
      this.mouseEventSource.removeEventListener("wheel", this.handleWheelEvent);
      this.mouseEventSource.removeEventListener("contextmenu", this.preventDefault);
    }
    this.mouseEventSource = source;
    source?.addEventListener("mousemove", this.handleMouseEvent);
    source?.addEventListener("mousedown", this.handleMouseEvent);
    source?.addEventListener("mouseup", this.handleMouseEvent);
    source?.addEventListener("wheel", this.handleWheelEvent);
    source?.addEventListener("contextmenu", this.preventDefault);
  }

  private readonly preventDefault = (event: Event): void => event.preventDefault();

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const keysym = keyboardEventToKeysym(event);
    if (keysym == null) return;
    event.preventDefault();
    if (!this.pressedKeys.has(keysym)) {
      this.pressedKeys.add(keysym);
      this.sendKey(true, keysym);
    }
    this.clearRepeat();
    this.repeatDelay = setTimeout(() => {
      this.repeatInterval = setInterval(() => {
        this.sendKey(false, keysym);
        this.sendKey(true, keysym);
      }, KEY_REPEAT_INTERVAL_MS);
    }, KEY_REPEAT_DELAY_MS);
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "v") void this.syncClipboard();
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    const keysym = keyboardEventToKeysym(event);
    if (keysym == null) return;
    event.preventDefault();
    this.pressedKeys.delete(keysym);
    this.clearRepeat();
    this.sendKey(false, keysym);
  };

  private readonly handleMouseEvent = (event: MouseEvent): void => {
    event.preventDefault();
    if (event.type === "mousemove") {
      const point = event.currentTarget instanceof HTMLVideoElement
        ? CloudBrowserClient.getScaledOffset(event, event.currentTarget)
        : { x: event.offsetX, y: event.offsetY };
      this.sendPointer(point.x, point.y);
      return;
    }
    this.sendKey(event.type === "mousedown", event.button + 1);
  };

  private readonly handleWheelEvent = (event: WheelEvent): void => {
    event.preventDefault();
    if (this.wheelThrottled) return;
    this.wheelThrottled = true;
    let x = event.deltaX;
    let y = event.deltaY;
    if (event.deltaMode !== 0) { x *= WHEEL_LINE_HEIGHT; y *= WHEEL_LINE_HEIGHT; }
    x = Math.max(-WHEEL_LIMIT, Math.min(WHEEL_LIMIT, -x));
    y = Math.max(-WHEEL_LIMIT, Math.min(WHEEL_LIMIT, -y));
    this.sendWheel(x, y);
    setTimeout(() => { this.wheelThrottled = false; }, 100);
  };

  private clearRepeat(): void {
    if (this.repeatDelay != null) clearTimeout(this.repeatDelay);
    if (this.repeatInterval != null) clearInterval(this.repeatInterval);
    this.repeatDelay = null;
    this.repeatInterval = null;
  }

  private sendJson(message: BrowserControlMessage): void {
    if (this.dataChannel?.readyState === "open") this.dataChannel.send(JSON.stringify(message));
  }

  private sendPointer(x: number, y: number): void {
    if (this.mode !== "control" || this.dataChannel?.readyState !== "open") return;
    const buffer = new ArrayBuffer(7);
    const view = new DataView(buffer);
    view.setUint8(0, 1);
    view.setUint16(1, 4, true);
    view.setUint16(3, x, true);
    view.setUint16(5, y, true);
    this.dataChannel.send(buffer);
  }

  private sendWheel(x: number, y: number): void {
    if (this.mode !== "control" || this.dataChannel?.readyState !== "open") return;
    const buffer = new ArrayBuffer(7);
    const view = new DataView(buffer);
    view.setUint8(0, 2);
    view.setUint16(1, 4, true);
    view.setInt16(3, x, true);
    view.setInt16(5, y, true);
    this.dataChannel.send(buffer);
  }

  private sendKey(down: boolean, keysym: number): void {
    if (this.mode !== "control" || this.dataChannel?.readyState !== "open") return;
    const buffer = new ArrayBuffer(11);
    const view = new DataView(buffer);
    view.setUint8(0, down ? 3 : 4);
    view.setUint16(1, 8, true);
    view.setBigUint64(3, BigInt(keysym), true);
    this.dataChannel.send(buffer);
  }

  private async syncClipboard(): Promise<void> {
    if (!globalThis.document?.hasFocus() || globalThis.navigator?.clipboard == null) return;
    const text = await navigator.clipboard.readText();
    this.sendJson({ event: "control/clipboard", text });
  }

  private handleMessage(event: MessageEvent): void {
    let parsed: unknown;
    try { parsed = typeof event.data === "string" ? JSON.parse(event.data) : null; }
    catch (error) { this.handleError(error instanceof Error ? error : new Error(String(error))); return; }
    if (!isBrowserControlMessage(parsed)) { this.handleError(new Error("Invalid browser-control payload")); return; }
    this.emit("message", parsed);
    if (parsed.event === "control/locked") {
      this.mode = "control";
      this.emit("modechange", this.mode);
    } else if (parsed.event === "control/release") {
      this.mode = "observe";
      this.emit("modechange", this.mode);
    } else if (parsed.event === "control/clipboard" && parsed.text != null) {
      void globalThis.navigator?.clipboard?.writeText(parsed.text).catch((error: unknown) => this.handleError(error instanceof Error ? error : new Error(String(error))));
    }
  }

  private markConnected(): void {
    if (this.peerTimeout != null) clearTimeout(this.peerTimeout);
    this.peerTimeout = null;
    this.emit("connected", this);
  }

  private handleError(error: Error): void {
    this.emit("error", error);
  }

  private static getScaledOffset(event: MouseEvent, video: HTMLVideoElement): { x: number; y: number } {
    const bounds = video.getBoundingClientRect();
    const scale = Math.min(bounds.width / video.videoWidth, bounds.height / video.videoHeight);
    const width = video.videoWidth * scale;
    const height = video.videoHeight * scale;
    const offsetX = (bounds.width - width) / 2;
    const offsetY = (bounds.height - height) / 2;
    return {
      x: Math.round((video.videoWidth / width) * Math.min(Math.max(event.offsetX - offsetX, 0), width)),
      y: Math.round((video.videoHeight / height) * Math.min(Math.max(event.offsetY - offsetY, 0), height)),
    };
  }
}

function getPeerFetch(): PeerFetch {
  const bridge = desktopFetch as unknown as {
    getInstance(): { fetch(input: string, init: RequestInit): Promise<FetchResponse> };
  };
  return async (input, init) => bridge.getInstance().fetch(input, {
    ...init,
    headers: { ...(init.headers ?? {}), ...(getAuthHeaders() as Record<string, string>) },
  });
}

function normalizeConnectionStatus(status: ConnectionStatus): ConnectionStatus {
  return status === "error" ? "error" : "streaming";
}

function CloudBrowserLiveView({ browserOwnerConversationId: explicitOwner, conversationId, isControlActivated, onControlActivation, targetTabId }: CloudBrowserLiveViewProps): unknown {
  const intl = useIntl();
  const derivedOwner = readSignalFamily<string | null | undefined>(browserOwnerConversationId, conversationId);
  const ownerConversationId = explicitOwner ?? derivedOwner;
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const clientRef = React.useRef<CloudBrowserClient | null>(null);
  const handoffReadyRef = React.useRef(false);
  const pendingControlRef = React.useRef(false);
  const activatedRef = React.useRef(isControlActivated);
  activatedRef.current = isControlActivated;
  const [status, setStatus] = React.useState<ConnectionStatus>("connecting");
  const [aspectRatio, setAspectRatio] = React.useState(4 / 3);

  React.useEffect(() => {
    const video = videoRef.current;
    if (video == null || ownerConversationId == null) return;
    let disposed = false;
    let dataChannel: RTCDataChannel | null = null;
    let videoPlaying = false;
    let handoffReady = targetTabId == null;
    let outcomeSent = false;
    let acknowledgementTimer: ReturnType<typeof setTimeout> | null = null;
    const maybeTakeControl = (): void => {
      if (activatedRef.current && handoffReadyRef.current) {
        pendingControlRef.current = false;
        client.setMode("control");
      }
    };
    const maybeStream = (): void => {
      if (videoPlaying && dataChannel != null && handoffReady) setStatus(normalizeConnectionStatus("streaming"));
    };
    const sendOutcome = (outcome: "error" | "success", reason: string): boolean => {
      if (outcomeSent || dataChannel == null) return false;
      try {
        dataChannel.send(JSON.stringify({ client: "codex", event: "browser/client_outcome", outcome, reason }));
        outcomeSent = true;
        return true;
      } catch { return false; }
    };
    const realtimeUrl = new URL("https://realtime.chatgpt.com/v1/cua");
    realtimeUrl.searchParams.set("cid", ownerConversationId);
    realtimeUrl.searchParams.set("source", "flora");
    const client = new CloudBrowserClient(realtimeUrl.toString(), getPeerFetch());
    clientRef.current = client;
    const onPlaying = (): void => {
      if (disposed) return;
      videoPlaying = true;
      maybeStream();
      if (handoffReady) sendOutcome("success", "video_playing");
    };
    const onVideoError = (): void => {
      if (disposed) return;
      setStatus("error");
      if (sendOutcome("error", "video_error")) acknowledgementTimer = setTimeout(() => client.disconnect(), OUTCOME_ACK_TIMEOUT_MS);
    };
    video.addEventListener("playing", onPlaying);
    video.addEventListener("error", onVideoError);
    client.addEventListener("streaming", (value) => {
      if (disposed || !(value instanceof MediaStream)) return;
      video.srcObject = value;
      maybeStream();
    });
    client.addEventListener("dataopened", (value) => {
      if (disposed || !(value instanceof RTCDataChannel)) return;
      dataChannel = value;
      handoffReadyRef.current = handoffReady;
      if (targetTabId != null) value.send(JSON.stringify({ conversation_id: ownerConversationId, event: "browser/handoff", tab_id: targetTabId }));
      maybeStream();
      maybeTakeControl();
    });
    client.addEventListener("dataclosed", () => { dataChannel = null; handoffReadyRef.current = false; });
    client.addEventListener("message", (value) => {
      if (disposed || !isBrowserControlMessage(value)) return;
      if (value.event === "browser/client_outcome/ack") {
        if (acknowledgementTimer != null) clearTimeout(acknowledgementTimer);
        client.disconnect();
      } else if (value.event === "browser/handoff/ready") {
        handoffReady = true;
        handoffReadyRef.current = dataChannel != null;
        maybeTakeControl();
        maybeStream();
        if (videoPlaying) sendOutcome("success", "video_playing");
      } else if (value.event === "browser/handoff/error") {
        setStatus("error");
        if (sendOutcome("error", "handoff_error")) acknowledgementTimer = setTimeout(() => client.disconnect(), OUTCOME_ACK_TIMEOUT_MS);
      }
    });
    client.addEventListener("modechange", (value) => {
      const controlling = value === "control";
      client.setKeyEventSource(controlling ? video : null);
      client.setMouseEventSource(controlling ? video : null);
    });
    client.addEventListener("error", () => {
      if (disposed) return;
      setStatus("error");
      if (sendOutcome("error", "connection_error")) acknowledgementTimer = setTimeout(() => client.disconnect(), OUTCOME_ACK_TIMEOUT_MS);
    });
    void client.connect().catch(() => {
      if (!disposed) setStatus("error");
    });
    return () => {
      disposed = true;
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("error", onVideoError);
      if (acknowledgementTimer != null) clearTimeout(acknowledgementTimer);
      dataChannel = null;
      handoffReadyRef.current = false;
      pendingControlRef.current = false;
      video.srcObject = null;
      client.disconnect();
      clientRef.current = null;
    };
  }, [ownerConversationId, targetTabId]);

  const unavailable = status === "error" || ownerConversationId == null;
  const overlay = unavailable
    ? jsxRuntime.jsx("div", {
        className: "absolute inset-0 flex items-center justify-center bg-media-background text-sm text-media-foreground/70",
        children: targetTabId == null
          ? jsxRuntime.jsx(FormattedMessage, { id: "chatgptConversations.cloudBrowser.liveView.unavailable", defaultMessage: "Cloud browser is unavailable", description: "Error shown when an interactive ChatGPT cloud browser session cannot be opened" })
          : jsxRuntime.jsx(FormattedMessage, { id: "chatgptConversations.cloudBrowser.liveView.tabUnavailable", defaultMessage: "This browser tab is no longer available", description: "Error shown when an assistant's secure cloud-browser handoff targets a tab that has closed or does not belong to this conversation" }),
      })
    : jsxRuntime.jsxs("div", {
        "aria-hidden": status === "streaming",
        className: classNames("_loadingOverlay_xyuo8_2", "absolute inset-0 flex items-center justify-center gap-2 text-sm text-media-foreground/70 duration-relaxed ease-enter motion-reduce:transition-none"),
        role: "status",
        children: [
          jsxRuntime.jsx(LoadingSpinner, { className: "icon-sm" }),
          jsxRuntime.jsx(FormattedMessage, { id: "chatgptConversations.cloudBrowser.liveView.connecting", defaultMessage: "Connecting to cloud browser…", description: "Loading status shown while an interactive ChatGPT cloud browser session connects" }),
        ],
      });
  const updateAspectRatio = (event: { currentTarget: { videoHeight: number; videoWidth: number } }): void => {
    if (event.currentTarget.videoWidth > 0 && event.currentTarget.videoHeight > 0) setAspectRatio(event.currentTarget.videoWidth / event.currentTarget.videoHeight);
  };
  const ariaLabel = intl.formatMessage({ id: "chatgptConversations.cloudBrowser.liveView.ariaLabel", defaultMessage: "Live cloud browser", description: "Accessible label for the interactive video of the cloud browser used by a ChatGPT Work task" });
  const activateFromPointer = (event: { currentTarget: HTMLVideoElement }): void => {
    event.currentTarget.focus();
    if (activatedRef.current && handoffReadyRef.current) clientRef.current?.setMode("control");
  };
  const takeControl = (): void => {
    onControlActivation();
    videoRef.current?.focus();
    const client = clientRef.current;
    if (client == null || !handoffReadyRef.current) pendingControlRef.current = true;
    else client.setMode("control");
  };
  const video = jsxRuntime.jsx("video", {
    ref: videoRef,
    "aria-label": ariaLabel,
    autoPlay: true,
    className: "size-full object-contain transition-opacity duration-relaxed ease-enter focus-visible:outline-none motion-reduce:transition-none",
    muted: true,
    onLoadedMetadata: updateAspectRatio,
    onPointerDown: activateFromPointer,
    onResize: updateAspectRatio,
    playsInline: true,
    tabIndex: 0,
  });
  const controlOverlay = !unavailable && !isControlActivated
    ? jsxRuntime.jsx("button", {
        className: "absolute inset-0 cursor-interaction bg-transparent",
        type: "button",
        onClick: takeControl,
        children: jsxRuntime.jsx("span", {
          className: "pointer-events-none absolute inset-x-0 top-full flex h-12 items-center justify-center px-4 text-center text-sm text-media-foreground/50",
          children: jsxRuntime.jsx(FormattedMessage, { id: "chatgptConversations.cloudBrowser.liveView.takeControl", defaultMessage: "Click anywhere to use the browser", description: "Instruction centered below the live Cloud browser before a user activates interactive control" }),
        }),
      })
    : null;
  return jsxRuntime.jsx("div", {
    className: "_viewport_xyuo8_2 relative flex min-h-0 flex-1 items-center justify-center bg-media-background pb-12",
    "data-codex-cloud-browser": true,
    children: jsxRuntime.jsxs("div", {
      className: "_videoFrame_xyuo8_2 relative",
      "data-streaming": status === "streaming" || undefined,
      style: { width: "min(100cqw, " + (100 * aspectRatio) + "cqh)", height: "min(100cqh, " + (100 / aspectRatio) + "cqw)" },
      children: [video, overlay, controlOverlay],
    }),
  });
}

function ChatGptCloudBrowserSidePanel({ conversationId, browserOwnerConversationId: explicitOwner, targetTabId }: ChatGptCloudBrowserSidePanelProps): unknown {
  const [controlActivated, setControlActivated] = React.useState(false);
  const screenshots = readSignalFamily<readonly CloudBrowserScreenshot[]>(cloudBrowserScreenshots, conversationId);
  const modeState = readSignalFamily<BrowserModeState>(cloudBrowserMode, conversationId);
  const activeScreenshot = screenshots[selectActiveScreenshotIndex(modeState, screenshots)] as CloudBrowserScreenshot | undefined;
  const liveView = modeState.mode === "live"
    ? jsxRuntime.jsx(CloudBrowserLiveView, {
        browserOwnerConversationId: explicitOwner ?? activeScreenshot?.browser_conversation_id,
        conversationId,
        isControlActivated: controlActivated,
        onControlActivation: () => setControlActivated(true),
        targetTabId,
      })
    : undefined;
  return jsxRuntime.jsx("div", {
    className: "flex size-full min-h-0 flex-col border-t-hairline border-default bg-media-background",
    children: jsxRuntime.jsx(CloudBrowserPreview, {
      conversationId,
      liveView,
      screenshots,
      variant: "expanded",
    }),
  });
}

function initializeCloudBrowserSidePanel(): void {
  if (initialized) return;
  initialized = true;
  initializeJsxRuntimeLazy();
  initializeMaitaiRuntime();
  initializeClassNames();
  initializeAppUtilities();
  initializeCloudBrowserHooks();
  initializeBrowserAuth();
  initializeNetworkState();
  initializeIntl();
  initializeCloudBrowserState();
  initializeCloudBrowserPreview();
  React = getReactRuntime();
  jsxRuntime = getJsxRuntime();
}

initializeCloudBrowserSidePanel();

export { ChatGptCloudBrowserSidePanel };
