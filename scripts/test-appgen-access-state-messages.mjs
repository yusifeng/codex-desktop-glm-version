import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__accessStateMessagesTest = {
  initialized: [],
  jsx: { jsx: (type, props, key) => ({ type, props, key }) },
});
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/appgen-access-state-messages/index.ts"),
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
                "rolldown-runtime": `export const n = initializer => { let done = false; return () => { if (!done) { done = true; initializer(); } }; };`,
                "app-shared": `
                  export const I3 = () => globalThis.__accessStateMessagesTest.jsx;
                  export const G2 = (messages) => messages; export const A_ = "PublicIcon";
                  export const $3 = () => globalThis.__accessStateMessagesTest.initialized.push("$3");
                  export const j_ = () => globalThis.__accessStateMessagesTest.initialized.push("j_");
                  export const K2 = () => globalThis.__accessStateMessagesTest.initialized.push("K2");
                  export const e6 = () => globalThis.__accessStateMessagesTest.initialized.push("e6");
                `,
                "appgen-access": `
                  export const r = (policy) => policy.summary;
                  export const c = (value) => (value.accessMode === "admins_only" || value.accessMode === "custom") && value.groupCount === 0 && value.userCount === 0;
                  export const s = () => globalThis.__accessStateMessagesTest.initialized.push("access");
                `,
                lock: `export const n = () => globalThis.__accessStateMessagesTest.initialized.push("lock"); export const t = "LockIcon";`,
                building: `export const n = () => globalThis.__accessStateMessagesTest.initialized.push("building"); export const t = "BuildingIcon";`,
              }[importPath] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const messages = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
messages.o();
messages.i();
check(
  state.initialized.includes("lock") && state.initialized.includes("building"),
  "initializes icon dependencies",
);
check(
  state.initialized.filter((item) => item === "access").length === 2,
  "initializes access logic for icons and messages",
);

const cases = [
  [{ accessMode: "custom", groupCount: 0, userCount: 0 }, "owner_only"],
  [{ accessMode: "custom", groupCount: 0, userCount: 2 }, "people"],
  [{ accessMode: "custom", groupCount: 2, userCount: 0 }, "groups"],
  [{ accessMode: "custom", groupCount: 1, userCount: 1 }, "people_and_groups"],
  [{ accessMode: "public", groupCount: 0, userCount: 0 }, "public"],
  [
    { accessMode: "workspace_all", groupCount: 0, userCount: 0 },
    "workspace_all",
  ],
];
for (const [accessState, key] of cases) {
  check(
    messages
      .t(accessState)
      .id.includes(
        key === "owner_only"
          ? "onlyVisibleToYou"
          : key === "people_and_groups"
            ? "visibleToPeopleAndGroups"
            : key === "workspace_all"
              ? "visibleToWorkspace"
              : key === "public"
                ? "visibleToEveryone"
                : key === "groups"
                  ? "visibleToGroups"
                  : "visibleToPeople",
      ),
    `selects the full ${key} message`,
  );
  check(
    messages.n(accessState).defaultMessage.length > 0,
    `selects the short ${key} message`,
  );
  check(
    messages.r(accessState).defaultMessage.startsWith("This site"),
    `selects the site ${key} message`,
  );
}

let icon = messages.a({ accessState: cases[0][0], className: "icon" });
check(
  icon.type === "LockIcon" && icon.props.className === "icon",
  "uses the lock icon for owner-only access",
);
icon = messages.a({ accessState: cases[1][0] });
check(
  typeof icon.type === "function",
  "uses the people SVG for restricted sharing",
);
const peopleSvg = icon.type({ className: "people" });
check(
  peopleSvg.type === "svg" && peopleSvg.props.viewBox === "0 0 16 13",
  "preserves the people icon geometry",
);
icon = messages.a({ accessState: cases[5][0] });
check(
  icon.type === "BuildingIcon",
  "uses the building icon for workspace access",
);
icon = messages.a({ accessState: cases[4][0] });
check(icon.type === "PublicIcon", "uses the public icon for internet access");
icon = messages.a({ accessPolicy: { summary: cases[2][0] } });
check(
  typeof icon.type === "function",
  "derives icon state from an access policy",
);

console.log(`${assertions} Appgen access-state message assertions passed`);
