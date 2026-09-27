import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
interface IntlLike { formatNumber(value: number, options: Intl.NumberFormatOptions): string }
const currencyDigits: Record<string, number> = { BHD: 3, CLP: 0, JPY: 0, KRW: 0, KWD: 3, USD: 2 };
function formatAmount(intl: IntlLike, amount: number, currencyCode: string): string { const currency = currencyCode.toUpperCase(); return intl.formatNumber(amount / 10 ** (currencyDigits[currency] ?? 2), { style: "currency", currency }); }
function initialize(): void {}
export { initialize as n, formatAmount as t };
