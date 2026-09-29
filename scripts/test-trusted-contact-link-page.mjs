import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(
  ROOT,
  "src/renderer/trusted-contact-link-page/index.ts",
);
const source = fs.readFileSync(sourcePath, "utf8");
const state = {
  initialized: 0,
  location: {
    pathname: "/trusted-contact/nominee",
    search: "?token=token-1&entry_point=email",
    hash: "",
    state: null,
  },
  mutationData: undefined,
  mutationPending: false,
  navigated: [],
  posts: [],
  query: { data: undefined, isPending: true },
};
const React = { Fragment: "Fragment" };
const jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) {
    return typeof type === "function"
      ? type(props ?? {})
      : { type, props: props ?? {}, key };
  },
  jsxs(type, props, key) {
    return typeof type === "function"
      ? type(props ?? {})
      : { type, props: props ?? {}, key };
  },
};
globalThis.__trustedContactLinkPage = { React, jsx, state };
const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const r=globalThis.__trustedContactLinkPage;const s=r.state;",
    "export const $3=()=>{s.initialized+=1};export const gL=()=>{s.initialized+=1};export const rL=()=>{s.initialized+=1};",
    "export const I3=()=>r.jsx;export const e6=()=>r.React;export const Qh=props=>({type:'spinner',props});export const Yh=props=>({type:'button',props});",
    "export const _L=()=>s.query;export const iL=options=>({data:s.mutationData,isPending:s.mutationPending,mutate:()=>{s.mutationPending=true;Promise.resolve(options.mutationFn()).then(data=>{s.mutationData=data;s.mutationPending=false})}});",
  ].join("\n"),
  "app-initial": [
    "const s=globalThis.__trustedContactLinkPage.state;export const cJt=()=>{s.initialized+=1};",
    "export const i_n=()=>s.location;export const o_n=()=>((destination,options)=>s.navigated.push({destination,options}));",
    "export const rJt={safeGet:async()=>({name:'Morgan',account_id:'morgan@example.com',deadline_timestamp:1893456000}),safePost:async(path,options)=>{s.posts.push({path,options});return path.endsWith('/removal')?{user_name:'Morgan'}:{};}};",
  ].join("\n"),
  "trusted-contact-hero":
    "const s=globalThis.__trustedContactLinkPage.state;export const n=()=>{s.initialized+=1};export const t=props=>({type:'trusted-contact-hero',props});",
};
const result = await esbuild.build({
  entryPoints: [sourcePath],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "trusted-contact-link-page-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice(8),
          namespace: "mock",
        }));
        build.onLoad(
          { filter: /.*/, namespace: "mock" },
          ({ path: module }) => ({
            contents: mocks[module] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const module = await import(
  "data:text/javascript;base64," +
    Buffer.from(result.outputFiles[0].text).toString("base64")
);
function walk(value, output = []) {
  if (value == null || typeof value !== "object") return output;
  if (Array.isArray(value)) {
    for (const item of value) walk(item, output);
    return output;
  }
  output.push(value);
  walk(value.props?.children, output);
  return output;
}
function text(value) {
  if (value == null || typeof value === "boolean") return "";
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  if (Array.isArray(value)) return value.map(text).join(" ");
  return text(value.props?.children);
}
function button(view, label) {
  return walk(view).find(
    (node) => node.type === "button" && text(node) === label,
  );
}
function form(view) {
  return walk(view).find((node) => node.type === "form");
}
async function flush() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}
function reset(overrides = {}) {
  state.location = {
    pathname: "/trusted-contact/nominee",
    search: "?token=token-1&entry_point=email",
    hash: "",
    state: null,
  };
  state.mutationData = undefined;
  state.mutationPending = false;
  state.navigated.length = 0;
  state.posts.length = 0;
  state.query = { data: undefined, isPending: true };
  Object.assign(state, overrides);
}

assert.deepEqual(Object.keys(module), ["TrustedContactLinkPage"]);
assert.equal(state.initialized, 5);
assert.deepEqual(
  [...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^"]+)"/g)].map(
    (match) => match[1],
  ),
  ["rolldown-runtime", "app-shared", "app-initial", "trusted-contact-hero"],
);
assert.equal(
  /\b(?:appSharedChunk|appInitialChunk|trustedContactHeroChunk|runtimeChunk)\s*\./.test(
    source,
  ),
  false,
);
assert.equal(/\bany\b/.test(source), false);

let view = module.TrustedContactLinkPage({ mode: "nominee" });
assert.equal(text(view).includes("Loading invitation"), true);
assert.equal(
  walk(view).some((node) => node.type === "spinner"),
  true,
);
assert.equal(button(view, "Accept"), undefined);

reset({
  query: {
    data: {
      status: "ready",
      name: "Morgan",
      account_id: "morgan@example.com",
      deadline_timestamp: 1893456000,
    },
    isPending: false,
  },
});
view = module.TrustedContactLinkPage({ mode: "nominee" });
assert.equal(
  text(view).includes("Morgan wants to add you as a trusted contact"),
  true,
);
assert.equal(text(view).includes("morgan@example.com"), true);
assert.equal(text(view).includes("Choose whether to participate by"), true);
assert.equal(
  walk(view).some((node) => node.type === "trusted-contact-hero"),
  true,
);
assert.equal(text(view).includes("What to expect"), true);
assert.equal(text(view).includes("You must be 18 or older"), true);
assert.equal(
  walk(view).some(
    (node) => node.type === "a" && node.props.href.includes("20001105"),
  ),
  true,
);
button(view, "Decline").props.onClick();
assert.equal(
  state.navigated.at(-1).destination,
  "/trusted-contact/decline?token=token-1&entry_point=email",
);
form(view).props.onSubmit({ preventDefault() {} });
await flush();
assert.equal(state.posts.at(-1).path, "/trusted_contact/accept");
assert.deepEqual(state.posts.at(-1).options.requestBody, {
  token: "token-1",
  trusted_contact_id: "token-1",
});
view = module.TrustedContactLinkPage({ mode: "nominee" });
assert.equal(text(view).includes("Thanks for confirming"), true);
assert.equal(
  text(view).includes("You've been added as a trusted contact for Morgan"),
  true,
);
form(view).props.onSubmit({ preventDefault() {} });
assert.deepEqual(state.navigated.at(-1), {
  destination: "/",
  options: { replace: true },
});

reset({
  query: { data: { status: "ready", name: "Taylor" }, isPending: false },
});
view = module.TrustedContactLinkPage({ mode: "decline" });
assert.equal(text(view).includes("Are you sure you want to decline?"), true);
assert.equal(text(view).includes("Taylor won't be able to invite you"), true);
button(view, "Go back").props.onClick();
assert.equal(
  state.navigated.at(-1).destination,
  "/trusted-contact/nominee?token=token-1&entry_point=email",
);
form(view).props.onSubmit({ preventDefault() {} });
await flush();
assert.equal(state.posts.at(-1).path, "/trusted_contact/removal");
view = module.TrustedContactLinkPage({ mode: "decline" });
assert.equal(text(view).includes("You've declined"), true);

reset({
  query: { data: { status: "removed", name: "Jordan" }, isPending: false },
});
view = module.TrustedContactLinkPage({ mode: "remove" });
assert.equal(
  text(view).includes("You've been removed as a trusted contact"),
  true,
);
assert.equal(text(view).includes("We'll let Jordan know."), true);

reset({
  location: {
    pathname: "/trusted-contact/nominee",
    search: "",
    hash: "",
    state: null,
  },
  query: { data: undefined, isPending: false },
});
view = module.TrustedContactLinkPage({ mode: "nominee" });
assert.equal(text(view).includes("This link is invalid or has expired."), true);
assert.equal(
  walk(view).some((node) => node.props?.role === "alert"),
  true,
);

reset({
  query: { data: { status: "error", invalidLink: true }, isPending: false },
});
view = module.TrustedContactLinkPage({ mode: "remove" });
assert.equal(
  text(view).includes("This removal link is invalid or has expired."),
  true,
);

reset({
  query: { data: { status: "error", invalidLink: false }, isPending: false },
});
view = module.TrustedContactLinkPage({ mode: "nominee" });
assert.equal(text(view).includes("Please try again."), true);

reset({ query: { data: { status: "ready", name: null }, isPending: false } });
view = module.TrustedContactLinkPage({ mode: "nominee", country: "KR" });
assert.equal(text(view).includes("must be 19 or older"), true);
assert.equal(text(view).includes("Someone wants to add you"), true);

const assertionCount = [
  ...fs
    .readFileSync(fileURLToPath(import.meta.url), "utf8")
    .matchAll(/\bassert\./g),
].length;
console.log(assertionCount + " trusted contact link page assertions passed");
