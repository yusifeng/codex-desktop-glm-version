import assert from "node:assert/strict";
import fs from "node:fs";
import {
  matchWorkspaceForOrigin,
  originsMatch,
  resolveDeepLinkWorkspace,
} from "../src/main/main-app/deep-links/workspace-resolver.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

function parseRepoOrigin(value) {
  const normalized = value.replace(/^git@([^:]+):/, "https://$1/");
  try {
    const url = new URL(normalized);
    const [owner, repo] = url.pathname.replace(/^\//, "").replace(/\.git$/i, "").split("/");
    return owner && repo ? { host: url.hostname, owner, repo } : null;
  } catch {
    return null;
  }
}

equal(originsMatch({
  targetOriginUrl: "not a repo",
  candidateOriginUrl: "not a repo",
  targetRepo: null,
  parseRepoOrigin,
}), true);
equal(originsMatch({
  targetOriginUrl: "not a repo",
  candidateOriginUrl: "different",
  targetRepo: null,
  parseRepoOrigin,
}), false);
equal(originsMatch({
  targetOriginUrl: "https://github.com/openai/codex",
  candidateOriginUrl: "git@github.com:openai/codex.git",
  targetRepo: parseRepoOrigin("https://github.com/openai/codex"),
  parseRepoOrigin,
}), true);
equal(originsMatch({
  targetOriginUrl: "https://github.com/openai/codex",
  candidateOriginUrl: "https://github.com/openai/other",
  targetRepo: parseRepoOrigin("https://github.com/openai/codex"),
  parseRepoOrigin,
}), false);

const origins = [
  { dir: "/checkout/a/subdir", root: "/checkout/a", originUrl: "git@github.com:openai/codex.git" },
  { dir: "/checkout/a", root: "/ignored", originUrl: "https://github.com/wrong/repo" },
  { dir: "/checkout/b", root: "/checkout/b", originUrl: null },
  { dir: "/checkout/c", root: "/checkout/c", originUrl: "https://github.com/openai/other" },
];
equal(matchWorkspaceForOrigin({
  targetOriginUrl: "https://github.com/openai/codex",
  workspaceRoots: ["/checkout/c", "/checkout/a"],
  origins,
  parseRepoOrigin,
}), "/checkout/a");
equal(matchWorkspaceForOrigin({
  targetOriginUrl: "https://github.com/openai/missing",
  workspaceRoots: ["/checkout/a", "/checkout/b", "/checkout/c"],
  origins,
  parseRepoOrigin,
}), null);

function createHarness(overrides = {}) {
  const requests = [];
  const stats = [];
  const options = {
    route: { originUrl: "https://github.com/openai/codex" },
    globalState: { roots: ["fallback-state"] },
    appServerClient: { hostConfig: { id: "host-config" } },
    projectsManager: null,
    resolvePath: (value) => `/resolved/${value}`,
    stat: async (value) => {
      stats.push(value);
      return { isDirectory: () => true };
    },
    getFallbackRoots: () => ["/fallback/a"],
    parseRepoOrigin,
    requestGitWorker: async (request) => {
      requests.push(request);
      return {
        origins: [{
          dir: "/fallback/a",
          root: "/fallback/a",
          originUrl: "git@github.com:openai/codex.git",
        }],
      };
    },
    ...overrides,
  };
  return { options, requests, stats };
}

{
  const harness = createHarness({ route: { path: "project", originUrl: "unused" } });
  equal(await resolveDeepLinkWorkspace(harness.options), "/resolved/project");
  equal(harness.stats, ["/resolved/project"]);
  equal(harness.requests, []);
}

{
  const harness = createHarness({
    route: { path: "file", originUrl: "https://github.com/openai/codex" },
    stat: async (value) => {
      harness.stats.push(value);
      return { isDirectory: () => false };
    },
  });
  equal(await resolveDeepLinkWorkspace(harness.options), "/fallback/a");
  equal(harness.requests, [{
    method: "origin-and-roots",
    params: {
      discoveryDirs: ["/fallback/a"],
      operationSource: "git_direct_call",
      hostConfig: { id: "host-config" },
    },
  }]);
}

{
  const harness = createHarness({
    route: { path: "missing", originUrl: "https://github.com/openai/codex" },
    stat: async () => { throw new Error("ENOENT"); },
    projectsManager: { getProjectRootPathsForHost: (hostId) => {
      equal(hostId, "local");
      return ["/project/a"];
    } },
    requestGitWorker: async (request) => {
      harness.requests.push(request);
      return { origins: [{
        dir: "/project/a/subdir",
        root: "/project/a",
        originUrl: "https://github.com/openai/codex",
      }] };
    },
  });
  equal(await resolveDeepLinkWorkspace(harness.options), "/project/a");
  equal(harness.requests[0].params.discoveryDirs, ["/project/a"]);
}

{
  const harness = createHarness({ route: { path: "missing" }, stat: async () => { throw new Error("ENOENT"); } });
  equal(await resolveDeepLinkWorkspace(harness.options), null);
  equal(harness.requests, []);
}

{
  const harness = createHarness({
    projectsManager: { getProjectRootPathsForHost: () => [] },
  });
  equal(await resolveDeepLinkWorkspace(harness.options), null);
  equal(harness.requests, []);
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("resolveDeepLinkWorkspace"), true);
equal(main.includes("resolveDeepLinkWorkspace({"), true);
equal(main.includes("function dit("), false);
equal(main.includes("function fit("), false);
equal(main.includes("function pit("), false);
equal(main.includes("function mit("), false);
equal(main.includes("function hit("), false);

console.log(`${assertions} main deep-link workspace resolver assertions passed`);
