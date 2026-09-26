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
    jsx(type, props) {
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

assert.equal(assertions, 12);
console.log(`${assertions} home onboarding entrypoint assertions passed`);
