import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__homeAnnouncementsTest = {
  beacon: null,
  candidateInputs: [],
  signals: new Map(),
  sourceContext: "default",
  override: {
    homeAnnouncementCandidates: [
      { isEligible: true, isLoading: false, content: "override-content" },
    ],
    fastModeCandidate: {
      content: "Save time with Fast mode",
      fastModeModel: { id: "fast-model" },
      isEligible: true,
      isLoading: false,
      setHasSeenFastModeHomeBanner(value) {
        globalThis.__homeAnnouncementsTest.seen = value;
      },
      setServiceTier(tier, source) {
        globalThis.__homeAnnouncementsTest.serviceTier = [tier, source];
        return Promise.resolve();
      },
    },
  },
  jsx: {
    Fragment: "fragment",
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
  react: {
    useContext: () => globalThis.__homeAnnouncementsTest.sourceContext,
    useState: (value) => [value, () => {}],
  },
};

const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/codex-home-announcements-current/index.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "mock-chunks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice("@rchunk/".length),
          namespace: "mock",
        }));
        build.onLoad(
          { filter: /.*/, namespace: "mock" },
          ({ path: importPath }) => ({
            contents:
              {
                "app-shared": `
                  export const I3 = () => globalThis.__homeAnnouncementsTest.jsx;
                  export const e6 = () => globalThis.__homeAnnouncementsTest.react;
                  export const n4 = () => ({ formatMessage: descriptor => "localized:" + descriptor.defaultMessage });
                  export const m4 = (...values) => values.filter(Boolean).join(" ");
                  export const Y2 = "FormattedMessage"; export const ig = "DismissIcon";
                  export const HX = signal => globalThis.__homeAnnouncementsTest.signals.get(signal);
                  export const LX = () => ({ set: (signal, value) => globalThis.__homeAnnouncementsTest.signals.set(signal, value) }); export const kz = model => model;
                  export const ZI = "scope";
                  export const $3 = () => {}; export const K2 = () => {}; export const h4 = () => {};
                `,
                "app-initial": `
                  export const D0t = () => globalThis.__homeAnnouncementsTest.override;
                  export const i_n = () => ({ pathname: "/" });
                  export const sbt = () => false;
                  export const xpn = () => {};
                  export const CNt = () => ({ isEligible: true, isLoading: false, content: "usage" });
                  export const Fk = () => globalThis.__homeAnnouncementsTest.voiceStart;
                  export const qk = () => globalThis.__homeAnnouncementsTest.voiceAvailable;
                  export const qNt = "announcements-disabled";
                  export const Xyt = "hide-first-new-thread-promos";
                  export const QZ = "announcement-source-context";
                  export const dun = () => "fast-mode-seen";
                  export const s8 = () => ({ isServiceTierAllowed: true });
                  export const w8 = () => ({ data: { models: [{ id: "production-fast" }] } });
                  export const f8 = () => ({ modelSettings: { model: "auto" } });
                  export const w0t = models => models[0];
                  export const J2 = () => ({ serviceTierSettings: { selectedServiceTier: null, isLoading: false }, setServiceTier: (tier, source) => { globalThis.__homeAnnouncementsTest.productionTier = [tier, source]; return Promise.resolve(); } });
                  export const vN = "FastIcon";
                `,
                "app-primary": `
                  export const dr = "AnnouncementEntries";
                  export const $p = input => input.isLoading ? "loading" : input.isEligible ? "eligible" : "ineligible";
                  export const Ch = () => globalThis.__homeAnnouncementsTest.beacon;
                  export const Zp = enabled => enabled ? ({ estimateStatus: "ready", estimate: { savedHours: 2, savedMinutes: 15, threadCount: 8 } }) : ({ estimateStatus: "failed", estimate: null });
                `,
                "home-announcement-state": `
                  const initialize = () => {};
                  initialize.presentation = { Banner: "AnnouncementShell" };
                  export { initialize as t };
                  export const u = () => ({ isEligible: false, isLoading: false, content: null });
                `,
                "announcement-entry-points": `
                  const state = globalThis.__homeAnnouncementsTest;
                  export const y = () => {};
                  export const g = "history-status"; export const h = "history-dismissed";
                  export const i = input => (state.candidateInputs.push(["gift", input]), state.gift ?? { dismiss() {}, isEligible: false, isLoading: false, openGiftCredits() {} });
                  export const o = input => (state.candidateInputs.push(["import", input]), state.externalImport ?? { dismiss() {}, isEligible: false, isLoading: false, markShown() {}, openImport() {} });
                  export const f = input => (state.candidateInputs.push(["replay", input]), state.replay ?? { dismiss() {}, isEligible: false, isLoading: false, markShown() {}, replay() {} });
                  export const t = "GiftAnnouncement"; export const s = "ImportAnnouncement"; export const p = "ReplayAnnouncement"; export const v = "HistoryAnnouncement";
                  export const u = async () => {};
                `,
                "home-announcement-slot": `export const n = () => {};`,
                "codex-app-home-beacon-announcement-core": `export const r = () => {}; export const t = "Beacon";`,
                "worktree-onboarding-state": `export const n = input => (globalThis.__homeAnnouncementsTest.candidateInputs.push(["worktree", input]), globalThis.__homeAnnouncementsTest.worktree ?? { isEligible: false, isLoading: false });`,
                banner: `export const t = "CustomGptBanner";`,
                "realtime-voice-home-announcement": `export const RealtimeVoiceHomeAnnouncementContent = "VoiceAnnouncement";`,
                "worktree-onboarding-banner-controller": `export const WorktreeOnboardingBannerController = "WorktreeAnnouncement";`,
              }[importPath] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const announcements = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
const home = announcements.n({
  entryPoint: "codex",
  homeComposerMode: "chat",
  selectedCustomGptId: "gizmo-1",
});
check(
  home.type === "div" && home.props.className.includes("empty:hidden"),
  "renders the Home announcement container",
);
check(
  home.props.children[0].type === "CustomGptBanner",
  "renders the selected custom GPT banner",
);
const homeCandidates = home.props.children[1];
check(
  typeof homeCandidates.type === "function",
  "composes Home announcement candidates",
);
const overridden = homeCandidates.type(homeCandidates.props);
check(
  overridden.type.name === "AnnouncementEntries",
  "routes candidates through the shared selector",
);
const selected = overridden.type(overridden.props);
check(
  selected.type === "AnnouncementEntries",
  "renders the announcement entry host",
);
check(
  selected.props.entries[0].content === "override-content",
  "honors candidate overrides",
);

const codex = announcements.t({});
check(
  typeof codex.type === "function",
  "builds the Codex Home announcement host",
);
const codexEntriesNode = codex.type(codex.props);
check(
  codexEntriesNode.type.name === "AnnouncementEntries",
  "selects from Codex announcement entries",
);
const codexEntries = codexEntriesNode.type(codexEntriesNode.props);
check(
  codexEntries.props.entries.length === 4,
  "preserves the four Codex candidate groups",
);
const fastEntry = codexEntries.props.entries[3];
check(
  fastEntry.isEligible && typeof fastEntry.content.type === "function",
  "includes an eligible Fast mode banner",
);
const fastBanner = fastEntry.content.type(fastEntry.content.props);
check(
  fastBanner.type === "AnnouncementShell" &&
    fastBanner.props.primaryAction.label.props.defaultMessage === "Enable now",
  "renders the Fast mode action in the shared shell",
);
fastBanner.props.primaryAction.onClick();
await new Promise((resolve) => setImmediate(resolve));
check(
  globalThis.__homeAnnouncementsTest.serviceTier.join(":") ===
    "fast-model:home_banner" &&
    globalThis.__homeAnnouncementsTest.seen === true,
  "enables the selected Fast mode tier and persists banner completion",
);

globalThis.__homeAnnouncementsTest.override = {};
globalThis.__homeAnnouncementsTest.signals.set("fast-mode-seen", false);
const productionCodex = announcements.t({}).type(announcements.t({}).props);
const productionEntries = productionCodex.type(productionCodex.props).props.entries;
check(productionEntries[3].isEligible && productionEntries[3].content.props.content.props.values.savedHours === 2, "derives the production Fast candidate from model, tier, seen-state, and estimate ABIs");
globalThis.__homeAnnouncementsTest.sourceContext = "focused-modal";
const focusedModalHome = announcements.n({ entryPoint: "codex", homeComposerMode: "chat" });
check(focusedModalHome.props.children[1] == null, "does not compete with a focused announcement source");

globalThis.__homeAnnouncementsTest.sourceContext = "default";
globalThis.__homeAnnouncementsTest.signals.set("announcements-disabled", true);
let gatedHome = announcements.n({ entryPoint: "codex", homeComposerMode: "chat" });
check(gatedHome.props.children[1].type(gatedHome.props.children[1].props) == null, "honors the global announcements-disabled signal");

globalThis.__homeAnnouncementsTest.signals.set("announcements-disabled", false);
globalThis.__homeAnnouncementsTest.gift = { dismiss() {}, isEligible: true, isLoading: false, openGiftCredits() {} };
globalThis.__homeAnnouncementsTest.candidateInputs.length = 0;
gatedHome = announcements.n({ entryPoint: "codex", homeComposerMode: "chat" });
const gatedCandidates = gatedHome.props.children[1].type(gatedHome.props.children[1].props);
check(gatedCandidates.props.entries.length === 7, "adds the product Beacon ahead of the six published vanilla groups without a synthetic recap entry");
check(globalThis.__homeAnnouncementsTest.candidateInputs.find(([name]) => name === "worktree")[1].enabled === false, "defers worktree onboarding while a higher-priority gift candidate is active");

globalThis.__homeAnnouncementsTest.beacon = { accountId: "account-1", beacon: { custom_fields: {} }, isEligible: true, isLoading: false, shouldSuppressVanillaPromos: true };
const suppressedCodex = announcements.t({}).type(announcements.t({}).props);
const suppressedEntries = suppressedCodex.type(suppressedCodex.props).props.entries;
check(suppressedEntries[1].isEligible && !suppressedEntries[2].isEligible && !suppressedEntries[3].isEligible, "lets a suppressing Beacon hide vanilla multi-agent and Fast promos");

assert.equal(assertions, 18);
console.log(`${assertions} current Codex Home announcement assertions passed`);
