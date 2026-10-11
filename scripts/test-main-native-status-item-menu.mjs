#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { projectNativeStatusItemMenuState } = require("../app/.vite/build/main-app/startup/native-status-item-menu.js");

const state = projectNativeStatusItemMenuState({
  appName: `Codex`,
  computerHistoryAvailable: true,
  computerHistoryEnabled: false,
  computerHistoryIndicatorEnabled: true,
  computerUseAvailable: true,
  menuState: { enabled: true },
  trayMenuThreads: {
    pinnedThreads: [{ path: `/pinned`, title: `Pinned` }],
    unreadThreads: [{ path: `/unread`, title: `Unread` }],
    runningThreads: [{ path: `/running`, title: `Running` }],
  },
  labels: { pinned: `Pinned`, unread: `Unread`, running: `Running`, quit: `Quit Codex` },
});
assert.deepEqual(state, {
  appName: `Codex`,
  computerHistoryAvailable: true,
  computerHistoryEnabled: false,
  computerHistoryIndicatorEnabled: true,
  computerUseAvailable: true,
  featureState: { enabled: true },
  pinnedThreads: [{ path: `/pinned`, title: `Pinned` }],
  unreadThreads: [{ path: `/unread`, title: `Unread` }],
  runningThreads: [{ path: `/running`, title: `Running` }],
  labels: { pinned: `Pinned`, unread: `Unread`, running: `Running`, quit: `Quit Codex` },
});

const source = { path: `/source`, title: `Source` };
const projected = projectNativeStatusItemMenuState({
  appName: `Codex`,
  computerHistoryAvailable: false,
  computerHistoryEnabled: false,
  computerHistoryIndicatorEnabled: false,
  computerUseAvailable: false,
  menuState: null,
  trayMenuThreads: { pinnedThreads: [source], unreadThreads: [], runningThreads: [] },
  labels: { pinned: `P`, unread: `U`, running: `R`, quit: `Q` },
});
source.title = `Mutated`;
assert.equal(projected.pinnedThreads[0].title, `Source`);
console.log(`2 main native status item menu assertions passed`);
