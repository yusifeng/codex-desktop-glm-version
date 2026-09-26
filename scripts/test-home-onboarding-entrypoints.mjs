import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadModule(name, mocks) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", name, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [
      {
        name: "mock-renderer-chunks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
            path: importPath.slice("@rchunk/".length),
            namespace: "mock-renderer-chunk",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock-renderer-chunk" },
            ({ path: importPath }) => ({
              contents: mocks[importPath] ?? "export {};",
              loader: "js",
            }),
          );
        },
      },
    ],
  });
  const url = `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`;
  return import(url);
}

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

globalThis.__homeOnboardingTest = {
  artifactCalls: [],
  initializers: [],
  jsx: {
    Fragment: "fragment",
    jsx(type, props) {
      return { type, props };
    },
    jsxs(type, props) {
      return { type, props };
    },
  },
  react: {
    useEffect(effect) {
      effect();
    },
    useRef(value) {
      return { current: value };
    },
  },
};

const announcement = await loadModule("home-announcement-slot", {
  "app-initial": `
    export const HNt = { HomeAnnouncement: "home-announcement" };
    export const JNt = () => {};
  `,
  "app-primary": `
    export const Ah = () => {};
    export const kh = "Claim";
  `,
  "app-shared": `
    export const e6 = globalThis.__homeOnboardingTest.react;
    export const I3 = globalThis.__homeOnboardingTest.jsx;
  `,
});
announcement.n();
check(
  announcement.t({
    entries: [
      { content: "first", isEligible: true, isLoading: false },
      { content: "second", isEligible: true, isLoading: false },
    ],
    trackVisibility: false,
  }) === "first",
  "selects the first eligible announcement",
);
check(
  announcement.t({
    entries: [
      { content: null, isEligible: false, isLoading: true },
      { content: "later", isEligible: true, isLoading: false },
    ],
  }) === null,
  "waits when a higher-priority announcement is loading",
);
const claimed = announcement.t({
  entries: [
    {
      content: "content",
      isEligible: true,
      isLoading: false,
      pageContextClaim: "entry-claim",
    },
  ],
});
check(claimed.type === "Claim", "wraps tracked announcements in claims");
check(
  claimed.props.claim === "home-announcement" &&
    claimed.props.children.props.claim === "entry-claim",
  "preserves visibility and entry claims",
);

const preview = await loadModule("home-prefill-artifact-preview", {
  "app-initial": `
    export const $en = Symbol("route");
    export const Dyt = Symbol("host");
    export const Ult = (...args) => globalThis.__homeOnboardingTest.artifactCalls.push(args);
  `,
  "app-shared": `
    export const e6 = globalThis.__homeOnboardingTest.react;
    export const LX = () => ({ get: () => "local-host" });
  `,
});
const previewResult = preview.HomePrefillArtifactPreview({
  locationKey: "home-1",
  previewFiles: [
    { fsPath: "/tmp/report.pdf", path: "/ignored", label: "Report" },
    { path: "/tmp/chart.png", label: "Chart" },
    { path: "" },
  ],
});
check(previewResult === null, "preview bridge renders no UI");
check(
  globalThis.__homeOnboardingTest.artifactCalls.length === 2,
  "opens valid preview files",
);
check(
  globalThis.__homeOnboardingTest.artifactCalls[0][1] === "/tmp/report.pdf",
  "prefers filesystem paths",
);
check(
  globalThis.__homeOnboardingTest.artifactCalls[0][2].hostId === "local-host" &&
    globalThis.__homeOnboardingTest.artifactCalls[0][2].title === "Report",
  "forwards host and title",
);

const dialog = await loadModule("dialog-launcher-entry", {
  "dialog-launcher-core": `
    export const n = () => "opened";
    export const t = () => globalThis.__homeOnboardingTest.initializers.push("dialog");
  `,
});
check(
  dialog.openBrowserProfileImportDialog() === "opened" &&
    globalThis.__homeOnboardingTest.initializers.includes("dialog"),
  "initializes and re-exports the dialog launcher",
);

