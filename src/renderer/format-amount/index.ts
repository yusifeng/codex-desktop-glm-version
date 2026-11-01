import "@rchunk/rolldown-runtime";
import * as appInitialChunk from "@rchunk/app-initial";
interface IntlLike { formatNumber(value: number, options: Intl.NumberFormatOptions): string }
const { EI: currencyMinorUnitExponent } = appInitialChunk as unknown as {
  EI(input: { intl: IntlLike; currencyCode: string }): number;
};
function formatAmount(intl: IntlLike, amount: number, currencyCode: string): string {
  const currency = currencyCode.toUpperCase();
  const exponent = currencyMinorUnitExponent({ intl, currencyCode: currency });
  return intl.formatNumber(amount / 10 ** exponent, { style: "currency", currency });
}
function initialize(): void {}
export { initialize as n, formatAmount as t };
