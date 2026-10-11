#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { shouldApplyWindowsOpacityWorkaround } = require(
  "../app/.vite/build/main-app/startup/window-presentation-policy.js",
);

assert.equal(
  shouldApplyWindowsOpacityWorkaround({ isWindows: true, isVisible: false, isMinimized: false }),
  true,
);
assert.equal(
  shouldApplyWindowsOpacityWorkaround({ isWindows: true, isVisible: true, isMinimized: false }),
  false,
);
assert.equal(
  shouldApplyWindowsOpacityWorkaround({ isWindows: true, isVisible: false, isMinimized: true }),
  false,
);
assert.equal(
  shouldApplyWindowsOpacityWorkaround({ isWindows: false, isVisible: false, isMinimized: false }),
  false,
);

console.log(`4 main window presentation policy assertions passed`);
