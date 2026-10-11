#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { buildRustAnalyzerOptions } = require("../app/.vite/build/main-app/language-server/rust-analyzer-options.js");

assert.deepEqual(buildRustAnalyzerOptions(`/rust/sysroot`), {
  cargo: { buildScripts: { enable: false, rebuildOnSave: false }, noDeps: true, sysroot: `/rust/sysroot` },
  checkOnSave: false,
  files: { exclude: [`rust-analyzer.toml`] },
  procMacro: { enable: false },
});
const absent = buildRustAnalyzerOptions(null);
assert.equal(absent.cargo.sysroot, null);
assert.notStrictEqual(absent.cargo, buildRustAnalyzerOptions(null).cargo);
console.log(`2 main Rust analyzer options assertions passed`);
