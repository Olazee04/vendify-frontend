export const RATES: Record<string, number> = {
  NGN: 1, USD: 0.00065, GBP: 0.00051, EUR: 0.0006, GHS: 0.0079,
};
export const SYMBOLS: Record<string, string> = {
  NGN: '₦', USD: '$', GBP: '£', EUR: '€', GHS: '₵',
};

export function formatMoney(ngn: number, currency = 'NGN') {
  const v = ngn * (RATES[currency] ?? 1);
  const sym = SYMBOLS[currency] ?? '₦';
  const text = v.toLocaleString(undefined, {
    minimumFractionDigits: currency === 'NGN' ? 0 : 2,
    maximumFractionDigits: currency === 'NGN' ? 0 : 2,
  });
  return `${currency === 'NGN' ? '' : '≈ '}${sym}${text}`;
}

export function formatCompact(ngn: number, currency = 'NGN') {
  const v = ngn * (RATES[currency] ?? 1);
  const sym = SYMBOLS[currency] ?? '₦';
  return `${sym}${v.toLocaleString(undefined, {
    notation: 'compact', maximumFractionDigits: 1,
  })}`;
}