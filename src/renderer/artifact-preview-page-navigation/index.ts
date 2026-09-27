import { e6 as getReactRuntime, type ReactRuntime } from "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";

export interface PageNavigationOptions {
  containerRef: { current: Element | null };
  initialPage?: number;
  isPageLayoutReady: boolean;
  onPageChange?(page: number): void;
  pageSelector: string;
  totalPages: number;
}

export interface PageNavigation {
  currentPage: number;
  goToPage(page: number, behavior?: ScrollBehavior): void;
  goToNextPage(): void;
  goToPreviousPage(): void;
}

let React: ReactRuntime;

function clampPage(page: number, totalPages: number): number {
  return Math.min(Math.max(page, 1), Math.max(totalPages, 1));
}

function useArtifactPreviewPageNavigation(options: PageNavigationOptions): PageNavigation {
  const initialPage = clampPage(options.initialPage ?? 1, options.totalPages);
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const currentPageRef = React.useRef(initialPage);

  const setPage = (page: number): void => {
    if (page === currentPageRef.current) return;
    currentPageRef.current = page;
    setCurrentPage(page);
    options.onPageChange?.(page);
  };
  const goToPage = (page: number, behavior: ScrollBehavior = "smooth"): void => {
    const nextPage = clampPage(page, options.totalPages);
    const elements = Array.from(
      options.containerRef.current?.querySelectorAll(options.pageSelector) ?? [],
    );
    elements.at(nextPage - 1)?.scrollIntoView({ behavior, block: "start" });
    setPage(nextPage);
  };

  React.useLayoutEffect(() => {
    if (!options.isPageLayoutReady) return;
    goToPage(initialPage, "auto");
  }, [options.isPageLayoutReady, options.totalPages, options.pageSelector]);

  React.useEffect(() => {
    const container = options.containerRef.current;
    if (!options.isPageLayoutReady || container == null || typeof IntersectionObserver === "undefined")
      return;
    const elements = Array.from(container.querySelectorAll(options.pageSelector));
    const visibility = new Map<Element, number>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) visibility.set(entry.target, entry.intersectionRatio);
      let bestIndex = -1;
      let bestRatio = 0;
      visibility.forEach((ratio, element) => {
        const index = elements.indexOf(element);
        if (ratio > bestRatio) {
          bestIndex = index;
          bestRatio = ratio;
        }
      });
      if (bestIndex >= 0) setPage(bestIndex + 1);
    }, { root: container, threshold: [0, 0.25, 0.5, 0.75, 1] });
    for (const element of elements) observer.observe(element);
    return () => observer.disconnect();
  }, [options.containerRef, options.isPageLayoutReady, options.pageSelector, options.totalPages]);

  return {
    currentPage: clampPage(currentPage, options.totalPages),
    goToPage,
    goToNextPage: () => {
      if (currentPageRef.current < options.totalPages)
        goToPage(currentPageRef.current + 1);
    },
    goToPreviousPage: () => {
      if (currentPageRef.current > 1) goToPage(currentPageRef.current - 1);
    },
  };
}

function initializeArtifactPreviewPageNavigation(): void {
  React = getReactRuntime();
}

export { useArtifactPreviewPageNavigation as n, initializeArtifactPreviewPageNavigation as t };
