import "@rchunk/rolldown-runtime";
import {
  $3 as initializeCompilerCache,
  BX as useSignalFamilyValue,
  FX as initializeSignalRuntime,
  I3 as getJsxRuntime,
  LX as useScope,
  e6 as getReactRuntime,
} from "@rchunk/app-shared";
import {
  $b as routeDocumentTitle,
  $en as conversationScope,
  Qb as initializeDocumentTitles,
  itn as initializeConversationScope,
} from "@rchunk/app-initial";

export interface DocumentTitleProps {
  title?: string | null;
}

function RouteDocumentTitle({ title }: DocumentTitleProps): unknown {
  const scope = useScope(conversationScope) as unknown as {
    value: { pathname: string; search?: string };
  };
  const readSignalFamily = useSignalFamilyValue as unknown as (
    signal: unknown,
    parameter: unknown,
  ) => unknown;
  const routeTitle = readSignalFamily(
    routeDocumentTitle,
    `${scope.value.pathname}${scope.value.search ?? ""}`,
  ) as string | null;
  return getJsxRuntime().jsx(DocumentTitle, { title: title ?? routeTitle });
}

function DocumentTitle({ title }: DocumentTitleProps): null {
  const React = getReactRuntime();
  React.useEffect(() => {
    if (title == null) return undefined;
    const previousTitle = document.title;
    document.title = title;
    const appliedTitle = document.title;
    return () => {
      if (document.title === appliedTitle) document.title = previousTitle;
    };
  }, [title]);
  return null;
}

function initializeDocumentTitle(): void {
  initializeCompilerCache();
  initializeSignalRuntime();
  getReactRuntime();
  initializeConversationScope();
  initializeDocumentTitles();
  getJsxRuntime();
}

export { RouteDocumentTitle as n, initializeDocumentTitle as r, DocumentTitle as t };
