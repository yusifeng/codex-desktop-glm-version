import "@rchunk/rolldown-runtime";

interface NumberFormatter { formatNumber(value: number, options?: Intl.NumberFormatOptions): string }

function coordinateSeparator(formatter: NumberFormatter): string {
  return formatter.formatNumber(1.1, { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false }).includes(".")
    ? ", "
    : "; ";
}

function formatCoordinatePair(formatter: NumberFormatter, first: string, second: string): string {
  return `(${first}${coordinateSeparator(formatter)}${second})`;
}

function initializeFormatCoordinatePair(): void {}

export { initializeFormatCoordinatePair as n, formatCoordinatePair as t };