const tools = await loadModule("onboarding-interactive-tools", {
  "app-initial": `
    export const C_n = { kind: "schema" };
    export const b_n = () => globalThis.__homeOnboardingTest.initializers.push("tools");
  `,
});
check(
  tools.setupCodexStepArgumentsSchema.kind === "schema" &&
    globalThis.__homeOnboardingTest.initializers.includes("tools"),
  "initializes and re-exports the tool schema",
);

const voice = await loadModule("realtime-voice-launch-surface-entry", {
  "realtime-voice-launch-surface": `
    export const n = () => globalThis.__homeOnboardingTest.initializers.push("voice");
    export const t = "VoiceSurface";
  `,
});
check(
  voice.RealtimeVoiceLaunchSurface === "VoiceSurface" &&
    globalThis.__homeOnboardingTest.initializers.includes("voice"),
  "initializes and re-exports the voice surface",
);

const beacon = await loadModule("codex-app-home-beacon-announcement-entry", {
  "codex-app-home-beacon-announcement-core": `
      export const r = () => globalThis.__homeOnboardingTest.initializers.push("beacon");
      export const t = "BeaconContent";
    `,
});
check(
  beacon.CodexAppHomeBeaconAnnouncementContent === "BeaconContent" &&
    globalThis.__homeOnboardingTest.initializers.includes("beacon"),
  "initializes and re-exports beacon content",
);

globalThis.__homeOnboardingTest.openedLinks = [];
const access = await loadModule("access-splash", {
  "app-initial": `
    export const i7 = "ExternalLink";
    export const Oft = value => globalThis.__homeOnboardingTest.openedLinks.push(value);
  `,
  "app-shared": "export const I3 = globalThis.__homeOnboardingTest.jsx;",
  lock: `
    export const n = () => globalThis.__homeOnboardingTest.initializers.push("lock");
    export const t = "Lock";
  `,
});
access.n();
const accessTree = access.t({
  accessMessage: "No access",
  description: "Description",
  learnMoreLabel: "Learn more",
  learnMoreUrl: "https://example.com/learn",
  title: "Title",
});
const accessNodes = (function walk(node) {
  if (node == null || typeof node !== "object") return [];
  const children = node.props?.children;
  return [
    node,
    ...(Array.isArray(children) ? children.flatMap(walk) : walk(children)),
  ];
})(accessTree);
check(accessTree.type === "main", "renders access splash as the main region");
const learnMore = accessNodes.find((node) => node.type === "a");
check(
  learnMore.props.href === "https://example.com/learn",
  "renders the learn-more destination",
);
learnMore.props.onClick("event");
check(
  globalThis.__homeOnboardingTest.openedLinks[0].initiator ===
    "open_in_browser_bridge",
  "routes learn-more clicks through the browser bridge",
);
check(
  accessNodes.some((node) => node.type === "Lock"),
  "renders the access lock icon",
);

const localSplash = await loadModule("codex-local-access-splash", {
  "access-splash": `
    export const n = () => globalThis.__homeOnboardingTest.initializers.push("access-local");
    export const t = "AccessSplash";
  `,
  "app-shared": `
    export const I3 = globalThis.__homeOnboardingTest.jsx;
    export const Y2 = "Message";
  `,
});
const localTree = localSplash.CodexLocalAccessSplash();
check(
  localTree.type === "AccessSplash",
  "composes the shared Codex access splash",
);
check(
  localTree.props.learnMoreUrl === "https://chatgpt.com/codex/",
  "uses the Codex learn-more URL",
);

const workSplash = await loadModule("work-mode-access-splash", {
  "access-splash": `
    export const n = () => globalThis.__homeOnboardingTest.initializers.push("access-work");
    export const t = "AccessSplash";
  `,
  "app-primary": `
    export const Cg = "ModeToggleContext";
    export const wg = () => {};
  `,
  "app-shared": `
    export const I3 = globalThis.__homeOnboardingTest.jsx;
    export const Y2 = "Message";
  `,
});
const workTree = workSplash.WorkModeAccessSplash({ modeToggle: "toggle" });
check(
  workTree.props.children[0].type === "ModeToggleContext",
  "wraps the Work mode toggle in context",
);
check(
  workTree.props.children[1].props.learnMoreUrl ===
    "https://openai.com/chatgpt-work/",
  "uses the Work learn-more URL",
);

