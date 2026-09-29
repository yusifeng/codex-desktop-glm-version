// Trusted-contact link route layout. Release chunk: link-layout-678c303b5a32.js.
import "@rchunk/rolldown-runtime";
import {
  $3 as getCompilerRuntime,
  I3 as getJsxRuntime,
  type JsxRuntime,
} from "@rchunk/app-shared";
import {
  M6t as initializeAppResources,
  N6t as useAuthenticationState,
  Qgn as initializeAccountRuntime,
  Xgn as RouterOutlet,
} from "@rchunk/app-initial";
import {
  fc as TrustedContactAuthenticationLayout,
  mc as initializePrimaryRuntime,
} from "@rchunk/app-primary";

interface CompilerRuntime {
  c(size: number): unknown[];
}

const createCompilerRuntime = getCompilerRuntime as unknown as () => CompilerRuntime;

let compilerRuntime: CompilerRuntime;
let jsxRuntime: JsxRuntime;

function TrustedContactLinkLayout(): unknown {
  const cache = compilerRuntime.c(2);
  const { authMethod } = useAuthenticationState();

  if (cache[0] === authMethod) {
    return cache[1];
  }

  const layout = authMethod
    ? jsxRuntime.jsx(TrustedContactAuthenticationLayout, {})
    : jsxRuntime.jsx("main", {
        className: "h-full bg-surface",
        children: jsxRuntime.jsx(RouterOutlet, {}),
      });

  cache[0] = authMethod;
  cache[1] = layout;
  return layout;
}

function initializeLinkLayout(): void {
  compilerRuntime = createCompilerRuntime();
  initializeAccountRuntime();
  initializePrimaryRuntime();
  initializeAppResources();
  jsxRuntime = getJsxRuntime();
}

initializeLinkLayout();

export { TrustedContactLinkLayout };
