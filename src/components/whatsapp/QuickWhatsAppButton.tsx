import React, { useState } from 'react';
import { MessageCircle, Lock } from 'lucide-react';
import { sendWhatsAppMessage } from '@/utils/whatsapp';
import { generateConfirmationMessage, generateCancellationMessage, generateReminderMessage } from '@/utils/whatsapp-messages';
import { Appointment, Customer, Vehicle, Company } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { PLAN_LIMITS, SubscriptionPlan } from '@/types/database';

interface QuickWhatsAppButtonProps {
    appointment: Appointment & {
        customer: Customer;
        vehicle?: Vehicle;
        company?: Company;
    };
    type: 'confirmation' | 'reminder' | 'custom';
    customMessage?: string;
    size?: 'sm' | 'md';
    className?: string;
}

export default function QuickWhatsAppButton({
    appointment,
    type,
    customMessage,
    size = 'sm',
    className = '',
}: QuickWhatsAppButtonProps) {
    const { user } = useAuth();
    const [sending, setSending] = useState(false);

    const getMessage = () => {
        if (type === 'custom' && customMessage) {
            return customMessage;
        }

        const data = {
            customer: appointment.customer,
            appointment,
            vehicle: appointment.vehicle,
            company: appointment.company,
        };

        switch (type) {
            case 'confirmation':
                return generateConfirmationMessage(data);
            case 'reminder':
                return generateReminderMessage(data);
            default:
                return '';
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row click if in table

        // Feature Gate Check
        const plan = user?.company?.subscription_plan || 'basic';
        const canUseWhatsApp = PLAN_LIMITS[plan as SubscriptionPlan]?.features?.whatsapp_integration;

        if (!canUseWhatsApp) {
            window.dispatchEvent(new Event('openUpgradeModal'));
            return;
        }

        setSending(true);
        const message = getMessage();
        sendWhatsAppMessage(appointment.customer.phone, message);

        // Reset after animation
        setTimeout(() => setSending(false), 1000);
    };

    const sizeClasses = {
        sm: 'p-1.5',
        md: 'p-2',
    };

    const iconSizes = {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
    };

    // Check restriction for UI
    const plan = user?.company?.subscription_plan || 'basic';
    const canUseWhatsApp = PLAN_LIMITS[plan as SubscriptionPlan]?.features?.whatsapp_integration;

    return (
        <button
            onClick={handleClick}
            disabled={sending}
            className={`
        inline-flex items-center justify-center
        rounded-lg
        ${canUseWhatsApp ? 'text-green-600 hover:bg-green-50' : 'text-neutral-400 hover:bg-neutral-100'}
        transition-all duration-200
        disabled:opacity-50
        ${sizeClasses[size]}
        ${sending ? 'scale-95' : 'hover:scale-105'}
        ${className}
      `}
            title={!canUseWhatsApp ? 'Disponível no plano Profissional' : `Enviar ${type === 'confirmation' ? 'confirmação' : type === 'reminder' ? 'lembrete' : 'mensagem'} via WhatsApp`}
        >
            {canUseWhatsApp ? (
                <MessageCircle className={`${iconSizes[size]} ${sending ? 'animate-pulse' : ''}`} />
            ) : (
                <div className="relative">
                    <MessageCircle className={`${iconSizes[size]} opacity-50`} />
                    <Lock className="absolute -top-1 -right-1 w-2.5 h-2.5 text-amber-500 bg-white rounded-full p-0.5" />
                </div>
            )}
        </button>
    );
}
