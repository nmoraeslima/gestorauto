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
 * Send message via WhatsApp Business/Desktop (priority) or Web (fallback)
 * Opens WhatsApp with pre-filled message
 * Priority: WhatsApp Business Desktop > WhatsApp Desktop > WhatsApp Web
 */
export function sendWhatsAppMessage(phone: string, message: string): void {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    const encodedMessage = encodeURIComponent(message);

    // Use api.whatsapp.com to ensure better compatibility with desktop apps and emojis
    const url = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;

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
