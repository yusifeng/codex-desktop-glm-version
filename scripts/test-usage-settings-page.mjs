import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/usage-settings-page/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const staticDependencies = new Set(
  [...source.matchAll(/(?:from|^import)\s*["']@rchunk\/([^"']+)/gm)].map((match) => match[1]),
);
const dynamicDependencies = new Set(
  [...source.matchAll(/import\("@rchunk\/([^"]+)"\)/g)].map((match) => match[1]),
);
assert.deepEqual([...staticDependencies].sort(), [
  "app-initial",
  "app-shared",
  "command-menu-queries",
  "entry-point-availability",
  "form-runtime",
  "linked-app-logo",
  "pricing",
  "rolldown-runtime",
  "security-tabs",
  "settings-loading-row",
  "usd",
]);
assert.deepEqual([...dynamicDependencies].sort(), [
  "consumer-view-settings",
  "usage-analytics-settings",
  "usage-code-review-settings",
]);
assert.doesNotMatch(source, /\bany\b/);
assert.doesNotMatch(
  source,
  /\b(?:appInitialChunk|appSharedChunk|usageQueriesChunk|entryPointAvailabilityChunk|linkedAppLogoChunk|pricingChunk|tabsChunk|settingsLoadingRowChunk|usdChunk)\s*\./,
);

const defaultUsage = {
  credits: { balance: 425, unlimited: false },
  monthly: { limit: 1_000, used: 250 },
  planPrice: { amount: 20, currencyCode: "USD" },
  rate_limit: {
    primary_window: { reset_at: "2 hours", used_percent: 25 },
    secondary_window: { reset_at: "4 days", used_percent: 60 },
  },
  reset_credits: [{ expires_at: "2026-10-30", id: "reset-1" }],
  services: [
    { app: { client_app_type: "codex", name: "Codex CLI" }, limit: 0.25, uses_credits: true },
  ],
};
const state = {
  context: null,
  giftAvailable: true,
  initializers: [],
  lazyLoads: [],
  location: { hash: "", pathname: "/settings/usage", search: "", state: null },
  plan: {
    canPurchaseCredits: true,
    canViewCreditSettings: true,
    isAccessLoading: false,
    isUsageSettingsVisible: true,
    plan: "plus",
  },
  query: { data: defaultUsage, isError: false, isLoading: false, refetches: 0 },
  restored: [],
  selected: [],
};
function makeContext(sections = ["usage"]) {
  return {
    onSelectSection(section, subsection, replace) {
      state.selected.push({ section, subsection, replace });
    },
    restoreUsageTabFocus(element) {
      state.restored.push(element);
    },
    visibleSettingsSections: sections.map((slug) => ({ slug })),
  };
}
state.context = makeContext();
globalThis.__usageSettingsPageTest = state;
globalThis.requestAnimationFrame = (callback) => { callback(1); return 1; };
globalThis.cancelAnimationFrame = () => undefined;

const mocks = {
  "rolldown-runtime": "export {};",
  "form-runtime": "export {};",
  "app-shared": [
    "const s=globalThis.__usageSettingsPageTest;const mark=name=>()=>s.initializers.push(name);",
    "export const $3=mark('jsx');export const FX=mark('signals');export const K2=mark('intl');export const HX=()=>s.query;",
    "export const Y2=({defaultMessage})=>defaultMessage;export const Yh='Button';",
    "export const I3=()=>({Fragment:'Fragment',jsx:(type,props,key)=>typeof type==='function'?type(props??{}):({type,props:props??{},key}),jsxs:(type,props,key)=>typeof type==='function'?type(props??{}):({type,props:props??{},key})});",
    "export const e6=()=>({Suspense:'Suspense',lazy(loader){s.lazyLoads.push(loader);return props=>({type:'Lazy',props:{...props,loader}})},useRef(value){return{current:value}},useLayoutEffect(effect){effect()}});",
  ].join("\n"),
  "app-initial": [
    "const s=globalThis.__usageSettingsPageTest;export const Ygn='Redirect';export const f0t='usageQuery';",
    "export const c_n=()=>s.context;export const dS=()=>s.plan;export const d_n=()=>[new URLSearchParams(s.location.search)];export const i_n=()=>s.location;",
  ].join("\n"),
  "command-menu-queries": "export const t=()=>globalThis.__usageSettingsPageTest.initializers.push('queries');",
  "entry-point-availability": "const s=globalThis.__usageSettingsPageTest;export const r=()=>s.giftAvailable;export const t=()=>s.initializers.push('entry-points');",
  "linked-app-logo": "const s=globalThis.__usageSettingsPageTest;export const n='LinkedAppLogo';export const r=()=>s.initializers.push('linked-logo');",
  pricing: "const s=globalThis.__usageSettingsPageTest;export const r=()=>s.initializers.push('pricing');export const t=({amount,currencyCode})=>amount==null?null:currencyCode+' '+amount.toFixed(2);",
  "security-tabs": "const s=globalThis.__usageSettingsPageTest;export const n=()=>s.initializers.push('tabs');export const t='Tabs';",
  "settings-loading-row": "const s=globalThis.__usageSettingsPageTest;export const n=()=>s.initializers.push('loading-row');export const t='SettingsLoadingRow';",
  usd: "export const t=value=>value==null?'—':'$'+Number(value).toFixed(2);",
  "usage-analytics-settings": "export const UsageAnalyticsSettings='UsageAnalyticsSettings';",
  "consumer-view-settings": "export const ConsumerViewSettings='ConsumerViewSettings';",
  "usage-code-review-settings": "export const UsageCodeReviewSettings='UsageCodeReviewSettings';",
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
      name: "usage-settings-page-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice(8),
          namespace: "mock",
        }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: moduleName }) => ({
          contents: mocks[moduleName] ?? "export {};",
          loader: "js",
        }));
      },
    },
  ],
});
const module = await import(
  "data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64")
);

