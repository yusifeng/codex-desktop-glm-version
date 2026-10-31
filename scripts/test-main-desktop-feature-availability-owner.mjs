import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };

class Schema {
  constructor(check = () => true, shape = null, partial = false, strict = false) {
    this.check = check;
    this.shape = shape;
    this.isPartial = partial;
    this.isStrict = strict;
  }
  int() { return this; }
  nonnegative() { return this; }
  positive() { return this; }
  nullable() { const base = this; return new Schema((value) => value === null || base.check(value)); }
  partial() { return new Schema(this.check, this.shape, true, this.isStrict); }
  strict() { return new Schema(this.check, this.shape, this.isPartial, true); }
  safeParse(value) {
    if (this.shape == null) return this.check(value) ? { success: true, data: value } : { success: false, error: { issues: [] } };
    const issues = [];
    if (typeof value !== "object" || value == null || Array.isArray(value)) issues.push({ path: [], message: "Expected object" });
    else {
      for (const [key, schema] of Object.entries(this.shape)) {
        if (!(key in value)) { if (!this.isPartial) issues.push({ path: [key], message: "Required" }); }
        else if (!schema.safeParse(value[key]).success) issues.push({ path: [key], message: "Invalid value" });
      }
      if (this.isStrict)
        for (const key of Object.keys(value)) if (!(key in this.shape)) issues.push({ path: [key], message: "Unknown key" });
    }
    return issues.length === 0 ? { success: true, data: value } : { success: false, error: { issues } };
  }
}

const shared = {
  wf: (shape) => new Schema(() => true, shape),
  gf: () => new Schema((value) => typeof value === "boolean"),
  Cf: () => new Schema((value) => typeof value === "number"),
  bf: (literal) => new Schema((value) => value === literal),
  Pf: () => new Schema((value) => typeof value === "string"),
  Ia: { openLinkInTargetPreference: { schema: new Schema((value) => typeof value === "string") } },
};
const BuildFlavor = { Dev: "dev", resolve: () => "prod" };
const source = fs.readFileSync(new URL("../src/main/main-app/misc/availability.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const module = { exports: {} };
Function("require", "module", "exports", transpiled.code)(
  (specifier) => {
    if (specifier === "@chunk/shared") return shared;
    if (specifier === "@chunk/bootstrap") return { in: BuildFlavor };
    throw new Error(`unexpected require ${specifier}`);
  },
  module,
  module.exports,
);
const availability = module.exports;

equal(availability.getDesktopFeatureAvailability().browserPane, false);
equal(availability.getDesktopAccessState(), { status: "loading" });
let featureNotifications = 0;
let accessNotifications = 0;
const unsubscribeFeature = availability.subscribeDesktopFeatureAvailabilityChanged(() => { featureNotifications += 1; });
const unsubscribeAccess = availability.subscribeDesktopAccessStateChanged(() => { accessNotifications += 1; });
equal(availability.updateDesktopFeatureAvailability({
  codexLocalAccess: true,
  workCloudAccess: false,
  workLocalAccess: true,
}), true);
equal(availability.getDesktopAccessState(), {
  status: "ready",
  codexLocalAccess: true,
  workCloudAccess: false,
  workLocalAccess: true,
});
equal(featureNotifications, 1);
equal(accessNotifications, 1);
equal(availability.updateDesktopFeatureAvailability({
  codexLocalAccess: true,
  workCloudAccess: false,
  workLocalAccess: true,
}), false);
equal(featureNotifications, 1);
equal(accessNotifications, 1);
equal(availability.updateDesktopFeatureAvailability({ browserPane: true }), true);
equal(featureNotifications, 2);
equal(accessNotifications, 1);
unsubscribeFeature();
unsubscribeAccess();
availability.updateDesktopFeatureAvailability({ browserPane: false, codexLocalAccess: false });
equal(featureNotifications, 2);
equal(accessNotifications, 1);

equal(availability.resolveDesktopFeatureAvailability({}, {
  buildFlavor: "prod",
  env: { CODEX_ELECTRON_ENABLE_WINDOWS_COMPUTER_USE: "1" },
  platform: "win32",
}).computerUse, true);
equal(availability.resolveDesktopFeatureAvailability({ browserPane: false }, {
  buildFlavor: "dev",
  env: { CODEX_ELECTRON_DESKTOP_FEATURE_OVERRIDES: '{"browserPane":true}' },
  platform: "linux",
}).browserPane, true);
assert.throws(() => availability.resolveDesktopFeatureAvailability({}, {
  buildFlavor: "dev",
  env: { CODEX_ELECTRON_DESKTOP_FEATURE_OVERRIDES: '{"unknown":true}' },
  platform: "linux",
}), /CODEX_ELECTRON_DESKTOP_FEATURE_OVERRIDES\.unknown/);
assertions += 1;
equal(availability.deviceAttestationSupported({ platform: "darwin" }), true);
equal(availability.deviceAttestationSupported({ platform: "linux" }), false);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('DEFAULT_DESKTOP_FEATURE_AVAILABILITY: vr'), true);
equal(main.includes('getDesktopFeatureAvailability: Tr'), true);
equal(main.includes('updateDesktopFeatureAvailability: kr'), true);
equal(main.includes('resolveDesktopFeatureAvailability: Ar'), true);
equal(main.includes('require("./main-app/misc/availability.js")'), true);
equal(main.includes("var _r = n.wf({"), false);
equal(main.includes("function Tr("), false);
equal(main.includes("function kr("), false);
equal(main.includes("function Ar("), false);
equal(main.includes("desktopFeatureAvailability: Tr()"), true);
equal(main.includes("kr(Ar({}, { buildFlavor: s }))"), true);

const autocomplete = fs.readFileSync(new URL("../src/main/main-app/browser-use/autocomplete.ts", import.meta.url), "utf8");
equal(autocomplete.includes('from "../misc/availability"'), true);

console.log(`${assertions} main desktop feature availability owner assertions passed`);
