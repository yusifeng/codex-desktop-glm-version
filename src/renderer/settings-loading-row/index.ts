import "@rchunk/rolldown-runtime";
import {
  I3 as getJsxRuntime,
  Qh as LoadingSpinner,
  rl as SettingsRow,
} from "@rchunk/app-shared";

interface SettingsLoadingRowProps {
  children?: unknown;
}

const jsx = getJsxRuntime();

function SettingsLoadingRow({ children }: SettingsLoadingRowProps): unknown {
  return jsx.jsx("div", {
    role: "status",
    children: jsx.jsx(SettingsRow, {
      label: jsx.jsxs("span", {
        className: "flex items-center gap-2 font-normal text-secondary",
        children: [
          jsx.jsx(LoadingSpinner, {
            className: "icon-xs shrink-0 text-secondary",
          }),
          jsx.jsx("span", { className: "text-balance", children }),
        ],
      }),
      control: null,
    }),
  });
}

function initializeSettingsLoadingRow(): void {}

export { initializeSettingsLoadingRow as n, SettingsLoadingRow as t };
