import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/offer-page/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const dependencies = new Set(
  [...source.matchAll(/(?:from|import)\s+"@rchunk\/([^"/]+)"/g)].map(
    (match) => match[1],
  ),
);

assert.deepEqual([...dependencies].sort(), [
  "app-initial",
  "app-shared",
  "offer-notice",
  "offer-queries",
  "rolldown-runtime",
]);
assert.doesNotMatch(source, /\bany\b/);
assert.doesNotMatch(
  source,
  /\b(?:appInitialChunk|appSharedChunk|offerNoticeChunk|offerQueriesChunk)\s*\./,
);

const testState = {
  account: {
    data: { id: "account-1", structure: "personal", plan_type: "free" },
    isLoading: false,
  },
  accountCalls: [],
  assignedUrl: null,
  auth: {
    accountId: "account-1",
    authMethod: "chatgpt",
    isLoading: false,
    userId: "user-1",
  },
  authCalls: [],
  authResult: { ok: true, url: "https://chatgpt.com/auth/continue" },
  canCheckout: false,
  cleanup: null,
  fetchCalls: [],
  initializers: [],
  location: {
    pathname: "/offer/promo",
    search: "?code=SAVE20",
    hash: "#redeem",
    state: { source: "email" },
  },
  navigations: [],
  offer: {
    pathname: "/offer/promo",
    search: "code=SAVE20",
    hash: "#redeem",
    code: "SAVE20",
    kind: "promo",
    checkoutSource: "email",
  },
  query: {
    data: {
      is_eligible: false,
      ineligible_reason: { title: "Not available", message: "Already used" },
    },
    error: null,
    isPending: false,
    refetchCount: 0,
  },
  queryOptions: null,
  stateUpdates: [],
  darkMode: false,
};

globalThis.__offerPageTest = testState;
globalThis.window = {
  location: {
    assign(url) {
      testState.assignedUrl = url;
    },
  },
};

const mocks = {
  "app-shared": [
    "const state = globalThis.__offerPageTest;",
    "const mark = name => () => state.initializers.push(name);",
    "export const $3 = mark('compiler'); export const $h = mark('resources');",
    "export const K2 = mark('intl'); export const Ph = mark('dialog-layout');",
    "export const Zh = mark('button'); export const dg = mark('theme');",
    "export const gL = mark('query'); export const zh = mark('dialog');",
    "export const Ah = 'DialogHeader'; export const Ih = 'Dialog';",
    "export const Lh = 'DialogDescription'; export const Oh = 'DialogBody';",
    "export const Qh = 'LoadingSpinner'; export const Rh = 'DialogTitle';",
    "export const Y2 = 'FormattedMessage'; export const Yh = 'Button';",
    "export const jh = 'DialogSection'; export const kh = 'DialogFooter';",
    "export const I3 = () => ({ Fragment: 'Fragment', jsx: (type, props, key) => ({ type, props, key }), jsxs: (type, props, key) => ({ type, props, key }) });",
    "export const e6 = () => ({ useEffect(effect) { state.cleanup = effect() ?? null; }, useRef(value) { return { current: value }; }, useState(value) { return [value, next => state.stateUpdates.push(next)]; } });",
    "export const _L = options => { state.queryOptions = options; return { ...state.query, refetch() { state.query.refetchCount += 1; } }; };",
    "export const fg = () => state.darkMode;",
    "export const n4 = () => ({ formatMessage: descriptor => descriptor.defaultMessage });",
  ].join("\n"),
  "app-initial": [
    "const state = globalThis.__offerPageTest;",
    "const mark = name => () => state.initializers.push(name);",
    "export const $F = () => state.offer;",
    "export const Fx = callback => 'auth:' + callback;",
    "export const Ix = mark('router'); export const M6t = mark('authentication');",
    "export const N6t = () => state.auth;",
    "export const Pdn = { GO: 'go', PLUS: 'plus', PROLITE: 'prolite', PRO: 'pro' };",
    "export const Qgn = mark('authentication-url'); export const Rln = mark('plan-mapping');",
    "export const Rx = async (url, parameters, signal) => { state.authCalls.push({ url, parameters, signal }); return state.authResult; };",
    "export const Ygn = 'Navigate';",
    "export const _0 = ({ search }) => ({ pathname: '/checkout', search, hash: '' });",
    "export const aI = mark('offers'); export const cI = () => state.canCheckout;",
    "export const i_n = () => state.location;",
    "export const o_n = () => (destination, options) => state.navigations.push({ destination, options });",
    "export const r_n = location => 'callback:' + location.pathname + '?' + location.search + location.hash;",
    "export const rht = mark('offer-page-state'); export const tI = metadata => metadata.plan_name ?? null;",
    "export const uht = (accountId, options) => { state.accountCalls.push({ accountId, options }); return state.account; };",
    "export const v0 = mark('router-state');",
  ].join("\n"),
  "offer-notice": [
    "export const i = () => globalThis.__offerPageTest.initializers.push('offer-notice');",
    "export const t = 'OfferNotice';",
  ].join("\n"),
  "offer-queries": [
    "export const r = () => globalThis.__offerPageTest.initializers.push('offer-queries');",
    "export const n = async input => { globalThis.__offerPageTest.fetchCalls.push(input); return { is_eligible: true }; };",
  ].join("\n"),
  "rolldown-runtime": "export {};",
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
      name: "offer-page-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice("@rchunk/".length),
          namespace: "mock",
        }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({
          loader: "js",
          contents: mocks[importPath] ?? "export {};",
        }));
      },
    },
  ],
});

