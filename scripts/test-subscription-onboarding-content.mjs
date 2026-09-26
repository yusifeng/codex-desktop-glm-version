import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function storage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}
globalThis.window = { localStorage: storage(), sessionStorage: storage() };
globalThis.__subscriptionTourTest = {
  jsx: {
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
  react: {
    useEffect() {},
    useState: (value) => [value, () => {}],
  },
};

const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/subscription-onboarding-content/index.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "mock-chunks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice("@rchunk/".length),
          namespace: "mock",
        }));
        build.onLoad(
          { filter: /.*/, namespace: "mock" },
          ({ path: importPath }) => ({
            contents:
              importPath === "app-shared"
                ? `
                  export const I3 = () => globalThis.__subscriptionTourTest.jsx;
                  export const e6 = () => globalThis.__subscriptionTourTest.react;
                  export const n4 = () => ({ formatMessage: descriptor => descriptor.defaultMessage });
                  export const m4 = (...values) => values.filter(Boolean).join(" ");
                  export const $3 = () => {}; export const K2 = () => {}; export const h4 = () => {};
                `
                : "export const CT = () => {}; export const TT = () => {}; export const wT = () => {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const tour = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
const account = {
  id: "account-1",
  accountUserId: "user-1",
  isPaidPlus: true,
  discount: {
    promo_campaign_id: "students-2026-four-month-free",
    discount_expires_at: new Date(Date.now() + 60_000).toISOString(),
  },
};
check(tour.n(account), "accepts an active eligible student campaign");
tour.a(account);
check(!tour.n(account), "marks student onboarding as shown per account user");
check(tour.o(account), "records a pending student onboarding handoff");
check(tour.r(account), "consumes a fresh matching handoff");
check(!tour.r(account), "consumes a pending handoff only once");
tour.o(account);
check(
  !tour.r({ ...account, id: "other" }),
  "rejects and clears a mismatched handoff",
);
check(
  tour.h.join(",") === "intelligence,work,codex",
  "exports desktop Pro pages",
);
check(
  tour.g.join(",") === "intelligence,work,voice",
  "exports mobile Pro pages",
);
const frame = tour.d({ isDarkMode: true, className: "custom" });
check(
  frame.props["data-checkout-theme"] === "dark" &&
    frame.props.className.includes("custom"),
  "applies checkout theme attributes",
);
const baseProps = {
  Frame: "Frame",
  open: true,
  onOpenChange() {},
  onAction() {},
};
const plus = tour.v(baseProps);
check(
  plus.props.pages.map((page) => page.id).join(",") ===
    "welcome,intelligence,images,personalization",
  "builds the default Plus sequence",
);
check(
  plus.props.pages.at(-1).primaryActionLabel === "Finish",
  "marks the final Plus page as Finish",
);
const pro = tour.p({ ...baseProps, featurePageIds: tour.g });
check(
  pro.props.pages.map((page) => page.id).join(",") ===
    "welcome,intelligence,work,voice",
  "builds the selected Pro sequence",
);
const student = tour.l({ ...baseProps, showPluginsAction: false });
check(
  student.props.pages[1].id === "plugins" &&
    student.props.pages[1].secondaryAction == null &&
    student.props.pages.at(-1).id === "voice",
  "honors student action availability",
);

assert.equal(assertions, 13);
console.log(`${assertions} subscription onboarding content assertions passed`);
