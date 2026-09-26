// browser-profile-import-analytics —— 浏览器资料导入流程的分析事件协议。
// 原版：app/webview/assets/analytics-363d04057f73.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import type { MaitaiScopeApi } from "@rchunk/app-shared";

void runtimeChunk;
const { Q3: logger, Z3: initializeQueryRuntime } = appSharedChunk;
const {
  Bs: entryPointEnums,
  Fs: cookieItemResultEnums,
  Gs: sourceEnums,
  Hs: lifecycleStepEnums,
  Is: cookieStatusEnums,
  Ks: initializeAnalyticsEnums,
  Ls: dataOutcomeEnums,
  Rs: exitStateEnums,
  Us: passwordStatusEnums,
  Ux: isImportFailure,
  Vs: browserProfileImportEvent,
  Ws: requestOutcomeEnums,
  qx: initializeBrowserImportRuntime,
  xpn: emitAnalyticsEvent,
  ypn: initializeAnalyticsEmitter,
  zs: dismissalReasonEnums,
} = appInitialChunk;

type ImportSource = "atlas" | "chrome";
type EntryPoint =
  | "browser-settings-page"
  | "in-app-browser-import-banner"
  | "in-app-browser-import-modal"
  | "in-app-browser-overflow-menu";

type ImportRequest = {
  source: ImportSource;
  importCookies?: boolean;
  importPasswords?: boolean;
  importExtensions?: boolean;
};

type AttemptContext = {
  flowId: string;
  attemptIndex: number;
  windowsChromeAdminApprovalNoticeRequired?: boolean;
  windowsChromeAdminApprovalNoticeAcknowledged?: boolean;
};

type ImportData = {
  status?: string;
  imported?: number;
  failed?: number;
  profile?: ImportData;
  account?: ImportData;
};

type ImportResult = {
  cookies?: ImportData;
  passwords?: ImportData;
  extensions?: ImportData;
};

const ENTRY_POINTS: Record<EntryPoint, string> = {
  "browser-settings-page":
    "CODEX_BROWSER_PROFILE_IMPORT_ENTRY_POINT_BROWSER_SETTINGS_PAGE",
  "in-app-browser-import-banner":
    "CODEX_BROWSER_PROFILE_IMPORT_ENTRY_POINT_IN_APP_BROWSER_IMPORT_BANNER",
  "in-app-browser-import-modal":
    "CODEX_BROWSER_PROFILE_IMPORT_ENTRY_POINT_IN_APP_BROWSER_IMPORT_MODAL",
  "in-app-browser-overflow-menu":
    "CODEX_BROWSER_PROFILE_IMPORT_ENTRY_POINT_IN_APP_BROWSER_OVERFLOW_MENU",
};

const DISMISSAL_REASONS: Record<string, string> = {
  backdrop: "CODEX_BROWSER_PROFILE_IMPORT_DISMISSAL_REASON_BACKDROP",
  "secondary-button":
    "CODEX_BROWSER_PROFILE_IMPORT_DISMISSAL_REASON_SECONDARY_BUTTON",
  "close-button": "CODEX_BROWSER_PROFILE_IMPORT_DISMISSAL_REASON_CLOSE_BUTTON",
  "escape-key": "CODEX_BROWSER_PROFILE_IMPORT_DISMISSAL_REASON_ESCAPE_KEY",
  programmatic: "CODEX_BROWSER_PROFILE_IMPORT_DISMISSAL_REASON_PROGRAMMATIC",
  "done-button": "CODEX_BROWSER_PROFILE_IMPORT_DISMISSAL_REASON_DONE_BUTTON",
};

const SOURCES: Record<ImportSource, string> = {
  atlas: "CODEX_BROWSER_PROFILE_IMPORT_SOURCE_ATLAS",
  chrome: "CODEX_BROWSER_PROFILE_IMPORT_SOURCE_CHROME",
};

const EXIT_STATES: Record<string, string> = {
  "before-attempt":
    "CODEX_BROWSER_PROFILE_IMPORT_DIALOG_EXIT_STATE_BEFORE_ATTEMPT",
  "after-request-error":
    "CODEX_BROWSER_PROFILE_IMPORT_DIALOG_EXIT_STATE_AFTER_REQUEST_ERROR",
  "after-result": "CODEX_BROWSER_PROFILE_IMPORT_DIALOG_EXIT_STATE_AFTER_RESULT",
};

let nuxStepTypes: Record<string, unknown>;
let initialized = false;

