import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__remoteProjectModalTest = {
  analytics: [],
  enabled: true,
  events: {},
  hookIndex: 0,
  localDisabled: false,
  values: [],
  jsx: {
    jsx: (type, props, key) => ({ type, props, key }),
  },
  react: {
    useState(initial) {
      const index = state.hookIndex++;
      if (!(index in state.values)) state.values[index] = initial;
      return [
        state.values[index],
        (next) => {
          state.values[index] =
            typeof next === "function" ? next(state.values[index]) : next;
        },
      ];
    },
  },
});

const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/create-remote-project-modal/index.ts"),
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
                  export const LX = () => "scope"; export const ZI = "root";
                  export const e6 = () => globalThis.__remoteProjectModalTest.react;
                  export const I3 = () => globalThis.__remoteProjectModalTest.jsx;
                  export const K3 = (name, handler) => { globalThis.__remoteProjectModalTest.events[name] = handler; };
                  export const FX = () => {}; export const W3 = () => {}; export const QI = () => {};
                `,
                "app-initial": `
                  export const _N = () => globalThis.__remoteProjectModalTest.localDisabled;
                  export const E4 = () => globalThis.__remoteProjectModalTest.enabled;
                  export const tjt = value => globalThis.__remoteProjectModalTest.analytics.push(value);
                  export const gN = () => {}; export const C4 = () => {}; export const QAt = () => {};
                `,
                "create-project-dialog-core": `
                  export const r = () => {}; export const t = "CreateProjectDialog";
                `,
              }[importPath] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const modal = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
function render(props) {
  state.hookIndex = 0;
  return modal.CreateRemoteProjectModal(props);
}

check(render() === null, "stays hidden without a request");
state.events["open-create-remote-project-modal"]({
  mode: "create",
  hostId: "host-1",
});
let node = render();
check(
  node.type === "CreateProjectDialog",
  "opens from the create-project event",
);
check(
  node.props.initialRequest.hostId === "host-1",
  "forwards the remote project request",
);
check(node.key === 1, "keys the first event-backed request");
check(
  state.analytics[0].projectType === "remote",
  "records remote project creation analytics",
);

state.events["remote-workspace-root-requested"]({
  mode: "pick",
  hostId: "host-2",
});
node = render();
check(
  node.props.initialRequest.hostId === "host-2" && node.key === 2,
  "refreshes for a new request",
);
check(
  state.analytics.length === 1,
  "does not record creation analytics for picker mode",
);
node.props.onClose();
check(render() === null, "closes by clearing the active request");

state.localDisabled = true;
render();
state.events["open-create-remote-project-modal"]({
  mode: "create",
  hostId: "blocked",
});
check(
  render() === null,
  "blocks the explicit create event when local projects are disabled",
);
state.events["remote-workspace-root-requested"]({
  mode: "create",
  hostId: "host-3",
});
node = render();
check(
  node.props.initialRequest.hostId === "host-3",
  "accepts workspace requests independently",
);
check(state.analytics.length === 2, "records non-picker workspace requests");

state.enabled = false;
node.props.onClose();
render();
state.events["remote-workspace-root-requested"]({
  mode: "create",
  hostId: "disabled",
});
check(render() === null, "honors remote project availability");

console.log(`${assertions} create remote project modal assertions passed`);
