import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__entryBridgeTest = {
  initializations: [],
  layoutCleanup: null,
  jsx: {
    Fragment: Symbol("Fragment"),
    jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
    jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
  },
};

const appSharedMock = `
  const s=globalThis.__entryBridgeTest;
  function ReactRuntime(){return ReactRuntime}
  ReactRuntime.createContext=(value)=>({current:value});
  ReactRuntime.useContext=(context)=>context.current;
  ReactRuntime.useLayoutEffect=(effect)=>{s.layoutCleanup=effect()??null};
  export const e6=ReactRuntime;
  export const I3=()=>s.jsx;
  export const RR={bash:"Bash",zsh:"Z shell",pwsh:"PowerShell","pwsh.exe":"PowerShell","powershell.exe":"PowerShell"};
  export const wL=()=>s.initializations.push("shell-labels");
  const schema=(parse)=>({
    safeParse(value){try{return{success:true,data:parse(value)}}catch{return{success:false}}},
    optional(){return schema(value=>value===undefined?undefined:parse(value))},
    min(length){return schema(value=>{const parsed=parse(value);if(parsed.length<length)throw Error();return parsed})},
    refine(predicate){return schema(value=>{const parsed=parse(value);if(!predicate(parsed))throw Error();return parsed})},
  });
  export const q4=()=>schema(value=>{if(typeof value!=="string")throw Error();return value});
  export const k4=()=>schema(value=>{if(typeof value!=="boolean")throw Error();return value});
  export const R4=expected=>schema(value=>{if(value!==expected)throw Error();return value});
  export const E4=item=>schema(value=>{if(!Array.isArray(value))throw Error();return value.map(entry=>{const parsed=item.safeParse(entry);if(!parsed.success)throw Error();return parsed.data})});
  export const H4=shape=>schema(value=>{if(value==null||typeof value!=="object"||Array.isArray(value))throw Error();const output={};for(const [key,item] of Object.entries(shape)){const parsed=item.safeParse(value[key]);if(!parsed.success)throw Error();if(parsed.data!==undefined)output[key]=parsed.data}return output});
  export const M4=(key,items)=>schema(value=>{for(const item of items){const parsed=item.safeParse(value);if(parsed.success)return parsed.data}throw Error()});
  export const g4=()=>s.initializations.push("validation");
`;
const appInitialMock = `
  const s=globalThis.__entryBridgeTest;
  export const $i=(value)=>"open:"+value;
  export const Qi=()=>s.initializations.push("external-flow");
  export const Ji=()=>s.initializations.push("external-command");
  export const Yi=(scope,source)=>Promise.resolve({scope,source});
  export const fH=(value)=>Promise.resolve("voice:"+value);
  export const uH=()=>s.initializations.push("voice-entry");
  export const $3t=()=>"CODEX_SKU";
  export const s6t=()=>s.initializations.push("plugin-settings");
`;

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
        name: "entry-bridge-mocks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: value }) => ({
            path: value.slice(8),
            namespace: "mock",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock" },
            ({ path: value }) => {
              if (value === "app-shared")
                return { contents: appSharedMock, loader: "js" };
              if (value === "app-initial")
                return { contents: appInitialMock, loader: "js" };
              if (value === "katex-runtime")
                return {
                  contents: `export const c=()=>globalThis.__entryBridgeTest.initializations.push("katex"); export const l={renderToString:(source)=>"<math>"+source+"</math>"};`,
                  loader: "js",
                };
              return { contents: "export {};", loader: "js" };
            },
          );
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`
  );
}

const cme = await bundle("chatgpt-cme");
cme.r();
assert.equal(
  cme.n.$type,
  "protobuf_analytics_events.v1.ChatgptCmeHomeEntryClicked",
);
assert.equal(
  cme.t.$type,
  "protobuf_analytics_events.v1.ChatgptCmeClaimSubmitted",
);
assert.deepEqual(Object.keys(cme).sort(), ["n", "r", "t"]);

const externalFlow = await bundle("external-agent-config-import-flow");
assert.equal(externalFlow.openExternalAgentImport("codex"), "open:codex");
assert.equal(
  globalThis.__entryBridgeTest.initializations.includes("external-flow"),
  true,
);

const katex = await bundle("katex-renderer");
assert.equal(katex.default.renderToString("x^2"), "<math>x^2</math>");
assert.equal(
  globalThis.__entryBridgeTest.initializations.includes("katex"),
  true,
);

const externalCommand = await bundle("run-external-agent-import-command");
assert.deepEqual(
  await externalCommand.runExternalAgentImportCommand("scope", "home_beacon"),
  { scope: "scope", source: "home_beacon" },
);
assert.equal(
  globalThis.__entryBridgeTest.initializations.includes("external-command"),
  true,
);

const voice = await bundle("voice-personalization-dialog-entry");
assert.equal(
  await voice.loadVoicePersonalizationDialog("settings"),
  "voice:settings",
);
assert.equal(
  globalThis.__entryBridgeTest.initializations.includes("voice-entry"),
  true,
);

const originalDocument = globalThis.document;
const originalMutationObserver = globalThis.MutationObserver;
const originalFetch = globalThis.fetch;
const fetched = [];
const preloadLink = {
  rel: "modulepreload",
  href: "https://example.com/module.js",
  integrity: "sha256-demo",
  referrerPolicy: "no-referrer",
  crossOrigin: "anonymous",
};
globalThis.document = {
  createElement: () => ({ relList: { supports: () => false } }),
  querySelectorAll: () => [preloadLink],
};
globalThis.MutationObserver = class {
  observe() {}
};
globalThis.fetch = (url, options) => {
  fetched.push({ url, options });
  return Promise.resolve({});
};
const modulePreload = await bundle("modulepreload-polyfill");
modulePreload.t();
assert.equal(fetched.length, 1);
assert.equal(fetched[0].url, "https://example.com/module.js");
assert.equal(fetched[0].options.credentials, "omit");
assert.equal(preloadLink.ep, true);
globalThis.document = originalDocument;
globalThis.MutationObserver = originalMutationObserver;
globalThis.fetch = originalFetch;

const pluginUrls = await bundle("plugin-settings-url");
pluginUrls.i();
pluginUrls.t();
const pluginPage = new URL(pluginUrls.r("plugin/id", 1));
assert.equal(pluginPage.pathname, "/plugins/plugin%2Fid");
assert.equal(pluginPage.searchParams.get("no_universal_links"), "1");
assert.equal(
  pluginPage.hash,
  "#settings/Plugins/plugin%2Fid?product-sku=CODEX",
);
const connectorInstall = new URL(pluginUrls.n({ appId: "gmail" }));
assert.equal(connectorInstall.pathname, "/plugins");
assert.equal(connectorInstall.hash.includes("connector=gmail"), true);
assert.equal(connectorInstall.hash.includes("product-sku=CODEX_SKU"), true);
const remoteInstall = pluginUrls.n({
  appId: "unused",
  remotePluginId: "remote/id",
  installUrl: "https://custom.example/base",
});
assert.equal(remoteInstall.includes("settings/Plugins/remote%2Fid"), true);

const shells = await bundle("shell-label");
shells.n();
assert.equal(shells.t("bash -lc pwd"), "Bash");
assert.equal(shells.t("/bin/zsh"), "Z shell");
assert.equal(
  shells.t('"C:\\Program Files\\PowerShell\\pwsh.exe" -NoLogo'),
  "PowerShell",
);
assert.equal(shells.t("unknown-shell"), null);
assert.equal(shells.t("   "), null);
assert.equal(shells.t('"/bin/bash"'), "Bash");
assert.equal(
  globalThis.__entryBridgeTest.initializations.includes("shell-labels"),
  true,
);
assert.equal(shells.t("powershell.exe"), "PowerShell");

const hotkey = await bundle("use-hotkey-window-detail-layout");
hotkey.n();
const layoutValues = [];
hotkey.t.current = (value) => layoutValues.push(value);
const layout = { title: "Details" };
hotkey.r(layout);
assert.deepEqual(layoutValues, [layout]);
assert.equal(typeof globalThis.__entryBridgeTest.layoutCleanup, "function");
globalThis.__entryBridgeTest.layoutCleanup();
assert.deepEqual(layoutValues, [layout, null]);
assert.equal(hotkey.t.current instanceof Function, true);

const webMcp = await bundle("webmcp-tool-calls");
webMcp.n();
const validCalls = [
  { kind: "listTools", name: "webmcp_list_tools", title: "Tools" },
  {
    kind: "invokeTool",
    name: "search",
    readOnlyHint: true,
    outputTruncated: true,
  },
];
assert.deepEqual(
  webMcp.t({
    "codex/toolSurface": { kind: "browserUse", webMcpCalls: validCalls },
  }),
  validCalls,
);
assert.deepEqual(webMcp.t(null), []);
assert.deepEqual(
  webMcp.t({ "codex/toolSurface": { kind: "other", webMcpCalls: validCalls } }),
  [],
);
assert.deepEqual(
  webMcp.t({
    "codex/toolSurface": {
      kind: "browserUse",
      webMcpCalls: [{ kind: "invokeTool", name: " " }],
    },
  }),
  [],
);
assert.deepEqual(
  webMcp.t({
    "codex/toolSurface": {
      kind: "browserUse",
      webMcpCalls: [{ kind: "listTools", name: "wrong" }],
    },
  }),
  [],
);
assert.deepEqual(
  webMcp.t({
    "codex/toolSurface": {
      kind: "browserUse",
      webMcpCalls: [{ kind: "invokeTool", name: "ok", outputTruncated: false }],
    },
  }),
  [],
);

const dock = await bundle("dock");
dock.n();
const dockIcon = dock.t({ className: "dock" });
assert.equal(dockIcon.type, "svg");
assert.equal(dockIcon.props.width, 21);
assert.equal(dockIcon.props.className, "dock");
assert.equal(dockIcon.props.children.length, 2);

console.log("44 entry bridges and UI helpers cluster assertions passed");
