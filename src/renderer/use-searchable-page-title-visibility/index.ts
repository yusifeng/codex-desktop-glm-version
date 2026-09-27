// use-searchable-page-title-visibility —— 标题滚出搜索页正文时显示工具栏标题。
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as elementInViewChunk from "@rchunk/use-element-in-view";
void runtimeChunk;

const { $3: initializeRuntimeLazy, e6: reactRuntime } = appSharedChunk;
const { n: useElementInView, t: initializeElementInView } = elementInViewChunk;

type RefTarget = Element | null;

interface SearchablePageTitleVisibility {
  scrollContainerRef(element: RefTarget): void;
  showTitleInToolbar: boolean;
  titleRef(element: RefTarget): void;
}

function useSearchablePageTitleVisibility(): SearchablePageTitleVisibility {
  const [container, setContainer] = reactRuntime.useState<RefTarget>(null);
  const [target, setTarget] = reactRuntime.useState<RefTarget>(null);
  return {
    scrollContainerRef: setContainer,
    showTitleInToolbar: !useElementInView({ container, target }),
    titleRef: setTarget,
  };
}

function initializeSearchablePageTitleVisibility(): void {
  initializeRuntimeLazy();
  reactRuntime();
  initializeElementInView();
}

export {
  useSearchablePageTitleVisibility as n,
  initializeSearchablePageTitleVisibility as t,
};