globalThis.__homeOnboardingTest.activeAccountId = "account-1";
globalThis.__homeOnboardingTest.dismissedModals = [];
const beaconModal = await loadModule("beacon-modal", {
  "app-initial": `
    export const U6t = Symbol("active-account");
    export const zzt = (_scope, modal) => globalThis.__homeOnboardingTest.dismissedModals.push(modal);
  `,
  "app-shared": `
    export const ZI = Symbol("scope");
    export const LX = () => ({ id: "scope" });
    export const HX = () => globalThis.__homeOnboardingTest.activeAccountId;
    export const e6 = globalThis.__homeOnboardingTest.react;
    export const I3 = globalThis.__homeOnboardingTest.jsx;
    export const Jm = () => "LazyPepperModal";
  `,
  "pepper-onboarding-modal":
    "export const PepperOnboardingModal = 'PepperModal';",
});
const matchingModal = beaconModal.PepperOnboardingBeaconModal({
  accountId: "account-1",
  onClose() {},
});
check(
  matchingModal.type === "LazyPepperModal" &&
    matchingModal.props.accountId === "account-1",
  "renders the lazy Pepper modal for the active account",
);
globalThis.__homeOnboardingTest.activeAccountId = "account-2";
check(
  beaconModal.PepperOnboardingBeaconModal({
    accountId: "account-1",
    onClose() {},
  }) === null && globalThis.__homeOnboardingTest.dismissedModals.length === 1,
  "dismisses stale-account Pepper modals",
);

globalThis.__homeOnboardingTest.cme = {
  mobile: false,
  selected: [],
};
const cmeEntry = await loadModule("home-entry-point", {
  "app-initial": `
    export const kht = Symbol("scope");
    export const v2 = Symbol("mode");
    export const HZ = () => ({ hasText: () => false, view: { state: {} }, focus: () => globalThis.__homeOnboardingTest.cme.selected.push("focus") });
    export const UZ = () => true;
    export const uht = () => ({ data: { id: "account-1", plan_type: "team" } });
    export const i_n = () => ({ search: "" });
    export const N9 = () => globalThis.__homeOnboardingTest.cme.mobile;
    export const Vln = () => true;
    export const yln = () => false;
    export const b2 = () => globalThis.__homeOnboardingTest.cme.selected.push("cme");
    export const xpn = () => globalThis.__homeOnboardingTest.cme.selected.push("analytics");
  `,
  "app-shared": `
    export const I3 = globalThis.__homeOnboardingTest.jsx;
    export const Yh = "Button";
    export const Y2 = "Message";
    export const Vb = "CmeIcon";
    export const wu = { getState: () => ({ active: false }) };
    export const LX = () => ({
      get: () => true,
      queryClient: { getQueryData: () => ({ account_ordering: ["account-1"] }) }
    });
    export const HX = () => true;
    export const sZ = () => Symbol("eligibility");
  `,
  "chatgpt-cme": `
    export const n = "cme-tool";
    export const r = () => {};
  `,
});
const cmeTree = cmeEntry.CmeHomeEntryPoint();
check(cmeTree.type === "div", "renders the eligible CME entry point");
check(
  cmeTree.props.children.props.children[1].props.defaultMessage.includes("CME"),
  "renders the CME call to action",
);
cmeTree.props.children.props.onClick();
check(
  globalThis.__homeOnboardingTest.cme.selected.join(",") ===
    "cme,focus,analytics",
  "selects CME, focuses the editor, and records the action",
);
globalThis.__homeOnboardingTest.cme.mobile = true;
check(cmeEntry.CmeHomeEntryPoint() === null, "hides CME on narrow viewports");

