import { NextApiRequest, NextApiResponse } from 'next';
import { AntiBanWhatsAppClient } from '@/services/whatsapp/anti-ban-client';

// Singleton instance
let whatsappClient: AntiBanWhatsAppClient | null = null;

function getWhatsAppClient(): AntiBanWhatsAppClient {
    if (!whatsappClient) {
        whatsappClient = new AntiBanWhatsAppClient({
            baseUrl: process.env.EVOLUTION_API_URL || '',
            apiKey: process.env.EVOLUTION_API_KEY || '',
            instanceName: process.env.EVOLUTION_INSTANCE_NAME || 'gestorauto-main',
        });
    }
    return whatsappClient;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const client = getWhatsAppClient();
        const stats = client.getStats();

        res.status(200).json(stats);
    } catch (error: any) {
        console.error('Error getting WhatsApp stats:', error);
        res.status(500).json({ error: error.message });
    }
}
