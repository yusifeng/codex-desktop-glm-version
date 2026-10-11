export function buildKotlinWorkspaceConfig(workspaceRoot: string) {
  return {
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
        pureKotlinSourceFolders: [workspaceRoot],
        scriptTemplates: null,
        scriptTemplatesClasspath: null,
        sourceRoots: [workspaceRoot],
        sourceSetNames: [],
        targetPlatform: null,
        testOutputPath: null,
        useProjectSettings: true,
        version: 5,
      },
    ],
    modules: [
      {
        contentRoots: [{ path: workspaceRoot, sourceRoots: [{ path: workspaceRoot, type: `java-source` }] }],
        dependencies: [{ type: `moduleSource` }, { type: `inheritedSdk` }],
        name: `workspace`,
      },
    ],
  };
}

if (typeof module !== `undefined`) module.exports = { buildKotlinWorkspaceConfig };
