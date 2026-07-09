/** Prefilled share-intent URL builders for external platforms. */

const X_INTENT_URL = 'https://twitter.com/intent/tweet';
const WHATSAPP_URL = 'https://wa.me/';

export function buildXIntentUrl(text: string): string {
  return `${X_INTENT_URL}?text=${encodeURIComponent(text)}`;
}

export function buildWhatsAppUrl(text: string): string {
  return `${WHATSAPP_URL}?text=${encodeURIComponent(text)}`;
}

/** Open a share intent without giving the target tab a window handle back. */
export function openShareUrl(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}
