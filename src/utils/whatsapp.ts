/**
 * WhatsApp Helper - Click-to-Send Integration
 * Zero API, zero cost, zero ban risk
 * Uses WhatsApp Web/Desktop protocol
 */

/**
 * Format phone number for WhatsApp
 */
export function formatPhoneForWhatsApp(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');

    // Add country code if not present (Brazil = 55)
    const withCountry = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;

    return withCountry;
}

/**
 * Send message via WhatsApp Web/Desktop
 * Opens WhatsApp with pre-filled message
 */
export function sendWhatsAppMessage(phone: string, message: string): void {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    const encodedMessage = encodeURIComponent(message);

    // WhatsApp Web URL
    const url = `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;

    // Open in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Copy message to clipboard
 * Fallback option
 */
export async function copyMessageToClipboard(message: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(message);
        return true;
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
    }
}

/**
 * Check if WhatsApp Web is available
 */
export function isWhatsAppWebAvailable(): boolean {
    return typeof window !== 'undefined' && 'open' in window;
}
