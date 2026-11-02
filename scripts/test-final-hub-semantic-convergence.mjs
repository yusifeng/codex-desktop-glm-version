import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import * as esbuild from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assertions += 1;
  assert.deepEqual(actual, expected);
};

async function load(entryPoint, mocks) {
  globalThis.__finalHubMocks = mocks;
  const result = await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [
      {
        name: "final-hub-mocks",
        setup(build) {
          build.onResolve({ filter: /.*/ }, ({ path: importPath, importer }) => {
            if (importer === "") return undefined;
            return { path: importPath, namespace: "mock" };
          });
          build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path }) => ({
            contents: mocks[path],
            loader: "js",
          }));
        },
      },
    ],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
}

const onceMock = `export const n=(factory)=>{let done=false;return()=>{if(!done){done=true;factory()}}};`;
const bannerMocks = { initialized: [] };
const banner = await load("src/renderer/app-primary/runtime/home-announcement-banner.ts", {
  "@rchunk/rolldown-runtime": onceMock,
  "@rchunk/app-shared": `
    const m=globalThis.__finalHubMocks;
    export const $3=()=>({c:(size)=>Array(size)});
    export const I3=()=>({jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})});
    export const Yh="Button";
    export const Zh=()=>m.initialized.push("button");
  `,
  "@rchunk/app-initial": `
    const m=globalThis.__finalHubMocks;
    export const fit="Badge";
    export const n7="AnnouncementSurface";
    export const pit=()=>m.initialized.push("badge");
    export const r7=()=>m.initialized.push("surface");
  `,
  "../../app-shared/ui/class-names": `
    const m=globalThis.__finalHubMocks;
    export const initializeClassNames=()=>m.initialized.push("classNames");
    export const classNames=(...values)=>values.filter(Boolean).join(" ");
  `,
  ...bannerMocks,
});
banner.initializeHomeAnnouncementBanner();
equal(globalThis.__finalHubMocks.initialized, ["classNames", "badge", "surface", "button"]);
const dismissAction = { ariaLabel: "dismiss", onClick() {} };
const presentation = banner.HomeAnnouncementBanner({
  title: "Title",
  description: "Description",
  badge: "New",
  leadingVisual: "Visual",
  primaryAction: { label: "Open", onClick() {} },
  dismissAction,
  variant: "beacon",
});
equal(presentation.type, "AnnouncementSurface");
equal(presentation.props.wrapCtas, true);
equal(presentation.props.trailingAction.props.action, dismissAction);
equal(presentation.props.customCtas.type, "div");

const migrationMocks = { mutable: null, writable: null, derived: [], initialized: [] };
const initializerExports = ["RIt", "Sun", "gVt", "mN", "pfn", "uHt", "vln"];
const signalExports = ["YVt", "_Vt", "_un", "fN", "mfn", "mun", "xIt"];
const migration = await load("src/renderer/app-primary/runtime/gpt-plugin-migration-state.ts", {
  "@rchunk/rolldown-runtime": onceMock,
  "@rchunk/app-shared": `
    const m=globalThis.__finalHubMocks;
    export const FX=()=>m.initialized.push("signals");
    export const QI=()=>m.initialized.push("shared");
    export const ZI={kind:"scope"};
    export const oZ=(scope,defaults,unused,options)=>(m.mutable={scope,defaults,options});
    export const iZ=(scope,getter,setter,options)=>(m.writable={scope,getter,setter,options});
    export const rZ=(scope,getter,options)=>{const value={scope,getter,options};m.derived.push(value);return value};
  `,
  "@rchunk/app-initial": `
    const m=globalThis.__finalHubMocks;
    ${initializerExports.map((name) => `export const ${name}=()=>m.initialized.push("${name}");`).join("\n")}
    ${signalExports.map((name) => `export const ${name}={name:"${name}"};`).join("\n")}
    export const bln=(value)=>value.startsWith("/c/")?{params:{conversationId:value.slice(3)}}:null;
    export const dHt=(value)=>value==="done";
    export const gln=(value)=>"normalized:"+value;
  `,
  "../../app-initial/runtime/is-terminal-conversation-status": `export const isTerminalConversationStatus=(value)=>value==="done";`,
  ...migrationMocks,
});
migration.initializeGptPluginMigrationState();
equal(globalThis.__finalHubMocks.mutable.options.autoDispose, true);
equal(
  globalThis.__finalHubMocks.mutable.options.key({
    gizmoId: "gpt",
    visitKey: "/c/thread",
    accountId: "account",
    userId: "user",
  }),
  JSON.stringify(["gpt", "normalized:thread", "account", "user"]),
);
equal(globalThis.__finalHubMocks.derived.length, 3);
equal(migration.migrationVisitEligible, globalThis.__finalHubMocks.derived[0]);
equal(migration.migrationNoticeDismissed, globalThis.__finalHubMocks.derived[2]);

const writes = [];
const scope = {
  get(token) {
    if (token.name === "mun") return "account";
    if (token.name === "_un") return "user";
  },
  set(family, key, update) {
    writes.push({ family, key, next: update({ continued: false, migrationNoticeDismissed: false }) });
  },
};
migration.markGptPluginMigrationContinued(scope, { gizmoId: "gpt", visitKey: "/c/thread" });
migration.dismissGptPluginMigrationNotice(scope, { gizmoId: "gpt", visitKey: "/c/thread" });
equal(writes[0].key, { gizmoId: "gpt", visitKey: "/c/thread", accountId: "account", userId: "user" });
equal(writes[0].next.continued, true);
equal(writes[1].next.migrationNoticeDismissed, true);

console.log(`final hub semantic convergence: ${assertions} assertions passed`);
