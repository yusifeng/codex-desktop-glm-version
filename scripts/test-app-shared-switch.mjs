import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/app-shared/ui/switch.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  external: ["react/jsx-runtime"],
  write: false,
  logLevel: "silent",
});

globalThis.__RENDERER_JSX_RUNTIME__ = {
  jsx: (type, props, key) => ({ type, props, key }),
};

const switchModule = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function equal(actual, expected, message) {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
}
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

let changes = [];
let clicks = 0;
let node = switchModule.Switch({
  checked: false,
  onChange: (checked) => changes.push(checked),
  onClick: () => (clicks += 1),
  ariaLabel: "Enable feature",
  id: "feature-switch",
  className: "extra",
  "data-testid": "switch",
});
equal(node.type, "button", "renders a native button");
equal(node.props.type, "button", "prevents implicit form submission");
equal(node.props.role, "switch", "uses the switch role");
equal(node.props["aria-checked"], false, "announces unchecked state");
equal(
  node.props["aria-label"],
  "Enable feature",
  "forwards the accessible label",
);
equal(node.props.id, "feature-switch", "forwards the id");
equal(node.props["data-testid"], "switch", "forwards button props");
equal(node.props["data-state"], "unchecked", "marks unchecked state");
check(
  node.props.className.includes("cursor-interaction"),
  "styles interactive switches",
);
check(node.props.className.includes("extra"), "merges caller classes");

node.props.onClick({ defaultPrevented: false });
equal(clicks, 1, "runs caller click handlers");
equal(changes, [true], "toggles unchecked switches");

changes = [];
node = switchModule.Switch({
  checked: true,
  onChange: (checked) => changes.push(checked),
  onClick: (event) => event.preventDefault(),
});
let prevented = false;
node.props.onClick({
  defaultPrevented: false,
  preventDefault() {
    prevented = true;
    this.defaultPrevented = true;
  },
});
equal(prevented, true, "allows callers to prevent toggles");
equal(changes, [], "respects prevented click events");

changes = [];
node = switchModule.Switch({
  checked: true,
  disabled: true,
  onChange: (checked) => changes.push(checked),
});
equal(node.props.disabled, true, "uses native disabled semantics");
check(node.props.className.includes("opacity-60"), "dims disabled switches");
node.props.onClick({ defaultPrevented: false });
equal(changes, [], "does not toggle disabled switches");

let track = switchModule.SwitchTrack({
  checked: true,
  size: "sm",
  tone: "neutral",
  trackClassName: "track-extra",
  thumbClassName: "thumb-extra",
});
equal(track.type, "span", "renders a track span");
equal(track.props["aria-hidden"], true, "hides decorative tracks");
equal(track.props["data-state"], "checked", "marks checked tracks");
check(track.props.className.includes("h-4 w-7"), "uses the small track size");
check(track.props.className.includes("bg-text"), "uses neutral checked color");
check(track.props.className.includes("track-extra"), "merges track classes");
equal(
  track.props.children.props["data-state"],
  "checked",
  "marks checked thumbs",
);
check(
  track.props.children.props.className.includes("h-3 w-3"),
  "uses the small thumb size",
);
check(
  track.props.children.props.className.includes("bg-surface"),
  "contrasts neutral checked thumbs",
);
check(
  track.props.children.props.className.includes("thumb-extra"),
  "merges thumb classes",
);

track = switchModule.SwitchTrack({ checked: false });
equal(track.props["data-state"], "unchecked", "marks unchecked tracks");
check(
  track.props.className.includes("h-5 w-8"),
  "defaults to the regular size",
);
check(track.props.className.includes("bg-text/10"), "styles unchecked tracks");
check(
  track.props.children.props.className.includes("bg-control-thumb-on-accent"),
  "uses the accent thumb by default",
);

equal(
  switchModule.initializeSwitch(),
  undefined,
  "keeps initialization idempotent",
);

console.log(
  `app-shared switch behavior: ${assertions}/${assertions} assertions passed`,
);
