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

    // Try WhatsApp Desktop/Business first (whatsapp:// protocol)
    const desktopUrl = `whatsapp://send?phone=${formattedPhone}&text=${encodedMessage}`;

    // Fallback to WhatsApp Web
    const webUrl = `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;

    // Try to open desktop app first
    const desktopWindow = window.open(desktopUrl, '_blank');

    // If desktop app doesn't open (returns null or closes immediately), 
    // fallback to WhatsApp Web after a short delay
    setTimeout(() => {
        if (!desktopWindow || desktopWindow.closed) {
            window.open(webUrl, '_blank', 'noopener,noreferrer');
        }
    }, 500);
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
