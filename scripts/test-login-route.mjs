import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/login-route/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const state = {
  analytics: [],
  apiCalls: [],
  browserProfile: null,
  browserUrl: "https://auth.openai.test/authorize",
  completion: Promise.resolve({
    success: true,
    onboardingEntrypoint: "desktop",
  }),
  copied: [],
  eligibility: { eligible: false },
  errors: [],
  externalLinks: [],
  initialized: 0,
  loginMethods: { status: "ready", api: true, chatgpt: true },
  navigations: [],
  params: new URLSearchParams(),
  probeCancellations: [],
  successes: [],
};
const node = (type, props = {}) => ({ type, props });
let hooks = [];
let hookIndex = 0;
let effects = [];
const same = (left, right) =>
  left != null &&
  right != null &&
  left.length === right.length &&
  left.every((value, index) => Object.is(value, right[index]));
const React = {
  __clear() {
    for (const hook of hooks) hook?.cleanup?.();
    hooks = [];
    hookIndex = 0;
    effects = [];
  },
  __render(component) {
    hookIndex = 0;
    effects = [];
    const view = component();
    const pending = effects;
    effects = [];
    for (const effect of pending) effect();
    return view;
  },
  useEffect(effect, dependencies) {
    const index = hookIndex++;
    const previous = hooks[index];
    if (previous == null || !same(previous.dependencies, dependencies))
      effects.push(() => {
        previous?.cleanup?.();
        hooks[index] = { dependencies, cleanup: effect() };
      });
  },
  useRef(initialValue) {
    const index = hookIndex++;
    if (hooks[index] == null) hooks[index] = { current: initialValue };
    return hooks[index];
  },
  useState(initialValue) {
    const index = hookIndex++;
    if (hooks[index] == null)
      hooks[index] =
        typeof initialValue === "function" ? initialValue() : initialValue;
    return [
      hooks[index],
      (next) => {
        hooks[index] = typeof next === "function" ? next(hooks[index]) : next;
      },
    ];
  },
};
const jsx = {
  Fragment: Symbol("fragment"),
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
const scope = {
  get(signal) {
    return signal;
  },
};
globalThis.crypto ??= { randomUUID: () => "probe-1" };
globalThis.__loginRoute = { React, jsx, node, scope, state };
const initializer = "()=>{globalThis.__loginRoute.state.initialized+=1}";
const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const r=globalThis.__loginRoute;",
    `export const $3=${initializer};`,
    "export const BX=()=>r.state.loginMethods;",
    `export const FX=${initializer};`,
    "export const I3=()=>r.jsx;",
    "export const LX=()=>r.scope;",
    `export const QI=${initializer};`,
    "export const Qh=props=>r.node('spinner',props);",
    "export const Y2=props=>r.node('message',props);",
    "export const Yh=props=>r.node('button',props);",
    "export const Ym=value=>r.state.copied.push(value);",
    "export const ZI={};",
    `export const Zh=${initializer};`,
    "export const e6=()=>r.React;",
    `export const fI=${initializer};`,
    "export const n4=()=>({formatMessage:(descriptor,values)=>descriptor.defaultMessage.replace('{rawMessage}',values?.rawMessage??'')});",
    "export const pk={danger:message=>r.state.errors.push(message),success:message=>r.state.successes.push(message)};",
    `export const wL=${initializer};`,
  ].join("\n"),
  "app-initial": [
    "const r=globalThis.__loginRoute;",
    `export const M6t=${initializer};`,
    `export const Qgn=${initializer};`,
    "export class Sdn extends Error {constructor(message,status=500,errorCode){super(message);this.status=status;this.errorCode=errorCode}}",
    "export const Ugn=()=>({loginWithApiKey:async key=>r.state.apiCalls.push(key)});",
    "export const d_n=()=>[r.state.params,()=>{}];",
    "export const kft=options=>r.state.externalLinks.push(options);",
    "export const o_n=()=>((destination,options)=>r.state.navigations.push([destination,options]));",
    "export const pnt={appInfo:{get:async()=>({chatGptDesktopAuthOrigin:'https://chatgpt.com'})},chatGptBrowserSession:{cancelProbe:id=>r.state.probeCancellations.push(id),getLookupEligibility:async()=>r.state.eligibility,probe:async()=>r.state.browserProfile}};",
    "export const ugn='host';",
    "export const xpn=(_scope,event,fields)=>r.state.analytics.push([event,fields]);",
    `export const ypn=${initializer};`,
  ].join("\n"),
  "app-primary": "export {};",
  "google-logo": `export const n=${initializer}; export const t=props=>globalThis.__loginRoute.node('google-logo',props);`,
  "page-layout": `export const n=${initializer}; export const t=props=>globalThis.__loginRoute.node('page-layout',props);`,
  "browser-session-queries": "export {};",
  "chatgpt-desktop-auth-url": [
    "const runtime=globalThis.__loginRoute;",
    "export const a=async()=>({authUrl:runtime.state.browserUrl,completion:runtime.state.completion});",
    `export const i=${initializer};`,
    "export const n=()=> '1.0.0';",
    `export const r=${initializer};`,
    "export const t=options=>{const url=new URL(options.authUrl);if(options.loginHint)url.searchParams.set('login_hint',options.loginHint);return url.toString()};",
  ].join("\n"),
  "browser-login-handoff-page-core": "export {};",
  "ascii-engine": "export {};",
  "onboarding-entrypoint": `export const t=${initializer};`,
  "onboarding-login-content": [
    `export const a=${initializer};`,
    `export const i=${initializer};`,
    `export const n=${initializer};`,
    "export const o={};",
    "export const r=props=>globalThis.__loginRoute.node('unavailable',props);",
    "export const t=props=>globalThis.__loginRoute.node('login-content',props);",
  ].join("\n"),
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
      name: "login-route-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice(8),
          namespace: "mock",
        }));
        build.onLoad(
          { filter: /.*/, namespace: "mock" },
          ({ path: moduleName }) => ({
            contents: mocks[moduleName] ?? "export {};",
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
let assertions = 0;
const check = (value, expected) => {
  assertions += 1;
  assert.deepEqual(value, expected);
};
check(Object.keys(module), ["LoginRoute"]);
check(
  [...source.matchAll(/from \"@rchunk\/([^\"]+)\"/g)].map((match) => match[1]),
  [
    "app-shared",
    "app-initial",
    "google-logo",
    "page-layout",
    "chatgpt-desktop-auth-url",
    "onboarding-entrypoint",
    "onboarding-login-content",
  ],
);
for (const edge of [
  "rolldown-runtime",
  "app-primary",
  "browser-session-queries",
  "browser-login-handoff-page-core",
  "ascii-engine",
]) {
  assertions += 1;
  assert.equal(source.includes(`import \"@rchunk/${edge}\"`), true);
}
assertions += 1;
assert.equal(/\bany\b/.test(source), false);
assertions += 1;
assert.equal(/\b\w+Chunk\s*\./.test(source), false);
check(state.initialized, 17);

function reset() {
  React.__clear();
  state.analytics.length = 0;
  state.apiCalls.length = 0;
  state.browserProfile = null;
  state.browserUrl = "https://auth.openai.test/authorize";
  state.completion = Promise.resolve({
    success: true,
    onboardingEntrypoint: "desktop",
  });
  state.copied.length = 0;
  state.eligibility = { eligible: false };
  state.errors.length = 0;
  state.externalLinks.length = 0;
  state.loginMethods = { status: "ready", api: true, chatgpt: true };
  state.navigations.length = 0;
  state.params = new URLSearchParams();
  state.probeCancellations.length = 0;
  state.successes.length = 0;
}
const render = () => React.__render(module.LoginRoute);
const children = (value) =>
  Array.isArray(value) ? value : value == null ? [] : [value];
function find(root, predicate) {
  if (root == null || typeof root !== "object") return null;
  if (predicate(root)) return root;
  for (const child of children(root.props?.children)) {
    const result = find(child, predicate);
    if (result) return result;
  }
  return null;
}
function buttonByText(root, text) {
  return find(
    root,
    (item) =>
      item.type === "button" &&
      JSON.stringify(item.props.children).includes(text),
  );
}

reset();
state.loginMethods = { status: "loading" };
let view = render();
check(view.type, "page-layout");
check(view.props.children.type, "unavailable");

reset();
view = render();
check(view.type, "page-layout");
check(buttonByText(view, "Continue to sign in") != null, true);
check(buttonByText(view, "Continue with Google") != null, true);
check(buttonByText(view, "Continue with Microsoft") != null, true);
check(buttonByText(view, "Sign up") != null, true);

reset();
state.eligibility = { eligible: true };
state.browserProfile = {
  email: "avery@example.com",
  name: "Avery Morgan",
  avatarUrl: null,
};
view = render();
await Promise.resolve();
await Promise.resolve();
await Promise.resolve();
view = render();
check(buttonByText(view, "Avery Morgan") != null, true);
check(buttonByText(view, "Use another account") != null, true);
await buttonByText(view, "Avery Morgan").props.onClick();
await Promise.resolve();
check(state.externalLinks.length, 1);
check(
  new URL(state.externalLinks[0].href).searchParams.get("login_hint"),
  "avery@example.com",
);
await Promise.resolve();
await Promise.resolve();
check(state.navigations.at(-1), ["/welcome", { replace: true }]);
check(
  state.analytics.map(([event]) => event),
  ["desktop_login_started", "desktop_login_succeeded"],
);

reset();
state.completion = new Promise(() => {});
view = render();
buttonByText(view, "Continue with Google").props.onClick();
await Promise.resolve();
view = render();
check(view.props.children.props.children.props.children[1].type, "p");
check(state.externalLinks.length, 1);
check(
  new URL(state.externalLinks[0].href).searchParams.get("connection"),
  "google-oauth2",
);
const copyButton = buttonByText(view, "Copy sign-in link");
check(copyButton != null, true);
copyButton.props.onClick();
check(state.copied.length, 1);
check(state.successes.length, 1);
buttonByText(view, "Cancel sign-in").props.onClick();
view = render();
check(buttonByText(view, "Continue to sign in") != null, true);

reset();
state.params = new URLSearchParams("workspaceRecovery=true");
view = render();
await buttonByText(view, "Continue to sign in").props.onClick();
await Promise.resolve();
await Promise.resolve();
check(state.navigations.at(-1), ["/", { replace: true }]);

reset();
state.completion = Promise.resolve({
  success: false,
  error: new Error("fetch failed"),
});
view = render();
await buttonByText(view, "Continue to sign in").props.onClick();
await Promise.resolve();
await Promise.resolve();
check(state.errors.length, 1);
check(state.analytics.at(-1)[1].errorKind, "network");

reset();
view = render();
buttonByText(view, "Sign in another way").props.onClick();
view = render();
const loginContent = find(view, (item) => item.type === "login-content");
check(loginContent != null, true);
loginContent.props.onApiKeyValueChange("  sk-test  ");
view = render();
const updatedLoginContent = find(view, (item) => item.type === "login-content");
await updatedLoginContent.props.onApiKeySubmit();
await Promise.resolve();
await Promise.resolve();
check(state.apiCalls, ["sk-test"]);
check(state.navigations.at(-1), ["/welcome", { replace: true }]);

reset();
view = render();
const snakeButton = find(
  view,
  (item) => item.type === "button" && item.props["aria-label"] === "Play Snake",
);
check(snakeButton != null, true);
snakeButton.props.onClick();
view = render();
check(
  find(view, (item) => item.props?.["aria-label"] === "Snake game") != null,
  true,
);
buttonByText(view, "Exit game").props.onClick();
await Promise.resolve();
await Promise.resolve();
view = render();
check(buttonByText(view, "Continue to sign in") != null, true);

console.log(`login-route assertions: ${assertions}`);
