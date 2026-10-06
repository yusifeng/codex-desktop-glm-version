import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { installWebMcpProtocol } = require('../app/.vite/build/browser-page-preload/webmcp-protocol.js');

const listeners = new Map();
const pageEvents = [];
const windowLike = {
  location: { href: 'https://example.test/' },
  navigation: { addEventListener() {}, removeEventListener() {} },
  addEventListener(type, listener) { listeners.set(type, listener); },
  removeEventListener() {},
};
globalThis.window = windowLike;
globalThis.document = {};
globalThis.isSecureContext = true;

const schema = (shape = {}) => ({
  shape,
  optional: () => ({ shape }),
  min: () => ({ shape }),
  omit: () => ({ extend: () => ({ array: () => ({ safeParse: (value) => ({ success: true, data: value }) }) }) }),
});
let exposed;
installWebMcpProtocol({
  electron: {
    ipcRenderer: {
      sendSync() { return { enabled: true, limits: { maxTools: 10, maxTotalDescriptorBytes: 1000 } }; },
      send(channel, payload) { pageEvents.push({ channel, payload }); },
    },
    contextBridge: {
      exposeInMainWorld(name, value) { exposed = { name, value }; },
      executeInMainWorld: async () => undefined,
    },
  },
  createRegistry: () => ({ codexGetTools: async () => [], registerTool: async () => undefined }),
  zod: { object: schema, string: schema, boolean: schema, unknown: schema },
  pageEventChannel: 'webmcp-page-event',
  policyChannel: 'webmcp-policy',
  webmcpChangedEvent: { type: 'webmcp-tools-changed', version: 1 },
  modelContextProperty: 'modelContext',
});

assert.equal(exposed.name, 'modelContext');
assert.equal(pageEvents.length, 1);
assert.equal(pageEvents[0].payload.type, 'webmcp-tools-changed');
assert.equal(typeof listeners.get('pageshow'), 'function');
assert.equal(typeof listeners.get('pagehide'), 'function');
console.log('4 preload WebMCP protocol assertions passed');
