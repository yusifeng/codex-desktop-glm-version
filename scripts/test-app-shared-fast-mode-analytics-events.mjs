import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [
    path.join(
      ROOT,
      "src/renderer/app-shared/runtime/fast-mode-analytics-events.ts",
    ),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});

const events = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

const expected = {
  FAST_MODE_ANNOUNCEMENT_CTA_CLICKED:
    "protobuf_analytics_events.v1.CodexFastModeAnnouncementCtaClicked",
  FAST_MODE_ANNOUNCEMENT_DISMISSED:
    "protobuf_analytics_events.v1.CodexFastModeAnnouncementDismissed",
  FAST_MODE_ANNOUNCEMENT_VIEWED:
    "protobuf_analytics_events.v1.CodexFastModeAnnouncementViewed",
  FAST_MODE_BANNER_CTA_CLICKED:
    "protobuf_analytics_events.v1.CodexFastModeBannerCtaClicked",
  FAST_MODE_BANNER_DISMISSED:
    "protobuf_analytics_events.v1.CodexFastModeBannerDismissed",
  FAST_MODE_BANNER_VIEWED:
    "protobuf_analytics_events.v1.CodexFastModeBannerViewed",
};

let assertions = 0;
for (const [name, type] of Object.entries(expected)) {
  assert.deepEqual(events[name], { $type: type }, `restores ${name}`);
  assertions += 1;
}

console.log(
  `app-shared Fast Mode analytics behavior: ${assertions}/${assertions} assertions passed`,
);
