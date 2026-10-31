import assert from "node:assert/strict";
import fs from "node:fs";
import { selectLocalProjectForWorkspace } from "../src/main/main-app/deep-links/local-project-selector.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

function createHarness(overrides = {}) {
  const messages = [];
  const selections = [];
  const createdRoots = [];
  const globalState = { selected: null };
  const projects = { existing: { id: "existing" }, explicit: { id: "explicit" } };
  const options = {
    globalState,
    projectsManager: {
      getProjectRootPathsForHost: (hostId) => {
        equal(hostId, "local");
        return ["/known"];
      },
      getLocalProjects: () => projects,
      createProjectForRoot: async (root) => {
        createdRoots.push(root);
        return { id: "created" };
      },
    },
    projectId: null,
    workspaceRoot: "/known",
    windowManager: { sendMessageToAllWindows: (message) => messages.push(message) },
    localHostId: "local",
    findProjectByRoot: (_state, root) => root === "/known" ? projects.existing : null,
    getSelectedProject: (state) => state.selected,
    setSelectedProject: (state, selection) => {
      state.selected = selection;
      selections.push(selection);
    },
    globalStateKeys: {
      LOCAL_PROJECTS: "local-projects",
      PROJECT_ORDER: "project-order",
      SELECTED_PROJECT: "selected-project",
    },
    ...overrides,
  };
  return { createdRoots, globalState, messages, options, projects, selections };
}

await assert.rejects(
  () => selectLocalProjectForWorkspace(createHarness({ projectsManager: null }).options),
  /Missing local project mutation handler/,
);
assertions += 1;

{
  const harness = createHarness();
  equal(await selectLocalProjectForWorkspace(harness.options), {
    type: "local",
    projectId: "existing",
  });
  equal(harness.createdRoots, []);
  equal(harness.selections, [{ type: "local", projectId: "existing" }]);
  equal(harness.messages, [{
    type: "global-state-updated",
    keys: ["local-projects", "project-order", "selected-project"],
  }]);
}

{
  const harness = createHarness({ projectId: "explicit" });
  equal(await selectLocalProjectForWorkspace(harness.options), {
    type: "local",
    projectId: "explicit",
  });
  equal(harness.createdRoots, []);
}

{
  const harness = createHarness({ projectId: "missing" });
  equal(await selectLocalProjectForWorkspace(harness.options), undefined);
  equal(harness.createdRoots, []);
  equal(harness.messages, []);
  equal(harness.selections, []);
}

{
  const harness = createHarness({
    workspaceRoot: "/new",
    findProjectByRoot: () => null,
  });
  equal(await selectLocalProjectForWorkspace(harness.options), {
    type: "local",
    projectId: "created",
  });
  equal(harness.createdRoots, ["/new"]);
  equal(harness.messages, [
    { type: "workspace-root-options-updated" },
    {
      type: "global-state-updated",
      keys: ["local-projects", "project-order", "selected-project"],
    },
  ]);
}

{
  const harness = createHarness({
    workspaceRoot: "/new",
    findProjectByRoot: () => null,
  });
  harness.options.projectsManager.createProjectForRoot = async (root) => {
    harness.createdRoots.push(root);
    return null;
  };
  equal(await selectLocalProjectForWorkspace(harness.options), undefined);
  equal(harness.createdRoots, ["/new"]);
  equal(harness.messages, []);
  equal(harness.selections, []);
}

{
  const harness = createHarness();
  const previousSelection = { type: "local", projectId: "existing", extra: true };
  harness.globalState.selected = previousSelection;
  equal(await selectLocalProjectForWorkspace(harness.options), previousSelection);
  equal(harness.selections, []);
  equal(harness.messages, []);
}

{
  const harness = createHarness();
  harness.globalState.selected = { type: "remote", projectId: "existing" };
  equal(await selectLocalProjectForWorkspace(harness.options), {
    type: "local",
    projectId: "existing",
  });
  equal(harness.selections, [{ type: "local", projectId: "existing" }]);
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("selectLocalProjectForWorkspace"), true);
equal(main.includes("selectLocalProjectForWorkspace({"), true);
equal(main.includes("async function git("), false);

console.log(`${assertions} main deep-link local-project selector assertions passed`);
