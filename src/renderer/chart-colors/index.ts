import "@rchunk/rolldown-runtime";

type ChartTheme = "blue" | "green" | "orange" | "yellow" | "purple" | "pink";
interface ChartPaletteOptions { chatTheme: unknown; colorCount: number; isDarkMode: boolean }

let defaultTheme: ChartTheme;
let themes: readonly ChartTheme[];
let themeSet: ReadonlySet<ChartTheme>;
let colors: Record<ChartTheme, { dark: string; light: string }>;

function initializeChartColors(): void {
  defaultTheme = "blue";
  themes = ["blue", "green", "orange", "yellow", "purple", "pink"];
  themeSet = new Set(themes);
  colors = {
    blue: { light: "#539af8", dark: "#1f4e94" },
    green: { light: "#6bc67f", dark: "#3a843f" },
    orange: { light: "#ef8b57", dark: "#ac4f23" },
    yellow: { light: "#f8d45d", dark: "#d9a337" },
    purple: { light: "#b897f4", dark: "#7849d1" },
    pink: { light: "#f68ebc", dark: "#ab4f7a" },
  };
}

function isChartTheme(value: unknown): value is ChartTheme {
  return typeof value === "string" && themeSet.has(value as ChartTheme);
}

function getChartColors({ chatTheme, colorCount, isDarkMode }: ChartPaletteOptions): string[] {
  if (!Number.isFinite(colorCount) || colorCount <= 0) return [];
  const startIndex = isChartTheme(chatTheme) ? themes.indexOf(chatTheme) : 0;
  return Array.from({ length: Math.floor(colorCount) }, (_, index) => {
    const theme = themes[(startIndex + index) % themes.length] ?? defaultTheme;
    return colors[theme][isDarkMode ? "dark" : "light"];
  });
}

export { initializeChartColors as n, getChartColors as t };
