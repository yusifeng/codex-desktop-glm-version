import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { createWebMcpDescriptorSerializer } = require('../app/.vite/build/browser-page-preload/webmcp-descriptor.js');

const schema = { safeParse(value) { return Array.isArray(value) && value.every((item) => typeof item.name === 'string') ? { success: true, data: value } : { success: false }; } };
const serializer = createWebMcpDescriptorSerializer({ descriptorForPageSchema: schema, maxTools: 2, maxTotalDescriptorBytes: 200 });
assert.deepEqual(serializer.collectDescriptors([]), []);
assert.deepEqual(serializer.collectDescriptors([{ name: 'a', inputSchema: JSON.stringify({ type: 'object' }) }]), [{ name: 'a', inputSchema: { type: 'object' } }]);
assert.deepEqual(serializer.collectDescriptors([{ name: 'a' }, { name: 'b' }, { name: 'c' }]), []);
assert.deepEqual(serializer.collectDescriptors([{ name: 1 }]), []);
const tiny = createWebMcpDescriptorSerializer({ descriptorForPageSchema: schema, maxTools: 2, maxTotalDescriptorBytes: 5 });
assert.deepEqual(tiny.collectDescriptors([{ name: 'a' }]), []);
console.log('5 preload WebMCP descriptor assertions passed');
