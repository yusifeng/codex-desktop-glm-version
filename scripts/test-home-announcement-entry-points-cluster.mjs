import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = [
  "option-carousel",
  "use-home-directory",
  "task-announcement-candidates",
  "announcement-entry-points",
];
const state = (globalThis.__homeAnnouncementEntryPointTest = {
  homeDirectory: "/Users/tester",
  imported: [],
});
state.jsx = {
  Fragment: Symbol("Fragment"),
  jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
  jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
};

const mocks = {
  "app-shared": `
    export const I3 = () => globalThis.__homeAnnouncementEntryPointTest.jsx;
    export const BX = (_query, variables) => ({ data: variables == null ? undefined : { homeDirectory: globalThis.__homeAnnouncementEntryPointTest.homeDirectory } });
  `,
  "app-initial": "export const gcn = Symbol('home-directory-query');",
  "app-primary": "export const Sm = null;",
  "composer-announcement-slot": "export const t = null;",
  "computer-history-plugin-icon": "export const t = 'computer-history.png';",
  "run-external-agent-import-command": `
    export const runExternalAgentImportCommand = async (scope, source) => {
      globalThis.__homeAnnouncementEntryPointTest.imported.push({ scope, source });
    };
  `,
};

function mock(name) {
  return mocks[name] ?? "export {};";
}

async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [
      {
        name: "home-announcement-entry-point-mocks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
            path: importPath.slice(8),
            namespace: "mock",
          }));
          build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({
            contents: mock(importPath),
            loader: "js",
          }));
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`
  );
}

function nodes(root) {
  const output = [];
  const visit = (value) => {
    if (value == null || typeof value !== "object") return;
    if (Array.isArray(value)) return value.forEach(visit);
    if ("type" in value && "props" in value) output.push(value);
    visit(value.props?.children);
  };
  visit(root);
  return output;
}

// option-carousel
const carousel = await bundle("option-carousel");
carousel.n();
const carouselTree = carousel.t({
  ariaLabel: "Featured options",
  backLabel: "Previous",
  children: ["one", "two"],
  forwardLabel: "Next",
  header: "Choose one",
  layout: "gallery",
});
assert.equal(carouselTree.type, "section");
assert.equal(carouselTree.props.role, "group");
assert.equal(carouselTree.props["aria-label"], "Featured options");
assert.match(carouselTree.props.className, /gallery/);
const carouselButtons = nodes(carouselTree).filter((node) => node.type === "button");
assert.equal(carouselButtons.length, 2);
assert.equal(carouselButtons[0].props.title, "Previous");
assert.equal(carouselButtons[1].props.title, "Next");
let scrollRequest = null;
const viewport = nodes(carouselTree).find((node) => node.props.className === "option-carousel__viewport");
viewport.props.ref({ clientWidth: 200, scrollLeft: 100, scrollWidth: 600, scrollTo: (request) => { scrollRequest = request; } });
carouselButtons[1].props.onClick();
assert.deepEqual(scrollRequest, { behavior: "smooth", left: 260 });

// use-home-directory
const homeDirectory = await bundle("use-home-directory");
homeDirectory.t();
assert.equal(homeDirectory.n("local"), "/Users/tester");
assert.equal(homeDirectory.r("local").data.homeDirectory, "/Users/tester");
assert.equal(homeDirectory.r(null).data, undefined);

// task-announcement-candidates
const taskCandidates = await bundle("task-announcement-candidates");
assert.equal(taskCandidates.TaskAnnouncementCandidates({ replacementModel: "gpt-next", suppressed: true }), null);
assert.equal(taskCandidates.TaskAnnouncementCandidates({ currentModel: "gpt-next", replacementModel: "gpt-next" }), null);
let switchedModel = null;
let dismissedModelNotice = false;
const taskTree = taskCandidates.TaskAnnouncementCandidates({
  conversationId: "conversation-1",
  currentModel: "gpt-old",
  replacementModel: "gpt-next",
  onDismiss: () => { dismissedModelNotice = true; },
  onSwitchModel: (model) => { switchedModel = model; },
});
assert.equal(taskTree.type, "aside");
assert.match(nodes(taskTree).find((node) => node.type === "strong").props.children, /gpt-old/);
const taskButtons = nodes(taskTree).filter((node) => node.type === "button");
taskButtons[0].props.onClick();
taskButtons[1].props.onClick();
assert.equal(switchedModel, "gpt-next");
assert.equal(dismissedModelNotice, true);

// announcement-entry-points
const announcements = await bundle("announcement-entry-points");
announcements._();
announcements.a();
announcements.c();
announcements.d();
announcements.l();
announcements.m();
announcements.n();
announcements.r();
announcements.y();
const now = 10 * 24 * 60 * 60 * 1000;
const hour = 60 * 60 * 1000;
assert.equal(announcements.g([{ startMs: now - 8 * 24 * hour, endMs: now }], now), true);
assert.equal(announcements.g([{ startMs: now - 8 * 24 * hour, endMs: now - 7 * 24 * hour }], now), false);
assert.equal(announcements.g([], now), false);
assert.equal(announcements.h([{ completedAtMs: 300, successes: [1] }, { completedAtMs: 500, successes: [] }], { latestImportedAtMs: 200 }), 300);
assert.equal(announcements.h([], {}), null);
const replayState = announcements.f({ enabled: true });
assert.equal(replayState.isEligible, true);
replayState.dismiss();
assert.equal(replayState.isEligible, false);
assert.equal(announcements.f({ enabled: false }).isEligible, false);
const importState = announcements.o();
assert.equal(importState.providerId, null);
assert.equal(importState.isLoading, false);
assert.equal(announcements.i().isEligible, true);
let replayed = false;
let shown = false;
const replayTree = announcements.p({ onDismiss() {}, onReplay() { replayed = true; }, onShown() { shown = true; } });
assert.equal(shown, true);
nodes(replayTree).find((node) => node.type === "button" && node.props.children === "Replay a task").props.onClick();
assert.equal(replayed, true);
let imported = false;
const importTree = announcements.s({ onDismiss() {}, onImport() { imported = true; }, providerId: "claude-code" });
assert.match(nodes(importTree).find((node) => node.type === "strong").props.children, /Claude Code/);
nodes(importTree).find((node) => node.type === "button" && /Import from/.test(node.props.children)).props.onClick();
assert.equal(imported, true);
let gifted = false;
const giftTree = announcements.t({ onDismiss() {}, onOpenGiftCredits() { gifted = true; } });
nodes(giftTree).find((node) => node.type === "button" && node.props.children === "Gift credits").props.onClick();
assert.equal(gifted, true);
let recapPrompt = null;
const historyTree = announcements.v({ onDismiss() {}, onViewRecap(prompt) { recapPrompt = prompt; } });
nodes(historyTree).find((node) => node.type === "button" && node.props.children === "View recap").props.onClick();
assert.match(recapPrompt, /Computer History/);
await announcements.u("scope-1");
assert.deepEqual(state.imported, [{ scope: "scope-1", source: "home_beacon" }]);

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\.(?:equal|deepEqual|match|ok)\s*\(/g)].length;
console.log(`${assertionCount} home announcement entry-point cluster assertions passed`);
