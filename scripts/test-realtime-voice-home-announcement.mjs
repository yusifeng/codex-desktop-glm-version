import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

globalThis.__voiceAnnouncementTest = {
  jsx: {
    jsx(type, props, key) {
      return { type, props, key };
    },
  },
};

const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/realtime-voice-home-announcement/index.ts"),
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
                  export const I3 = () => globalThis.__voiceAnnouncementTest.jsx;
                  export const Y2 = "FormattedMessage";
                  export const ig = "DismissIcon";
                  export const n4 = () => ({
                    formatMessage: descriptor => \`localized:\${descriptor.defaultMessage}\`,
                  });
                  export const $3 = () => {};
                  export const K2 = () => {};
                  export const ag = () => {};
                `,
                "home-announcement-state": `
                  const initialize = () => {};
                  initialize.presentation = { Banner: "AnnouncementShell", initializeBanner() {} };
                  export { initialize as t };
                `,
              }[importPath] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});

const voice = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

let starts = 0;
let dismissals = 0;
const chatgpt = voice.RealtimeVoiceHomeAnnouncementContent({
  entryPoint: "chatgpt",
  onDismiss: () => {
    dismissals += 1;
  },
  onStart: () => {
    starts += 1;
  },
});

check(
  chatgpt.type === "AnnouncementShell",
  "uses the shared announcement shell",
);
check(
  chatgpt.props.leadingVisual.props.src ===
    "https://persistent.oaistatic.com/voice/bidi-homepage-banner-orb.21107572.webp",
  "uses the production voice orb by default",
);
check(
  chatgpt.props.description.props.defaultMessage ===
    "Coordinate tasks, connect tools, and explore ideas",
  "renders the ChatGPT entry-point description",
);
check(
  chatgpt.props.title.props.defaultMessage === "Try ChatGPT Voice" &&
    chatgpt.props.primaryAction.label.props.defaultMessage === "Start Voice",
  "preserves localized title and action copy",
);
check(
  chatgpt.props.dismissAction.ariaLabel ===
    "localized:Dismiss voice chat banner" &&
    chatgpt.props.dismissAction.icon === "DismissIcon",
  "uses the localized dismiss label and icon",
);
chatgpt.props.primaryAction.onClick();
chatgpt.props.dismissAction.onClick();
check(starts === 1 && dismissals === 1, "forwards start and dismiss actions");

const codex = voice.RealtimeVoiceHomeAnnouncementContent({
  entryPoint: "codex",
  onDismiss() {},
  onStart() {},
  orbSrc: "custom-orb.webp",
});
check(
  codex.props.description.props.defaultMessage ===
    "Orchestrate tasks, connect tools, and explore code",
  "renders the Codex entry-point description",
);
check(
  codex.props.leadingVisual.props.src === "custom-orb.webp",
  "accepts a custom voice orb",
);

assert.equal(assertions, 8);
console.log(`${assertions} realtime voice Home announcement assertions passed`);
