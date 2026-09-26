import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__homeAnnouncementStateTest = {
  analytics: [],
  featureQuery: {
    data: [{ enabled: false, name: "multi_agent" }],
    isLoading: false,
  },
  modalOpens: [],
  mutations: [],
  persisted: new Map(),
  prefill: null,
  usageQuery: {
    data: { rate_limit_reset_credits: { available_count: 2 } },
    isLoading: false,
  },
  jsx: {
    jsx: (type, props, key) => ({ type, props, key }),
  },
  react: {
    useEffect(effect) {
      effect();
    },
    useRef(value) {
      return { current: value };
    },
    useState(value) {
      return [value, () => {}];
    },
  },
});

const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/home-announcement-state/index.ts"),
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
            contents:
              {
                "app-shared": `
                  export const AM = "banner-exposed";
                  export const OM = "banner-action";
                  export const kM = "banner-dismissed";
                  export const ig = "DismissIcon";
                  export const Y2 = "FormattedMessage";
                  export const ZI = "application-scope";
                  export const e6 = globalThis.__homeAnnouncementStateTest.react;
                  export const I3 = globalThis.__homeAnnouncementStateTest.jsx;
                  export const n4 = () => ({ formatMessage: descriptor => descriptor.defaultMessage });
                  export const LX = () => ({
                    set(signal, value) {
                      const current = globalThis.__homeAnnouncementStateTest.persisted.get(signal);
                      globalThis.__homeAnnouncementStateTest.persisted.set(
                        signal,
                        typeof value === "function" ? value(current ?? {}) : value,
                      );
                    },
                  });
                  export const HX = signal =>
                    signal === "usage-signal"
                      ? globalThis.__homeAnnouncementStateTest.usageQuery
                      : globalThis.__homeAnnouncementStateTest.persisted.get(signal);
                  export const BX = () => globalThis.__homeAnnouncementStateTest.featureQuery;
                `,
                "app-initial": `
                  export const ont = "feature-family";
                  export const ugn = "local-host";
                  export const f0t = "usage-signal";
                  export const vP = "rate-limit-modal";
                  export const dun = (key, initialValue) => {
                    const signal = Symbol.for(key);
                    if (!globalThis.__homeAnnouncementStateTest.persisted.has(signal)) {
                      globalThis.__homeAnnouncementStateTest.persisted.set(signal, initialValue);
                    }
                    return signal;
                  };
                  export const ngn = (_key, fallback) => fallback;
                  export const kI = () => "current-host";
                  export const jyt = () => ({ hostId: "host-1" });
                  export const nN = () => true;
                  export const Gfn = () => [null, value => { globalThis.__homeAnnouncementStateTest.prefill = value; }];
                  export const cnt = () => ({
                    mutateAsync: async value => { globalThis.__homeAnnouncementStateTest.mutations.push(value); },
                  });
                  export const xpn = (_scope, event, payload) => {
                    globalThis.__homeAnnouncementStateTest.analytics.push({ event, payload });
                  };
                  export const N6t = () => ({ accountId: "account-1", isLoading: false });
                  export const uht = () => ({ data: { id: "account-1" }, isLoading: false });
                  export const i5 = () => ({ remainingPercent: 5 });
                  export const $M = () => ({ config: { remainingThresholdPercent: 10 } });
                  export const lfn = () => ({});
                  export const Uzt = (_scope, modal, input) => {
                    globalThis.__homeAnnouncementStateTest.modalOpens.push({ modal, input });
                  };
                  export const Kot = "MultiAgentIcon";
                  export const n6 = "ResetIcon";
                `,
                "app-primary": `export const Sm = "Banner";`,
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

const initialMultiAgent = announcements.u();
check(
  initialMultiAgent.isEligible && !initialMultiAgent.isLoading,
  "offers multi-agent onboarding when the feature is available but disabled",
);

let banner = announcements.s({});
check(
  banner.type === "Banner" &&
    state.analytics.some(({ event }) => event === "banner-exposed"),
  "renders and records the multi-agent banner exposure",
);
banner.props.dismissAction.onClick();
check(
  !announcements.u().isEligible &&
    state.analytics.some(({ event }) => event === "banner-dismissed"),
  "persists dismissal and removes multi-agent eligibility",
);

state.persisted.set(
  Symbol.for("has-seen-multi-agent-composer-banner"),
  false,
);
let tried = false;
banner = announcements.s({ onTryNow: () => (tried = true) });
banner.props.primaryAction.onClick();
await new Promise((resolve) => setImmediate(resolve));
check(
  state.mutations[0].featureName === "multi_agent" &&
    state.mutations[0].enabled === true,
  "enables the multi-agent feature through the host mutation",
);
check(
  tried && state.analytics.some(({ event }) => event === "banner-action"),
  "completes the Try now action and records analytics",
);

const rateLimit = announcements.n();
check(
  rateLimit.isEligible && rateLimit.availableCount === 2,
  "offers a reset announcement near the account rate limit",
);
rateLimit.dismiss();
check(
  !announcements.n().isEligible,
  "stores account-scoped reset dismissal with its TTL timestamp",
);

const rateLimitHost = announcements.r({ availableCount: 2, onDismiss() {} });
const rateLimitBanner = rateLimitHost.type(rateLimitHost.props);
rateLimitBanner.props.primaryAction.onClick();
check(
  state.modalOpens[0].modal === "rate-limit-modal" &&
    state.modalOpens[0].input.initialAvailableCount === 2,
  "opens the reset modal with the available credit count",
);

assert.equal(assertions, 8);
console.log(`${assertions} home announcement state assertions passed`);
