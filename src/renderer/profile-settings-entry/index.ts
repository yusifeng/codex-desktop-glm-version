import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, m4 as classNames, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import { n as initializeProfileView, t as ProfileView } from "@rchunk/profile-view";

interface ProfileSettingsProps { today?: Date | string }
interface ProfileLayoutProps { children?: unknown; header?: unknown; isEditPaneOpen?: boolean; isError?: boolean; ref?: unknown }
let jsx: JsxRuntime | undefined;
let initialized = false;
function initializeProfileSettings(): void { if (initialized) return; initialized = true; initializeProfileView(); jsx = getJsxRuntime(); }
function ProfileLayout({ children, header, isEditPaneOpen = false, isError = false, ref }: ProfileLayoutProps): unknown {
  initializeProfileSettings(); if (isError) return jsx!.jsxs("section", { "data-profile-error": "true", children: [header, children] });
  return jsx!.jsxs("div", { ref, className: classNames("relative flex h-full min-h-0 min-w-0 flex-1 flex-col electron:overflow-hidden electron:bg-surface windows:rounded-tl-lg", isEditPaneOpen && "@max-2xl:hidden"), children: [jsx!.jsx("div", { className: "flex items-center px-panel draggable electron:h-toolbar extension:h-toolbar-sm", children: header }), jsx!.jsx("div", { className: "flex-1 scrollbar-stable overflow-y-auto p-panel", children })] });
}
function ProfileSettings({ today }: ProfileSettingsProps): unknown { initializeProfileSettings(); return jsx!.jsx(ProfileView, { today, isProfileV2Enabled: false, Layout: ProfileLayout }); }
initializeProfileSettings();
export { ProfileSettings };
