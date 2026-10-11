#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { buildTypeScriptServerInitializationOptions } = require("../app/.vite/build/main-app/language-server/typescript-server-options.js");

assert.deepEqual(buildTypeScriptServerInitializationOptions(`/runtime/typescript/lib/tsserver.js`), {
  tsserver: { path: `/runtime/typescript/lib/tsserver.js`, useSyntaxServer: `never` },
});
assert.notStrictEqual(
  buildTypeScriptServerInitializationOptions(`/a`),
  buildTypeScriptServerInitializationOptions(`/a`),
);
console.log(`2 main TypeScript server options assertions passed`);
