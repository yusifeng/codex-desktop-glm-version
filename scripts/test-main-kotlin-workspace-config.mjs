#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { buildKotlinWorkspaceConfig } = require("../app/.vite/build/main-app/language-server/kotlin-workspace-config.js");

const root = `/workspace/project`;
assert.deepEqual(buildKotlinWorkspaceConfig(root), {
  kotlinSettings: [
    {
      additionalArguments: null,
      additionalVisibleModuleNames: [],
      compilerArguments: null,
      configFileItems: [],
      copyJsLibraryFiles: false,
      dependsOnModuleNames: [],
      externalProjectId: `workspace`,
      externalSystemRunTasks: [],
      flushNeeded: false,
      implementedModuleNames: [],
      isHmppEnabled: false,
      isTestModule: false,
      kind: `default`,
      module: `workspace`,
      name: `Kotlin`,
      outputDirectoryForJsLibraryFiles: null,
      productionOutputPath: null,
      pureKotlinSourceFolders: [root],
      scriptTemplates: null,
      scriptTemplatesClasspath: null,
      sourceRoots: [root],
      sourceSetNames: [],
      targetPlatform: null,
      testOutputPath: null,
      useProjectSettings: true,
      version: 5,
    },
  ],
  modules: [
    {
      contentRoots: [{ path: root, sourceRoots: [{ path: root, type: `java-source` }] }],
      dependencies: [{ type: `moduleSource` }, { type: `inheritedSdk` }],
      name: `workspace`,
    },
  ],
});

const a = buildKotlinWorkspaceConfig(`/a`);
const b = buildKotlinWorkspaceConfig(`/b`);
assert.notStrictEqual(a, b);
assert.notStrictEqual(a.kotlinSettings, b.kotlinSettings);
assert.notStrictEqual(a.modules, b.modules);
assert.equal(a.kotlinSettings[0].sourceRoots[0], `/a`);
assert.equal(b.modules[0].contentRoots[0].path, `/b`);
console.log(`2 main Kotlin workspace config assertions passed`);
