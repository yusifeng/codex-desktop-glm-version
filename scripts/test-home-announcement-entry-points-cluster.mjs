import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = [
  "option-carousel",
  "use-home-directory",
  "task-announcement-candidates",
  "announcement-entry-points",
  "home-task-suggestions-core",
  "home-ambient-suggestions-content",
  "work-onboarding-suggestions",
];
const state = (globalThis.__homeAnnouncementEntryPointTest = {
  accountId: "account-1",
  analytics: [],
  discovery: {
    detectedItems: [{ providerId: "cursor" }],
    hasDetectionRefreshError: false,
    hasImportableItems: true,
    isDetectionError: false,
    isDetectionFetching: false,
  },
  homeDirectory: "/Users/tester",
  imported: [],
  interactions: [],
  launched: [],
  started: [],
  signals: new Map(),
  taskQuery: { data: [] },
});
state.composer = {
  text: "",
  cancelPendingSubmit() { state.cancelledSubmit = true; },
  focus() { state.focused = true; },
  hasText() { return this.text.length > 0; },
  requestSubmitWhenReady(ready) { state.submitReady = ready(); },
  setPromptText(text) { this.text = text; },
};
state.jsx = {
  Fragment: Symbol("Fragment"),
  jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
  jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
};

const mocks = {
  "app-shared": `
    export const I3 = () => globalThis.__homeAnnouncementEntryPointTest.jsx;
    export const ZI = Symbol('app-scope');
    export const Y2 = undefined;
    const react = {
      useEffect: (effect) => { const cleanup = effect(); void cleanup; },
      useEffectEvent: (callback) => callback,
      useId: () => 'test-id',
      useRef: (value) => ({ current: value }),
      useState: (initial) => { let value = typeof initial === 'function' ? initial() : initial; return [value, (next) => { value = typeof next === 'function' ? next(value) : next; }]; },
    };
    export const e6 = () => react;
    export const n4 = () => ({ formatMessage: (descriptor) => descriptor.defaultMessage });
    export const LX = () => ({
      queryClient: {
        cancelQueries: async () => {},
        invalidateQueries: async () => {},
        setQueriesData: () => {},
      },
      get: (signal) => read(signal),
      set: (signal, value) => {
        const current = globalThis.__homeAnnouncementEntryPointTest.signals.get(signal.key);
        globalThis.__homeAnnouncementEntryPointTest.signals.set(signal.key, typeof value === 'function' ? value(current) : value);
      },
    });
    const read = signal => signal?.kind === 'derived' ? signal.derive({get:read}) : globalThis.__homeAnnouncementEntryPointTest.signals.get(signal?.key);
    export const HX = read;
    export const sZ = (_scope, derive) => ({ kind: 'derived', derive });
    export const pZ = (_scope, value) => { const signal={key:'signal-'+globalThis.__homeAnnouncementEntryPointTest.signals.size};globalThis.__homeAnnouncementEntryPointTest.signals.set(signal.key,value);return signal; };
    export const QX = (_scope, factory) => ({ kind: 'task-query', factory });
    export const BX = (query, variables) => {
      const test = globalThis.__homeAnnouncementEntryPointTest;
      if (query?.kind === 'home-directory') return { data: variables == null ? undefined : { homeDirectory: test.homeDirectory } };
      if (query?.kind === 'histories') return { data: [{ completedAtMs: Date.now() - 70 * 86400000, successes: [1] }], isLoading: false };
      if (query?.kind === 'status') return { data: {}, isLoading: false };
      if (query?.kind === 'task-query') return test.taskQuery;
      return { data: undefined, isLoading: false };
    };
  `,
  "app-initial": `
    export const gcn = { kind: 'home-directory' };
    export const Sln = { key: 'auth-state' };
    export const kht = Symbol('composer-scope');
    export const ZA = { kind: 'histories' };
    export const _A = { kind: 'status' };
    export const ugn = 'local';
    export const vj = { key: 'announcements-disabled' };
    export const dun = (key, value) => {
      const test = globalThis.__homeAnnouncementEntryPointTest;
      if (!test.signals.has(key)) test.signals.set(key, value);
      return { key };
    };
    export const N6t = () => ({ accountId: globalThis.__homeAnnouncementEntryPointTest.accountId, userId: 'user-1', isLoading: false });
    export const mht = () => ({ data: { desktop_onboarding_completed_at: new Date(Date.now() - 86400000).toISOString() }, isLoading: false });
    const experiment = (id) => ({
      __evaluation: { is_experiment_active: id === '1602805785', is_user_in_experiment: id === '1602805785' },
      get: (key, fallback) => key === 'enabled' ? true : fallback,
    });
    export const cfn = () => ({ getExperiment: experiment, isLoading: false });
    export const nfn = (_client, id) => experiment(id);
    export const i_n = () => ({ key: 'home-route', pathname: '/' });
    export const sbt = () => false;
    export const ofn = () => true;
    export const zA = () => ['cursor', 'claude-code', 'claude-cowork'];
    export const sj = () => false;
    export const IA = () => ({});
    export const CA = () => globalThis.__homeAnnouncementEntryPointTest.discovery;
    export const ngn = (_key, fallback) => fallback;
    export const e4t = Symbol('plugin-query');
    export const h4t = plugin => plugin;
    export const Gwt = async input => { globalThis.__homeAnnouncementEntryPointTest.launched.push({ reload: input.hostId }); };
    export const zdn = async () => ({ data: [{ name: 'codex-replay', tools: { open_controller: { name: 'open_controller' } } }] });
    export const _Et = () => true;
    export const VDt = async () => ({ cwd: '/tmp/replay', projectlessOutputDirectory: 'output', workspaceRoots: ['/tmp/replay'] });
    export const Zgt = async () => 'default';
    export const gpt = async () => ({ conversationId: 'conversation-replay', firstTurn: { status: 'accepted', turnId: 'turn-1' }, status: 'accepted' });
    export const rqt = () => 'onboarding-conversation';
    export const ROt = async (_scope, input) => { globalThis.__homeAnnouncementEntryPointTest.started.push(input); return { serverConversationId: 'server-onboarding' }; };
    export const gln = conversation => '/c/' + conversation.id;
    export const o_n = () => destination => globalThis.__homeAnnouncementEntryPointTest.launched.push({ destination });
    export const rJt = { safeGet: async () => ({}), safePost: async (_path, options) => ({ status: 'ready', options }) };
    export const mpt = () => null;
    export const HZ = () => globalThis.__homeAnnouncementEntryPointTest.composer;
    export const pnt = { ambientSuggestions: {
      getChatGptComposerItems: async () => [],
      recordChatGptComposerItemInteraction: async input => globalThis.__homeAnnouncementEntryPointTest.interactions.push(input),
    }};
    export const xpn = (_scope, event, payload) => globalThis.__homeAnnouncementEntryPointTest.analytics.push({ event, payload });
  `,
  "app-primary": "export const Sm = null; export const Sg=()=>({headline:{message_body:'Suggested for you'}}); export const eu=async()=>({conversationId:'background-1'});",
  "composer-announcement-slot": "export const t = null;",
  "computer-history-plugin-icon": "export const t = 'computer-history.png';",
  "run-external-agent-import-command": `
    export const runExternalAgentImportCommand = async (scope, source) => {
      globalThis.__homeAnnouncementEntryPointTest.imported.push({ scope, source });
    };
  `,
  "computer-history-query": "export const i = { key: 'computer-history-query' };",
  "computer-history-suggestions": "export const i = { key: 'computer-history-enabled' };",
  "entry-point-availability": `
    export const n = ({ enabled }) => enabled;
    export const a = (_input, entryPoint) => globalThis.__homeAnnouncementEntryPointTest.launched.push({ entryPoint });
  `,
  "home-suggestion-surface": "export const n=()=>{};export const t=props=>({type:'suggestion-surface',props});",
  "home-starter-prompts": "export const ClinicalStarterPrompts=props=>({type:'clinical-prompts',props});",
  "new-chat-suggestion-source-debug-state": "export const c=()=>{};export const t=()=>{};",
};

