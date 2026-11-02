import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import * as esbuild from "esbuild";

const built = await esbuild.build({
  entryPoints: ["src/main/logger/index.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});
const loggerRuntime = await import(
  `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected) => {
  assertions += 1;
  assert.deepEqual(actual, expected);
};
const records = [];
const backend = {
  log(level, message, tags) {
    records.push({ level, message, tags });
  },
};
for (const level of ["trace", "debug", "info", "warning", "error"]) {
  backend[level] = (message, tags) => backend.log(level, message, tags);
}
loggerRuntime.getLogger().info("before-install", { safe: { phase: "early" }, sensitive: {} });
loggerRuntime.setLogger(backend);
equal(records[0], {
  level: "info",
  message: "before-install",
  tags: { safe: { phase: "early" }, sensitive: {} },
});
const tagged = loggerRuntime.createTaggedLogger("browser-host");
tagged.warning("failed", { safe: { retry: true } });
equal(records[1], {
  level: "warning",
  message: "[browser-host] failed",
  tags: { safe: { retry: true }, sensitive: {} },
});
const memoized = loggerRuntime.memoizedTaggedLogger("sampler");
equal(memoized(), memoized());
memoized().log("debug", "tick");
equal(records[2], {
  level: "debug",
  message: "[sampler] tick",
  tags: { safe: {}, sensitive: {} },
});
const elapsed = loggerRuntime.createElapsedTimestampLogger("startup");
elapsed.info("ready");
assert.match(records[3].message, /^\[startup\] \[\d+\.\d{3}\] ready$/);
assertions += 1;

console.log(`${assertions} main logger runtime assertions passed`);
