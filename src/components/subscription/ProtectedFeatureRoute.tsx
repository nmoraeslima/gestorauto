import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PLAN_LIMITS, PlanFeatures } from '@/types/database';
import { UpgradePrompt } from './UpgradePrompt';

interface ProtectedFeatureRouteProps {
    feature: keyof PlanFeatures;
    children: React.ReactNode;
}

export const ProtectedFeatureRoute: React.FC<ProtectedFeatureRouteProps> = ({ feature, children }) => {
    const { user, loading } = useAuth();

    if (loading) return <div className="p-8 text-center">Carregando permissões...</div>;

    if (!user?.company?.subscription_plan) {
        return <Navigate to="/dashboard" replace />;
    }

    const plan = user.company.subscription_plan;
    const isAllowed = PLAN_LIMITS[plan]?.features[feature];

    if (!isAllowed) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <UpgradePrompt
                    title="Acesso Restrito"
                    description="Esta página é exclusiva de planos superiores."
                    feature={feature}
                />
            </div>
        );
    }

    return <>{children}</>;
};
