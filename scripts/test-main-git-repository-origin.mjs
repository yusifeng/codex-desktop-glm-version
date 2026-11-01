import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/misc/git-repository-origin.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const loaded = { exports: {} };
Function("module", "exports", transpiled.code)(loaded, loaded.exports);
const { parseRepositoryOrigin } = loaded.exports;

equal(parseRepositoryOrigin("https://github.com/openai/codex.git"), {
  host: "github.com",
  owner: "openai",
  repo: "codex",
});
equal(parseRepositoryOrigin("ssh://git@example.com/team/platform/repo.GIT"), {
  host: "example.com",
  owner: "team/platform",
  repo: "repo",
});
equal(parseRepositoryOrigin("git@github.com:openai/codex.git"), {
  host: "github.com",
  owner: "openai",
  repo: "codex",
});
equal(parseRepositoryOrigin("github.com:group/subgroup/repo"), {
  host: "github.com",
  owner: "group/subgroup",
  repo: "repo",
});
equal(parseRepositoryOrigin("  git@example.com:/owner/repo.git  "), {
  host: "example.com",
  owner: "owner",
  repo: "repo",
});
equal(parseRepositoryOrigin("C:\\work\\repo"), null);
equal(parseRepositoryOrigin("D:/work/repo"), null);
equal(parseRepositoryOrigin(""), null);
equal(parseRepositoryOrigin("https://github.com/repo"), null);
equal(parseRepositoryOrigin("https://github.com/"), null);
equal(parseRepositoryOrigin("git@github.com:repo"), null);
equal(parseRepositoryOrigin("not-a-remote"), null);
equal(parseRepositoryOrigin("https://"), null);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes('require("./main-app/misc/git-repository-origin.js")'), true);
equal(main.includes("parseRepoOrigin: parseRepositoryOrigin"), true);
equal(main.includes("function dt("), false);
equal(main.includes("function ft("), false);
equal(main.includes("function pt("), false);
equal(main.includes("function mt("), false);

console.log(`${assertions} git repository origin assertions passed`);
