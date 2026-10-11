import assert from "node:assert/strict";
import { createRequire } from "node:module";
const { getIgnoreSourceWatchTargets } = createRequire(import.meta.url)("../app/.vite/build/worker/git-ignore-source-targets.js");
const states = new Map([["/repo", "directory"], ["/repo/.gitignore", "file"], ["/repo/config", "symlink"], ["/etc", "directory"], ["/etc/codex", "directory"], ["/etc/codex/.gitignore", "file"]]);
const dependencies = {
  pathApi: { isAbsolute: (value) => value.startsWith("/"), parse: (value) => ({ root: value.startsWith("/") ? "/" : "" }), dirname: (value) => value.slice(0, value.lastIndexOf("/")) || "/", join: (...parts) => parts.join("/").replaceAll(/\/+/g, "/").replace("//", "/"), sep: "/" },
  lstat: async (path) => { const state = states.get(path); if (state == null) { const error = new Error("missing"); error.code = "ENOENT"; throw error; } return { isSymbolicLink: () => state === "symlink", isDirectory: () => state === "directory" }; },
  readlink: async () => "/etc/codex",
  isMissingPathError: (error) => error?.code === "ENOENT",
};
const targets = await getIgnoreSourceWatchTargets(["/repo/.gitignore", "/repo/.gitignore"], dependencies);
assert.deepEqual([...targets.get("/")], ["/repo"]);
assert.deepEqual([...targets.get("/repo")], ["/repo/.gitignore"]);
const symlinkTargets = await getIgnoreSourceWatchTargets(["/repo/config/.gitignore"], dependencies);
assert.deepEqual([...symlinkTargets.get("/repo")], ["/repo/config"]);
assert.deepEqual([...symlinkTargets.get("/etc")], ["/etc/codex"]);
assert.deepEqual([...symlinkTargets.get("/etc/codex")], ["/etc/codex/.gitignore"]);
await assert.rejects(() => getIgnoreSourceWatchTargets(["relative"], dependencies), /must be absolute/);
console.log("5 worker Git ignore-source target assertions passed");
