import "@rchunk/rolldown-runtime";
import { a as initializeAdaptiveSlider, i as getFractionDigits } from "@rchunk/adaptive-slider";

interface NumberFormatter {
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string;
  formatNumberToParts(value: number): Intl.NumberFormatPart[];
}
const DIRECTIONAL_MARKS = /[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;

function formatFiniteNumber(formatter: NumberFormatter, value: number, options: Intl.NumberFormatOptions = {}): string {
  return Number.isFinite(value) ? formatter.formatNumber(value, options) : "";
}
function formatNumberInput(formatter: NumberFormatter, value: number, step: number): string {
  const digits = Math.max(1, getFractionDigits(step));
  return formatFiniteNumber(formatter, value, { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: false });
}
function parseNumberInput(formatter: NumberFormatter, input: string): number {
  const digits = Array.from({ length: 10 }, (_, value) => formatter.formatNumber(value, { useGrouping: false }));
  const parts = formatter.formatNumberToParts(-12345.6);
  const decimal = parts.find((part) => part.type === "decimal")?.value;
  const group = parts.find((part) => part.type === "group")?.value;
  const minus = parts.find((part) => part.type === "minusSign")?.value;
  let normalized = input.trim().replace(DIRECTIONAL_MARKS, "");
  digits.forEach((digit, value) => { normalized = normalized.replaceAll(digit, String(value)); });
  if (group) normalized = normalized.replaceAll(group, "");
  if (decimal && decimal !== ".") normalized = normalized.replaceAll(decimal, ".");
  if (minus && minus !== "-") normalized = normalized.replaceAll(minus, "-");
  return Number.parseFloat(normalized);
}
function createNumberInputFormatter(formatter: NumberFormatter) {
  return {
    formatValueForInput: (value: number, step: number) => formatNumberInput(formatter, value, step),
    parseInputValue: (input: string) => parseNumberInput(formatter, input),
  };
}
function initializeFormatNumberInput(): void { initializeAdaptiveSlider(); }

export { parseNumberInput as a, initializeFormatNumberInput as i, formatNumberInput as n, createNumberInputFormatter as r, formatFiniteNumber as t };
