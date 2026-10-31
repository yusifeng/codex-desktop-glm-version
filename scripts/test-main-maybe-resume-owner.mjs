import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/threads/maybe-resume.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const module = { exports: {} };
const stringSchema = { nullable() { return this; } };
Function("require", "module", "exports", transpiled.code)((specifier) => {
  if (specifier === "@chunk/shared")
    return {
      $u: String,
      Od: () => ({ type: "readOnly" }),
      Zo: (error) => error instanceof Error ? error.message : String(error?.message ?? error),
      _l: (path) => path,
      _s: "durable",
      bl: (path) => /^[a-zA-Z]:[\\/]/.test(path),
      kd: () => ({ approvalPolicy: "on-request", sandboxPolicy: { type: "readOnly" } }),
      xl: (path) => path.startsWith("//"),
      Of: () => stringSchema,
      wf: () => ({ parse: (value) => value }),
    };
  if (specifier === "../util/lodash-interop")
    return { deepEqual: (left, right) => JSON.stringify(left) === JSON.stringify(right) };
  if (specifier === "../workspace/config") return { nx: () => false };
  if (specifier === "../turns/canonical-history") return {};
  if (specifier === "../turns/history-requests") return { THREAD_HISTORY_REQUEST_TIMEOUT_MS: 30_000 };
  if (specifier === "../turns/item-merge") return {};
  if (specifier === "./patch-classification") return {};
  if (specifier === "./projection") return {};
  if (specifier === "./automation-detector") return { hasCanonicalVoiceHistory: () => false };
  throw new Error(`unexpected require ${specifier}`);
}, module, module.exports);

const resume = module.exports;

equal(resume.resolveResumeCwd({
  requestedCwd: "/repo/subdir", responseCwd: "/repo", threadCwd: null, fallbackCwd: "/fallback",
}), "/repo/subdir");
equal(resume.resolveResumeCwd({
  requestedCwd: "/other", responseCwd: "/repo", threadCwd: "/thread", fallbackCwd: "/fallback",
}), "/repo");
equal(resume.resolveResumeCwd({
  requestedCwd: "C:\\Repo\\Child\\", responseCwd: "c:/repo", threadCwd: null, fallbackCwd: null,
}), "C:\\Repo\\Child\\");
equal(resume.resolveResumeCwd({
  requestedCwd: null, responseCwd: null, threadCwd: null, fallbackCwd: "/fallback",
}), "/fallback");

const responsePermissions = {
  activePermissionProfile: { id: ":danger-full-access" },
  runtimeWorkspaceRoots: ["/response"],
  approvalPolicy: "never",
  sandboxPolicy: { type: "dangerFullAccess" },
};
equal(resume.mergePermissionSettings({
  activePermissionProfile: null,
  runtimeWorkspaceRoots: ["/derived"],
  approvalPolicy: "on-request",
  approvalsReviewer: "user",
  sandbox: { type: "workspaceWrite" },
}, responsePermissions), responsePermissions);
equal(resume.mergePermissionSettings({
  activePermissionProfile: null,
  runtimeWorkspaceRoots: ["/derived"],
  approvalPolicy: "on-request",
  approvalsReviewer: "user",
  sandbox: { type: "workspaceWrite", writableRoots: ["/derived"] },
}, { activePermissionProfile: { id: "profile" } }), {
  activePermissionProfile: { id: "profile" },
  runtimeWorkspaceRoots: ["/derived"],
  approvalPolicy: "on-request",
  approvalsReviewer: "user",
  sandboxPolicy: { type: "workspaceWrite", writableRoots: ["/derived"] },
});

