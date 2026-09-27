import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/app-connect-modal";

export type GoogleWorkspaceTarget = "document" | "presentation" | "spreadsheet";
export interface GoogleDrivePlugin { displayName?: string; plugin: { enabled?: boolean; id: string; installed?: boolean; name?: string }; [key: string]: unknown }
let jsx: JsxRuntime;
function targetForPath(path: string): GoogleWorkspaceTarget | null { const extension = path.split(".").pop()?.toLowerCase(); return extension === "docx" ? "document" : extension === "xlsx" ? "spreadsheet" : extension === "pptx" ? "presentation" : null; }
function logDriveClick(input: { clickAction: string; clickSource: string; context: Record<string, unknown>; productLogger: { logProductEvent(name: string, payload: Record<string, unknown>): void }; resourceKind: GoogleWorkspaceTarget }): void { input.productLogger.logProductEvent("google_workspace_open", { ...input.context, clickAction: input.clickAction, clickSource: input.clickSource, resourceKind: input.resourceKind }); }
function OpenInGoogleDriveMenuItem(props: { onOpen?(): void; path?: string; targetType?: GoogleWorkspaceTarget }): unknown { const targetType = props.path == null ? props.targetType : targetForPath(props.path); return targetType == null ? null : ensureJsx().jsx("button", { type: "button", role: "menuitem", onClick: props.onOpen, children: `Open in Google ${targetType === "document" ? "Docs" : targetType === "spreadsheet" ? "Sheets" : "Slides"}` }); }
function GoogleDriveConnectDialog(props: { app: { id: string; name?: string }; hostId: string; onClose(): void; onOAuthStarted?(): void }): unknown { return ensureJsx().jsxs("dialog", { open: true, children: [ensureJsx().jsx("h2", { children: `Connect ${props.app.name ?? "Google Drive"}` }), ensureJsx().jsx("button", { type: "button", onClick: props.onOAuthStarted, children: "Connect" }), ensureJsx().jsx("button", { type: "button", onClick: props.onClose, children: "Cancel" })] }); }
function OpeningStatus(): unknown { return ensureJsx().jsx("span", { role: "status", children: "Opening" }); }
const initializeAnalytics = (): void => {};
const initializeUtilities = (): void => {};
const initialize = (): void => { jsx = getJsxRuntime(); };
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }
export { targetForPath as a, logDriveClick as c, initialize as i, OpeningStatus as n, initializeUtilities as o, OpenInGoogleDriveMenuItem as r, initializeAnalytics as s, GoogleDriveConnectDialog as t };
