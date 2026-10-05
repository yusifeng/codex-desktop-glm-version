import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { getEnvironmentValue, hasPathOverride, mergeProcessEnvironment } = require(
  "../app/.vite/build/worker/git-executable-policy.js",
);
let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
equal(getEnvironmentValue({ Path: " /bin ", PATH: "/custom" }, "path"), "/custom");
equal(getEnvironmentValue({ ComSpec: " cmd.exe " }, "COMSPEC"), "cmd.exe");
equal(getEnvironmentValue({}, "PATH"), undefined);
equal(hasPathOverride({ Path: "/custom" }), true);
equal(hasPathOverride({ HOME: "/tmp" }), false);
assert.deepEqual(mergeProcessEnvironment({ Path: "/custom" }, { PATH: "/old", Home: "/tmp" }), { Home: "/tmp", Path: "/custom" }); assertions++;
console.log(`${assertions} worker git executable policy assertions passed`);
