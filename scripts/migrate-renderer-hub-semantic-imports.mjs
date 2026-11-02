#!/usr/bin/env node
// Move evidence-backed, single-export business helpers off the three aggregate
// renderer hubs.  This is deliberately conservative: multi-export owners and
// UI/runtime initializers keep their compressed ABI until their exact mapping
// has been recovered separately.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RENDERER = path.join(ROOT, "src/renderer");
const CLASSIFICATIONS = path.join(ROOT, "docs/renderer-hub-line-classification.json");
const HUBS = ["app-shared", "app-initial", "app-primary"];
const WRITE = process.argv.includes("--write");
const CHECK = process.argv.includes("--check");
const EXPLICIT_EXPORTS = new Map([
  ["app-shared:EJ", ["src/renderer/app-shared/runtime/non-empty-collection.ts", "hasItems"]],
  ["app-shared:HK", ["src/renderer/app-shared/runtime/path-key-policy.ts", "isWindowsDrivePath"]],
  ["app-shared:BI", ["src/renderer/app-shared/runtime/path-key-policy.ts", "createCaseInsensitivePathKey"]],
  ["app-shared:Hp", ["src/renderer/app-shared/runtime/shortcut-scope-policy.ts", "isOsGlobalShortcut"]],
  ["app-shared:I_", ["src/renderer/app-shared/runtime/svg-data-url.ts", "encodeSvgDataUrl"]],
  ["app-shared:Ip", ["src/renderer/app-shared/runtime/command-metadata-policy.ts", "hasDescriptionIntlId"]],
  ["app-shared:Mp", ["src/renderer/app-shared/runtime/command-metadata-policy.ts", "allowsBareOsGlobalModifiers"]],
  ["app-shared:Qm", ["src/renderer/app-shared/runtime/command-metadata-policy.ts", "getPrimaryModifierPressed"]],
  ["app-shared:Vp", ["src/renderer/app-shared/runtime/command-metadata-policy.ts", "isNavigationMouseButton"]],
  ["app-shared:Wp", ["src/renderer/app-shared/runtime/command-metadata-policy.ts", "isWebviewCommandMenu"]],
  ["app-shared:GK", ["src/renderer/app-shared/runtime/path-key-policy.ts", "joinPathFragments"]],
  ["app-shared:LI", ["src/renderer/app-shared/runtime/path-key-policy.ts", "getLastTwoPathSegments"]],
  ["app-shared:YK", ["src/renderer/app-shared/runtime/path-key-policy.ts", "stripExtendedWindowsPathPrefix"]],
  ["app-shared:IV", ["src/renderer/app-shared/runtime/project-appearance-policy.ts", "updateProjectAppearance"]],
  ["app-shared:KO", ["src/renderer/app-shared/runtime/clamp-within-range.ts", "clampWithinRange"]],
  ["app-shared:$G", ["src/renderer/app-shared/runtime/clamp-within-range.ts", "clampZoomPercent"]],
  ["app-shared:XO", ["src/renderer/app-shared/runtime/point-geometry.ts", "getPointDistance"]],
  ["app-shared:VI", ["src/renderer/app-shared/runtime/path-key-policy.ts", "normalizePathSeparators"]],
  ["app-shared:BK", ["src/renderer/app-shared/runtime/path-key-policy.ts", "isAbsolutePath"]],
  ["app-shared:HI", ["src/renderer/app-shared/runtime/path-key-policy.ts", "resolvePath"]],
  ["app-shared:PI", ["src/renderer/app-shared/runtime/path-key-policy.ts", "resolveDisplayPath"]],
  ["app-shared:IK", ["src/renderer/app-shared/runtime/path-key-policy.ts", "areEquivalentPaths"]],
  ["app-shared:UB", ["src/renderer/app-shared/runtime/navigation-route-policy.ts", "createHotkeyThreadRoute"]],
  ["app-shared:WB", ["src/renderer/app-shared/runtime/navigation-route-policy.ts", "createLocalConversationRoute"]],
  ["app-shared:KB", ["src/renderer/app-shared/runtime/navigation-route-policy.ts", "createMcpAppRoute"]],
  ["app-shared:qB", ["src/renderer/app-shared/runtime/navigation-route-policy.ts", "createPluginSettingsRoute"]],
  ["app-shared:Qq", ["src/renderer/app-shared/runtime/runtime-identifier-policy.ts", "createClientNewThreadId"]],
  ["app-shared:rJ", ["src/renderer/app-shared/runtime/runtime-identifier-policy.ts", "isClientNewThreadId"]],
  ["app-shared:tU", ["src/renderer/app-shared/runtime/runtime-identifier-policy.ts", "createRuntimeUuid"]],
  ["app-shared:eV", ["src/renderer/app-shared/runtime/runtime-identifier-policy.ts", "getPackageSourceSuffix"]],
  ["app-shared:yH", ["src/renderer/app-shared/runtime/non-empty-collection.ts", "firstOrNull"]],
  ["app-shared:AG", ["src/renderer/app-shared/runtime/build-extension-channel-path.ts", "buildChromeExtensionStoreUrl"]],
  ["app-shared:HB", ["src/renderer/app-shared/runtime/navigation-route-policy.ts", "createHotkeyRemoteRoute"]],
  ["app-shared:VB", ["src/renderer/app-shared/runtime/navigation-route-policy.ts", "createComputerAssistantRoute"]],
  ["app-shared:XB", ["src/renderer/app-shared/runtime/navigation-route-policy.ts", "createRemoteConversationRoute"]],
  ["app-shared:JB", ["src/renderer/app-shared/runtime/navigation-route-policy.ts", "createPluginRoute"]],
  ["app-shared:GB", ["src/renderer/app-shared/runtime/navigation-route-policy.ts", "createManagedPluginRoute"]],
  ["app-shared:YB", ["src/renderer/app-shared/runtime/navigation-route-policy.ts", "createMcpPluginRoute"]],
  ["app-shared:uV", ["src/renderer/app-shared/runtime/navigation-route-policy.ts", "parseSkillsRoute"]],
  ["app-shared:cV", ["src/renderer/app-shared/runtime/navigation-route-policy.ts", "parseConversationRoute"]],
  ["app-shared:nV", ["src/renderer/app-shared/runtime/navigation-route-policy.ts", "isPluginId"]],
  ["app-shared:oV", ["src/renderer/app-shared/runtime/navigation-route-policy.ts", "areEquivalentPluginIds"]],
  ["app-shared:WK", ["src/renderer/app-shared/runtime/path-key-policy.ts", "joinPlatformPath"]],
  ["app-shared:NR", ["src/renderer/app-shared/runtime/file-predicates.ts", "isImageFile"]],
  ["app-shared:sJ", ["src/renderer/app-shared/runtime/file-predicates.ts", "isFileLargerThanUploadLimit"]],
  ["app-shared:qp", ["src/renderer/app-shared/runtime/command-metadata-policy.ts", "isCommandAvailableIn"]],
  ["app-shared:Up", ["src/renderer/app-shared/runtime/command-metadata-policy.ts", "isCommandShortcutConfigurable"]],
  ["app-shared:PK", ["src/renderer/app-shared/runtime/local-url-policy.ts", "isSafeLocalUrl"]],
  ["app-shared:pG", ["src/renderer/app-shared/runtime/deferred.ts", "createDeferred"]],
  ["app-shared:xp", ["src/renderer/app-shared/runtime/keyboard-shortcut-label.ts", "formatKeyboardShortcut"]],
  ["app-initial:w$t", ["src/renderer/app-initial/runtime/flatten-conversation-items.ts", "flattenConversationItems"]],
  ["app-initial:Asn", ["src/renderer/app-initial/runtime/parse-http-url.ts", "parseHttpUrl"]],
  ["app-initial:Fsn", ["src/renderer/app-initial/runtime/parse-origin-pattern.ts", "domainMatchesPattern"]],
  ["app-initial:ksn", ["src/renderer/app-initial/runtime/parse-origin-pattern.ts", "originPatternsMatch"]],
  ["app-initial:Nsn", ["src/renderer/app-initial/runtime/parse-origin-pattern.ts", "parseOriginPattern"]],
  ["app-initial:$ln", ["src/renderer/app-initial/runtime/create-command-query-key.ts", "createCommandQueryKey"]],
  ["app-initial:mEt", ["src/renderer/app-initial/runtime/electron-command-policy.ts", "isElectronCommandEnabled"]],
  ["app-initial:Kdn", ["src/renderer/app-initial/runtime/select-writable-configuration-layer.ts", "selectWritableConfigurationLayer"]],
  ["app-initial:Jsn", ["src/renderer/app-initial/runtime/configuration-query-key.ts", "configurationQueryKey"]],
  ["app-initial:Dhn", ["src/renderer/app-initial/runtime/canonical-history.ts", "getCanonicalHistoryEntries"]],
  ["app-initial:dHt", ["src/renderer/app-initial/runtime/is-terminal-conversation-status.ts", "isTerminalConversationStatus"]],
  ["app-initial:Wpn", ["src/renderer/app-initial/runtime/markdown-links.ts", "findNextMarkdownLink"]],
  ["app-initial:qpn", ["src/renderer/app-initial/runtime/markdown-links.ts", "unescapeMarkdownPunctuation"]],
  ["app-shared:h4", ["src/renderer/app-shared/ui/class-names.ts", "initializeClassNames"]],
  ["app-shared:m4", ["src/renderer/app-shared/ui/class-names.ts", "classNames"]],
  ["app-shared:_H", ["src/renderer/app-shared/runtime/parse-git-remote-url.ts", "parseGitRemoteUrl"]],
  ["app-shared:hq", ["src/renderer/app-shared/runtime/is-web-mcp-server.ts", "isWebMcpServer"]],
  ["app-shared:zp", ["src/renderer/app-shared/runtime/command-visibility-predicates.ts", "hasRequiredCommandAccess"]],
  ["app-shared:KH", ["src/renderer/app-shared/runtime/sandbox-url.ts", "createSandboxPartition"]],
  ["app-shared:YH", ["src/renderer/app-shared/runtime/sandbox-url.ts", "initializeSandboxUrls"]],
  ["app-shared:RH", ["src/renderer/app-shared/runtime/sandbox-url.ts", "parseSandboxResourceActivities"]],
  ["app-shared:qH", ["src/renderer/app-shared/runtime/sandbox-url.ts", "getTrustedSandboxOrigin"]],
  ["app-shared:hU", ["src/renderer/app-shared/runtime/file-predicates.ts", "isLibraryFileId"]],
  ["app-shared:TX", ["src/renderer/app-shared/runtime/codex-micro-config.ts", "getCodexMicroIdleTimeoutMs"]],
  ["app-shared:_j", ["src/renderer/app-shared/runtime/fast-mode-analytics-events.ts", "FAST_MODE_BANNER_CTA_CLICKED"]],
  ["app-shared:vj", ["src/renderer/app-shared/runtime/fast-mode-analytics-events.ts", "FAST_MODE_BANNER_DISMISSED"]],
  ["app-shared:yj", ["src/renderer/app-shared/runtime/fast-mode-analytics-events.ts", "FAST_MODE_BANNER_VIEWED"]],
  ["app-shared:kz", ["src/renderer/app-shared/runtime/service-tiers.ts", "findFastServiceTier"]],
  ["app-shared:XY", ["src/renderer/app-shared/runtime/suggestion-targeting.ts", "isScienceSuggestionModel"]],
  ["app-shared:JY", ["src/renderer/app-shared/runtime/suggestion-targeting.ts", "getSuggestionTarget"]],
  ["app-shared:TU", ["src/renderer/app-shared/runtime/worktree-settings.ts", "worktreeSettings"]],
  ["app-shared:SU", ["src/renderer/app-shared/runtime/worktree-settings.ts", "resolveWorktreeSettings"]],
  ["app-shared:NX", ["src/renderer/app-shared/runtime/codex-links.ts", "CODEX_WEB_URL"]],
  ["app-shared:fW", ["src/renderer/app-shared/runtime/request-protocol.ts", "ATTACH_AUTH_HEADER"]],
  ["app-shared:vW", ["src/renderer/app-shared/runtime/request-protocol.ts", "EXPECTED_ACCOUNT_ID_HEADER"]],
  ["app-shared:EU", ["src/renderer/app-shared/runtime/git-settings.ts", "gitSettings"]],
  ["app-shared:Tz", ["src/renderer/app-shared/runtime/ambient-suggestion-settings.ts", "ambientSuggestionSettings"]],
  ["app-shared:if", ["src/renderer/app-shared/runtime/mounted-state.ts", "useIsMounted"]],
  ["app-shared:rf", ["src/renderer/app-shared/runtime/mounted-state.ts", "initializeMountedState"]],
  ["app-shared:pL", ["src/renderer/app-shared/runtime/query-options.ts", "queryOptions"]],
  ["app-shared:uL", ["src/renderer/app-shared/runtime/query-options.ts", "infiniteQueryOptions"]],
  ["app-shared:nL", ["src/renderer/app-shared/runtime/query-options.ts", "mutationOptions"]],
  ["app-shared:DF", ["src/renderer/app-shared/runtime/sites-sharing-source.ts", "sitesSharingSources"]],
  ["app-shared:Bk", ["src/renderer/app-shared/runtime/appgen-interaction-action.ts", "appgenInteractionActions"]],
  ["app-shared:Hk", ["src/renderer/app-shared/runtime/appgen-interaction-source.ts", "appgenInteractionSources"]],
  ["app-shared:Vk", ["src/renderer/app-shared/runtime/appgen-interaction-page.ts", "appgenInteractionPages"]],
  ["app-shared:zY", ["src/renderer/app-shared/runtime/automation-models.ts", "isHeartbeatAutomation"]],
  ["app-shared:LY", ["src/renderer/app-shared/runtime/automation-models.ts", "resolveSupportedReasoningEffort"]],
  ["app-shared:dX", ["src/renderer/app-shared/runtime/permission-profiles.ts", "getBooleanFeatureFlag"]],
  ["app-shared:tX", ["src/renderer/app-shared/runtime/permission-profiles.ts", "createWorkspaceWritePermissionState"]],
  ["app-shared:fX", ["src/renderer/app-shared/runtime/permission-profiles.ts", "isGuardianApprovalEnabled"]],
  ["app-shared:$Y", ["src/renderer/app-shared/runtime/permission-profiles.ts", "createPermissionStateForPreset"]],
  ["app-shared:aX", ["src/renderer/app-shared/runtime/permission-profiles.ts", "getRuntimeWorkspaceRoots"]],
  ["app-shared:oX", ["src/renderer/app-shared/runtime/permission-profiles.ts", "getPermissionRuntimeSelector"]],
  ["app-shared:cX", ["src/renderer/app-shared/runtime/permission-profiles.ts", "isPermissionPresetAllowed"]],
  ["app-primary:yf", ["src/renderer/app-primary/runtime/is-site-url-match.ts", "isSiteUrlMatch"]],
  ["app-primary:vg", ["src/renderer/app-primary/runtime/extract-skill-kind.ts", "extractSkillKindFromDocument"]],
  ["app-primary:yg", ["src/renderer/app-primary/runtime/extract-skill-kind.ts", "extractSkillKindFromPrompt"]],
  ["app-primary:Qm", ["src/renderer/app-primary/runtime/action-url-policy.ts", "isAllowedActionUrl"]],
  ["app-primary:Zm", ["src/renderer/app-primary/runtime/action-url-policy.ts", "isTasksLocalAction"]],
  ["app-primary:$m", ["src/renderer/app-primary/runtime/action-url-policy.ts", "isAbsoluteHttpUrl"]],
  ["app-primary:T", ["src/renderer/app-primary/runtime/project-target-policy.ts", "isGitBackedProjectTarget"]],
  ["app-primary:Cl", ["src/renderer/app-primary/runtime/thread-navigation-keys.ts", "getThreadSearchKey"]],
  ["app-primary:Ih", ["src/renderer/app-primary/runtime/thread-navigation-keys.ts", "createNavigationCacheKey"]],
  ["app-primary:Gl", ["src/renderer/app-primary/runtime/mcp-extension-policy.ts", "isMcpExtensionKind"]],
  ["app-primary:Tc", ["src/renderer/app-primary/runtime/device-onboarding-policy.ts", "shouldShowDeviceOnboarding"]],
  ["app-primary:$c", ["src/renderer/app-primary/runtime/annotation-anchor-point.ts", "getAnnotationAnchorPoint"]],
  ["app-primary:jc", ["src/renderer/app-primary/runtime/platform-shortcut-label.ts", "getPlatformCommandShortcutLabel"]],
  ["app-primary:Cp", ["src/renderer/app-primary/runtime/multi-agent-config.ts", "getMaxConcurrentThreadsPerSession"]],
  ["app-primary:$p", ["src/renderer/app-primary/runtime/availability-status.ts", "getEligibilityStatus"]],
  ["app-primary:Eh", ["src/renderer/app-primary/runtime/availability-status.ts", "getTakeoverAvailabilityStatus"]],
  ["app-primary:Ig", ["src/renderer/app-primary/runtime/cyclic-selection.ts", "selectCyclicItem"]],
  ["app-primary:Dd", ["src/renderer/app-primary/runtime/message-projections.ts", "isMessageSendPresented"]],
  ["app-primary:Cd", ["src/renderer/app-primary/runtime/message-projections.ts", "getSenderLinkId"]],
  ["app-primary:zf", ["src/renderer/app-primary/runtime/prompt-and-markdown-policy.ts", "getFirstPrompt"]],
  ["app-primary:Su", ["src/renderer/app-primary/runtime/prompt-and-markdown-policy.ts", "stripMarkdownExtension"]],
  ["app-primary:Fd", ["src/renderer/app-primary/runtime/normalize-recipient-fields.ts", "parseDelimitedRecipients"]],
  ["app-primary:Md", ["src/renderer/app-primary/runtime/normalize-recipient-fields.ts", "normalizeRecipientContacts"]],
  ["app-primary:Nd", ["src/renderer/app-primary/runtime/normalize-recipient-fields.ts", "findContactIdByOwnerEmail"]],
  ["app-primary:Ld", ["src/renderer/app-primary/runtime/normalize-recipient-fields.ts", "formatRecipientField"]],
  ["app-primary:Ud", ["src/renderer/app-primary/runtime/normalize-recipient-fields.ts", "mergeRecipientInput"]],
  ["app-primary:Ct", ["src/renderer/app-primary/runtime/plan-selection-surface.ts", "PLAN_SELECTION_SURFACE_ATTRIBUTE"]],
  ["app-primary:Df", ["src/renderer/app-primary/runtime/panel-target-policy.ts", "getPreferredPanelTarget"]],
  ["app-primary:Hd", ["src/renderer/app-primary/runtime/normalize-recipient-fields.ts", "parseRecipientField"]],
  ["app-primary:Id", ["src/renderer/app-primary/runtime/normalize-recipient-fields.ts", "projectRecipientContacts"]],
  ["app-primary:Hi", ["src/renderer/app-primary/runtime/is-browser-comment-for-tab.ts", "isBrowserCommentForTab"]],
  ["app-primary:Gs", ["src/renderer/app-primary-browser-comment-runtime/index.ts", "subscribeBrowserCommentReadiness"]],
  ["app-primary:Bs", ["src/renderer/app-primary-browser-comment-runtime/index.ts", "setBrowserTabUrlState"]],
  ["app-primary:Rs", ["src/renderer/app-primary-browser-comment-runtime/index.ts", "getBrowserTabUrlState"]],
  ["app-primary:Us", ["src/renderer/app-primary-browser-comment-runtime/index.ts", "hasBrowserCommentHandler"]],
  ["app-primary:Hs", ["src/renderer/app-primary-browser-comment-runtime/index.ts", "resolveBrowserContext"]],
  ["app-primary:Ks", ["src/renderer/app-primary-browser-comment-runtime/index.ts", "waitForBrowserCommentHandler"]],
  ["app-primary:Vs", ["src/renderer/app-primary-browser-comment-runtime/index.ts", "submitBrowserComment"]],
  ["app-primary:cf", ["src/renderer/app-primary/runtime/browser-sidebar-submit-contract.ts", "getBrowserSidebarSubmitStarted"]],
  ["app-primary:of", ["src/renderer/app-primary/runtime/browser-sidebar-submit-contract.ts", "getBrowserSidebarSubmitAvailability"]],
  ["app-primary:lf", ["src/renderer/app-primary/runtime/browser-sidebar-submit-contract.ts", "subscribeBrowserSidebarSubmitAvailability"]],
  ["app-primary:_p", ["src/renderer/app-primary/runtime/submission-state-policy.ts", "getNonSuccessSubmissionState"]],
  ["app-primary:Nt", ["src/renderer/app-primary/runtime/submission-state-policy.ts", "toggleComposerWorktreeMode"]],
  ["app-primary:yp", ["src/renderer/app-primary/runtime/submission-state-policy.ts", "matchesDestinationHostWorktreeOperation"]],
  ["app-primary:ih", ["src/renderer/app-primary/runtime/checkout-return-path-policy.ts", "resolveCheckoutReturnPath"]],
  ["app-primary:ch", ["src/renderer/app-primary/runtime/checkout-return-path-policy.ts", "applyCheckoutReturnPath"]],
  ["app-primary:im", ["src/renderer/app-primary/runtime/connector-link-policy.ts", "hasConnectorLink"]],
  ["app-primary:tc", ["src/renderer/app-primary/runtime/save-shortcut-policy.ts", "handleCmdOrCtrlSave"]],
  ["app-primary:qg", ["src/renderer/app-primary/runtime/annotation-color-policy.ts", "getAnnotationAccentColor"]],
  ["app-primary:Yg", ["src/renderer/app-primary/runtime/annotation-color-policy.ts", "formatAnnotationRgbColor"]],
  ["app-primary:Jg", ["src/renderer/app-primary/runtime/annotation-color-policy.ts", "formatAnnotationMutedColor"]],
  ["app-primary:Cm", ["src/renderer/app-primary/runtime/home-announcement-banner.ts", "initializeHomeAnnouncementBanner"]],
  ["app-primary:Sm", ["src/renderer/app-primary/runtime/home-announcement-banner.ts", "HomeAnnouncementBanner"]],
  ["app-primary:Ip", ["src/renderer/app-primary/runtime/gpt-plugin-migration-state.ts", "migrationNoticeDismissed"]],
  ["app-primary:Lp", ["src/renderer/app-primary/runtime/gpt-plugin-migration-state.ts", "initializeGptPluginMigrationState"]],
  ["app-primary:Mp", ["src/renderer/app-primary/runtime/gpt-plugin-migration-state.ts", "markGptPluginMigrationContinued"]],
  ["app-primary:Np", ["src/renderer/app-primary/runtime/gpt-plugin-migration-state.ts", "dismissGptPluginMigrationNotice"]],
  ["app-primary:Pp", ["src/renderer/app-primary/runtime/gpt-plugin-migration-state.ts", "migrationVisitEligible"]],
]);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === "types" ? [] : walk(file);
    return entry.isFile() && /\.tsx?$/.test(entry.name) ? [file] : [];
  });
}