globalThis.__homeOnboardingTest.connect = [];
const beaconConnect = await loadModule("codex-app-home-beacon-connect-modal", {
  "app-connect-modal-by-id": `
    export const n = "ConnectById";
    export const r = () => {};
  `,
  "app-shared": `
    export const ZI = Symbol("scope");
    export const LX = () => ({ id: "scope" });
    export const e6 = { useState: value => [value, next => globalThis.__homeOnboardingTest.connect.push(["loading", next])] };
    export const I3 = globalThis.__homeOnboardingTest.jsx;
  `,
  "pca-connector-action": `
    export const r = async (_scope, target) => globalThis.__homeOnboardingTest.connect.push(["resume", target]);
    export const t = () => {};
  `,
  "use-app-connect-flow": `
    export const n = () => ({ handleAppConnectOAuthStarted: event => globalThis.__homeOnboardingTest.connect.push(["oauth", event]) });
    export const t = () => {};
  `,
});
const connectTree = beaconConnect.CodexAppHomeBeaconConnectModal({
  connectorId: "gmail",
  onOpenChange() {},
  pcaResumeTarget: "resume-1",
});
check(
  connectTree.type === "ConnectById" &&
    connectTree.props.waitForConnectedHandler === true &&
    connectTree.props.allowBrowserFallback === false,
  "configures resumed Beacon connections",
);
await connectTree.props.onConnected();
check(
  globalThis.__homeOnboardingTest.connect.some(
    ([kind, value]) => kind === "resume" && value === "resume-1",
  ),
  "resumes PCA after connection",
);
connectTree.props.onOAuthStarted({ connectorId: "gmail" });
check(
  globalThis.__homeOnboardingTest.connect.at(-1)[1].resumeTarget === "resume-1",
  "forwards the PCA resume target into OAuth",
);

const pastedConnect = await loadModule("pasted-link-connect-modal", {
  "app-connect-modal": `
    export const n = () => {};
    export const t = "ConnectModal";
  `,
  "app-info": `
    export const n = () => {};
    export const t = app => ({ ...app, normalized: true });
  `,
  "app-shared": "export const I3 = globalThis.__homeOnboardingTest.jsx;",
  "use-app-connect-flow": `
    export const n = () => ({
      handleAppConnected: id => globalThis.__homeOnboardingTest.connect.push(["connected", id]),
      handleAppConnectOAuthStarted: event => globalThis.__homeOnboardingTest.connect.push(["pasted-oauth", event])
    });
    export const t = () => {};
  `,
});
let pastedConnected = false;
const pastedTree = pastedConnect.LibraryPastedLinkConnectModal({
  app: { id: "drive", name: "Drive" },
  area: "library",
  onConnected() {
    pastedConnected = true;
  },
  onOpenChange() {},
  reauthLinkId: "link-1",
});
check(
  pastedTree.type === "ConnectModal" &&
    pastedTree.props.app.normalized === true &&
    pastedTree.props.connectorAuth.authReason === "reauth_required",
  "normalizes apps and configures reauthentication",
);
pastedTree.props.onConnected();
check(
  pastedConnected &&
    globalThis.__homeOnboardingTest.connect.at(-1)[1] === "drive",
  "records successful pasted-link connections",
);
pastedTree.props.onOAuthStarted({ connectorId: "drive" });
check(
  globalThis.__homeOnboardingTest.connect.at(-1)[1]
    .pastedLinkProductExperience === "library",
  "forwards pasted-link product context into OAuth",
);

