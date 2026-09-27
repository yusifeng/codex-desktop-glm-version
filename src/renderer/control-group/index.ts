import { $3 as getCompilerRuntime, I3 as getJsxRuntime, h4 as initializeClassNames, m4 as classNames } from "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";

export interface ControlGroupProps {
  children?: unknown;
  className?: string;
}

let jsxRuntime: ReturnType<typeof getJsxRuntime> | undefined;
function ControlGroup({ children, className }: ControlGroupProps): unknown {
  return jsxRuntime?.jsx("div", { className: classNames("flex items-center gap-2", className), children });
}

let initialized = false;
function initializeControlGroup(): void {
  if (initialized) return;
  initialized = true;
  getCompilerRuntime();
  initializeClassNames();
  jsxRuntime = getJsxRuntime();
}

export { initializeControlGroup as n, ControlGroup as t };