let assertions = 4;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
function reset() {
  state.context = makeContext();
  state.giftAvailable = true;
  state.location = { hash: "", pathname: "/settings/usage", search: "", state: null };
  state.plan = { canPurchaseCredits: true, canViewCreditSettings: true, isAccessLoading: false, isUsageSettingsVisible: true, plan: "plus" };
  state.query = { data: defaultUsage, isError: false, isLoading: false, refetches: 0, refetch() { this.refetches += 1; } };
  state.restored = [];
  state.selected = [];
}
function render() {
  return module.UsageSettingsPage();
}
function walk(value, output = []) {
  if (value == null || typeof value !== "object") return output;
  if (Array.isArray(value)) { for (const item of value) walk(item, output); return output; }
  output.push(value);
  walk(value.props?.children, output);
  return output;
}
function textContent(value) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(textContent).join(" " );
  return textContent(value.props?.children);
}
function byType(view, type) { return walk(view).find((node) => node.type === type); }
function byData(view, name, value) { return walk(view).find((node) => node.props?.[`data-${name}`] === value); }
function button(view, label) { return walk(view).find((node) => node.type === "Button" && textContent(node).trim() === label); }

assert.deepEqual(Object.keys(module), ["UsageSettingsPage"]);
assertions += 1;
check(state.initializers.length === 9 && new Set(state.initializers).size === 9, "initializes all static runtimes once");
check(state.lazyLoads.length === 3, "creates exactly three lazy settings boundaries");

reset();
let view = render();
check(byType(view, "main").props["data-density"] === "compact", "uses compact density for the single overview tab");
check(textContent(view).includes("Usage") && textContent(view).includes("Your plan"), "renders the usage page and plan section");
check(textContent(view).includes("ChatGPT Plus") && textContent(view).includes("USD 20.00 / month"), "renders plan name and monthly price");
check(textContent(view).includes("5-hour limit") && textContent(view).includes("75% left"), "renders the primary usage window");
check(textContent(view).includes("Weekly limit") && textContent(view).includes("40% left"), "renders the secondary usage window");
check(textContent(view).includes("250 of 1000 credits used"), "renders monthly usage");
check(textContent(view).includes("$425.00") && button(view, "Add more") != null, "renders purchasable credit balance");
check(button(view, "Gift credits") != null, "renders gift credits when available");
check(textContent(view).includes("Usage limit resets") && button(view, "Use reset") != null, "renders banked usage resets");
check(byType(view, "LinkedAppLogo") != null && textContent(view).includes("Codex CLI"), "renders subscription-sharing services");
check(textContent(view).includes("25% of available tokens") && textContent(view).includes("Uses credits"), "renders service limits and credit policy");

