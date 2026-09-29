import "@rchunk/rolldown-runtime";
import { e6 as getReactRuntime, I3 as getJsxRuntime, n4 as useIntl } from "@rchunk/app-shared";
import { ofn as isGateEnabled, pnt as appServices } from "@rchunk/app-initial";
import "@rchunk/artifact-presentation";
import "@rchunk/spreadsheet-editor";
import "@rchunk/app-primary";
import "@rchunk/draw-presence-label";
import "@rchunk/presentation-review-utils";
import "@rchunk/workbook-review-utils";
import { t as ArtifactLayout } from "@rchunk/artifact-layout";
import { n as CommentsControl, t as EditorHeader } from "@rchunk/editor-header";
import { t as ArtifactFeedbackButton } from "@rchunk/artifact-feedback-button";
import { t as OpenInButton } from "@rchunk/open-in-button";
import "@rchunk/artifact-annotation-comment";
import "@rchunk/sidebar-panel";
import { n as renderPaneLayout } from "@rchunk/pane-layout";

const React = getReactRuntime();
const jsx = getJsxRuntime();

type ArtifactSessionKind = "presentation" | "spreadsheet";
type ArtifactSessionProblem = "invalid-session" | "persistence";

interface ArtifactSessionUpdate {
  baseStateVersion?: number;
  bytes: ArrayLike<number>;
  originId?: string;
  stateVersion?: number;
  updateId: string;
}

interface CommittedArtifactSessionUpdate {
  stateVersion: number;
  update: ArtifactSessionUpdate;
}

interface ArtifactSessionRecord {
  artifactRef: string;
  checkpointCrdtState: ArrayLike<number>;
  checkpointStateVersion: number;
  initialArtifactProto: ArrayLike<number>;
  kind: ArtifactSessionKind;
  stateVersion: number;
  title?: string | null;
  updates: ArtifactSessionUpdate[];
}

interface ArtifactSessionSubscription {
  append(update: ArtifactSessionUpdate): Promise<{ stateVersion: number }>;
  markDirty?(): void | { [Symbol.dispose]?(): void };
  readAsset?(request: { sha256: string }): Promise<ArrayLike<number> | null>;
  unsubscribe?(): void | { [Symbol.dispose]?(): void };
  [Symbol.dispose]?(): void;
}

interface ArtifactSessionOpenResponse {
  record: ArtifactSessionRecord;
  subscription: ArtifactSessionSubscription;
  [Symbol.dispose]?(): void;
}

interface ArtifactSessionsService {
  open(
    request: { artifactRef: string; threadId: string },
    onCommittedUpdate: (update: CommittedArtifactSessionUpdate) => void,
    flushFromHost: () => Promise<void>,
  ): Promise<ArtifactSessionOpenResponse>;
}

interface CrdtController {
  flushCrdtUpdates?(): Promise<void>;
}

interface ImageHydrationRequest {
  assetId: string;
  contentType: string;
  uri: string;
}

interface ImageHydrationAsset extends ImageHydrationRequest {
  data: Uint8Array;
}

interface StartingSnapshot { status: "starting" }
interface FailedSnapshot { problem: ArtifactSessionProblem; status: "failed" }
interface LiveSnapshot {
  externalCrdtUpdates: Uint8Array[];
  initialArtifactBytes: Uint8Array;
  initialCrdtState: Uint8Array;
  kind: ArtifactSessionKind;
  problem: ArtifactSessionProblem | null;
  stateVersion: number;
  status: "live";
  title?: string | null;
}
type ArtifactSessionSnapshot = StartingSnapshot | FailedSnapshot | LiveSnapshot;

interface ArtifactSessionTabContentProps {
  artifactRef: string;
  hostId: string;
  kind: ArtifactSessionKind;
  onClose(): void;
  renderSlots?: unknown;
  reviewTools?: unknown;
  tabId?: string;
  threadId: string;
  title: string;
}

