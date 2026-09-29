// USD currency formatter. Release chunk: usd-5d2c7710cf01.js.
import "@rchunk/rolldown-runtime";
interface NumberFormatter {
  formatNumber(value: number, options: Intl.NumberFormatOptions): string;
}
function formatUsd(
  value: number,
  formatter: NumberFormatter,
  compact = false,
): string {
  const magnitude = Math.abs(value);
  return formatter.formatNumber(value, {
    style: "currency",
    currency: "USD",
    notation: compact ? "compact" : "standard",
    minimumFractionDigits: compact && magnitude >= 1_000 ? 0 : 2,
    maximumFractionDigits: 2,
    maximumSignificantDigits: magnitude > 0 && magnitude < 0.01 ? 3 : undefined,
  });
}
function initializeUsdFormatter(): void {}
export { initializeUsdFormatter as n, formatUsd as t };
