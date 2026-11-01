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
    export const Sqt = () => {};
    export const U6t = Symbol("active-account");
    export const Vzt = () => {};
    export const zzt = (_scope, modal) => globalThis.__homeOnboardingTest.dismissedModals.push(modal);
  `,
  "app-shared": `
    export const $3 = () => {};
    export const FX = () => {};
    export const H3 = () => {};
    export const QI = () => {};
    export const ZI = Symbol("scope");
    export const LX = () => ({ id: "scope" });
    export const HX = () => globalThis.__homeOnboardingTest.activeAccountId;
    export const e6 = () => globalThis.__homeOnboardingTest.react;
    export const I3 = () => globalThis.__homeOnboardingTest.jsx;
    export const Jm = () => "LazyPepperModal";
    export const V3 = async (loader) => loader();
    export const qm = () => {};
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
  capable: true,
  hints: [{ system_hint: "cme" }],
  mobile: false,
  modes: [],
  selected: [],
};
const cmeEntry = await loadModule("home-entry-point", {
  "app-initial": `
    export const kht = Symbol("scope");
    export const v2 = Symbol("mode");
    export const Xet = Symbol("capability");
    export const NIt = Symbol("selected-modes");
    export const YBt = Symbol("hints");
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
    export const HX = signal => signal.read ? signal.read() : true;
    export const sZ = (_scope, derive) => ({
      read: () => derive({
        get(signal) {
          if (signal.description === "capability") return { isCapable: globalThis.__homeOnboardingTest.cme.capable };
          if (signal.description === "selected-modes") return globalThis.__homeOnboardingTest.cme.modes;
          if (signal.description === "hints") return { data: globalThis.__homeOnboardingTest.cme.hints };
          return "default";
        },
      }),
    });
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
globalThis.__homeOnboardingTest.cme.hints = [];
check(
  cmeEntry.CmeHomeEntryPoint() === null,
  "hides CME when the account no longer advertises the CME system hint",
);
globalThis.__homeOnboardingTest.cme.hints = [{ system_hint: "cme" }];
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
    "export const B$=()=>{}; export const V$ = () => globalThis.__homeOnboardingTest.connectorQuery;",
  "app-shared": `
    const noop=()=>{}; const cache=[];
    export const $3=()=>({c:size=>{while(cache.length<size)cache.push(Symbol.for("react.memo_cache_sentinel"));return cache}});
    export const $h=noop,K2=noop,Ph=noop,Zh=noop,zh=noop;
    export const I3=()=>globalThis.__homeOnboardingTest.jsx;
    export const Ah="DialogHeader",Ih="Dialog",Lh="DialogDescription",Oh="DialogBody",Qh="Spinner",Rh="DialogTitle",Y2="Message",Yh="Button",kh="DialogFooter";
  `,
});
connectById.r();
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
  loadingDialog.type === "Dialog" &&
    loadingDialog.props.children.props.children.type === "DialogHeader",
  "renders the standard loading dialog",
);
globalThis.__homeOnboardingTest.connectorQuery.isPending = false;
const errorTree = connectById.n({
  connectorId: "missing",
  onOpenChange() {},
});
const errorDialog = errorTree.type(errorTree.props);
const errorActions =
  errorDialog.props.children.props.children.props.children[1].props.children;
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
  prompt: "Use a separate worktree for this task",
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
      : signal.read ? signal.read() : signal.initial;
    export const BX = () => "local";
    export const sZ = (_scope, derive) => ({
      description: "prompt-suggests-worktrees",
      read: () => derive({ get: () => globalThis.__homeOnboardingTest.worktree.prompt }),
    });
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
globalThis.__homeOnboardingTest.worktree.query = { data: { worktrees: [] } };
globalThis.__homeOnboardingTest.worktree.prompt = "Fix the typo";
check(
  worktreeState.n({ enabled: true, entryPoint: "codex" }).isEligible === false,
  "requires a prompt that suggests isolated or parallel work",
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
      export const Dft = () => {}; export const Evt = () => {}; export const Rht = () => {};
      export const eEt = () => {}; export const jst = () => {}; export const pdt = () => {};
      export const x3 = () => {}; export const ypn = () => {};
    `,
    "home-announcement-state": `
      const initialize = () => {};
      initialize.presentation = { Banner: "Banner", initializeBanner() {} };
      export { initialize as t };
    `,
    "app-shared": `
      export const I3 = globalThis.__homeOnboardingTest.jsx;
      export const MA = "analytics-event";
      export const fI = () => {}; export const FX = () => {}; export const ig = "dismiss-icon";
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
    export const rJt = { safePost: async () => ({ examples: [] }) };
  `,
  "app-shared": `
    export const $O = { ONE_MINUTE: 60_000 };
    export const ZI = Symbol("scope");
    export const e6 = { useId: () => "starter-heading" };
    export const I3 = globalThis.__homeOnboardingTest.jsx;
    export const FX = () => {};
    export const QI = () => {};
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
    export const fit = "Badge";
    export const n7 = "AnnouncementSurface";
    export const r7 = () => {};
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
    export const Yh = "Button";
    export const Zh = () => {};
    export const m4 = (...values) => values.filter(Boolean).join(" ");
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
});
const multiAgentEligibility = homeAnnouncementState.u();
check(
  multiAgentEligibility.isEligible && !multiAgentEligibility.isLoading,
  "offers the multi-agent announcement before feature activation",
);
const multiAgentBanner = homeAnnouncementState.s({});
check(
  typeof multiAgentBanner.type === "function" &&
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

globalThis.__homeOnboardingTest.microAnimation = {
  analytics: [],
  elapsed: null,
  state: [],
};
const microAnimation = await loadModule("codex-micro-onboarding-animation", {
  "app-shared": `
    export const ZI = Symbol("scope");
    export const FX = () => {};
    export const QI = () => {};
    export const pZ = () => ({
      read: () => globalThis.__homeOnboardingTest.microAnimation.elapsed,
    });
    export const sZ = (_scope, derive) => ({
      read: () => derive({ get: signal => signal.read() }),
    });
  `,
  "app-initial": `
    export const cs = "device-lifecycle";
    export const ds = "onboarding-lifecycle";
    export const ls = {
      CODEX_MICRO_DEVICE_LIFECYCLE_STEP_TYPE_FIRST_DETECTED: "first-detected",
      CODEX_MICRO_DEVICE_LIFECYCLE_STEP_TYPE_CONNECTED: "connected",
      CODEX_MICRO_DEVICE_LIFECYCLE_STEP_TYPE_CONNECTION_FAILED: "connection-failed",
      CODEX_MICRO_DEVICE_LIFECYCLE_STEP_TYPE_CONNECTION_LOST: "connection-lost",
      CODEX_MICRO_DEVICE_LIFECYCLE_STEP_TYPE_RECONNECTED: "reconnected"
    };
    export const ss = {
      CODEX_MICRO_CONNECTION_TRANSPORT_BLUETOOTH: "bluetooth",
      CODEX_MICRO_CONNECTION_TRANSPORT_USB: "usb",
      CODEX_MICRO_CONNECTION_TRANSPORT_UNSPECIFIED: "unspecified"
    };
    export const fs = {
      CODEX_MICRO_ONBOARDING_LIFECYCLE_STEP_TYPE_FLOW_COMPLETED: "flow-completed",
      CODEX_MICRO_ONBOARDING_LIFECYCLE_STEP_TYPE_SCREEN_SHOWN: "screen-shown"
    };
    export const ps = {
      CODEX_MICRO_ONBOARDING_SCREEN_WELCOME: "welcome",
      CODEX_MICRO_ONBOARDING_SCREEN_AGENT_KEYS: "agent-keys",
      CODEX_MICRO_ONBOARDING_SCREEN_COMMAND_KEYS: "command-keys"
    };
    export const us = {
      CODEX_MICRO_INPUT_MONITORING_PERMISSION_STATE_GRANTED: "granted",
      CODEX_MICRO_INPUT_MONITORING_PERMISSION_STATE_DENIED: "denied",
      CODEX_MICRO_INPUT_MONITORING_PERMISSION_STATE_UNAVAILABLE: "unavailable",
      CODEX_MICRO_INPUT_MONITORING_PERMISSION_STATE_NOT_APPLICABLE: "not-applicable"
    };
    export const xpn = (_scope, event, payload) => globalThis.__homeOnboardingTest.microAnimation.analytics.push({ event, payload });
  `,
});
const stillFrame = microAnimation.r(-1);
check(
  stillFrame.agentSlots.map((slot) => slot.status).join(",") ===
    "working,unread,awaiting-approval,idle,working,awaiting-response",
  "freezes Codex Micro agents at their initial reduced-motion frame",
);
check(
  stillFrame.actionKeycapIds.join(",") === "FAST,APPR,REJ,SPLIT,MIC,CODEX",
  "freezes Codex Micro keycaps at their initial reduced-motion frame",
);
const progressedFrame = microAnimation.r(4_000);
check(
  progressedFrame.agentSlots[0].status === "awaiting-approval" &&
    progressedFrame.agentSlots.length === 6,
  "advances each Codex Micro agent through its staggered cycle",
);
globalThis.__homeOnboardingTest.microAnimation.elapsed = 4_000;
check(
  microAnimation.t.read().agentSlots[0].status === "awaiting-approval" &&
    microAnimation.n.read().length === 6,
  "derives the animation frame and agent slots from elapsed signal state",
);
microAnimation.s(
  "scope",
  { status: "connected" },
  "connected",
  "bluetooth",
  false,
);
check(
  globalThis.__homeOnboardingTest.microAnimation.analytics.length === 2,
  "records first detection and connection as separate lifecycle steps",
);
check(
  globalThis.__homeOnboardingTest.microAnimation.analytics[0].payload
    .connectionTransport === "bluetooth" &&
    globalThis.__homeOnboardingTest.microAnimation.analytics[1].payload
      .stepType === "connected",
  "maps Codex Micro device lifecycle telemetry enums",
);
microAnimation.c("scope", {
  flowId: "flow-1",
  inputMonitoringPermissionState: "granted",
  screen: "welcome",
  step: "screen-shown",
});
const onboardingEvent =
  globalThis.__homeOnboardingTest.microAnimation.analytics.at(-1);
check(
  onboardingEvent.payload.flowId === "flow-1" &&
    onboardingEvent.payload.inputMonitoringPermissionState === "granted" &&
    onboardingEvent.payload.screen === "welcome" &&
    onboardingEvent.payload.stepType === "screen-shown",
  "maps Codex Micro onboarding lifecycle telemetry",
);
const stopMicroAnimation = microAnimation.a(
  {
    set(signal, value) {
      globalThis.__homeOnboardingTest.microAnimation.state.push({
        signal,
        value,
      });
    },
  },
  true,
);
check(
  globalThis.__homeOnboardingTest.microAnimation.state[0].value === -1,
  "uses the static animation sentinel for reduced motion",
);
stopMicroAnimation();
check(
  globalThis.__homeOnboardingTest.microAnimation.state.at(-1).value === null,
  "clears Codex Micro animation state on teardown",
);

globalThis.__homeOnboardingTest.chatgptOnboarding = {
  continued: 0,
  legalEvents: [],
  shown: 0,
};
const chatgptOnboarding = await loadModule("chatgpt-onboarding-dialog", {
  "app-shared": `
    export const ZI = Symbol("scope");
    export const I3 = globalThis.__homeOnboardingTest.jsx;
    export const Ih = "Dialog";
    export const Rh = "Heading";
    export const Lh = "Text";
    export const Yh = "Button";
    export const ty = "Logo";
    export const Y2 = "FormattedMessage";
    export const LX = () => ({ get: () => ({ logProductEvent: (_event, payload) => globalThis.__homeOnboardingTest.chatgptOnboarding.legalEvents.push(payload) }) });
  `,
  "app-initial": `
    export const HNt = { FullscreenOnboarding: "fullscreen-onboarding" };
    export const Jot = "ExternalLink";
    export const Cpn = Symbol("analytics");
    export const Ds = "legal-link-clicked";
    export const Es = {
      CODEX_CHATGPT_ONBOARDING_LEGAL_LINK_TERMS: "terms",
      CODEX_CHATGPT_ONBOARDING_LEGAL_LINK_PRIVACY: "privacy",
      CODEX_CHATGPT_ONBOARDING_LEGAL_LINK_KOREA_ADDENDUM: "korea-addendum"
    };
  `,
  "app-primary": "export const kh = 'Claim';",
});
const onboardingDialog = chatgptOnboarding.ChatGptOnboardingDialog({
  country: "KR",
  onContinue: () => {
    globalThis.__homeOnboardingTest.chatgptOnboarding.continued += 1;
  },
  onShown: () => {
    globalThis.__homeOnboardingTest.chatgptOnboarding.shown += 1;
  },
});
check(
  onboardingDialog.type === "Claim" &&
    onboardingDialog.props.claim === "fullscreen-onboarding",
  "claims the fullscreen onboarding surface",
);
const onboardingDialogSurface = onboardingDialog.props.children;
check(
  onboardingDialogSurface.type === "Dialog" &&
    onboardingDialogSurface.props.open &&
    !onboardingDialogSurface.props.showDialogClose,
  "renders a non-dismissible viewport-sized onboarding dialog",
);
onboardingDialogSurface.props.contentProps.onOpenAutoFocus();
check(
  globalThis.__homeOnboardingTest.chatgptOnboarding.shown === 1,
  "reports when the onboarding dialog is shown",
);
let escapePrevented = false;
onboardingDialogSurface.props.contentProps.onEscapeKeyDown({
  preventDefault: () => {
    escapePrevented = true;
  },
});
check(escapePrevented, "prevents Escape from closing onboarding");
const onboardingForm = onboardingDialogSurface.props.children.props.children;
let submitPrevented = false;
onboardingForm.props.onSubmit({
  preventDefault: () => {
    submitPrevented = true;
  },
});
check(
  submitPrevented &&
    globalThis.__homeOnboardingTest.chatgptOnboarding.continued === 1,
  "continues onboarding through form submission",
);
const onboardingActions = onboardingForm.props.children[1];
const koreanLegalMessage = onboardingActions.props.children[2].props.children;
check(
  koreanLegalMessage.props.id === "thread.agreeToTermsNoAuthKorea-may-06" &&
    typeof koreanLegalMessage.props.values.koreaAddendumLink === "function",
  "shows the Korea-specific legal addendum",
);
const termsLink = koreanLegalMessage.props.values.termsLink("Terms");
termsLink.props.onClick();
check(
  termsLink.props.href === "https://openai.com/terms" &&
    globalThis.__homeOnboardingTest.chatgptOnboarding.legalEvents[0].link ===
      "terms",
  "opens and records onboarding policy links",
);

globalThis.__homeOnboardingTest.homeBeacon = {
  cleanups: [],
  events: [],
  releases: [],
};
const homeBeacon = await loadModule("home-beacon", {
  "app-shared": `
    export const ZI = Symbol("scope");
    export const FX = () => {};
    export const QI = () => {};
    export const e6 = {
      useContext: () => null,
      useRef: value => ({ current: value }),
      useEffect: effect => {
        const cleanup = effect();
        if (cleanup) globalThis.__homeOnboardingTest.homeBeacon.cleanups.push(cleanup);
      }
    };
    export const LX = () => ({ id: "scope" });
    export const HX = signal => signal.description === "locale" ? { locale: "en-US" } : false;
    export const BX = () => ({
      status: "selected",
      beacon: { beacon_id: "beacon-1", kind: "banner" }
    });
    export const _Z = (_scope, _family, parameter) => {
      globalThis.__homeOnboardingTest.homeBeacon.releases.push(parameter);
    };
  `,
  "app-initial": `
    export const mpn = Symbol("locale");
    export const nPt = Symbol("debug");
    export const YNt = Symbol("claims");
    export const GNt = Symbol("focused-modal");
    export const ZNt = Symbol("page-context-suppression");
    export const WNt = { NonLegalBanners: "non-legal-banners" };
    export const ePt = "debug-beacon";
    export const i_n = () => ({ key: "navigation-1", pathname: "/" });
    export const N6t = () => ({
      accountId: "account-1",
      authMethod: "chatgpt",
      isLoading: false,
      userId: "user-1"
    });
    export const uht = () => ({ data: null });
    export const lfn = () => ({ getContext: () => ({ user: null }) });
    export const $Nt = () => false;
    export const KNt = () => new Set();
    export const CNt = () => false;
    export const SNt = beacon => beacon.kind === "banner";
    export const bNt = () => false;
    export const ONt = payload => globalThis.__homeOnboardingTest.homeBeacon.events.push(payload);
  `,
  "app-primary": `
    export const Fh = false;
    export const Ih = input => input.navigationKey + ":" + input.product;
    export const jh = Symbol("beacon-query");
    export const Th = Symbol("page-context");
    export const Nh = Symbol("cleanup");
    export const wh = Symbol("viewed");
    export const Eh = () => ({ isPending: false, isUnavailable: false });
  `,
});
let viewedBeaconKeys = new Set();
const beaconLifecycleScope = {
  get: () => viewedBeaconKeys,
  set: (_signal, update) => {
    viewedBeaconKeys = update(viewedBeaconKeys);
  },
};
const lifecycleBeacon = { beacon_id: "beacon-1" };
check(
  homeBeacon.n(beaconLifecycleScope, "account-1", lifecycleBeacon, null),
  "records the first session-level Beacon view",
);
check(
  !homeBeacon.n(beaconLifecycleScope, "account-1", lifecycleBeacon, null) &&
    globalThis.__homeOnboardingTest.homeBeacon.events.length === 1,
  "deduplicates repeated session-level Beacon views",
);
check(
  viewedBeaconKeys.has("account-1:session:beacon-1"),
  "uses the account, session and Beacon id as the exposure key",
);
check(
  !homeBeacon.n(beaconLifecycleScope, "account-1", lifecycleBeacon, {
    conversationId: "conversation-1",
    messageId: "message-1",
    suppressLifecycle: true,
  }),
  "honors message-level Beacon lifecycle suppression",
);
const selectedHomeBeacon = homeBeacon.r();
check(
  selectedHomeBeacon.accountId === "account-1" &&
    selectedHomeBeacon.beacon.beacon_id === "beacon-1" &&
    selectedHomeBeacon.isEligible &&
    !selectedHomeBeacon.isLoading,
  "selects an eligible ChatGPT Home Beacon",
);
check(
  selectedHomeBeacon.shouldSuppressVanillaPromos,
  "suppresses lower-priority promos while a Beacon selection is active",
);
globalThis.__homeOnboardingTest.homeBeacon.cleanups.at(-1)();
await new Promise((resolve) => queueMicrotask(resolve));
check(
  globalThis.__homeOnboardingTest.homeBeacon.releases[0].accountId ===
    "account-1",
  "releases the retained Beacon family member during hook cleanup",
);

globalThis.__homeOnboardingTest.financeBeacon = {
  analytics: [],
  conversations: [],
  started: [],
};
const financeBeacon = await loadModule("home-beacon-finance", {
  "app-shared": `
    export const pk = Symbol("toaster");
    export const FX = () => {};
    export const K2 = () => {};
    export const QI = () => {};
  `,
  "app-initial": `
    export const mpn = Symbol("intl");
    export const mun = Symbol("account-id");
    export const _fn = Symbol("finance-disabled");
    export const hfn = Symbol("finance-enabled");
    export const mfn = Symbol("requires-links");
    export const HW = Symbol("capabilities-query");
    export const WW = Symbol("connector-service");
    export const jzt = "finance-app";
    export const Mzt = "finance-system-hint";
    export const fW = "finance-analytics";
    export const n4t = async () => [{
      canonicalAppId: "finance-app-id",
      plugin: { enabled: true, availability: "AVAILABLE" }
    }];
    export const q6t = () => "connector_693864f100e4819093e6ed9b651239f1";
    export const NOt = input => input;
    export const yNt = () => true;
    export const xpn = (_scope, _event, payload) => globalThis.__homeOnboardingTest.financeBeacon.analytics.push(payload);
  `,
  "app-primary": "export {};",
  "app-connect-modal":
    "export const n = () => {}; export const t = 'AppConnectModal';",
  "plaid-link": "export const n = () => {}; export const r = async () => true;",
  "conversation-start": `
    export const t = () => {};
    export const n = async (_scope, input) => {
      globalThis.__homeOnboardingTest.financeBeacon.conversations.push(input);
      return { id: "conversation-1" };
    };
  `,
});
const financeIntl = {
  formatMessage: (descriptor) => descriptor.defaultMessage,
};
const financeConnector = {
  getConnectorLink: async () => ({ link: { auth_status: "ACTIVE" } }),
};
const financeScope = {
  query: {
    getOrFetch: async (query) =>
      query.description === "capabilities-query" ? { finances: true } : {},
  },
  get(signal) {
    if (signal.description === "intl") return financeIntl;
    if (signal.description === "account-id") return "account-1";
    if (signal.description === "finance-disabled") return false;
    if (signal.description === "finance-enabled") return true;
    if (signal.description === "requires-links") return false;
    if (signal.description === "connector-service") return financeConnector;
    if (signal.description === "toaster") return { danger: () => {} };
  },
};
const financeAbort = new AbortController();
const financeConnected =
  await financeBeacon.connectPersonalFinanceFromHomeBeacon(financeScope, {
    accountId: "account-1",
    beacon: { beacon_id: "finance-beacon" },
    onConversationStarted: (conversation) =>
      globalThis.__homeOnboardingTest.financeBeacon.started.push(conversation),
    signal: financeAbort.signal,
    suppressAnalytics: false,
  });
check(financeConnected, "completes the Finance Home Beacon connection flow");
check(
  globalThis.__homeOnboardingTest.financeBeacon.conversations[0].prompt ===
    "What can I do with my newly connected accounts once they finish syncing?" &&
    globalThis.__homeOnboardingTest.financeBeacon.conversations[0]
      .forceOnboarding,
  "starts the Finance onboarding conversation with metadata",
);
check(
  globalThis.__homeOnboardingTest.financeBeacon.started[0].id ===
    "conversation-1" &&
    globalThis.__homeOnboardingTest.financeBeacon.analytics[0].entrypoint ===
      "homepage_banner",
  "reports the connected conversation and successful Beacon analytics",
);
const cancelledFinanceAbort = new AbortController();
cancelledFinanceAbort.abort();
check(
  !(await financeBeacon.connectPersonalFinanceFromHomeBeacon(financeScope, {
    accountId: "account-1",
    beacon: { beacon_id: "finance-beacon" },
    onConversationStarted: () => {},
    signal: cancelledFinanceAbort.signal,
  })),
  "stops Finance onboarding after cancellation",
);

globalThis.__homeOnboardingTest.loginMethods = {
  requirements: {
    data: { requirements: { allowedLoginMethods: ["chatgpt"] } },
    isPending: false,
    isError: false,
  },
  config: {
    data: { configReadSucceeded: true, config: {} },
    isPending: false,
    isError: false,
  },
  apiKey: "",
};
const onboardingLogin = await loadModule("onboarding-login-content", {
  "app-shared": `
    export const ZI = Symbol("scope");
    export const FX = () => {};
    export const QI = () => {};
    export const K2 = () => {};
    export const Zh = () => {};
    export const g4 = () => {};
    export const rZ = (_scope, resolver) => ({ resolver });
    export const I3 = globalThis.__homeOnboardingTest.jsx;
    export const Y2 = "FormattedMessage";
    export const Yh = "Button";
    export const n4 = () => ({ formatMessage: descriptor => descriptor.defaultMessage });
  `,
  "app-initial": `
    export const Ysn = Symbol("requirements");
    export const lcn = Symbol("config");
    export const Jat = "Input";
    export const $sn = () => {};
    export const Xat = () => {};
  `,
});
const loginState = onboardingLogin.o.resolver("local-host", {
  get: (signal) =>
    signal.description === "requirements"
      ? globalThis.__homeOnboardingTest.loginMethods.requirements
      : globalThis.__homeOnboardingTest.loginMethods.config,
});
check(
  loginState.status === "ready" && !loginState.api && loginState.chatgpt,
  "honors managed allowed login methods",
);
globalThis.__homeOnboardingTest.loginMethods.requirements = {
  data: { requirements: 42 },
  isPending: false,
  isError: false,
};
const malformedLoginState = onboardingLogin.o.resolver("local-host", {
  get: (signal) =>
    signal.description === "requirements"
      ? globalThis.__homeOnboardingTest.loginMethods.requirements
      : globalThis.__homeOnboardingTest.loginMethods.config,
});
check(
  malformedLoginState.status === "error",
  "rejects malformed managed login requirements without throwing",
);
globalThis.__homeOnboardingTest.loginMethods.requirements = {
  data: { requirements: null },
  isPending: false,
  isError: false,
};
globalThis.__homeOnboardingTest.loginMethods.config.data.config.forced_login_method =
  "api";
const legacyLoginState = onboardingLogin.o.resolver("local-host", {
  get: (signal) =>
    signal.description === "requirements"
      ? globalThis.__homeOnboardingTest.loginMethods.requirements
      : globalThis.__homeOnboardingTest.loginMethods.config,
});
check(
  legacyLoginState.status === "ready" &&
    legacyLoginState.api &&
    !legacyLoginState.chatgpt,
  "falls back to the legacy forced login method",
);
const loginActionsBase = {
  allowApiKey: true,
  allowChatGpt: true,
  apiKeyValue: "",
  isApiKeyEntryVisible: false,
  isApiKeySignInPending: false,
  isChatGptSignInPending: false,
  onApiKeySecondaryAction: () => {},
  onApiKeySubmit: () => {},
  onApiKeyValueChange: (value) => {
    globalThis.__homeOnboardingTest.loginMethods.apiKey = value;
  },
  onChatGptSignIn: () => {},
  onShowApiKeyEntry: () => {},
  apiKeySecondaryActionLabel: "Back",
};
const loginChoices = onboardingLogin.t(loginActionsBase);
check(
  loginChoices.props.children.filter(Boolean).length === 2,
  "shows both ChatGPT and API-key login choices",
);
const pendingLoginChoices = onboardingLogin.t({
  ...loginActionsBase,
  isChatGptSignInPending: true,
});
check(
  pendingLoginChoices.props.children[0].props.children.props.defaultMessage ===
    "Cancel sign-in" && pendingLoginChoices.props.children[1] == null,
  "hides API-key entry while ChatGPT sign-in can be cancelled",
);
const apiKeyEntry = onboardingLogin.t({
  ...loginActionsBase,
  isApiKeyEntryVisible: true,
});
const apiKeyInput = apiKeyEntry.props.children[0].props.children[1];
apiKeyInput.props.onChange({ target: { value: "sk-test" } });
const apiKeyContinue = apiKeyEntry.props.children[1].props.children[1];
check(
  globalThis.__homeOnboardingTest.loginMethods.apiKey === "sk-test" &&
    apiKeyContinue.props.disabled,
  "forwards API-key edits and disables empty submission",
);

assert.equal(assertions, 98);
console.log(`${assertions} home onboarding entrypoint assertions passed`);
