import "@rchunk/rolldown-runtime";
import {
  $3 as initializeCompilerCache,
  I3 as getJsxRuntime,
  c_ as initializeTooltip,
  h4 as initializeReact,
  m4 as classNames,
  o_ as Tooltip,
} from "@rchunk/app-shared";
import {
  vat as fallbackFontSizePx,
  xat as useTextMeasurement,
  yat as initializeTextMeasurement,
} from "@rchunk/app-initial";
import {
  n as getWrappedLineCount,
  r as createTextLayout,
  t as initializeTextLayout,
} from "@rchunk/layout";

const ELLIPSIS = "…";
let measurementContext: CanvasRenderingContext2D | null = null;

export interface MiddleTruncatedTextProps {
  className?: string;
  text: string;
}

function fitsOnOneLine(text: string, font: string, maxWidthPx: number): boolean {
  measurementContext ??= document.createElement("canvas").getContext("2d");
  if (measurementContext == null) {
    return getWrappedLineCount(
      createTextLayout(text, font, { whiteSpace: "pre-wrap" }),
      maxWidthPx,
      1,
    ).lineCount <= 1;
  }
  measurementContext.font = font;
  return measurementContext.measureText(text).width <= maxWidthPx;
}

function truncateTextInMiddle(text: string, font: string, maxWidthPx: number): string {
  if (text.length === 0 || maxWidthPx <= 0 || fitsOnOneLine(text, font, maxWidthPx)) {
    return text;
  }
  const characters = Array.from(text);
  let low = 0;
  let high = characters.length - 1;
  let result = ELLIPSIS;
  while (low <= high) {
    const visibleCount = Math.floor((low + high) / 2);
    const prefixLength = Math.ceil(visibleCount / 2);
    const suffixLength = Math.floor(visibleCount / 2);
    const candidate = `${characters.slice(0, prefixLength).join("")}${ELLIPSIS}${characters
      .slice(characters.length - suffixLength)
      .join("")}`;
    if (fitsOnOneLine(candidate, font, maxWidthPx)) {
      result = candidate;
      low = visibleCount + 1;
    } else {
      high = visibleCount - 1;
    }
  }
  return result;
}

function MiddleTruncatedText({ text, className }: MiddleTruncatedTextProps): unknown {
  const { setTextMeasurementRef, textMeasurement } = useTextMeasurement({
    fallbackFontSizePx,
  }) as {
    setTextMeasurementRef: unknown;
    textMeasurement: { font: string; maxWidthPx: number } | null;
  };
  const displayText =
    textMeasurement == null
      ? text
      : truncateTextInMiddle(text, textMeasurement.font, textMeasurement.maxWidthPx);
  const isUntruncated = displayText === text;
  const jsx = getJsxRuntime();
  const content = jsx.jsx("span", {
    ref: setTextMeasurementRef,
    className: classNames("block min-w-0 overflow-hidden whitespace-nowrap", className),
    children: displayText,
  });
  return jsx.jsx(Tooltip, {
    tooltipContent: text,
    disabled: isUntruncated,
    children: content,
  });
}

function initializeMiddleTruncatedText(): void {
  initializeCompilerCache();
  initializeTextLayout();
  initializeReact();
  initializeTooltip();
  initializeTextMeasurement();
  getJsxRuntime();
  measurementContext = null;
}

export { initializeMiddleTruncatedText as n, MiddleTruncatedText as t };
