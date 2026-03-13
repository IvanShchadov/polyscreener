/**
 * Build a Polymarket event URL, optionally appending a builder code ref param.
 */
export function buildPolymarketUrl(eventSlug: string, builderCode?: string): string {
  if (!eventSlug) return 'https://polymarket.com';
  const url = `https://polymarket.com/event/${eventSlug}`;
  return builderCode ? `${url}?ref=${encodeURIComponent(builderCode)}` : url;
}

export function buildPolymarketHomeUrl(builderCode?: string): string {
  return builderCode
    ? `https://polymarket.com?ref=${encodeURIComponent(builderCode)}`
    : 'https://polymarket.com';
}
