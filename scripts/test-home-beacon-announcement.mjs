import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadModule(mocks) {
  const result = await esbuild.build({
    entryPoints: [
      path.join(
        ROOT,
        "src/renderer/codex-app-home-beacon-announcement-core/index.ts",
      ),
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

globalThis.__beaconAnnouncementTest = {
  financeCalls: [],
  lifecycle: [],
  support: { status: "supported" },
  supportInputs: [],
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
    useContext() {
      return { isAvailable: false, target: null };
    },
    useEffect(effect) {
      effect();
    },
    useId() {
      return "beacon-heading";
    },
    useRef(value) {
      return { current: value };
    },
    useState(value) {
      return [value, () => {}];
    },
  },
};

const beaconModule = await loadModule({
  "app-shared": `
    export const ZI = Symbol("scope");
    export const I3 = globalThis.__beaconAnnouncementTest.jsx;
    export const e6 = globalThis.__beaconAnnouncementTest.react;
    export const LX = () => ({ id: "scope" });
    export const n4 = () => ({ formatMessage: (descriptor, values) => descriptor.defaultMessage.replace("{appName}", values?.appName ?? "Codex") });
    export const fg = () => false;
    export const cw = "DismissIcon";
    export const Ih = "Dialog";
    export const Oh = "DialogBody";
    export const Rh = "Heading";
    export const Lh = "Text";
    export const Yh = "Button";
  `,
  "app-initial": `
    export const Mdn = "Codex";
    export const yNt = beacon => beacon.ui_info.type === "beacon_banner_info";
    export const CNt = beacon => beacon.ui_info.type === "homepage_takeover";
    export const wNt = beacon => beacon.ui_info.type === "beacon_modal_info";
    export const TNt = beacon => beacon.ui_info.type === "beacon_carousel_info";
    export const N6t = () => ({ accountId: "account-1", userId: "user-1" });
    export const Ae = () => target => { globalThis.__beaconAnnouncementTest.navigated = target; };
    export const ONt = payload => globalThis.__beaconAnnouncementTest.lifecycle.push(payload);
    export const Oft = payload => { globalThis.__beaconAnnouncementTest.external = payload.href; };
    export const jNt = () => {};
    export const gln = conversation => "/conversation/" + conversation.id;
  `,
  "app-primary": `
    export const $m = url => /^https:\/\//.test(url);
    export const Hp = "beacon-shell";
    export const yh = ({ actionId, beaconId }) => beaconId + ":" + actionId;
    export const xh = (...args) => globalThis.__beaconAnnouncementTest.lifecycle.push(args);
    export const vh = () => {};
    export const _h = () => {};
    export const Hm = "UnavailableAction";
  `,
  "home-announcement-state": `
    const initialize = () => {};
    initialize.presentation = { Banner: "Banner", initializeBanner() {} };
    export { initialize as t };
  `,
  "pca-connector-eligibility": `
    export const c = "BeaconActions";
    export const i = input => {
      globalThis.__beaconAnnouncementTest.supportInputs.push(input);
      return globalThis.__beaconAnnouncementTest.support;
    };
  `,
  "pca-connector-action": `
    export const n = () => {};
    export const t = () => ({ kind: "resume" });
  `,
  "home-beacon-finance": `
    export const connectPersonalFinanceFromHomeBeacon = async (_scope, input) => {
      globalThis.__beaconAnnouncementTest.financeCalls.push(input);
      input.onConversationStarted({ id: "finance-conversation" });
      return true;
    };
  `,
});

const baseBeacon = {
  beacon_id: "beacon-1",
  action_items: [
    {
      id: "primary",
      text: "Connect",
      action_v2: { action_enum: "connect_ledger_accounts" },
    },
  ],
  ui_info: {
    type: "beacon_banner_info",
    title: "Connect your accounts",
    description: "Get personal finance help.",
    informational_link: {
      id: "learn-more",
      text: "Learn more",
      url: "/settings",
    },
    icon_image_url: "https://example.com/icon.png",
    icon_image_url_dark: null,
    icon_image_size: "medium",
    banner_design: "default",
  },
};

const banner = beaconModule.n({
  beacon: baseBeacon,
  allowExternalActions: true,
  allowRemoteImages: true,
  navigate: (target) => {
    globalThis.__beaconAnnouncementTest.navigated = target;
  },
  onDismiss: () => {},
});
const bannerSurface = banner.props.children;
check(
  bannerSurface.type === "Banner" && bannerSurface.props.variant === "beacon",
  "renders backend banner data through the shared Banner surface",
);
check(
  bannerSurface.props.leadingVisual.props.src ===
    "https://example.com/icon.png" &&
    bannerSurface.props.actionsPlacement === "aside",
  "renders validated remote artwork and default action placement",
);
check(
  bannerSurface.props.additionalActions.props.variant === "banner" &&
    bannerSurface.props.additionalActions.props.actionItems.length === 1,
  "forwards Beacon actions to the shared action renderer",
);
const descriptionChildren = bannerSurface.props.description.props.children;
let prevented = false;
descriptionChildren[2].props.onClick({
  preventDefault() {
    prevented = true;
  },
});
check(
  prevented && globalThis.__beaconAnnouncementTest.navigated === "/settings",
  "routes internal informational links without opening a browser",
);

function renderController(beacon, extra = {}) {
  const wrapper = beaconModule.t({
    accountId: "account-1",
    actionAccountId: "account-1",
    beacon,
    onDismiss: extra.onDismiss,
    onUnsupported: extra.onUnsupported,
    renderPresentation: extra.renderPresentation,
  });
  return wrapper.type(wrapper.props);
}

const bannerController = renderController(baseBeacon);
check(
  bannerController.type === beaconModule.n,
  "selects the banner presentation for banner Beacon payloads",
);
const financeOverride = bannerController.props.getActionOverride(
  baseBeacon.action_items[0],
);
const financeResult = await financeOverride();
check(
  financeResult.didComplete &&
    globalThis.__beaconAnnouncementTest.financeCalls.length === 1 &&
    globalThis.__beaconAnnouncementTest.navigated ===
      "/conversation/finance-conversation",
  "bridges Finance actions into account linking and conversation navigation",
);

const modalBeacon = {
  ...baseBeacon,
  ui_info: {
    type: "beacon_modal_info",
    title: "Modal title",
    description: "Modal description",
  },
};
const modalController = renderController(modalBeacon);
const modal = modalController.type(modalController.props);
check(
  modal.type === "Dialog" && modal.props.variant === "beaconModal",
  "selects the modal presentation",
);

const takeoverBeacon = {
  ...baseBeacon,
  ui_info: {
    type: "homepage_takeover",
    title: "Takeover title",
    subtitle: "Takeover subtitle",
    foreground_image_url: "https://example.com/takeover.png",
  },
};
const takeoverController = renderController(takeoverBeacon);
const takeover = takeoverController.type(takeoverController.props);
check(
  takeover.type === "section" && takeover.props["data-homepage-takeover"],
  "selects the homepage takeover presentation",
);

const carouselBeacon = {
  ...baseBeacon,
  ui_info: {
    type: "beacon_carousel_info",
    pages: [
      {
        id: "page-1",
        title: "First",
        description: "First page",
        cta_text: "Next",
      },
      {
        id: "page-2",
        title: "Second",
        description: "Second page",
        cta_text: "Done",
      },
    ],
  },
};
const carouselController = renderController(carouselBeacon);
const carousel = carouselController.type(carouselController.props);
check(
  carousel.type === "Dialog" &&
    carousel.props.contentProps.onKeyDown instanceof Function,
  "selects the keyboard-navigable carousel presentation",
);
check(
  globalThis.__beaconAnnouncementTest.supportInputs.at(-1).variant ===
    "carousel",
  "validates Beacon actions against the active presentation variant",
);

globalThis.__beaconAnnouncementTest.support = {
  status: "unsupported",
  diagnostic: { reason: "unsupported-action" },
};
let unsupported = 0;
const unsupportedContent = renderController(baseBeacon, {
  onUnsupported: () => {
    unsupported += 1;
  },
});
check(
  unsupportedContent == null && unsupported === 1,
  "suppresses unsupported Beacon payloads and reports the failure",
);

globalThis.__beaconAnnouncementTest.support = { status: "supported" };
const customPresentation = renderController(baseBeacon, {
  renderPresentation: ({ content, supportStatus }) => ({
    content,
    supportStatus,
    custom: true,
  }),
});
check(
  customPresentation.custom && customPresentation.supportStatus === "supported",
  "supports custom presentation hosts while preserving support status",
);

assert.equal(assertions, 12);
console.log(`${assertions} Home Beacon announcement assertions passed`);
