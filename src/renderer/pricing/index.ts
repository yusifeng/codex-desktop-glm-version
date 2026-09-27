import "@rchunk/rolldown-runtime";

interface IntlNumberShape {
  formatNumber(value: number, options: Intl.NumberFormatOptions): string;
  formatNumberToParts(
    value: number,
    options: Intl.NumberFormatOptions,
  ): Intl.NumberFormatPart[];
}

export interface FormatPriceInput {
  amount?: number | null;
  currencyCode: string;
  intl: IntlNumberShape;
  minorUnitExponent?: number;
}

export interface FormattedPrice {
  currencyCodeLabel: string | null;
  formatted: string;
  parts: Intl.NumberFormatPart[];
}

function currencyOptions(
  currencyCode: string,
  minorUnitExponent?: number,
  currencyDisplay: Intl.NumberFormatOptions["currencyDisplay"] = "narrowSymbol",
): Intl.NumberFormatOptions {
  return {
    style: "currency",
    currency: currencyCode,
    currencyDisplay,
    trailingZeroDisplay: "stripIfInteger",
    minimumFractionDigits: minorUnitExponent ?? undefined,
    maximumFractionDigits: minorUnitExponent ?? undefined,
  };
}

function formatPrice({
  intl,
  amount,
  currencyCode,
  minorUnitExponent,
}: FormatPriceInput): string | null {
  return amount == null
    ? null
    : intl.formatNumber(amount, currencyOptions(currencyCode, minorUnitExponent));
}

function formatPriceParts({
  intl,
  amount,
  currencyCode,
  minorUnitExponent,
}: FormatPriceInput): FormattedPrice | null {
  if (amount == null) return null;

  let currencyCodeLabel: string | null = currencyCode;
  let parts = intl.formatNumberToParts(
    amount,
    currencyOptions(currencyCode, minorUnitExponent, "symbol"),
  );

  const symbolIsCurrencyCode = parts.some(
    (part) => part.type === "currency" && part.value === currencyCode,
  );
  if (symbolIsCurrencyCode) {
    const narrowSymbolParts = intl.formatNumberToParts(
      amount,
      currencyOptions(currencyCode, minorUnitExponent),
    );
    const hasNarrowSymbol = narrowSymbolParts.some(
      (part) => part.type === "currency" && part.value !== currencyCode,
    );
    if (hasNarrowSymbol) parts = narrowSymbolParts;
    else currencyCodeLabel = null;
  }

  return {
    currencyCodeLabel,
    formatted: parts.map((part) => part.value).join(""),
    parts,
  };
}

function initializePricing(): void {}

export { formatPriceParts as n, initializePricing as r, formatPrice as t };
