import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createAnnotationSiteRequests } = require("../app/.vite/build/browser-page-preload/annotation-site-requests.js");

function eventTarget() {
  const listeners = new Map();
  return {
    addEventListener(type, listener, capture) {
      const key = `${type}:${capture === true}`;
      const values = listeners.get(key) ?? [];
      values.push(listener);
      listeners.set(key, values);
    },
    removeEventListener(type, listener, capture) {
      const key = `${type}:${capture === true}`;
      listeners.set(key, (listeners.get(key) ?? []).filter((value) => value !== listener));
    },
    emit(type, event, capture) {
      for (const listener of listeners.get(`${type}:${capture === true}`) ?? []) listener(event);
    },
    count(type, capture) { return (listeners.get(`${type}:${capture === true}`) ?? []).length; },
  };
}

const documentRef = eventTarget();
const windowRef = eventTarget();
const navigatorRef = { userActivation: { isActive: true } };
let permission = true;
let enabled = true;
const dispatched = [];
const api = createAnnotationSiteRequests({
  documentRef,
  windowRef,
  navigatorRef,
  getState: () => ({ enabled }),
  requestPermission: () => permission,
  resolveRequest: (candidate, state) => state.enabled ? { resolvedTarget: candidate.resolvedTarget, metadata: candidate.metadata } : null,
  prepareRequest: () => ({
    target: `target-${dispatched.length + 1}`,
    resolvedTarget: `resolved-${dispatched.length + 1}`,
    request: { permissionGranted: false },
    metadata: { source: `test` },
  }),
});
assert.equal(documentRef.count(`codex:open-annotation`), 1);
assert.equal(windowRef.count(`keydown`, true), 1);

const received = [];
api.subscribe((target, resolvedTarget, request, metadata) => received.push({ target, resolvedTarget, request, metadata }));
let prevented = false;
documentRef.emit(`codex:open-annotation`, { composedPath: () => [], target: {}, preventDefault: () => { prevented = true; } });
await Promise.resolve();
assert.equal(prevented, true);
assert.equal(received.length, 1);
assert.equal(received[0].request.permissionGranted, true);

permission = false;
documentRef.emit(`codex:open-annotation`, { composedPath: () => [], target: {}, preventDefault() { throw new Error(`denied request must not prevent default`); } });
assert.equal(received.length, 1);

let resolvePermission;
permission = new Promise((resolve) => { resolvePermission = resolve; });
documentRef.emit(`codex:open-annotation`, { composedPath: () => [], target: {}, preventDefault: () => {} });
windowRef.emit(`pagehide`, { isTrusted: true, persisted: true });
resolvePermission(true);
await Promise.resolve();
assert.equal(received.length, 1);
windowRef.emit(`pageshow`, { isTrusted: true });

let resolveStalePermission;
permission = new Promise((resolve) => { resolveStalePermission = resolve; });
documentRef.emit(`codex:open-annotation`, { composedPath: () => [], target: {}, preventDefault: () => {} });
enabled = false;
resolveStalePermission(true);
await Promise.resolve();
assert.equal(received.length, 1);
enabled = true;

let resolveEscapePermission;
permission = new Promise((resolve) => { resolveEscapePermission = resolve; });
documentRef.emit(`codex:open-annotation`, { composedPath: () => [], target: {}, preventDefault: () => {} });
windowRef.emit(`keydown`, { isTrusted: true, key: `Escape` }, true);
resolveEscapePermission(true);
await Promise.resolve();
assert.equal(received.length, 1);

api.dispose();
assert.equal(documentRef.count(`codex:open-annotation`), 0);
assert.equal(windowRef.count(`pagehide`), 0);
assert.equal(windowRef.count(`pageshow`), 0);
assert.equal(windowRef.count(`keydown`, true), 0);
console.log(`test-preload-annotation-site-requests: 12 assertions passed`);