globalThis.__homeOnboardingTest.connectorQuery = {
  data: [
    {
      id: "gmail",
      name: "Gmail",
      description: "Mail",
      iconUrl: "light.png",
      iconUrlDark: "dark.png",
      pluginDisplayNames: ["Gmail"],
    },
  ],
  isFetching: false,
  isPending: false,
  refetch() {
    globalThis.__homeOnboardingTest.connect.push(["refetch"]);
  },
};
const connectById = await loadModule("app-connect-modal-by-id", {
  "app-connect-modal": `
    export const n = () => {};
    export const t = "ConnectModal";
  `,
  "app-initial":
    "export const V$ = () => globalThis.__homeOnboardingTest.connectorQuery;",
  "app-shared": "export const I3 = globalThis.__homeOnboardingTest.jsx;",
});
const byIdTree = connectById.n({
  connectorId: "gmail",
  hostId: "local",
  onOpenChange() {},
});
check(byIdTree.type === "ConnectModal", "opens the resolved connector modal");
check(
  byIdTree.props.app.logoUrl === "light.png" &&
    byIdTree.props.app.isAccessible === false,
  "normalizes connector query results",
);
globalThis.__homeOnboardingTest.connectorQuery.data = [];
globalThis.__homeOnboardingTest.connectorQuery.isPending = true;
const loadingTree = connectById.n({
  connectorId: "missing",
  onOpenChange() {},
});
const loadingDialog = loadingTree.type(loadingTree.props);
check(
  loadingDialog.props["aria-busy"] === true &&
    loadingDialog.props.role === "dialog",
  "renders an accessible loading dialog",
);
globalThis.__homeOnboardingTest.connectorQuery.isPending = false;
const errorTree = connectById.n({
  connectorId: "missing",
  onOpenChange() {},
});
const errorDialog = errorTree.type(errorTree.props);
const errorActions =
  errorDialog.props.children.props.children[2].props.children;
errorActions[1].props.onClick();
check(
  globalThis.__homeOnboardingTest.connect.at(-1)[0] === "refetch",
  "retries failed connector queries",
);

const appInfo = await loadModule("app-info", {});
const normalizedInfo = appInfo.t({
  id: "calendar",
  name: "Calendar",
  iconUrl: "calendar.png",
});
check(
  normalizedInfo.logoUrl === "calendar.png" &&
    normalizedInfo.isEnabled === true,
  "normalizes app icons and enabled state",
);
check(
  Array.isArray(normalizedInfo.pluginDisplayNames) &&
    normalizedInfo.pluginDisplayNames.length === 0,
  "defaults missing plugin display names",
);

const homeFill = await loadModule("home-fill-icon", {
  "app-shared": "export const I3 = globalThis.__homeOnboardingTest.jsx;",
});
const homeIcon = homeFill.default({ className: "icon-sm" });
check(
  homeIcon.type === "svg" &&
    homeIcon.props.viewBox === "0 0 20 20" &&
    homeIcon.props.className === "icon-sm",
  "renders the Home icon SVG contract",
);
check(
  homeIcon.props.children.props.d.startsWith("M9.2393 2.48"),
  "preserves the official Home icon path",
);

globalThis.__homeOnboardingTest.worktree = {
  query: { data: { worktrees: [] } },
  sets: [],
  workspace: {
    cwd: "/repo",
    hostId: "local",
    isCodexWorktree: false,
    kind: "git",
  },
};
const worktreeState = await loadModule("worktree-onboarding-state", {
  "app-initial": `
    export const mdt = Symbol("workspace");
    export const kht = Symbol("scope");
    export const t3 = Symbol("prompt");
    export const Q4 = Symbol("mode-family");
    export const Vfn = hostId => ({ hostId });
    export const kst = value => value;
    export const ofn = () => true;
    export const dun = (key, initial) => ({ key, initial });
  `,
  "app-shared": `
    export const ZI = Symbol("scope");
    export const e6 = globalThis.__homeOnboardingTest.react;
    export const LX = () => ({
      get: signal => signal.initial,
      set: (signal, value) => globalThis.__homeOnboardingTest.worktree.sets.push([signal, value])
    });
    export const HX = signal => signal.description === "workspace"
      ? globalThis.__homeOnboardingTest.worktree.workspace
      : signal.description === "prompt-suggests-worktrees" ? true : signal.initial;
    export const BX = () => "local";
    export const sZ = () => Symbol("prompt-suggests-worktrees");
  `,
  "use-codex-worktrees": `
    export const n = () => globalThis.__homeOnboardingTest.worktree.query;
    export const t = () => {};
  `,
});
worktreeState.t();
check(
  worktreeState.n({ enabled: true, entryPoint: "codex" }).isEligible === true,
  "enables the worktree suggestion for an eligible Git workspace",
);
globalThis.__homeOnboardingTest.worktree.query = {
  data: { worktrees: [{ id: "existing" }] },
};
check(
  worktreeState.n({ enabled: true, entryPoint: "codex" }).isEligible === false,
  "hides the suggestion when worktrees already exist",
);
check(
  globalThis.__homeOnboardingTest.worktree.sets.at(-1)[1] === "succeeded",
  "marks onboarding succeeded after detecting a worktree",
);