function enumValue(
  enumTable: Readonly<Record<string, unknown>>,
  name: string,
): unknown {
  return enumTable[name];
}

function entryPointValue(entryPoint: EntryPoint): unknown {
  return enumValue(entryPointEnums, ENTRY_POINTS[entryPoint]);
}

function sourceValue(source: ImportSource): unknown {
  return enumValue(sourceEnums, SOURCES[source]);
}

function dismissalReasonValue(reason: string): unknown {
  return enumValue(dismissalReasonEnums, DISMISSAL_REASONS[reason]);
}

function exitStateValue(exitState: string): unknown {
  return enumValue(exitStateEnums, EXIT_STATES[exitState]);
}

function emit(
  scope: MaitaiScopeApi<unknown>,
  fields: Record<string, unknown>,
): void {
  emitAnalyticsEvent(scope, browserProfileImportEvent, fields);
}

function recordNuxLifecycleStep(
  scope: MaitaiScopeApi<unknown>,
  entryPoint: EntryPoint,
  flowId: string,
  stepName: "shown" | "dismissed" | "continue-clicked",
  dismissalReason?: string,
): void {
  emit(scope, {
    stepType: nuxStepTypes[stepName],
    entryPoint: entryPointValue(entryPoint),
    flowId,
    dismissalReason:
      dismissalReason == null
        ? undefined
        : dismissalReasonValue(dismissalReason),
  });
}

function recordDialogOpened(
  scope: MaitaiScopeApi<unknown>,
  entryPoint: EntryPoint,
  flowId: string,
): void {
  emit(scope, {
    stepType: enumValue(
      lifecycleStepEnums,
      "CODEX_BROWSER_PROFILE_IMPORT_LIFECYCLE_STEP_TYPE_DIALOG_OPENED",
    ),
    entryPoint: entryPointValue(entryPoint),
    flowId,
  });
}

function recordWindowsChromeAdminNoticeShown(
  scope: MaitaiScopeApi<unknown>,
  entryPoint: EntryPoint,
  flowId: string,
): void {
  emit(scope, {
    stepType: enumValue(
      lifecycleStepEnums,
      "CODEX_BROWSER_PROFILE_IMPORT_LIFECYCLE_STEP_TYPE_WINDOWS_CHROME_ADMIN_APPROVAL_NOTICE_SHOWN",
    ),
    entryPoint: entryPointValue(entryPoint),
    source: sourceValue("chrome"),
    flowId,
    windowsChromeAdminApprovalNoticeRequired: true,
    windowsChromeAdminApprovalNoticeAcknowledged: false,
  });
}

function recordWindowsChromeAdminNoticeAcknowledged(
  scope: MaitaiScopeApi<unknown>,
  entryPoint: EntryPoint,
  flowId: string,
): void {
  emit(scope, {
    stepType: enumValue(
      lifecycleStepEnums,
      "CODEX_BROWSER_PROFILE_IMPORT_LIFECYCLE_STEP_TYPE_WINDOWS_CHROME_ADMIN_APPROVAL_NOTICE_ACKNOWLEDGED",
    ),
    entryPoint: entryPointValue(entryPoint),
    source: sourceValue("chrome"),
    flowId,
    windowsChromeAdminApprovalNoticeRequired: true,
    windowsChromeAdminApprovalNoticeAcknowledged: true,
  });
}

function attemptFields(
  entryPoint: EntryPoint,
  request: ImportRequest,
  attempt: AttemptContext,
): Record<string, unknown> {
  return {
    entryPoint: entryPointValue(entryPoint),
    source: sourceValue(request.source),
    cookiesRequested: request.importCookies !== false,
    passwordsRequested: request.importPasswords !== false,
    extensionsRequested: request.importExtensions === true,
    flowId: attempt.flowId,
    attemptIndex: attempt.attemptIndex,
    windowsChromeAdminApprovalNoticeRequired:
      attempt.windowsChromeAdminApprovalNoticeRequired,
    windowsChromeAdminApprovalNoticeAcknowledged:
      attempt.windowsChromeAdminApprovalNoticeAcknowledged,
  };
}

function recordAttemptStarted(
  scope: MaitaiScopeApi<unknown>,
  entryPoint: EntryPoint,
  request: ImportRequest,
  attempt: AttemptContext,
): void {
  emit(scope, {
    stepType: enumValue(
      lifecycleStepEnums,
      "CODEX_BROWSER_PROFILE_IMPORT_LIFECYCLE_STEP_TYPE_ATTEMPT_STARTED",
    ),
    ...attemptFields(entryPoint, request, attempt),
  });
}