interface SessionControllerOptions {
  artifactRef: string;
  artifactSessions: ArtifactSessionsService;
  kind: ArtifactSessionKind;
  threadId: string;
}

const services = appServices as unknown as { artifactSessions?: ArtifactSessionsService };
const ASSET_URI = /^artifact-session-asset:sha256:([0-9a-f]{64})$/;
const STARTING_SNAPSHOT: StartingSnapshot = { status: "starting" };

function disposeResource(resource: unknown): void {
  if ((typeof resource !== "object" && typeof resource !== "function") || resource == null) return;
  const disposable = resource as { [Symbol.dispose]?: () => void };
  disposable[Symbol.dispose]?.();
}

function validateRecord(record: ArtifactSessionRecord, artifactRef: string): void {
  if (record.artifactRef !== artifactRef
    || record.initialArtifactProto.length === 0
    || record.checkpointCrdtState.length === 0
    || record.checkpointStateVersion < 0
    || record.stateVersion < record.checkpointStateVersion) {
    throw new Error("Invalid Artifact Session bootstrap record");
  }
  let version = record.checkpointStateVersion;
  const updateIds = new Set<string>();
  for (const update of record.updates) {
    if (update.stateVersion !== version + 1
      || update.stateVersion > record.stateVersion
      || update.bytes.length === 0
      || updateIds.has(update.updateId)) {
      throw new Error("Invalid Artifact Session update history");
    }
    version = update.stateVersion;
    updateIds.add(update.updateId);
  }
  if (version !== record.stateVersion) throw new Error("Incomplete Artifact Session update history");
}

function randomId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

class ArtifactSessionController {
  readonly #options: SessionControllerOptions;
  readonly #listeners = new Set<() => void>();
  readonly #originId = randomId();
  readonly #seenUpdateIds = new Set<string>();
  #appendQueue: ArtifactSessionUpdate[] = [];
  #appendPromise: Promise<void> | null = null;
  #crdtController: CrdtController | null = null;
  #initializationPromise: Promise<void> | null = null;
  #openResponse: ArtifactSessionOpenResponse | null = null;
  #snapshot: ArtifactSessionSnapshot = STARTING_SNAPSHOT;
  #stateVersion = 0;
  #subscription: ArtifactSessionSubscription | null = null;

  constructor(options: SessionControllerOptions) {
    this.#options = options;
  }

  getSnapshot = (): ArtifactSessionSnapshot => this.#snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    void this.#initialize();
    return () => { this.#listeners.delete(listener); };
  };

  attachCrdtController = (controller: CrdtController): void => {
    this.#crdtController = controller;
  };

  onCrdtUpdate = (bytes: ArrayLike<number>): void => {
    if (bytes.length === 0 || this.#subscription == null) return;
    disposeResource(this.#subscription.markDirty?.());
    this.#appendQueue.push({
      baseStateVersion: this.#stateVersion,
      bytes: new Uint8Array(bytes),
      originId: this.#originId,
      updateId: randomId(),
    });
    void this.#appendQueuedUpdates();
  };

