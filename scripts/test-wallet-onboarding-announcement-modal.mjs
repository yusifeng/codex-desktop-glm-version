import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function styledElement() {
  const properties = new Map();
  return {
    style: {
      transform: "",
      setProperty(name, value) {
        properties.set(name, value);
      },
      properties,
    },
  };
}

globalThis.__walletModalTest = {
  reducedMotion: false,
  cleanup: undefined,
  timers: [],
  cards: [styledElement(), styledElement(), styledElement()],
  pockets: [styledElement(), styledElement(), styledElement()],
  classes: new Set(),
  jsx: {
    jsx(type, props, key) {
      return { type, props, key };
    },
    jsxs(type, props, key) {
      return { type, props, key };
    },
  },
};
globalThis.__walletModalTest.scene = {
  querySelectorAll(selector) {
    return selector === "[data-wallet-card]"
      ? globalThis.__walletModalTest.cards
      : globalThis.__walletModalTest.pockets;
  },
  classList: {
    add(name) {
      globalThis.__walletModalTest.classes.add(name);
    },
    remove(name) {
      globalThis.__walletModalTest.classes.delete(name);
    },
  },
};
globalThis.__walletModalTest.react = {
  useRef() {
    return { current: globalThis.__walletModalTest.scene };
  },
  useEffect(effect) {
    globalThis.__walletModalTest.cleanup = effect();
  },
};
globalThis.window = {
  setTimeout(callback, delay) {
    globalThis.__walletModalTest.timers.push({ callback, delay });
    return globalThis.__walletModalTest.timers.length;
  },
  clearTimeout() {},
  requestAnimationFrame() {
    return 1;
  },
  cancelAnimationFrame() {},
};

const result = await esbuild.build({
  entryPoints: [
    path.join(
      ROOT,
      "src/renderer/wallet-onboarding-announcement-modal/index.ts",
    ),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  define: {
    "import.meta.url": JSON.stringify(
      pathToFileURL(
        path.join(
          ROOT,
          "app/webview/assets/wallet-onboarding-announcement-modal-5f24c11f1adc.js",
        ),
      ).href,
    ),
  },
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
                export const I3 = globalThis.__walletModalTest.jsx;
                export const e6 = globalThis.__walletModalTest.react;
                export const Y2 = "FormattedMessage";
                export const m4 = (...values) => values.filter(Boolean).join(" ");
              `,
                "app-initial": `
                export const Slt = () => globalThis.__walletModalTest.reducedMotion;
                export const l2 = "AnnouncementModal";
                export const o3t = "WalletMark";
              `,
              }[importPath] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const wallet = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

let dismissed = 0;
let setup = 0;
const modal = wallet.WalletOnboardingAnnouncementModal({
  dismissAnnouncement: () => {
    dismissed += 1;
  },
  footer: "footer",
  isSettingUpWallet: true,
  onSetUpWallet: () => {
    setup += 1;
  },
});
check(
  modal.type === "AnnouncementModal",
  "renders through the shared announcement modal shell",
);
check(
  modal.props.actionLayout === "stacked" &&
    modal.props.mediaClassName === "h-[240px]" &&
    modal.props.isPrimaryActionLoading,
  "preserves the Wallet modal layout and loading state",
);
check(
  modal.props.title.props.defaultMessage === "Introducing ChatGPT Wallet" &&
    modal.props.primaryActionLabel.props.defaultMessage ===
      "Set up ChatGPT Wallet",
  "uses the localized Wallet title and primary action",
);
modal.props.onDismiss();
modal.props.onPrimaryAction();
check(dismissed === 1 && setup === 1, "forwards dismiss and setup actions");

globalThis.__walletModalTest.timers = [];
const animatedMedia = modal.props.media.type(modal.props.media.props);
check(
  animatedMedia.props.children.props.children.length === 3,
  "renders the cyan, purple, and green card layers",
);
check(
  globalThis.__walletModalTest.timers[0].delay === 2000,
  "delays the automatic tuck animation by two seconds",
);
check(
  globalThis.__walletModalTest.cards[0].style.transform.includes(
    "rotate(-15deg)",
  ) &&
    globalThis.__walletModalTest.pockets[0].style.transform ===
      "translateY(80px)",
  "starts the first layer in its fanned transform",
);
check(
  globalThis.__walletModalTest.pockets[0].style.properties.get(
    "--pocket-border-opacity",
  ) === "0",
  "hides pocket surfaces while cards are fanned",
);

globalThis.__walletModalTest.reducedMotion = true;
globalThis.__walletModalTest.timers = [];
modal.props.media.type({ animationMode: "animate", animationSpeed: "normal" });
check(
  globalThis.__walletModalTest.timers.length === 0,
  "skips animation for reduced motion",
);
check(
  globalThis.__walletModalTest.cards[0].style.transform ===
    "translate(0px, 0px) rotate(0deg)" &&
    globalThis.__walletModalTest.pockets[0].style.transform ===
      "translateY(0px)" &&
    globalThis.__walletModalTest.pockets[0].style.properties.get(
      "--pocket-surface-opacity",
    ) === "1",
  "uses the fully tucked state for reduced motion",
);

assert.equal(assertions, 10);
console.log(`${assertions} Wallet onboarding modal assertions passed`);
