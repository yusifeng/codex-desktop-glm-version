import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { installDesktopOpenPathHandler } from "../src/main/main-app/files/desktop-open-path-handler.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const settle = async () => {
  for (let index = 0; index < 6; index += 1) {
    await new Promise((resolve) => setImmediate(resolve));
  }
};
const createDescriptors = (paths) => [...new Set(paths)].map((value) => ({
  label: path.basename(value),
  path: value,
  fsPath: value,
}));

function createHarness(options = {}) {
  const allWindowMessages = [];
  const directWindowMessages = [];
  const reports = [];
  const infos = [];
  const warnings = [];
  const projectCalls = [];
  const cleanupCalls = [];
  const window = { isDestroyed: () => options.destroyed ?? false };
  let availability = options.availability ?? { status: "loading" };
  let featureListener;
  let fileHandler;
  let selectedProject = options.selectedProject ?? null;
  const globalState = {};
  const projectsManager = {
    getProjectRootPathsForHost(hostId) {
      equal(hostId, "local-host");
      return options.existingRoots ?? [];
    },
    async createProjectsForRoots(roots) {
      projectCalls.push(roots);
      if (options.projectError != null) throw options.projectError;
      if (options.createProjects != null) return options.createProjects(roots);
      return roots.map((root, index) => ({ id: `project-${index + 1}`, rootPaths: [root] }));
    },
  };
  const dispose = installDesktopOpenPathHandler({
    ensureWindow: async () => options.noWindow ? null : window,
    errorReporter: { reportNonFatal: (...args) => reports.push(args) },
    globalState,
    isMacOS: true,
    projectsManager,
    windowManager: {
      sendMessageToAllWindows: (message) => allWindowMessages.push(message),
      sendMessageToWindow: (_window, message) => directWindowMessages.push(message),
      showPrimaryWindow: (showOptions) => directWindowMessages.push(["show", showOptions]),
    },
    installEarlyOpenPathListeners(enabled) {
      equal(enabled, true);
      return () => cleanupCalls.push("early");
    },
    setOpenFilesHandler(handler) {
      fileHandler = handler;
      return options.initialPaths ?? [];
    },
    releaseOpenFilesHandler(handler) {
      equal(handler, fileHandler);
      cleanupCalls.push("files");
    },
    subscribeFeatureAvailability(listener) {
      featureListener = listener;
      return () => cleanupCalls.push("features");
    },
    getFeatureAvailability: () => availability,
    stat: async (resolvedPath) => {
      if (resolvedPath.endsWith("missing")) throw new Error("missing");
      return { resolvedPath };
    },
    resolvePath: (value) => path.resolve("/resolved", value),
    extname: path.extname,
    pathToFileURL,
    classifyDesktopOpenPath: (resolvedPath) => {
      if (resolvedPath.endsWith("dir")) return { kind: "directory", path: resolvedPath };
      if (resolvedPath.endsWith(".html")) return { kind: "browser-document", path: resolvedPath };
      return { kind: "file", path: resolvedPath };
    },
    createOpenFileDescriptors: createDescriptors,
    collectFileExtensions: (descriptors) => [...new Set(descriptors.map(({ path: value }) => path.extname(value).slice(1)))].sort(),
    getSelectedProject: () => selectedProject,
    setSelectedProject: (_state, value) => { selectedProject = value; },
    localHostId: "local-host",
    globalStateKeys: {
      LOCAL_PROJECTS: "local-projects",
      PROJECT_ORDER: "project-order",
      SELECTED_PROJECT: "selected-project",
    },
    normalizeError: (error) => ({ normalized: error }),
    logger: {
      n: () => ({
        info: (...args) => infos.push(args),
        warning: (...args) => warnings.push(args),
      }),
    },
    now: () => 1234,
  });
  return {
    allWindowMessages,
    cleanupCalls,
    directWindowMessages,
    dispose,
    emitFeature: () => featureListener(),
    get fileHandler() { return fileHandler; },
    globalState,
    infos,
    projectCalls,
    reports,
    setAvailability: (value) => { availability = value; },
    get selectedProject() { return selectedProject; },
    warnings,
  };
}