equal(resume.mergeRootLists(["a", "b"], ["b", "c"]), ["a", "b", "c"]);
const readOnly = { type: "readOnly" };
equal(resume.expandWritableRoots(readOnly, ["/extra"]), readOnly);
equal(resume.expandWritableRoots({ type: "workspaceWrite", writableRoots: ["/one"] }, ["/one", "/two"]), {
  type: "workspaceWrite", writableRoots: ["/one", "/two"],
});
equal(resume.filterRootsMatchingCwd("C:/repo", ["C:/one", "/posix", "//server/share"]), ["C:/one", "//server/share"]);
equal(resume.filterRootsMatchingCwd("/repo", ["C:/one", "/posix", "//server/share"]), ["/posix"]);
equal(resume.filterRootsMatchingCwd("relative", ["/posix"]), []);

equal(resume.threadGoalNeedsConfirmation("active"), false);
equal(resume.threadGoalNeedsConfirmation("complete"), false);
equal(resume.threadGoalNeedsConfirmation("paused"), true);
equal(resume.threadGoalNeedsConfirmation("usageLimited"), true);
equal(resume.isWriterConflictError(Error("thread already has an active writer")), true);
equal(resume.isWriterConflictError(Error("thread already has a live local writer")), true);
equal(resume.isWriterConflictError(Error("other")), false);
equal(resume.permissionSourceLabel(true, false, false, false), "explicit_permissions");
equal(resume.permissionSourceLabel(false, true, false, false), "thread_settings");
equal(resume.permissionSourceLabel(false, false, true, false), "latest_turn");
equal(resume.permissionSourceLabel(false, false, false, true), "current_permissions");
equal(resume.permissionSourceLabel(false, false, false, false), "default");

equal(resume.sandboxPolicySummary({ type: "dangerFullAccess" }), {
  type: "dangerFullAccess", networkAccess: null, writableRootCount: 0,
  excludeTmpdirEnvVar: null, excludeSlashTmp: null,
});
equal(resume.sandboxPolicySummary({
  type: "workspaceWrite", networkAccess: true, writableRoots: ["a", "b"],
  excludeTmpdirEnvVar: false, excludeSlashTmp: true,
}), {
  type: "workspaceWrite", networkAccess: true, writableRootCount: 2,
  excludeTmpdirEnvVar: false, excludeSlashTmp: true,
});

const logEvents = [];
const inactive = await resume.maybeResumeConversation({
  manager: {
    getConversation: () => null,
    getHostId: () => "local",
    getWindowActivity: () => ({ visibilityState: "hidden", routePath: "/" }),
    getStreamRole: () => null,
    ensureRecentConversationId: (id) => logEvents.push(`recent:${id}`),
    logger: { info: (message) => logEvents.push(message), warning() {}, error() {} },
  },
  workspace: {},
  params: { conversationId: "thread", workspaceRoots: [] },
  product: {},
  historyPolicy: {},
  canAcquireOwnership: () => false,
  isCurrentResumeAttempt: () => true,
  setHydrationCleanup() {},
  schedule() { return () => {}; },
});
equal(inactive, { status: "not-ready", reason: "inactive-window" });
equal(logEvents.includes("recent:thread"), true);
equal(logEvents.includes("maybe_resume_skipped_inactive_hotkey_window"), true);

equal(await resume.maybeResumeConversation({
  manager: {}, workspace: {}, params: {}, product: {}, historyPolicy: {},
  canAcquireOwnership: () => true,
  isCurrentResumeAttempt: () => false,
  setHydrationCleanup() {}, schedule() { return () => {}; },
}), { status: "not-ready", reason: "canceled" });

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes('require("./main-app/threads/maybe-resume.js")'), true);
for (const oldDefinition of [
  "xx", "Dye", "Sx", "Oye", "kye", "Cx", "Rye", "zye", "Ox", "kx", "Ax", "jx", "Mx", "Nx",
  "Hye", "Px", "Uye", "Wye", "Fx", "Ix", "Lx", "Gye", "Kye", "Rx", "zx",
]) equal(new RegExp(`(?:async )?function ${oldDefinition}\\(`).test(main), false);

console.log(`${assertions} main maybe-resume owner assertions passed`);
