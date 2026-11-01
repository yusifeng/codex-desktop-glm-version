import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__legacyHomeTest = {
  jsx: {
    Fragment: "fragment",
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
  react: {
    Suspense: "Suspense",
    useState: (value) => [value, () => {}],
  },
};
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/codex-home-announcements/index.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
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
                  export const I3 = () => globalThis.__legacyHomeTest.jsx;
                  export const e6 = () => globalThis.__legacyHomeTest.react;
                  export const n4 = () => ({ formatMessage: d => d.defaultMessage });
                  export const m4 = (...values) => values.filter(Boolean).join(" ");
                  export const Y2 = "FormattedMessage"; export const ig = "Dismiss";
                  export const $3 = () => {}; export const K2 = () => {};
                `,
                "app-initial": `
                  export const i_n = () => ({ pathname: "/" }); export const sbt = () => false;
                  export const CNt = () => ({ id: "rate", isEligible: true, isLoading: false, content: "rate" });
                `,
                "home-beacon": `
                  export const r = () => ({ accountId: null, beacon: null, containerBeacon: null, isEligible: false, isLoading: false, shouldSuppressVanillaPromos: false });
                  export const t = () => {};
                `,
                "composer-announcement-slot": `export const n = () => {}; export const t = "CandidateHost";`,
                "workspace-renewal-payment": `export const n = () => ({ isEligible: false, isLoading: false, content: null });`,
                "codex-app-home-beacon-announcement-core": `export const r = () => {}; export const t = "Beacon";`,
                "home-announcement-state": `
                  const initialize = () => {};
                  initialize.presentation = { Banner: "AnnouncementShell" };
                  export { initialize as t };
                  export const u = () => ({ id: "multi", isEligible: false, isLoading: false, content: null });
                `,
                banner: `export const t = "CustomGptBanner";`,
                "home-composer-announcement-candidates": `export const HomeComposerAnnouncementCandidates = "CandidateSource";`,
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
const home = announcements.n({
  entryPoint: "codex",
  homeComposerMode: "chat",
  selectedCustomGptId: "gizmo-1",
});
check(home.type === "fragment", "combines custom GPT and announcement content");
check(
  home.props.children[0].props.children.type === "CustomGptBanner",
  "renders the selected custom GPT banner",
);
check(
  home.props.children[1].type === "Suspense" &&
    home.props.children[1].props.children.type === "CandidateSource",
  "loads composer candidates behind Suspense",
);
check(
  home.props.children[1].props.children.props.beaconProduct === "chatgpt",
  "maps chat composer mode to the ChatGPT beacon product",
);

let rendered;
const codex = announcements.t({
  composerEntries: [
    { id: "composer", isEligible: true, isLoading: false, content: "composer" },
  ],
  renderCandidates(candidates) {
    rendered = candidates;
    return candidates;
  },
  shouldHideOnboardingPromos: false,
});
check(
  typeof codex.type === "function",
  "routes Codex entries through the candidate stack",
);
const stack = codex.type(codex.props);
check(
  stack.type.name === "renderCandidates",
  "uses the shared candidate renderer",
);
const output = stack.type(stack.props);
check(Array.isArray(output), "forwards candidates to the caller renderer");
check(rendered[0].id == null, "prepends the workspace renewal candidate");
check(
  rendered.some((candidate) => candidate.id === "rate"),
  "includes rate-limit reset status",
);
check(
  rendered.some((candidate) => candidate.id === "composer"),
  "preserves composer candidates",
);

assert.equal(assertions, 10);
console.log(`${assertions} legacy Codex Home announcement assertions passed`);