globalThis.__homeOnboardingTest.worktreeActions = [];
const worktreeBanner = await loadModule(
  "worktree-onboarding-banner-controller",
  {
    "app-initial": `
      export const kht = Symbol("scope");
      export const mdt = Symbol("workspace");
      export const QTt = "https://example.com/worktrees";
      export const kst = value => value;
      export const xpn = () => globalThis.__homeOnboardingTest.worktreeActions.push("analytics");
      export const j3 = () => globalThis.__homeOnboardingTest.worktreeActions.push("select");
      export const xvt = () => globalThis.__homeOnboardingTest.worktreeActions.push("close");
      export const Oft = value => globalThis.__homeOnboardingTest.worktreeActions.push(value.href);
    `,
    "app-primary": `
      export const Sm = "Banner";
      export const Cm = () => {};
    `,
    "app-shared": `
      export const I3 = globalThis.__homeOnboardingTest.jsx;
      export const MA = "analytics-event";
      export const LX = () => ({ set: (_signal, value) => globalThis.__homeOnboardingTest.worktreeActions.push(value) });
      export const HX = () => ({ cwd: "/repo", hostId: "local" });
      export const n4 = () => ({ formatMessage: value => value.defaultMessage });
    `,
    "worktree-onboarding-state": `
      export const r = Symbol("state");
      export const t = () => {};
    `,
  },
);
const controllerNode = worktreeBanner.WorktreeOnboardingBannerController();
const bannerNode = controllerNode.type(controllerNode.props);
check(bannerNode.type === "Banner", "renders the worktree onboarding banner");
bannerNode.props.dismissAction.onClick();
check(
  globalThis.__homeOnboardingTest.worktreeActions.at(-1) === "dismissed",
  "persists worktree banner dismissal",
);
bannerNode.props.secondaryAction.onClick("event");
check(
  globalThis.__homeOnboardingTest.worktreeActions.at(-1) ===
    "https://example.com/worktrees",
  "opens worktree documentation",
);
bannerNode.props.primaryAction.onClick();
check(
  globalThis.__homeOnboardingTest.worktreeActions.slice(-3).join(",") ===
    "analytics,select,close",
  "selects the worktree mode and closes the picker",
);

globalThis.__homeOnboardingTest.profileImport = {
  analytics: [],
  open: false,
  shown: [],
};
const dialogCore = await loadModule("dialog-launcher-core", {
  "app-initial": `
    export const Hzt = () => globalThis.__homeOnboardingTest.profileImport.open;
    export const Uzt = (_scope, component, props) => globalThis.__homeOnboardingTest.profileImport.shown.push({ component, props });
  `,
  "app-shared": `
    export const e6 = { lazy: () => "LazyProfileImportDialog" };
  `,
  "browser-profile-import-analytics": `
    export const a = (_scope, entryPoint, flowId) => globalThis.__homeOnboardingTest.profileImport.analytics.push({ entryPoint, flowId });
    export const t = () => {};
  `,
  "browser-profile-import-availability": `
    export const n = Symbol("availability");
    export const t = () => {};
  `,
  "browser-profile-import-dialog":
    "export const BrowserProfileImportDialogModal = 'ProfileImportDialog';",
});
const availableScope = { get: () => true };
check(
  dialogCore.n(availableScope, null, "settings") === false,
  "rejects profile import without a service",
);
check(
  dialogCore.n({ get: () => false }, {}, "settings") === false,
  "honors profile import availability",
);
check(
  dialogCore.n(availableScope, { id: "service" }, "settings", "flow-1") ===
    true,
  "opens an available profile import flow",
);
check(
  globalThis.__homeOnboardingTest.profileImport.analytics[0].flowId ===
    "flow-1" &&
    globalThis.__homeOnboardingTest.profileImport.shown[0].props.entryPoint ===
      "settings",
  "records and forwards the import flow identity",
);
globalThis.__homeOnboardingTest.profileImport.open = true;
dialogCore.n(availableScope, { id: "service" }, "settings", "flow-2");
check(
  globalThis.__homeOnboardingTest.profileImport.shown.length === 1,
  "does not reopen an active import dialog",
);

