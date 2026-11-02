import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import * as esbuild from "esbuild";

const entryPoints = {
  "clamp-within-range": "src/renderer/app-shared/runtime/clamp-within-range.ts",
  "command-metadata-policy": "src/renderer/app-shared/runtime/command-metadata-policy.ts",
  "path-key-policy": "src/renderer/app-shared/runtime/path-key-policy.ts",
  "point-geometry": "src/renderer/app-shared/runtime/point-geometry.ts",
  "project-appearance-policy": "src/renderer/app-shared/runtime/project-appearance-policy.ts",
  "svg-data-url": "src/renderer/app-shared/runtime/svg-data-url.ts",
};
const modules = Object.fromEntries(await Promise.all(Object.entries(entryPoints).map(async ([name, entryPoint]) => {
  const result = await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
  });
  return [name, await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`)];
})));

let assertions = 0;
const equal = (actual, expected) => {
  assertions += 1;
  assert.deepEqual(actual, expected);
};

const svg = modules["svg-data-url"];
equal(svg.encodeSvgDataUrl('<svg fill="#fff"></svg>'), "data:image/svg+xml;utf8,%3Csvg%20fill%3D%22%23fff%22%3E%3C%2Fsvg%3E");

const commands = modules["command-metadata-policy"];
equal(commands.hasDescriptionIntlId({ descriptionIntlId: "command.description" }), true);
equal(commands.hasDescriptionIntlId({ description: "plain" }), false);
equal(commands.allowsBareOsGlobalModifiers({ shortcutScope: "os-global", allowsBareModifiers: true }), true);
equal(commands.allowsBareOsGlobalModifiers({ shortcutScope: "os-global", allowsBareModifiers: false }), false);
equal(commands.allowsBareOsGlobalModifiers({ shortcutScope: "app", allowsBareModifiers: true }), false);
equal(commands.getPrimaryModifierPressed({ ctrlKey: false, metaKey: true }, "MacIntel"), true);
equal(commands.getPrimaryModifierPressed({ ctrlKey: true, metaKey: false }, "Win32"), true);
equal(commands.getPrimaryModifierPressed({ ctrlKey: false, metaKey: true }, "Linux"), false);
equal(commands.isNavigationMouseButton("MouseBack"), true);
equal(commands.isNavigationMouseButton("MouseForward"), true);
equal(commands.isNavigationMouseButton("MouseMiddle"), false);
equal(commands.isWebviewCommandMenu({ kind: "webview", commandMenu: true }), true);
equal(commands.isWebviewCommandMenu({ kind: "webview", commandMenu: false }), false);
equal(commands.isWebviewCommandMenu({ kind: "native", commandMenu: true }), false);

const paths = modules["path-key-policy"];
equal(paths.joinPathFragments("/root/", "/child"), "/root/child");
equal(paths.joinPathFragments("/root", ""), "/root");
equal(paths.joinPathFragments("", "child"), "child");
equal(paths.stripExtendedWindowsPathPrefix("\\\\?\\C:\\Work\\Repo"), "C:\\Work\\Repo");
equal(paths.stripExtendedWindowsPathPrefix("\\\\?\\UNC\\Server\\Share"), "\\\\Server\\Share");
equal(paths.stripExtendedWindowsPathPrefix("C:\\Work"), "C:\\Work");
equal(paths.getLastTwoPathSegments("C:\\Work\\Repo\\file.ts"), "Repo/file.ts");
equal(paths.getLastTwoPathSegments("/file.ts"), "file.ts");
const appearances = modules["project-appearance-policy"];
const original = { one: "blue", two: "red" };
equal(appearances.updateProjectAppearance({ projectAppearances: original, projectId: "one", appearance: "green" }), { one: "green", two: "red" });
equal(appearances.updateProjectAppearance({ projectAppearances: original, projectId: "one", appearance: null }), { two: "red" });
equal(original, { one: "blue", two: "red" });

const numbers = modules["clamp-within-range"];
equal(numbers.clampWithinRange(-1, 0, 10), 0);
equal(numbers.clampWithinRange(5, 0, 10), 5);
equal(numbers.clampWithinRange(11, 0, 10), 10);
equal(numbers.clampWithinRange(5, 10, 0), 10);
equal(numbers.clampZoomPercent(20), 25);
equal(numbers.clampZoomPercent(100), 100);
equal(numbers.clampZoomPercent(600), 500);

const geometry = modules["point-geometry"];
equal(geometry.getPointDistance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
equal(geometry.getPointDistance({ x: -2, y: 7 }, { x: -2, y: 7 }), 0);

console.log(`app-shared path/command policy cluster: ${assertions} assertions passed`);
