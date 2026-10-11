#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { buildJavaSessionOptions } = require("../app/.vite/build/main-app/language-server/java-session-options.js");

assert.deepEqual(buildJavaSessionOptions({ platform: `windows`, pathEntries: [`C:/Java`, `C:/Python`] }), {
  env: { JAVA_HOME: ``, JDK_HOME: ``, PATH: `C:/Java;C:/Python` },
});
assert.deepEqual(buildJavaSessionOptions({ platform: `linux`, pathEntries: [`/usr/lib/jvm`, `/bin`] }), {
  env: { JAVA_HOME: ``, JDK_HOME: ``, PATH: `/usr/lib/jvm:/bin` },
});
console.log(`2 main Java session options assertions passed`);
