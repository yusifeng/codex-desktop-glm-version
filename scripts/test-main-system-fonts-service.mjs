import assert from "node:assert/strict";
import fs from "node:fs";
import { createSystemFontsServiceClass } from "../src/main/main-app/window/system-fonts-service.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

let calls = 0;
const expected = Promise.resolve(["Inter", "SF Pro"]);
class RpcHandlerBase {}
const SystemFontsService = createSystemFontsServiceClass({
  RpcHandlerBase,
  getFontFamilies() {
    calls += 1;
    return expected;
  },
});
const service = new SystemFontsService();
equal(service instanceof RpcHandlerBase, true);
equal(service.getFontFamilies(), expected);
equal(await service.getFontFamilies(), ["Inter", "SF Pro"]);
equal(calls, 2);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes("att = createSystemFontsServiceClass({"), true);
equal(main.includes("systemFonts: new att()"), true);
equal(main.includes("att = class"), false);
equal(main.includes("getFontFamilies: () => l.systemPreferences.getFontFamilies()"), true);

console.log(`${assertions} main system-fonts service assertions passed`);
