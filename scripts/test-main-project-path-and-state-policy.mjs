import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import { transform } from "esbuild";

const nativeRequire = createRequire(import.meta.url);
let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

async function load(relativePath, shared) {
  const source = fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
  const module = { exports: {} };
  Function("require", "module", "exports", transpiled.code)(
    (specifier) => {
      if (specifier === "@chunk/shared") return shared;
      if (specifier === "../../shared/wsl-paths") return {
        isWindowsPath: (value) => /^[A-Z]:/.test(value),
        isWslPath: shared.Wi,
        isWslUncPath: shared.Ui,
      };
      if (specifier === "../../shared/project-state") return {
        parseLocalProjects: shared.qo,
      };
      return nativeRequire(specifier);
    },
    module,
    module.exports,
  );
  return { exports: module.exports, source };
}

const sharedPath = {
  Ri: () => true,
  Vi: (value) => `desktop:${value}`,
  Mi: () => "context",
  ji: (value, context) => `storage:${context}:${value}`,
  zi: (host) => host.allowDesktop === true,
  Es: (host) => host.kind === "remote",
  Wi: (value) => value.startsWith("native:"),
  Ui: (value) => value.startsWith("unc:"),
  bl: (value) => value.startsWith("resolve:"),
};
const pathModule = await load("../src/main/main-app/projects/path-policy.ts", sharedPath);
const realpathCalls = [];
const policy = pathModule.exports.createProjectPathPolicy({
  platform: "win32",
  homedir: () => "C:/Users/local",
  realpath: async (value) => {
    realpathCalls.push(value);
    if (value.includes("missing")) throw new Error("missing");
    return value.startsWith("resolve:") ? "C:/Resolved" : `C:${value}`;
  },
  realpathSync: (value) => {
    if (value.includes("missing")) throw new Error("missing");
    return `C:${value}`;
  },
});

equal(policy.normalizeDesktopPath("/root"), "desktop:/root");
equal(policy.normalizeDesktopPathWithFlag("/root", false), "/root");
equal(policy.normalizeStoragePath("/root"), "storage:context:/root");
equal(policy.normalizeDesktopRootPaths(["a", "b"], false), ["a", "b"]);
equal(policy.mapRemoteHomePathToLocal("/home/remote/work", { kind: "remote", home_dir: "/home/remote" }), "C:/Users/local/work");
equal(policy.mapRemoteHomePathToLocal("/other", { kind: "remote", home_dir: "/home/remote" }), "/other");
equal(policy.mapRemoteHomePathToLocal("/home/remote", { kind: "local", home_dir: "/home/remote" }), "/home/remote");
equal(policy.normalizeProjectPathForHost("/root", { kind: "local" }, true), "desktop:/root");
equal(policy.normalizeProjectPathForHost("/root", { kind: "local" }, false), "storage:context:/root");
equal(policy.normalizeProjectPathForHost("native:/root", { kind: "remote" }, false), "native:/root");
equal(policy.normalizeProjectRoots(["/one", "/one"], { kind: "local" }, false), ["storage:context:/one"]);
equal(policy.normalizeLabels({ "/one": "first", "storage:context:/one": "second" }, { kind: "local" }, false), {
  "storage:context:/one": "first",
});
equal(await policy.canonicalizeRoots(["native:/one", "native:/missing"], { kind: "remote" }, false), {
  "native:/one": "C:native:/one",
});
equal(policy.getCanonicalPathMapSync(["native:/one", "native:/missing"], { kind: "remote" }, false), {
  "native:/one": "C:native:/one",
});
equal(await policy.normalizeProjectRoot("resolve:/one", { kind: "local" }), "C:/Resolved");
equal(await policy.normalizeProjectRoot("resolve:/missing", { kind: "local" }), "resolve:/missing");
equal(await policy.normalizeProjectRootsAsync(["resolve:/one", "resolve:/one"], { kind: "local" }), ["C:/Resolved"]);
equal(policy.resolveHomeMappedStoragePath("/home/remote/work", { kind: "remote", home_dir: "/home/remote", allowDesktop: true }), "storage:context:C:/Users/local/work");
equal(realpathCalls.length > 0, true);

