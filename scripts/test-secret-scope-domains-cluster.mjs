import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
  jsx = {
    Fragment: Symbol("Fragment"),
    jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
    jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
  };
globalThis.__jsx = jsx;
async function load(name) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, `src/renderer/${name}/index.ts`)],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [
      {
        name: "mocks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({
            path: modulePath.slice(8),
            namespace: "mock",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock" },
            ({ path: modulePath }) => pathModule(modulePath),
          );
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${name}`
  );
}
function pathModule(name) {
  return name === "app-shared"
    ? { loader: "js", contents: "export const I3=()=>globalThis.__jsx;" }
    : { loader: "js", contents: "export default {};" };
}

const validation = await load("validation-message");
validation.r();
assert.equal(
  validation.n({ error: "missing-key" }).props.children,
  "Enter a key",
);
assert.match(
  validation.n({ error: "invalid-key" }).props.children,
  /letter or underscore/,
);
assert.match(
  validation.n({ error: "reserved-key" }).props.children,
  /reserved/,
);
assert.match(
  validation.n({ error: "duplicate" }).props.children,
  /already used/,
);
assert.match(
  validation.n({ error: "missing-value" }).props.children,
  /Enter a value/,
);
assert.match(
  validation.n({ error: "invalid-value" }).props.children,
  /null characters/,
);
assert.match(validation.t({ name: "BAD" }).props.children, /“BAD”/);

const scope = await load("secret-scope");
scope.c();
let environmentValue = null;
const environmentInput = scope.s({
  id: "env",
  value: "line one\nline two",
  ariaLabel: "Environment value",
  hasSavedValue: true,
  onChange: (value) => {
    environmentValue = value;
  },
});
assert.equal(environmentInput.type, "textarea");
assert.equal(environmentInput.props.rows, 3);
assert.equal(
  environmentInput.props.placeholder,
  "Leave blank to keep saved value",
);
environmentInput.props.onChange({ currentTarget: { value: "updated" } });
assert.equal(environmentValue, "updated");
const optionalInput = scope.s({
  id: "optional",
  value: "",
  ariaLabel: "Optional",
  optional: true,
  onChange() {},
});
assert.equal(optionalInput.props.placeholder, "Your value (optional)");
let secretValue = null;
const reveal = scope.a({
  id: "secret",
  value: "hidden",
  ariaLabel: "Secret",
  personal: true,
  onChange: (value) => {
    secretValue = value;
  },
});
assert.equal(reveal.props.children[0].props.type, "password");
assert.equal(
  reveal.props.children[1].props["aria-label"],
  "Reveal secret value",
);
reveal.props.children[0].props.onChange({
  currentTarget: { value: "changed" },
});
assert.equal(secretValue, "changed");
let retried = 0;
const unavailable = scope.r({
  id: "personal",
  value: "",
  ariaLabel: "Personal",
  namespace: "sensitive",
  name: "TOKEN",
  savedStatus: "unavailable",
  onChange() {},
  onRetry: () => {
    retried++;
  },
});
assert.equal(unavailable.props.children[1].props.role, "status");
assert.match(unavailable.props.children[1].props.children, /unavailable/);
unavailable.props.children[2].props.onClick();
assert.equal(retried, 1);
assert.match(
  scope.r({
    id: "personal",
    value: "",
    ariaLabel: "Personal",
    namespace: "not_sensitive",
    name: "TOKEN",
    savedStatus: "ambiguous",
    onChange() {},
  }).props.children[1].props.children,
  /Multiple/,
);
let changedScope = null;
const scopeControl = scope.t({
  name: "TOKEN",
  source: "environment",
  onChange: (value) => {
    changedScope = value;
  },
});
assert.equal(scopeControl.props["aria-label"], "Scope for TOKEN");
assert.equal(
  scopeControl.props.children[1].props.children[0].props.checked,
  true,
);
scopeControl.props.children[2].props.children[0].props.onChange();
assert.equal(changedScope, "user_provided");

const domains = await load("allowed-domains-input");
domains.n();
assert.equal(domains.i({ issues: [] }), null);
const issueSummary = domains.i({
  issues: [
    { code: "key", field: "variables.0" },
    { code: "save", field: "variables.1" },
    { code: "environment", message: "Changed", valuesSaved: true },
  ],
});
assert.equal(issueSummary.props.role, "alert");
assert.match(issueSummary.props.children[0], /Fix 1 error/);
assert.equal(issueSummary.props.children[2].length, 1);
assert.equal(issueSummary.props.children[2][0].props.issue.valuesSaved, true);
const issueDetail = domains.r(
  issueSummary.props.children[2][0].props,
);
assert.match(
  issueDetail.props.children[1],
  /Some values were saved/,
);
let domainList = ["api.example.com"],
  domainInput = "",
  inputChanges = [];
const editor = domains.t({
  domains: domainList,
  value: "new.example.com",
  onChange: (value) => {
    domainList = value;
  },
  onInputChange: (value) => {
    domainInput = value;
    inputChanges.push(value);
  },
});
assert.equal(
  editor.props.children[0].props["aria-label"],
  "Additional allowed domains",
);
editor.props.children[0].props.onKeyDown({ key: "Enter", preventDefault() {} });
assert.deepEqual(domainList, ["api.example.com", "new.example.com"]);
assert.equal(domainInput, "");
const duplicate = domains.t({
  domains: ["api.example.com"],
  value: "API.EXAMPLE.COM",
  onChange() {},
  onInputChange() {},
});
assert.equal(duplicate.props.children[0].props["aria-invalid"], true);
assert.match(duplicate.props.children[1].props.children, /already allowed/);
const secretWildcard = domains.t({
  domains: [],
  value: "*.example.com",
  purpose: "secret",
  onChange() {},
  onInputChange() {},
});
assert.match(secretWildcard.props.children[1].props.children, /Wildcards/);
const url = domains.t({
  domains: [],
  value: "https://example.com/path",
  onChange() {},
  onInputChange() {},
});
assert.match(url.props.children[1].props.children, /without a URL/);
const ipv4 = domains.t({
  domains: [],
  value: "192.168.1",
  onChange() {},
  onInputChange() {},
});
assert.match(ipv4.props.children[1].props.children, /full IPv4/);
let removed = null;
const chips = domains.t({
  domains: ["one.example", "two.example"],
  value: "",
  onChange: (value) => {
    removed = value;
  },
  onInputChange() {},
});
chips.props.children[2].props.children[0].props.children[1].props.onClick();
assert.deepEqual(removed, ["two.example"]);
const readOnly = domains.t({
  domains: [],
  value: "",
  readOnly: true,
  onChange() {},
  onInputChange() {},
});
assert.equal(readOnly.props.children[0], null);
assert.equal(
  readOnly.props.children[2].props.children.props.children,
  "No domains added yet",
);

console.log("secret scope domains cluster complete");