globalThis.__homeOnboardingTest.clinical = {
  focused: false,
  prompt: "",
  data: {
    accountId: "account-1",
    userId: "user-1",
    prompts: [
      {
        id: "decision",
        kind: "clinical_decision_support",
        prompt: "Review this differential",
      },
      {
        id: "guidelines",
        kind: "latest_guidelines",
        prompt: "Find the latest guideline",
      },
    ],
  },
};
const starterPrompts = await loadModule("home-starter-prompts", {
  "app-initial": `
    export const kht = Symbol("scope");
    export const v2 = Symbol("conversation");
    export const A2 = Symbol("inert");
    export const Xet = Symbol("capability");
    export const Qet = Symbol("identity");
    export const HZ = () => ({
      hasText: () => false,
      setPromptText: text => { globalThis.__homeOnboardingTest.clinical.prompt = text; },
      focus: () => { globalThis.__homeOnboardingTest.clinical.focused = true; }
    });
    export const i_n = () => ({ search: "" });
    export const yln = () => false;
    export const UZ = () => true;
    export const oNt = () => false;
  `,
  "app-shared": `
    export const ZI = Symbol("scope");
    export const e6 = { useId: () => "starter-heading" };
    export const I3 = globalThis.__homeOnboardingTest.jsx;
    export const LX = () => ({ get: signal => signal.description === "identity"
      ? { accountId: "account-1", userId: "user-1" }
      : { isCapable: true } });
    export const HX = signal => signal.description === "inert" ? false : "conversation-1";
    export const BX = signal => signal.description === "capability"
      ? { isCapable: true }
      : globalThis.__homeOnboardingTest.clinical.data;
    export const eZ = () => Symbol("query");
    export const rZ = () => Symbol("family");
  `,
  departments: `
    export const n = () => {};
    export const t = {};
  `,
  shuffle: "export const t = items => items;",
});
const starterTree = starterPrompts.ClinicalStarterPrompts();
check(starterTree.type === "div", "renders eligible clinical starter prompts");
const cardsNode = starterTree.props.children;
const cardsTree = cardsNode.type(cardsNode.props);
check(
  cardsTree.props.children[1].props.children.length === 2,
  "renders each clinical prompt card",
);
const firstStarter = cardsTree.props.children[1].props.children[0];
check(
  firstStarter.props["aria-label"] === "Review this differential",
  "labels clinical prompt cards",
);
firstStarter.props.onClick();
check(
  globalThis.__homeOnboardingTest.clinical.prompt ===
    "Review this differential" &&
    globalThis.__homeOnboardingTest.clinical.focused,
  "writes the selected prompt and focuses the editor",
);

