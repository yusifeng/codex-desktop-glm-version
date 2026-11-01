import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__homeAnnouncementsTest = {
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
                  export const LX = () => ({}); export const kz = model => model;
                  export const $3 = () => {}; export const K2 = () => {}; export const h4 = () => {};
                `,
                "app-initial": `
                  export const D0t = () => globalThis.__homeAnnouncementsTest.override;
                  export const i_n = () => ({ pathname: "/" });
                  export const sbt = () => false;
                  export const xpn = () => {};
                  export const CNt = () => ({ isEligible: true, isLoading: false, content: "usage" });
                  export const vN = "FastIcon";
                `,
                "app-primary": `
                  export const dr = "AnnouncementEntries";
                  export const $p = input => input.isLoading ? "loading" : input.isEligible ? "eligible" : "ineligible";
                `,
                "home-announcement-state": `
                  const initialize = () => {};
                  initialize.presentation = { Banner: "AnnouncementShell" };
                  export { initialize as t };
                  export const u = () => ({ isEligible: false, isLoading: false, content: null });
                `,
                "announcement-entry-points": `export const t = () => {};`,
                "home-announcement-slot": `export const n = () => {};`,
                "codex-app-home-beacon-announcement-core": `export const r = () => {}; export const t = "Beacon";`,
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

assert.equal(assertions, 12);
console.log(`${assertions} current Codex Home announcement assertions passed`);
