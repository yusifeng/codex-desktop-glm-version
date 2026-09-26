import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/app-shared/runtime/worktree-settings.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});

const settings = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function equal(actual, expected, message) {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
}

const definitions = settings.worktreeSettings;
equal(Object.keys(definitions), ["upstreamRefreshMode", "autoCleanupEnabled", "keepCount"], "keeps setting order");
equal(definitions.upstreamRefreshMode.default, "never", "defaults refresh to never");
equal(definitions.upstreamRefreshMode.agentAccess, "hidden", "hides refresh mode from agents");
equal(definitions.upstreamRefreshMode.key, "worktree-upstream-refresh-mode", "uses refresh storage key");
equal(definitions.autoCleanupEnabled.default, true, "enables cleanup by default");
equal(definitions.autoCleanupEnabled.key, "worktree-auto-cleanup-enabled", "uses cleanup storage key");
equal(definitions.keepCount.default, 15, "keeps fifteen worktrees by default");
equal(definitions.keepCount.key, "worktree-keep-count", "uses keep-count storage key");
for (const definition of Object.values(definitions)) {
  equal(definition.hostStorage, { kind: "global-state", key: definition.key }, `${definition.key} uses global state`);
}

equal(definitions.upstreamRefreshMode.schema.safeParse("never").success, true, "accepts never refresh");
equal(definitions.upstreamRefreshMode.schema.safeParse("best-effort").success, true, "accepts best-effort refresh");
equal(definitions.upstreamRefreshMode.schema.safeParse("always").success, false, "rejects unknown refresh modes");
equal(definitions.autoCleanupEnabled.schema.safeParse(false).success, true, "accepts boolean cleanup values");
equal(definitions.autoCleanupEnabled.schema.safeParse("false").success, false, "rejects string cleanup values");
equal(definitions.keepCount.schema.safeParse(1).success, true, "accepts the minimum keep count");
equal(definitions.keepCount.schema.safeParse(1.5).success, false, "rejects fractional keep counts");
equal(definitions.keepCount.schema.safeParse(0).success, false, "rejects zero keep count");

equal(
  settings.resolveWorktreeSettings(),
  { worktreesRoot: "", autoCleanupEnabled: true, keepCount: 15 },
  "uses defaults for absent settings",
);
equal(
  settings.resolveWorktreeSettings({
    "git-worktree-root": "/workspace/trees",
    "worktree-auto-cleanup-enabled": false,
    "worktree-keep-count": 24,
  }),
  { worktreesRoot: "/workspace/trees", autoCleanupEnabled: false, keepCount: 24 },
  "accepts valid stored settings",
);
equal(
  settings.resolveWorktreeSettings({
    "git-worktree-root": 42,
    "worktree-auto-cleanup-enabled": "yes",
    "worktree-keep-count": -2,
  }),
  { worktreesRoot: "", autoCleanupEnabled: true, keepCount: 15 },
  "falls back for invalid stored settings",
);
equal(
  settings.resolveWorktreeSettings({ "worktree-keep-count": 3.5 }).keepCount,
  15,
  "falls back for fractional stored keep counts",
);
equal(settings.initializeWorktreeSettings(), undefined, "initializes worktree settings");
equal(settings.initializeGitAndWorktreeSettings(), undefined, "initializes the combined settings group");

console.log(
  `app-shared worktree settings behavior: ${assertions}/${assertions} assertions passed`,
);