globalThis.__homeOnboardingTest.homeAnnouncements = {
  modal: [],
  prefill: null,
  state: [],
};
const homeAnnouncementState = await loadModule("home-announcement-state", {
  "app-initial": `
    export const ont = Symbol("host-features");
    export const f0t = Symbol("usage");
    export const ugn = "local-host";
    export const vP = "RateLimitResetModal";
    export const Kot = "MultiAgentIcon";
    export const n6 = "ResetIcon";
    export const dun = (key, _fallback) => Symbol(key);
    export const kI = () => ({ id: "host" });
    export const jyt = () => ({ hostId: "local-host" });
    export const nN = () => true;
    export const ngn = (_key, fallback) => fallback;
    export const Gfn = () => [null, value => { globalThis.__homeOnboardingTest.homeAnnouncements.prefill = value; }];
    export const cnt = () => ({ mutateAsync: () => Promise.resolve() });
    export const N6t = () => ({ accountId: "account-1", isLoading: false });
    export const uht = () => ({ data: { id: "account-1" }, isLoading: false });
    export const i5 = () => ({ remainingPercent: 5 });
    export const $M = () => ({ config: { remainingThresholdPercent: 10 } });
    export const lfn = () => ({});
    export const Uzt = (_scope, component, props) => globalThis.__homeOnboardingTest.homeAnnouncements.modal.push({ component, props });
    export const xpn = () => {};
  `,
  "app-shared": `
    export const ZI = Symbol("scope");
    export const AM = "exposed";
    export const OM = "try-now";
    export const kM = "dismissed";
    export const ig = "DismissIcon";
    export const Y2 = "FormattedMessage";
    export const e6 = {
      useState: value => [value, () => {}],
      useRef: value => ({ current: value }),
      useEffect: effect => effect()
    };
    export const I3 = globalThis.__homeOnboardingTest.jsx;
    export const LX = () => ({ set: (signal, value) => globalThis.__homeOnboardingTest.homeAnnouncements.state.push({ signal, value }) });
    export const HX = signal => {
      if (signal.description === "usage") return {
        data: { rate_limit_reset_credits: { available_count: 2 } },
        isLoading: false
      };
      return signal.description === "rate-limit-reset-home-announcement-dismissal-by-account-id" ? {} : false;
    };
    export const BX = () => ({ data: [], isLoading: false });
    export const n4 = () => ({ formatMessage: descriptor => descriptor.defaultMessage });
  `,
  "app-primary": "export const Sm = 'Banner';",
});
const multiAgentEligibility = homeAnnouncementState.u();
check(
  multiAgentEligibility.isEligible && !multiAgentEligibility.isLoading,
  "offers the multi-agent announcement before feature activation",
);
const multiAgentBanner = homeAnnouncementState.s({});
check(
  multiAgentBanner.type === "Banner" &&
    multiAgentBanner.props.primaryAction.label.props.defaultMessage ===
      "Try now",
  "renders the multi-agent banner actions",
);
multiAgentBanner.props.primaryAction.onClick();
await Promise.resolve();
await Promise.resolve();
check(
  globalThis.__homeOnboardingTest.homeAnnouncements.prefill.text ===
    "Spawn a subagent to explore this repo.",
  "prefills the composer after enabling multi-agent mode",
);
multiAgentBanner.props.dismissAction.onClick();
check(
  globalThis.__homeOnboardingTest.homeAnnouncements.state.some(
    (entry) => entry.value === true,
  ),
  "persists multi-agent banner dismissal",
);
const resetEligibility = homeAnnouncementState.n();
check(
  resetEligibility.isEligible && resetEligibility.availableCount === 2,
  "offers reset credits near the rate limit threshold",
);
const resetBannerWrapper = homeAnnouncementState.r({
  availableCount: resetEligibility.availableCount,
  onDismiss: resetEligibility.dismiss,
});
const resetBanner = resetBannerWrapper.type(resetBannerWrapper.props);
resetBanner.props.primaryAction.onClick();
check(
  globalThis.__homeOnboardingTest.homeAnnouncements.modal[0].component ===
    "RateLimitResetModal",
  "opens the rate limit reset modal",
);
resetBanner.props.dismissAction.onClick();
const resetDismissal =
  globalThis.__homeOnboardingTest.homeAnnouncements.state.at(-1);
check(
  typeof resetDismissal.value === "function",
  "persists reset-banner dismissal per account",
);

assert.equal(assertions, 63);
console.log(`${assertions} home onboarding entrypoint assertions passed`);
