import assert from "node:assert/strict";
import fs from "node:fs/promises";
import * as esbuild from "esbuild";

const source = await fs.readFile("src/main/worker/linux-desktop-entry-policy.ts", "utf8");
const { code } = await esbuild.transform(source, { loader: "ts", format: "cjs" });
const module = { exports: {} };
new Function("module", "exports", code)(module, module.exports);
const { resolveDesktopEntryMetadata } = module.exports;

const base = {
  desktopId: "editor.desktop",
  desktopPath: "/usr/share/applications/editor.desktop",
  currentDesktops: ["GNOME"],
  isExecutable: () => true,
};
assert.equal(resolveDesktopEntryMetadata({ ...base, fields: { type: "Application", exec: "editor" } }).displayName, "editor");
assert.equal(resolveDesktopEntryMetadata({ ...base, fields: { type: "Application", exec: "editor", onlyShowIn: "KDE;" } }), null);
assert.equal(resolveDesktopEntryMetadata({ ...base, fields: { type: "Application", exec: "editor", notShowIn: "GNOME;" } }), null);
assert.equal(resolveDesktopEntryMetadata({ ...base, fields: { type: "Application", dbusActivatable: "true" } }).executableIdentity, null);
assert.equal(resolveDesktopEntryMetadata({ ...base, fields: { type: "Application", exec: "editor", tryExec: "missing" }, isExecutable: () => false }), null);
console.log("worker Linux desktop entry policy tests passed (5 assertions)");
