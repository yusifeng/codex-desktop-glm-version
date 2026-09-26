import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__browserProfileImportQueryTest = {
  errors: [],
  initializers: [],
  queries: [],
  jsx: {
    jsx: (type, props) => ({ type, props }),
    jsxs: (type, props) => ({ type, props }),
  },
});

const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/browser-profile-import-query/index.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  define: { "import.meta.url": JSON.stringify("file:///renderer/query.js") },
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "mock-renderer-chunks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice("@rchunk/".length),
          namespace: "mock-renderer-chunk",
        }));
        build.onLoad(
          { filter: /.*/, namespace: "mock-renderer-chunk" },
          ({ path: importPath }) => ({
            contents:
              {
                "app-shared": `
                  export const I3 = () => globalThis.__browserProfileImportQueryTest.jsx;
                  export const $3 = () => globalThis.__browserProfileImportQueryTest.initializers.push("compiler");
                  export const lw = () => globalThis.__browserProfileImportQueryTest.initializers.push("icons");
                  export const K2 = () => globalThis.__browserProfileImportQueryTest.initializers.push("intl");
                  export const Z3 = () => globalThis.__browserProfileImportQueryTest.initializers.push("query");
                  export const G2 = definitions => definitions;
                  export const AS = "ExtensionsIcon";
                  export const pL = options => { globalThis.__browserProfileImportQueryTest.queries.push(options); return options; };
                  export const Q3 = { error: (message, details) => globalThis.__browserProfileImportQueryTest.errors.push({ message, details }) };
                `,
                "browser-profile-import-cookies-icon": `
                  export const n = () => globalThis.__browserProfileImportQueryTest.initializers.push("cookies");
                  export const t = "CookiesIcon";
                `,
                "browser-profile-import-history-icon": `
                  export const n = () => globalThis.__browserProfileImportQueryTest.initializers.push("history");
                  export const t = "HistoryIcon";
                `,
                "google-chrome": `
                  export const n = () => globalThis.__browserProfileImportQueryTest.initializers.push("chrome");
                  export const t = "ChromeIcon";
                `,
              }[importPath] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const query = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

query.d();
query.d();
check(
  state.initializers.slice(0, 4).join(",") === "compiler,icons,cookies,history",
  "initializes import data icon dependencies once",
);
check(
  query.u({ kind: "cookies", className: "item" }).type === "CookiesIcon",
  "renders cookies",
);
check(query.u({ kind: "history" }).type === "HistoryIcon", "renders history");
check(
  typeof query.u({ kind: "passwords" }).type === "function",
  "renders the local password icon",
);
check(
  query.u({ kind: "extensions" }).props.children.type === "ExtensionsIcon",
  "renders extensions",
);

query.l();
query.l();
check(
  query.c.title.defaultMessage === "Import from your browser",
  "defines the dialog title",
);
check(
  query.c.passwords.defaultMessage === "Saved passwords",
  "defines the password label",
);

query.s();
query.s();
check(
  state.initializers.filter((name) => name === "chrome").length === 1,
  "initializes Chrome once",
);
check(
  query.a({ source: "chrome" }).type === "ChromeIcon",
  "renders the Chrome source icon",
);
check(
  query.a({ source: "atlas" }).props.src.endsWith("atlas-app-5b67bfaeebb3.png"),
  "renders the Atlas source asset",
);
check(
  query.o({ sources: ["atlas"] }).props.className.includes("rounded"),
  "renders one profile source directly",
);
check(
  query.o({ sources: ["atlas", "chrome"] }).props.children.length === 2,
  "stacks icons for a mixed-source profile",
);
check(
  query
    .r([{ source: "chrome" }, { source: "atlas" }, { source: "chrome" }])
    .join(",") === "chrome,atlas",
  "deduplicates sources without changing their order",
);

query.i();
query.i();
check(
  state.initializers.filter((name) => name === "query").length === 1,
  "initializes queries once",
);
const service = {
  listImportableBrowserProfiles: async () => ["profile-1"],
  getImportSignals: async () => ({ hasCookies: true }),
};
const profiles = query.t(service, true);
check(
  profiles.enabled &&
    profiles.queryKey[0] === "browser-profile-import-profiles",
  "defines the importable profiles query",
);
check(
  profiles.staleTime === 30_000 && profiles.retry === false,
  "sets stable query policy",
);
check(
  (await profiles.queryFn())[0] === "profile-1",
  "lists profiles through the service",
);

const signals = query.n(service, false);
check(
  !signals.enabled && signals.queryKey[0] === "browser-profile-import-signals",
  "defines the disabled import signals query",
);
check(
  (await signals.queryFn()).hasCookies,
  "loads import signals through the service",
);

const unavailable = query.t(null, true);
await assert.rejects(unavailable.queryFn(), /unavailable/);
assertions += 1;
const failure = new Error("profile failure");
const failing = query.t(
  { listImportableBrowserProfiles: async () => Promise.reject(failure) },
  true,
);
await assert.rejects(failing.queryFn(), /profile failure/);
assertions += 1;
check(
  state.errors.length === 1,
  "logs profile listing failures before rethrowing",
);

console.log(`${assertions} browser profile import query assertions passed`);
