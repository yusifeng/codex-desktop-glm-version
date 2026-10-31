import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";

const output = await build({
  entryPoints: [
    new URL(
      "../src/main/main-app/avatar-overlay/message-dispatch.ts",
      import.meta.url,
    ).pathname,
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
});
const runtime = await import(
  `data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`
);
let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
equal(runtime.isAvatarOverlayMessage({ type: "avatar-overlay-open" }), true);
equal(runtime.isAvatarOverlayMessage({ type: "other" }), false);

const calls = [];
const manager = new Proxy(
  { isOpen: () => true },
  {
    get(target, property) {
      return (
        target[property] ??
        ((...args) => {
          calls.push([property, ...args]);
        })
      );
    },
  },
);
const view = { id: 7 };
await runtime.dispatchAvatarOverlayMessage(manager, view, {
  type: "avatar-overlay-open",
});
equal(calls.shift(), ["toggle", view]);
let reply;
await runtime.dispatchAvatarOverlayMessage(
  manager,
  view,
  { type: "avatar-overlay-open-state-request" },
  (value) => {
    reply = value;
  },
);
equal(reply, { type: "avatar-overlay-open-state-changed", isOpen: true });
await runtime.dispatchAvatarOverlayMessage(manager, view, {
  type: "avatar-overlay-drag-start",
  pointerWindowX: 1,
  pointerWindowY: 2,
  pointerScreenX: 3,
  pointerScreenY: 4,
  usesOrbPhysics: true,
});
equal(calls.shift(), [
  "startDrag",
  7,
  {
    pointerScreenX: 3,
    pointerScreenY: 4,
    pointerWindowX: 1,
    pointerWindowY: 2,
  },
  true,
]);
await runtime.dispatchAvatarOverlayMessage(manager, view, {
  type: "avatar-overlay-drag-move",
});
equal(calls.shift(), ["moveDrag", 7]);
await runtime.dispatchAvatarOverlayMessage(manager, view, {
  type: "avatar-overlay-drag-release",
  velocityX: undefined,
  velocityY: undefined,
  shouldBounce: undefined,
});
equal(calls.shift(), ["throwWithVelocity", 7, undefined, undefined, undefined]);
await runtime.dispatchAvatarOverlayMessage(manager, view, {
  type: "avatar-overlay-pointer-interaction-changed",
  isInteractive: undefined,
});
equal(calls.shift(), ["setPointerInteraction", 7, undefined]);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(
  main.includes('require("./main-app/avatar-overlay/message-dispatch.js")'),
  true,
);
equal(main.includes("function GBe("), false);
equal(main.includes("async function KBe("), false);
console.log(
  `main avatar overlay message dispatch tests passed (${assertions} assertions)`,
);