reset();
state.context = makeContext(["usage", "analytics", "consumer-view", "usage-code-review"]);
view = render();
const tabs = byType(view, "Tabs");
check(tabs.props.tabs.length === 4 && tabs.props.selectedKey === "usage", "renders all visible usage tabs");
tabs.props.onSelect("analytics");
check(state.selected[0].section === "analytics" && state.selected[0].replace === true, "routes tab selection through settings context");
check(state.restored.length === 1, "restores tab focus after selection changes");

reset();
state.context = makeContext(["usage", "analytics"]);
state.location.search = "?tab=analytics";
view = render();
check(byType(view, "Tabs").props.selectedKey === "analytics", "selects the URL-backed analytics tab");
const analyticsPanel = byData(view, "section", undefined) ?? walk(view).find((node) => node.props?.id === "usage-panel-analytics");
const lazy = walk(analyticsPanel).find((node) => node.type === "Lazy");
check(lazy != null && lazy.props.isPolling === true, "polls only the selected lazy panel");
const analyticsModule = await lazy.props.loader();
check(analyticsModule.default === "UsageAnalyticsSettings", "loads analytics settings on demand");

reset();
state.context = makeContext(["usage", "consumer-view"]);
state.location.search = "?tab=consumer-view";
view = render();
const consumerLazy = walk(view).find((node) => node.type === "Lazy" && node.props.isPolling === true);
const consumerModule = await consumerLazy.props.loader();
check(consumerModule.default === "ConsumerViewSettings", "loads consumer view settings on demand");

reset();
state.context = makeContext(["usage", "usage-code-review"]);
state.location.search = "?tab=usage-code-review";
view = render();
const reviewLazy = walk(view).find((node) => node.type === "Lazy" && node.props.isPolling === true);
const reviewModule = await reviewLazy.props.loader();
check(reviewModule.default === "UsageCodeReviewSettings", "loads code review settings on demand");

reset();
state.context = makeContext(["usage", "analytics"]);
state.location = { hash: "#limits", pathname: "/settings/usage", search: "?tab=missing&credit_modal=true", state: { source: "settings" } };
view = render();
const redirect = byType(view, "Redirect");
check(redirect.props.replace === true && String(redirect.props.to).includes("credit_modal=true") && !String(redirect.props.to).includes("tab=missing"), "canonicalizes invalid tabs while preserving other query state");
check(String(redirect.props.to).endsWith("#limits"), "preserves the location hash when redirecting");

reset();
state.plan.isAccessLoading = true;
view = render();
check(textContent(byType(view, "SettingsLoadingRow")).includes("Loading usage settings"), "shows access loading state");

reset();
state.query = { data: null, isError: false, isLoading: true, refetch() {} };
view = render();
check(textContent(byType(view, "SettingsLoadingRow")).includes("Loading usage settings"), "shows data loading state");

reset();
state.query = { data: null, isError: true, isLoading: false, refetches: 0, refetch() { this.refetches += 1; } };
view = render();
check(textContent(view).includes("Could not load usage settings."), "shows usage load errors");
button(view, "Retry").props.onClick();
check(state.query.refetches === 1, "retries the usage query");

reset();
state.plan.isUsageSettingsVisible = false;
view = render();
check(!textContent(view).includes("Your plan"), "hides overview content without usage access");

reset();
state.query = { ...state.query, data: { ...defaultUsage, credits: { balance: null, unlimited: true } } };
view = render();
check(textContent(view).includes("Unlimited credit"), "renders unlimited credit accounts");

reset();
state.giftAvailable = false;
state.plan.canPurchaseCredits = false;
view = render();
check(button(view, "Add more") == null && button(view, "Gift credits") == null, "hides unavailable credit purchase actions");

console.log(assertions + " usage settings page assertions passed");
