import { supabase } from '@/lib/supabase';
import type { PortalCodeResponse, PortalData, PortalSession } from '@/types/portal';

const SESSION_KEY = 'portal_session';
const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 horas

class PortalService {
    /**
     * Gera código de acesso para o cliente
     */
    async generateCode(customerId: string): Promise<PortalCodeResponse> {
        const { data, error } = await supabase.rpc('generate_portal_code', {
            p_customer_id: customerId
        });

        if (error) {
            console.error('Error generating portal code:', error);
            throw new Error(error.message);
        }

        return data as PortalCodeResponse;
    }

    /**
     * Valida código de acesso
     */
    async validateCode(customerId: string, code: string): Promise<boolean> {
        try {
            const { data, error } = await supabase.rpc('validate_portal_code', {
                p_customer_id: customerId,
                p_code: code
            });

            if (error) {
                console.error('Error validating code:', error);
                return false;
            }

            if (data?.success) {
                // Criar sessão
                this.createSession(customerId);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error in validateCode:', error);
            return false;
        }
    }

    /**
     * Cria sessão local
     */
    createSession(customerId: string): void {
        const session: PortalSession = {
            customer_id: customerId,
            expires_at: Date.now() + SESSION_DURATION,
            created_at: Date.now()
        };

        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }

    /**
     * Obtém sessão atual
     */
    getSession(): PortalSession | null {
        const sessionStr = localStorage.getItem(SESSION_KEY);
        if (!sessionStr) return null;

        try {
            const session: PortalSession = JSON.parse(sessionStr);

            // Verificar se expirou
            if (Date.now() > session.expires_at) {
                this.clearSession();
                return null;
            }

            return session;
        } catch {
            this.clearSession();
            return null;
        }
    }

    /**
     * Valida se sessão está ativa
     */
    isSessionValid(): boolean {
        const session = this.getSession();
        return session !== null;
    }

    /**
     * Limpa sessão
     */
    clearSession(): void {
        localStorage.removeItem(SESSION_KEY);
    }

    /**
     * Busca dados do portal do cliente
     */
    async getPortalData(customerId: string): Promise<PortalData> {
        console.log('🔍 Calling get_customer_portal_data with:', customerId);

        const { data, error } = await supabase.rpc('get_customer_portal_data', {
            p_customer_id: customerId
        });

        console.log('📦 RPC Response:', { data, error });

        if (error) {
            console.error('❌ Error fetching portal data:', error);
            throw new Error(error.message || 'Erro ao carregar dados do portal');
        }

        if (!data) {
            console.error('❌ RPC returned null/undefined');
            throw new Error('Nenhum dado retornado. Verifique se o cliente existe e tem ordens de serviço.');
        }

        console.log('✅ Portal data loaded successfully:', data);
        return data as PortalData;
    }

    /**
     * Gera URL pública do storage
     */
    getPhotoUrl(filePath: string): string {
        const { data } = supabase.storage
            .from('work-order-photos')
            .getPublicUrl(filePath);

        return data.publicUrl;
    }

    /**
     * Gera link do WhatsApp com mensagem pronta
     */
    getWhatsAppLink(companyPhone: string, code: string, customerName: string): string {
        const message = `Olá! Sou ${customerName} e estou acessando o Portal do Cliente.\n\nMeu código de acesso é: ${code}`;
        const phone = companyPhone.replace(/\D/g, '');
        return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    }

    /**
     * Descriptografa customer_id do link
     */
    decryptCustomerId(encrypted: string): string {
        // Por enquanto, apenas decodifica base64
        // TODO: Implementar criptografia real
        try {
            return atob(encrypted);
        } catch {
            throw new Error('Link inválido');
        }
    }

    /**
     * Criptografa customer_id para link
     */
    encryptCustomerId(customerId: string): string {
        // Por enquanto, apenas codifica base64
        // TODO: Implementar criptografia real
        return btoa(customerId);
    }
}

export const portalService = new PortalService();
