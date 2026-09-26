import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/app-shared/runtime/git-settings.ts"),
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

const git = settings.gitSettings;
equal(Object.keys(git).length, 11, "defines all eleven Git settings");
equal(git.branchPrefix.default, "codex/", "uses the Codex branch prefix");
equal(git.alwaysForcePush.default, false, "does not force-push by default");
equal(git.createPullRequestAsDraft.default, true, "creates draft pull requests by default");
equal(git.pullRequestMergeMethod.default, "merge", "defaults to merge commits");
equal(git.reviewMode.default, "full", "defaults to full review mode");
equal(git.showSidebarPrIcons.default, undefined, "leaves sidebar PR icons unset");
equal(git.worktreeRoot.default, "", "leaves the worktree root empty");
equal(git.commitInstructions.agentAccess, "read-only", "keeps commit instructions read-only");
equal(git.pullRequestInstructions.key, "git-pr-instructions", "uses the PR instruction key");
equal(git.pullRequestWatchAutoMerge.default, false, "does not auto-merge watched PRs");
equal(git.pullRequestWatchInstructions.key, "git-pr-watch-instructions", "uses the watch instruction key");

for (const definition of Object.values(git)) {
  equal(
    definition.hostStorage,
    { kind: "global-state", key: definition.key },
    `${definition.key} uses global state`,
  );
}

equal(git.branchPrefix.schema.safeParse("feature/").success, true, "accepts string prefixes");
equal(git.branchPrefix.schema.safeParse(12).success, false, "rejects numeric prefixes");
equal(git.pullRequestMergeMethod.schema.safeParse("merge").success, true, "accepts merge");
equal(git.pullRequestMergeMethod.schema.safeParse("squash").success, true, "accepts squash");
equal(git.pullRequestMergeMethod.schema.safeParse("rebase").success, false, "rejects rebase");
equal(git.reviewMode.schema.safeParse("last-turn-only").success, true, "accepts last-turn review");
equal(git.reviewMode.schema.safeParse("changed-files").success, false, "rejects unknown review modes");
equal(git.showSidebarPrIcons.schema.safeParse(true).success, true, "accepts sidebar icon booleans");
equal(git.showSidebarPrIcons.schema.safeParse(undefined).success, false, "keeps undefined as a default only");
equal(git.pullRequestWatchAutoMerge.schema.safeParse("true").success, false, "rejects string booleans");
equal(settings.initializeGitSettings(), undefined, "initializes Git settings");

console.log(
  `app-shared Git settings behavior: ${assertions}/${assertions} assertions passed`,
);