function valueExports(modulePath) {
  const source = fs.readFileSync(modulePath, "utf8");
  const exports = new Set(
    [...source.matchAll(/export\s+(?:async\s+)?(?:function|const|class|let|var)\s+([A-Za-z_$][\w$]*)/g)]
      .map((match) => match[1]),
  );
  for (const match of source.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const part of match[1].split(",")) {
      const binding = part.trim().match(/^(?:[A-Za-z_$][\w$]*\s+as\s+)?([A-Za-z_$][\w$]*)$/);
      if (binding) exports.add(binding[1]);
    }
  }
  return [...exports];
}

const classifications = JSON.parse(fs.readFileSync(CLASSIFICATIONS, "utf8"));
const eligible = new Map();
for (const entry of classifications) {
  if (entry.classification !== "semantic-business-logic") continue;
  // Runtime owners are focused semantic modules. Recovered chunk entrypoints
  // can contain one public export while owning several unrelated hub aliases,
  // so they are intentionally outside this mechanical migration.
  if (!entry.module.includes("/runtime/")) continue;
  const modulePath = path.join(ROOT, entry.module);
  const exports = valueExports(modulePath);
  if (exports.length !== 1) continue;
  eligible.set(`${entry.hub}:${entry.alias}`, {
    modulePath,
    exportName: exports[0],
  });
}
for (const [key, [module, exportName]] of EXPLICIT_EXPORTS) {
  eligible.set(key, { modulePath: path.join(ROOT, module), exportName });
}

