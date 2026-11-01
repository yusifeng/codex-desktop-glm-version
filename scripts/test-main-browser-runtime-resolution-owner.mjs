import assert from "node:assert/strict";
import fs from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { transform } from "esbuild";

const source = fs.readFileSync(
  new URL("../src/main/main-app/plugins/browser-runtime-resolution.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const nodeRequire = createRequire(import.meta.url);
const schema = () => {
  const value = {
    min: () => value,
    optional: () => value,
    parse: (input) => input,
    parseAsync: async (input) => input,
    refine: () => value,
    safeParse: (input) => ({ success: true, data: input }),
    trim: () => value,
  };
  return value;
};
const module = { exports: {} };
Function("require", "module", "exports", transpiled.code)(
  (specifier) => {
    if (specifier.startsWith("node:")) return nodeRequire(specifier);
    if (specifier === "@chunk/shared")
      return {
        A: () => false,
        Bi: (env) => env,
        Bc: () => true,
        Ef: schema,
        Fc: () => "chrome://extensions",
        I: ({ homeDir }) => join(homeDir, ".config"),
        Lc: () => ({ linux: { installations: [] }, macos: {}, windows: {} }),
        Mf: schema,
        Nf: schema,
        Of: schema,
        Pc: {},
        qn: { resolve: (name) => name },
        wf: schema,
        xf: schema,
        zc: () => [],
      };
    if (specifier === "@chunk/bootstrap")
      return {
        in: {
          Agent: "agent",
          Dev: "dev",
          InternalAlpha: "internal-alpha",
          Nightly: "nightly",
          Prod: "prod",
          PublicBeta: "public-beta",
        },
      };
    throw new Error(`unexpected require ${specifier}`);
  },
  module,
  module.exports,
);
const {
  applyBundledContentVariant,
  findSiblingFile,
  getBundledPluginsResourcesPath,
  getForcedReloadPluginNames,
  getRuntimeMarketplaceRoot,
  isComputerAudioEnabled,
  resolveDefaultBrowserCommand,
  resolveWindowsExecutable,
} = module.exports;

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

equal(
  getBundledPluginsResourcesPath({
    env: { CODEX_ELECTRON_BUNDLED_PLUGINS_RESOURCES_PATH: " /bundled/plugins " },
    resourcesPath: "/fallback",
  }),
  "/bundled/plugins",
);
equal(
  getRuntimeMarketplaceRoot({ codexHome: "/codex-home", marketplaceName: "internal" }),
  join("/codex-home", ".tmp", "bundled-marketplaces", "internal"),
);
equal(
  [...getForcedReloadPluginNames({
    env: { CODEX_ELECTRON_BUNDLED_PLUGINS_FORCE_RELOAD: "chrome, visualize  computer-use" },
  })],
  ["chrome", "visualize", "computer-use"],
);

const directory = await mkdtemp(join(tmpdir(), "codex-browser-runtime-"));
try {
  const executableBase = join(directory, "browser");
  await writeFile(executableBase, "shim");
  await writeFile(`${executableBase}.exe`, "binary");
  equal(resolveWindowsExecutable(executableBase), `${executableBase}.exe`);

  const binDirectory = join(directory, "application", "bin");
  await mkdir(binDirectory, { recursive: true });
  const launcher = join(binDirectory, "launcher");
  const sibling = join(directory, "application", "browser.exe");
  await writeFile(launcher, "launcher");
  await writeFile(sibling, "browser");
  equal(findSiblingFile(launcher, "browser.exe"), sibling);
  equal(
    resolveDefaultBrowserCommand({
      pathCommand: launcher,
      executableName: "browser.exe",
      installDirName: "unused",
    }),
    sibling,
  );

  const visualizeRoot = join(directory, "visualize");
  await mkdir(join(visualizeRoot, "skills", "live"), { recursive: true });
  await mkdir(join(visualizeRoot, ".codex-plugin"), { recursive: true });
  await writeFile(join(visualizeRoot, ".codex-plugin", "plugin.json"), "{\"name\":\"visualize\"}\n");
  await applyBundledContentVariant({
    pluginName: "visualize",
    pluginRoot: visualizeRoot,
    liveVisualizationSkillVariant: "live-disabled",
  });
  equal(fs.existsSync(join(visualizeRoot, "skills", "live")), false);
  equal(
    JSON.parse(await readFile(join(visualizeRoot, ".codex-plugin", "plugin.json"), "utf8")),
    { name: "visualize", bundledContentVariant: "live-disabled" },
  );

  const previousSkyAudio = process.env.SKY_ENABLE_AUDIO;
  const previousNodeAudio = process.env.NODE_REPL_ENABLE_AUDIO;
  process.env.SKY_ENABLE_AUDIO = "1";
  process.env.NODE_REPL_ENABLE_AUDIO = "1";
  try {
    equal(isComputerAudioEnabled(), true);
    const computerUseRoot = join(directory, "computer-use");
    await mkdir(join(computerUseRoot, "skills", "computer-use"), { recursive: true });
    await mkdir(join(computerUseRoot, ".codex-plugin"), { recursive: true });
    await writeFile(
      join(computerUseRoot, "skills", "computer-use", "SKILL.md"),
      "---\ndescription: Example skill\n---\n",
    );
    await writeFile(join(computerUseRoot, ".codex-plugin", "plugin.json"), "{\"name\":\"computer-use\"}\n");
    await applyBundledContentVariant({ pluginName: "computer-use", pluginRoot: computerUseRoot });
    const skill = await readFile(join(computerUseRoot, "skills", "computer-use", "SKILL.md"), "utf8");
    equal(skill.includes("description: Record computer audio. Example skill"), true);
    equal(skill.includes("await sky.start_audio_recording"), true);
    equal(
      JSON.parse(await readFile(join(computerUseRoot, ".codex-plugin", "plugin.json"), "utf8"))
        .bundledContentVariant,
      "audio",
    );
  } finally {
    if (previousSkyAudio == null) delete process.env.SKY_ENABLE_AUDIO;
    else process.env.SKY_ENABLE_AUDIO = previousSkyAudio;
    if (previousNodeAudio == null) delete process.env.NODE_REPL_ENABLE_AUDIO;
    else process.env.NODE_REPL_ENABLE_AUDIO = previousNodeAudio;
  }
} finally {
  await rm(directory, { force: true, recursive: true });
}

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/plugins/browser-runtime-resolution.js")'), true);
equal(main.includes("getBundledPluginsResourcesPath: Hi"), true);
equal(main.includes("applyBundledContentVariant: tre"), true);
equal(main.includes("var Cne = `CODEX_ELECTRON_BUNDLED_PLUGINS_RESOURCES_PATH`"), false);
equal(main.includes("function Qne("), false);
equal(main.includes("async function tre("), false);
const orchestrator = fs.readFileSync(new URL("../src/main/main-app/plugins/orchestrator.ts", import.meta.url), "utf8");
const marketplace = fs.readFileSync(new URL("../src/main/main-app/plugins/marketplace.ts", import.meta.url), "utf8");
equal(orchestrator.includes("getBundledPluginsResourcesPath({ env })"), true);
equal(marketplace.includes("await applyBundledContentVariant({"), true);

console.log(`${assertions} main browser runtime resolution owner assertions passed`);
