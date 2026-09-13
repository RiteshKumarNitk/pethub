/** Centralized shop contact info + WhatsApp deep-link builder. */
export const whatsappNumber = "919876543210";

export function whatsappLink(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