  onCrdtDrain = (drain: Promise<void>): void => {
    void drain.then(() => this.#appendQueuedUpdates(), () => this.#setProblem("persistence"));
  };

  onCrdtDrainAttemptFailed = (): void => { this.#setProblem("persistence"); };

  retry = (): void => {
    this.#setProblem(null);
    if (this.#subscription == null) void this.#initialize();
    else void this.#appendQueuedUpdates();
  };

  resolveImageHydrationAssets = async (requests: ImageHydrationRequest[]): Promise<ImageHydrationAsset[]> => {
    const subscription = this.#subscription;
    if (subscription?.readAsset == null) return [];
    const assets = await Promise.all(requests.map(async (request) => {
      const digest = ASSET_URI.exec(request.uri)?.[1];
      if (digest == null) return null;
      const bytes = await subscription.readAsset?.({ sha256: digest });
      return bytes == null ? null : { ...request, data: new Uint8Array(bytes) };
    }));
    const resolved: ImageHydrationAsset[] = [];
    for (const asset of assets) {
      if (asset != null) resolved.push(asset);
    }
    return resolved;
  };

  async #initialize(): Promise<void> {
    if (this.#initializationPromise != null || this.#subscription != null) {
      await this.#initializationPromise;
      return;
    }
    this.#initializationPromise = this.#initializeOnce().finally(() => { this.#initializationPromise = null; });
    await this.#initializationPromise;
  }

  async #initializeOnce(): Promise<void> {
    let response: ArtifactSessionOpenResponse;
    try {
      response = await this.#options.artifactSessions.open(
        { artifactRef: this.#options.artifactRef, threadId: this.#options.threadId },
        this.#handleCommittedUpdate,
        this.#flushFromHost,
      );
    } catch {
      this.#setSnapshot({ problem: "persistence", status: "failed" });
      return;
    }
    try {
      validateRecord(response.record, this.#options.artifactRef);
      if (response.record.kind !== this.#options.kind) throw new Error("Artifact Session kind mismatch");
    } catch {
      disposeResource(response.subscription.unsubscribe?.());
      disposeResource(response);
      this.#setSnapshot({ problem: "invalid-session", status: "failed" });
      return;
    }
    this.#openResponse = response;
    this.#subscription = response.subscription;
    this.#stateVersion = response.record.stateVersion;
    for (const update of response.record.updates) this.#seenUpdateIds.add(update.updateId);
    this.#setSnapshot({
      externalCrdtUpdates: response.record.updates.map((update) => new Uint8Array(update.bytes)),
      initialArtifactBytes: new Uint8Array(response.record.initialArtifactProto),
      initialCrdtState: new Uint8Array(response.record.checkpointCrdtState),
      kind: response.record.kind,
      problem: null,
      stateVersion: response.record.stateVersion,
      status: "live",
      title: response.record.title,
    });
  }

  #handleCommittedUpdate = (event: CommittedArtifactSessionUpdate): void => {
    const update = event.update;
    if (this.#snapshot.status !== "live"
      || event.stateVersion !== update.stateVersion
      || update.bytes.length === 0
      || this.#seenUpdateIds.has(update.updateId)) return;
    this.#seenUpdateIds.add(update.updateId);
    this.#stateVersion = Math.max(this.#stateVersion, event.stateVersion);
    if (update.originId === this.#originId) return;
    this.#setSnapshot({
      ...this.#snapshot,
      externalCrdtUpdates: [...this.#snapshot.externalCrdtUpdates, new Uint8Array(update.bytes)],
      stateVersion: event.stateVersion,
    });
  };

  async #appendQueuedUpdates(): Promise<void> {
    if (this.#appendPromise != null) return this.#appendPromise;
    const subscription = this.#subscription;
    if (subscription == null) return;
    this.#appendPromise = (async () => {
      while (this.#appendQueue.length > 0) {
        const update = this.#appendQueue[0];
        if (update == null) return;
        try {
          const result = await subscription.append(update);
          this.#stateVersion = Math.max(this.#stateVersion, result.stateVersion);
          this.#appendQueue.shift();
          this.#setProblem(null);
        } catch {
          this.#setProblem("persistence");
          return;
        }
      }
    })().finally(() => { this.#appendPromise = null; });
    return this.#appendPromise;
  }

  #flushFromHost = async (): Promise<void> => {
    await this.#crdtController?.flushCrdtUpdates?.();
    await this.#appendQueuedUpdates();
    if (this.#appendQueue.length > 0) throw new Error("Artifact Session viewer updates are not durable yet");
  };

  #setProblem(problem: ArtifactSessionProblem | null): void {
    if (this.#snapshot.status === "live") {
      if (this.#snapshot.problem !== problem) this.#setSnapshot({ ...this.#snapshot, problem });
    } else if (problem != null) {
      this.#setSnapshot({ problem, status: "failed" });
    }
  }

  #setSnapshot(snapshot: ArtifactSessionSnapshot): void {
    this.#snapshot = snapshot;
    for (const listener of this.#listeners) listener();
  }
}

const PresentationPanel = React.lazy(async () => {
  const { PopcornElectronPresentationPanel } = await import("@rchunk/popcorn-presentation-panel");
  return { default: PopcornElectronPresentationPanel };
});
const WorkbookPanel = React.lazy(async () => {
  const { PopcornElectronWorkbookPanel } = await import("@rchunk/popcorn-workbook-panel");
  return { default: PopcornElectronWorkbookPanel };
});

function renderWithLayout(content: unknown, renderLayout?: (parts: unknown) => unknown): unknown {
  return jsx.jsx(ArtifactLayout, { content, header: null, renderLayout });
}

function LoadingSession({ kind, renderLayout }: { kind: ArtifactSessionKind; renderLayout?: (parts: unknown) => unknown }): unknown {
  const intl = useIntl();
  return renderWithLayout(jsx.jsx("div", {
    className: "flex h-full items-center justify-center",
    "aria-busy": true,
    children: kind === "presentation"
      ? intl.formatMessage({ id: "artifactSession.loadingPresentation", defaultMessage: "Opening live slide deck…" })
      : intl.formatMessage({ id: "artifactSession.loading", defaultMessage: "Opening live spreadsheet…" }),
  }), renderLayout);
}

function LiveArtifactSession({
  controller,
  hostId,
  onClose,
  renderLayout,
  reviewTools,
  snapshot,
  tabId,
  title,
  artifactRef,
  threadId,
}: ArtifactSessionTabContentProps & {
  controller: ArtifactSessionController;
  renderLayout?: (parts: unknown) => unknown;
  snapshot: LiveSnapshot;
}): unknown {
  const intl = useIntl();
  const commentsEnabled = isGateEnabled("1292007209");
  const [commentsOpen, setCommentsOpen] = React.useState(false);
  const resolvedTitle = snapshot.title ?? title;
  const openIn = jsx.jsx(OpenInButton, {
    artifactRef,
    hostId,
    kind: snapshot.kind,
    threadId,
    title: resolvedTitle,
    variant: commentsEnabled ? "title" : "menu",
  });
  const commentsControl = commentsEnabled
    ? jsx.jsx(CommentsControl, { open: commentsOpen, onOpenChange: setCommentsOpen })
    : null;
  const feedback = jsx.jsx(ArtifactFeedbackButton, {
    artifacts: [{ artifactRef, artifactType: snapshot.kind === "presentation" ? "slides" : "spreadsheet", title: resolvedTitle }],
    hostId,
    variant: "icon",
  });
  const renderHeader = (controls: unknown) => jsx.jsx(EditorHeader, {
    actions: openIn,
    commentsControl,
    controls: typeof controls === "object" && controls != null ? controls : {},
    onClose,
    tabId,
    title: resolvedTitle,
  });
  const sharedProps = {
    annotationsEnabled: commentsEnabled,
    className: "h-full min-h-0",
    externalCrdtUpdates: snapshot.externalCrdtUpdates,
    headerCenterContent: commentsEnabled ? resolvedTitle : null,
    headerRightContent: commentsEnabled ? null : openIn,
    initialCrdtState: snapshot.initialCrdtState,
    initialSourceBytes: snapshot.initialArtifactBytes,
    isEditing: true,
    onControllerReady: controller.attachCrdtController,
    onCrdtDrain: controller.onCrdtDrain,
    onCrdtDrainAttemptFailed: controller.onCrdtDrainAttemptFailed,
    onCrdtUpdate: controller.onCrdtUpdate,
    renderHeader: commentsEnabled ? renderHeader : undefined,
    renderLayout,
    resolveImageHydrationAssets: controller.resolveImageHydrationAssets,
    reviewTools: commentsEnabled ? reviewTools : undefined,
    title: resolvedTitle,
  };
  const panel = snapshot.kind === "presentation"
    ? jsx.jsx(PresentationPanel, {
        ...sharedProps,
        zoomToFitLabel: intl.formatMessage({ id: "artifactViewer.zoomToFit", defaultMessage: "Zoom to fit" }),
      })
    : jsx.jsx(WorkbookPanel, { ...sharedProps, toolbarHidden: false });
  const commentsSidebar = commentsEnabled && commentsOpen
    ? jsx.jsxs("aside", { "aria-label": "Artifact comments", children: [feedback, "Comments"] })
    : null;

  return jsx.jsxs("div", {
    className: "flex h-full min-h-0 flex-col",
    children: [
      jsx.jsx("div", {
        className: "min-h-0 flex-1",
        children: jsx.jsx(React.Suspense, {
          fallback: jsx.jsx(LoadingSession, { kind: snapshot.kind, renderLayout }),
          children: jsx.jsxs("div", { className: "flex h-full min-h-0", children: [panel, commentsSidebar] }),
        }),
      }),
      snapshot.problem == null ? null : jsx.jsxs("div", {
        role: "status",
        className: "shrink-0 px-2 pt-1 pb-2",
        children: [
          intl.formatMessage({ id: "artifactSession.syncProblem", defaultMessage: "Changes may not be synced to this Artifact Session yet." }),
          jsx.jsx("button", { type: "button", onClick: controller.retry, children: intl.formatMessage({ id: "artifactSession.retry", defaultMessage: "Try again" }) }),
        ],
      }),
    ],
  });
}

function ConnectedArtifactSession(props: ArtifactSessionTabContentProps & {
  artifactSessions: ArtifactSessionsService;
  renderLayout?: (parts: unknown) => unknown;
}): unknown {
  const intl = useIntl();
  const [controller] = React.useState(() => new ArtifactSessionController({
    artifactRef: props.artifactRef,
    artifactSessions: props.artifactSessions,
    kind: props.kind,
    threadId: props.threadId,
  }));
  const snapshot = React.useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  if (snapshot.status === "starting") return jsx.jsx(LoadingSession, { kind: props.kind, renderLayout: props.renderLayout });
  if (snapshot.status === "failed") {
    const message = props.kind === "presentation"
      ? intl.formatMessage({ id: "artifactSession.loadPresentationFailed", defaultMessage: "Couldn’t open this live slide deck" })
      : intl.formatMessage({ id: "artifactSession.loadFailed", defaultMessage: "Couldn’t open this live spreadsheet." });
    return renderWithLayout(jsx.jsxs("div", {
      className: "flex h-full flex-col items-center justify-center gap-3",
      children: [
        message,
        snapshot.problem === "persistence"
          ? jsx.jsx("button", { type: "button", onClick: controller.retry, children: intl.formatMessage({ id: "artifactSession.retry", defaultMessage: "Try again" }) })
          : null,
      ],
    }), props.renderLayout);
  }
  return jsx.jsx(LiveArtifactSession, { ...props, controller, snapshot });
}

function ArtifactSessionTabContent(props: ArtifactSessionTabContentProps): unknown {
  const { renderSlots, ...sessionProps } = props;
  const renderLayout = renderSlots == null ? undefined : (parts: unknown) => renderPaneLayout(renderSlots, parts);
  const artifactSessions = services.artifactSessions;
  if (artifactSessions == null) {
    return renderWithLayout(jsx.jsx("div", {
      className: "flex h-full items-center justify-center",
      children: "Live Artifact Sessions aren’t available in this app host.",
    }), renderLayout);
  }
  return jsx.jsx(ConnectedArtifactSession, { ...sessionProps, artifactSessions, renderLayout });
}

export { ArtifactSessionTabContent };
