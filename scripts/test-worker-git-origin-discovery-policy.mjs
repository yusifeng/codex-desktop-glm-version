import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { canUseDiscoveryPathApi, uniqueDiscoveryDirectories } = require(
  "../app/.vite/build/worker/git-origin-discovery-policy.js",
);

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };

deepEqual(uniqueDiscoveryDirectories(["/Repo", "/repo", "/Other"], (value) => value.toLowerCase()), ["/Repo", "/Other"]);
deepEqual(uniqueDiscoveryDirectories([], (value) => value), []);
equal(canUseDiscoveryPathApi(true, "darwin", {}), true);
equal(canUseDiscoveryPathApi(true, "linux", {}), true);
equal(canUseDiscoveryPathApi(false, "darwin", {}), false);
equal(canUseDiscoveryPathApi(true, "win32", {}), false);
equal(canUseDiscoveryPathApi(true, "linux", { GIT_DIR: "/tmp/git" }), false);
equal(canUseDiscoveryPathApi(true, "linux", { GIT_WORK_TREE: "/repo" }), false);

console.log(`${assertions} worker git origin discovery policy assertions passed`);
