export const FALLBACK_USD_INR_RATE = 94.03;
export const FALLBACK_RATE_DATE = '2026-11-14';

export function usdToInr(amount, rate = FALLBACK_USD_INR_RATE) {
  return (Number(amount) || 0) * (Number(rate) || FALLBACK_USD_INR_RATE);
}

export function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}
