import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function resetState() {
  globalThis.__browserSkillsTest = { apiCalls: [], derived: [], queries: [] };
  return globalThis.__browserSkillsTest;
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
    plugins: [{
      name: "browser-skills-foundation-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: value }) => ({ path: value.slice(8), namespace: "mock" }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: value }) => {
          if (value === "app-shared") return { contents: `
            const state=globalThis.__browserSkillsTest;
            const noop=()=>{};
            export const FX=noop,QI=noop,g4=noop,ZI={scope:true};
            export const sZ=(_scope,derive)=>{const signal={kind:"derived",index:state.derived.length,derive};state.derived.push(signal);return signal};
            export const QX=(_scope,factory)=>{const family={kind:"query",index:state.queries.length,factory};state.queries.push(family);return family};
          `, loader: "js" };
          if (value === "app-initial") return { contents: `
            const state=globalThis.__browserSkillsTest;
            const noop=()=>{};
            export const Dln="workspace-permissions",K6t="selected-account",gfn="experiment-client",mfn="feature-flag",vfn="suppressed",yun="auth-state";
            export const G6t=noop,Oln=noop,Sun=noop,cJt=noop,pfn=noop;
            export const rJt={
              safeGet:async(path,options)=>{state.apiCalls.push({method:"get",path,options});return state.getResponse??{hazelnuts:[]}},
              safePost:async(path,options)=>{state.apiCalls.push({method:"post",path,options});return {}},
              safePatch:async(path,options)=>{state.apiCalls.push({method:"patch",path,options});return state.patchResponse??{id:"approved"}},
            };
          `, loader: "js" };
          if (value === "text-bubble-figure-light") return {
            contents: `${["E","F","G","L","N","O","S","U","V","b","c","f","g","i","j","k","m","n","o","q","u","v","w","z"].map((name) => `export const ${name}="/${name}.svg";`).join("\n")}`,
            loader: "js",
          };
          return { contents: "export {};", loader: "js" };
        });
      },
    }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}-${Math.random()}`);
}

// browser-skills-state: utility predicates, derived state, queries and cache synchronization.
let state = resetState();
const browserSkills = await bundle("browser-skills-state");
browserSkills.y();
browserSkills.n();
const baseSkill = { id: "skill-1", name: "Demo", updated_at: "2026-09-27T00:00:00Z" };
assert.equal(browserSkills.h(baseSkill, "user-1"), false);
assert.equal(browserSkills.h({ ...baseSkill, creator_id: "user-1" }, "user-1"), true);
assert.equal(browserSkills.h({ ...baseSkill, permissions: { can_write: true } }, "other"), true);
assert.equal(browserSkills.h({ ...baseSkill, id: "system_demo", permissions: { can_write: true } }, "user-1"), false);
assert.equal(browserSkills.b(baseSkill, "composer"), true);
assert.equal(browserSkills.b({ ...baseSkill, surfaces: ["composer"] }, "composer"), true);
assert.equal(browserSkills.b({ ...baseSkill, surfaces: ["settings"] }, "composer"), false);
assert.equal(browserSkills._({ ...baseSkill, display_name: "  Friendly  " }), "Friendly");
assert.equal(browserSkills._({ ...baseSkill, display_name: " " }), "Demo");
const safety = { enabledFrom: "2026-01-01T00:00:00Z", warningScore: 2, blockedScore: 5 };
assert.equal(browserSkills.v({ ...baseSkill, safety_scan: { risk_score: 6 } }, safety), "blocked");
assert.equal(browserSkills.v({ ...baseSkill, safety_scan: { risk_score: 3 } }, safety), "needsReview");
assert.equal(browserSkills.v({ ...baseSkill, safety_scan: { risk_score: 1 } }, safety), null);
assert.equal(browserSkills.v({ ...baseSkill, safety_check_status: "approved", safety_scan: { risk_score: 9 } }, safety), null);
assert.equal(browserSkills.g({ ...baseSkill, id: browserSkills.m }, false), false);
assert.equal(browserSkills.g({ ...baseSkill, id: browserSkills.m }, true), true);
assert.equal(state.derived.length, 8);
assert.equal(state.queries.length, 3);
const values = new Map([
  ["suppressed", false],
  ["experiment-client", { getDynamicConfig: () => ({ get: (key, fallback) => key === "enable_api" ? true : fallback }) }],
  ["selected-account", "account-1"],
  ["auth-state", { accountId: "account-1", authenticatedAccountId: "account-1", authMethod: "chatgpt", userId: "user-1", accountStructure: "personal" }],
]);
const read = (signal, parameter) => values.has(signal) ? values.get(signal) : signal?.kind === "derived" ? signal.derive({ get: read }) : parameter === "1355972088" ? false : undefined;
assert.equal(state.derived[0].derive({ get: read }).get("enable_api", false), true);
assert.deepEqual(state.derived[1].derive({ get: read }), { accountId: "account-1", userId: "user-1", isWorkspace: false });
values.set(browserSkills.d, state.derived[1].derive({ get: read }));
values.set(browserSkills.a, safety);
values.set(browserSkills.s, true);
assert.equal(state.derived[2].derive({ get: read }), true);
assert.deepEqual(state.derived[3].derive({ get: read }), { enabledFrom: "", warningScore: 2, blockedScore: 5 });
const collectionOptions = state.queries[0].factory("installed", { get: read });
assert.deepEqual(collectionOptions.queryKey, ["browser-skills", "account-1", "user-1", "collection", "installed"]);
assert.equal(collectionOptions.enabled, true);
state.getResponse = { hazelnuts: [baseSkill] };
assert.deepEqual(await collectionOptions.queryFn(), [baseSkill]);
const cacheEvents = [];
const scope = {
  get: (signal) => values.get(signal),
  queryClient: {
    cancelQueries: async (options) => cacheEvents.push({ type: "cancel", options }),
    setQueriesData: (options, updater) => cacheEvents.push({ type: "collections", options, value: updater([baseSkill]) }),
    setQueryData: (key, value) => cacheEvents.push({ type: "detail", key, value: typeof value === "function" ? value([baseSkill]) : value }),
  },
};
assert.equal(await browserSkills.r(scope, baseSkill, true), true);
assert.equal(state.apiCalls.at(-1).method, "post");
assert.equal(state.apiCalls.at(-1).options.requestBody.enabled, true);
assert.equal(cacheEvents.filter(({ type }) => type === "detail").length, 2);
assert.equal(await browserSkills.r(scope, { ...baseSkill, id: "system_locked" }, false), false);
state.patchResponse = { ...baseSkill, safety_check_status: "approved" };
await browserSkills.t(scope, baseSkill);
assert.equal(state.apiCalls.at(-1).method, "patch");
assert.equal(state.apiCalls.at(-1).options.requestBody.safety_check_status, "approved");

// skill-icon-source: embedded media detection, fallbacks, URL resolution, search and sorting.
state = resetState();
globalThis.window = { location: { href: "https://desktop.test/app/" } };
const skillIcons = await bundle("skill-icon-source");
assert.equal(skillIcons.i({ icon_small: null }), null);
assert.equal(skillIcons.i({ icon_small: " data:image/png;base64,abc " }), "data:image/png;base64,abc");
assert.equal(skillIcons.i({ icon_small: "PHN2ZyABC" }), "data:image/svg+xml;base64,PHN2ZyABC");
assert.equal(skillIcons.i({ icon_small: "/9j/ABC" }), "data:image/jpeg;base64,/9j/ABC");
assert.equal(skillIcons.i({ icon_small: "R0lGODABC" }), "data:image/gif;base64,R0lGODABC");
assert.equal(skillIcons.i({ icon_small: "UklGRABC" }), "data:image/webp;base64,UklGRABC");
assert.equal(skillIcons.i({ icon_small: "plain" }), "data:image/png;base64,plain");
const iconSkill = { id: "1", name: "Search Tools", description: "Find documents", short_description: "Fast lookup", updated_at: "2026-01-01", iconography: "search" };
assert.equal(skillIcons.t(iconSkill, false), "/S.svg");
assert.equal(skillIcons.t(iconSkill, true), "/w.svg");
assert.equal(skillIcons.t({ ...iconSkill, iconography: "unknown" }, false), "/V.svg");
assert.equal(skillIcons.n(iconSkill, false), "https://desktop.test/S.svg");
assert.equal(skillIcons.n({ ...iconSkill, icon_small: "R0lGODABC" }, false), "data:image/gif;base64,R0lGODABC");
assert.equal(skillIcons.o(iconSkill, "search_tools"), true);
assert.equal(skillIcons.o(iconSkill, "FAST-LOOKUP"), true);
assert.equal(skillIcons.o(iconSkill, "calendar"), false);
const sorted = skillIcons.s([
  { ...iconSkill, id: "b", name: "Beta", updated_at: "2026-01-01" },
  { ...iconSkill, id: "a", name: "Alpha", updated_at: "2026-01-01" },
  { ...iconSkill, id: "c", name: "Newest", updated_at: "2026-02-01" },
]);
assert.deepEqual(sorted.map(({ id }) => id), ["c", "a", "b"]);

console.log("47 browser skills foundation cluster assertions passed");