function mock(name) {
  return mocks[name] ?? "export {};";
}

async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [
      {
        name: "home-announcement-entry-point-mocks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
            path: importPath.slice(8),
            namespace: "mock",
          }));
          build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({
            contents: mock(importPath),
            loader: "js",
          }));
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`
  );
}

function nodes(root) {
  const output = [];
  const visit = (value) => {
    if (value == null || typeof value !== "object") return;
    if (Array.isArray(value)) return value.forEach(visit);
    if ("type" in value && "props" in value) output.push(value);
    visit(value.props?.children);
  };
  visit(root);
  return output;
}

// option-carousel
const carousel = await bundle("option-carousel");
carousel.n();
const carouselTree = carousel.t({
  ariaLabel: "Featured options",
  backLabel: "Previous",
  children: ["one", "two"],
  forwardLabel: "Next",
  header: "Choose one",
  layout: "gallery",
});
assert.equal(carouselTree.type, "section");
assert.equal(carouselTree.props.role, "group");
assert.equal(carouselTree.props["aria-label"], "Featured options");
assert.match(carouselTree.props.className, /gallery/);
const carouselButtons = nodes(carouselTree).filter((node) => node.type === "button");
assert.equal(carouselButtons.length, 2);
assert.equal(carouselButtons[0].props.title, "Previous");
assert.equal(carouselButtons[1].props.title, "Next");
let scrollRequest = null;
const viewport = nodes(carouselTree).find((node) => node.props.className === "option-carousel__viewport");
viewport.props.ref({ clientWidth: 200, scrollLeft: 100, scrollWidth: 600, scrollTo: (request) => { scrollRequest = request; } });
carouselButtons[1].props.onClick();
assert.deepEqual(scrollRequest, { behavior: "smooth", left: 260 });

// use-home-directory
const homeDirectory = await bundle("use-home-directory");
homeDirectory.t();
assert.equal(homeDirectory.n("local"), "/Users/tester");
assert.equal(homeDirectory.r("local").data.homeDirectory, "/Users/tester");
assert.equal(homeDirectory.r(null).data, undefined);

// task-announcement-candidates
const taskCandidates = await bundle("task-announcement-candidates");
assert.equal(taskCandidates.TaskAnnouncementCandidates({ replacementModel: "gpt-next", suppressed: true }), null);
assert.equal(taskCandidates.TaskAnnouncementCandidates({ currentModel: "gpt-next", replacementModel: "gpt-next" }), null);
let switchedModel = null;
let dismissedModelNotice = false;
const taskTree = taskCandidates.TaskAnnouncementCandidates({
  conversationId: "conversation-1",
  currentModel: "gpt-old",
  replacementModel: "gpt-next",
  onDismiss: () => { dismissedModelNotice = true; },
  onSwitchModel: (model) => { switchedModel = model; },
});
assert.equal(taskTree.type, "aside");
assert.match(nodes(taskTree).find((node) => node.type === "strong").props.children, /gpt-old/);
const taskButtons = nodes(taskTree).filter((node) => node.type === "button");
taskButtons[0].props.onClick();
taskButtons[1].props.onClick();
assert.equal(switchedModel, "gpt-next");
assert.equal(dismissedModelNotice, true);

// announcement-entry-points
const announcements = await bundle("announcement-entry-points");
announcements._();
announcements.a();
announcements.c();
announcements.d();
announcements.l();
announcements.m();
announcements.n();
announcements.r();
announcements.y();
assert.equal(announcements.g.kind, "derived");
assert.equal(announcements.h.key, "computer-history-weekly-insights-announcement-dismissed-v1");
const replayState = announcements.f({ enabled: true });
assert.equal(replayState.isEligible, true);
replayState.dismiss();
assert.equal(state.signals.get("codex-replay-home-announcement-shown-account-ids")["account-1"], true);
assert.equal(announcements.f({ enabled: false }).isEligible, false);
const importState = announcements.o();
assert.equal(importState.providerId, "cursor");
assert.equal(importState.isLoading, false);
assert.equal(importState.isEligible, true);
importState.markShown();
assert.equal(typeof state.signals.get("external-agent-import-home-beacon-last-shown-at"), "number");
importState.openImport();
assert.equal(announcements.i().isEligible, true);
let replayed = false;
let shown = false;
const replayTree = announcements.p({ onDismiss() {}, onReplay() { replayed = true; }, onShown() { shown = true; } });
assert.equal(shown, true);
nodes(replayTree).find((node) => node.type === "button" && node.props.children === "Replay a task").props.onClick();
assert.equal(replayed, true);
let imported = false;
const importTree = announcements.s({ onDismiss() {}, onImport() { imported = true; }, providerId: "claude-code" });
assert.match(nodes(importTree).find((node) => node.type === "strong").props.children, /Claude Code/);
nodes(importTree).find((node) => node.type === "button" && /Import from/.test(node.props.children)).props.onClick();
assert.equal(imported, true);
let gifted = false;
const giftTree = announcements.t({ onDismiss() {}, onOpenGiftCredits() { gifted = true; } });
nodes(giftTree).find((node) => node.type === "button" && node.props.children === "Gift credits").props.onClick();
assert.equal(gifted, true);
let recapPrompt = null;
const historyTree = announcements.v({ onDismiss() {}, onViewRecap(prompt) { recapPrompt = prompt; } });
nodes(historyTree).find((node) => node.type === "button" && node.props.children === "View recap").props.onClick();
assert.match(recapPrompt, /Computer History/);
let replayConversation = null;
let replayCompleted = false;
let installCompletion;
const replayScope = {
  queryClient: { fetchQuery: async options => ({ id: 'codex-replay', options }) },
  query: { getOptions: (_query, input) => ({ queryKey: ['plugin', input.pluginName] }) },
  get: () => ({ logProductEvent() {} }),
};
await announcements.u({
  scope: replayScope,
  navigateToLocalConversation(id) { replayConversation = id; },
  onReplay() { replayCompleted = true; },
  showPluginInstallDetails(_plugin, options) { installCompletion = options.onSuccess(); return true; },
});
await installCompletion;
assert.equal(replayConversation, "conversation-replay");
assert.equal(replayCompleted, true);
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(state.imported.length, 1);

// home-task-suggestions-core: real derived account signal, rendered surface and native interactions
state.signals.set("auth-state", { accountId: "account-1" });
state.taskQuery = {
  data: [{
    id: "suggestion-1",
    title: "Draft a launch plan",
    prompt: "Draft a launch plan",
    isScheduledAutomation: false,
    item: {
      id: "raw-1",
      item_type: "task_suggestion",
      title: "Draft a launch plan",
      destination_metadata: { type: "prompt", prompt: "Draft a launch plan", auto_send: true, show_prompt_on_hover: true },
      logging_metadata: { suggestion_id: "suggestion-1" },
    },
  }],
};
const taskSuggestions = await bundle("home-task-suggestions-core");
assert.equal(taskSuggestions.i.kind, "derived");
const homeTaskTree = taskSuggestions.t({ hostId: "local", mode: "chat", workRunLocation: "cloud" });
const homeTaskSurface = homeTaskTree.type(homeTaskTree.props);
assert.equal(homeTaskSurface.type, "suggestion-surface");
assert.equal(homeTaskSurface.props.headline, "Suggested for you");
assert.equal(homeTaskSurface.props.items.length, 1);
assert.equal(homeTaskSurface.props.items[0].tooltipContent, "Draft a launch plan");
await homeTaskSurface.props.items[0].onClick();
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(state.composer.text, "Draft a launch plan");
assert.equal(state.focused, true);
assert.equal(state.submitReady, true);
assert.equal(state.interactions.some((entry) => entry.interactionType === "viewed"), true);
assert.equal(state.interactions.some((entry) => entry.interactionType === "clicked"), true);
homeTaskSurface.props.items[0].onDismiss();
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(state.interactions.some((entry) => entry.interactionType === "dismissed"), true);

// home-ambient-suggestions-content: rendered production surface and composer action
state.composer.text = "";
const ambient = await bundle("home-ambient-suggestions-content");
const ambientTree = ambient.HomeAmbientSuggestionsContent({
  generatedSuggestionsEnabled: true,
  hostId: "local",
  onLocalConversationCreated() {},
  projectRoot: "/workspace",
  runtimeState: {
    source: "generated",
    headline: "Try one of these",
    generatedSuggestions: [{ id: "ambient-1", title: "Summarize notes", prompt: "Summarize my notes", source: "generated", homeAction: { type: "fill-composer" } }],
  },
});
const ambientSurfaceNode = nodes(ambientTree).find((node) => node.type === mocks["home-suggestion-surface"]?.t || node.type === "suggestion-surface") ?? nodes(ambientTree).find((node) => typeof node.type === "function");
const ambientSurface = typeof ambientSurfaceNode.type === "function" ? ambientSurfaceNode.type(ambientSurfaceNode.props) : ambientSurfaceNode;
assert.equal(ambientSurface.type, "suggestion-surface");
assert.equal(ambientSurface.props.headline, "Try one of these");
assert.equal(ambientSurface.props.items[0].label, "Summarize notes");
await ambientSurface.props.items[0].onClick();
assert.equal(state.composer.text, "Summarize my notes");
assert.equal(state.analytics.some((entry) => entry.event === "ambient_suggestion_selected"), true);

// work-onboarding-suggestions: real carousel, task creation and conversation link
state.taskQuery = { data: { status: "ready", cards: [] }, isPending: false };
state.started = [];
const workOnboarding = await bundle("work-onboarding-suggestions");
const eligible = { hasIdentity: true, announcementEligible: true, announcementCompleted: false, composerEmpty: true, featureEnabled: true, isWorkPlan: true, hasExistingConversations: false };
const workTree = workOnboarding.WorkOnboardingSuggestions({
  eligibility: eligible,
  serverCards: [{ category: "website", short_prompt: "Build a launch site", long_prompt: "Build a launch website" }],
});
assert.equal(workTree.type, "section");
assert.equal(workTree.props["data-work-onboarding-carousel"], true);
assert.equal(nodes(workTree).find((node) => node.type === "h2").props.children, "See what Work can do");
const tryButton = nodes(workTree).find((node) => node.type === "button" && node.props.children === "Try");
await tryButton.props.onClick();
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(state.started.length, 1);
assert.equal(state.started[0].conversationOrigin, "tpp");
assert.equal(state.started[0].prompt, "Build a launch website");
assert.equal(state.launched.some((entry) => entry.destination === "/c/server-onboarding"), true);

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\.(?:equal|deepEqual|match|ok)\s*\(/g)].length;
console.log(`${assertionCount} home announcement entry-point cluster assertions passed`);
