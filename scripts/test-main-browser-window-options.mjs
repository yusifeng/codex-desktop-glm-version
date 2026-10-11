#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { buildBrowserWindowOptions } = require("../app/.vite/build/main-app/startup/browser-window-options.js");

assert.deepEqual(
  buildBrowserWindowOptions({
    width: 900,
    height: 700,
    x: 20,
    y: 30,
    title: `Codex`,
    icon: `/tmp/icon.png`,
    backgroundColor: `#fff`,
    show: true,
    parent: `parent`,
    focusable: false,
    autoHideMenuBar: true,
    backgroundMaterial: `mica`,
    hasNativeGlass: false,
    supportsWindowTiling: true,
    appearanceOptions: { titleBarStyle: `hidden` },
    minWidth: 480,
    minHeight: 600,
    webPreferences: { preload: `/tmp/preload.js` },
  }),
  {
    width: 900,
    height: 700,
    x: 20,
    y: 30,
    title: `Codex`,
    icon: `/tmp/icon.png`,
    backgroundColor: `#fff`,
    show: true,
    parent: `parent`,
    focusable: false,
    autoHideMenuBar: true,
    backgroundMaterial: `mica`,
    hasNativeGlass: false,
    supportsWindowTiling: true,
    titleBarStyle: `hidden`,
    minWidth: 480,
    minHeight: 600,
    webPreferences: { preload: `/tmp/preload.js` },
  },
);

const fallback = buildBrowserWindowOptions({
  width: 480,
  height: 600,
  title: `Fallback`,
  icon: null,
  backgroundColor: `#000`,
  show: false,
  autoHideMenuBar: false,
  backgroundMaterial: null,
  hasNativeGlass: false,
  appearanceOptions: {},
  webPreferences: {},
});
assert.equal(`x` in fallback, false);
assert.equal(`icon` in fallback, false);
assert.equal(fallback.backgroundMaterial, undefined);
assert.equal(`autoHideMenuBar` in fallback, false);
console.log(`2 main browser window options assertions passed`);
