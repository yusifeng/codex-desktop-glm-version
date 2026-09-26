import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadModule(mocks) {
  const result = await esbuild.build({
    entryPoints: [
      path.join(ROOT, "src/renderer/codex-micro-onboarding-host/index.ts"),
    ],
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
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
  );
}

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

globalThis.__microHostTest = {
  animationStarts: [],
  dismissed: 0,
  eligible: true,
  inputSettings: 0,
  navigation: [],
  stateWrites: [],
  telemetry: [],
  jsx: {
    Fragment: "fragment",
    jsx(type, props, key) {
      return { type, props, key };
    },
    jsxs(type, props, key) {
      return { type, props, key };
    },
  },
  react: {
    useEffect(effect) {
      effect();
    },
    useRef(value) {
      return { current: value };
    },
    useState(value) {
      return [typeof value === "function" ? value() : value, () => {}];
    },
  },
};

const microHost = await loadModule({
  "app-shared": `
    export const ZI = Symbol("scope");
    export const $O = { FIVE_SECONDS: 5000 };
    export const I3 = globalThis.__microHostTest.jsx;
    export const e6 = globalThis.__microHostTest.react;
    export const Y2 = "FormattedMessage";
    export const Yh = "Button";
    export const LX = () => ({
      set: (signal, value) => globalThis.__microHostTest.stateWrites.push({ signal, value })
    });
    export const HX = signal => {
      if (signal.description === "app-info") return { data: { appIconMedium: "icon.png", appName: "Codex" } };
      if (signal.description === "device-status") return { status: "connected" };
      if (signal.description === "model") return "codex-micro";
      if (signal.description === "detected") return true;
      if (signal.description === "onboarding") return "pending";
      if (signal.description === "announcement-enabled") return true;
      if (signal.description === "joystick") return { x: 0, y: 0 };
      return null;
    };
    export const _L = () => ({ data: "granted", isPending: false });
  `,
  "app-initial": `
    export const c$t = Symbol("app-info");
    export const $C = Symbol("device-status");
    export const ew = Symbol("model");
    export const fw = Symbol("detected");
    export const nw = Symbol("announcement-enabled");
    export const tw = Symbol("joystick");
    export const l2 = "OnboardingPanel";
    export const pnt = {
      codexMicro: {
        getInputMonitoringPermissionStatus: async () => "granted",
        openInputMonitoringSettings: () => { globalThis.__microHostTest.inputSettings += 1; },
        ownsPrimaryWindow: async () => true
      }
    };
    export const E6t = () => ({ platform: "macOS" });
    export const Slt = () => false;
    export const o_n = () => target => globalThis.__microHostTest.navigation.push(target);
    export const Oft = () => {};
  `,
  "app-primary": `
    export const xc = Symbol("onboarding");
    export const Tc = () => globalThis.__microHostTest.eligible;
  `,
  "codex-micro-onboarding-animation": `
    export const t = Symbol("animation-frame");
    export const r = () => ({
      agentSlots: [{ id: 0, status: "working" }],
      actionKeycapIds: ["FAST"]
    });
    export const a = (_scope, reducedMotion) => {
      globalThis.__microHostTest.animationStarts.push(reducedMotion);
      return () => {};
    };
    export const c = (_scope, payload) => globalThis.__microHostTest.telemetry.push(payload);
    export const i = () => {};
    export const o = () => {};
  `,
  "codex-micro-keyboard-surface": `
    export const d = Symbol("permission-query");
    export const f = 5000;
    export const i = "Keyboard";
    export const l = "ActionKey";
    export const o = "AgentKey";
    export const p = () => {};
    export const t = "Joystick";
  `,
  "codex-micro-layout": `
    export const o = () => {};
    export const r = id => ({ id });
  `,
});

const host = microHost.CodexMicroOnboardingHost({
  dismissAnnouncement: () => {
    globalThis.__microHostTest.dismissed += 1;
  },
});
check(host != null, "renders onboarding for an eligible detected device");
check(
  globalThis.__microHostTest.animationStarts.length === 1 &&
    globalThis.__microHostTest.animationStarts[0] === false,
  "starts the onboarding animation with motion enabled",
);
check(
  host.props.appName === "Codex" &&
    host.props.inputMonitoringPermissionStatus === "granted" &&
    host.props.model === "codex-micro",
  "passes app, permission and hardware model context into the flow",
);

host.props.onOpenInputMonitoringSettings();
check(
  globalThis.__microHostTest.inputSettings === 1,
  "opens macOS Input Monitoring settings",
);
host.props.onComplete();
check(
  globalThis.__microHostTest.dismissed === 1 &&
    globalThis.__microHostTest.stateWrites.some(
      ({ signal, value }) =>
        signal.description === "onboarding" && value === "complete",
    ) &&
    globalThis.__microHostTest.stateWrites.some(
      ({ signal, value }) =>
        signal.description === "detected" && value === true,
    ),
  "persists completion and dismisses the announcement",
);
host.props.onCompleteAndOpenSettings();
check(
  globalThis.__microHostTest.navigation.at(-1) === "/settings/codex-micro",
  "opens Codex Micro settings after completing the tour",
);

const lifecycle = host.type(host.props);
const tour = lifecycle.type(lifecycle.props);
check(
  tour.type === "OnboardingPanel" &&
    tour.props.title === "Welcome to Codex Micro" &&
    tour.props.primaryActionLabel === "Take 2-step tour",
  "starts the three-step tour on the welcome screen",
);
tour.props.onPrimaryAction();
await new Promise((resolve) => setImmediate(resolve));
check(
  globalThis.__microHostTest.telemetry.some(
    ({ step, screen }) => step === "screen-continued" && screen === "welcome",
  ) &&
    globalThis.__microHostTest.telemetry.some(
      ({ step, screen }) => step === "screen-shown" && screen === "agent-keys",
    ),
  "records welcome continuation and the next screen impression",
);

globalThis.__microHostTest.eligible = false;
check(
  microHost.CodexMicroOnboardingHost({ dismissAnnouncement() {} }) == null,
  "suppresses onboarding when the device is no longer eligible",
);

assert.equal(assertions, 9);
console.log(`${assertions} Codex Micro onboarding host assertions passed`);