function cookieStatusValue(status?: string): unknown {
  const suffix =
    {
      missing: "MISSING",
      success: "SUCCESS",
      failed_to_copy: "FAILED_TO_COPY",
      failed_to_open: "FAILED_TO_OPEN",
      failed_to_read: "FAILED_TO_READ",
    }[status ?? "missing"] ?? "UNKNOWN";
  return enumValue(
    cookieStatusEnums,
    `CODEX_BROWSER_PROFILE_IMPORT_COOKIE_STATUS_${suffix}`,
  );
}

function passwordStatusValue(status?: string): unknown {
  const suffix =
    {
      missing: "MISSING",
      success: "SUCCESS",
      partial: "PARTIAL_SUCCESS",
      failed_to_copy: "FAILED_TO_COPY",
      failed_to_initialize: "FAILED_TO_INITIALIZE",
      failed_to_read: "FAILED_TO_READ",
      failed_to_get_target_store: "FAILED_TO_GET_TARGET_STORE",
      failed_to_read_target_store: "FAILED_TO_READ_TARGET_STORE",
    }[status ?? "missing"] ?? "UNKNOWN";
  return enumValue(
    passwordStatusEnums,
    `CODEX_BROWSER_PROFILE_IMPORT_PASSWORD_STATUS_${suffix}`,
  );
}

function cookieItemResultValue(data?: ImportData): unknown {
  const imported = (data?.imported ?? 0) > 0;
  const failed = (data?.failed ?? 0) > 0;
  const suffix = imported
    ? failed
      ? "IMPORTED_AND_FAILED"
      : "IMPORTED_ONLY"
    : failed
      ? "FAILED_ONLY"
      : "NO_IMPORTED_OR_FAILED_ITEMS";
  return enumValue(
    cookieItemResultEnums,
    `CODEX_BROWSER_PROFILE_IMPORT_COOKIE_ITEM_RESULT_${suffix}`,
  );
}

function hasSuccessfulData(data: ImportData): boolean {
  return (
    (data.imported ?? 0) > 0 ||
    data.status === "success" ||
    data.status === "partial-success"
  );
}

function dataOutcomeValue(
  data?: ImportData,
  ...children: (ImportData | undefined)[]
): unknown {
  const outcome = (suffix: string) =>
    enumValue(
      dataOutcomeEnums,
      `CODEX_BROWSER_PROFILE_IMPORT_DATA_OUTCOME_${suffix}`,
    );
  if (data == null) return outcome("FAILED");

  const results = [data, ...children].filter(
    (value): value is ImportData => value != null,
  );
  const hasFailure = results.some((value) => isImportFailure(value));
  const hasSuccess = results.some(hasSuccessfulData);
  if (hasFailure) return outcome(hasSuccess ? "PARTIAL_SUCCESS" : "FAILED");

  const importedCounts = results.flatMap(({ imported }) =>
    imported == null ? [] : [imported],
  );
  if (
    (importedCounts.length > 0 &&
      importedCounts.every((count) => count === 0)) ||
    (!hasSuccess && results.some(({ status }) => status === "missing"))
  ) {
    return outcome("NO_NEW_DATA");
  }
  return hasSuccess ? outcome("SUCCESS") : undefined;
}

function resultFields(
  request: ImportRequest,
  result?: ImportResult,
): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    requestOutcome: enumValue(
      requestOutcomeEnums,
      result == null
        ? "CODEX_BROWSER_PROFILE_IMPORT_REQUEST_OUTCOME_FAILED_WITHOUT_RESULT"
        : "CODEX_BROWSER_PROFILE_IMPORT_REQUEST_OUTCOME_RETURNED_RESULT",
    ),
    extensionOutcome:
      request.importExtensions === true
        ? dataOutcomeValue(result?.extensions)
        : undefined,
  };
  if (request.importCookies !== false) {
    fields.cookieOutcome = dataOutcomeValue(result?.cookies);
    if (result != null) {
      fields.cookieStatus = cookieStatusValue(result.cookies?.status);
      fields.cookieItemResult = cookieItemResultValue(result.cookies);
    }
  }
  if (request.importPasswords !== false) {
    fields.passwordOutcome = dataOutcomeValue(
      result?.passwords,
      result?.passwords?.profile,
      result?.passwords?.account,
    );
    if (result != null) {
      fields.passwordProfileStatus = passwordStatusValue(
        result.passwords?.profile?.status,
      );
      fields.passwordAccountStatus = passwordStatusValue(
        result.passwords?.account?.status,
      );
    }
  }
  return fields;
}

