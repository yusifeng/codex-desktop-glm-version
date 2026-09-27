import "@rchunk/rolldown-runtime";
import {
  $3 as initializeCompilerRuntime,
  Cz as codeThemeConfig,
  FX as initializeSignalRuntime,
  HX as useSignalValue,
  I3 as getJsxRuntime,
  e6 as getReactRuntime,
  wL as initializeWindowRuntime,
} from "@rchunk/app-shared";
import {
  CW as resolveColorScheme,
  GO as wordDiffEnabledSignal,
  Kcn as getSettingSignal,
  SW as useTheme,
  VO as initializeColorScheme,
  Vcn as initializeSettings,
  r_t as resolveCodeTheme,
  wk as initializeTheme,
  xW as initializeDiffPreferences,
} from "@rchunk/app-initial";
import {
  a as useHighlighterPool,
  i as initializePierreThemeRegistry,
  r as HighlighterPoolProvider,
  t as initializeHighlighterPool,
} from "@rchunk/register-pierre-themes";

const React = getReactRuntime();
const jsx = getJsxRuntime();
const workerUrl = new URL(
  "worker-49a232674c13.js",
  typeof window === "undefined" ? "https://desktop.invalid/" : import.meta.url,
).href;
const supportedLanguages = ["typescript", "javascript", "css", "html", "python"];

function createHighlightWorker(): Worker {
  return new Worker(workerUrl, { type: "module" });
}

interface ShikiHighlightProviderProps { children?: unknown; }

function RenderOptionsBridge({ lineDiffType, theme }: { lineDiffType: string; theme: string }): null {
  const pool = useHighlighterPool();
  React.useEffect(() => {
    pool?.setRenderOptions({ lineDiffType, theme });
  }, [lineDiffType, theme, pool]);
  return null;
}

function ShikiHighlightProvider({ children }: ShikiHighlightProviderProps): unknown {
  const theme = useTheme();
  const colorScheme = resolveColorScheme(theme);
  const lightTheme = useSignalValue(getSettingSignal(codeThemeConfig.lightCodeThemeId));
  const darkTheme = useSignalValue(getSettingSignal(codeThemeConfig.darkCodeThemeId));
  const useWordDiff = useSignalValue(wordDiffEnabledSignal);
  const resolvedTheme = colorScheme === "light"
    ? resolveCodeTheme(lightTheme, "light")
    : resolveCodeTheme(darkTheme, "dark");
  const lineDiffType = useWordDiff ? "word-alt" : "none";
  return jsx.jsxs(HighlighterPoolProvider, {
    poolOptions: { workerFactory: createHighlightWorker, poolSize: 4, totalASTLRUCacheSize: 100 },
    highlighterOptions: { theme: resolvedTheme.name, lineDiffType, langs: supportedLanguages },
    children: [jsx.jsx(RenderOptionsBridge, { lineDiffType, theme: resolvedTheme.name }), children],
  });
}

function initializeShikiHighlightProvider(): void {
  initializeCompilerRuntime();
  initializePierreThemeRegistry();
  initializeSignalRuntime();
  initializeWindowRuntime();
  initializeSettings();
  initializeTheme();
  initializeDiffPreferences();
  initializeColorScheme();
  initializeHighlighterPool();
}

initializeShikiHighlightProvider();

export { ShikiHighlightProvider };
