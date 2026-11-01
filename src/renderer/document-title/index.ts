import "@rchunk/rolldown-runtime";
import {
  $3 as getCompilerRuntime,
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

interface CompilerRuntime {
  c(size: number): unknown[];
}

let compilerRuntime: CompilerRuntime;
let React: ReturnType<typeof getReactRuntime>;
let jsxRuntime: ReturnType<typeof getJsxRuntime>;

function RouteDocumentTitle({ title }: DocumentTitleProps): unknown {
  const cache = compilerRuntime.c(2);
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
  const resolvedTitle = title ?? routeTitle;
  if (cache[0] !== resolvedTitle) {
    cache[0] = resolvedTitle;
    cache[1] = jsxRuntime.jsx(DocumentTitle, { title: resolvedTitle });
  }
  return cache[1];
}

function DocumentTitle({ title }: DocumentTitleProps): null {
  const cache = compilerRuntime.c(3);
  let effect: () => (() => void) | undefined;
  let dependencies: Array<string | null | undefined>;
  if (cache[0] !== title) {
    effect = () => {
      if (title == null) return undefined;
      const previousTitle = document.title;
      document.title = title;
      const appliedTitle = document.title;
      return () => {
        if (document.title === appliedTitle) document.title = previousTitle;
      };
    };
    dependencies = [title];
    cache[0] = title;
    cache[1] = effect;
    cache[2] = dependencies;
  } else {
    effect = cache[1] as typeof effect;
    dependencies = cache[2] as typeof dependencies;
  }
  React.useEffect(effect, dependencies);
  return null;
}

function initializeDocumentTitle(): void {
  compilerRuntime = getCompilerRuntime() as unknown as CompilerRuntime;
  initializeSignalRuntime();
  React = getReactRuntime();
  initializeConversationScope();
  initializeDocumentTitles();
  jsxRuntime = getJsxRuntime();
}

export { RouteDocumentTitle as n, initializeDocumentTitle as r, DocumentTitle as t };