function recordAttemptFinished(
  scope: MaitaiScopeApi<unknown>,
  entryPoint: EntryPoint,
  request: ImportRequest,
  attempt: AttemptContext,
  result?: ImportResult,
): void {
  const outcomes = resultFields(request, result);
  emit(scope, {
    stepType: enumValue(
      lifecycleStepEnums,
      "CODEX_BROWSER_PROFILE_IMPORT_LIFECYCLE_STEP_TYPE_ATTEMPT_FINISHED",
    ),
    ...attemptFields(entryPoint, request, attempt),
    ...outcomes,
  });

  const safe: Record<string, unknown> = {
    entryPoint: entryPointValue(entryPoint),
    source: sourceValue(request.source),
    cookiesRequested: request.importCookies !== false,
    passwordsRequested: request.importPasswords !== false,
    extensionsRequested: request.importExtensions === true,
    windowsChromeAdminApprovalNoticeRequired:
      attempt.windowsChromeAdminApprovalNoticeRequired,
    windowsChromeAdminApprovalNoticeAcknowledged:
      attempt.windowsChromeAdminApprovalNoticeAcknowledged,
    ...outcomes,
  };
  const failed = [
    safe.cookieOutcome,
    safe.passwordOutcome,
    safe.extensionOutcome,
  ].some(
    (value) =>
      value ===
        enumValue(
          dataOutcomeEnums,
          "CODEX_BROWSER_PROFILE_IMPORT_DATA_OUTCOME_FAILED",
        ) ||
      value ===
        enumValue(
          dataOutcomeEnums,
          "CODEX_BROWSER_PROFILE_IMPORT_DATA_OUTCOME_PARTIAL_SUCCESS",
        ),
  );
  if (result == null) {
    logger.error(
      "Browser profile import request failed without a result",
      { safe },
    );
  } else if (failed) {
    logger.warning("Browser profile import returned failures", { safe });
  }
}

function recordDialogClosed(
  scope: MaitaiScopeApi<unknown>,
  entryPoint: EntryPoint,
  state: AttemptContext & {
    source?: ImportSource;
    exitState?: string;
    dismissalReason: string;
  },
): void {
  emit(scope, {
    stepType: enumValue(
      lifecycleStepEnums,
      "CODEX_BROWSER_PROFILE_IMPORT_LIFECYCLE_STEP_TYPE_DIALOG_CLOSED",
    ),
    entryPoint: entryPointValue(entryPoint),
    source: state.source == null ? undefined : sourceValue(state.source),
    flowId: state.flowId,
    attemptIndex: state.attemptIndex,
    windowsChromeAdminApprovalNoticeRequired:
      state.windowsChromeAdminApprovalNoticeRequired,
    windowsChromeAdminApprovalNoticeAcknowledged:
      state.windowsChromeAdminApprovalNoticeAcknowledged,
    dialogExitState:
      state.exitState == null ? undefined : exitStateValue(state.exitState),
    dismissalReason: dismissalReasonValue(state.dismissalReason),
  });
}

function initializeBrowserProfileImportAnalytics(): void {
  if (initialized) return;
  initializeAnalyticsEnums();
  initializeAnalyticsEmitter();
  initializeQueryRuntime();
  initializeBrowserImportRuntime();
  nuxStepTypes = {
    shown: enumValue(
      lifecycleStepEnums,
      "CODEX_BROWSER_PROFILE_IMPORT_LIFECYCLE_STEP_TYPE_NUX_SHOWN",
    ),
    dismissed: enumValue(
      lifecycleStepEnums,
      "CODEX_BROWSER_PROFILE_IMPORT_LIFECYCLE_STEP_TYPE_NUX_DISMISSED",
    ),
    "continue-clicked": enumValue(
      lifecycleStepEnums,
      "CODEX_BROWSER_PROFILE_IMPORT_LIFECYCLE_STEP_TYPE_NUX_CONTINUE_CLICKED",
    ),
  };
  initialized = true;
}

export {
  recordDialogOpened as a,
  recordWindowsChromeAdminNoticeShown as c,
  recordDialogClosed as i,
  recordAttemptFinished as n,
  recordNuxLifecycleStep as o,
  recordAttemptStarted as r,
  recordWindowsChromeAdminNoticeAcknowledged as s,
  initializeBrowserProfileImportAnalytics as t,
};
