import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cases = [
  [
    "banner-235b1db18610.js",
    "workspace-seat-banner",
    ["rolldown-runtime", "app-shared", "app-initial"],
    0,
    ["ViewOnlySeatBanner", "WorkspaceSeatTopBanner"],
  ],
  [
    "chatgpt-header-upgrade-b1c003dededb.js",
    "chatgpt-header-upgrade",
    ["rolldown-runtime", "app-shared", "app-initial"],
    0,
    ["ChatGptHeaderUpgrade"],
  ],
];
const releaseAliases = new Map([
  ["state-92adb03a8a05", "workspace-renewal-state"],
  ["home-announcement-slot-e1c7dd804e24", "home-announcement-slot"],
  ["queries-c2eea224fb16", "subscription-queries"],
  ["events-f978a623b4c2", "subscription-recovery-events"],
]);
const normalized = (name) =>
  releaseAliases.get(name) ?? name.replace(/-[a-f0-9]{12}$/u, "");
let assertions = 0;
for (const [asset, directory, dependencies, dynamics] of cases) {
  const original = fs.readFileSync(
    path.join(root, "src/webview/assets", asset.replace(/\.js$/u, ".ts")),
    "utf8",
  );
  const recovered = fs.readFileSync(
    path.join(root, "src/renderer", directory, "index.ts"),
    "utf8",
  );
  const sourceDeps = [...original.matchAll(/from "\.\/([^"]+)\.js"/gu)].map(
    (match) => normalized(match[1]),
  );
  const recoveredDeps = [
    ...recovered.matchAll(/(?:from\s*|import\s*)"@rchunk\/([^"]+)"/gu),
  ].map((match) => match[1]);
  assert.deepEqual(sourceDeps, dependencies);
  assert.deepEqual(recoveredDeps, dependencies);
  assert.equal((original.match(/import\(/gu) ?? []).length, dynamics);
  assert.equal((recovered.match(/import\(/gu) ?? []).length, dynamics);
  assert.equal(
    /:\s*any\b|\bas any\b|<any>|@ts-expect-error|@ts-nocheck/u.test(recovered),
    false,
  );
  assert.ok(recovered.includes("Release chunk: " + asset));
  assertions += 6;
}
const state = {
  account: null,
  mutation: {
    isSuccess: false,
    isPending: false,
    isError: false,
    mutateAsync: async () => {
      state.requested++;
    },
  },
  requested: 0,
  opened: [],
  gate: true,
};
globalThis.__nk = state;
const shared = `const s=globalThis.__nk; export const I3=()=>({jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})}); export const e6=()=>({useState:value=>[typeof value==='function'?value():value,()=>{}]}); export const HX=()=>s.account; export const BX=()=>s.mutation; export const LX=()=>({get:()=>s.mutation}); export const ZI={}; export const Y2='message'; export const Yh='button'; export const S_='icon'; export const Wu='seat'; export const Nb='offer'; export const tC='upgrade';`;
const initial = `const s=globalThis.__nk; export const e7='seat'; export const t7='request'; export const n7='notice'; export const afn=()=>({get:()=>s.gate}); export const Yit=()=>{}; export const uht=()=>s.account; export const Hln=()=>true; export const O0=plan=>({displayPlan:plan,pricePlan:plan}); export const N6t=()=> 'password'; export const he=()=>({data:s.account}); export const V=()=>s.account?[s.account]:[]; export const f7={HeaderAction:'header-action'}; export const U=()=>input=>s.opened.push(input); export const le=()=>s.gate;`;
function mock(name) {
  if (name === "app-shared") return shared;
  if (name === "app-initial") return initial;
  if (name === "app-primary") return "export const Jp='warning-icon';";
  if (name === "home-announcement-slot")
    return "export const t='announcement-slot';";
  if (name === "workspace-renewal-state") return "export const r='renewal';";
  if (name === "subscription-queries")
    return "export const n='subscription';export const r='assignment';";
  if (name === "subscription-recovery-events") return "export const n=()=>{};";
  if (name === "subscription-recovery-dialog")
    return "export const RecoveryDialog=props=>({dialog:props});";
  return "export {};";
}
async function load(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(root, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    write: false,
    logLevel: "silent",
    plugins: [
      {
        name: "mocks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, (args) => ({
            path: args.path.slice(8),
            namespace: "mock",
          }));
          build.onLoad({ filter: /.*/, namespace: "mock" }, (args) => ({
            contents: mock(args.path),
            loader: "js",
          }));
        },
      },
    ],
  });
  return import(
    "data:text/javascript;base64," +
      Buffer.from(result.outputFiles[0].text).toString("base64") +
      "#" +
      directory
  );
}
for (const [_asset, directory, _deps, _dynamic, exports] of cases) {
  const module = await load(directory);
  assert.deepEqual(Object.keys(module).sort(), [...exports].sort());
  assertions++;
  if (directory === "workspace-seat-banner") {
    state.account = null;
    assert.equal(module.WorkspaceSeatTopBanner(), null);
    state.account = { accountId: "a", userId: "u", seatType: "view_only" };
    assert.equal(module.ViewOnlySeatBanner().type.name, "SeatBanner");
    assertions += 2;
  }
  if (directory === "chatgpt-header-upgrade") {
    state.account = { account_id: "a", plan_type: "free" };
    const result = module.ChatGptHeaderUpgrade({ isHomepage: true });
    assert.equal(result.type, "header-action");
    assert.equal(result.props.actionId, "chatgpt-header-upgrade");
    assertions += 2;
  }
}
assertions += assertReleaseOwner("subscription-payment-announcement");
console.log(`misc-ui-utils NK: ${assertions} assertions passed`);
