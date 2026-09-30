import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ASSETS = "/Users/david/Workspace/ppio_github/chatgpt-desktop-src/app/webview/assets";
const hubs = [
  { file: "_localized_strings-ec31ac05191c.js", semantic: "valdi-localized-strings-registry", bytes: 8592, imports: 3, dynamic: 63, exports: ["default", "preloadValdiLocale", "valdiLocaleLoaders"], consumers: ["accounts-valdi-2c11bfad7ebf.js"], kind: "generated-locale-registry" },
  { file: "controls-fedbfda05b6b.js", semantic: "realtime-voice-controls-surface", bytes: 104597, imports: 5, dynamic: 0, exports: ["A", "B", "C", "D", "E", "F", "I", "L", "M", "N", "O", "P", "R", "S", "T", "V", "_", "a", "b", "c", "d", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "r", "s", "t", "u", "v", "w", "x", "y", "z"], consumers: ["app-initial-51da50e6c6e3.js", "avatar-overlay-native-page-910b190b3a21.js", "pets-settings-route-965aa70e25ab.js"], kind: "compiled-ui-surface" },
  { file: "learning-block-9a37c1b2cdda.js", semantic: "learning-block-registry", bytes: 1943178, imports: 592, dynamic: 3160, exports: ["ChatGptLearningBlockContentReference"], consumers: ["app-initial-51da50e6c6e3.js"], kind: "generated-model-registry" },
  { file: "tab-content-53aa2f34f4c5.js", semantic: "browser-thread-panel-tab-content", bytes: 172327, imports: 28, dynamic: 2, exports: ["BrowserThreadPanelTab"], consumers: ["app-initial-51da50e6c6e3.js"], kind: "compiled-ui-surface" },
  { file: "view-state-persistence-43de2d864034.js", semantic: "view-state-persistence-runtime", bytes: 321564, imports: 4, dynamic: 0, exports: ["_", "a", "b", "c", "d", "f", "g", "h", "i", "l", "m", "n", "o", "p", "r", "s", "t", "u", "v", "x", "y"], consumers: ["app-initial-51da50e6c6e3.js", "renderer-60f4bb7aa0fd.js", "response-883c9a267b7e.js"], kind: "state-persistence-subsystem" },
  { file: "voice-dsp-14683bb15d00.js", semantic: "voice-dsp-composition-root", bytes: 35391, imports: 6, dynamic: 2, exports: ["initializeVoiceDsp"], consumers: ["entry-6a5124b71d02.js"], kind: "composition-root" },
  { file: "voice-session-3a0fb6a67a2d.js", semantic: "voice-session-composition-root", bytes: 115855, imports: 17, dynamic: 4, exports: ["initializeVoiceSession"], consumers: ["app-initial-51da50e6c6e3.js"], kind: "composition-root" },
];

const allAssets = fs.readdirSync(ASSETS).filter(file => file.endsWith(".js"));
function exportedNames(source) {
  const names = [];
  if (/export default /.test(source)) names.push("default");
  for (const block of source.matchAll(/export \{([\s\S]*?)\};/g)) for (const item of block[1].split(",")) { const match = item.trim().match(/(?:\bas\s+)?([A-Za-z_$][\w$]*)$/); if (match) names.push(match[1]); }
  return [...new Set(names)].sort();
}
let assertions = 0;
for (const hub of hubs) {
  const source = fs.readFileSync(path.join(ASSETS, hub.file), "utf8");
  assert.equal(Buffer.byteLength(source), hub.bytes);
  assert.equal((source.match(/^import /gm) ?? []).length, hub.imports);
  assert.equal((source.match(/import\("\.\//g) ?? []).length, hub.dynamic);
  assert.deepEqual(exportedNames(source), hub.exports.slice().sort());
  const consumers = allAssets.filter(candidate => candidate !== hub.file && fs.readFileSync(path.join(ASSETS, candidate), "utf8").includes("./" + hub.file)).sort();
  assert.deepEqual(consumers, hub.consumers.slice().sort());
  assert.ok(["generated-locale-registry", "generated-model-registry", "compiled-ui-surface", "state-persistence-subsystem", "composition-root"].includes(hub.kind));
  assertions += 6;
}
assert.equal(hubs.length, 7); assertions++;
assert.equal(hubs.filter(hub => hub.kind === "composition-root").every(hub => hub.exports.length === 1 && hub.exports[0].startsWith("initialize")), true); assertions++;
assert.equal(hubs.filter(hub => hub.kind.startsWith("generated-")).every(hub => hub.dynamic > 50), true); assertions++;
console.log(assertions + " aggregation-hub preservation assertions passed");