const keys = {
  LOCAL_PROJECTS: "local-projects",
  SELECTED_PROJECT: "selected-project",
  PROJECT_ORDER: "project-order",
  REMOTE_PROJECTS: "remote-projects",
};
const stateModule = await load("../src/main/main-app/projects/project-state.ts", {
  iu: keys,
  qo: (value) => value ?? {},
  Ko: (left, right) => left.updatedAt > right.updatedAt,
  Wo: (roots) => roots?.[0] ?? null,
});
const values = new Map([
  [keys.LOCAL_PROJECTS, {
    one: { id: "one", name: "One", rootPaths: ["/one"], updatedAt: 1 },
    two: { id: "two", name: "Two", rootPaths: ["/shared", "/two"], updatedAt: 2 },
    three: { id: "three", name: "Three", rootPaths: ["/shared"], updatedAt: 3 },
  }],
  [keys.PROJECT_ORDER, ["two", "one"]],
  [keys.SELECTED_PROJECT, { type: "local", projectId: "two" }],
  [keys.REMOTE_PROJECTS, [
    { hostId: "remote", remotePath: " /work ", label: " Work " },
    { hostId: "remote", remotePath: "/work", label: "Duplicate" },
    { hostId: "other", remotePath: "/other", label: "Other" },
    { hostId: "remote", remotePath: " ", label: "Empty" },
  ]],
]);
const writes = [];
const state = {
  get: (key) => values.get(key),
  getStored: (key) => values.get(key),
  set: (key, value) => { values.set(key, value); writes.push([key, value]); },
};
equal(stateModule.exports.getLocalProjects(state), values.get(keys.LOCAL_PROJECTS));
equal(stateModule.exports.getSelectedLocalProject(state).id, "two");
equal(stateModule.exports.getLocalWorkspaceRootOptions(state), {
  roots: ["/shared", "/two", "/one"],
  labels: { "/one": "One" },
});
equal(stateModule.exports.getDefaultWorkspaceRoot(state), "/shared");
equal(stateModule.exports.findLocalProjectForRoot(state, "/shared").id, "three");
equal(stateModule.exports.getRemoteWorkspaceRootOptions(state, "remote"), {
  roots: ["/work"],
  labels: { "/work": "Work" },
});
equal(stateModule.exports.updateLocalProject(state, "one", (project) => ({ ...project, name: "Renamed" })).name, "Renamed");
equal(stateModule.exports.updateLocalProject(state, "missing", () => null), null);
equal(stateModule.exports.updateLocalProject(state, "one", () => null), null);
stateModule.exports.selectProject(state, { type: "remote", projectId: "r" });
equal(values.get(keys.SELECTED_PROJECT), { type: "remote", projectId: "r" });
const freshValues = new Map([[keys.LOCAL_PROJECTS, { first: { id: "first", name: "First", rootPaths: ["/first"] } }]]);
const fresh = {
  get: (key) => freshValues.get(key),
  getStored: () => undefined,
  set: (key, value) => freshValues.set(key, value),
};
stateModule.exports.initializeSelectedProject(fresh);
equal(freshValues.get(keys.SELECTED_PROJECT), { type: "local", projectId: "first" });
equal(writes.length >= 3, true);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/projects/path-policy.js")'), true);
equal(main.includes('require("./main-app/projects/project-state.js")'), true);
for (const name of ["Rn", "zn", "Bn", "Vn", "Hn", "Un", "Wn", "Gn", "Kn", "vte", "qn", "Jn", "Yn", "Xn", "Zn", "yte", "bte", "Qn", "xte", "jr", "Mr", "Nr", "Pr", "Fr", "Ir", "Lr", "Rr", "Nte", "Pte"])
  equal(new RegExp(`^(?:async )?function ${name}\\(`, "m").test(main), false);

console.log(`${assertions} project path and state policy assertions passed`);
