import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime } from "@rchunk/app-shared";
import { Bl as Avatar } from "@rchunk/app-primary";
const jsxRuntime = getJsxRuntime();
export interface SubagentRowProps { avatarSeed: string; name: string; status: string }
function SubagentRow({ avatarSeed, name, status }: SubagentRowProps): unknown { return jsxRuntime.jsxs("div", { className: "flex min-w-0 items-center gap-1.5 text-sm leading-5", children: [jsxRuntime.jsx(Avatar, { className: "size-6", seed: avatarSeed, "aria-hidden": true }), jsxRuntime.jsx("span", { className: "min-w-0 flex-1 truncate", children: name }), jsxRuntime.jsx("span", { className: "shrink-0 text-xs text-codex-description", children: status })] }); }
function initializeSubagentRow(): void {}
export { initializeSubagentRow as n, SubagentRow as t };
