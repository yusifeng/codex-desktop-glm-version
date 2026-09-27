import "@rchunk/rolldown-runtime";
interface NumberFormatter { formatNumber(value: number, options: Intl.NumberFormatOptions): string }
function t(bytes: number, intl: NumberFormatter): string { if (!Number.isFinite(bytes) || bytes <= 0) return intl.formatNumber(0, { style: "unit", unit: "byte", unitDisplay: "long" }); if (bytes < 1024) return intl.formatNumber(bytes, { style: "unit", unit: "byte", unitDisplay: "long" }); const units: Intl.NumberFormatOptions["unit"][] = ["kilobyte", "megabyte", "gigabyte", "terabyte"]; let value = bytes / 1024, index = 0; while (value >= 1024 && index < units.length - 1) { value /= 1024; index++; } return intl.formatNumber(value, { maximumFractionDigits: 1, style: "unit", unit: units[index], unitDisplay: "short" }); }
function n(): void {}
export { n, t };