function relativeModule(fromFile, targetFile) {
  let relative = path.relative(path.dirname(fromFile), targetFile).replaceAll(path.sep, "/");
  relative = relative.replace(/\.tsx?$/, "");
  return relative.startsWith(".") ? relative : `./${relative}`;
}

let changedFiles = 0;
let migratedBindings = 0;
const migratedAliases = new Set();

for (const file of walk(RENDERER)) {
  const original = fs.readFileSync(file, "utf8");
  const additions = new Map();
  let source = original;

  for (const hub of HUBS) {
    const importPattern = new RegExp(
      `import\\s*\\{([^}]*)\\}\\s*from\\s*["']@rchunk/${hub}["'];?`,
      "g",
    );
    source = source.replace(importPattern, (statement, body) => {
      const retained = [];
      for (const rawPart of body.split(",")) {
        const part = rawPart.trim();
        if (!part) continue;
        const binding = part.match(/^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/);
        const migration = binding && eligible.get(`${hub}:${binding[1]}`);
        if (!migration || path.resolve(file) === path.resolve(migration.modulePath)) {
          retained.push(part);
          continue;
        }
        const localName = binding[2] ?? binding[1];
        const moduleName = relativeModule(file, migration.modulePath);
        const imports = additions.get(moduleName) ?? [];
        imports.push(
          migration.exportName === localName
            ? migration.exportName
            : `${migration.exportName} as ${localName}`,
        );
        additions.set(moduleName, imports);
        migratedBindings += 1;
        migratedAliases.add(`${hub}:${binding[1]}`);
      }
      if (retained.length === 0) return "";
      return `import {\n${retained.map((part) => `  ${part},`).join("\n")}\n} from "@rchunk/${hub}";`;
    });
  }

  if (additions.size === 0) continue;
  const semanticImports = [...additions]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([moduleName, imports]) => `import { ${[...new Set(imports)].sort().join(", ")} } from "${moduleName}";`)
    .join("\n");
  const firstImport = source.search(/^import\s/m);
  source = firstImport === -1
    ? `${semanticImports}\n${source}`
    : `${source.slice(0, firstImport)}${semanticImports}\n${source.slice(firstImport)}`;
  changedFiles += 1;
  if (WRITE) fs.writeFileSync(file, source);
}

console.log(
  `${WRITE ? "migrated" : "would migrate"} ${migratedBindings} bindings across ${changedFiles} files; ` +
    `${migratedAliases.size}/${eligible.size} eligible compressed aliases removed from direct imports`,
);
if (CHECK && migratedBindings > 0) process.exitCode = 1;