const offerPage = await import(
  "data:text/javascript;base64," +
    Buffer.from(result.outputFiles[0].text).toString("base64")
);

let assertions = 3;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

function reset() {
  testState.account = {
    data: { id: "account-1", structure: "personal", plan_type: "free" },
    isLoading: false,
  };
  testState.accountCalls = [];
  testState.assignedUrl = null;
  testState.auth = {
    accountId: "account-1",
    authMethod: "chatgpt",
    isLoading: false,
    userId: "user-1",
  };
  testState.authCalls = [];
  testState.authResult = { ok: true, url: "https://chatgpt.com/auth/continue" };
  testState.canCheckout = false;
  testState.fetchCalls = [];
  testState.location = {
    pathname: "/offer/promo",
    search: "?code=SAVE20",
    hash: "#redeem",
    state: { source: "email" },
  };
  testState.navigations = [];
  testState.offer = {
    pathname: "/offer/promo",
    search: "code=SAVE20",
    hash: "#redeem",
    code: "SAVE20",
    kind: "promo",
    checkoutSource: "email",
  };
  testState.query = {
    data: {
      is_eligible: false,
      ineligible_reason: { title: "Not available", message: "Already used" },
    },
    error: null,
    isPending: false,
    refetchCount: 0,
  };
  testState.queryOptions = null;
  testState.stateUpdates = [];
  testState.darkMode = false;
}

function pageRoot() {
  return offerPage.OfferPage();
}

function renderNested(node) {
  return typeof node.type === "function" ? node.type(node.props) : node;
}

check(
  Object.keys(offerPage).length === 1 && typeof offerPage.OfferPage === "function",
  "keeps OfferPage as the only public export",
);
check(
  testState.initializers.length === 17 && new Set(testState.initializers).size === 17,
  "runs every published dependency initializer once",
);

reset();
testState.location.pathname = "/legacy-offer";
const canonicalRedirect = pageRoot();
check(canonicalRedirect.type === "Navigate", "normalizes a noncanonical offer URL");
check(canonicalRedirect.props.replace === true, "replaces the noncanonical history entry");
check(
  canonicalRedirect.props.to.pathname === "/offer/promo" &&
    canonicalRedirect.props.to.search === "code=SAVE20" &&
    canonicalRedirect.props.to.hash === "#redeem",
  "preserves the canonical pathname, query, and hash",
);
check(canonicalRedirect.props.state.source === "email", "preserves router state during canonicalization");