{
  const harness = createHarness({
    initialPaths: ["dir", "dir", "data.csv", "tool.skill", "page.html", "missing"],
  });
  await settle();
  equal(harness.projectCalls, []);
  harness.setAvailability({
    status: "ready",
    codexLocalAccess: true,
    workLocalAccess: false,
  });
  harness.emitFeature();
  await settle();
  equal(harness.projectCalls, [["/resolved/dir"]]);
  equal(harness.selectedProject, { type: "local", projectId: "project-1" });
  equal(harness.warnings.length, 1);
  equal(harness.warnings[0][0], "Failed to stat desktop open path");
  equal(harness.allWindowMessages, [
    { type: "global-state-updated", keys: ["local-projects", "project-order"] },
    { type: "workspace-root-options-updated" },
    { type: "workspace-root-option-added", root: "/resolved/dir" },
    { type: "global-state-updated", keys: ["selected-project"] },
  ]);
  equal(harness.directWindowMessages.slice(0, 3), [
    { type: "workspace-root-option-added", projectId: "project-1", root: "/resolved/dir" },
    ["show", { stealFocus: true }],
    {
      type: "navigate-to-route",
      path: "/",
      state: {
        focusComposerNonce: 1234,
        project: { type: "local", projectId: "project-1" },
      },
    },
  ]);
  equal(harness.directWindowMessages[3], ["show", { stealFocus: true }]);
  equal(harness.directWindowMessages[4], {
    type: "new-projectless-task",
    files: [
      { label: "data.csv", path: "/resolved/data.csv", fsPath: "/resolved/data.csv" },
      { label: "tool.skill", path: "/resolved/tool.skill", fsPath: "/resolved/tool.skill" },
    ],
    prefillPromptKind: "install-skill",
    previewFiles: [
      { label: "data.csv", path: "/resolved/data.csv", fsPath: "/resolved/data.csv" },
    ],
  });
  equal(harness.directWindowMessages[5], {
    type: "toggle-browser-panel",
    open: true,
    url: pathToFileURL("/resolved/page.html").href,
    source: "manual",
    initiator: "os_open",
  });
  equal(harness.infos[0][1].safe, { fileCount: 2, fileExtensions: ["csv", "skill"] });
}

{
  const harness = createHarness({
    availability: { status: "ready", codexLocalAccess: false, workLocalAccess: false },
    initialPaths: ["dir", "tool.skill", "data.csv", "page.html"],
  });
  await settle();
  equal(harness.projectCalls, []);
  equal(harness.directWindowMessages[0], ["show", { stealFocus: true }]);
  equal(harness.directWindowMessages[1].files, [
    { label: "data.csv", path: "/resolved/data.csv", fsPath: "/resolved/data.csv" },
  ]);
  equal("prefillPromptKind" in harness.directWindowMessages[1], false);
  equal(harness.directWindowMessages[2].type, "toggle-browser-panel");
}

{
  let active = 0;
  let maximumActive = 0;
  let releaseFirst;
  const firstProject = new Promise((resolve) => { releaseFirst = resolve; });
  let projectBatch = 0;
  const harness = createHarness({
    availability: { status: "ready", codexLocalAccess: true, workLocalAccess: false },
    initialPaths: ["first-dir"],
    createProjects: async (roots) => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      projectBatch += 1;
      if (projectBatch === 1) await firstProject;
      active -= 1;
      return [{ id: `batch-${projectBatch}`, rootPaths: roots }];
    },
  });
  await settle();
  harness.fileHandler(["second-dir"]);
  releaseFirst();
  await settle();
  equal(maximumActive, 1);
  equal(harness.projectCalls, [["/resolved/first-dir"], ["/resolved/second-dir"]]);
}

{
  const failure = new Error("projects failed");
  const harness = createHarness({
    availability: { status: "ready", codexLocalAccess: true, workLocalAccess: false },
    initialPaths: ["dir"],
    projectError: failure,
  });
  await settle();
  equal(harness.reports, [[failure, { kind: "desktop-open-paths" }]]);
}

{
  const harness = createHarness();
  harness.dispose();
  equal(harness.cleanupCalls, ["features", "files", "early"]);
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("installDesktopOpenPathHandler"), true);
equal(main.includes("installDesktopOpenPathHandler({"), true);
equal(main.includes("installEarlyOpenPathListeners: t.r"), true);
equal(main.includes("function zst("), false);
equal(main.includes("function Bst("), false);
equal(main.includes("openPathArguments.BROWSER_DOCUMENT_EXTENSIONS"), false);

console.log(`${assertions} main desktop open-path handler assertions passed`);
