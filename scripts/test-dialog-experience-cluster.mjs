import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let activeHooks = [], hookCursor = 0;
const React = { useState(initial) { const hooks = activeHooks, index = hookCursor++; if (!(index in hooks)) hooks[index] = typeof initial === "function" ? initial() : initial; return [hooks[index], value => { hooks[index] = typeof value === "function" ? value(hooks[index]) : value; }]; } };
globalThis.__dialogExperienceTest = {
  React,
  jsx: {
    Fragment: "Fragment",
    jsx(type, props, key) {
      return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key };
    },
    jsxs(type, props, key) {
      return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key };
    },
  },
};

async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [{
      name: "dialog-experience-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({
          contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__dialogExperienceTest.jsx;export const e6=globalThis.__dialogExperienceTest.React;" : "export {};",
          loader: "js",
        }));
      },
    }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`);
}
function mount(Component, props) { const hooks = []; return { render() { activeHooks = hooks; hookCursor = 0; return Component(props); } }; }

function walk(node, visit) {
  if (node == null || typeof node !== "object") return;
  visit(node);
  const children = node.props?.children;
  if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit));
  else walk(children, visit);
}
function find(node, predicate) {
  let result;
  walk(node, value => { if (result == null && predicate(value)) result = value; });
  return result;
}
function all(node, predicate) {
  const result = [];
  walk(node, value => { if (predicate(value)) result.push(value); });
  return result;
}
function text(node) {
  const parts = [];
  const collect = value => {
    if (typeof value === "string" || typeof value === "number") { parts.push(String(value)); return; }
    if (value == null || typeof value !== "object") return;
    const children = value.props?.children;
    if (Array.isArray(children)) children.flat(Infinity).forEach(collect);
    else collect(children);
  };
  collect(node);
  return parts.join(" ");
}

const debug = await bundle("debug-modal");
assert.deepEqual(Object.keys(debug), ["DebugModal"]);
let debugClosed = 0;
const debugUi = debug.DebugModal({ initialRect: { width: 100, height: 100, x: -20, y: 0 }, viewport: { width: 900, height: 700 }, onClose() { debugClosed++; } });
assert.equal(debugUi.type, "dialog");
assert.equal(debugUi.props.open, true);
assert.equal(debugUi.props["data-debug-modal"], true);
assert.deepEqual(debugUi.props.style, { width: 480, height: 320, left: 0, top: 36 });
assert.equal(find(debugUi, node => node.props?.role === "tabpanel").props.children, "Debug panel");
assert.equal(find(debugUi, node => node.props?.["data-resize-handle"]).props["aria-hidden"], true);
const debugClose = find(debugUi, node => node.props?.["aria-label"] === "Close debug panel");
assert.equal(debugClose.type, "button");
debugClose.props.onClick();
assert.equal(debugClosed, 1);

const pet = await bundle("pet-install-modal-host");
assert.deepEqual(Object.keys(pet), ["PetInstallModalHost"]);
assert.equal(pet.PetInstallModalHost({ onClose() {} }), null);
let petClosed = 0;
let installed = 0;
const readyPet = pet.PetInstallModalHost({ session: { name: "Orbit", description: "A calm companion", status: "ready" }, onClose() { petClosed++; }, onInstall() { installed++; } });
assert.match(text(readyPet), /Install Orbit\?/);
assert.match(text(readyPet), /A calm companion/);
const readyInstall = find(readyPet, node => node.type === "button" && node.props.children === "Install");
assert.equal(readyInstall.props.disabled, false);
readyInstall.props.onClick();
assert.equal(installed, 1);
const installingPet = pet.PetInstallModalHost({ session: { name: "Orbit", status: "installing" }, onClose() {} });
assert.equal(installingPet.props["aria-busy"], true);
assert.equal(find(installingPet, node => node.props?.children === "Installing…").props.disabled, true);
const failedPet = pet.PetInstallModalHost({ session: { name: "Orbit", status: "installError", error: "offline" }, onClose() {} });
assert.equal(find(failedPet, node => node.props?.role === "alert").props.children, "offline");
assert.equal(find(failedPet, node => node.props?.children === "Try again").props.disabled, false);
const installedPet = pet.PetInstallModalHost({ session: { name: "Orbit", status: "installed" }, onClose() { petClosed++; } });
assert.match(text(installedPet), /Installed Orbit/);
assert.equal(all(installedPet, node => node.type === "button").length, 1);
find(installedPet, node => node.type === "button").props.onClick();
assert.equal(petClosed, 1);

assertReleaseOwner("subscription-renewal-dialog");

assertReleaseOwner("upgrade-plan-dialog");

assertReleaseOwner("voice-personalization-dialog");

const slidesOutlineReleaseAssertions = assertReleaseOwner("slides-outline-template-picker");

console.log(`dialog experience cluster tests passed (${slidesOutlineReleaseAssertions} slides outline release assertions)`);