reset();
testState.offer.code = null;
const missingOffer = pageRoot();
check(missingOffer.type === "Navigate" && missingOffer.props.to === "/", "rejects an incomplete offer route");

reset();
testState.auth.isLoading = true;
check(pageRoot().type === "LoadingSpinner", "shows loading while authentication resolves");

reset();
testState.auth.authMethod = "codex";
const signedOutNode = pageRoot();
check(typeof signedOutNode.type === "function", "selects the signed-out offer gate");
const signedOutDialog = renderNested(signedOutNode);
check(signedOutDialog.type === "Dialog" && signedOutDialog.props.open, "opens the authentication dialog");
check(signedOutDialog.props.shouldIgnoreClickOutside === true, "prevents outside clicks from dismissing the gate");
const signedOutSections = signedOutDialog.props.children.props.children;
check(
  signedOutSections[0].props.children.props.title.props.children.props.defaultMessage ===
    "Log in or sign up to redeem your promotion",
  "renders the promotion authentication heading",
);
const authButtons = signedOutSections[2].props.children.props.children;
check(authButtons.length === 2, "renders signup and login actions");
authButtons[0].props.onClick();
await new Promise((resolve) => setImmediate(resolve));
check(testState.authCalls.length === 1, "starts one authentication request");
check(testState.authCalls[0].parameters.screen_hint === "signup", "passes the signup screen hint");
check(
  testState.authCalls[0].url === "auth:callback:/offer/promo?code=SAVE20#redeem",
  "returns authentication to the canonical offer",
);
check(testState.assignedUrl === "https://chatgpt.com/auth/continue", "assigns the successful authentication URL");
signedOutDialog.props.onOpenChange(false);
check(
  testState.navigations.at(-1).destination === "/" &&
    testState.navigations.at(-1).options.replace === true,
  "closes the signed-out dialog back to home",
);
check(typeof testState.cleanup === "function", "registers an authentication abort cleanup");

reset();
testState.auth.authMethod = null;
testState.authResult = { ok: false };
const failedDialog = renderNested(pageRoot());
const failedButtons = failedDialog.props.children.props.children[2].props.children.props.children;
failedButtons[1].props.onClick();
await new Promise((resolve) => setImmediate(resolve));
check(testState.authCalls[0].parameters.screen_hint === "login", "passes the login screen hint");
check(
  testState.stateUpdates.join(",") === "true,false,false,true",
  "sets loading and inline failure state around an unsuccessful login",
);

reset();
testState.auth.accountId = null;
check(pageRoot().type === "LoadingSpinner", "waits for the authenticated account identity");

reset();
testState.account.isLoading = true;
check(renderNested(pageRoot()).type === "LoadingSpinner", "waits for account details");

reset();
testState.query.isPending = true;
check(renderNested(pageRoot()).type === "LoadingSpinner", "waits for eligibility");

reset();
testState.query.data = {
  is_eligible: true,
  metadata: { plan_name: "chatgptteamplan", promotion_type: "percentage" },
};
const teamRedirect = renderNested(pageRoot());
check(teamRedirect.type === "Navigate", "redirects an eligible team offer");
check(teamRedirect.props.to.pathname === "/purchase/team", "uses the team purchase route");
const teamParameters = new URLSearchParams(teamRedirect.props.to.search);
check(teamParameters.get("code") === "SAVE20", "preserves the offer query for team checkout");
check(
  teamParameters.get("offer_return_path") === "/offer/promo?code=SAVE20#redeem",
  "adds the complete offer return path for team checkout",
);
check(teamRedirect.props.to.hash === "#redeem", "preserves the team offer hash");

