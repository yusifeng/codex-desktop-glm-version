import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/app-shared/ui/intl.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  external: ["react"],
  write: false,
  logLevel: "silent",
});

const Fragment = Symbol("Fragment");
const context = { Provider: Symbol("IntlProvider"), value: null };
globalThis.__RENDERER_REACT__ = {
  Fragment,
  createContext(defaultValue) {
    context.value = defaultValue;
    return context;
  },
  createElement(type, props, ...children) {
    return { type, props, children };
  },
  useContext(value) {
    return value.value;
  },
};

const intlModule = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function equal(actual, expected, message) {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
}

const descriptors = {
  save: { id: "action.save", defaultMessage: "Save" },
};
equal(
  intlModule.defineMessages(descriptors),
  descriptors,
  "defineMessages preserves descriptor identity",
);
const descriptor = { id: "action.cancel", defaultMessage: "Cancel" };
equal(
  intlModule.defineMessage(descriptor),
  descriptor,
  "defineMessage preserves descriptor identity",
);

const calls = [];
const intl = {
  locale: "en-US",
  formatMessage(message, values, options) {
    calls.push({ message, values, options });
    return values?.name == null
      ? (message.defaultMessage ?? message.id)
      : `${message.defaultMessage}, ${values.name}`;
  },
};
globalThis.__RENDERER_INTL__ = intl;
equal(intlModule.useIntl(), intl, "returns the active intl shape");

let node = intlModule.FormattedMessage({
  id: "welcome",
  defaultMessage: "Welcome",
  description: "Greeting",
  values: { name: "Ada" },
  ignoreTag: true,
});
equal(node.type, Fragment, "uses a fragment by default");
equal(node.children, ["Welcome, Ada"], "renders the formatted message");
equal(
  calls[0],
  {
    message: {
      id: "welcome",
      defaultMessage: "Welcome",
      description: "Greeting",
    },
    values: { name: "Ada" },
    options: { ignoreTag: true },
  },
  "forwards message metadata and values",
);

node = intlModule.FormattedMessage({
  id: "wrapped",
  defaultMessage: "Wrapped",
  tagName: "strong",
});
equal(node.type, "strong", "renders a requested tag");
equal(node.children, ["Wrapped"], "passes text to the requested tag");

globalThis.__RENDERER_INTL__ = {
  ...intl,
  textComponent: "span",
};
node = intlModule.FormattedMessage({ id: "text", defaultMessage: "Text" });
equal(node.type, "span", "uses the configured text component");

globalThis.__RENDERER_INTL__ = {
  formatMessage() {
    return ["Hello ", { type: "b", children: "Ada" }];
  },
};
const richResult = intlModule.FormattedMessage({
  id: "rich",
  children: (chunks) => ({ kind: "render-prop", chunks }),
});
equal(
  richResult,
  {
    kind: "render-prop",
    chunks: ["Hello ", { type: "b", children: "Ada" }],
  },
  "passes rich chunks to a render prop",
);

globalThis.__RENDERER_INTL__ = {
  formatMessage() {
    return "plain";
  },
};
equal(
  intlModule.FormattedMessage({
    id: "plain",
    children: (chunks) => chunks,
  }),
  ["plain"],
  "wraps a plain message for a render prop",
);

delete globalThis.__RENDERER_INTL__;
const provider = intlModule.IntlProvider({ value: intl, children: "child" });
equal(provider.type, context.Provider, "renders the intl context provider");
equal(provider.props, { value: intl }, "passes the intl value to its provider");
equal(provider.children, ["child"], "passes provider children");
context.value = intl;
equal(intlModule.useIntl(), intl, "reads intl from context");

context.value = null;
assert.throws(
  () => intlModule.useIntl(),
  /IntlProvider/,
  "requires an intl provider",
);
assertions += 1;
equal(
  intlModule.initializeIntl(),
  undefined,
  "keeps initialization idempotent",
);

console.log(
  `app-shared intl behavior: ${assertions}/${assertions} assertions passed`,
);
