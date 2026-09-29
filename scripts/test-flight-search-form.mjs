import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/flight-search-form/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const expectedDependencies = [
  "app-initial",
  "app-primary",
  "app-shared",
  "date-picker-runtime",
  "platform-ui-kit-provider",
  "rolldown-runtime",
];
const sourceDependencies = [...source.matchAll(/from "@rchunk\/([^"]+)"/g)].map(match => match[1]);
assert.deepEqual([...new Set(sourceDependencies)].sort(), expectedDependencies);
assert.match(source, /export \{ FlightSearchForm \};/);
assert.doesNotMatch(source, /:\s*any\b|\bas\s+any\b|<any>/);

const state = (globalThis.__flightSearchFormTest = { stateWrites: [], jsx: {
  jsx: (type, props, key) => ({ type, props, key }),
  jsxs: (type, props, key) => ({ type, props, key }),
} });

const result = await esbuild.build({
  entryPoints: [sourcePath],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "mock-renderer-chunks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
        path: importPath.slice("@rchunk/".length),
        namespace: "mock-renderer-chunk",
      }));
      build.onLoad({ filter: /.*/, namespace: "mock-renderer-chunk" }, ({ path: moduleName }) => {
        if (moduleName === "app-shared") return { loader: "js", contents: [
          "const state=globalThis.__flightSearchFormTest;",
          "export const I3=()=>state.jsx;",
          "export const e6=()=>({useState(initializer){const value=typeof initializer===\"function\"?initializer():initializer;return [value,next=>state.stateWrites.push(typeof next===\"function\"?next(value):next)]}});",
          "export const n4=()=>({locale:\"en-US\",formatMessage(descriptor,values={}){return descriptor.defaultMessage.replace(/\\{([A-Za-z]+)\\}/g,(_match,key)=>String(values[key]??\"\"))}});",
        ].join("\n") };
        if (moduleName === "platform-ui-kit-provider") return { loader: "js", contents: "export const n=\"PlatformUIKitProvider\";" };
        return { loader: "js", contents: "export {};" };
      });
    },
  }],
});

const formModule = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));

function walk(node, predicate) {
  if (node == null || typeof node !== "object") return null;
  if (predicate(node)) return node;
  const children = node.props?.children;
  for (const child of Array.isArray(children) ? children : [children]) {
    const found = walk(child, predicate);
    if (found != null) return found;
  }
  return null;
}
function byTestId(node, testId) {
  return walk(node, candidate => candidate.props?.["data-testid"] === testId);
}

let assertions = 3;
const submitted = [];
const sessions = [];
let dismissals = 0;
const rendered = formModule.FlightSearchForm({
  draft: {
    trip_type: "round_trip",
    origin: " SFO ",
    destination: "NRT",
    departure_date: "2099-02-28",
    return_date: "2099-03-07",
    party_size: 2,
    cabin_class: "business",
    max_connections: 1,
  },
  onDismiss: () => dismissals++,
  onSessionChange: session => sessions.push(session),
  onSubmit: message => submitted.push(message),
});
assert.equal(rendered.type, "PlatformUIKitProvider"); assertions++;
const section = rendered.props.children;
assert.equal(section.props["data-testid"], "flight-search-form"); assertions++;
assert.equal(byTestId(section, "origin").props.value, "SFO"); assertions++;
assert.equal(byTestId(section, "search").props.disabled, false); assertions++;
const form = walk(section, node => node.type === "form");
form.props.onSubmit({ preventDefault() {} });
assert.match(submitted[0], /Business flights from SFO to NRT/); assertions++;
assert.match(submitted[0], /At most one connection/); assertions++;
byTestId(section, "origin").props.onChange({ currentTarget: { value: "Oakland" } });
assert.equal(sessions.at(-1).draft.origin, "Oakland"); assertions++;
walk(section, node => node.props?.["aria-label"] === "Close flight search").props.onClick();
assert.equal(dismissals, 1); assertions++;

const invalid = formModule.FlightSearchForm({
  draft: { origin: "SFO", destination: "SFO" },
  onDismiss() {},
  onSubmit: message => submitted.push(message),
});
assert.equal(byTestId(invalid.props.children, "search").props.disabled, true); assertions++;

const adjustedMessages = [];
const adjusted = formModule.FlightSearchForm({
  draft: {},
  initialSession: {
    draft: {
      trip_type: "one_way",
      origin: "",
      destination: "",
      departure_date: "",
      return_date: "",
      party_size: 1,
      cabin_class: "economy",
    },
    adjustment: "Leave next Friday",
    editor: null,
  },
  onDismiss() {},
  onSubmit: message => adjustedMessages.push(message),
});
const adjustedSection = adjusted.props.children;
assert.equal(byTestId(adjustedSection, "search").props.disabled, false); assertions++;
walk(adjustedSection, node => node.type === "form").props.onSubmit({ preventDefault() {} });
assert.match(adjustedMessages[0], /Leave next Friday/); assertions++;
assert.match(adjustedMessages[0], /Not specified/); assertions++;

console.log("flight-search-form: " + assertions + " assertions passed");