reset();
testState.canCheckout = true;
testState.query.data = {
  is_eligible: true,
  metadata: { plan_name: "chatgptplusplan", promotion_type: "percentage" },
};
const personalRedirect = renderNested(pageRoot());
check(personalRedirect.type === "Navigate", "redirects an eligible personal offer");
check(personalRedirect.props.to.pathname === "/checkout", "uses the personal checkout route");
check(personalRedirect.props.state.defaultTab === "personal", "opens the personal checkout tab");
check(personalRedirect.props.state.source === "promotion_offer", "labels the checkout source");
check(personalRedirect.props.state.offer.plan === "plus", "maps the promotion plan to checkout");
check(personalRedirect.props.state.offer.promoCode === "SAVE20", "passes a promo code");
check(personalRedirect.props.state.offer.referralCode === null, "does not set a referral code for promos");
check(
  personalRedirect.props.state.offer.returnPath === "/offer/promo?code=SAVE20#redeem",
  "passes the exact return path to personal checkout",
);
check(personalRedirect.props.state.offer.checkoutSource === "email", "passes checkout attribution");

reset();
testState.account.data.plan_type = "plus";
testState.query.data = {
  is_eligible: true,
  metadata: { plan_name: "chatgptpro", processor: "stripe", price_period: "recurring" },
};
const recurringRedirect = renderNested(pageRoot());
check(recurringRedirect.type === "Navigate", "allows recurring Stripe promotions into checkout");
check(recurringRedirect.props.state.offer.plan === "pro", "maps the recurring promotion plan");

reset();
testState.offer.kind = "referral";
testState.query.data = { is_eligible: true, metadata: { plan_name: "chatgptgoplan" } };
const referralRedirect = renderNested(pageRoot());
check(referralRedirect.props.state.offer.promoCode === null, "does not treat referrals as promo codes");
check(referralRedirect.props.state.offer.referralCode === "SAVE20", "passes the referral code");

reset();
testState.darkMode = true;
const notice = renderNested(pageRoot());
check(notice.type === "OfferNotice", "renders the published ineligible notice");
check(
  notice.props.title === "Not available" && notice.props.message === "Already used",
  "uses server-provided ineligibility copy",
);
check(notice.props.closeLabel === "Close", "localizes the close action");
check(notice.props.isDarkMode === true, "forwards dark mode to the notice");
check(notice.props.portalClassName === "zoom-adjusted-viewport", "uses the zoom-adjusted portal");
check(notice.props.retry === undefined, "omits retry for a valid ineligible response");
notice.props.onClose();
check(testState.navigations[0].destination === "/", "returns home when the notice closes");

reset();
testState.query = {
  data: undefined,
  error: new Error("network"),
  isPending: false,
  refetchCount: 0,
};
const errorNotice = renderNested(pageRoot());
check(errorNotice.props.title.props.defaultMessage === "Promotion unavailable", "uses the fallback error title");
check(
  errorNotice.props.message.props.defaultMessage === "We couldn’t prepare this promotion",
  "uses the fallback error message",
);
check(errorNotice.props.retry.label.props.defaultMessage === "Try again", "shows the retry action after an error");
errorNotice.props.retry.onClick();
check(testState.query.refetchCount === 1, "refetches eligibility from the retry action");
check(
  testState.queryOptions.queryKey.join(":") === "checkout-offer:account-1:user-1:promo:SAVE20",
  "keys eligibility by account, user, kind, and code",
);
check(
  testState.queryOptions.retry === false && testState.queryOptions.staleTime === 0,
  "matches the published eligibility retry and freshness policy",
);
const signal = new AbortController().signal;
await testState.queryOptions.queryFn({ signal });
check(testState.fetchCalls.length === 1, "delegates eligibility fetching once");
check(
  testState.fetchCalls[0].accountId === "account-1" &&
    testState.fetchCalls[0].code === "SAVE20" &&
    testState.fetchCalls[0].kind === "promo" &&
    testState.fetchCalls[0].signal === signal,
  "passes the complete eligibility request",
);
check(
  testState.accountCalls.at(-1).accountId === undefined &&
    testState.accountCalls.at(-1).options.preview === false,
  "loads the current non-preview account",
);

console.log(assertions + " offer page assertions passed");
