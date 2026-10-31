import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";

const realtimePath = new URL(
  "../src/main/main-app/avatar-overlay/realtime.ts",
  import.meta.url,
).pathname;
const bundle = await build({
  entryPoints: [realtimePath],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
  plugins: [
    {
      name: "avatar-overlay-realtime-doubles",
      setup(build) {
        build.onResolve({ filter: /^@chunk\/logger$/ }, () => ({
          path: "logger-double",
          namespace: "test-double",
        }));
        build.onResolve({ filter: /^@chunk\/shared$/ }, () => ({
          path: "shared-double",
          namespace: "test-double",
        }));
        build.onResolve({ filter: /^\.\/constants$/ }, () => ({
          path: "constants-double",
          namespace: "test-double",
        }));
        build.onLoad({ filter: /^logger-double$/, namespace: "test-double" }, () => ({
          loader: "js",
          contents: `
            const logger = { error() {}, warning() {} };
            export const memoizedTaggedLogger = () => () => logger;
          `,
        }));
        build.onLoad({ filter: /^shared-double$/, namespace: "test-double" }, () => ({
          loader: "js",
          contents: `
            export const Ac = () => {
              let resolve;
              const promise = new Promise((next) => { resolve = next; });
              return { promise, resolve };
            };
            export const Zo = (error) => error instanceof Error ? error.message : String(error);
          `,
        }));
        build.onLoad({ filter: /^constants-double$/, namespace: "test-double" }, () => ({
          loader: "js",
          contents: `
            export const REALTIME_LAUNCH_TIMEOUT_MS = 30_000;
            export const REALTIME_CONNECTED_TIMEOUT_MS = 10_000;
          `,
        }));
      },
    },
  ],
});
const bundledSource = bundle.outputFiles[0].text;
const {
  RealtimeVoiceController,
  getVoiceController,
  registerVoiceController,
} = await import(
  `data:text/javascript;base64,${Buffer.from(bundledSource).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const events = [];
const makeHandle = (name, duplicate = false) => {
  const handle = async () => undefined;
  handle.dup = () => {
    events.push(`${name}:dup`);
    return makeHandle(`${name}:copy`, true);
  };
  handle.onRpcBroken = (listener) => {
    handle.break = listener;
  };
  handle[Symbol.dispose] = () => {
    events.push(`${name}:dispose`);
  };
  handle.isDuplicate = duplicate;
  return handle;
};

const controller = new RealtimeVoiceController({
  clearPresentation() {},
  getRendererId: () => 7,
  isOpen: () => true,
  isOpening: () => false,
  isPresentationPending: () => false,
  preparePresentation: async () => undefined,
  publishLaunchState() {},
});
const firstStart = makeHandle("start");
const firstCancel = makeHandle("cancel");
controller.registerStarter(7, firstStart, firstCancel, true, null);
equal(events, ["start:dup", "cancel:dup"]);
controller.prepareForWindowCreation();
equal(events.slice(-2), ["start:copy:dispose", "cancel:copy:dispose"]);
equal(events.includes("start:dispose"), false);
equal(events.includes("cancel:dispose"), false);

const secondStart = makeHandle("start-2");
const secondCancel = makeHandle("cancel-2");
controller.registerStarter(7, secondStart, secondCancel, false, null);
equal(typeof secondStart.break, "undefined");
equal(typeof secondCancel.break, "undefined");
equal(typeof secondStart, "function");
controller.unregisterStarter(6);
equal(events.includes("start-2:copy:dispose"), false);
controller.unregisterStarter(7);
equal(events.slice(-2), ["start-2:copy:dispose", "cancel-2:copy:dispose"]);

const windowOwner = {};
registerVoiceController(windowOwner, controller);
equal(getVoiceController(windowOwner), controller);
assert.throws(() => getVoiceController({}), /unavailable/);
assertions += 1;

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
const composition = fs.readFileSync(
  new URL("../src/main/main-app/avatar-overlay/composition-surface.ts", import.meta.url),
  "utf8",
);
equal(main.includes("Hle = AvatarOverlayWindowManager"), false);
equal(main.includes("Hle = class"), false);
equal(main.includes("V = new AvatarOverlayWindowManager(B, u, x)"), true);
equal(main.includes("var zu = getVoiceController"), false);
equal(main.includes("ie = getVoiceController(V)"), true);
equal(main.includes("rle = class"), false);
equal(main.includes("function ile("), false);
equal(composition.includes("setElementSize(webContentsId"), true);
equal(composition.includes("setElementSizes("), false);

console.log(`${assertions} main avatar overlay composition owner assertions passed`);
