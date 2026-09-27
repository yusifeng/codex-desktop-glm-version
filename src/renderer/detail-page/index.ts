// detail-page —— 详情页内容宽度与纵向节奏容器。
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
void runtimeChunk;

const {
  $3: initializeRuntimeLazy,
  I3: getJsxRuntime,
  h4: initializeClassNames,
  m4: classNames,
} = appSharedChunk;

interface DetailPageProps {
  children?: unknown;
}

let jsx: import("@rchunk/app-shared").JsxRuntime;
let detailPageSectionClassName: string;

function DetailPage({ children }: DetailPageProps): unknown {
  return jsx.jsx("div", {
    className: classNames(
      detailPageSectionClassName,
      "@container mx-auto w-full max-w-[var(--thread-content-max-width)] [--detail-page-inline-inset:var(--padding-row-x)] [--detail-page-section-gap:calc(var(--spacing)*6)]",
    ),
    children,
  });
}

function initializeDetailPage(): void {
  initializeRuntimeLazy();
  initializeClassNames();
  jsx = getJsxRuntime();
  detailPageSectionClassName =
    "flex flex-col gap-[var(--detail-page-section-gap)]";
}

export {
  DetailPage as n,
  initializeDetailPage as r,
  detailPageSectionClassName as t,
};
