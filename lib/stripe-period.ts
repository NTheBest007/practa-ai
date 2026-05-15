/**
 * Stripe subscription period fields are Unix seconds.
 * Expanded checkout.subscription objects may omit them → avoid Invalid Date.
 */
export function stripeUnixSecondsToIso(
  value: number | undefined | null
): string | null {
  if (value == null || typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }
  const ms = value > 1_000_000_000_000 ? value : value * 1000;
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
