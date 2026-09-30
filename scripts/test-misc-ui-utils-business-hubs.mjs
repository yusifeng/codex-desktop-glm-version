import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assets = path.join(root, "src/webview/assets");
const preserve = [
  [
    "virtual-try-on-action-runtime",
    "action-88b2df6de39c",
    60000,
    [
      "app-initial-51da50e6c6e3.ts",
      "action-1e2563405a5e.ts",
      "open-details-ea11bcecbc49.ts",
    ],
    0,
    /export \{ Qt as n, xt as r, Wt as t \};/u,
  ],
  [
    "chatgpt-announcement-candidates",
    "chatgpt-announcement-candidates-2877ea4f3612",
    30000,
    ["app-primary-d66705000d76.ts"],
    3,
    /export \{ Gt as ChatGptAnnouncementCandidates \};/u,
  ],
  [
    "composer-tip-controller",
    "controller-db23a3ccb086",
    13000,
    ["app-primary-d66705000d76.ts"],
    0,
    /export \{ qe as ComposerTipController \};/u,
  ],
  [
    "skill-details-runtime",
    "details-fbd0d4043904",
    25000,
    [
      "app-initial-51da50e6c6e3.ts",
      "details-a0d511b36499.ts",
      "directory-a7494315f12b.ts",
    ],
    0,
    /export \{ Y as i, \$ as n, Re as r, Be as t \};/u,
  ],
  [
    "gpt-directory-banner-runtime",
    "directory-banner-443a333e7ccd",
    33000,
    [
      "gpt-discovery-page-f210fd3616fe.ts",
      "app-initial-51da50e6c6e3.ts",
      "my-gpts-page-3b4fcc48b76d.ts",
    ],
    1,
    /rt as a,[\s\S]*Ye as c,[\s\S]*G as u,/u,
  ],
];
let assertions = 0;
for (const [
  semantic,
  file,
  minBytes,
  consumers,
  dynamics,
  exportPattern,
] of preserve) {
  const source = fs.readFileSync(path.join(assets, file + ".ts"), "utf8");
  assert.ok(
    Buffer.byteLength(source) > minBytes,
    semantic + " remains a large generated hub",
  );
  assert.ok(
    (source.match(/function /gu) ?? []).length >= 4,
    semantic + " contains intertwined compiled functions",
  );
  assert.equal(
    (source.match(/import\(/gu) ?? []).length,
    dynamics,
    semantic + " dynamic graph is audited",
  );
  assert.match(
    source,
    exportPattern,
    semantic + " compressed/public export surface",
  );
  for (const consumer of consumers) {
    const text = fs.readFileSync(path.join(assets, consumer), "utf8");
    assert.ok(text.includes(file + ".js"), semantic + " consumer " + consumer);
    assertions++;
  }
  assert.equal(
    fs.existsSync(path.join(root, "src/renderer", semantic, "index.ts")),
    false,
    semantic + " is intentionally not replaced with a partial facade",
  );
  assertions += 5;
}
const recoveredPath = path.join(
  root,
  "src/renderer/chatgpt-conversation-beacon-banner/index.ts",
);
const recovered = fs.readFileSync(recoveredPath, "utf8");
const expected = [
  "rolldown-runtime",
  "app-shared",
  "app-initial",
  "app-primary",
  "share-conversation-action",
  "precise-location-banner-constants",
  "codex-app-home-beacon-announcement-core",
];
assert.deepEqual(
  [...recovered.matchAll(/(?:from\s*|import\s*)"@rchunk\/([^"]+)"/gu)].map(
    (match) => match[1],
  ),
  expected,
);
assert.equal((recovered.match(/import\(/gu) ?? []).length, 0);
assert.equal(
  /:\s*any\b|\bas any\b|<any>|@ts-expect-error|@ts-nocheck/u.test(recovered),
  false,
);
assert.match(recovered, /export function ChatGptConversationBeaconBanner/u);
assertions += 4;
const state = { hidden: true, lifecycle: [], account: "acct" };
globalThis.__hub = state;
const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": `const s=globalThis.__hub;export const I3=()=>({Fragment:'fragment',jsx:(type,props)=>({type,props})});export const LX=()=>({scope:true});export const ZI={};export const QI={};export const BX=(query)=>{if(query==='pca')return 'pca';if(query==='state')return s.hidden?null:{beacon:{beacon_id:'offer',action_items:[],ui_info:{dismiss_variant:'persistent'}},eventMetadata:{messageId:'m'},productExperience:'px'};if(query==='message')return 'm';if(query==='mode')return null;if(query==='dismissed')return false;if(query==='share-location')return 'eligible';return null;};`,
  "app-initial": `const s=globalThis.__hub;export const aqt=()=>s.account;export const wVt='pca';export const fNt='state';export const jVt='message';export const YVt='mode';export const WVt='dismissed';export const dHt=()=>false;export const yNt=()=>true;export const gNt=()=>s.lifecycle.push('complete');export const mNt=()=>s.lifecycle.push('dismiss');export const _Nt=()=>s.lifecycle.push('unsupported');`,
  "app-primary": "export const Bm=()=>{};",
  "share-conversation-action":
    "export const i=()=>true;export const t='share-location';export const o=()=>({regenerate:true});export const n=()=>({share:true});export const r=input=>input.action;",
  "precise-location-banner-constants": "export const n=()=>{};",
  "codex-app-home-beacon-announcement-core":
    "export const r=()=>{};export const t='beacon-announcement';",
};
const built = await esbuild.build({
  entryPoints: [recoveredPath],
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
          contents: mocks[args.path] ?? "export {};",
          loader: "js",
        }));
      },
    },
  ],
});
const module = await import(
  "data:text/javascript;base64," +
    Buffer.from(built.outputFiles[0].text).toString("base64") +
    "#hubs"
);
assert.deepEqual(Object.keys(module), ["ChatGptConversationBeaconBanner"]);
state.hidden = true;
assert.equal(
  module.ChatGptConversationBeaconBanner({ conversationId: "c" }),
  null,
);
state.hidden = false;
const rendered = module.ChatGptConversationBeaconBanner({
  conversationId: "c",
  allowConversationSharing: true,
});
assert.equal(rendered.type, "beacon-announcement");
assert.equal(rendered.props.accountId, "pca");
rendered.props.onDismiss();
assert.deepEqual(state.lifecycle, ["dismiss"]);
assertions += 6;
console.log(
  `misc-ui-utils business hubs: ${assertions} assertions passed; 1 rewrite, 5 audited preserve`,
);
