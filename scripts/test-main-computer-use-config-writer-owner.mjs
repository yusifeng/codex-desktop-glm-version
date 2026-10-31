import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/computer-use/config-writer.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const fn = (name) => ast.body.find((node) => node.type === "FunctionDeclaration" && node.id?.name === name);
const slice = (name) => {
  const node = fn(name);
  assert.ok(node, `missing ${name}`);
  assertions += 1;
  return transpiled.code.slice(node.start, node.end);
};

const isComputerUseOverlaySettingKey = Function(
  `${slice("isComputerUseOverlaySettingKey")}; return isComputerUseOverlaySettingKey;`,
)();
for (const key of [
  "appearanceTheme",
  "appearanceLightChromeTheme",
  "appearanceDarkChromeTheme",
  "localeOverride",
]) equal(isComputerUseOverlaySettingKey(key), true);
equal(isComputerUseOverlaySettingKey("computerUseEnabled"), false);

const effectiveTheme = Function(`${slice("effectiveTheme")}; return effectiveTheme;`)();
equal(effectiveTheme("system", true), "dark");
equal(effectiveTheme("system", false), "light");
equal(effectiveTheme("dark", false), "dark");

const isValidAccentColor = Function(`${slice("isValidAccentColor")}; return isValidAccentColor;`)();
equal(isValidAccentColor("#339cff"), true);
equal(isValidAccentColor("#ABCDEF"), true);
equal(isValidAccentColor("339cff"), false);
equal(isValidAccentColor("#fff"), false);

const localeDirection = Function(`${slice("localeDirection")}; return localeDirection;`)();
equal(localeDirection("ar"), "rtl");
equal(localeDirection("en_US"), "ltr");
equal(localeDirection("not a locale"), "ltr");

equal(source.includes("automation-thread-config"), false);
equal(source.includes("const configWriteQueuesByPath = new Map<string, Promise<unknown>>()"), true);
equal(source.includes("if (configWriteQueuesByPath.get(configPath) === write)"), true);
equal(source.includes("await unlink(tmpPath).catch(() => {})"), true);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(
  main.includes('const { isComputerUseOverlaySettingKey: Fie, scheduleComputerUseConfigWrite: ns } = require("./main-app/computer-use/config-writer.js");'),
  true,
);
for (const name of ["Fie", "Iie", "ns", "Vie", "is"]) equal(main.includes(`function ${name}(`), false);
equal(main.includes("ns({ settingsStore: l, isPackaged: b, repoRoot: x });"), true);
equal(main.includes("    Fie,"), true);
equal(main.includes("    ns,"), true);

const consumer = fs.readFileSync(
  new URL("../src/main/main-app/fetch-handler/electron-fetch-handler.ts", import.meta.url),
  "utf8",
);
equal(consumer.includes("Fie(e) && ns({ settingsStore: C, repoRoot: this.repoRoot })"), true);
equal(consumer.includes("ns({ settingsStore: this.getSettingsStore(), repoRoot: this.repoRoot })"), true);

console.log(`${assertions} main computer-use config writer owner assertions passed`);
