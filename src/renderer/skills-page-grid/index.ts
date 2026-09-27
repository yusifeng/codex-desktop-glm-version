// skills-page-grid —— Skills 页面响应式单/双列网格。
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
void runtimeChunk;

const {
  $3: initializeRuntimeLazy,
  I3: getJsxRuntime,
  h4: initializeClassNames,
  m4: classNames,
} = appSharedChunk;

interface SkillsGridProps {
  children?: unknown;
  className?: string;
}
interface SkillsGridContentProps extends SkillsGridProps {
  gap?: "catalog" | "compact" | "default";
  isSingleColumn?: boolean;
}

let jsx: import("@rchunk/app-shared").JsxRuntime;
let gapClassNames: Record<NonNullable<SkillsGridContentProps["gap"]>, string>;

function SkillsGridContent({
  children,
  className,
  gap = "default",
  isSingleColumn = false,
}: SkillsGridContentProps): unknown {
  return jsx.jsx("div", {
    className: classNames(
      "grid grid-cols-1",
      gapClassNames[gap],
      !isSingleColumn && "@min-[581px]/skills-grid:grid-cols-2",
      className,
    ),
    children,
  });
}

function SkillsGrid({ children, className }: SkillsGridProps): unknown {
  return jsx.jsx("div", {
    className: classNames(className, "@container/skills-grid"),
    children,
  });
}

function initializeSkillsPageGrid(): void {
  initializeRuntimeLazy();
  initializeClassNames();
  jsx = getJsxRuntime();
  gapClassNames = {
    catalog: "gap-x-6 gap-y-2",
    compact: "gap-2",
    default: "gap-4",
  };
}

export {
  SkillsGridContent as n,
  initializeSkillsPageGrid as r,
  SkillsGrid as t,
};
