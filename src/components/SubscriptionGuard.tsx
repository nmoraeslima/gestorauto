import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SubscriptionStatus } from '@/types/database';
import { Loader2 } from 'lucide-react';

interface SubscriptionGuardProps {
    children: React.ReactNode;
}

export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();
    const [checking, setChecking] = useState(true);
    const [isBlocked, setIsBlocked] = useState(false);

    useEffect(() => {
        const checkSubscription = () => {
            if (!user || !user.company) {
                setChecking(false);
                return;
            }

            const { subscription_status, trial_ends_at, subscription_ends_at } = user.company;

            // Verificar se a assinatura está expirada ou cancelada
            if (
                subscription_status === SubscriptionStatus.EXPIRED ||
                subscription_status === SubscriptionStatus.CANCELLED
            ) {
                setIsBlocked(true);
                setChecking(false);
                return;
            }

            // Verificar se o trial expirou
            if (subscription_status === SubscriptionStatus.TRIAL && trial_ends_at) {
                const trialEnd = new Date(trial_ends_at);
                if (trialEnd < new Date()) {
                    setIsBlocked(true);
                    setChecking(false);
                    return;
                }
            }

            // Verificar se a assinatura ativa expirou
            if (subscription_status === SubscriptionStatus.ACTIVE && subscription_ends_at) {
                const subscriptionEnd = new Date(subscription_ends_at);
                if (subscriptionEnd < new Date()) {
                    setIsBlocked(true);
                    setChecking(false);
                    return;
                }
            }

            setIsBlocked(false);
            setChecking(false);
        };

        if (!loading) {
            checkSubscription();

            // Re-verificar a cada 60 segundos
            const interval = setInterval(checkSubscription, 60000);
            return () => clearInterval(interval);
        }
    }, [user, loading]);

    // Mostrar loading enquanto verifica
    if (loading || checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-secondary-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
                    <p className="text-secondary-600">Verificando assinatura...</p>
                </div>
            </div>
        );
    }

    // Redirecionar para página de planos se bloqueado
    if (isBlocked && location.pathname !== '/subscription/plans') {
        const reason = user?.company?.subscription_status === 'trial' ? 'trial_ended' : 'expired';
        return <Navigate to={`/subscription/plans?reason=${reason}`} replace />;
    }

    // Permitir acesso
    return <>{children}</>;
};
