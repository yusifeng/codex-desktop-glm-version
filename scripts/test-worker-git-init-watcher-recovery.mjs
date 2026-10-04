import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { isGitMetadataDirectoryUnavailable } = require(
  "../app/.vite/build/worker/git-init-watcher-recovery.js",
);

let assertions = 0;
const equal = (actual, expected) => {
  assertions++;
  assert.equal(actual, expected);
};

equal(
  await isGitMetadataDirectoryUnavailable("/repo/.git", {
    stat: async () => ({ isDirectory: () => true }),
    isMissingPathError: () => false,
  }),
  false,
);
equal(
  await isGitMetadataDirectoryUnavailable("/repo/.git", {
    stat: async () => ({ isDirectory: () => false }),
    isMissingPathError: () => false,
  }),
  true,
);
equal(
  await isGitMetadataDirectoryUnavailable("/repo/.git", {
    stat: async () => { throw Object.assign(new Error("missing"), { code: "ENOENT" }); },
    isMissingPathError: (error) => error?.code === "ENOENT",
  }),
  true,
);
equal(
  await isGitMetadataDirectoryUnavailable("/repo/.git", {
    stat: async () => { throw new Error("permission denied"); },
    isMissingPathError: () => false,
  }),
  false,
);

console.log(`${assertions} worker git init watcher recovery assertions passed`);
